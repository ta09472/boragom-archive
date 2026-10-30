import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = path.resolve(process.argv[2] || path.join(root, '../boragom-archive'));
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
    else throw new Error(`Unsupported entry: ${full}`);
  }
  return files.sort();
}

const files = [];
for (const file of await walk(path.join(archive, 'media'))) {
  const bytes = await readFile(file);
  const relative = path.relative(archive, file).split(path.sep).join('/');
  const video = /\.(mp4|webm|mov)$/i.test(file);
  if (bytes.length > (video ? 100 : 25) * 1_000_000) {
    throw new Error(`ImageKit Free upload limit exceeded: ${relative}`);
  }
  files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const bytes = files.reduce((n, f) => n + f.bytes, 0);
if (bytes > 3_000_000_000) throw new Error('ImageKit Free storage limit exceeded');
await writeFile(path.join(root, 'media-inventory.json'), JSON.stringify({ files: files.length, bytes, items: files }, null, 2) + '\n');
const template = path.join(root, 'template');
await mkdir(template, { recursive: true });
for (const entry of await readdir(archive, { withFileTypes: true })) {
  if (['media', 'raw', 'source'].includes(entry.name)) continue;
  await cp(path.join(archive, entry.name), path.join(template, entry.name), {
    recursive: true,
    filter: (file) => !file.endsWith('.mhtml'),
  });
}
await cp(path.join(archive, 'source'), path.join(root, 'app'), { recursive: true });
const templateFiles = await walk(template);
let templateBytes = 0;
for (const file of templateFiles) templateBytes += (await stat(file)).size;
if (templateBytes >= 1_000_000_000) throw new Error('GitHub Pages size limit exceeded');
console.log(JSON.stringify({ mediaFiles: files.length, mediaBytes: bytes, staticFiles: templateFiles.length, staticBytes: templateBytes }));
