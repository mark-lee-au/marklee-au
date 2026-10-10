import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseCheckOutput, repairText } from './fix-staged-whitespace.mjs';

const fixer = fileURLToPath(new URL('./fix-staged-whitespace.mjs', import.meta.url));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

function withRepo(callback) {
  const repo = mkdtempSync(join(tmpdir(), 'marklee-whitespace-'));
  try {
    assert.equal(run('git', ['init', '-q'], repo).status, 0);
    assert.equal(run('git', ['config', 'user.name', 'Test'], repo).status, 0);
    assert.equal(run('git', ['config', 'user.email', 'test@example.com'], repo).status, 0);
    assert.equal(run('git', ['config', 'core.autocrlf', 'false'], repo).status, 0);
    writeFileSync(join(repo, 'existing.md'), 'old line\n');
    assert.equal(run('git', ['add', '-A'], repo).status, 0);
    assert.equal(run('git', ['commit', '-q', '-m', 'base'], repo).status, 0);
    callback(repo);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

test('repairs only Git-reported trailing whitespace and EOF blanks, retaining CRLF', () => {
  withRepo((repo) => {
    writeFileSync(join(repo, 'existing.md'), 'old line\nnew line  \nkeep line\n');
    mkdirSync(join(repo, 'new'));
    writeFileSync(join(repo, 'new', 'README.md'), 'first\r\nsecond\r\n\r\n');
    assert.equal(run('git', ['add', '-A'], repo).status, 0);
    assert.notEqual(run('git', ['-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check'], repo).status, 0);
    const fixed = run(process.execPath, [fixer], repo);
    assert.equal(fixed.status, 0, fixed.stderr);
    assert.match(fixed.stdout, /correcting 2 file\(s\)/);
    assert.equal(readFileSync(join(repo, 'existing.md'), 'utf8'), 'old line\nnew line\nkeep line\n');
    assert.equal(readFileSync(join(repo, 'new', 'README.md'), 'utf8'), 'first\r\nsecond\r\n');
    assert.equal(run('git', ['-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check'], repo).status, 0);
    assert.equal(run('git', ['diff', '--quiet'], repo).status, 0);
    assert.equal(run(process.execPath, [fixer], repo).status, 0); // idempotent
  });
});

test('preserves a UTF-8 BOM when repairing a staged file', () => {
  withRepo((repo) => {
    writeFileSync(join(repo, 'existing.md'), '\ufeffold line\nnew line  \n');
    assert.equal(run('git', ['add', '-A'], repo).status, 0);
    const result = run(process.execPath, [fixer], repo);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readFileSync(join(repo, 'existing.md')).subarray(0, 3), Buffer.from([0xef, 0xbb, 0xbf]));
    assert.equal(readFileSync(join(repo, 'existing.md'), 'utf8'), '\ufeffold line\nnew line\n');
  });
});

test('does not rewrite earlier lines that Git did not flag', () => {
  const source = 'old  \nnew line \nlast\n';
  const corrected = repairText(source, { trailingLines: new Set([2]), trimBlankEof: false });
  assert.equal(corrected, 'old  \nnew line\nlast\n');
});

test('preserves UTF-8 BOM and refuses unsupported or ambiguous diagnostics', () => {
  const errors = { trailingLines: new Set([2]), trimBlankEof: true };
  assert.equal(repairText('\ufeffstart\nline  \n\n', errors), '\ufeffstart\nline\n');
  const parsed = parseCheckOutput('example.py:1: space before tab in indent.\n+ \tcode\n', new Set(['example.py']));
  assert.equal(parsed.errors.size, 0);
  assert.deepEqual(parsed.unknown, ['example.py:1: space before tab in indent.']);
  assert.throws(() => repairText('something\rnext', errors), /bare-CR/);
});

test('rejects unsupported indentation errors without touching other staged files', () => {
  withRepo((repo) => {
    writeFileSync(join(repo, 'existing.md'), 'changed \n');
    writeFileSync(join(repo, 'code.py'), ' \tprint(1)\n');
    assert.equal(run('git', ['add', '-A'], repo).status, 0);
    const before = readFileSync(join(repo, 'existing.md'), 'utf8');
    const result = run(process.execPath, [fixer], repo);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot safely handle/);
    assert.equal(readFileSync(join(repo, 'existing.md'), 'utf8'), before);
    assert.notEqual(run('git', ['-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check'], repo).status, 0);
  });
});
