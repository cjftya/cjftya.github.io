import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Mesh, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
const directory = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('connects measured rock flow and gravity fall to the shared basin and disposes rebuilt geometry', async () => {
  const layout = await readFile(resolve(directory, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const b = await readFile(
      resolve(directory, String(url).split('/overgrown-ruin/').at(-1)!),
    );
    return new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      '',
    );
  });
  const ruin = await createOvergrownRuin(
    DEFAULT_TERRAIN_CONFIG,
    true,
    true,
    true,
    'v2',
    false,
    { tree: true, pond: true, cliff: true, water: 'soft' },
    { water: true, waterfall: true, realistic: true, realWater: true },
  );
  const water = ruin.waterEffects!;
  const state = water.snapshot();
  expect(state.version).toBe(6);
  expect('rockFlowCount' in state && state.rockFlowCount).toBe(7);
  expect('rockLength' in state && state.rockLength).toBeGreaterThan(4);
  expect(state.impact).toEqual(state.reflection!.impact.slice(0, 2));
  const end = new Vector3().fromArray(state.path.at(-1)!);
  expect(end.y).toBeCloseTo(ruin.pondHeight, 5);
  const ray = new Raycaster(
    end.clone().add(new Vector3(0, 20, 0)),
    new Vector3(0, -1, 0),
  );
  expect(ray.intersectObject(ruin.pond).length).toBeGreaterThan(0);
  const retired: Mesh[] = [];
  water.group.traverse((o) => {
    if (o instanceof Mesh) retired.push(o);
  });
  const listeners = retired.map((o) => {
    const listener = vi.fn();
    o.geometry.addEventListener('dispose', listener);
    return listener;
  });
  water.rebuild();
  expect(listeners.every((l) => l.mock.calls.length === 1)).toBe(true);
  water.update(0.1, 12, false);
  const before = water.snapshot().elapsed;
  water.update(0.1, 12, true);
  expect(water.snapshot().elapsed).toBe(before);
  ruin.dispose();
}, 30000);
