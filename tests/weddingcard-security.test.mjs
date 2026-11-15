import { it, expect } from 'vitest';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  newManifest,
  deriveKey,
  encrypt,
  decrypt,
} from '../projects/weddingcard/security/crypto.js';
import {
  restoreLegacy,
  writeProtected,
  readProtected,
} from '../scripts/weddingcard/content.mjs';
import { checkWedding } from '../scripts/weddingcard/check.mjs';
const paths = Array.from(
  { length: 18 },
  (_, i) => `assets/private/image/viewer/thumb${i + 1}.jpg.bin`,
);
const password = () => crypto.randomUUID();
it('uses nonextractable AES-256 keys and fails closed for wrong/empty passwords, tampering and file substitution', async () => {
  const manifest = newManifest(paths);
  const key = await deriveKey(password(), manifest);
  expect(key.extractable).toBe(false);
  expect(key.algorithm.length).toBe(256);
  const bytes = new TextEncoder().encode('synthetic private fixture');
  const cipher = await encrypt(bytes, key, manifest, 'content');
  expect(await decrypt(cipher, key, manifest, 'content')).toEqual(bytes);
  await expect(deriveKey('', manifest)).rejects.toThrow();
  const wrong = await deriveKey(password(), manifest);
  await expect(decrypt(cipher, wrong, manifest, 'content')).rejects.toThrow();
  await expect(decrypt(cipher, key, manifest, paths[0])).rejects.toThrow();
  const changed = cipher.slice();
  changed[changed.length - 1] ^= 1;
  await expect(decrypt(changed, key, manifest, 'content')).rejects.toThrow();
  await expect(decrypt(bytes, key, manifest, 'content')).rejects.toThrow();
  await expect(
    deriveKey(password(), { ...manifest, kdf: { ...manifest.kdf, iterations: 1 } }),
  ).rejects.toThrow();
  const changedList = { ...manifest, images: [...paths].reverse() };
  await expect(decrypt(cipher, key, changedList, 'content')).rejects.toThrow();
  expect(await encrypt(bytes, key, manifest, 'content')).not.toEqual(cipher);
});
it('round-trips and rotates all images and content without persisting a password', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'wc-test-'));
  const target = resolve(temp, 'protected');
  try {
    const original = {
      content: { body: '<div>synthetic</div>', scripts: [] },
      images: paths.map((path) => ({ path, bytes: new Uint8Array([1, 2, 3]) })),
    };
    const first = password(),
      second = password();
    await writeProtected(target, original, first);
    expect(await readProtected(target, first)).toEqual(original);
    await writeProtected(target, await readProtected(target, first), second);
    expect(await readProtected(target, second)).toEqual(original);
    await expect(readProtected(target, first)).rejects.toThrow();
    expect(await readFile(resolve(target, 'manifest.json'), 'utf8')).not.toContain(
      second,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
it('keeps public source reviewed and blocks release until local migration', async () => {
  await checkWedding(resolve('projects/weddingcard'), { requireContent: false });
  const exists = await access('projects/weddingcard/protected/manifest.json').then(
    () => true,
    () => false,
  );
  if (exists) await checkWedding(resolve('projects/weddingcard'));
  else
    await expect(checkWedding(resolve('projects/weddingcard'))).rejects.toThrow(
      'migration',
    );
});
it('can recover the pinned legacy content and 18 images in memory', async () => {
  // CI uses a shallow checkout; local migration fetch instructions provide this revision.
  if (process.env.CI) return;
  const restored = await restoreLegacy(resolve('.'));
  expect(restored.images).toHaveLength(18);
  expect(restored.content.scripts.filter((s) => s.code)).toHaveLength(4);
  for (const image of restored.images) {
    expect(Buffer.from(image.bytes.subarray(0, 2)).toString('hex')).toMatch(
      /^(ffd8|8950)$/,
    );
    image.bytes.fill(0);
  }
});
