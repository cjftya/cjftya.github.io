// Run only on your own machine. No password arguments, environment variables or logs.
import { createInterface } from 'node:readline/promises';
import { access } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreLegacy, readProtected, writeProtected } from './content.mjs';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
async function secret(prompt) {
  if (!process.stdin.isTTY) throw new Error('Use an interactive local terminal');
  process.stdout.write(prompt);
  const sink = new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });
  const rl = createInterface({
    input: process.stdin,
    output: sink,
    terminal: true,
    historySize: 0,
  });
  try {
    return await rl.question('');
  } finally {
    rl.close();
    process.stdout.write('\n');
  }
}
async function main() {
  if (!process.stdin.isTTY) throw new Error('Use a local terminal');
  const credentials = {};
  const mode = process.argv[2];
  if (!['migrate', 'rotate', 'verify'].includes(mode) || process.argv.length !== 3) {
    throw new Error(
      'Usage: node scripts/weddingcard/migrate.mjs migrate|rotate|verify',
    );
  }
  const directory = resolve(root, 'projects/weddingcard/protected');
  let data;
  if (mode === 'migrate') {
    const exists = await access(directory).then(
      () => true,
      () => false,
    );
    if (exists) throw new Error('Use rotate for existing protected content');
    data = await restoreLegacy(root);
  } else {
    credentials.old = await secret('Current password (hidden): ');
    try {
      data = await readProtected(directory, credentials.old);
    } finally {
      credentials.old = '';
    }
  }
  if (mode !== 'verify') {
    credentials.password = await secret(
      'New passphrase, 5+ random English words (hidden): ',
    );
    credentials.confirm = await secret('Confirm passphrase (hidden): ');
    try {
      if (
        credentials.password !== credentials.confirm ||
        credentials.password.length < 25 ||
        !/^[a-z]+(?:[ -][a-z]+){4,}$/i.test(credentials.password)
      ) {
        throw new Error(
          'Passphrases must match and contain 5+ English words, 25+ characters',
        );
      }
      await writeProtected(directory, data, credentials.password);
    } finally {
      credentials.password = '';
      credentials.confirm = '';
    }
  }
  for (const image of data.images) image.bytes.fill(0);
  console.log(
    'Authenticated content and all 18 images verified. No plaintext files written.',
  );
}
main().catch(() => {
  console.error(
    'Operation failed. Check local Git history, password and encrypted files. No credentials logged.',
  );
  process.exitCode = 1;
});
