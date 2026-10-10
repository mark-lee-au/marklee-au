/**
 * Repair only whitespace errors Git reports in the staged diff.
 * Publishing stages the entire working tree first, so index line numbers match
 * the working files. Other errors are left for manual review.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const supportedMessages = new Set(['trailing whitespace', 'new blank line at EOF']);

function git(args) {
  const result = spawnSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status === null) {
    throw new Error(`Could not run Git: ${result.error?.message ?? result.stderr}`);
  }
  return result;
}

export function parseCheckOutput(output, stagedPaths) {
  const errors = new Map();
  const unknown = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line || line.startsWith('+')) continue; // Git prints the offending added line after some diagnostics.
    const match = /^(.*):(\d+): (.+)\.$/.exec(line);
    if (!match || !stagedPaths.has(match[1]) || !supportedMessages.has(match[3])) {
      unknown.push(line);
      continue;
    }
    const [, path, number, message] = match;
    const entry = errors.get(path) ?? { trailingLines: new Set(), trimBlankEof: false };
    if (message === 'trailing whitespace') entry.trailingLines.add(Number(number));
    if (message === 'new blank line at EOF') entry.trimBlankEof = true;
    errors.set(path, entry);
  }
  return { errors, unknown };
}

export function repairText(text, errors) {
  // Split only on LF: joining the parts back retains every original CRLF/LF.
  // Bare CR line endings are rejected rather than silently rewritten.
  if (/\r(?!\n)/.test(text)) throw new Error('Unsupported bare-CR line endings.');
  const lines = text.split('\n');
  for (const lineNumber of errors.trailingLines) {
    if (!Number.isSafeInteger(lineNumber) || lineNumber < 1 || lineNumber > lines.length) {
      throw new Error(`Git reported an invalid line number: ${lineNumber}`);
    }
    lines[lineNumber - 1] = lines[lineNumber - 1].replace(/[ \t]+(\r?)$/, '$1');
  }
  if (errors.trimBlankEof) {
    // Preserve the file's final newline but remove trailing blank lines.
    // Do not change an earlier line or convert its newline style.
    while (lines.length > 2 && lines.at(-1) === '' && /^[ \t]*\r?$/.test(lines.at(-2))) {
      lines.splice(-2, 1);
    }
    if (lines.length < 2 || lines.at(-1) !== '') {
      throw new Error('Git reported a blank EOF but the file does not end with a newline.');
    }
  }
  return lines.join('\n');
}

function repairStagedChanges() {
  const stage = git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']);
  if (stage.status !== 0) throw new Error(stage.stderr || 'Could not list staged files.');
  const stagedPaths = new Set(stage.stdout.split('\0').filter(Boolean));

  const check = git(['-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check', '--no-ext-diff', '--no-color']);
  if (check.status === 0) {
    console.log('Git whitespace check passed. No corrections needed.');
    return;
  }
  const { errors, unknown } = parseCheckOutput(check.stdout, stagedPaths);
  if (unknown.length || !errors.size) {
    throw new Error(`Automatic repair cannot safely handle these Git diagnostics:\n${unknown.length ? unknown.join('\n') : check.stderr || check.stdout}`);
  }

  const root = process.cwd();
  const changes = [];
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  for (const [path, error] of errors) {
    const target = resolve(root, path);
    const relativePath = relative(root, target);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
      throw new Error(`Staged path is outside the repository: ${path}`);
    }
    if (!lstatSync(target).isFile()) throw new Error(`Not a regular file: ${path}`);
    const original = readFileSync(target);
    if (original.includes(0)) throw new Error(`Cannot safely modify binary file: ${path}`);
    const text = decoder.decode(original);
    const repaired = repairText(text, error);
    if (repaired === text) throw new Error(`Git reports whitespace errors that do not match the working copy: ${path}`);
    changes.push({ path, target, repaired });
  }

  for (const change of changes) {
    writeFileSync(change.target, change.repaired, 'utf8');
    const add = git(['add', '--', change.path]);
    if (add.status !== 0) throw new Error(`Could not restage ${change.path}: ${add.stderr}`);
    console.log(`Fixed staged whitespace: ${change.path}`);
  }
  const finalCheck = git(['-c', 'core.whitespace=cr-at-eol', 'diff', '--cached', '--check', '--no-ext-diff', '--no-color']);
  if (finalCheck.status !== 0) throw new Error(`Whitespace errors remain after repair:\n${finalCheck.stdout || finalCheck.stderr}`);
  console.log(`Whitespace check passed after correcting ${changes.length} file(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    repairStagedChanges();
  } catch (error) {
    console.error(`Automatic whitespace repair stopped: ${error.message}`);
    process.exitCode = 1;
  }
}
