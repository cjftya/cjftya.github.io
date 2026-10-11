import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Mesh, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import {
  sampleGround,
  sampleOriginalGround,
  landmarkWorldPoint,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
const directory = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function assets() {
  const layout = await readFile(resolve(directory, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const b = await readFile(resolve(directory, url.split('/overgrown-ruin/').at(-1)!));
    return new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      '',
    );
  });
}
it('replaces the original floor, stitches a manifold terrain and queries its exact triangles', async () => {
  await assets();
  const config = { ...DEFAULT_TERRAIN_CONFIG },
    terrain = createTerrain(config),
    original = terrain.geometry;
  const before = await createOvergrownRuin(config, true, true, true, 'v2', true, {
    tree: true,
    pond: true,
    cliff: true,
  });
  const after = await createOvergrownRuin(
    config,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true },
    { water: true, waterfall: true, realWater: true, continuous: true },
    terrain,
  );
  const s = after.excavationSnapshot()!,
    water = after.waterEffects!.snapshot();
  expect(s.excavationDepth).toBeGreaterThan(1.7);
  expect(s.removedTerrainTriangles).toBeGreaterThan(0);
  expect(water.flightDuration).toBe(0);
  expect(water.version).toBe(7);
  for (const [name, c] of Object.entries(before.contact))
    if (name !== 'PondEdge_Blockout') expect(after.contact[name]).toEqual(c);
  const index = terrain.geometry.index!,
    p = terrain.geometry.attributes.position!,
    edges = new Map<string, number>();
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i),
      b = index.getX(i + 1),
      c = index.getX(i + 2);
    const ab = new Vector3()
        .fromBufferAttribute(p, b)
        .sub(new Vector3().fromBufferAttribute(p, a)),
      ac = new Vector3()
        .fromBufferAttribute(p, c)
        .sub(new Vector3().fromBufferAttribute(p, a));
    expect(ab.cross(ac).y).toBeGreaterThan(0);
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const k = u! < v! ? `${u}:${v}` : `${v}:${u}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
    }
  }
  for (const [key, n] of edges) {
    expect(n).toBeLessThanOrEqual(2);
    if (n === 1) {
      const [a, b] = key.split(':').map(Number);
      expect(
        [0, 2].some(
          (axis) =>
            Math.abs(p.array[a! * 3 + axis]!) === 160 &&
            p.array[a! * 3 + axis] === p.array[b! * 3 + axis],
        ),
      ).toBe(true);
    }
  }
  const ray = new Raycaster(),
    bounds = s.excavationBounds;
  let maxError = 0;
  for (let i = 0; i < 700; i++) {
    const x = bounds.x0 + (bounds.x1 - bounds.x0) * (((i + 0.137) * 0.6180339) % 1),
      z = bounds.z0 + (bounds.z1 - bounds.z0) * (((i + 0.137) * 0.4142135) % 1);
    ray.set(new Vector3(x, 100, z), new Vector3(0, -1, 0));
    const hits = ray.intersectObject(terrain);
    expect(hits.length).toBe(1);
    const error = Math.abs(hits[0]!.point.y - sampleGround(x, z, config));
    maxError = Math.max(error, maxError);
    expect(error).toBeLessThan(0.00001);
  }
  for (let i = 0; i < s.channelPath.length; i++) {
    const point = s.channelPath[i]!;
    expect(point[1]! - s.channelFloorHeight[i]!).toBeGreaterThan(0.17);
    if (i) expect(point[1]!).toBeLessThanOrEqual(s.channelPath[i - 1]![1]!);
  }
  // Protected route and root footprint samples retain their previous triangle height.
  for (const [x, z] of [
    [-12, -2],
    [-12, -10],
    [15, -6],
    [0, 20],
    [0, 27],
    [-31, 0],
    [31, 0],
    [15, 19],
    [-15, 12],
    [9, -20],
  ]) {
    const w = landmarkWorldPoint(x!, z!, after.placement);
    expect(sampleGround(w.x, w.z, config)).toBeCloseTo(
      sampleOriginalGround(w.x, w.z, config),
      5,
    );
  }
  expect(Math.max(...s.shorelineGaps)).toBeLessThan(0.00001);
  expect(s.phase2.shoreRockZones.length).toBeGreaterThan(0);
  expect(s.phase2.shoreCrystalZones.every((p) => p.waterDepth === 0)).toBe(true);
  expect(s.phase2.underwaterCrystalZones.every((p) => p.waterDepth > 0.6)).toBe(true);
  let channelVertexClearance = Infinity;
  after.waterEffects!.group.getObjectByName('ExcavatedChannelWater')!.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const p = o.geometry.attributes.position!;
    for (let i = 0; i < p.count; i++)
      channelVertexClearance = Math.min(
        channelVertexClearance,
        p.getY(i) - after.localGround(p.getX(i), p.getZ(i)),
      );
  });
  expect(channelVertexClearance).toBeGreaterThan(0.01);
  const audit = auditLandmark(after);
  for (const route of ['loop', 'clearing', 'approach', 'passage'] as const)
    expect(audit[route].clear).toBe(true);
  const visibleRocks: Mesh[] = [];
  after.assets.modules.get('PondEdge_Blockout')!.traverse((o) => {
    if (o instanceof Mesh && o.visible) visibleRocks.push(o);
  });
  expect(visibleRocks.length).toBeGreaterThan(5);
  const disposed = vi.fn();
  terrain.geometry.addEventListener('dispose', disposed);
  after.place({ ...after.placement, position: { ...after.placement.position } });
  expect(disposed).toHaveBeenCalledOnce();
  expect(after.excavationSnapshot()!.excavationDepth).toBeCloseTo(s.excavationDepth, 6);
  await mkdir('artifacts/jelly-oasis/basin-watercourse-v1', { recursive: true });
  await writeFile(
    'artifacts/jelly-oasis/basin-watercourse-v1/geometry-qa.json',
    JSON.stringify(
      {
        topology: 'manifold; no interior boundary edges; all faces +Y',
        heightQueryMaxError: maxError,
        channelVertexClearance,
        routeAudit: audit,
        snapshot: after.excavationSnapshot(),
        water: after.waterEffects!.snapshot(),
      },
      null,
      2,
    ),
  );
  after.dispose();
  expect(terrain.geometry).toBe(original);
  expect(sampleGround(70, 58, config)).toBe(sampleOriginalGround(70, 58, config));
  before.dispose();
  terrain.geometry.dispose();
  terrain.material.dispose();
}, 30000);
it('excavation-only mode hides the actual water and restores the original terrain on disposal', async () => {
  await assets();
  const config = { ...DEFAULT_TERRAIN_CONFIG },
    terrain = createTerrain(config),
    original = terrain.geometry;
  const l = await createOvergrownRuin(
    config,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true },
    { water: false, waterfall: false, basinOnly: true },
    terrain,
  );
  expect(l.pond.visible).toBe(false);
  expect(l.waterEffects).toBeUndefined();
  expect(l.excavationSnapshot()).not.toBeNull();
  l.dispose();
  expect(terrain.geometry).toBe(original);
  terrain.geometry.dispose();
  terrain.material.dispose();
}, 30000);
