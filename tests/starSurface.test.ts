import { describe, expect, it } from 'vitest';
import { sampleCoronaVariation } from '../src/solar-system/starSurface';

describe('starSurface', () => {
  it('creates a deterministic corona signature from the galaxy seed', () => {
    const first = sampleCoronaVariation(0.31, -0.44, 0.84, 4101);
    const second = sampleCoronaVariation(0.31, -0.44, 0.84, 4101);

    expect(second).toBe(first);
  });

  it('keeps corona deformation normalized and distinguishes star seeds', () => {
    const garden = sampleCoronaVariation(0.31, -0.44, 0.84, 4101);
    const archive = sampleCoronaVariation(0.31, -0.44, 0.84, 4202);

    expect(garden).toBeGreaterThanOrEqual(-1);
    expect(garden).toBeLessThanOrEqual(1);
    expect(archive).not.toBe(garden);
  });
});
