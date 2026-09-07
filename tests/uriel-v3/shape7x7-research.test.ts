import { describe, expect, it } from 'vitest';
import { sampleCombinations } from '../../src/uriel/analysis/v3/random';
import { runV3WalkForwardBacktest } from '../../src/uriel/analysis/v3/backtest';
import { runShapeNullStudy } from '../../src/uriel/analysis/v3/shape7x7/study';
import {
  blockMeanInterval,
  holmCorrection,
  measurePortfolio,
  upperTailPValue,
} from '../../src/uriel/analysis/v3/shape7x7/evaluation';
import { DEFAULT_SHAPE_CONFIG } from '../../src/uriel/analysis/v3/shape7x7/config';
import type { LottoDraw } from '../../src/uriel/types';

const draws: LottoDraw[] = sampleCombinations(72, 591).map((numbers, i) => ({
  numbers,
  round: i + 1,
  date: '',
}));

describe('Shape Core scientific guardrails', () => {
  it('does not interpret full number coverage as predictive recall', () => {
    const games = Array.from({ length: 45 }, (_, i) => ({
      numbers: Array.from({ length: 6 }, (_, j) => ((i + j) % 45) + 1),
      structuralScore: 0.5,
    }));
    const metrics = measurePortfolio(games, [1, 8, 15, 22, 29, 45]);
    expect(metrics.recall).toBe(1);
    expect(metrics.unionSize).toBe(45);
    expect(metrics.coverageAdjustedHits).toBe(0);
    expect(metrics.bestHit).toBe(2);
  });

  it('uses conservative Monte Carlo tails, Holm correction and reproducible intervals', () => {
    expect(upperTailPValue(1, [1, 1, 1])).toBe(1);
    expect(upperTailPValue(2, [1, 1, 1])).toBe(0.25);
    expect(holmCorrection([0.01, 0.04, 0.02])).toEqual([0.03, 0.04, 0.04]);
    expect(blockMeanInterval([2, 2, 2, 2], 100, 7)).toEqual([2, 2]);
  });

  it('runs the shape-specific walk-forward with actual prefix-only normalization and equal diversity', () => {
    const requested = {
      algorithmId: 'shape-7x7' as const,
      rangeMode: 'custom' as const,
      startRound: 61,
      endRound: 62,
      randomBaselineIterations: 100,
      resultBootstrapIterations: 100,
      config: { sampleSize: 1_000, topFraction: 0.25, seed: 7 },
    };
    const first = runV3WalkForwardBacktest(draws, requested);
    const changed = draws.map((draw) =>
      draw.round > 62 ? { ...draw, numbers: [1, 2, 3, 4, 5, 6] } : draw,
    );
    const second = runV3WalkForwardBacktest(changed, requested);
    expect(first.shape?.rounds).toEqual(second.shape?.rounds);
    expect(first.summaries).toEqual(second.summaries);
    expect(first.shape?.rounds.map((r) => [r.trainedThrough, r.round])).toEqual([
      [60, 61],
      [61, 62],
    ]);
    expect(first.shape?.portfolios).toHaveLength(3);
    expect(first.shape?.nullHistories).toBe(0);
    expect(first.signalRounds).toBe(0);
    expect(first.verdict).toBe('indistinguishable');
  });

  it('reruns full synthetic/shuffled histories and never promotes tiny smoke samples', () => {
    const config = {
      rounds: 6,
      nullHistories: 3,
      sampleSize: 1_000,
      bootstrapIterations: 100,
      seed: 881,
      shape: { ...DEFAULT_SHAPE_CONFIG },
    };
    const first = runShapeNullStudy(draws, config);
    const repeated = runShapeNullStudy(draws, config);
    expect(first.endpoints).toEqual(repeated.endpoints);
    expect(first.nullDistributions).toEqual(repeated.nullDistributions);
    expect(first.nullDistributions).toHaveLength(7);
    expect(first.nullDistributions.every((d) => d.length === 3)).toBe(true);
    expect(first.signal).toBe('no-signal');
    expect(
      first.endpoints.every((e) => e.pValue >= 0.25 && e.adjustedPValue >= e.pValue),
    ).toBe(true);
    const shuffled = runShapeNullStudy(draws, { ...config, nullKind: 'shuffled' });
    expect(shuffled.nullDistributions).not.toEqual(first.nullDistributions);
    expect(shuffled.signal).toBe('no-signal');
    expect(() => runShapeNullStudy(draws, { ...config, nullHistories: 0 })).toThrow();
  });
});
