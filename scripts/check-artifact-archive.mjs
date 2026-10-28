import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(
  await readFile(resolve(root, 'docs/jelly-oasis/artifact-deduplication.json'), 'utf8'),
);
assert.equal(manifest.version, 1);
assert.equal(manifest.entries.length, manifest.removedFiles);
const removed = new Set(manifest.entries.map((entry) => entry.removed));
assert.equal(removed.size, manifest.entries.length, 'Duplicate removed path');
const hashes = new Map();
let bytes = 0;
for (const entry of manifest.entries) {
  for (const path of [entry.removed, entry.retained]) {
    assert.match(path, /^artifacts\/jelly-oasis\//);
    assert.ok(!path.split('/').includes('..') && !path.includes('\\'));
    assert.match(path, /\.(png|jpe?g|webp|mp4|svg)$/);
  }
  assert.ok(!removed.has(entry.retained), 'Retained path is also removed');
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  if (!hashes.has(entry.retained)) {
    const data = await readFile(resolve(root, entry.retained));
    hashes.set(entry.retained, {
      sha256: createHash('sha256').update(data).digest('hex'),
      bytes: data.length,
    });
  }
  assert.deepEqual(hashes.get(entry.retained), {
    sha256: entry.sha256,
    bytes: entry.bytes,
  });
  bytes += entry.bytes;
}
assert.equal(bytes, manifest.removedBytes);
console.log(
  `Archive verified: ${removed.size} historical paths resolve to ${hashes.size} byte-identical retained files (${bytes} bytes deduplicated).`,
);
