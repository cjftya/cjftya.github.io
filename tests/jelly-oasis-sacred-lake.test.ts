import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Box3, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { polygonDistance } from '../src/jelly-oasis/terrain/excavateTerrain';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
// Full world-tree geometry audit and repeated CPU terrain rebuilds need extra time on CI.
it('uses the expanded contour for the rendered bed, rooted ecology, exclusion and stable CPU rebuilds', async () => {
  const dir = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
  const layout = await readFile(resolve(dir, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const bytes = await readFile(resolve(dir, url.split('/overgrown-ruin/').at(-1)!));
    return new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      '',
    );
  });
  const config = createWorldConfig(),
    terrain = createTerrain(config),
    original = terrain.geometry;
  const oasis = await createOvergrownRuin(
    config,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true, sacred: true },
    { pondOnly: true, water: true, waterfall: false, forceCpu: true },
    terrain,
  );
  try {
    const guide = oasis.assets.pondGuide!,
      lake = oasis.sacredLakeSnapshot()!;
    expect(oasis.assets.modules.size).toBe(16);
    expect(guide.positions).toHaveLength(57);
    expect(lake.area / lake.originalArea).toBeGreaterThan(1.15);
    expect(lake.area / lake.originalArea).toBeLessThan(1.25);
    expect(oasis.excavationSnapshot()!.maxWaterDepth).toBeCloseTo(2.8, 4);
    const originalEcology = oasis.lakeEcology!.snapshot();
    expect(originalEcology.rocks).toBe(5);
    expect(originalEcology.pads).toBeGreaterThan(0);
    for (const p of originalEcology.anchors) {
      expect(polygonDistance(p.x, p.z, guide.positions)).toBeGreaterThan(0);
      if (p.kind === 'plant') expect(p.y).toBeCloseTo(oasis.localGround(p.x, p.z), 5);
    }
    const worldTree = oasis.worldTree!;
    const treeBounds = new Box3().setFromObject(worldTree.group);
    expect(treeBounds.max.y - treeBounds.min.y).toBeGreaterThan(65);
    expect(worldTree.footprints().length).toBeGreaterThanOrEqual(6);
    expect(oasis.root.getObjectByName('MagicalSanctuary')).toBeUndefined();
    const oldTreeGeometry = (worldTree.group.children[0] as Mesh).geometry;
    const treeDisposed = vi.fn();
    oldTreeGeometry.addEventListener('dispose', treeDisposed);
    worldTree.group.traverse((o) => {
      if (o instanceof Mesh) {
        expect(o.castShadow).toBe(true);
        expect(o.receiveShadow).toBe(true);
        const g = o.geometry,
          p = g.attributes.position!,
          normal = g.attributes.normal!;
        let finite = true,
          minArea = Infinity;
        const a = new Vector3(),
          b = new Vector3(),
          c = new Vector3();
        for (let i = 0; i < p.count; i++) {
          finite &&= [
            p.getX(i),
            p.getY(i),
            p.getZ(i),
            normal.getX(i),
            normal.getY(i),
            normal.getZ(i),
          ].every(Number.isFinite);
        }
        for (let i = 0; i < p.count; i += 3) {
          a.fromBufferAttribute(p, i);
          b.fromBufferAttribute(p, i + 1);
          c.fromBufferAttribute(p, i + 2);
          minArea = Math.min(minArea, b.sub(a).cross(c.sub(a)).length());
        }
        expect(finite, o.name).toBe(true);
        expect(minArea, o.name).toBeGreaterThan(1e-8);
      }
    });
    const audit = auditLandmark(oasis);
    for (const key of ['loop', 'clearing', 'approach', 'passage'] as const)
      expect(audit[key].clear, JSON.stringify(audit[key])).toBe(true);
    const before = Array.from(terrain.geometry.attributes.position!.array);
    for (let i = 0; i < 2; i++)
      oasis.place({ ...oasis.placement, position: { ...oasis.placement.position } });
    expect(treeDisposed).toHaveBeenCalledTimes(1);
    expect(new Box3().setFromObject(worldTree.group)).toEqual(treeBounds);
    expect(Array.from(terrain.geometry.attributes.position!.array)).toEqual(before);
    expect(oasis.lakeEcology!.snapshot()).toEqual(originalEcology);
    const water = oasis.waterEffects!.snapshot();
    expect('solver' in water && water.solver).toBe('cpu-heightfield');
    oasis.isolate('WorldTreePrecinct');
    expect(worldTree.group.visible).toBe(true);
    expect(oasis.lakeEcology!.group.visible).toBe(false);
    oasis.isolate('');
    expect(oasis.lakeEcology!.group.visible).toBe(true);
  } finally {
    oasis.dispose();
    oasis.dispose();
    expect(terrain.geometry).toBe(original);
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 120_000);
