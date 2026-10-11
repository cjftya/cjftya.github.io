import type { createRealWaterEffects } from '../src/jelly-oasis/landmark/water/createRealWaterEffects';
type DynamicsSnapshot = ReturnType<
  ReturnType<typeof createRealWaterEffects>['snapshot']
>;
import { expect, it } from 'vitest';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { ShallowWater } from '../src/jelly-oasis/landmark/water/shallowWater';
import { solveFlow } from '../src/jelly-oasis/landmark/water/flowDynamics';
import { makeChannel } from '../src/jelly-oasis/landmark/water/continuousFlow';
import { continuousSurface } from '../src/jelly-oasis/landmark/water/continuousSurface';
import { mkdirSync, writeFileSync } from 'node:fs';
const source = {
  point: new Vector2(0, -3),
  direction: new Vector2(0, 1),
  width: 2,
  speed: 1.4,
  discharge: 0.224,
};
it('accelerates down actual gravity and slows at widening inlet while conserving discharge', () => {
  const rock = [0, 1, 2, 3].map((i) => ({
    point: new Vector3(0, 8 - i * 2, 0.1 * i),
    normal: new Vector3(0, 0, 1),
    width: 0.22,
  }));
  const r = solveFlow(rock, 0.032);
  expect(r.at(-1)!.speed).toBeGreaterThan(r[0]!.speed * 3);
  const channel = makeChannel(new Vector3(0, 2, -10), 0, -1, true).map((s) => ({
    ...s,
    normal: new Vector3(0, 1, 0),
  }));
  const c = solveFlow(channel, 0.224, 1, r.at(-1)!.speed);
  expect(c.at(-1)!.speed).toBeLessThan(c[0]!.speed);
  for (const s of [...r, ...c])
    expect(s.width * s.depth * s.speed).toBeCloseTo(s.discharge, 10);
  expect(channel.at(-1)!.point.y).toBe(0);
  expect(channel.at(-2)!.point.y).toBe(0);
});
it('removes overlap instead of concealing the pond joint with a second surface', () => {
  const pond = new BufferGeometry();
  pond.setAttribute(
    'position',
    new Float32BufferAttribute([-3, 0, -2, 3, 0, -2, 3, 0, 4, -3, 0, 4], 3),
  );
  pond.setIndex([0, 2, 1, 0, 3, 2]);
  const channel = makeChannel(new Vector3(0, 1, -8), 0, 0, true),
    surface = continuousSurface(pond, channel);
  const p = surface.attributes.position!,
    idx = surface.index!;
  for (let zi = 0; zi < 100; zi++)
    for (let xi = 0; xi < 17; xi++) {
      const x = -2.99 + xi * 0.37371,
        z = -7.981 + zi * 0.11937;
      let hits = 0;
      for (let k = 0; k < idx.count; k += 3) {
        const a = idx.getX(k),
          b = idx.getX(k + 1),
          c = idx.getX(k + 2),
          ax = p.getX(a),
          az = p.getZ(a),
          bx = p.getX(b),
          bz = p.getZ(b),
          cx = p.getX(c),
          cz = p.getZ(c);
        const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz),
          u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det,
          v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det;
        if (u > 1e-6 && v > 1e-6 && u + v < 1 - 1e-6) hits++;
      }
      expect(hits).toBeLessThanOrEqual(1);
      if (z > -2 && z < 4 && Math.abs(x) < 3) expect(hits).toBe(1);
    }
  pond.dispose();
  surface.dispose();
});
it('stays finite and volume balanced for 60 seconds at zero, standard and high flow', () => {
  const results = [];
  for (const rate of [0, 1, 2]) {
    const s = new ShallowWater(
      64,
      new Vector4(-6, -5, 12, 16),
      (x, z) => (Math.abs(x) < 5 && z < 10 ? 1.2 : 0),
      source,
    );
    s.flowRate = rate;
    const samples = [];
    for (let i = 0; i < 600; i++) {
      s.update(0.1);
      if (i % 100 === 99) samples.push(s.snapshot());
    }
    const state = s.snapshot();
    results.push({ rate, samples });
    expect(state.elapsed).toBeGreaterThan(59.8);
    expect(state.maxHeight).toBeLessThan(0.3);
    expect(state.maxSpeed).toBeLessThanOrEqual(4);
    expect(Math.abs(state.massError)).toBeLessThan(0.0001);
    expect(state.cfl).toBeLessThan(0.5);
    expect(s.height.every(Number.isFinite)).toBe(true);
    expect(s.u.every(Number.isFinite)).toBe(true);
    if (rate === 0) expect(state.maxHeight).toBe(0);
    else expect(state.maxHeight).toBeGreaterThan(0.001);
    const before = s.snapshot().elapsed;
    s.update(30, true);
    expect(s.snapshot().elapsed).toBe(before);
    s.update(Infinity);
    expect(s.snapshot().elapsed).toBe(before);
    s.update(100);
    expect(s.snapshot().elapsed - before).toBeLessThan(0.11);
    s.flowRate = 0;
    for (let i = 0; i < 300; i++) s.update(0.1);
    if (rate > 0) expect(s.snapshot().heightEnergy).toBeLessThan(state.heightEnergy);
    s.dispose();
  }
  expect(results[2]!.samples.at(-1)!.heightEnergy).toBeGreaterThan(
    results[1]!.samples.at(-1)!.heightEnergy,
  );
  mkdirSync('artifacts/jelly-oasis/water-dynamics-v1', { recursive: true });
  writeFileSync(
    'artifacts/jelly-oasis/water-dynamics-v1/stability.json',
    JSON.stringify(results, null, 2),
  );
}, 30000);
it('repeats identical inputs and reflects waves at dry boundaries without leaking', () => {
  const a = new ShallowWater(
      32,
      new Vector4(-6, -5, 12, 16),
      (x) => (Math.abs(x) < 4 ? 0.5 : 0),
      source,
    ),
    b = new ShallowWater(
      32,
      new Vector4(-6, -5, 12, 16),
      (x) => (Math.abs(x) < 4 ? 0.5 : 0),
      source,
    );
  for (let i = 0; i < 120; i++) {
    a.update(1 / 60);
    b.update(1 / 60);
  }
  expect(a.height).toEqual(b.height);
  for (let k = 0; k < a.depth.length; k++)
    if (a.depth[k] === 0) expect(a.height[k]).toBe(0);
  a.dispose();
  b.dispose();
});
it('rebuilds the v8 inlet on the original guide and keeps module placement and terrain intact', async () => {
  const { readFile } = await import('node:fs/promises');
  const { vi } = await import('vitest');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { createOvergrownRuin } =
    await import('../src/jelly-oasis/landmark/createOvergrownRuin');
  const { createTerrain } = await import('../src/jelly-oasis/terrain/createTerrain');
  const { DEFAULT_TERRAIN_CONFIG } =
    await import('../src/jelly-oasis/terrain/heightfield');
  const dir = 'public/assets/jelly-oasis/landmarks/overgrown-ruin/';
  const layout = await readFile(dir + 'layout.json', 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const b = await readFile(dir + url.split('/overgrown-ruin/').at(-1)!);
    return new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      '',
    );
  });
  const terrain = createTerrain(DEFAULT_TERRAIN_CONFIG),
    original = terrain.geometry;
  const l = await createOvergrownRuin(
    DEFAULT_TERRAIN_CONFIG,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true },
    { water: true, waterfall: true, realWater: true, continuous: true, dynamics: true },
    terrain,
  );
  try {
    const s = l.waterEffects!.snapshot() as DynamicsSnapshot;
    expect(s.version).toBe(8);
    if (!('fluid' in s)) throw new Error('Expected dynamics snapshot');
    expect(l.assets.modules.size).toBe(16);
    expect(s.seam!.heightDifference).toBe(0);
    expect(s.seam!.overlappingFaces).toBe(false);
    expect(
      l.waterEffects!.group.getObjectByName('ExcavatedChannelWater'),
    ).toBeUndefined();
    const initial = l.excavationSnapshot()!;
    for (let i = 0; i < 3; i++)
      l.place({ ...l.placement, position: { ...l.placement.position } });
    expect(l.excavationSnapshot()!.channelPath).toEqual(initial.channelPath);
    expect(l.excavationSnapshot()!.terrainPatchTriangles).toBe(
      initial.terrainPatchTriangles,
    );
    const rebuilt = l.waterEffects!.snapshot() as DynamicsSnapshot;
    if (!('fluid' in rebuilt)) throw new Error('Expected rebuilt dynamics snapshot');
    expect(rebuilt.fluid!.resolution).toBe(128);
    const bytes = rebuilt.fluid!.textureBytes;
    expect(bytes).toBe(65536);
    mkdirSync('artifacts/jelly-oasis/water-dynamics-v1', { recursive: true });
    writeFileSync(
      'artifacts/jelly-oasis/water-dynamics-v1/phase2-placement.json',
      JSON.stringify(l.excavationSnapshot()!.phase2, null, 2),
    );
  } finally {
    l.dispose();
    expect(terrain.geometry).toBe(original);
    terrain.geometry.dispose();
    terrain.material.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
}, 30000);
