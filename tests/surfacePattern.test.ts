import { describe, expect, it } from 'vitest';
import {
  getSurfacePatternIndex,
  sampleSurfacePattern,
  SURFACE_PATTERN_COUNT,
} from '../src/planets/generators/surfacePattern';

describe('surfacePattern', () => {
  it('selects all procedural pattern families deterministically', () => {
    const patterns = Array.from({ length: SURFACE_PATTERN_COUNT }, (_, index) =>
      getSurfacePatternIndex(2100 + index),
    );

    expect(new Set(patterns).size).toBe(SURFACE_PATTERN_COUNT);
    expect(getSurfacePatternIndex(2103)).toBe(getSurfacePatternIndex(2103));
  });

  it('returns deterministic normalized color variation', () => {
    const first = sampleSurfacePattern(0.31, -0.44, 0.84, 2404);
    const second = sampleSurfacePattern(0.31, -0.44, 0.84, 2404);

    expect(second).toBe(first);
    expect(first).toBeGreaterThanOrEqual(-1);
    expect(first).toBeLessThanOrEqual(1);
  });

  it('gives different seeds distinct surface signatures', () => {
    const samples = [2101, 2202, 2303, 2404, 2505].map((seed) =>
      sampleSurfacePattern(0.31, -0.44, 0.84, seed),
    );

    expect(new Set(samples).size).toBeGreaterThan(3);
  });
});
