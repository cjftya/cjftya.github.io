import { readFile, writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildCandidateRoundDiagnostic,
  buildFrozenPhase3CandidateRoundDiagnostic,
} from '../src/uriel/analysis/candidatePhase2';
import {
  analyzeCandidateCombinationRound,
  phase3CombinationStrategies,
  runCandidatePhase3Compatibility,
} from '../src/uriel/analysis/candidatePhase3';
import {
  rankCombinations,
  rankTopCombinations,
} from '../src/uriel/analysis/combination';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const runFull = process.env.URIEL_PHASE3_FULL === '1';

describe('Uriel Phase 3 Candidate–Combination compatibility', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
  });

  it('reproduces the frozen Decay six-hit opportunity before ranking it', () => {
    const actualIndex = draws.findIndex(({ round }) => round === 1176);
    const actual = draws[actualIndex]!;
    const candidateRound = buildCandidateRoundDiagnostic(
      draws,
      actualIndex - 1,
      actual,
      ['current', 'decay', 'grid-transition'],
    );
    const frozenRound = buildFrozenPhase3CandidateRoundDiagnostic(
      draws,
      actualIndex - 1,
      actual,
    );
    const decay = candidateRound.rankings.decay;

    expect(decay).toMatchObject({
      recall: 6,
      winningRanks: [2, 5, 9, 10, 16, 20],
    });
    expect(frozenRound.rankings).toEqual(candidateRound.rankings);

    const compatibility = analyzeCandidateCombinationRound(
      draws,
      actualIndex - 1,
      frozenRound,
      'decay',
      ['transition'],
    );

    expect(compatibility.vectors).toHaveLength(38_760);
    expect(Math.max(...compatibility.hits)).toBe(6);
    expect(compatibility.strategies[0]).toMatchObject({
      round: 1176,
      candidateSource: 'decay',
      candidateRecall: 6,
      rankingStrategy: 'transition',
    });
    expect(compatibility.strategies[0]?.best6HitRank).not.toBeNull();

    const vectorSample = compatibility.vectors.slice(0, 2000);
    phase3CombinationStrategies.forEach((strategy) => {
      expect(
        rankTopCombinations(vectorSample, strategy, 20).map(({ numbers }) => numbers),
      ).toEqual(
        rankCombinations(vectorSample, strategy)
          .slice(0, 20)
          .map(({ numbers }) => numbers),
      );
    });
  }, 180_000);
});

describe.skipIf(!runFull)('Uriel Phase 3 full Development evaluation', () => {
  it('builds the complete compatibility matrix without changing Candidate baselines', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runCandidatePhase3Compatibility(
      draws,
      {
        startRound: 1044,
        endRound: 1235,
        poolSize: 20,
        seed: 20260807,
        monteCarloRuns: 1000,
        featureSamplesPerRound: 512,
      },
      (completed, total, round, source) => {
        if (completed % 12 === 0 || completed === total) {
          console.log(
            `URIEL_PHASE3_PROGRESS=${completed}/${total}:round=${round}:source=${source}`,
          );
        }
      },
    );
    const output =
      process.env.URIEL_PHASE3_OUTPUT ?? '/tmp/uriel-phase3-development.json';
    await writeFile(output, JSON.stringify(result, null, 2), 'utf8');

    expect(result).toMatchObject({
      startRound: 1044,
      endRound: 1235,
      evaluatedRounds: 192,
      candidateCombinationCompatibility: {
        sources: {
          current: { fourPlus: 42, fivePlus: 7, six: 0 },
          decay: { fourPlus: 54, fivePlus: 14, six: 1 },
          'grid-transition': { fourPlus: 47, fivePlus: 8, six: 4 },
        },
      },
    });
    expect(result.candidateCombinationCompatibility.rankingMatrix).toHaveLength(33);
  }, 7_200_000);
});
