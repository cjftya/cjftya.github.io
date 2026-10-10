import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = 'public/assets/jelly-oasis/landmarks/overgrown-ruin/';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const result = { baseline: '04e2551', preserved: {}, variants: {} };
for (const name of await readdir(base)) {
  if (!name.endsWith('.glb') || name === 'Tree_Landmark_Detail_v1.glb') continue;
  const actual = await readFile(base + name),
    original = execFileSync('git', ['show', '04e2551:' + base + name], {
      maxBuffer: 20 * 1024 * 1024,
    });
  assert.equal(hash(actual), hash(original));
  result.preserved[name] = hash(actual);
}
for (const name of ['Tree_Landmark_Blockout', 'Tree_Landmark_Detail_v1']) {
  const b = await readFile(base + name + '.glb');
  assert.equal(b.toString('ascii', 0, 4), 'glTF');
  const g = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
  const primitives = g.meshes.flatMap((m) => m.primitives);
  const triangles = primitives.reduce(
    (s, p) => s + g.accessors[p.indices].count / 3,
    0,
  );
  result.variants[name] = {
    bytes: b.length,
    triangles,
    meshes: g.meshes.length,
    primitives: primitives.length,
    materials: g.materials.length,
    textures: g.textures?.length ?? 0,
    nodes: g.nodes,
  };
  if (name.includes('Detail')) {
    assert.ok(triangles <= 15000);
    assert.equal(g.textures?.length ?? 0, 0);
    for (const n of g.nodes) {
      assert.ok(!n.translation || n.translation.every((v) => v === 0));
      assert.ok(!n.scale || n.scale.every((v) => v === 1));
    }
  }
}
await writeFile(
  'artifacts/jelly-oasis/landmark-tree-detail-v1/glb-audit.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result.variants, null, 2));
