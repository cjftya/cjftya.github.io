import { createMeadowGeometry } from '../src/jelly-oasis/meadow/meadowGeometry';
import { MEADOW_KINDS, MEADOW_SHAPES } from '../src/jelly-oasis/meadow/meadowConfig';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, it, vi, afterEach } from 'vitest';
import { Vector3, Group } from 'three';
import type { InstancedMesh, Material } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import {
  exclusionReason,
  groundFootprints,
} from '../src/jelly-oasis/vegetation/vegetationPlacement';
import {
  sampleGround,
  landmarkWorldPoint,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { placeMeadow } from '../src/jelly-oasis/meadow/meadowPlacement';
import { createMeadow } from '../src/jelly-oasis/meadow/createMeadow';
import { selectMeadow } from '../src/jelly-oasis/meadow/meadowConfig';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps production A and allocates nothing for off', () => {
  for (const v of [null, 'off', 'b']) expect(selectMeadow(false, v)).toBe('a');
  expect(selectMeadow(true, 'b')).toBe('b');
  for (const kind of MEADOW_KINDS) {
    const g = createMeadowGeometry(kind),
      p = g.attributes.position!;
    for (let i = 0; i < p.count; i++) {
      expect(Math.hypot(p.getX(i), p.getZ(i))).toBeLessThanOrEqual(
        MEADOW_SHAPES[kind].radius,
      );
      expect(Number.isFinite(p.getY(i))).toBe(true);
    }
    expect(g.attributes.color!.count).toBe(p.count);
    g.dispose();
  }
  const owner = createMeadow(new Group(), 'off');
  expect(owner.snapshot().resources.geometries).toBe(0);
  owner.dispose();
  owner.dispose();
  const visible = createMeadow(new Group());
  expect(visible.group.children.length).toBe(MEADOW_KINDS.length);
  for (const mesh of visible.group.children as InstancedMesh[]) {
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  }
  visible.dispose();
});
it('grounds isolated deterministic meadows against real GLBs and scenery, preserving previous owners and lifecycle', async () => {
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
  const config = createWorldConfig(),
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

  const original = { ...l.placement, position: { ...l.placement.position } },
    owner = l.meadow,
    initial = owner.instances();
  const baseline = {
    vegetation: l.vegetation.instances(),
    composition: l.composition.instances(),
    scenery: l.scenery.instances(),
  };
  try {
    for (const placement of [
      original,
      { ...original, position: { x: 6, z: 10 }, rotationY: 0.8, scale: 0.9 },
      original,
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
      const occupied = [
          ...l.vegetation.instances(),
          ...l.composition.instances(),
          ...l.scenery.instances(),
        ],
        a = owner.instances();
      expect(a).toEqual(placeMeadow(site, occupied).instances);
      expect(a.length).toBeGreaterThan(90);
      expect(a.length).toBeLessThanOrEqual(1200);
      expect(placeMeadow(site, occupied, 'b').instances.length).toBeGreaterThan(
        a.length,
      );
      for (const p of a) {
        expect(exclusionReason(p.x, p.z, p.radius, site)).toBeNull();
        const w = landmarkWorldPoint(p.x, p.z, placement);
        expect(l.root.position.y + p.y * placement.scale).toBeCloseTo(
          sampleGround(w.x, w.z, config) - 0.015,
          8,
        );
        for (const q of [...occupied, ...a])
          if (q !== p)
            expect(Math.hypot(p.x - q.x, p.z - q.z)).toBeGreaterThanOrEqual(
              p.radius + q.radius + 0.12 - 1e-8,
            );
      }
      const mobile = createMeadow(l.root, 'a', true);
      mobile.refresh(site, occupied);
      expect(mobile.instances()).toEqual(a);
      expect(mobile.snapshot().instanceCount).toBeLessThan(a.length);
      mobile.dispose();
      mobile.dispose();
    }
    expect(owner.instances()).toEqual(initial);
    expect({
      vegetation: l.vegetation.instances(),
      composition: l.composition.instances(),
      scenery: l.scenery.instances(),
    }).toEqual(baseline);
    l.isolate('Ruin_Arch_A');
    expect(owner.group.visible).toBe(false);
    l.isolate('');
    expect(owner.group.visible).toBe(true);
    l.refreshMaterials();
    l.refreshMaterials();
    await mkdir('artifacts/jelly-oasis/monumental-art-v2/meadow', {
      recursive: true,
    });
    await writeFile(
      'artifacts/jelly-oasis/monumental-art-v2/meadow/placement-audit.json',
      JSON.stringify(
        {
          baseline,
          stats: owner.snapshot(),
          meadow: initial.map((p) => ({
            ...p,
            world: l.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
          })),
        },
        null,
        2,
      ),
    );
    const spies = owner.group.children.flatMap((o) => {
      const m = o as InstancedMesh;
      return [m, m.geometry, m.material as Material].map((r) => vi.spyOn(r, 'dispose'));
    });
    l.dispose();
    l.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  } finally {
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 120000);
