import { describe, expect, it } from 'vitest';
import { sampleSeededNoise } from '../src/planets/generators/seededNoise';

describe('sampleSeededNoise', () => {
  it('returns deterministic values for the same seed and coordinates', () => {
    const first = sampleSeededNoise(1.25, -0.75, 3.5, 1001);
    const second = sampleSeededNoise(1.25, -0.75, 3.5, 1001);

    expect(second).toBe(first);
  });

  it('changes the generated value when the seed changes', () => {
    const first = sampleSeededNoise(1.25, -0.75, 3.5, 1001);
    const second = sampleSeededNoise(1.25, -0.75, 3.5, 2002);

    expect(second).not.toBe(first);
  });
});
