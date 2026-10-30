import { createHash } from 'node:crypto';
import { readFile, appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Pass the existing private key in memory. Never write it into config or logs.
export async function uploadArchive(privateKey, { limit = Infinity, concurrency = 4 } = {}) {
  if (!privateKey.startsWith('private_') || privateKey.includes('*')) throw new Error('An authenticated ImageKit private key is required');
  const config = JSON.parse(await readFile(path.join(root, 'hosting.json'), 'utf8'));
  const inventory = JSON.parse(await readFile(path.join(root, 'media-inventory.json'), 'utf8'));
  const logFile = path.join(root, 'upload-state.jsonl');
  let previous = [];
  try { previous = (await readFile(logFile, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const done = new Map(previous.filter((x) => x.verified).map((x) => [x.path, x]));
  const queue = inventory.items.filter((item) => done.get(item.path)?.sha256 !== item.sha256)
    .sort((a, b) => b.bytes - a.bytes).slice(0, limit);
  const auth = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
  const base = `${config.imagekitEndpoint.replace(/\/$/, '')}/tr:orig-true/${config.imagekitFolder}/`;
  let index = 0;
  let failed = false;
  const errors = [];
  async function worker() {
    while (!failed && index < queue.length) {
      const item = queue[index++];
      try {
        const bytes = await readFile(path.resolve(root, '../boragom-archive', item.path));
        if (hash(bytes) !== item.sha256) throw new Error('Local file changed since manifest creation');
        const body = new FormData();
        body.append('file', new Blob([bytes]), path.basename(item.path));
        body.append('fileName', path.basename(item.path));
        body.append('folder', `/${config.imagekitFolder}/${path.posix.dirname(item.path)}`);
        body.append('useUniqueFileName', 'false');
        body.append('overwriteFile', 'false');
        body.append('isPrivateFile', 'false');
        body.append('tags', 'boragom-archive');
        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST', headers: { Authorization: auth }, body, signal: AbortSignal.timeout(180_000),
        });
        const result = await response.json();
        // Recover a previous successful upload whose verification was interrupted.
        if (!response.ok && !/already exists/i.test(result.message || '')) {
          throw new Error(`Upload HTTP ${response.status}: ${result.message || 'failed'}`);
        }
        const url = base + item.path;
        let original;
        for (let attempt = 0; attempt < 4; attempt++) {
          original = await fetch(url, { signal: AbortSignal.timeout(120_000) });
          if (original.ok) break;
          await original.arrayBuffer();
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
        if (!original.ok) throw new Error(`Original delivery HTTP ${original.status}`);
        const downloaded = Buffer.from(await original.arrayBuffer());
        if (downloaded.length !== item.bytes || hash(downloaded) !== item.sha256) throw new Error('Downloaded original does not match local SHA-256');
        const record = { ...item, fileId: result.fileId || null, url, verified: true, checkedAt: new Date().toISOString() };
        await appendFile(logFile, JSON.stringify(record) + '\n');
        done.set(item.path, record);
        if (done.size % 25 === 0 || done.size <= 2) console.log(JSON.stringify({ verified: done.size, total: inventory.files, bytesVerified: [...done.values()].reduce((n, x) => n + x.bytes, 0) }));
      } catch (error) {
        failed = true;
        errors.push({ path: item.path, error: error.message });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const report = { mediaFiles: inventory.files, verifiedFiles: done.size, complete: done.size === inventory.files, verifiedBytes: [...done.values()].reduce((n, x) => n + x.bytes, 0), errors, checkedAt: new Date().toISOString() };
  await writeFile(path.join(root, 'media-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  if (errors.length) throw new Error('Upload or original-byte verification failed; see media-verification.json');
  return report;
}
