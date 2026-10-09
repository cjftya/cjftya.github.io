import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const dir = 'public/assets/jelly-oasis/landmarks/overgrown-ruin';
const names = [
  'Ruin_Arch_A',
  'Ruin_Wall_A',
  'Ruin_BrokenWall_A',
  'Root_Large_A',
  'Root_Tree_Base_Blockout',
];
const result = { preserved: {}, modules: {} };
for (const file of [
  ...names.map((n) => `${n}.glb`),
  'layout.json',
  'Cliff_Waterfall_A_Detail_v1.glb',
]) {
  const bytes = await readFile(resolve(dir, file));
  const original = execFileSync('git', ['show', `eed7deb:${dir}/${file}`]);
  if (file.endsWith('.json'))
    assert.deepEqual(JSON.parse(bytes), JSON.parse(original), file);
  else assert.ok(bytes.equals(original), file);
  result.preserved[file] = createHash('sha256').update(bytes).digest('hex');
}
for (const name of names) {
  const bytes = await readFile(resolve(dir, `${name}_Detail_v1.glb`));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert.equal(gltf.nodes[0].name, `${name}_Detail_v1`);
  assert.ok(gltf.nodes.every((n) => !n.translation && !n.rotation && !n.scale));
  assert.equal(gltf.images?.length ?? 0, 0);
  const primitives = gltf.meshes.flatMap((m) => m.primitives);
  const bounds = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (const p of primitives)
    for (let axis = 0; axis < 3; axis++) {
      const position = gltf.accessors[p.attributes.POSITION];
      bounds.min[axis] = Math.min(bounds.min[axis], position.min[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], position.max[axis]);
    }
  result.modules[name] = {
    bytes: bytes.length,
    triangles: primitives.reduce((n, p) => n + gltf.accessors[p.indices].count / 3, 0),
    primitives: primitives.length,
    materials: gltf.materials.length,
    textures: 0,
    bounds,
    dimensions: bounds.max.map((v, i) => v - bounds.min[i]),
    nodes: gltf.nodes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
await writeFile(
  'artifacts/jelly-oasis/ruin-root-night-v1/glb-audit.json',
  JSON.stringify(result, null, 2),
);
console.log(
  'Original GLB/layout/cliff hashes preserved; five detail GLBs: identity transforms, named nodes, no textures.',
);
