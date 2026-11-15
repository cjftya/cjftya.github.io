import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { geometryBoundsSteps } from '../src/jelly-oasis/loading/geometryBoundsSteps';
import { CPUPondSurface } from '../src/jelly-oasis/landmark/water/cpuPondSurface';
import { pondMaskSteps } from '../src/jelly-oasis/landmark/water/gpgpuPondSurface';
import { afterEach, expect, it, vi } from 'vitest';
import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import type { WebGLRenderer } from 'three';
import {
  createLoadingMetrics,
  finishSteps,
  runLoadingSteps,
  yieldToBrowser,
} from '../src/jelly-oasis/loading/loadingSteps';
import { prepareLandmark } from '../src/jelly-oasis/loading/prepareLandmark';
import { createTerrainGeometry } from '../src/jelly-oasis/terrain/createTerrain';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import { clipTerrainOutlineSteps } from '../src/jelly-oasis/terrain/terrainOutline';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('lets a queued input task run before construction completes and preserves step order', async () => {
  let clock = 0;
  const phases: number[] = [];
  function* work() {
    for (let i = 0; i < 18; i++) {
      clock += 2;
      phases.push(i);
      yield 'placement';
    }
    return phases.join(',');
  }
  const expected = finishSteps(work());
  phases.length = 0;
  let inputHandled = false;
  setTimeout(() => {
    inputHandled = true;
  }, 0);
  const metrics = createLoadingMetrics();
  const result = await runLoadingSteps(work(), metrics, {
    now: () => clock,
    budgetMs: 6,
    yieldTask: yieldToBrowser,
  });
  expect(inputHandled).toBe(true);
  expect(result).toBe(expected);
  expect(metrics.yields).toBe(6);
  expect(metrics.maxSliceMs).toBe(6);
  expect(metrics.cpuMs).toBe(36);
});
it('uses native scheduler yielding when available', async () => {
  const yieldTask = vi.fn(async () => {});
  vi.stubGlobal('scheduler', { yield: yieldTask });
  await yieldToBrowser();
  expect(yieldTask).toHaveBeenCalledOnce();
});
it('stops at the next checkpoint and runs generator cleanup after cancellation', async () => {
  const abort = new AbortController();
  let disposed = 0,
    iterations = 0;
  function* work() {
    try {
      for (let i = 0; i < 10; i++) {
        iterations++;
        yield 'models';
      }
    } finally {
      disposed++;
    }
  }
  await expect(
    runLoadingSteps(work(), undefined, {
      budgetMs: 0,
      signal: abort.signal,
      yieldTask: async () => abort.abort(),
    }),
  ).rejects.toThrow();
  expect(iterations).toBe(1);
  expect(disposed).toBe(1);
});
it('preserves clipped terrain buffers across real task boundaries', async () => {
  const config = createWorldConfig(192);
  const expected = createTerrainGeometry(config);
  const actual = expected.clone();
  finishSteps(clipTerrainOutlineSteps(expected, config));
  await runLoadingSteps(clipTerrainOutlineSteps(actual, config), undefined, {
    budgetMs: 0,
    yieldTask: async () => {},
  });
  for (const name of Object.keys(expected.attributes))
    expect(Buffer.from(actual.attributes[name]!.array.buffer)).toEqual(
      Buffer.from(expected.attributes[name]!.array.buffer),
    );
  expect(actual.index!.array).toEqual(expected.index!.array);
  expected.dispose();
  actual.dispose();
});
it('prepares distinct instanced/color variants without reparenting objects or repeating identical materials', async () => {
  const root = new Group(),
    geometry = new BoxGeometry(),
    material = new MeshStandardMaterial();
  const mesh = new Mesh(geometry, material),
    duplicate = new Mesh(geometry, material);
  const instanced = new InstancedMesh(geometry, material, 1);
  root.add(mesh, duplicate, instanced);
  const compile = vi.fn();
  const camera = new PerspectiveCamera(),
    scene = new Scene();
  await prepareLandmark(
    root,
    camera,
    { compile } as unknown as WebGLRenderer,
    scene,
    () => false,
  );
  expect(compile).toHaveBeenCalledTimes(2);
  expect(compile).toHaveBeenCalledWith(mesh, camera, scene);
  expect(compile).toHaveBeenCalledWith(instanced, camera, scene);
  expect(root.children).toEqual([mesh, duplicate, instanced]);
  compile.mockClear();
  await prepareLandmark(
    root,
    camera,
    { compile } as unknown as WebGLRenderer,
    scene,
    () => true,
  );
  expect(compile).not.toHaveBeenCalled();
  geometry.dispose();
  material.dispose();
  instanced.dispose();
});
it('does not touch a disposed renderer when cancellation arrives during the yield', async () => {
  let stopped = false;
  vi.stubGlobal('scheduler', {
    yield: async () => {
      stopped = true;
    },
  });
  const root = new Group(),
    geometry = new BoxGeometry(),
    material = new MeshStandardMaterial();
  root.add(new Mesh(geometry, material));
  const compile = vi.fn();
  await prepareLandmark(
    root,
    new PerspectiveCamera(),
    { compile } as unknown as WebGLRenderer,
    new Scene(),
    () => stopped,
  );
  expect(compile).not.toHaveBeenCalled();
  geometry.dispose();
  material.dispose();
});

