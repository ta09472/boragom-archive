import { cp, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'hosting.json'), 'utf8'));
const endpoint = new URL(config.imagekitEndpoint);
if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'ik.imagekit.io' || endpoint.pathname === '/') {
  throw new Error('Set the actual ImageKit URL endpoint in hosting.json first');
}
if (endpoint.search || endpoint.hash) throw new Error('Endpoint must not contain query or hash');
if (!/^[a-zA-Z0-9/_-]+$/.test(config.imagekitFolder)) throw new Error('Invalid ImageKit folder');
const base = `${endpoint.href.replace(/\/$/, '')}/tr:orig-true/${config.imagekitFolder.replace(/^\/+|\/+$/g, '')}/`;
const inventory = JSON.parse(await readFile(path.join(root, 'media-inventory.json'), 'utf8'));
const known = new Set(inventory.items.map((item) => item.path));
const referenced = new Set();
const missing = new Set();
const site = path.join(root, 'site');
await rm(site, { recursive: true, force: true });
await cp(path.join(root, 'template'), site, { recursive: true, dereference: true });
async function rewrite(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await rewrite(file); continue; }
    if (!/\.(js|css|html|json|csv|md|txt)$/i.test(entry.name)) continue;
    const original = await readFile(file, 'utf8');
    const transformed = original.replace(/(?<![A-Za-z0-9_:/.-])(?:\.\.\/|\.\/)*media\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|gif|webp|svg|avif|ico|mp4|webm|mov)/gi, (match) => {
      const relative = match.replace(/^(?:\.\.\/|\.\/)+/, '');
      if (!known.has(relative)) { missing.add(relative); return match; }
      referenced.add(relative);
      return base + relative;
    });
    if (transformed.includes('/boragom-archive/https:') || transformed.includes('ik.imagekit.io/validation-only')) {
      throw new Error(`Invalid media URL in ${path.relative(site, file)}`);
    }
    if (transformed !== original) await writeFile(file, transformed);
  }
}
await rewrite(site);
await writeFile(path.join(site, '.nojekyll'), '');
await writeFile(path.join(site, '404.html'), await readFile(path.join(site, 'index.html')));
const report = { endpoint: endpoint.href, originalDelivery: true, mediaFiles: inventory.files, mediaBytes: inventory.bytes, rewrittenMediaFiles: referenced.size, unresolvedReferences: [...missing].sort() };
await writeFile(path.join(root, 'build-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
// Historical evidence can contain paths for known missing source files; the application must not.
const app = await readFile(path.join(site, 'assets/app.js'), 'utf8');
const unresolvedApp = [...app.matchAll(/(?<![A-Za-z0-9/_-])media\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|gif|webp|svg|mp4|webm)/gi)].map((m) => m[0]);
if (unresolvedApp.length) throw new Error(`Unresolved application media: ${unresolvedApp.join(', ')}`);
