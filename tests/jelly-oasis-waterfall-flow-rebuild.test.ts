import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import {
  traceAttachedFlow,
  makeChannel,
} from '../src/jelly-oasis/landmark/water/continuousFlow';
import {
  ballisticPoint,
  traceFallingFlow,
} from '../src/jelly-oasis/landmark/water/fallingFlow';
import { solveFlow } from '../src/jelly-oasis/landmark/water/flowDynamics';
import type { createRealWaterEffects } from '../src/jelly-oasis/landmark/water/createRealWaterEffects';
type State = ReturnType<ReturnType<typeof createRealWaterEffects>['snapshot']>;
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('uses root-local gravity and an unaltered initial velocity', () => {
  const p = new Vector3(1, 5, 2),
    v = new Vector3(0, -1, 2);
  const a = ballisticPoint(p, v, 9.81 / 2, 1);
  expect(a.toArray()).toEqual([1, 1.5474999999999999, 4]);
  expect(v.toArray()).toEqual([0, -1, 2]);
  expect(p.toArray()).toEqual([1, 5, 2]);
});
it('lands a narrow measured shelf film on the original channel, preserves seam/fallback, and disposes rebuilds', async () => {
  const dir = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
  const layout = await readFile(resolve(dir, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const b = await readFile(
      resolve(dir, String(url).split('/overgrown-ruin/').at(-1)!),
    );
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
    {
      water: true,
      waterfall: true,
      realWater: true,
      continuous: true,
      dynamics: true,
      fallingFlow: true,
      gpgpuPrototype: true,
      flowPaths: true,
    },
    terrain,
    // Legacy falling-film isolation: vegetation/pond integration is covered separately.
    'off',
    'off',
  );
  try {
    const water = l.waterEffects!,
      s = water.snapshot() as State;
    expect(s.flowError).toBeNull();
    expect(s.fallingFlow!.status).toBe('GEOMETRY_PASS');
    expect(s.solver).toBe('cpu-v8');
    expect(s.fallingFlow!.paths).toHaveLength(3);
    expect(s.seam!.heightDifference).toBe(0);
    expect(s.seam!.overlappingFaces).toBe(false);
    const cliff = l.assets.modules.get('Cliff_Waterfall_A')!;
    const attached = traceAttachedFlow(l.root, cliff),
      i = s.fallingFlow!.releaseIndex;
    const tangent = attached.lanes[3]![i]!.point.clone()
      .sub(attached.lanes[3]![i - 3]!.point)
      .normalize();
    const speed = solveFlow(attached.lanes[3]!, 0.032, l.root.scale.x)[i]!.speed;
    expect(s.fallingFlow!.paths[1]!.velocity).toEqual(
      tangent.multiplyScalar(speed).toArray(),
    );
    for (const p of s.fallingFlow!.paths) {
      expect(p.duration).toBeGreaterThan(1);
      expect(p.clearance).toBeGreaterThan(0.015);
      expect(
        ballisticPoint(
          new Vector3().fromArray(p.launch),
          new Vector3().fromArray(p.velocity),
          s.fallingFlow!.gravity,
          p.duration,
        ).toArray(),
      ).toEqual(p.impact);
    }
    const film = water.group.getObjectByName('FallingFilm-1') as Mesh;
    const rock = water.group.getObjectByName('RockStreamlet-1') as Mesh;
    const r = rock.geometry.attributes.position!,
      f = film.geometry.attributes.position!;
    for (let j = 0; j < 5; j++)
      expect(
        new Vector3()
          .fromBufferAttribute(f, j)
          .distanceTo(new Vector3().fromBufferAttribute(r, r.count - 5 + j)),
      ).toBeLessThan(1e-5);
    const disposed = vi.fn();
    film.geometry.addEventListener('dispose', disposed);
    const before = l.excavationSnapshot()!.channelPath;
    for (let k = 0; k < 3; k++)
      l.place({ ...l.placement, position: { ...l.placement.position } });
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(l.excavationSnapshot()!.channelPath).toEqual(before);
    const snapshot = water.snapshot() as State;
    expect(snapshot.fallingFlow!.paths).toEqual(s.fallingFlow!.paths);
    if (!('setFlowRate' in water)) throw new Error('Expected flow controls');
    water.setFlowRate(0);
    expect(water.group.visible).toBe(false);
    water.setFlowRate(3);
    expect(water.group.visible).toBe(true);
    water.update(0.05, 12, false);
    const elapsed = water.snapshot().elapsed;
    water.update(0.05, 12, true);
    expect(water.snapshot().elapsed).toBe(elapsed);
    const sides: number[] = [];
    cliff.traverse((o) => {
      if (o instanceof Mesh) sides.push(o.material.side);
    });
    expect(() =>
      traceFallingFlow(
        l.root,
        cliff,
        makeChannel(
          attached.launch,
          l.excavationSnapshot()!.inletPosition![1]!,
          l.excavationSnapshot()!.channelPath.at(-1)![2]!,
          true,
        ),
        attached,
        l.localGround,
        () => false,
      ),
    ).toThrow(/GEOMETRY_BLOCKER/);
    const after: number[] = [];
    cliff.traverse((o) => {
      if (o instanceof Mesh) after.push(o.material.side);
    });
    expect(after).toEqual(sides);
  } finally {
    l.dispose();
    expect(terrain.geometry).toBe(original);
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 120000);
