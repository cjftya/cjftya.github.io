import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import siteEntries from '../config/siteEntries.json' with { type: 'json' };

/** Copy only static projects; built HTML must never be replaced by source HTML. */
export async function copyLegacy(repositoryRoot, outputRoot) {
  const legacyDirectories = ['projects', 'shared'];
  const builtProjectDirectories = new Set(
    Object.values(siteEntries)
      .filter((entry) => entry.startsWith('projects/'))
      .map((entry) => resolve(repositoryRoot, dirname(entry))),
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
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const repositoryRoot = resolve(import.meta.dirname, '..');
  const outputRoot = resolve(repositoryRoot, 'dist');
  await copyLegacy(repositoryRoot, outputRoot);
  console.log(`Copied legacy directories to ${outputRoot}`);
}
