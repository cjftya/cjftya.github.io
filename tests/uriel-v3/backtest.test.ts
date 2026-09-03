import { describe, expect, it } from 'vitest';
import {
  resolveV3BacktestRange,
  runV3WalkForwardBacktest,
} from '../../src/uriel/analysis/v3/backtest';
import type { V3BacktestOptions } from '../../src/uriel/analysis/v3/backtest';
import type { LottoDraw } from '../../src/uriel/types';

const draws = Array.from({ length: 100 }, (_, index): LottoDraw => ({
  round: index + 1,
  date: '',
  numbers: [
    (index % 7) + 1,
    (index % 7) + 9,
    (index % 7) + 17,
    (index % 7) + 25,
    (index % 7) + 33,
    (index % 4) + 42,
  ].sort((left, right) => left - right),
}));
const options: Partial<V3BacktestOptions> = {
  algorithmId: 'random-baseline',
  rangeMode: 'custom',
  startRound: 91,
  endRound: 94,
  config: {
    seed: 44,
    sampleSize: 2_000,
    nullSampleSize: 1_000,
    topFraction: 0.05,
  },
  randomBaselineIterations: 500,
  resultBootstrapIterations: 200,
};

describe('Uriel v3 walk-forward candidate evaluation', () => {
  it('resolves a range with at least 60 earlier training rounds', () => {
    expect(resolveV3BacktestRange(draws, options)).toEqual({
      startHistoryIndex: 89,
      endHistoryIndex: 92,
      startRound: 91,
      endRound: 94,
      evaluatedRounds: 4,
    });
    expect(() =>
      resolveV3BacktestRange(draws, {
        ...options,
        startRound: 50,
        endRound: 60,
      }),
    ).toThrow('60회 이상의 학습 데이터');
  });

  it('evaluates Hit@K against a repeated equal-size random baseline', () => {
    const result = runV3WalkForwardBacktest(draws, options);
    expect(result).toMatchObject({
      metricSchemaVersion: 3,
      startRound: 91,
      endRound: 94,
      evaluatedRounds: 4,
    });
    expect(result.summaries.map(({ candidateSize }) => candidateSize)).toEqual([
      10, 15, 20, 25, 30,
    ]);
    result.summaries.forEach((summary) => {
      expect(summary.distribution).toHaveLength(7);
      expect(summary.randomHitDistribution).toHaveLength(7);
      expect(summary.randomMeanHit).toBeCloseTo((6 * summary.candidateSize) / 45, 1);
      expect(summary.candidateRecall).toBeCloseTo(summary.meanHit / 6);
      expect(summary.candidatePrecision).toBeCloseTo(
        summary.meanHit / summary.candidateSize,
      );
      expect(summary.randomPercentile).toBeGreaterThanOrEqual(0);
      expect(summary.randomPercentile).toBeLessThanOrEqual(1);
    });
    expect(result.rounds).toHaveLength(4);
    expect(
      result.rounds.every(({ hits }) =>
        Object.values(hits).every((hit) => hit >= 0 && hit <= 6),
      ),
    ).toBe(true);
  });

  it('does not use rows after the selected validation range', () => {
    const changedFuture = draws.map((draw) =>
      draw.round > 94 ? { ...draw, numbers: [1, 2, 3, 4, 5, 6] } : draw,
    );
    const first = runV3WalkForwardBacktest(draws, options);
    const second = runV3WalkForwardBacktest(changedFuture, options);
    expect(second.rounds).toEqual(first.rounds);
    expect(second.summaries).toEqual(first.summaries);
    expect(second.verdict).toBe(first.verdict);
  });
});
