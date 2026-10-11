import { BufferGeometry, Float32BufferAttribute, Vector4 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  pondDomain,
  waveCoefficients,
} from '../src/jelly-oasis/landmark/water/gpgpuPondSurface';
import {
  subdividePond,
  tessellatePond,
} from '../src/jelly-oasis/landmark/water/subdividePond';

function concavePond() {
  const geometry = new BufferGeometry();
  // L footprint: the missing upper-right corner is land, not a bounding-box pond.
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [0, 2, 0, 4, 2, 0, 4, 2, 2, 2, 2, 2, 2, 2, 4, 0, 2, 4],
      3,
    ),
  );
  geometry.setIndex([0, 3, 1, 1, 3, 2, 0, 5, 3, 3, 5, 4]);
  return geometry;
}

describe('debug GPU pond domain and stability', () => {
  it('rejects land in a concave footprint and pins the exact shore', () => {
    const geometry = concavePond(),
      domain = pondDomain(geometry, 0.4);
    expect(domain.mask(3, 3)).toBe(0);
    expect(domain.mask(-0.1, 1)).toBe(0);
    expect(domain.mask(0, 1)).toBe(0);
    expect(domain.mask(2, 3)).toBe(0);
    expect(domain.mask(1, 1)).toBe(1);
    expect(domain.mask(3, 1)).toBe(1);
    expect(domain.mask(0.1, 1)).toBeGreaterThan(0);
    expect(domain.mask(0.1, 1)).toBeLessThan(domain.mask(0.2, 1));
    geometry.dispose();
  });
  it('keeps a welded subdivision footprint and water level unchanged', () => {
    const source = concavePond(),
      refined = subdividePond(source, 3);
    const before = pondDomain(source),
      after = pondDomain(refined);
    for (const [x, z] of [
      [0, 1],
      [1, 1],
      [3, 1],
      [3, 3],
      [2, 3],
      [1.95, 3],
    ])
      expect(after.mask(x!, z!)).toBeCloseTo(before.mask(x!, z!), 6);
    expect(after.bounds.toArray()).toEqual(before.bounds.toArray());
    for (let i = 0; i < refined.attributes.position!.count; i++)
      expect(refined.attributes.position!.getY(i)).toBe(2);
    source.dispose();
    refined.dispose();
  });
  it('refines long flat edges without opening the irregular shoreline', () => {
    const source = concavePond(),
      refined = tessellatePond(source, 0.45, 2);
    const before = pondDomain(source),
      after = pondDomain(refined);
    for (const [x, z] of [
      [0, 1],
      [1, 1],
      [3, 1],
      [3, 3],
      [2, 3],
    ])
      expect(after.mask(x!, z!)).toBeCloseTo(before.mask(x!, z!), 6);
    let area = 0;
    const p = refined.attributes.position!,
      index = refined.index!;
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i),
        b = index.getX(i + 1),
        c = index.getX(i + 2);
      area +=
        Math.abs(
          (p.getX(b) - p.getX(a)) * (p.getZ(c) - p.getZ(a)) -
            (p.getZ(b) - p.getZ(a)) * (p.getX(c) - p.getX(a)),
        ) / 2;
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ])
        expect(
          Math.hypot(p.getX(u!) - p.getX(v!), p.getZ(u!) - p.getZ(v!)),
        ).toBeLessThanOrEqual(0.450001);
    }
    expect(area).toBeCloseTo(12, 6);
    source.dispose();
    refined.dispose();
  });
  it('respects 2D CFL stability at both resolutions and extreme aspect ratios', () => {
    for (const n of [64, 128])
      for (const size of [
        [15, 10],
        [1, 100],
        [100, 1],
      ])
        for (const speed of [1, 3.5, 5]) {
          const c = waveCoefficients(
            n,
            new Vector4(0, 0, size[0]!, size[1]!),
            speed,
            1 / 60,
          );
          expect(c.x).toBeGreaterThan(0);
          expect(c.y).toBeGreaterThan(0);
          expect(c.x + c.y).toBeLessThanOrEqual(0.45000001);
          expect(c.x / c.y).toBeCloseTo((size[1]! / size[0]!) ** 2, 6);
        }
  });
});
