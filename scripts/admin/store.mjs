import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, writeFile, rename, mkdir, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const scrypt = promisify(scryptCallback);
export const ROOT = resolve(import.meta.dirname, '../..');
export const STATE = resolve(process.env.ADMIN_STATE_DIR ?? join(ROOT, 'data/processed/mladmin'));
export const CONFIG = resolve(process.env.ADMIN_SITE_CONFIG ?? join(ROOT, 'src/data/site-admin.json'));
const USER_FILE = join(STATE, 'users.json');
export const PERMISSIONS = ['home', 'projects', 'games'];
export const SECTION_IDS = ['home', 'data', 'maps', 'games', 'lab', 'photography', 'about'];
export const EXAMPLE_IDS = ['home', 'data', 'maps', 'games', 'lab'];
export const CATEGORIES = ['data', 'maps', 'games', 'lab'];
export const STATUSES = ['idea', 'prototype', 'published', 'archived'];
export const randomPassword = () => randomBytes(24).toString('base64url');
export const hashRevision = (content) => createHash('sha256').update(content).digest('hex');

export async function readJSON(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
export async function atomicJSON(path, value) {
  const folder = resolve(path, '..');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const temp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await rename(temp, path);
  } catch (error) {
    const { unlink } = await import('node:fs/promises');
    await unlink(temp).catch(() => {});
    throw error;
  }
}
export const readUsers = () => readJSON(USER_FILE, { users: [] });
export const writeUsers = (value) => atomicJSON(USER_FILE, value);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [algorithm, salt, digest] = stored.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(digest ?? '')) return false;
  const received = await scrypt(password, salt, 64);
  return timingSafeEqual(received, Buffer.from(digest, 'hex'));
}
export async function sourceProjects() {
  const dir = join(ROOT, 'src/content/projects');
  const files = (await readdir(dir)).filter((name) => name.endsWith('.md'));
  return Promise.all(files.map(async (file) => {
    const text = await readFile(join(dir, file), 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!frontmatter) throw Error(`Missing frontmatter in ${file}`);
    const field = (key) => frontmatter.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'))?.[1]?.replace(/^['"]|['"]$/g, '');
    const project = { slug: field('slug'), title: field('title'), category: field('category'), status: field('status'), featured: field('featured') === 'true', sortOrder: Number(field('sortOrder') ?? 100) };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug ?? '') || !CATEGORIES.includes(project.category) || !STATUSES.includes(project.status)) throw Error(`Invalid project metadata in ${file}`);
    return project;
  }));
}
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(object, allowed) { return Object.keys(object).every((key) => allowed.includes(key)); }
export function validateSiteConfig(value, source) {
  if (!isRecord(value) || !exactKeys(value, ['version', 'projects', 'sectionOrder', 'examples']) || value.version !== 1 || !isRecord(value.projects) || !isRecord(value.examples)) throw Error('Invalid site settings.');
  const bySlug = new Map(source.map((project) => [project.slug, project]));
  if (!Array.isArray(value.sectionOrder) || value.sectionOrder.length !== SECTION_IDS.length || new Set(value.sectionOrder).size !== SECTION_IDS.length || value.sectionOrder.some((id) => !SECTION_IDS.includes(id))) throw Error('Invalid section order.');
  if (!exactKeys(value.examples, EXAMPLE_IDS) || Object.keys(value.examples).length !== EXAMPLE_IDS.length) throw Error('Invalid examples.');
  for (const [slug, override] of Object.entries(value.projects)) {
    if (!bySlug.has(slug) || !isRecord(override) || !exactKeys(override, ['category', 'status', 'featured', 'sortOrder', 'visible', 'badge'])) throw Error('Invalid project override.');
    if ('category' in override && !CATEGORIES.includes(override.category)) throw Error('Invalid category.');
    if ('status' in override && !STATUSES.includes(override.status)) throw Error('Invalid status.');
    if ('badge' in override && !['default', 'updated'].includes(override.badge)) throw Error('Invalid badge.');
    if ('visible' in override && typeof override.visible !== 'boolean') throw Error('Invalid visibility.');
    if ('featured' in override && typeof override.featured !== 'boolean') throw Error('Invalid featured flag.');
    if ('sortOrder' in override && (!Number.isInteger(override.sortOrder) || override.sortOrder < 0 || override.sortOrder > 99999)) throw Error('Invalid sort order.');
  }
  // Remove now-hidden or moved examples so old section previews cannot contradict project placement.
  for (const section of EXAMPLE_IDS) {
    const examples = value.examples[section];
    if (!Array.isArray(examples) || examples.length > 30 || new Set(examples).size !== examples.length || examples.some((slug) => typeof slug !== 'string' || !bySlug.has(slug))) throw Error(`Invalid ${section} examples.`);
    value.examples[section] = examples.filter((slug) => {
      const changes = value.projects[slug] ?? {};
      return changes.visible !== false && (section === 'home' || (changes.category ?? bySlug.get(slug).category) === section);
    });
  }
  return value;
}
export async function currentSite() {
  const content = await readFile(CONFIG, 'utf8');
  return { revision: hashRevision(content), config: JSON.parse(content) };
}
