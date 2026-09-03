import { describe, expect, it } from 'vitest';
import { predictNextCandidates } from '../../src/uriel/analysis/v3/prediction';
import { projectCandidateScores } from '../../src/uriel/analysis/v3/projection';
import type { FittedCombinationModel } from '../../src/uriel/analysis/v3/types';
import { sanitizeResearchConfig } from '../../src/uriel/analysis/v3/types';
import type { LottoDraw } from '../../src/uriel/types';

const diagnostics = {
  features: [],
  selectedFeatureCount: 0,
  partitions: { discovery: 0, validation: 0, holdout: 0 },
  winningSamples: 0,
  randomSamples: 0,
};
const config = sanitizeResearchConfig({
  seed: 123,
  sampleSize: 20_000,
  nullSampleSize: 1_000,
  topFraction: 0.05,
  bootstrapIterations: 0,
  permutationIterations: 0,
});

describe('Uriel v3 candidate projection', () => {
  it('projects a deterministic top combination space into nested candidate sets', () => {
    const model: FittedCombinationModel = {
      id: 'random-baseline',
      diagnostics,
      scoreCombination: () => 0.5,
    };
    const first = projectCandidateScores(model, config, 9);
    const second = projectCandidateScores(model, config, 9);
    expect(second).toEqual(first);
    expect(first.retainedCombinations).toBe(1_000);
    expect(first.candidateSets.map(({ size }) => size)).toEqual([10, 15, 20, 25, 30]);
    expect(first.numberScores).toHaveLength(45);
    first.candidateSets.forEach(({ size, numbers }) => {
      expect(numbers).toHaveLength(size);
      expect(new Set(numbers).size).toBe(size);
    });
    for (let index = 1; index < first.candidateSets.length; index += 1) {
      expect(
        first.candidateSets[index - 1]!.numbers.every((number) =>
          first.candidateSets[index]!.numbers.includes(number),
        ),
      ).toBe(true);
    }
  });

  it('raises numbers supported by high-scoring structural combinations', () => {
    const model: FittedCombinationModel = {
      id: 'distance',
      diagnostics,
      scoreCombination(numbers) {
        return Math.max(
          0,
          1 - (numbers.reduce((sum, number) => sum + number, 0) - 21) / 150,
        );
      },
    };
    const result = projectCandidateScores(model, config, 20);
    const topTen = result.candidateSets[0]!.numbers;
    expect(topTen.filter((number) => number <= 15).length).toBeGreaterThanOrEqual(7);
  });
});

describe('Uriel v3 prediction boundary', () => {
  const draws = Array.from({ length: 100 }, (_, index): LottoDraw => ({
    round: index + 1,
    date: '',
    numbers: [1, 8, 16, 24, 32, 40],
  }));

  it('does not read any draw after the requested history index', () => {
    const changedFuture = draws.map((draw, index) =>
      index > 79 ? { ...draw, numbers: [2, 9, 17, 25, 33, 41] } : draw,
    );
    const first = predictNextCandidates(draws, 79, 'random-baseline', config);
    const second = predictNextCandidates(changedFuture, 79, 'random-baseline', config);
    expect(second.candidateSets).toEqual(first.candidateSets);
    expect(second.numberScores).toEqual(first.numberScores);
    expect(first.metadata).toMatchObject({
      algorithm: 'random-baseline',
      dataStartRound: 1,
      dataEndRound: 80,
      randomSeed: 123,
      sampleSize: 20_000,
      retainedCombinations: 1_000,
    });
  });
});
