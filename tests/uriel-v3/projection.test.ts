import { describe, expect, it } from 'vitest';
import { predictNextCandidates } from '../../src/uriel/analysis/v3/prediction';
import { selectCandidateGames } from '../../src/uriel/analysis/v3/projection';
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

describe('Uriel v3 candidate game selection', () => {
  it('selects deterministic nested 5, 10 and 30 game lists', () => {
    let scoreCalls = 0;
    const model: FittedCombinationModel = {
      id: 'random-baseline',
      diagnostics,
      scoreCombination: () => {
        scoreCalls += 1;
        return 0.5;
      },
    };
    const first = selectCandidateGames(model, config, 9);
    expect(scoreCalls).toBe(0);
    const second = selectCandidateGames(model, config, 9);
    expect(scoreCalls).toBe(0);
    expect(second).toEqual(first);
    expect(first.retainedCombinations).toBe(0);
    expect(first.gameSets.map(({ count }) => count)).toEqual([5, 10, 30]);
    first.gameSets.forEach(({ count, games }) => {
      expect(games).toHaveLength(count);
      expect(new Set(games.map(({ numbers }) => numbers.join('-'))).size).toBe(count);
      games.forEach(({ numbers, structuralScore }) => {
        expect(numbers).toHaveLength(6);
        expect(new Set(numbers).size).toBe(6);
        expect(structuralScore).toBe(0.5);
      });
    });
    for (let index = 1; index < first.gameSets.length; index += 1) {
      expect(
        first.gameSets[index - 1]!.games.every((game, gameIndex) =>
          game.numbers.every(
            (number) =>
              first.gameSets[index]!.games[gameIndex]?.numbers.includes(number) ??
              false,
          ),
        ),
      ).toBe(true);
    }
  });

  it('keeps high-scoring combinations while reducing excessive overlap', () => {
    const model: FittedCombinationModel = {
      id: 'distance',
      diagnostics: { ...diagnostics, selectedFeatureCount: 1 },
      scoreCombination(numbers) {
        return Math.max(
          0,
          1 - (numbers.reduce((sum, number) => sum + number, 0) - 21) / 150,
        );
      },
    };
    const result = selectCandidateGames(model, config, 20);
    expect(result.retainedCombinations).toBe(1_000);
    const fiveGames = result.gameSets[0]!.games;
    expect(fiveGames).toHaveLength(5);
    expect(fiveGames.every(({ structuralScore }) => structuralScore > 0.45)).toBe(true);
    expect(
      fiveGames.every((game, index) =>
        fiveGames
          .slice(index + 1)
          .every(
            (other) =>
              game.numbers.filter((number) => other.numbers.includes(number)).length <=
              2,
          ),
      ),
    ).toBe(true);
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
    expect(second.gameSets).toEqual(first.gameSets);
    expect(first.metadata).toMatchObject({
      algorithm: 'random-baseline',
      dataStartRound: 1,
      dataEndRound: 80,
      randomSeed: 123,
      sampleSize: 20_000,
      retainedCombinations: 0,
      gameCounts: [5, 10, 30],
    });
  });
});
