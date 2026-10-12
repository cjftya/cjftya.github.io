import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import type { InstancedMesh } from 'three';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import {
  landmarkWorldPoint,
  sampleGround,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import {
  exclusionReason,
  groundFootprints,
} from '../src/jelly-oasis/vegetation/vegetationPlacement';
import { createScenery } from '../src/jelly-oasis/scenery/createScenery';
import {
  scenerySeparation,
  SCENERY_KINDS,
  SCENERY_SHAPES,
  SCENERY_ZONES,
  TREE_KINDS,
  selectScenery,
} from '../src/jelly-oasis/scenery/sceneryConfig';
import {
  createSceneryGeometry,
  projectedFootprint,
} from '../src/jelly-oasis/scenery/sceneryGeometry';
import { placeScenery } from '../src/jelly-oasis/scenery/sceneryPlacement';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('protects production defaults and encloses real prototypes within reserved footprints', () => {
  for (const value of [null, 'off', 'a', 'b'])
    expect(selectScenery(false, value)).toBe('a');
  expect(selectScenery(true, 'off')).toBe('off');
  expect(selectScenery(true, 'b')).toBe('b');
  for (const kind of SCENERY_KINDS) {
    const g = createSceneryGeometry(kind),
      p = g.attributes.position!,
      s = SCENERY_SHAPES[kind];
    for (let i = 0; i < p.count; i++) {
      expect(Math.hypot(p.getX(i), p.getZ(i))).toBeLessThanOrEqual(s.radius);
      expect(p.getY(i)).toBeLessThanOrEqual(s.height + 0.05);
      expect(p.getY(i)).toBeGreaterThanOrEqual(-0.11);
    }
    expect(g.attributes.color!.count).toBe(p.count);
    g.dispose();
  }
});
it('places deterministic grounded scenery on real compact terrain and GLBs, supports relocation and one-owner lifecycle', async () => {
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
  const owner = l.scenery,
    initial = owner.instances(),
    original = { ...l.placement, position: { ...l.placement.position } };
  const meshes = owner.group.children as InstancedMesh[];
  const resources = meshes.flatMap((m) => [
    m,
    m.geometry,
    ...(Array.isArray(m.material) ? m.material : [m.material]),
  ]);
  const footprints = Object.fromEntries(
    SCENERY_KINDS.map((kind, i) => [kind, projectedFootprint(meshes[i]!.geometry)]),
  );
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
      const occupied = [...l.vegetation.instances(), ...l.composition.instances()],
        a = owner.instances();
      expect(placeScenery(site, occupied, footprints).instances).toEqual(a);
      expect(placeScenery(site, occupied, footprints, 'a', 123).instances).not.toEqual(
        a,
      );
      expect(owner.snapshot().draws).toBeLessThanOrEqual(6);
      expect(owner.snapshot().resources).toEqual({
        geometries: 6,
        materials: 6,
        textures: 0,
      });
      expect(a.length).toBeGreaterThan(30);
      for (const p of a) {
        expect(exclusionReason(p.x, p.z, p.radius, site)).toBeNull();
        expect(p.slope).toBeLessThanOrEqual(SCENERY_SHAPES[p.kind].slope);
        expect(p.height * placement.scale).toBeLessThan(27);
        for (const other of [...occupied, ...a])
          if (p !== other)
            expect(Math.hypot(p.x - other.x, p.z - other.z)).toBeGreaterThanOrEqual(
              scenerySeparation(p, other) - 1e-8,
            );
        const world = landmarkWorldPoint(p.x, p.z, placement),
          h = sampleGround(world.x, world.z, config),
          y = l.root.position.y + p.y * placement.scale;
        expect(y).toBeLessThan(h);
        if (!TREE_KINDS.includes(p.kind)) {
          const g = meshes[SCENERY_KINDS.indexOf(p.kind)]!.geometry,
            v = g.attributes.position!;
          // Every actual flat-base vertex stays at/below the patched ground, no airborne corners.
          for (let i = 0; i < v.count; i++)
            if (v.getY(i) < 1e-6) {
              const q = new Vector3(v.getX(i), 0, v.getZ(i))
                .multiplyScalar(p.scale)
                .applyAxisAngle(new Vector3(0, 1, 0), p.rotation);
              const w = landmarkWorldPoint(p.x + q.x, p.z + q.z, placement);
              expect(y).toBeLessThanOrEqual(sampleGround(w.x, w.z, config));
            }
          expect(p.burial).toBeLessThanOrEqual(
            SCENERY_SHAPES[p.kind].height * p.scale * placement.scale * 0.58,
          );
        }
      }
      const first = placeScenery(
        site,
        occupied,
        footprints,
        'a',
        undefined,
        SCENERY_ZONES.slice(0, 1),
      );
      expect(a.filter((p) => p.zone === SCENERY_ZONES[0]!.id)).toEqual(first.instances);
      const rich = placeScenery(site, occupied, footprints, 'b');
      expect(rich.instances.length).toBeGreaterThan(a.length);
      const mobile = createScenery(l.root, 'a', true);
      mobile.refresh(site, occupied);
      expect(mobile.instances()).toEqual(a);
      expect(mobile.snapshot().instanceCount).toBeLessThan(a.length);
      mobile.dispose();
      mobile.dispose();
      expect(l.assets.modules.size).toBe(16);
      expect(l.excavationSnapshot()!.channelPath).toEqual([]);
      const audit = auditLandmark(l);
      for (const key of ['loop', 'clearing', 'approach', 'passage'] as const)
        expect(audit[key].clear).toBe(true);
    }
    expect(owner.instances()).toEqual(initial);
    l.isolate('Ruin_Arch_A');
    expect(owner.group.visible).toBe(false);
    l.isolate('');
    expect(owner.group.visible).toBe(true);
    l.refreshMaterials();
    await mkdir('artifacts/jelly-oasis/monumental-composition-v1/scenery', {
      recursive: true,
    });
    await writeFile(
      'artifacts/jelly-oasis/monumental-composition-v1/scenery/placement-audit.json',
      JSON.stringify(
        {
          terrain: config,
          modules: Object.fromEntries(
            [...l.assets.modules].map(([name, object]) => {
              const b = new Box3().setFromObject(object);
              return [name, { min: b.min.toArray(), max: b.max.toArray() }];
            }),
          ),
          occupancy: {
            obstacles: groundFootprints(l.root, l.assets.modules, config),
            vegetation: l.vegetation.instances(),
            composition: l.composition.instances(),
          },
          heightSlope: Array.from({ length: 57 * 57 }, (_, i) => {
            const x = -112 + (i % 57) * 4,
              z = -112 + Math.floor(i / 57) * 4,
              h = sampleGround(x, z, config);
            return {
              x,
              z,
              h,
              slope:
                Math.max(
                  ...Array.from({ length: 8 }, (_, j) =>
                    Math.abs(
                      sampleGround(
                        x + Math.cos((j * Math.PI) / 4) * 3,
                        z + Math.sin((j * Math.PI) / 4) * 3,
                        config,
                      ) - h,
                    ),
                  ),
                ) / 3,
            };
          }),
          stats: owner.snapshot(),
          instances: initial.map((p) => ({
            ...p,
            world: l.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
          })),
        },
        null,
        2,
      ),
    );
    const spies = resources.map((r) => vi.spyOn(r, 'dispose'));
    l.dispose();
    l.dispose();
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
    const off = createScenery(new Group(), 'off');
    expect(off.snapshot().resources.geometries).toBe(0);
    off.dispose();
  } finally {
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 30000);
