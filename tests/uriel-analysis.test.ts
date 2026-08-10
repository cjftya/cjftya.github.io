import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  findBaselineCandidates,
  findShapeCandidates,
} from '../src/uriel/analysis/candidates';
import {
  assertBacktestRoundMetrics,
  buildFailureCase,
  type BacktestRoundResult,
} from '../src/uriel/analysis/backtest';
import {
  buildCandidatePoolAnalysis,
  buildCombinationAnalysis,
  scoreContributionFor,
} from '../src/uriel/analysis/combination';
import { pointForNumber, metricsForNumbers } from '../src/uriel/analysis/geometry';
import { buildHistoryFrame } from '../src/uriel/analysis/history';
import {
  buildPurchasePortfolio,
  buildTailCoveragePortfolio,
  diagnosePurchasePortfolio,
} from '../src/uriel/analysis/purchase';
import {
  boardShapeFeatures,
  forecastBoardShapeTransitions,
} from '../src/uriel/analysis/shapeTransition';
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
    const result = findShapeCandidates(draws, 2, 'circle', 100);
    const candidates = result.candidates;
    expect(candidates).toHaveLength(100);
    expect(new Set(candidates.map(({ numbers }) => numbers.join('-'))).size).toBe(100);
    expect(result.method).toMatchObject({
      searchSpace: 40000,
      featureCount: 8,
      diversified: true,
    });
    expect(new Set(candidates.flatMap(({ numbers }) => numbers)).size).toBeGreaterThan(
      40,
    );
  });

  it('uses expanded board features and known-only similar transitions', () => {
    const history = Array.from({ length: 14 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-01-${String(index + 1).padStart(2, '0')}`,
      numbers: [1, 8, 15, 22, 29, 36].map((number) => ((number + index - 1) % 45) + 1),
    }));
    const changedFuture = history.map((draw, index) =>
      index > 11 ? { ...draw, numbers: [2, 9, 16, 23, 30, 37] } : draw,
    );
    const first = findShapeCandidates(history, 11, 'board', 12);
    const second = findShapeCandidates(changedFuture, 11, 'board', 12);

    expect(first).toEqual(second);
    expect(first.method.featureCount).toBe(35);
    expect(first.method.transitionNeighbors).toBeGreaterThan(0);
  });

  it('trains the ridge transition only on known history and layers the portfolio', () => {
    const history = Array.from({ length: 96 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
      numbers: [1, 8, 15, 22, 29, 36].map(
        (number, offset) => ((number + index * (offset + 1) - 1) % 45) + 1,
      ),
    }));
    const changedFuture = history.map((draw, index) =>
      index > 89 ? { ...draw, numbers: [3, 10, 17, 24, 31, 38] } : draw,
    );
    const first = findShapeCandidates(history, 89, 'board', 100, 'hybrid');
    const second = findShapeCandidates(changedFuture, 89, 'board', 100, 'hybrid');

    expect(first).toEqual(second);
    expect(first.method.ridgeTrainingSamples).toBeGreaterThanOrEqual(72);
    expect(first.method.portfolio).toEqual({
      explore: 55,
      focus: 35,
      confidence: 10,
    });
    expect(new Set(first.candidates.map(({ tier }) => tier))).toEqual(
      new Set(['explore', 'focus', 'confidence']),
    );
  });

  it('keeps the previous numerical model as an isolated baseline', () => {
    const baseline = findBaselineCandidates(draws, 2, 'board', 12);
    expect(baseline.method.model).toBe('baseline');
    expect(baseline.method.ridgeTrainingSamples).toBe(0);
    expect(baseline.method.portfolio).toBeUndefined();
    expect(baseline.candidates.every(({ tier }) => tier === undefined)).toBe(true);
  });

  it('keeps the selected model signal in ten role-balanced purchase games', () => {
    const history = Array.from({ length: 96 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
      numbers: [1, 8, 15, 22, 29, 36].map(
        (number, offset) => ((number + index * (offset + 1) - 1) % 45) + 1,
      ),
    }));
    const research = findShapeCandidates(history, 89, 'board', 100, 'hybrid');
    const purchase = buildPurchasePortfolio(research.candidates, 'board');

    expect(purchase.games).toHaveLength(10);
    expect(new Set(purchase.games.map(({ numbers }) => numbers.join('-'))).size).toBe(
      10,
    );
    expect(
      purchase.games.every(
        ({ numbers }) =>
          numbers.length === 6 &&
          new Set(numbers).size === 6 &&
          numbers.every((number) => number >= 1 && number <= 45),
      ),
    ).toBe(true);
    expect(purchase.optimizedScenarioCount).toBe(80);
    expect(purchase.topTenRetained).toBeGreaterThan(0);
    expect(purchase.topTenRetained).toBeLessThanOrEqual(10);
    expect(purchase.priorityNumbers).toHaveLength(18);
    expect(purchase.coreNumbers).toHaveLength(8);
    expect(
      purchase.games.reduce<Record<string, number>>((counts, game) => {
        counts[game.purchaseRole] = (counts[game.purchaseRole] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({ focus: 4, hypothesis: 3, coverage: 2, anchor: 1 });
    const hypothesisGames = purchase.games.filter(
      ({ purchaseRole }) => purchaseRole === 'hypothesis',
    );
    expect(hypothesisGames).toHaveLength(3);
    expect(hypothesisGames.every(({ reason }) => reason.includes('선택 모델'))).toBe(
      true,
    );

    const tailCoverage = buildTailCoveragePortfolio(research.candidates, 'board');
    const tailGames = tailCoverage.games.filter(
      ({ researchRank }) =>
        researchRank !== undefined && researchRank >= 31 && researchRank <= 80,
    );
    expect(tailCoverage.games).toHaveLength(10);
    expect(tailGames).toHaveLength(3);
    expect(
      new Set(tailCoverage.games.map(({ numbers }) => numbers.join('-'))).size,
    ).toBe(10);
  });

  it('keeps a direct shape selection as the tenth purchase game', () => {
    const research = findShapeCandidates(draws, 2, 'circle', 100, 'hybrid');
    const selected = research.candidates.at(-1)!;
    const purchase = buildPurchasePortfolio(research.candidates, 'circle', selected);

    expect(purchase.userAnchorUsed).toBe(true);
    expect(purchase.games.at(-1)?.numbers).toEqual(selected.numbers);
    expect(purchase.games.at(-1)?.purchaseRole).toBe('anchor');
  });

  it('optimizes the selected research pool without inventing combinations', () => {
    const research = findShapeCandidates(draws, 2, 'board', 100, 'baseline');
    const purchase = buildPurchasePortfolio(research.candidates, 'board');

    const researchKeys = new Set(
      research.candidates.map(({ numbers }) => numbers.join('-')),
    );
    expect(
      purchase.games.every(({ numbers }) => researchKeys.has(numbers.join('-'))),
    ).toBe(true);
    expect(purchase.optimizedScenarioCount).toBe(80);
    expect(purchase.topTenRetained).toBeGreaterThan(0);
    expect(
      new Set(purchase.games.flatMap(({ numbers }) => numbers)).size,
    ).toBeGreaterThan(15);
  });

  it('predicts 7x7 shape paths independently without reading the future', () => {
    const history = Array.from({ length: 40 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-02-${String((index % 28) + 1).padStart(2, '0')}`,
      numbers: [1, 8, 15, 22, 29, 36].map(
        (number, offset) => ((number + index * (offset + 1) - 1) % 45) + 1,
      ),
    }));
    const changedFuture = history.map((draw, index) =>
      index > 34 ? { ...draw, numbers: [3, 9, 18, 27, 36, 45] } : draw,
    );
    const forecast = forecastBoardShapeTransitions(history, 34);

    expect(boardShapeFeatures(history[34]!.numbers)).toHaveLength(19);
    expect(forecast).toEqual(forecastBoardShapeTransitions(changedFuture, 34));
    expect(forecast.neighbors).toBe(24);
    expect(forecast.scenarios.length).toBeGreaterThanOrEqual(1);
    expect(forecast.scenarios.length).toBeLessThanOrEqual(3);
    expect(
      forecast.scenarios.reduce((sum, scenario) => sum + scenario.probability, 0),
    ).toBeCloseTo(1);
  });

  it('exposes the sequence shape model as a separate candidate experiment', () => {
    const history = Array.from({ length: 40 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-03-${String((index % 28) + 1).padStart(2, '0')}`,
      numbers: [2, 9, 16, 23, 30, 37].map(
        (number, offset) => ((number + index * (offset + 1) - 1) % 45) + 1,
      ),
    }));
    const result = findShapeCandidates(history, 34, 'board', 100, 'shape-transition');

    expect(result.candidates).toHaveLength(100);
    expect(result.method).toMatchObject({
      model: 'shape-transition',
      featureCount: 19,
      shapeSequenceNeighbors: 24,
    });
    expect(result.method.shapeScenarioCount).toBeGreaterThanOrEqual(1);
  });

  it('diagnoses where a known result leaves the purchase pipeline', () => {
    const research = findShapeCandidates(draws, 1, 'board', 100, 'hybrid');
    const purchase = buildPurchasePortfolio(research.candidates, 'board');
    const diagnostics = diagnosePurchasePortfolio(
      purchase,
      research.candidates,
      draws[2]!.numbers,
    );

    expect(diagnostics.priorityMatches.length).toBeLessThanOrEqual(6);
    expect(diagnostics.poolCaptures.map(({ size }) => size)).toEqual([
      10, 12, 15, 18, 20,
    ]);
    expect(diagnostics.reachableBestMatch).toBe(
      diagnostics.poolCaptures.find(({ size }) => size === 15)?.matches.length,
    );
    expect(diagnostics.researchEfficiency).toBeGreaterThanOrEqual(0);
    expect(diagnostics.researchEfficiency).toBeLessThanOrEqual(1);
    expect(diagnostics.compressionEfficiency).toBeGreaterThanOrEqual(0);
    expect(diagnostics.compressionEfficiency).toBeLessThanOrEqual(1);
    expect(diagnostics.researchBestMatch).toBeGreaterThanOrEqual(
      diagnostics.purchaseBestMatch,
    );
    expect(['number-pool', 'combination', 'compression', 'success']).toContain(
      diagnostics.bottleneck,
    );
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

  it('separates a deterministic number pool from combination strategies', () => {
    const history = Array.from({ length: 100 }, (_, index): LottoDraw => ({
      round: index + 1,
      date: `2026-04-${String((index % 28) + 1).padStart(2, '0')}`,
      numbers: [1, 8, 15, 22, 29, 36].map(
        (number, offset) => ((number + index * (offset + 1) - 1) % 45) + 1,
      ),
    }));
    const changedFuture = history.map((draw, index) =>
      index > 89 ? { ...draw, numbers: [3, 10, 17, 24, 31, 38] } : draw,
    );
    const first = buildCombinationAnalysis(history, 89, 20, false, 'full-enumeration');
    const second = buildCombinationAnalysis(
      changedFuture,
      89,
      20,
      false,
      'full-enumeration',
    );

    expect(first).toEqual(second);
    expect(first.candidatePool).toHaveLength(20);
    expect(first.rawCombinationCount).toBe(38_760);
    expect(first.expectedCombinationCount).toBe(38_760);
    expect(first.generationComplete).toBe(true);
    expect(first.generationMode).toBe('full-enumeration');
    expect(first.researchByStrategy['full-hybrid']).toHaveLength(100);
    expect(
      first.researchByStrategy['full-hybrid'].every(({ numbers }) =>
        numbers.every((number) => first.candidatePool.includes(number)),
      ),
    ).toBe(true);
    const best = first.researchByStrategy['full-hybrid'][0]!;
    const contribution = scoreContributionFor(best.features, 'full-hybrid');
    expect(contribution.finalScore).toBeCloseTo(best.combinationScore);
  }, 60_000);

  it('keeps candidate, strategy, and legacy oracle metrics isolated', () => {
    const round: BacktestRoundResult = {
      round: 1109,
      candidateRecall: { 15: 3 },
      candidateMatches: { 15: [3, 17, 41] },
      combinationGenerationMaxHit: 3,
      combinationGenerationBestNumbers: [3, 17, 29, 34, 40, 41],
      combinationGenerationMatches: [3, 17, 41],
      generationLoss: 0,
      rawCombinationCount: 5005,
      expectedCombinationCount: 5005,
      generationComplete: true,
      legacyOracleMax: 5,
      legacyOracleMatches: [3, 17, 29, 34, 41],
      strategies: {
        'full-hybrid': {
          strategyOracleMax: 3,
          strategyOracleMatches: [3, 17, 41],
          strategyOracleSource: 'candidate-pool',
          top100Max: 3,
          naiveTop10Max: 3,
          top10Max: 3,
          rankingLoss: 0,
          finalCompressionLoss: 0,
          conversionLoss: 0,
        },
        legacy: {
          strategyOracleMax: 5,
          strategyOracleMatches: [3, 17, 29, 34, 41],
          strategyOracleSource: 'legacy-priority',
          top100Max: 5,
          naiveTop10Max: 3,
          top10Max: 3,
          rankingLoss: null,
          finalCompressionLoss: 2,
          conversionLoss: 2,
        },
      },
    };

    const strategyFailure = buildFailureCase(round, 'full-hybrid', 15);
    expect(strategyFailure).toMatchObject({
      candidateRecall: 3,
      candidateMatches: [3, 17, 41],
      strategyOracleMax: 3,
      strategyOracleMatches: [3, 17, 41],
      strategyOracleSource: 'candidate-pool',
      legacyOracleMax: 5,
      legacyOracleMatches: [3, 17, 29, 34, 41],
    });
    expect(strategyFailure).not.toHaveProperty('oracleMax');
    expect(round.strategies['full-hybrid']).not.toHaveProperty('oracleMax');

    const legacyFailure = buildFailureCase(round, 'legacy', 15);
    expect(legacyFailure).toMatchObject({
      candidateRecall: 3,
      strategyOracleMax: 5,
      strategyOracleSource: 'legacy-priority',
      legacyOracleMax: 5,
    });
    assertBacktestRoundMetrics(round, 15);
  });

  it('derives round 1109 Top-15 recall only from the candidate ranking', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const history = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const actualIndex = history.findIndex(({ round }) => round === 1109);
    const actual = history[actualIndex]!;
    const analysis = buildCombinationAnalysis(history, actualIndex - 1, 15, false);
    const candidatePool = analysis.candidateRanking.slice(0, 15);
    const matches = actual.numbers.filter((number) => candidatePool.includes(number));

    expect(matches).toEqual([13, 19, 40]);
  }, 15_000);

  it('keeps round 1123 out of the corrected Top-20 five-hit opportunities', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const history = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const actualIndex = history.findIndex(({ round }) => round === 1123);
    const actual = history[actualIndex]!;
    const analysis = buildCandidatePoolAnalysis(history, actualIndex - 1, 20);
    const matches = actual.numbers.filter((number) =>
      analysis.candidatePool.includes(number),
    );

    expect(matches).toEqual([21, 24, 34, 35]);
  }, 15_000);

  it('rejects cross-wired candidate and strategy oracle metrics', () => {
    const round: BacktestRoundResult = {
      round: 1109,
      candidateRecall: { 15: 3 },
      candidateMatches: { 15: [3, 17, 41] },
      combinationGenerationMaxHit: 3,
      combinationGenerationBestNumbers: [3, 17, 29, 34, 40, 41],
      combinationGenerationMatches: [3, 17, 41],
      generationLoss: 0,
      rawCombinationCount: 5005,
      expectedCombinationCount: 5005,
      generationComplete: true,
      legacyOracleMax: 5,
      legacyOracleMatches: [3, 17, 29, 34, 41],
      strategies: {
        'full-hybrid': {
          strategyOracleMax: 5,
          strategyOracleMatches: [3, 17, 29, 34, 41],
          strategyOracleSource: 'candidate-pool',
          top100Max: 4,
          naiveTop10Max: 3,
          top10Max: 3,
          rankingLoss: 0,
          finalCompressionLoss: 1,
          conversionLoss: 2,
        },
      },
    };

    expect(() => assertBacktestRoundMetrics(round, 15)).toThrow(
      'Strategy Oracle 지표가 원본과 달라요.',
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