it('keeps box/sphere calculations and precomputed water masks numerically identical', async () => {
  const geometry = new BoxGeometry(10, 2, 8);
  geometry.translate(3, -2, 5);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const box = geometry.boundingBox!.clone(),
    sphere = geometry.boundingSphere!.clone();
  geometry.boundingBox = geometry.boundingSphere = null;
  await runLoadingSteps(geometryBoundsSteps(geometry));
  expect(geometry.boundingBox).toEqual(box);
  expect(geometry.boundingSphere).toEqual(sphere);
  const ground = (x: number, z: number) => -2 + Math.sin(x * 0.4 + z) * 0.5;
  const direct = new CPUPondSurface(geometry, ground, 0);
  const weights = await runLoadingSteps(pondMaskSteps(geometry, ground, 0, 32));
  const prepared = new CPUPondSurface(geometry, ground, 0, weights);
  expect(prepared.maskTexture.image.data).toEqual(direct.maskTexture.image.data);
  expect(prepared.diagnosticPoint).toEqual(direct.diagnosticPoint);
  direct.dispose();
  prepared.dispose();
  geometry.dispose();
});
it('disposes loaded GLBs when navigation cancels a partly assembled landmark', async () => {
  const directory = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
  const manifest = await readFile(resolve(directory, 'layout.json'), 'utf8');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(manifest)),
  );
  const disposal = vi.fn();
  const geometries = new Set<BoxGeometry>();
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const bytes = await readFile(
      resolve(directory, url.split('/overgrown-ruin/').at(-1)!),
    );
    const result = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      '',
    );
    result.scene.traverse((o) => {
      if (o instanceof Mesh && !geometries.has(o.geometry as BoxGeometry)) {
        geometries.add(o.geometry as BoxGeometry);
        o.geometry.addEventListener('dispose', disposal);
      }
    });
    return result;
  });
  const abort = new AbortController();
  vi.stubGlobal('window', {});
  vi.stubGlobal('scheduler', {
    yield: async () => {
      abort.abort();
    },
  });
  let clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => (clock += 10));
  await expect(
    createOvergrownRuin(
      createWorldConfig(),
      false,
      false,
      false,
      false,
      false,
      {},
      { water: false, waterfall: false },
      undefined,
      'off',
      'off',
      'off',
      'off',
      abort.signal,
    ),
  ).rejects.toThrow();
  expect(abort.signal.aborted).toBe(true);
  expect(geometries.size).toBeGreaterThan(0);
  expect(disposal).toHaveBeenCalledTimes(geometries.size);
});
