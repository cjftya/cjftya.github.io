import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import type { InstancedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { LANDMARK_CANDIDATES } from '../src/jelly-oasis/landmark/landmarkConfig';
import {
  landmarkWorldPoint,
  sampleGround,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import {
  exclusionReason,
  groundFootprints,
  placeVegetation,
} from '../src/jelly-oasis/vegetation/vegetationPlacement';
import { placeComposition } from '../src/jelly-oasis/composition/compositionPlacement';
import { createLandscapeComposition } from '../src/jelly-oasis/composition/createLandscapeComposition';
import {
  COMPOSITION_ZONES,
  selectComposition,
} from '../src/jelly-oasis/composition/compositionConfig';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps debug variants out of production URLs', () => {
  for (const query of ['off', 'b', 'a', null])
    expect(selectComposition(false, query)).toBe('a');
  expect(selectComposition(true, 'off')).toBe('off');
  expect(selectComposition(true, 'b')).toBe('b');
});
it('protects real terrain and routes, preserves original vegetation, and owns fixed resources across rebuilds', async () => {
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
  const owner = l.composition;
  const resources = (owner.group.children as InstancedMesh[]).map((m) => [
    m.geometry,
    m.material,
  ]);
  const initial = owner.instances(),
    original = l.vegetation.instances();
  try {
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
        terrain: config,
        pond: l.assets.pondGuide!,
        approach: l.assets.layout.guides.CreaturePaths_ArchApproach_6m!,
        obstacles: groundFootprints(l.root, l.assets.modules, config),
      };
      const vegetation = l.vegetation.instances(),
        a = owner.instances();
      expect(placeVegetation(site).instances).toEqual(vegetation);
      expect(placeComposition(site, vegetation).instances).toEqual(a);
      expect(placeComposition(site, vegetation, 'a', 123).instances).not.toEqual(a);
      const stats = owner.snapshot();
      expect(stats.triangles).toBeLessThanOrEqual(5000);
      expect(stats.draws).toBeLessThanOrEqual(5);
      expect(stats.instanceCount).toBeGreaterThan(0);
      expect(stats.instanceCount).toBeLessThanOrEqual(130);
      expect(
        (owner.group.children as InstancedMesh[]).map((m) => [m.geometry, m.material]),
      ).toEqual(resources);
      for (const p of a) {
        expect(exclusionReason(p.x, p.z, p.radius, site)).toBeNull();
        for (const other of [...vegetation, ...a])
          if (p !== other)
            expect(Math.hypot(p.x - other.x, p.z - other.z)).toBeGreaterThanOrEqual(
              p.radius + other.radius + 0.18 - 1e-8,
            );
        const world = landmarkWorldPoint(p.x, p.z, placement),
          h = sampleGround(world.x, world.z, config),
          y = l.root.position.y + p.y * placement.scale;
        expect(y).toBeLessThanOrEqual(h);
        expect(h - y).toBeLessThan(0.3);
        const zone = COMPOSITION_ZONES.find((z) => z.id === p.zone)!;
        if (zone.basis === 'world')
          expect(
            Math.min(
              ...zone.centers.map((c) => Math.hypot(world.x - c[0], world.z - c[1])),
            ),
          ).toBeLessThanOrEqual(zone.radius + 1e-8);
      }
      // A zone omitted elsewhere cannot perturb independent seeds on the retained first zone.
      const first = placeComposition(
        site,
        vegetation,
        'a',
        undefined,
        COMPOSITION_ZONES.slice(0, 1),
      );
      expect(a.filter((p) => p.zone === COMPOSITION_ZONES[0]!.id)).toEqual(
        first.instances,
      );
      const mobile = createLandscapeComposition(l.root, 'a', true);
      mobile.refresh(site, vegetation);
      expect(mobile.instances()).toEqual(a);
      expect(mobile.snapshot().triangles).toBeLessThanOrEqual(3000);
      mobile.dispose();
      mobile.dispose();
      const rich = placeComposition(site, vegetation, 'b');
      expect(
        rich.instances.filter((p) => p.kind === 'rock').length,
      ).toBeLessThanOrEqual(45);
      expect(
        rich.instances.filter((p) => p.kind !== 'rock').length,
      ).toBeLessThanOrEqual(160);
      expect(placeComposition(site, vegetation, 'off').instances).toEqual([]);
      expect(l.excavationSnapshot()!.channelPath).toEqual([]);
      expect(l.assets.modules.size).toBe(16);
    }
    expect(owner.instances()).toEqual(initial);
    expect(l.vegetation.instances()).toEqual(original);
    expect(l.vegetation.snapshot().placed).toEqual({
      grass: 32,
      shrub: 8,
      flower: 0,
    });
    l.isolate('Ruin_Arch_A');
    expect(owner.group.visible).toBe(false);
    l.isolate('');
    expect(owner.group.visible).toBe(true);
    l.refreshMaterials();
    const spies = resources
      .flat()
      .map((r) => vi.spyOn(r as { dispose(): void }, 'dispose'));
    l.dispose();
    l.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  } finally {
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 30000);
