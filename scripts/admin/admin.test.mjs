import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, cp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, CONFIG } from './store.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
test('local admin authentication, permissions, editorial settings and recovery', async (t) => {
  const temp = await mkdtemp(join(tmpdir(), 'mladmin-test-'));
  const port = 44000 + Math.floor(Math.random() * 10000);
  const configFile = join(temp, 'site-admin.json');
  const env = { ...process.env, ADMIN_PORT: String(port), ADMIN_STATE_DIR: join(temp, 'state'), ADMIN_SITE_CONFIG: configFile };
  await cp(CONFIG, configFile);
  t.after(async () => rm(temp, { recursive: true, force: true }));
  const reset = spawnSync(process.execPath, [join(ROOT, 'scripts/admin/reset-admin.mjs')], { env, encoding: 'utf8' });
  assert.equal(reset.status, 0, reset.stderr);
  const password = reset.stdout.match(/Temporary password \(shown once\): (\S+)/)?.[1];
  assert.ok(password && password.length >= 30);
  const server = spawn(process.execPath, [join(ROOT, 'scripts/admin/server.mjs')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  server.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  t.after(() => server.kill());
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) break;
    try { const response = await fetch(`${base}/mladmin`); if (response.ok) { ready = true; break; } }
    catch { /* Waiting for loopback listener. */ }
    await sleep(80);
  }
  assert.ok(ready, `Admin did not start: ${stderr}`);
  assert.match(await (await fetch(`${base}/mladmin`)).text(), /Private access/);
  assert.equal((await fetch(`${base}/mladmin/../../package.json`)).status, 404);
  const request = async (endpoint, method = 'GET', data, auth) => {
    const response = await fetch(`${base}/mladmin/api/${endpoint}`, {
      method,
      headers: {
        ...(method === 'GET' ? {} : { Origin: base, 'Content-Type': 'application/json', 'X-CSRF-Token': auth?.csrf ?? '' }),
        ...(auth ? { Cookie: auth.cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  assert.equal((await request('site')).status, 403);
  assert.equal((await fetch(`${base}/mladmin/api/login`, { method: 'POST', headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await request('login', 'POST', { username: 'mark', password: 'wrong' })).status, 401);
  const signedIn = await request('login', 'POST', { username: 'mark', password });
  assert.equal(signedIn.status, 200);
  const admin = { csrf: signedIn.body.csrf, cookie: signedIn.cookie };
  assert.equal(signedIn.body.user.root, true);
  assert.equal((await request('site', 'POST', {}, { ...admin, csrf: 'bad' })).status, 403);
  const site = (await request('site', 'GET', undefined, admin)).body;
  assert.equal(site.sources.length, 6);
  assert.deepEqual(site.config.sectionOrder, ['home', 'data', 'maps', 'games', 'lab', 'photography', 'about']);
  const config = site.config;
  config.sectionOrder = ['home', 'games', 'lab', 'data', 'maps', 'photography', 'about'];
  config.projects['pulse-of-adelaide'] = { category: 'maps', status: 'published', sortOrder: 2, badge: 'updated' };
  config.examples.maps = ['pulse-of-adelaide'];
  config.examples.lab = ['pulse-of-adelaide', 'adelaide-in-motion'];
  const saved = await request('site', 'POST', { revision: site.revision, config }, admin);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.deepEqual(saved.body.config.examples.lab, ['adelaide-in-motion']);
  assert.deepEqual(saved.body.config.examples.maps, ['pulse-of-adelaide']);
  assert.equal((await request('site', 'POST', { revision: site.revision, config }, admin)).status, 409);
  const badConfig = structuredClone(saved.body.config); badConfig.projects['pulse-of-adelaide'].sortOrder = -1;
  assert.equal((await request('site', 'POST', { revision: saved.body.revision, config: badConfig }, admin)).status, 400);
  assert.deepEqual(JSON.parse(await readFile(configFile, 'utf8')).examples.maps, ['pulse-of-adelaide']);
  const created = await request('users', 'POST', { username: 'editor', permissions: ['home'] }, admin);
  assert.equal(created.status, 201);
  const editorLogin = await request('login', 'POST', { username: 'editor', password: created.body.temporaryPassword });
  assert.equal(editorLogin.status, 200);
  const editor = { csrf: editorLogin.body.csrf, cookie: editorLogin.cookie };
  assert.equal((await request('users', 'GET', undefined, editor)).status, 403);
  const editorSite = (await request('site', 'GET', undefined, editor)).body;
  const forbidden = structuredClone(editorSite.config); forbidden.projects.ascend = { visible: false };
  assert.equal((await request('site', 'POST', { revision: editorSite.revision, config: forbidden }, editor)).status, 403);
  const allowed = structuredClone(editorSite.config); allowed.examples.home = ['ascend'];
  assert.equal((await request('site', 'POST', { revision: editorSite.revision, config: allowed }, editor)).status, 200);
  assert.equal((await request('users/mark', 'DELETE', undefined, admin)).status, 403);
  const editorReset = await request('users/editor/reset', 'POST', undefined, admin);
  assert.equal(editorReset.status, 200);
  assert.equal((await request('site', 'GET', undefined, editor)).status, 403);
  const editorRelogin = await request('login', 'POST', { username: 'editor', password: editorReset.body.temporaryPassword });
  assert.equal(editorRelogin.status, 200);
  assert.equal((await request('users/editor', 'DELETE', undefined, admin)).status, 200);
  assert.equal((await request('site', 'GET', undefined, { cookie: editorRelogin.cookie })).status, 403);
  const renewedRoot = spawnSync(process.execPath, [join(ROOT, 'scripts/admin/reset-admin.mjs')], { env, encoding: 'utf8' });
  assert.equal(renewedRoot.status, 0, renewedRoot.stderr);
  assert.equal((await request('site', 'GET', undefined, admin)).status, 403);
  for (let i = 0; i < 5; i++) assert.equal((await request('login', 'POST', { username: 'mark', password: 'wrong-again' })).status, 401);
  assert.equal((await request('login', 'POST', { username: 'mark', password: 'wrong-again' })).status, 429);
  console.log('PASS: loopback server, first-use login, CSRF, project moves, saved previews, stale edit rejection, role isolation, password reset, deletion, main-admin recovery');
});
