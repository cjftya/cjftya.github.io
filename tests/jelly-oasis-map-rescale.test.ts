import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  createWorldConfig,
  selectWorldSize,
} from '../src/jelly-oasis/terrain/worldLayout';
import {
  sampleTerrainHeight,
  validateTerrainConfig,
} from '../src/jelly-oasis/terrain/heightfield';
import {
  createTerrain,
  createTerrainEdge,
} from '../src/jelly-oasis/terrain/createTerrain';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
import {
  landmarkWorldPoint,
  sampleGround,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import { frameWorld } from '../src/jelly-oasis/terrain/worldCamera';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps production size fixed and rejects incomplete preservation coordinates', () => {
  for (const query of ['320', '192', 'bogus', null])
    expect(selectWorldSize(false, query)).toBe(224);
  expect(selectWorldSize(true, '192')).toBe(192);
  expect(selectWorldSize(true, 'bogus')).toBe(224);
  expect(() =>
    validateTerrainConfig({ ...createWorldConfig(), oasisZ: undefined }),
  ).toThrow();
});
it('preserves the approved metre-scale oasis heights on both compact candidates', () => {
  for (const size of [224, 192])
    for (let x = -40; x <= 40; x += 4)
      for (let z = -40; z <= 40; z += 4)
        expect(
          sampleTerrainHeight(x + 14, z + 14, createWorldConfig(size)),
        ).toBeCloseTo(sampleTerrainHeight(x + 70, z + 58), 12);
});
it('fits terrain and cut-wall bounds across desktop and portrait without clipping', () => {
  for (const size of [320, 224, 192]) {
    const config = createWorldConfig(size),
      terrain = createTerrain(config),
      edge = createTerrainEdge(config);
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
      [360, 780],
      [844, 390],
    ]) {
      const camera = new PerspectiveCamera(42, width! / height!, 0.5, 1800);
      const controls = {
        target: new Vector3(),
        enableDamping: true,
        update() {
          camera.lookAt(this.target);
          camera.updateMatrixWorld();
        },
      };
      const bounds = frameWorld(
        [terrain, edge],
        camera,
        controls as unknown as OrbitControls,
      );
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            const point = new Vector3(x, y, z).project(camera);
            expect(Math.abs(point.x)).toBeLessThanOrEqual(0.880001);
            expect(Math.abs(point.y)).toBeLessThanOrEqual(0.820001);
          }
    }
    terrain.geometry.dispose();
    terrain.material.dispose();
    edge.geometry.dispose();
    edge.material.dispose();
  }
});
it('audits actual GLBs, pond, routes, placements and rebuild stability at all sizes', async () => {
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
  const reports = [];
  for (const size of [320, 224, 192]) {
    const config = createWorldConfig(size),
      terrain = createTerrain(config);
    const l = await createOvergrownRuin(
      config,
      true,
      true,
      true,
      'v2',
      true,
      { tree: true, pond: true, cliff: true, water: 'soft' },
      { pondOnly: true, water: true, waterfall: false, forceCpu: true },
      terrain,
    );
    try {
      expect(l.assets.modules.size).toBe(16);
      expect(l.assetTriangles).toBe(20894);
      expect(l.root.scale.toArray()).toEqual([1, 1, 1]);
      const bounds = Object.fromEntries(
        [...l.assets.modules].map(([name, obj]) => {
          const b = new Box3().setFromObject(obj);
          return [
            name,
            {
              min: b.min.toArray(),
              max: b.max.toArray(),
              margin:
                size / 2 -
                Math.max(
                  Math.abs(b.min.x),
                  Math.abs(b.max.x),
                  Math.abs(b.min.z),
                  Math.abs(b.max.z),
                ),
            },
          ];
        }),
      );
      for (const b of Object.values(bounds)) {
        expect([...b.min, ...b.max].every(Number.isFinite)).toBe(true);
        expect(b.margin).toBeGreaterThanOrEqual(5);
      }
      const audit = auditLandmark(l);
      for (const key of ['loop', 'clearing', 'approach', 'passage'] as const)
        expect(audit[key].clear).toBe(true);
      const v = l.vegetation.instances(),
        c = l.composition.instances();
      expect(v.length).toBe(180);
      for (const p of [...v, ...c]) {
        const world = landmarkWorldPoint(p.x, p.z, l.placement);
        expect(
          Math.max(Math.abs(world.x), Math.abs(world.z)) + p.radius + 1,
        ).toBeLessThan(size / 2);
      }
      const snapshot = l.excavationSnapshot();
      expect(snapshot!.channelPath).toEqual([]);
      const ground = [];
      for (let x = -32; x <= 32; x += 8)
        for (let z = -32; z <= 32; z += 8)
          ground.push(
            sampleGround(
              x + l.placement.position.x,
              z + l.placement.position.z,
              config,
            ),
          );
      for (let i = 0; i < 3; i++) {
        l.place({ ...l.placement, position: { ...l.placement.position } });
        expect(l.vegetation.instances()).toEqual(v);
        expect(l.composition.instances()).toEqual(c);
      }
      reports.push({
        size,
        bounds,
        audit,
        ground,
        placement: l.placement,
        contact: l.contact,
        vegetation: l.vegetation.snapshot(),
        composition: l.composition.snapshot(),
        excavation: snapshot,
      });
    } finally {
      l.dispose();
      terrain.geometry.dispose();
      terrain.material.dispose();
    }
  }
  if (process.env.OASIS_RESCALE_AUDIT) {
    await mkdir(process.env.OASIS_RESCALE_AUDIT, { recursive: true });
    await writeFile(
      resolve(process.env.OASIS_RESCALE_AUDIT, 'world-bounds-audit.json'),
      JSON.stringify(reports, null, 2),
    );
  }
}, 30000);
