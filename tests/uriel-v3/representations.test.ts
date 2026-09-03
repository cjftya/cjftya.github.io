import { describe, expect, it } from 'vitest';
import {
  canonicalCombination,
  coordinateSystems,
  distanceRepresentation,
  distributionRepresentation,
  geometryRepresentation,
  representations,
} from '../../src/uriel/analysis/v3/representations';

const combination = [3, 8, 17, 26, 34, 42];

describe('Uriel v3 combination representations', () => {
  it.each(Object.values(representations))(
    'returns a finite, order-independent $id vector',
    (representation) => {
      const first = representation.extract(combination, 'circle');
      const reversed = representation.extract([...combination].reverse(), 'circle');
      expect(reversed).toEqual(first);
      expect(first.names).toHaveLength(first.values.length);
      expect(new Set(first.names).size).toBe(first.names.length);
      expect(first.values.every(Number.isFinite)).toBe(true);
    },
  );

  it('captures adjacent and pairwise spacing as one combination object', () => {
    const vector = distanceRepresentation.extract([1, 2, 3, 4, 5, 6]);
    expect(vector.values.slice(0, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(vector.values[vector.names.indexOf('range')]).toBe(5);
    expect(vector.names).toContain('gapEntropy');
    expect(vector.names).toContain('spacingUniformity');
  });

  it('uses simple parity and high/low counts only as distribution descriptors', () => {
    const vector = distributionRepresentation.extract(combination);
    expect(vector.names).toContain('distributionEntropy');
    expect(vector.names).toContain('oddRatioDescriptor');
    expect(vector.names).toContain('highRatioDescriptor');
    expect(vector.names.some((name) => /frequency|hot|cold|overdue/i.test(name))).toBe(
      false,
    );
  });

  it('keeps coordinate transforms replaceable and geometry bounded', () => {
    expect(Object.keys(coordinateSystems)).toEqual(['circle', 'board']);
    const circle = geometryRepresentation.extract(combination, 'circle');
    const board = geometryRepresentation.extract(combination, 'board');
    expect(board.values).not.toEqual(circle.values);
    const compactness = circle.values[circle.names.indexOf('compactness')]!;
    expect(compactness).toBeGreaterThanOrEqual(0);
    expect(compactness).toBeLessThanOrEqual(1);
    expect(circle.names).toContain('geometricEntropy');
  });

  it('rejects malformed combinations before feature extraction', () => {
    expect(canonicalCombination(combination)).toEqual(combination);
    expect(() => canonicalCombination([1, 1, 2, 3, 4, 5])).toThrow('서로 다른');
    expect(() => canonicalCombination([1, 2, 3, 4, 5, 46])).toThrow('1~45');
  });
});
