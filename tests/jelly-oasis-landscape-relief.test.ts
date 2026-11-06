import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createTerrain } from '../src/jelly-oasis/terrain/createTerrain';
import { createWorldConfig } from '../src/jelly-oasis/terrain/worldLayout';
import { sampleTerrainHeight } from '../src/jelly-oasis/terrain/heightfield';
import {
  sampleGround,
  sampleOriginalGround,
} from '../src/jelly-oasis/landmark/landmarkPlacement';
import {
  AMPHITHEATRE,
  CANYON,
  landscapeRelief,
} from '../src/jelly-oasis/terrain/landscapeRelief';
it('preserves the sanctuary and cut edges in both art alternatives', () => {
  for (const size of [192, 224])
    for (const variant of [1, 2]) {
      const legacy = createWorldConfig(size, 0),
        config = createWorldConfig(size, variant);
      for (let x = -size / 2; x <= size / 2; x += 2)
        for (let z = -size / 2; z <= size / 2; z += 2) {
          const before = sampleTerrainHeight(x, z, legacy),
            after = sampleTerrainHeight(x, z, config);
          expect(Number.isFinite(after)).toBe(true);
          // Production may lower the old outer mound to avoid stacking cliffs.
          // Canyon remains the additive inspection alternative.
          if (variant === 2) expect(after).toBeGreaterThanOrEqual(before);
          expect(after).toBeGreaterThan(-config.maxHeight);
          if (
            Math.hypot(x - 14, z - 14) <= 60 ||
            Math.max(Math.abs(x), Math.abs(z)) === size / 2
          )
            expect(after).toBe(before);
        }
    }
});
it('joins every ridge station through supported terrain', () => {
  for (const [variant, paths] of [
    [1, [AMPHITHEATRE]],
    [2, CANYON],
  ] as const)
    for (const path of paths)
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]!,
          b = path[i]!;
        for (let j = 0; j <= 20; j++) {
          const t = j / 20;
          expect(
            landscapeRelief(
              a[0] + (b[0] - a[0]) * t,
              a[1] + (b[1] - a[1]) * t,
              224,
              variant,
            ),
          ).toBeGreaterThan(0.1);
        }
      }
});
it('keeps triangles upward, nondegenerate and consistent with placement sampling', () => {
  for (const variant of [1, 2]) {
    const config = createWorldConfig(224, variant),
      mesh = createTerrain(config),
      p = mesh.geometry.attributes.position!,
      index = mesh.geometry.index!;
    const a = new Vector3(),
      b = new Vector3(),
      c = new Vector3();
    for (let i = 0; i < index.count; i += 3) {
      a.fromBufferAttribute(p, index.getX(i));
      b.fromBufferAttribute(p, index.getX(i + 1));
      c.fromBufferAttribute(p, index.getX(i + 2));
      expect(b.clone().sub(a).cross(c.clone().sub(a)).y).toBeGreaterThan(0);
      const center = a.clone().add(b).add(c).divideScalar(3);
      expect(
        Math.abs(sampleGround(center.x, center.z, config) - center.y),
      ).toBeLessThan(0.0001);
    }
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
});

it('preserves uncached triangle heights across grid cells and terrain edits', () => {
  const config = createWorldConfig(224);
  function checkHeights() {
    const step = config.size / config.segments;
    for (const [ix, iz] of [
      [0, 0],
      [14, 9],
      [30, 33],
      [44, 27],
      [54, 54],
    ] as const) {
      const x0 = ix * step - config.size / 2;
      const z0 = iz * step - config.size / 2;
      for (const [dx, dz] of [
        [0, 0],
        [0.125, 0.375],
        [0.875, 0.625],
        [0.75, 0.25],
      ] as const) {
        const x = x0 + dx * step;
        const z = z0 + dz * step;
        const u = (x - x0) / step;
        const v = (z - z0) / step;
        const a = sampleTerrainHeight(x0, z0, config);
        const b = sampleTerrainHeight(x0, z0 + step, config);
        const d = sampleTerrainHeight(x0 + step, z0, config);
        const c = sampleTerrainHeight(x0 + step, z0 + step, config);
        const expected =
          u + v <= 1
            ? a + u * (d - a) + v * (b - a)
            : c + (1 - u) * (b - c) + (1 - v) * (d - c);
        expect(sampleOriginalGround(x, z, config)).toBe(expected);
      }
    }
  }
  checkHeights();
  checkHeights();
  config.seed += 1;
  config.maxHeight += 3;
  checkHeights();
});
