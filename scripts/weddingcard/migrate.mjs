// Pass file paths only, never paste a private key into arguments or logs.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProtected, writeProtected } from './content.mjs';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
async function main() {
  const [mode, ...files] = process.argv.slice(2);
  const directory = resolve(root, 'projects/weddingcard/protected');
  let data, privatePem;
  if (mode === 'verify' && files.length === 1) {
    privatePem = await readFile(resolve(files[0]));
    data = await readProtected(directory, privatePem);
  } else if (mode === 'rotate' && files.length === 3) {
    privatePem = await readFile(resolve(files[0]));
    data = await readProtected(directory, privatePem);
    privatePem.fill(0);
    privatePem = await readFile(resolve(files[2]));
    await writeProtected(
      directory,
      data,
      await readFile(resolve(files[1])),
      privatePem,
    );
    console.log(
      'Copy the new PUBLIC key to security/public-key.pem and review/update its allowlist hash before deployment.',
    );
  } else {
    throw new Error(
      'Usage: verify PRIVATE_KEY_FILE, or rotate OLD_PRIVATE NEW_PUBLIC NEW_PRIVATE',
    );
  }
  privatePem.fill(0);
  for (const image of data.images) image.bytes.fill(0);
  console.log('Content and all 18 images authenticated. No password required.');
}
main().catch(() => {
  console.error(
    'Key operation failed. Check key files, Git history and encrypted content. No private key logged.',
  );
  process.exitCode = 1;
});
