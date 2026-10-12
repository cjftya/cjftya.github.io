import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { Box3, Mesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createOvergrownRuin } from '../src/jelly-oasis/landmark/createOvergrownRuin';
import { auditLandmark } from '../src/jelly-oasis/landmark/landmarkAudit';
import { sampleGround } from '../src/jelly-oasis/landmark/landmarkPlacement';
import { DEFAULT_TERRAIN_CONFIG } from '../src/jelly-oasis/terrain/heightfield';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { groundFootprints } from '../src/jelly-oasis/vegetation/vegetationPlacement';
import { placeComposition } from '../src/jelly-oasis/composition/compositionPlacement';
import { COMPOSITION_ZONES } from '../src/jelly-oasis/composition/compositionConfig';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('audits frozen production assets and the actual northern surface without weakening slope protection', async () => {
  const dir = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
  const files: { path: string; sha256: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () => new Response(await readFile(resolve(dir, 'layout.json'), 'utf8')),
    ),
  );
  vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(async (url) => {
    const path = url.split('/overgrown-ruin/').at(-1)!;
    const b = await readFile(resolve(dir, path));
    files.push({ path, sha256: createHash('sha256').update(b).digest('hex') });
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
    expect(l.assetTriangles).toBe(20894);
    expect(l.placement.position).toEqual({ x: 70, z: 58 });
    expect(l.placement.rotationY).toBe(Math.PI / 6);
    expect(l.placement.scale).toBe(1);
    const assets = [...l.assets.modules].map(([name, root]) => {
      let triangles = 0,
        vertices = 0,
        primitives = 0,
        zeroArea = 0;
      root.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        primitives++;
        const p = child.geometry.attributes.position!,
          index = child.geometry.index,
          count = index?.count ?? p.count;
        vertices += p.count;
        triangles += count / 3;
        expect([...p.array].every(Number.isFinite)).toBe(true);
        for (let i = 0; i < count; i += 3) {
          const a = new Vector3().fromBufferAttribute(p, index?.getX(i) ?? i),
            b = new Vector3().fromBufferAttribute(p, index?.getX(i + 1) ?? i + 1),
            c = new Vector3().fromBufferAttribute(p, index?.getX(i + 2) ?? i + 2);
          if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-16) zeroArea++;
        }
      });
      const bounds = new Box3().setFromObject(root);
      expect(
        [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
      ).toBe(true);
      return {
        name,
        vertices,
        triangles,
        primitives,
        zeroArea,
        bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
      };
    });
    expect(assets.reduce((n, a) => n + a.triangles, 0)).toBe(20894);
    expect(assets.every((a) => a.zeroArea === 0)).toBe(true);
    const site = {
      placement: l.placement,
      rootY: l.root.position.y,
      terrain: config,
      pond: l.assets.pondGuide!,
      approach: l.assets.layout.guides.CreaturePaths_ArchApproach_6m!,
      obstacles: groundFootprints(l.root, l.assets.modules, config),
    };
    const vegetation = l.vegetation.instances(),
      composition = l.composition.instances();
    expect(vegetation.length).toBe(40);
    expect(composition.length).toBe(18);
    const placement = placeComposition(site, vegetation);
    expect(placement.instances).toEqual(composition);
    expect(placement.zoneCounts['north-highland']).toBeUndefined();
    expect(placement.rejected['north-highland:slope']).toBeUndefined();
    const grid = [];
    // Includes both 4m disks and a 4m nearby search margin. Query the excavated
    // production triangle surface, using the original placement footprint scales.
    for (let x = -26; x <= 0; x++)
      for (let z = -91; z <= -70; z++) {
        const h = sampleGround(x, z, config);
        const slopes = [0.35, 0.5, 0.95].map(
          (step) =>
            Math.max(
              ...[
                [step, 0],
                [-step, 0],
                [0, step],
                [0, -step],
              ].map(([dx, dz]) => Math.abs(sampleGround(x + dx!, z + dz!, config) - h)),
            ) / step,
        );
        grid.push({ x, z, height: h, slopes, eligible: Math.max(...slopes) <= 0.22 });
      }
    const routes = auditLandmark(l);
    for (const k of ['loop', 'clearing', 'approach', 'passage'] as const)
      expect(routes[k].clear).toBe(true);
    const positionHash = (p: unknown) =>
      createHash('sha256').update(JSON.stringify(p)).digest('hex');
    const hashes = {
      vegetation: positionHash(vegetation),
      composition: positionHash(composition),
      zones: Object.fromEntries(
        COMPOSITION_ZONES.map((z) => [
          z.id,
          positionHash(composition.filter((p) => p.zone === z.id)),
        ]),
      ),
    };
    for (let i = 0; i < 3; i++) {
      l.place({ ...l.placement, position: { ...l.placement.position } });
      expect(l.vegetation.instances()).toEqual(vegetation);
      expect(l.composition.instances()).toEqual(composition);
    }
    expect(l.excavationSnapshot()!.channelPath).toEqual([]);
    const report = {
      status: 'PASS',
      assets,
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
      routes,
      placement: l.placement,
      contact: l.contact,
      hashes,
      north: {
        zone: COMPOSITION_ZONES.at(-1),
        placement,
        grid,
        eligible: grid.filter((p) => p.eligible).length,
        minSlope: Math.min(...grid.map((p) => Math.max(...p.slopes))),
      },
      vegetation: l.vegetation.snapshot(),
      composition: l.composition.snapshot(),
      excavation: l.excavationSnapshot(),
    };
    if (process.env.OASIS_POLISH_AUDIT) {
      await mkdir(process.env.OASIS_POLISH_AUDIT, { recursive: true });
      await writeFile(
        resolve(process.env.OASIS_POLISH_AUDIT, 'technical-audit.json'),
        JSON.stringify(report, null, 2),
      );
    }
  } finally {
    l.dispose();
    l.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
  }
}, 30000);
