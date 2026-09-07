import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDrawCsv } from '../../src/uriel/data';
import { predictNextCandidates } from '../../src/uriel/analysis/v3/prediction';
import { overlap } from '../../src/uriel/analysis/v3/shape7x7/candidates';

describe('Shape default-budget integration', () => {
  it('produces 100K-sample games on the actual bundled history', () => {
    const draws = parseDrawCsv(
      readFileSync(
        new URL('../../public/projects/uriel/data/draws.csv', import.meta.url),
        'utf8',
      ),
    );
    const started = performance.now();
    const result = predictNextCandidates(draws, draws.length - 1, 'shape-7x7');
    console.info(
      `Shape 100K generation: ${(performance.now() - started).toFixed(0)}ms`,
    );
    expect(result.metadata.sampleSize).toBe(100_000);
    expect(result.metadata.retainedCombinations).toBe(3_000);
    expect(result.gameSets.map((set) => set.games.length)).toEqual([5, 10, 30]);
    const games = result.gameSets[2]!.games;
    games.forEach((a, i) =>
      games
        .slice(i + 1)
        .forEach((b) => expect(overlap(a.numbers, b.numbers)).toBeLessThanOrEqual(3)),
    );
    expect(
      games.every(
        (game) =>
          Number.isFinite(game.structuralScore) &&
          game.numbers.length === 6 &&
          new Set(game.numbers).size === 6,
      ),
    ).toBe(true);
  }, 30_000);
});
