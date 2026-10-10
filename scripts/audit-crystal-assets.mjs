import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base = 'public/assets/jelly-oasis/landmarks/overgrown-ruin/';
const out = 'artifacts/jelly-oasis/crystal-accent-detail-v1/';
const hash = (b) => createHash('sha256').update(b).digest('hex');
const results = { preserved: {}, variants: {} };
const tracked = execFileSync('git', ['ls-files', base], { encoding: 'utf8' })
  .trim()
  .split(/\r?\n/);
for (const file of tracked) {
  const before = execFileSync('git', ['show', 'HEAD:' + file], {
    maxBuffer: 20 * 1024 * 1024,
  });
  const after = await readFile(file);
  if (file.endsWith('.json'))
    assert.deepEqual(JSON.parse(after), JSON.parse(before), file);
  else assert.equal(hash(after), hash(before), file);
  results.preserved[file] = hash(after);
}
for (const label of ['A', 'B', 'C']) {
  const name = 'Crystal_Blockout_' + label;
  for (const detail of [false, true]) {
    const file = detail
      ? 'crystal-accent-detail-v1/' + name + '_Detail_v1.glb'
      : name + '.glb';
    const b = await readFile(base + file);
    assert.equal(b.toString('ascii', 0, 4), 'glTF');
    const g = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
    const primitives = g.meshes.flatMap((m) => m.primitives);
    const triangles = primitives.reduce(
      (sum, p) => sum + g.accessors[p.indices].count / 3,
      0,
    );
    const positions = primitives.map((p) => g.accessors[p.attributes.POSITION]);
    const bounds = [
      [0, 1, 2].map((i) => Math.min(...positions.map((p) => p.min[i]))),
      [0, 1, 2].map((i) => Math.max(...positions.map((p) => p.max[i]))),
    ];
    assert.equal(triangles, detail ? 102 : 66);
    assert.equal(g.textures?.length ?? 0, 0);
    assert.ok(g.materials.every((m) => !m.alphaMode || m.alphaMode === 'OPAQUE'));
    for (const node of g.nodes) {
      assert.ok(!node.translation || node.translation.every((v) => v === 0));
      assert.ok(!node.scale || node.scale.every((v) => v === 1));
      assert.ok(
        !node.rotation || node.rotation.every((v, i) => v === (i === 3 ? 1 : 0)),
      );
    }
    if (detail) assert.equal(g.scenes.length, 1);
    results.variants[file] = {
      bytes: b.length,
      sha256: hash(b),
      triangles,
      boundsGltf: bounds,
      scenes: g.scenes.length,
      nodes: g.nodes,
      materials: g.materials,
      emissiveTriangles: primitives
        .filter((p) => g.materials[p.material].emissiveFactor?.some((v) => v > 0))
        .reduce((sum, p) => sum + g.accessors[p.indices].count / 3, 0),
    };
  }
}
const source = await readFile(
  'artifacts/jelly-oasis/pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend',
);
const preserved = await readFile(
  'artifacts/jelly-oasis/modeling-review-before-crystal-v1/source-preserved.blend',
);
assert.equal(hash(source), hash(preserved));
results.sourceBlendPreserved = true;
await writeFile(out + 'glb-audit.json', JSON.stringify(results, null, 2));
console.log(
  JSON.stringify({
    existingFilesPreserved: tracked.length,
    sourceBlendPreserved: true,
    variants: Object.fromEntries(
      Object.entries(results.variants).map(([k, v]) => [
        k,
        {
          triangles: v.triangles,
          bytes: v.bytes,
          emissiveTriangles: v.emissiveTriangles,
        },
      ]),
    ),
  }),
);
