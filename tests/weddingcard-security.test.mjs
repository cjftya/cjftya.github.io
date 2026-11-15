import { beforeAll, it, expect, vi } from 'vitest';
import { mkdtemp, rm, readFile, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  createEnvelope,
  openEnvelope,
  encrypt,
  decrypt,
  toBase64,
} from '../projects/weddingcard/security/crypto.js';
import { writeProtected, readProtected } from '../scripts/weddingcard/content.mjs';
import { checkWedding } from '../scripts/weddingcard/check.mjs';
const paths = Array.from(
  { length: 18 },
  (_, i) => `assets/private/image/viewer/thumb${i + 1}.jpg.bin`,
);
let first, second;
async function keypair() {
  const keys = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );
  const pem = (kind, bytes) =>
    `-----BEGIN ${kind}-----\n${toBase64(bytes)}\n-----END ${kind}-----\n`;
  return {
    public: pem('PUBLIC KEY', await crypto.subtle.exportKey('spki', keys.publicKey)),
    private: pem(
      'PRIVATE KEY',
      await crypto.subtle.exportKey('pkcs8', keys.privateKey),
    ),
  };
}
beforeAll(async () => {
  first = await keypair();
  second = await keypair();
});
it('unwraps only with the correct private key and imports a nonextractable AES-256 key', async () => {
  const { manifest, key } = await createEnvelope(paths, first.public);
  const opened = await openEnvelope(first.private, manifest);
  expect(opened.extractable).toBe(false);
  expect(opened.algorithm.length).toBe(256);
  expect(opened.usages).toEqual(['decrypt']);
  await expect(crypto.subtle.exportKey('raw', opened)).rejects.toThrow();
  const plain = new TextEncoder().encode('synthetic private fixture');
  const cipher = await encrypt(plain, key, manifest, 'content');
  expect(await decrypt(cipher, opened, manifest, 'content')).toEqual(plain);
  await expect(openEnvelope(second.private, manifest)).rejects.toThrow();
  await expect(openEnvelope(first.public, manifest)).rejects.toThrow();
  await expect(openEnvelope('', manifest)).rejects.toThrow();
  await expect(
    openEnvelope(first.private, { ...manifest, version: 2 }),
  ).rejects.toThrow();
  const altered = {
    ...manifest,
    wrappedKey:
      (manifest.wrappedKey[0] === 'A' ? 'B' : 'A') + manifest.wrappedKey.slice(1),
  };
  await expect(openEnvelope(first.private, altered)).rejects.toThrow();
  await expect(decrypt(cipher, opened, manifest, paths[0])).rejects.toThrow();
  const changed = cipher.slice();
  changed[changed.length - 1] ^= 1;
  await expect(decrypt(changed, opened, manifest, 'content')).rejects.toThrow();
  await expect(decrypt(plain, opened, manifest, 'content')).rejects.toThrow();
  await expect(
    decrypt(cipher, opened, { ...manifest, images: [...paths].reverse() }, 'content'),
  ).rejects.toThrow();
  expect(await encrypt(plain, key, manifest, 'content')).not.toEqual(cipher);
});
it('round-trips and rotates all images; the old private key fails after rotation', async () => {
  const temp = await mkdtemp(resolve(tmpdir(), 'wc-test-'));
  const target = resolve(temp, 'protected');
  try {
    const original = {
      content: { body: '<div>synthetic</div>', scripts: [] },
      images: paths.map((path) => ({ path, bytes: new Uint8Array([1, 2, 3]) })),
    };
    await writeProtected(target, original, first.public, first.private);
    expect(await readProtected(target, first.private)).toEqual(original);
    await writeProtected(
      target,
      await readProtected(target, first.private),
      second.public,
      second.private,
    );
    expect(await readProtected(target, second.private)).toEqual(original);
    await expect(readProtected(target, first.private)).rejects.toThrow();
    expect(await readFile(resolve(target, 'manifest.json'), 'utf8')).not.toContain(
      'PRIVATE KEY',
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
it('validates real encrypted release files and rejects extra plaintext and modified ciphertext', async () => {
  await checkWedding(resolve('projects/weddingcard'));
  const temp = await mkdtemp(resolve(tmpdir(), 'wc-release-test-'));
  try {
    await cp(resolve('projects/weddingcard'), temp, { recursive: true });
    await checkWedding(temp);
    await writeFile(resolve(temp, 'leaked-photo.jpg'), new Uint8Array([255, 216, 255]));
    await expect(checkWedding(temp)).rejects.toThrow('Unexpected public');
    await rm(resolve(temp, 'leaked-photo.jpg'));
    const bytes = await readFile(resolve(temp, 'protected/content.bin'));
    bytes[bytes.length - 1] ^= 1;
    await writeFile(resolve(temp, 'protected/content.bin'), bytes);
    await expect(checkWedding(temp)).rejects.toThrow(
      'changed after local verification',
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
it('distinguishes ZIP, public keys and old encrypted keys before attempting unlock', async () => {
  const { inspectKeyFile, keyFileErrorMessage } =
    await import('../projects/weddingcard/security/key-file.js');
  const bytes = (s) => new TextEncoder().encode(s).buffer;
  expect(inspectKeyFile(bytes(first.private))).toBeNull();
  expect(
    inspectKeyFile(bytes('\ufeff' + first.private.replaceAll('\n', '\r\n'))),
  ).toBeNull();
  expect(inspectKeyFile(bytes(first.public))).toBe('public_key');
  expect(
    inspectKeyFile(
      bytes(
        '-----BEGIN ENCRYPTED PRIVATE KEY-----\nAAAA\n-----END ENCRYPTED PRIVATE KEY-----',
      ),
    ),
  ).toBe('encrypted_key');
  expect(inspectKeyFile(new Uint8Array([0x50, 0x4b, 3, 4]).buffer)).toBe('archive');
  expect(inspectKeyFile(new Uint8Array([0xff, 0xff]).buffer)).toBe('invalid_key');
  for (const code of ['archive', 'encrypted_key', 'public_key', 'invalid_key'])
    expect(keyFileErrorMessage(code)).toContain('weddingcard-private.pem');
});

it('reports key, network and ciphertext failures separately without revealing protected content', async () => {
  const messages = [];
  const fakeSelf = {
    postMessage: (message) => messages.push(message),
    close: () => {},
  };
  const { manifest } = await createEnvelope(paths, first.public);
  const response = (path) => ({
    ok: true,
    json: async () => manifest,
    arrayBuffer: async () => new Uint8Array(40).buffer,
    url: path,
  });
  vi.stubGlobal('self', fakeSelf);
  vi.stubGlobal('fetch', async (path) => response(path));
  try {
    await import('../projects/weddingcard/security/unlock-worker.js');
    const run = async (key) => {
      messages.length = 0;
      await fakeSelf.onmessage({
        data: { type: 'unlock', keyFile: new TextEncoder().encode(key).buffer },
      });
      return [...messages];
    };
    expect(await run(second.private)).toEqual([{ type: 'error', code: 'wrong_key' }]);
    expect(await run(first.private)).toEqual([
      { type: 'error', code: 'authentication' },
    ]);
    vi.stubGlobal('fetch', async () => {
      throw new Error('Offline');
    });
    expect(await run(first.private)).toEqual([{ type: 'error', code: 'network' }]);
  } finally {
    vi.unstubAllGlobals();
  }
});
