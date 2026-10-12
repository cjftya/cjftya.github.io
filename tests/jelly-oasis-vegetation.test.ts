import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Matrix4, Vector3 } from 'three';
import type { InstancedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  createVegetationGeometry,
  createVegetation,
} from '../src/jelly-oasis/vegetation/createVegetation';
import {
  VEGETATION_KINDS,
  VEGETATION_SHAPES,
  selectVegetation,
} from '../src/jelly-oasis/vegetation/vegetationConfig';
import {
  exclusionReason,
  groundFootprints,
  placeVegetation,
} from '../src/jelly-oasis/vegetation/vegetationPlacement';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { LANDMARK_CANDIDATES } from '../src/jelly-oasis/landmark/landmarkConfig';
import {
  landmarkWorldPoint,
  sampleGround,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { polygonDistance } from '../src/jelly-oasis/terrain/excavateTerrain';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps production density stable regardless of query and bounds finite flat geometry', () => {
  for (const query of ['off', 'density-b', null])
    expect(selectVegetation(false, query)).toBe('density-a');
  expect(selectVegetation(true, 'off')).toBe('off');
  expect(selectVegetation(true, 'density-b')).toBe('density-b');
  for (const kind of VEGETATION_KINDS) {
    const g = createVegetationGeometry(kind),
      pos = g.attributes.position!,
      normal = g.attributes.normal!;
    expect(g.index).toBeNull();
    const a = new Vector3(),
      b = new Vector3(),
      c = new Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      expect(
        [...a.toArray(), ...b.toArray(), ...c.toArray()].every(Number.isFinite),
      ).toBe(true);
      expect(b.sub(a).cross(c.sub(a)).length()).toBeGreaterThan(1e-7);
      expect(new Vector3().fromBufferAttribute(normal, i).length()).toBeCloseTo(1, 5);
    }
    for (let i = 0; i < pos.count; i++)
      expect(Math.hypot(pos.getX(i), pos.getZ(i))).toBeLessThanOrEqual(
        VEGETATION_SHAPES[kind].radius,
      );
    g.dispose();
  }
});
it('rebuilds real excavated placements with protected routes, stable seed, correct matrices and one owner per resource', async () => {
  const dir = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () => new Response(await readFile(resolve(dir, 'layout.json'), 'utf8')),
    ),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const b = await readFile(resolve(dir, url.split('/overgrown-ruin/').at(-1)!));
    return new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      '',
    );
  });
  const terrainConfig = { ...DEFAULT_TERRAIN_CONFIG },
    terrain = createTerrain(terrainConfig);
  const l = await createOvergrownRuin(
    terrainConfig,
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
    const initial = l.vegetation.instances();
    const geometryOwners = l.vegetation.group.children.map(
      (m) => (m as InstancedMesh).geometry,
    );
    for (const placement of [
      LANDMARK_CANDIDATES[0],
      LANDMARK_CANDIDATES[1],
      { ...LANDMARK_CANDIDATES[2], rotationY: 0.83, scale: 0.85 },
      LANDMARK_CANDIDATES[0],
    ]) {
      l.place(placement);
      const site = {
        placement: l.placement,
        rootY: l.root.position.y,
        terrain: terrainConfig,
        pond: l.assets.pondGuide!,
        approach: l.assets.layout.guides.CreaturePaths_ArchApproach_6m!,
        obstacles: groundFootprints(l.root, l.assets.modules, terrainConfig),
      };
      const a = l.vegetation.instances();
      expect(a.length).toBeGreaterThan(90);
      expect(placeVegetation(site).instances).toEqual(a);
      expect(placeVegetation(site, 'density-a', 999).instances).not.toEqual(a);
      const stats = l.vegetation.snapshot();
      expect(stats.triangles).toBeLessThan(10000);
      expect(stats.draws).toBe(3);
      expect(stats.instanceCount).toBeLessThanOrEqual(180);
      expect(
        l.vegetation.group.children.map((m) => (m as InstancedMesh).geometry),
      ).toEqual(geometryOwners);
      for (const p of a) {
        expect(exclusionReason(p.x, p.z, p.radius, site)).toBeNull();
        expect(polygonDistance(p.x, p.z, site.pond.positions)).toBeLessThan(
          -1 - p.radius,
        );
        expect(Math.hypot(p.x, p.z - 27)).toBeGreaterThan(8 + p.radius);
        const world = landmarkWorldPoint(p.x, p.z, placement);
        expect(l.root.position.y + p.y * placement.scale).toBeCloseTo(
          sampleGround(world.x, world.z, terrainConfig) - 0.015,
          8,
        );
      }
      for (const mesh of l.vegetation.group.children as InstancedMesh[]) {
        const kind = mesh.name.split('_')[1],
          species = a.filter((p) => p.kind === kind);
        const matrix = new Matrix4(),
          point = new Vector3();
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, matrix);
          point.setFromMatrixPosition(matrix);
          expect(point.y).toBeCloseTo(species[i]!.y, 5);
        }
        expect(mesh.castShadow).toBe(false);
      }
      expect(l.excavationSnapshot()!.channelPath).toEqual([]);
    }
    expect(l.vegetation.instances()).toEqual(initial);
    const audit = auditLandmark(l);
    for (const key of ['loop', 'clearing', 'approach', 'passage'] as const)
      expect(audit[key].clear).toBe(true);
    l.isolate('Ruin_Arch_A');
    expect(l.vegetation.group.visible).toBe(false);
    l.isolate('');
    expect(l.vegetation.group.visible).toBe(true);
    l.refreshMaterials();
    const mobile = createVegetation(
      l.root,
      l.assets.modules,
      terrainConfig,
      l.assets.pondGuide!,
      l.assets.layout.guides.CreaturePaths_ArchApproach_6m!,
      'density-a',
      true,
    );
    mobile.refresh(l.placement);
    expect(mobile.instances()).toEqual(initial);
    expect(mobile.snapshot().instanceCount / initial.length).toBeGreaterThanOrEqual(
      0.6,
    );
    expect(mobile.snapshot().instanceCount / initial.length).toBeLessThanOrEqual(0.75);
    mobile.dispose();
    mobile.dispose();
    const rich = createVegetation(
      l.root,
      l.assets.modules,
      terrainConfig,
      l.assets.pondGuide!,
      l.assets.layout.guides.CreaturePaths_ArchApproach_6m!,
      'density-b',
    );
    rich.refresh(l.placement);
    expect(rich.snapshot().triangles).toBeLessThan(10000);
    rich.dispose();
    const disposed = geometryOwners.map((g) => vi.spyOn(g, 'dispose'));
    l.dispose();
    l.dispose();
    for (const spy of disposed) expect(spy).toHaveBeenCalledTimes(1);
  } finally {
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 30000);
