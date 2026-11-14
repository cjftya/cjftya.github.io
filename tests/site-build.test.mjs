import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { expect, it } from 'vitest';
import entries from '../config/siteEntries.json' with { type: 'json' };
import { copyLegacy } from '../scripts/copy-legacy.mjs';

it('keeps built project HTML and copies static projects/shared files at their original URLs', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'jelly-build-'));
  const output = resolve(root, 'dist');
  async function put(path, value) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value);
  }
  try {
    for (const entry of Object.values(entries)) {
      await put(resolve(root, entry), 'source');
      await put(resolve(output, entry), 'built');
    }
    await put(resolve(root, 'projects/weddingcard/index.html'), 'legacy');
    await put(resolve(root, 'shared/lib/p5.min.js'), 'shared');
    await copyLegacy(root, output);
    for (const entry of Object.values(entries)) {
      expect(await readFile(resolve(output, entry), 'utf8')).toBe('built');
    }
    expect(
      await readFile(resolve(output, 'projects/weddingcard/index.html'), 'utf8'),
    ).toBe('legacy');
    expect(await readFile(resolve(output, 'shared/lib/p5.min.js'), 'utf8')).toBe(
      'shared',
    );
    expect(await readFile(resolve(output, '.nojekyll'), 'utf8')).toBe('');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it('registers unique HTML entries that exist in the repository', async () => {
  const paths = Object.values(entries);
  expect(new Set(paths).size).toBe(paths.length);
  for (const path of paths) {
    expect(path).toMatch(/^(index\.html|projects\/[\w-]+\/index\.html)$/);
    expect(await readFile(new URL(`../${path}`, import.meta.url), 'utf8')).toContain(
      '<html',
    );
  }
});
