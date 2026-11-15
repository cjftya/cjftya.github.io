import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  mkdtemp,
  rename,
  rm,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  newManifest,
  deriveKey,
  encrypt,
  decrypt,
  validateManifest,
} from '../../projects/weddingcard/security/crypto.js';
export const LEGACY_REVISION = 'ee664cffa7c38cceadfa5f1d825dfb4ae10a0fe2';
export const PRIVATE_SCRIPTS = [
  'scripts/scenes/main/objectinitializer.js',
  'scripts/scenes/main/mainscene.js',
  'scripts/module/map/mapview.js',
  'scripts/module/directions/directions.js',
];
const prefix = 'projects/weddingcard/';
export function legacySnapshot(root) {
  function read(path) {
    return execFileSync('git', ['show', `${LEGACY_REVISION}:${prefix}${path}`], {
      cwd: root,
      maxBuffer: 16 * 1024 * 1024,
    });
  }
  const html = read('index.html').toString('utf8');
  const oldWorker = read(
    'scripts/common/util/framework/resourcemanger/resourceworker.js',
  ).toString('utf8');
  const match = oldWorker.match(/ENCRYPTED_IMAGE_KEY_HEX\s*=\s*"([a-f0-9]{64})"/);
  if (!match) throw new Error('Legacy key not found in pinned revision');
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)]
    .map((m) => m[1])
    .filter((src) => !src.startsWith('https:') && !src.endsWith('p5.min.js'))
    .map((src) =>
      PRIVATE_SCRIPTS.includes(src) ? { code: read(src).toString('utf8') } : { src },
    );
  const paths = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', LEGACY_REVISION, '--', prefix + 'assets/private'],
    { cwd: root, encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .map((p) => p.slice(prefix.length));
  return {
    content: { body: html.match(/<body>([\s\S]*?)<\/body>/)[1], scripts },
    images: paths.map((path) => ({ path, bytes: read(path) })),
    oldKey: Buffer.from(match[1], 'hex'),
  };
}
export async function restoreLegacy(root) {
  const snapshot = legacySnapshot(root);
  const key = await crypto.subtle.importKey('raw', snapshot.oldKey, 'AES-GCM', false, [
    'decrypt',
  ]);
  snapshot.oldKey.fill(0);
  const images = [];
  for (const { path, bytes } of snapshot.images) {
    if (bytes.subarray(0, 6).toString() !== 'WCIMG1')
      throw new Error('Unexpected legacy image');
    images.push({
      path,
      bytes: new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: bytes.subarray(6, 18) },
          key,
          bytes.subarray(18),
        ),
      ),
    });
  }
  return { content: snapshot.content, images };
}
export async function readProtected(directory, password) {
  const manifest = validateManifest(
    JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')),
  );
  const key = await deriveKey(password, manifest);
  const content = JSON.parse(
    new TextDecoder().decode(
      await decrypt(
        await readFile(join(directory, 'content.bin')),
        key,
        manifest,
        'content',
      ),
    ),
  );
  const images = [];
  for (const path of manifest.images)
    images.push({
      path,
      bytes: await decrypt(await readFile(join(directory, path)), key, manifest, path),
    });
  return { content, images };
}
export async function writeProtected(directory, data, password) {
  const manifest = newManifest(data.images.map((i) => i.path));
  const key = await deriveKey(password, manifest);
  const stage = await mkdtemp(join(dirname(directory), '.weddingcard-stage-'));
  const backup = stage + '-backup';
  let backedUp = false;
  try {
    const content = new TextEncoder().encode(JSON.stringify(data.content));
    await writeFile(
      join(stage, 'content.bin'),
      await encrypt(content, key, manifest, 'content'),
    );
    for (const image of data.images) {
      const destination = join(stage, image.path);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(
        destination,
        await encrypt(image.bytes, key, manifest, image.path),
      );
    }
    await writeFile(
      join(stage, 'manifest.json'),
      JSON.stringify(manifest, null, 2) + '\n',
    );
    const verified = await readProtected(stage, password);
    if (
      JSON.stringify(verified.content) !== JSON.stringify(data.content) ||
      verified.images.some(
        (image, i) =>
          !Buffer.from(image.bytes).equals(Buffer.from(data.images[i].bytes)),
      )
    ) {
      throw new Error('Round-trip verification failed');
    }
    const receipt = {};
    for (const name of ['manifest.json', 'content.bin', ...manifest.images]) {
      receipt[name] = createHash('sha256')
        .update(await readFile(join(stage, name)))
        .digest('hex');
    }
    await writeFile(
      join(stage, 'verified.json'),
      JSON.stringify(receipt, null, 2) + '\n',
    );
    for (const image of verified.images) image.bytes.fill(0);
    try {
      await rename(directory, backup);
      backedUp = true;
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    try {
      await rename(stage, directory);
    } catch (e) {
      if (backedUp) await rename(backup, directory);
      throw e;
    }
    if (backedUp) await rm(backup, { recursive: true });
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
export async function filesBelow(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(path)));
    else files.push(path);
  }
  return files;
}
