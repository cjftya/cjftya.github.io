// Retain every numeric matrix result, but avoid committing duplicate matrix images.
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'artifacts/jelly-oasis/environment-polish-v1';
const dir = `${root}/landscape`;
const result = JSON.parse(await readFile(`${dir}/browser-qa.json`, 'utf8'));
assert(result.some((r) => r.name === '404-load-failure'));
const matrix = result.filter((r) =>
  /^(desktop|mobile390|mobile360|landscape)-(off|a|b)-(noon|night|rain|mist)-(overview|medium|ground)$/.test(
    r.name,
  ),
);
assert.equal(matrix.length, 144);
const files = [];
for (const name of await readdir(dir)) {
  if (!name.endsWith('.jpg')) continue;
  const bytes = await readFile(`${dir}/${name}`);
  const duplicated =
    /^(desktop|mobile390|mobile360|landscape)-(off|a|b)-(noon|night|rain|mist)-(overview|medium|ground)\.jpg$/.test(
      name,
    );
  const retain = !duplicated || /-a-noon-medium\.jpg$/.test(name);
  files.push({
    name,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    retained: retain,
  });
  if (!retain) await unlink(`${dir}/${name}`);
}
await writeFile(
  `${root}/screenshot-manifest.json`,
  JSON.stringify({ matrixCases: 144, files }, null, 2),
);
console.log(
  `Archived ${matrix.length} numeric cases, retained ${files.filter((f) => f.retained).length} landscape JPEGs`,
);
