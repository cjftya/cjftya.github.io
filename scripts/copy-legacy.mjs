import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(repositoryRoot, 'dist');
const legacyDirectories = ['projects', 'shared'];
const builtProjectDirectories = new Set(
  ['viola', 'uriel'].map((project) => resolve(repositoryRoot, 'projects', project)),
);

await mkdir(outputRoot, { recursive: true });

for (const directory of legacyDirectories) {
  await cp(resolve(repositoryRoot, directory), resolve(outputRoot, directory), {
    recursive: true,
    force: true,
    filter: (source) => {
      if (directory !== 'projects') return true;
      return !builtProjectDirectories.has(source);
    },
  });
}

await writeFile(resolve(outputRoot, '.nojekyll'), '');

console.log(`Copied legacy directories to ${outputRoot}`);
