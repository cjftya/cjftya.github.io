import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mesh, Raycaster, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import {
  LANDMARK_CANDIDATES,
  OVERGROWN_RUIN_CONFIG,
} from '../src/jelly-oasis/landmark/landmarkConfig';
import {
  landmarkWorldPoint,
  sampleGround,
  surveySite,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
import { loadLandmarkAssets } from '../src/jelly-oasis/landmark/loadLandmarkAssets';

const directory = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
async function loadFile(url: string) {
  const file = await readFile(resolve(directory, url.split('/').at(-1)!));
  return new GLTFLoader().parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    '',
  );
}
async function useLocalAssets() {
  const layout = await readFile(resolve(directory, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(layout)),
  );
  return vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(loadFile);
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('landmark integration against real exported GLBs', () => {
  it('samples the rendered triangles, including both halves of a grid cell', () => {
    const terrain = createTerrain();
    terrain.updateMatrixWorld();
    const ray = new Raycaster();
    for (const [x, z] of [
      [74, 57],
      [76.2, 61.1],
      [79.2, 63.1],
      [-98.3, -22.8],
      [3.7, -100.5],
    ]) {
      ray.set(new Vector3(x!, 100, z!), new Vector3(0, -1, 0));
      expect(sampleGround(x!, z!)).toBeCloseTo(
        ray.intersectObject(terrain)[0]!.point.y,
        4,
      );
    }
    terrain.geometry.dispose();
    terrain.material.dispose();
    expect(
      landmarkWorldPoint(2, 3, {
        position: { x: 10, z: 20 },
        rotationY: Math.PI / 2,
        scale: 1,
      }),
    ).toEqual({ x: 13, z: 18 });
  });
  it('prefers the basin without consuming the central meadow', () => {
    const [basin, west, north] = LANDMARK_CANDIDATES.map((c) => surveySite(c));
    expect(basin!.pondRelief).toBeLessThan(1);
    expect(west!.pondRelief).toBeGreaterThan(7);
    expect(north!.pondRelief).toBeGreaterThan(10);
    expect(basin!.insideWorld).toBe(true);
    expect(basin!.meadowOverlap).toBeLessThan(0.01);
    expect(basin!.worldAreaFraction).toBeLessThan(0.06);
  });
  it('loads each module at metre scale, keeps routes clear and disposes resources exactly once', async () => {
    const load = await useLocalAssets();
    const landmark = await createOvergrownRuin(DEFAULT_TERRAIN_CONFIG);
    expect(load.mock.calls.slice(0, 3).map((c) => c[0].split('/').at(-1))).toEqual([
      'Rock_Large_A.glb',
      'Ruin_Arch_A.glb',
      'Cliff_Waterfall_A.glb',
    ]);
    expect(landmark.assets.modules.size).toBe(16);
    expect(landmark.assetTriangles).toBe(8002);
    const audit = auditLandmark(landmark);
    for (const result of [audit.loop, audit.clearing, audit.approach, audit.passage])
      expect(result.intersections).toEqual({});
    expect(audit.passage.measuredJambWidth).toBeGreaterThanOrEqual(4.6);
    expect(audit.clearing.diameter).toBe(16);
    expect(audit.pondBankMaxLift).toBeLessThan(1.1);
    expect(audit.contact.Cliff_Waterfall_A!.burial).toBeLessThan(2);
    const original = landmark.assets.modules.get('Rock_Large_A')!.position.clone();
    landmark.place(LANDMARK_CANDIDATES[1]);
    landmark.place(OVERGROWN_RUIN_CONFIG);
    expect(landmark.assets.modules.get('Rock_Large_A')!.position.equals(original)).toBe(
      true,
    );
    landmark.isolate('Ruin_Arch_A');
    expect([...landmark.assets.modules.values()].filter((o) => o.visible)).toHaveLength(
      1,
    );
    expect(landmark.pond.visible).toBe(false);
    landmark.isolate('');
    await landmark.showReference(true);
    expect(
      load.mock.calls.filter((c) => c[0].includes('Overgrown_Oasis')),
    ).toHaveLength(1);
    await landmark.showReference(false);
    await landmark.showReference(true);
    expect(
      load.mock.calls.filter((c) => c[0].includes('Overgrown_Oasis')),
    ).toHaveLength(1);
    const spies = new Map<object, ReturnType<typeof vi.fn>>();
    landmark.root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      for (const resource of [
        o.geometry,
        ...(Array.isArray(o.material) ? o.material : [o.material]),
      ]) {
        if (!spies.has(resource)) {
          const spy = vi.fn();
          resource.addEventListener('dispose', spy);
          spies.set(resource, spy);
        }
      }
    });
    landmark.dispose();
    landmark.dispose();
    for (const spy of spies.values()) expect(spy).toHaveBeenCalledTimes(1);
  });
  it('cleans up successful loads after an error, including late concurrent responses', async () => {
    const load = await useLocalAssets();
    const disposed = vi.fn();
    let successful = 0;
    load.mockImplementation(async (url) => {
      if (url.endsWith('Rock_Large_B.glb')) throw new Error('Injected missing module');
      const gltf = await loadFile(url);
      successful++;
      gltf.scene.traverse((o) => {
        if (o instanceof Mesh) o.geometry.addEventListener('dispose', disposed);
      });
      return gltf;
    });
    await expect(loadLandmarkAssets()).rejects.toThrow('Rock_Large_B.glb');
    expect(successful).toBe(15);
    expect(disposed.mock.calls.length).toBeGreaterThanOrEqual(15);
  });
});
