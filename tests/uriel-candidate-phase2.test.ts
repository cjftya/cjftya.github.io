import { readFile, writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  exactRandomCandidateBaseline,
  runCandidatePhase2Evaluation,
} from '../src/uriel/analysis/candidatePhase2';
import { buildCandidatePoolAnalysis } from '../src/uriel/analysis/combination';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const runFull = process.env.URIEL_PHASE2_FULL === '1';

describe('Uriel Phase 2 Candidate diagnostics', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
  });

  it('matches the exact hypergeometric Top20 baseline', () => {
    const baseline = exactRandomCandidateBaseline(20);

    expect(baseline.expectedRecall).toBeCloseTo(2.6666666666666665);
    expect(baseline.fourPlusRate).toBeCloseTo(0.23079755579631622);
    expect(baseline.fivePlusRate).toBeCloseTo(0.05234583645073628);
    expect(baseline.sixRate).toBeCloseTo(0.004758712404612389);
    expect(
      baseline.hitProbabilities.reduce((total, value) => total + value, 0),
    ).toBeCloseTo(1);
  });

  it('preserves the frozen Current Top20 and disables tuning outside development', () => {
    const result = runCandidatePhase2Evaluation(draws, {
      mode: 'historical-reference',
      startRound: 1043,
      endRound: 1043,
      monteCarloRuns: 1000,
    });
    const actualIndex = draws.findIndex(({ round }) => round === 1043);
    const current = buildCandidatePoolAnalysis(draws, actualIndex - 1, 20);

    expect(result.tuningAllowed).toBe(false);
    expect(result.experiments).toEqual([]);
    expect(Object.keys(result.summaries)).toEqual(['current']);
    expect(result.rounds[0]?.rankings.current?.top20).toEqual(current.candidatePool);
  }, 120_000);

  it('does not read a changed future result while calculating its ranking', () => {
    const changed = draws.map((draw) =>
      draw.round === 1043 ? { ...draw, numbers: [1, 2, 3, 4, 5, 6] } : draw,
    );
    const options = {
      mode: 'historical-reference' as const,
      startRound: 1043,
      endRound: 1043,
      monteCarloRuns: 1000,
    };
    const first = runCandidatePhase2Evaluation(draws, options);
    const second = runCandidatePhase2Evaluation(changed, options);

    expect(first.rounds[0]?.rankings.current?.top20).toEqual(
      second.rounds[0]?.rankings.current?.top20,
    );
    expect(first.rounds[0]?.numbers.map(({ currentScore }) => currentScore)).toEqual(
      second.rounds[0]?.numbers.map(({ currentScore }) => currentScore),
    );
  }, 120_000);
});

describe.skipIf(!runFull)('Uriel Phase 2 full Candidate-only evaluation', () => {
  it('runs development, historical reference, and locked holdout in order', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const outputDirectory = process.env.URIEL_PHASE2_OUTPUT ?? '/tmp';
    const requestedMode = process.env.URIEL_PHASE2_MODE;
    const modes = [
      {
        mode: 'development' as const,
        startRound: 1044,
        endRound: 1235,
        filename: 'uriel-phase2-development.json',
      },
      {
        mode: 'historical-reference' as const,
        startRound: 852,
        endRound: 1043,
        filename: 'uriel-phase2-historical-reference.json',
      },
      {
        mode: 'locked-holdout' as const,
        startRound: 660,
        endRound: 851,
        filename: 'uriel-phase2-locked-holdout.json',
      },
    ].filter(
      ({ mode }) =>
        requestedMode === undefined ||
        requestedMode === mode ||
        (requestedMode === 'validation' && mode !== 'development'),
    );

    for (const mode of modes) {
      const result = runCandidatePhase2Evaluation(
        draws,
        {
          ...mode,
          poolSize: 20,
          seed: 20260807,
          monteCarloRuns: 1000,
        },
        (completed, total, round) => {
          if (completed % 24 === 0 || completed === total) {
            console.log(
              `URIEL_PHASE2_PROGRESS=${mode.mode}:${completed}/${total}:round=${round}`,
            );
          }
        },
      );
      await writeFile(
        `${outputDirectory}/${mode.filename}`,
        JSON.stringify(result, null, 2),
        'utf8',
      );
      console.log(
        `URIEL_PHASE2_RESULT=${mode.mode}:${JSON.stringify({
          current: result.summaries.current,
          experiments: result.experiments.map(
            ({ experiment, summary, result, reason }) => ({
              experimentId: experiment.experimentId,
              recallAverage: summary.recallAverage,
              fourPlusCount: summary.fourPlusCount,
              fivePlusCount: summary.fivePlusCount,
              sixCount: summary.sixCount,
              r6Median: summary.r6.median,
              near6At22: summary.near6.at22,
              near6At25: summary.near6.at25,
              result,
              reason,
            }),
          ),
        })}`,
      );

      expect(result).toMatchObject({
        startRound: mode.startRound,
        endRound: mode.endRound,
        evaluatedRounds: 192,
      });
      if (mode.mode === 'development') {
        expect(result.candidateGateWinnerId).toBe('decay');
        expect(result.frozenStrategyId).toBe('current');
        expect(result.summaries.current).toMatchObject({
          recallAverage: 2.609375,
          fourPlusCount: 42,
          fivePlusCount: 7,
          sixCount: 0,
        });
      }
      if (mode.mode !== 'development') {
        expect(result.frozenStrategyId).toBe('current');
      }
      if (mode.mode === 'historical-reference') {
        expect(result.summaries.current).toMatchObject({
          recallAverage: 2.5625,
          fourPlusCount: 44,
          fivePlusCount: 8,
          sixCount: 0,
        });
      }
    }
  }, 7_200_000);
});
