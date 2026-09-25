import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const configPath = resolve(root, 'src/data/site-admin.json');
const distRoot = resolve(root, 'dist');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const config = JSON.parse(await readFile(configPath, 'utf8'));
const hiddenSlugs = Object.entries(config.projects ?? {})
  .filter(([, override]) => override?.visible === false)
  .map(([slug]) => slug);

for (const slug of hiddenSlugs) {
  if (!slugPattern.test(slug)) {
    throw new Error(`Refusing to prune invalid project slug: ${slug}`);
  }

  await rm(resolve(distRoot, 'projects', slug), { recursive: true, force: true });
  await rm(resolve(distRoot, 'data', slug), { recursive: true, force: true });
  console.log(`Pruned hidden project from build output: ${slug}`);
}
