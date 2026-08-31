import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  algorithmDefinition,
  algorithmDefinitions,
  DEFAULT_ALGORITHM_ID,
} from '../src/uriel/analysis/algorithmCatalog';
import { runAlgorithm } from '../src/uriel/analysis/algorithmRunner';
import {
  estimateNextMetrics,
  findBaselineCandidates,
} from '../src/uriel/analysis/candidates';
import { metricsForNumbers } from '../src/uriel/analysis/geometry';
import {
  buildAlgorithmPurchasePortfolio,
  buildPurchasePortfolio,
  diagnosePurchasePortfolio,
} from '../src/uriel/analysis/purchase';
import {
  evaluateCandidates,
  patternsForNumbers,
  shapeSimilarity,
} from '../src/uriel/analysis/validation';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

describe('Uriel 선택 알고리즘', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    draws = parseDrawCsv(
      await readFile(
        new URL('../public/projects/uriel/data/draws.csv', import.meta.url),
        'utf8',
      ),
    );
  });

  it('registers the baseline and restored transition-tail methods', () => {
    expect(algorithmDefinitions).toEqual([
      expect.objectContaining({ id: 'baseline', label: '기본 방식' }),
      expect.objectContaining({
        id: 'transition-tail',
        label: '형태 전이 + Tail Coverage',
        fixedLayout: 'board',
      }),
    ]);
    expect(DEFAULT_ALGORITHM_ID).toBe('baseline');
    expect(algorithmDefinition('baseline').description).not.toBe('');
  });

  it.each(['circle', 'board'] as const)(
    'returns one hundred deterministic unique candidates in %s layout',
    (layout) => {
      const first = findBaselineCandidates(draws, 1238, layout, 100);
      const second = runAlgorithm('baseline', draws, 1238, layout, 100);
      expect(second).toEqual({ ...first, layout });
      expect(first.candidates).toHaveLength(100);
      expect(
        new Set(first.candidates.map(({ numbers }) => numbers.join('-'))).size,
      ).toBe(100);
      expect(
        first.candidates.every(
          ({ numbers }) =>
            numbers.length === 6 &&
            new Set(numbers).size === 6 &&
            numbers.every((number) => number >= 1 && number <= 45),
        ),
      ).toBe(true);
      expect(first.method).toMatchObject({
        algorithmId: 'baseline',
        searchSpace: 40_000,
        diversified: true,
      });
    },
  );

  it('restores the 7x7 transition ranking and tail-coverage purchase policy', () => {
    const result = runAlgorithm('transition-tail', draws, 1238, 'circle', 100);
    expect(result.layout).toBe('board');
    expect(result.candidates).toHaveLength(100);
    expect(
      new Set(result.candidates.map(({ numbers }) => numbers.join('-'))).size,
    ).toBe(100);
    expect(result.method).toMatchObject({
      algorithmId: 'transition-tail',
      sourceModel: 'shape-transition',
      searchSpace: 5_005,
      featureCount: 16,
    });

    const purchase = buildAlgorithmPurchasePortfolio(
      'transition-tail',
      result.candidates,
      result.layout,
    );
    expect(purchase.games).toHaveLength(10);
    expect(
      purchase.games.filter(
        ({ researchRank }) =>
          researchRank !== undefined && researchRank >= 31 && researchRank <= 80,
      ),
    ).toHaveLength(3);
  });

  it('does not read a changed future result', () => {
    const changed = draws.map((draw, index) =>
      index > 1234 ? { ...draw, numbers: [1, 2, 3, 4, 5, 6] } : draw,
    );
    expect(findBaselineCandidates(draws, 1234, 'circle', 24)).toEqual(
      findBaselineCandidates(changed, 1234, 'circle', 24),
    );
  });

  it('keeps the baseline metric estimate bounded', () => {
    const metrics = estimateNextMetrics(draws, 1238, 'board');
    expect(metrics.compactness).toBeGreaterThanOrEqual(0);
    expect(metrics.compactness).toBeLessThanOrEqual(1);
    expect(metrics.orientation).toBeGreaterThanOrEqual(-180);
    expect(metrics.orientation).toBeLessThanOrEqual(180);
  });

  it('builds ten role-balanced purchase games from the baseline ranking', () => {
    const research = findBaselineCandidates(draws, 1238, 'circle', 100);
    const purchase = buildPurchasePortfolio(research.candidates, 'circle');
    expect(purchase.games).toHaveLength(10);
    expect(new Set(purchase.games.map(({ numbers }) => numbers.join('-'))).size).toBe(
      10,
    );
    expect(
      purchase.games.reduce<Record<string, number>>((counts, game) => {
        counts[game.purchaseRole] = (counts[game.purchaseRole] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({ focus: 4, hypothesis: 3, coverage: 2, anchor: 1 });
    expect(purchase.priorityNumbers).toHaveLength(18);
    expect(purchase.coreNumbers).toHaveLength(8);
  });

  it('keeps a directly selected candidate as the tenth game', () => {
    const research = findBaselineCandidates(draws, 1238, 'board', 100);
    const selected = research.candidates[42]!;
    const purchase = buildPurchasePortfolio(research.candidates, 'board', selected);
    expect(purchase.userAnchorUsed).toBe(true);
    expect(purchase.games.at(-1)?.numbers).toEqual(selected.numbers);
  });

  it('diagnoses baseline candidate and purchase loss without changing ranks', () => {
    const research = findBaselineCandidates(draws, 1237, 'board', 100);
    const purchase = buildPurchasePortfolio(research.candidates, 'board');
    const diagnostics = diagnosePurchasePortfolio(
      purchase,
      research.candidates,
      draws[1238]!.numbers,
    );
    expect(diagnostics.poolCaptures.map(({ size }) => size)).toEqual([
      10, 12, 15, 18, 20,
    ]);
    expect(diagnostics.researchBestMatch).toBeGreaterThanOrEqual(
      diagnostics.purchaseBestMatch,
    );
    expect(['number-pool', 'combination', 'compression', 'success']).toContain(
      diagnostics.bottleneck,
    );
  });

  it('compares candidates with the actual next draw separately', () => {
    const actual = draws[1238]!;
    const candidates = [
      {
        numbers: draws[1236]!.numbers,
        metrics: metricsForNumbers(draws[1236]!.numbers, 'circle'),
        score: 0.1,
      },
      {
        numbers: actual.numbers,
        metrics: metricsForNumbers(actual.numbers, 'circle'),
        score: 0.2,
      },
    ];
    const validation = evaluateCandidates(candidates, actual, 'circle');
    expect(validation.evaluations.map(({ rank }) => rank)).toEqual([1, 2]);
    expect(validation.bestByNumbers.rank).toBe(2);
    expect(validation.bestByNumbers.matchedNumbers).toHaveLength(6);
    expect(validation.bestByShape.shapeSimilarity).toBeCloseTo(100);
  });

  it('calculates stable number patterns and shape similarity', () => {
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
