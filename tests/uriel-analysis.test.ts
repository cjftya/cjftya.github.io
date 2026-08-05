import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { findShapeCandidates } from '../src/uriel/analysis/candidates';
import { pointForNumber, metricsForNumbers } from '../src/uriel/analysis/geometry';
import { buildHistoryFrame } from '../src/uriel/analysis/history';
import {
  evaluateCandidates,
  patternsForNumbers,
  shapeSimilarity,
} from '../src/uriel/analysis/validation';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const draws: LottoDraw[] = [
  { round: 1, date: '2002-12-07', numbers: [10, 23, 29, 33, 37, 40] },
  { round: 2, date: '2002-12-14', numbers: [9, 13, 21, 25, 32, 42] },
  { round: 3, date: '2002-12-21', numbers: [11, 16, 19, 21, 27, 31] },
];

describe('Uriel geometry', () => {
  it('maps the pick board to a seven by seven coordinate system', () => {
    expect(pointForNumber(1, 'board')).toEqual({ number: 1, x: -0.86, y: -0.86 });
    expect(pointForNumber(7, 'board')).toEqual({ number: 7, x: 0.86, y: -0.86 });
    expect(pointForNumber(8, 'board')).toEqual({
      number: 8,
      x: -0.86,
      y: expect.closeTo(-0.5733333333333334),
    });
    expect(pointForNumber(45, 'board').y).toBeCloseTo(0.86);
  });

  it('produces finite shape metrics for both layouts', () => {
    for (const layout of ['circle', 'board'] as const) {
      const metrics = metricsForNumbers(draws[0]!.numbers, layout);
      expect(metrics.area).toBeGreaterThan(0);
      expect(metrics.perimeter).toBeGreaterThan(0);
      expect(metrics.compactness).toBeGreaterThanOrEqual(0);
      expect(metrics.compactness).toBeLessThanOrEqual(1);
    }
  });
});

describe('Uriel history models', () => {
  it('keeps only the current draw in independent mode', () => {
    const frame = buildHistoryFrame(draws, 2, 'independent', 18, 'circle');
    expect(frame.draws).toHaveLength(1);
    expect(frame.draws[0]?.draw.round).toBe(3);
  });

  it('weights recent draws more in decay mode', () => {
    const frame = buildHistoryFrame(draws, 2, 'decay', 2, 'circle');
    expect(frame.draws[0]!.weight).toBeLessThan(frame.draws[2]!.weight);
    expect(frame.numberWeights[11]).toBeGreaterThan(frame.numberWeights[10]!);
  });
});

describe('Uriel data and candidate search', () => {
  it('loads the bundled history through the latest published round', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const bundled = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    expect(bundled).toHaveLength(1235);
    expect(bundled.at(-1)).toEqual({
      round: 1235,
      date: '2026-08-01',
      numbers: [6, 7, 11, 15, 39, 43],
    });
  });

  it('ignores headers and reads only six winning numbers', () => {
    const csv =
      'round,date,n1,n2,n3,n4,n5,n6,bonus,prize\n1,2002-12-07,10,23,29,33,37,40,16,999';
    expect(parseDrawCsv(csv)).toEqual(draws.slice(0, 1));
  });

  it('returns deterministic unique candidate combinations', () => {
    const first = findShapeCandidates(draws, 2, 'board', 3).candidates;
    const second = findShapeCandidates(draws, 2, 'board', 3).candidates;
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    first.forEach((candidate) => {
      expect(candidate.numbers).toHaveLength(6);
      expect(new Set(candidate.numbers).size).toBe(6);
    });
  });

  it('can expose one hundred distinct candidates', () => {
    const candidates = findShapeCandidates(draws, 2, 'circle', 100).candidates;
    expect(candidates).toHaveLength(100);
    expect(new Set(candidates.map(({ numbers }) => numbers.join('-'))).size).toBe(100);
  });

  it('does not use the actual next draw while building candidates', () => {
    const changedFuture = [
      ...draws.slice(0, 2),
      { ...draws[2]!, numbers: [1, 2, 3, 4, 5, 6] },
    ];
    expect(findShapeCandidates(draws, 1, 'circle', 6)).toEqual(
      findShapeCandidates(changedFuture, 1, 'circle', 6),
    );
  });

  it('compares candidates with the next draw without changing prediction rank', () => {
    const actual = draws[2]!;
    const candidates = [
      {
        numbers: draws[0]!.numbers,
        metrics: metricsForNumbers(draws[0]!.numbers, 'board'),
        score: 0.1,
      },
      {
        numbers: actual.numbers,
        metrics: metricsForNumbers(actual.numbers, 'board'),
        score: 0.2,
      },
    ];
    const validation = evaluateCandidates(candidates, actual, 'board');

    expect(validation.evaluations.map(({ rank }) => rank)).toEqual([1, 2]);
    expect(validation.bestByNumbers.rank).toBe(2);
    expect(validation.bestByNumbers.matchedNumbers).toHaveLength(6);
    expect(validation.bestByShape.rank).toBe(2);
    expect(validation.bestByShape.shapeSimilarity).toBeCloseTo(100);
    expect(
      validation.matchDistribution.reduce((sum, row) => sum + row.observed, 0),
    ).toBe(2);
    expect(
      validation.matchDistribution.reduce((sum, row) => sum + row.expected, 0),
    ).toBeCloseTo(2);
  });

  it('calculates stable number patterns and bounded shape similarity', () => {
    expect(patternsForNumbers([1, 2, 11, 22, 34, 45])).toEqual({
      oddCount: 3,
      lowCount: 4,
      sum: 115,
      consecutivePairs: 1,
      averageGap: 8.8,
    });
    const first = metricsForNumbers(draws[0]!.numbers, 'circle');
    const second = metricsForNumbers(draws[1]!.numbers, 'circle');
    expect(shapeSimilarity(first, first)).toBe(100);
    expect(shapeSimilarity(first, second)).toBeGreaterThan(0);
    expect(shapeSimilarity(first, second)).toBeLessThanOrEqual(100);
  });
});
