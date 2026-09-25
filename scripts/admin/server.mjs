import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ROOT, CONFIG, PERMISSIONS, readUsers, writeUsers, hashPassword, verifyPassword,
  randomPassword, sourceProjects, validateSiteConfig, currentSite, atomicJSON,
} from './store.mjs';

const PORT = Number(process.env.ADMIN_PORT ?? 4322);
if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) throw Error('Invalid ADMIN_PORT');
const BASE = `http://127.0.0.1:${PORT}`;
const sessions = new Map();
const failures = new Map();
const sessionDuration = 8 * 60 * 60 * 1000;
const loginWindow = 15 * 60 * 1000;
const cookieName = 'mladmin_session';
const headers = {
  'Cache-Control': 'no-store, private',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
};
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function json(res, status, data, extra = {}) {
  res.writeHead(status, { ...headers, 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(data));
}
function constantEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const one = Buffer.from(a); const two = Buffer.from(b);
  return one.length === two.length && timingSafeEqual(one, two);
}
async function bodyJSON(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) throw new HttpError(415, 'JSON required.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) throw new HttpError(413, 'Request too large.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Not an object');
    return value;
  } catch { throw new HttpError(400, 'Invalid JSON object.'); }
}
const sessionCookie = (token, maxAge) => `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/mladmin; Max-Age=${maxAge}`;
function getCookie(req) {
  const part = (req.headers.cookie ?? '').split(';').map((v) => v.trim()).find((v) => v.startsWith(`${cookieName}=`));
  return part?.slice(cookieName.length + 1);
}
async function authenticate(req) {
  const token = getCookie(req);
  const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) return null;
  const db = await readUsers();
  const user = db.users.find((item) => item.username === session.username && item.revision === session.revision);
  if (!user) { sessions.delete(token); return null; }
  return { token, session, user };
}
function csrf(req, auth) {
  if (!constantEqual(req.headers['x-csrf-token'], auth.session.csrf)) throw new HttpError(403, 'Invalid session token.');
}
function safePermissions(value) {
  if (!Array.isArray(value) || value.length === 0 || new Set(value).size !== value.length || value.some((item) => !PERMISSIONS.includes(item))) throw new HttpError(400, 'Choose valid permissions.');
  return value;
}
function publicUser(user) { return { username: user.username, root: user.root, permissions: user.permissions }; }
async function requestHandler(req, res) {
  try {
    const host = req.headers.host;
    if (host !== `127.0.0.1:${PORT}` && host !== `localhost:${PORT}`) throw new HttpError(403, 'Local access only.');
    const url = new URL(req.url, BASE);
    const pathname = url.pathname;
    if (req.method === 'GET' && (pathname === '/mladmin' || pathname === '/mladmin/')) {
      const html = await readFile(join(ROOT, 'scripts/admin/admin.html'));
      res.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    if (req.method === 'GET' && ['/mladmin/admin.css', '/mladmin/admin.js'].includes(pathname)) {
      const content = await readFile(join(ROOT, 'scripts/admin', pathname.slice('/mladmin/'.length)));
      res.writeHead(200, { ...headers, 'Content-Type': pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8' });
      return res.end(content);
    }
    if (!pathname.startsWith('/mladmin/api/')) throw new HttpError(404, 'Not found.');
    const api = pathname.slice('/mladmin/api/'.length);
    if (req.method !== 'GET' && req.headers.origin !== `http://${host}`) throw new HttpError(403, 'Invalid origin.');
    const auth = await authenticate(req);
    if (api === 'session' && req.method === 'GET') {
      return json(res, 200, { user: auth ? publicUser(auth.user) : null, csrf: auth?.session.csrf ?? null });
    }
    if (api === 'login' && req.method === 'POST') {
      const attempt = failures.get(req.socket.remoteAddress);
      if (attempt && attempt.until > Date.now() && attempt.count >= 5) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
      const data = await bodyJSON(req);
      if (typeof data.username !== 'string' || typeof data.password !== 'string' || data.password.length > 1024) throw new HttpError(400, 'Enter a username and password.');
      const db = await readUsers();
      const user = db.users.find((item) => item.username === data.username.toLowerCase().trim());
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        const fresh = !attempt || attempt.until < Date.now();
        failures.set(req.socket.remoteAddress, { count: fresh ? 1 : attempt.count + 1, until: Date.now() + loginWindow });
        throw new HttpError(401, 'Invalid username or password.');
      }
      failures.delete(req.socket.remoteAddress);
      if (auth) sessions.delete(auth.token);
      const token = randomBytes(32).toString('hex');
      const session = { username: user.username, revision: user.revision, csrf: randomBytes(32).toString('hex'), expires: Date.now() + sessionDuration };
      sessions.set(token, session);
      return json(res, 200, { user: publicUser(user), csrf: session.csrf }, { 'Set-Cookie': sessionCookie(token, Math.floor(sessionDuration / 1000)) });
    }
    if (api === 'logout' && req.method === 'POST') {
      if (!auth) throw new HttpError(401, 'Sign in required.'); csrf(req, auth);
      sessions.delete(auth.token);
      return json(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
    }
    if (api === 'site' && req.method === 'GET') {
      if (!auth || (!auth.user.root && !auth.user.permissions.some((p) => ['home', 'projects'].includes(p)))) throw new HttpError(403, 'No site editor access.');
      const { revision, config } = await currentSite();
      return json(res, 200, { revision, config, sources: await sourceProjects() });
    }
    if (api === 'site' && req.method === 'POST') {
      if (!auth || (!auth.user.root && !auth.user.permissions.some((p) => ['home', 'projects'].includes(p)))) throw new HttpError(403, 'No site editor access.');
      csrf(req, auth);
      const data = await bodyJSON(req);
      const current = await currentSite();
      if (data.revision !== current.revision) throw new HttpError(409, 'Site settings changed. Reload before saving.');
      if (!auth.user.root) {
        if (!auth.user.permissions.includes('projects') && JSON.stringify(data.config?.projects) !== JSON.stringify(current.config.projects)) throw new HttpError(403, 'Project access required.');
        if (!auth.user.permissions.includes('home') && (JSON.stringify(data.config?.examples) !== JSON.stringify(current.config.examples) || JSON.stringify(data.config?.sectionOrder) !== JSON.stringify(current.config.sectionOrder))) throw new HttpError(403, 'Homepage access required.');
      }
      let valid;
      try { valid = validateSiteConfig(data.config, await sourceProjects()); }
      catch (error) { throw new HttpError(400, error.message); }
      await atomicJSON(CONFIG, valid);
      return json(res, 200, { ok: true, ...(await currentSite()) });
    }
    if (api === 'users' && req.method === 'GET') {
      if (!auth?.user.root) throw new HttpError(403, 'Main admin only.');
      return json(res, 200, { users: (await readUsers()).users.map(publicUser) });
    }
    if (api === 'users' && req.method === 'POST') {
      if (!auth?.user.root) throw new HttpError(403, 'Main admin only.');
      csrf(req, auth);
      const data = await bodyJSON(req);
      if (typeof data.username !== 'string' || !/^[a-z][a-z0-9_-]{2,31}$/.test(data.username)) throw new HttpError(400, 'Username must be 3 to 32 lowercase letters, numbers, hyphens or underscores.');
      const permissions = safePermissions(data.permissions);
      const db = await readUsers();
      if (db.users.some((user) => user.username === data.username)) throw new HttpError(409, 'Username already exists.');
      const password = randomPassword();
      db.users.push({ username: data.username, passwordHash: await hashPassword(password), permissions, root: false, revision: randomUUID() });
      await writeUsers(db);
      return json(res, 201, { username: data.username, temporaryPassword: password });
    }
    const userRoute = api.match(/^users\/([a-z][a-z0-9_-]{2,31})(?:\/(reset))?$/);
    if (userRoute && ['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!auth?.user.root) throw new HttpError(403, 'Main admin only.');
      csrf(req, auth);
      const username = userRoute[1];
      if (username === 'mark') throw new HttpError(403, 'Reset the main admin locally with npm run admin:reset.');
      const db = await readUsers();
      const account = db.users.find((item) => item.username === username);
      if (!account) throw new HttpError(404, 'Account not found.');
      if (userRoute[2] === 'reset' && req.method === 'POST') {
        const password = randomPassword();
        account.passwordHash = await hashPassword(password);
        account.revision = randomUUID();
        await writeUsers(db);
        return json(res, 200, { username, temporaryPassword: password });
      }
      if (!userRoute[2] && req.method === 'PATCH') {
        const data = await bodyJSON(req);
        account.permissions = safePermissions(data.permissions);
        await writeUsers(db);
        return json(res, 200, { user: publicUser(account) });
      }
      if (!userRoute[2] && req.method === 'DELETE') {
        db.users = db.users.filter((item) => item.username !== username);
        await writeUsers(db);
        return json(res, 200, { ok: true });
      }
    }
    throw new HttpError(404, 'Not found.');
  } catch (error) {
    if (!(error instanceof HttpError)) console.error(error);
    return json(res, error.status ?? 500, { error: error instanceof HttpError ? error.message : 'Admin server error.' });
  }
}
createServer(requestHandler).listen(PORT, '127.0.0.1', () => {
  console.log(`Local admin: ${BASE}/mladmin`);
  console.log('Loopback only. This is NOT a production Cloudflare backend.');
});
