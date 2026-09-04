import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESEARCH_ALGORITHM_ID,
  randomBaselineAlgorithm,
  researchAlgorithmDefinitions,
} from '../../src/uriel/analysis/v3/catalog';
import {
  createRandom,
  mixSeed,
  sampleCombination,
  sampleCombinations,
} from '../../src/uriel/analysis/v3/random';
import {
  GAME_COUNTS,
  partitionHistory,
  sanitizeResearchConfig,
} from '../../src/uriel/analysis/v3/types';
import type { LottoDraw } from '../../src/uriel/types';

const draws = Array.from({ length: 100 }, (_, index): LottoDraw => ({
  round: index + 1,
  date: '',
  numbers: [1, 2, 3, 4, 5, 6],
}));

describe('Uriel v3 foundation', () => {
  it('publishes the required game counts and initial algorithm menu', () => {
    expect(GAME_COUNTS).toEqual([5, 10, 30]);
    expect(researchAlgorithmDefinitions.map(({ id }) => id)).toEqual([
      'random-baseline',
      'distance',
      'distribution',
      'geometry',
      'contrastive-ensemble',
    ]);
    expect(DEFAULT_RESEARCH_ALGORITHM_ID).toBe('random-baseline');
  });

  it('generates valid deterministic combinations without replacement', () => {
    const first = sampleCombinations(20, 12345);
    const second = sampleCombinations(20, 12345);
    expect(second).toEqual(first);
    expect(sampleCombinations(20, 54321)).not.toEqual(first);
    expect(
      first.every(
        (numbers) =>
          numbers.length === 6 &&
          new Set(numbers).size === 6 &&
          numbers.every((number) => number >= 1 && number <= 45),
      ),
    ).toBe(true);
    const random = createRandom(1);
    expect(sampleCombination(random)).toEqual(sampleCombination(createRandom(1)));
    expect(mixSeed(1, 2, 3)).toBe(mixSeed(1, 2, 3));
  });

  it('keeps discovery, validation and holdout temporally separated', () => {
    const partition = partitionHistory(draws);
    expect(partition.discovery).toHaveLength(60);
    expect(partition.validation).toHaveLength(20);
    expect(partition.holdout).toHaveLength(20);
    expect(partition.discovery.at(-1)?.round).toBeLessThan(
      partition.validation[0]!.round,
    );
    expect(partition.validation.at(-1)?.round).toBeLessThan(
      partition.holdout[0]!.round,
    );
  });

  it('keeps the baseline history-independent and sanitizes unsafe settings', () => {
    const config = sanitizeResearchConfig({
      seed: -1,
      sampleSize: 99_000_000,
      nullSampleSize: 1,
      topFraction: 2,
    });
    expect(config).toMatchObject({
      seed: 4_294_967_295,
      sampleSize: 2_000_000,
      nullSampleSize: 1_000,
      topFraction: 0.25,
    });
    const fitted = randomBaselineAlgorithm.fit(draws, config);
    expect(fitted.scoreCombination([1, 2, 3, 4, 5, 6])).toBe(0.5);
    expect(fitted.diagnostics.selectedFeatureCount).toBe(0);
  });
});
