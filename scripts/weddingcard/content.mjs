import { createHash } from 'node:crypto';
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
  createEnvelope,
  openEnvelope,
  encrypt,
  decrypt,
  validateManifest,
} from '../../projects/weddingcard/security/crypto.js';
export async function readProtected(directory, privatePem) {
  const manifest = validateManifest(
    JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')),
  );
  const key = await openEnvelope(privatePem, manifest);
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
export async function writeProtected(directory, data, publicPem, privatePem) {
  const { manifest, key } = await createEnvelope(
    data.images.map((i) => i.path),
    publicPem,
  );
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
    const verified = await readProtected(stage, privatePem);
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
