import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { filesBelow } from './content.mjs';
import {
  validateManifest,
  publicKeyId,
} from '../../projects/weddingcard/security/crypto.js';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function checkWedding(directory, { requireContent = true } = {}) {
  const allow = JSON.parse(
    await readFile(resolve(root, 'config/weddingcard-public-files.json'), 'utf8'),
  );
  const all = await filesBelow(directory);
  const publicFiles = all.filter(
    (path) => !relative(directory, path).startsWith('protected/'),
  );
  if (publicFiles.length !== Object.keys(allow).length)
    throw new Error('Unexpected public Wedding Card files');
  for (const path of publicFiles) {
    const name = relative(directory, path).split('\\').join('/');
    if (digest(await readFile(path)) !== allow[name])
      throw new Error(`Unreviewed public file: ${name}`);
  }
  let manifest;
  try {
    manifest = validateManifest(
      JSON.parse(await readFile(resolve(directory, 'protected/manifest.json'), 'utf8')),
    );
  } catch (e) {
    if (!requireContent && e.code === 'ENOENT') return;
    throw new Error('Private-key migration is required before deployment', {
      cause: e,
    });
  }
  const publicPem = await readFile(
    resolve(directory, 'security/public-key.pem'),
    'utf8',
  );
  if ((await publicKeyId(publicPem)) !== manifest.keyId)
    throw new Error('Public key does not match encrypted content');
  const receipt = JSON.parse(
    await readFile(resolve(directory, 'protected/verified.json'), 'utf8'),
  );
  const expected = ['manifest.json', 'content.bin', ...manifest.images];
  const protectedFiles = all.filter((p) =>
    relative(directory, p).startsWith('protected/'),
  );
  if (
    protectedFiles.length !== expected.length + 1 ||
    Object.keys(receipt).length !== expected.length
  )
    throw new Error('Unexpected protected files');
  const ivs = new Set();
  for (const name of expected) {
    const bytes = await readFile(resolve(directory, 'protected', name));
    if (digest(bytes) !== receipt[name])
      throw new Error('Encrypted file changed after local verification');
    if (name !== 'manifest.json') {
      if (bytes.length < 32 || bytes.subarray(0, 4).toString() !== 'WCP3')
        throw new Error('Unencrypted content rejected');
      const iv = bytes.subarray(4, 16).toString('hex');
      if (ivs.has(iv)) throw new Error('Duplicate AES-GCM IV');
      ivs.add(iv);
    }
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  checkWedding(resolve(process.argv[2] || resolve(root, 'projects/weddingcard')))
    .then(() =>
      console.log(
        'Wedding Card public allowlist and encrypted-file verification passed.',
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
