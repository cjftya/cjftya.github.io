import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { findShapeCandidates } from '../src/uriel/analysis/candidates';
import { pointForNumber, metricsForNumbers } from '../src/uriel/analysis/geometry';
import { buildHistoryFrame } from '../src/uriel/analysis/history';
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
});
