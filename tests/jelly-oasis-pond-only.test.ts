import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { BufferGeometry, Float32BufferAttribute, Vector2, Vector4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CPUPondSurface } from '../src/jelly-oasis/landmark/water/cpuPondSurface';
import { PondImpulseScheduler } from '../src/jelly-oasis/landmark/water/pondImpulseScheduler';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';

function square() {
  const g = new BufferGeometry();
  g.setAttribute(
    'position',
    new Float32BufferAttribute([0, 2, 0, 0, 2, 10, 10, 2, 10, 10, 2, 0], 3),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('schedules reproducible interior impacts and smoothly scales rain without catch-up', () => {
  const bounds = new Vector4(0, 0, 10, 10),
    mask = (x: number, z: number) => (x > 2 && z > 2 && x < 8 && z < 8 ? 1 : 0);
  const run = (intensity: number, mobile = false) => {
    const scheduler = new PondImpulseScheduler(bounds, mask, mobile);
    const events: number[][] = [];
    const emit = (p: Vector2, s: number, r: number) => {
      expect(mask(p.x, p.y)).toBe(1);
      events.push([p.x, p.y, s, r]);
      return true;
    };
    for (let i = 0; i < 600; i++) scheduler.update(1 / 60, intensity, false, emit);
    return { scheduler, events, emit };
  };
  const clear = run(0),
    light = run(0.425),
    rain = run(0.85),
    mobile = run(0.85, true);
  expect(clear.events).toEqual(run(0).events);
  expect(clear.scheduler.snapshot().rain).toBe(0);
  expect(clear.events.length).toBeGreaterThanOrEqual(2);
  expect(rain.scheduler.snapshot().rain).toBeGreaterThanOrEqual(79);
  expect(light.scheduler.snapshot().rain).toBeLessThan(rain.scheduler.snapshot().rain);
  expect(mobile.scheduler.snapshot().rain).toBeLessThanOrEqual(40);
  const before = rain.events.length;
  rain.scheduler.update(300, 0.85, false, rain.emit);
  rain.scheduler.update(10, 0.85, true, rain.emit);
  expect(rain.events.length).toBe(before);
  expect(new Set(rain.events.map((e) => `${e[0]},${e[1]}`)).size).toBeGreaterThan(30);
});
it('CPU fallback propagates real height waves, pins dry cells and bounds its queue', () => {
  const g = square(),
    cpu = new CPUPondSurface(g, (x) => (x > 8 ? 3 : 0), 2);
  expect(cpu.impulse(new Vector2(9, 5))).toBe(false);
  expect(cpu.impulse(new Vector2(5, 5), 0.08, 0.8)).toBe(true);
  cpu.update(1 / 60);
  const start = cpu.readHeights();
  for (let i = 0; i < 60; i++) cpu.update(1 / 60);
  const end = cpu.readHeights();
  expect(Array.from(end)).not.toEqual(Array.from(start));
  expect(Math.max(...end)).toBeGreaterThan(0);
  for (let j = 0; j < cpu.n; j++)
    for (let i = 0; i < cpu.n; i++) {
      if ((i / cpu.n) * 10 > 8) expect(Math.abs(end[(j * cpu.n + i) * 4]!)).toBe(0);
    }
  for (let i = 0; i < 4; i++) expect(cpu.impulse()).toBe(true);
  expect(cpu.impulse()).toBe(false);
  cpu.configure({ paused: true });
  const paused = cpu.readHeights();
  cpu.update(2);
  expect(cpu.readHeights()).toEqual(paused);
  cpu.reset();
  expect(Math.max(...cpu.readHeights())).toBe(0);
  cpu.dispose();
  cpu.dispose();
  g.dispose();
});
it('loads the real 16 modules with a visible independent basin, no channel and stable rebuilds', async () => {
  const directory = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
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
  const config = { ...DEFAULT_TERRAIN_CONFIG },
    terrain = createTerrain(config);
  const l = await createOvergrownRuin(
    config,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true },
    { pondOnly: true, water: true, waterfall: false, forceCpu: true },
    terrain,
  );
  try {
    expect(l.assets.modules.size).toBe(16);
    expect(l.pond.visible).toBe(true);
    expect(l.excavationSnapshot()!.channelPath).toEqual([]);
    expect(l.excavationSnapshot()!.flowSegments).toEqual(['pond']);
    const owner = l.waterEffects!;
    for (let i = 0; i < 3; i++) {
      l.place({ ...l.placement, position: { ...l.placement.position } });
      const s = owner.snapshot();
      expect('rockFlowCount' in s && s.rockFlowCount).toBe(0);
      expect(s.droplets).toBe(0);
      if ('impulses' in s) expect(s.impulses.candidates).toBeGreaterThan(10);
      owner.update(1 / 60, 12, false, '', 0.85);
    }
  } finally {
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
});
