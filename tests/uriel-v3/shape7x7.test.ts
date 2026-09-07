import { describe, expect, it } from 'vitest';
import {
  numberToPoint,
  pointToNumber,
} from '../../src/uriel/analysis/v3/shape7x7/grid';
import {
  graphProfile,
  pairMatrix,
  shapeSignature,
  signatureFromPoints,
  SHAPE_FEATURE_NAMES,
} from '../../src/uriel/analysis/v3/shape7x7/signature';
import {
  buildShapeHistory,
  forecastShape,
} from '../../src/uriel/analysis/v3/shape7x7/predictor';
import {
  diverseGames,
  overlap,
  randomShapeGames,
} from '../../src/uriel/analysis/v3/shape7x7/candidates';
import { predictNextCandidates } from '../../src/uriel/analysis/v3/prediction';
import { sampleCombinations } from '../../src/uriel/analysis/v3/random';
import type { LottoDraw } from '../../src/uriel/types';

const draws: LottoDraw[] = sampleCombinations(100, 73).map((numbers, i) => ({
  numbers,
  round: i + 1,
  date: '',
}));

describe('Shape Core v1', () => {
  it('maps exactly 45 cells and excludes four nonexistent cells', () => {
    for (let n = 1; n <= 45; n++) expect(pointToNumber(numberToPoint(n))).toBe(n);
    expect(numberToPoint(45)).toEqual({ x: 2, y: 6 });
    for (let x = 3; x <= 6; x++) expect(pointToNumber({ x, y: 6 })).toBeNull();
    for (const n of [0, 46, NaN, 1.5]) expect(() => numberToPoint(n)).toThrow();
  });

  it('computes hand-checkable line distances and graph topology', () => {
    const points = [1, 2, 3, 4, 5, 6].map(numberToPoint);
    const signature = shapeSignature([1, 2, 3, 4, 5, 6]);
    expect(signature).toHaveLength(32);
    expect(SHAPE_FEATURE_NAMES).toHaveLength(32);
    expect(signature[0]).toBe(1);
    expect(signature[1]).toBe(5);
    expect(signature[2]).toBeCloseTo(7 / 3);
    expect(signature[3]).toBe(2);
    expect(signature[5]).toBe(1);
    const profile = graphProfile(pairMatrix(points, 'euclidean'), 1);
    expect(profile.clusterSizes).toEqual([6]);
    expect(profile.edges).toBe(5);
    expect(profile.averageDegree).toBeCloseTo(10 / 6);
    expect(profile.density).toBeCloseTo(1 / 3);
  });

  it('distinguishes cluster partitions and preserves relative D4 symmetry', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 5 },
    ];
    expect(graphProfile(pairMatrix(points, 'euclidean'), 2).clusterSizes).toEqual([
      3, 3,
    ]);
    const expected = signatureFromPoints(points);
    const transformed = signatureFromPoints(
      points.map((p) => ({ x: -p.y + 10, y: p.x - 5 })),
    );
    transformed.forEach((value, i) => expect(value).toBeCloseTo(expected[i]!, 10));
    signatureFromPoints([...points].reverse()).forEach((value, i) =>
      expect(value).toBeCloseTo(expected[i]!, 10),
    );
    for (const numbers of sampleCombinations(100, 13))
      expect(shapeSignature(numbers).every(Number.isFinite)).toBe(true);
    expect(() => shapeSignature([1, 1, 2, 3, 4, 5])).toThrow();
  });

  it('learns scales only from supplied history, with disjoint neighbor successors', () => {
    const forecast = forecastShape(buildShapeHistory(draws.slice(0, 80)));
    expect(forecast.trainedThrough).toBe(80);
    expect(forecast.neighborSuccessorRounds.every((r) => r < 78)).toBe(true);
    expect(forecast.neighborSuccessorRounds).toHaveLength(12);
    expect(
      forecastShape(buildShapeHistory(draws.slice(0, 80)), { trainingWindow: 60 })
        .trainingSamples,
    ).toBe(60);
    expect(() => buildShapeHistory([draws[0]!, draws[2]!])).toThrow();
  });

  it('never relaxes diversity and excludes duplicate games', () => {
    const games = randomShapeGames(30, 71, 3);
    games.forEach((a, i) =>
      games
        .slice(i + 1)
        .forEach((b) => expect(overlap(a.numbers, b.numbers)).toBeLessThanOrEqual(3)),
    );
    expect(() => diverseGames(Array(30).fill(games[0]), 30, 4)).toThrow();
    expect(() => randomShapeGames(30, 71, 5)).toThrow();
  });

  it('integrates experimental nested 5/10/30 games without claiming a signal or future leakage', () => {
    const config = { sampleSize: 1_000, seed: 14, topFraction: 0.25 };
    const prediction = predictNextCandidates(draws, 79, 'shape-7x7', config);
    const changed = [
      ...draws.slice(0, 80),
      ...draws.slice(80).map((d) => ({ ...d, numbers: [1, 2, 3, 4, 5, 6] })),
    ];
    expect(predictNextCandidates(changed, 79, 'shape-7x7', config).gameSets).toEqual(
      prediction.gameSets,
    );
    expect(prediction.gameSets.map((s) => s.games.length)).toEqual([5, 10, 30]);
    expect(prediction.gameSets[0]!.games).toEqual(
      prediction.gameSets[2]!.games.slice(0, 5),
    );
    expect(prediction.diagnostics.selectedFeatureCount).toBe(0);
    expect(prediction.diagnostics.experimental?.status).toBe('unvalidated');
    expect(prediction.metadata.parameters.coordinateSystem).toBe('board');
    expect(prediction.metadata.parameters.shape?.neighbors).toBe(12);
  });
});
