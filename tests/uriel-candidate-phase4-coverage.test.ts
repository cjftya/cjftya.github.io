import { readFile, writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildFrozenPhase3CandidateRoundDiagnostic } from '../src/uriel/analysis/candidatePhase2';
import {
  phase4ExperimentIds,
  runCandidatePhase4Coverage,
  runCandidatePhase4FrozenValidation,
  selectPhase4StructuredTop100,
} from '../src/uriel/analysis/candidatePhase4Coverage';
import { buildCombinationAnalysis } from '../src/uriel/analysis/combination';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const runFull = process.env.URIEL_PHASE4_FULL === '1';
const runValidation = process.env.URIEL_PHASE4_VALIDATION_FULL === '1';

describe('Uriel Phase 4 structured coverage', () => {
  let draws: LottoDraw[];

  beforeAll(async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
  });

  it('selects 100 deterministic, unique combinations without winner input', () => {
    const actualIndex = draws.findIndex(({ round }) => round === 1176);
    const actual = draws[actualIndex]!;
    const candidateRound = buildFrozenPhase3CandidateRoundDiagnostic(
      draws,
      actualIndex - 1,
      actual,
    );
    const decay = candidateRound.rankings.decay!;
    const analysis = buildCombinationAnalysis(
      draws,
      actualIndex - 1,
      20,
      false,
      'full-enumeration',
      decay.top20,
      [],
    );

    expect(decay).toMatchObject({
      recall: 6,
      winningRanks: [2, 5, 9, 10, 16, 20],
    });
    expect(analysis.generatedCombinations).toHaveLength(38_760);

    phase4ExperimentIds
      .filter((experimentId) => experimentId !== 'P4_BASELINE')
      .forEach((experimentId, experimentIndex) => {
        const selected = selectPhase4StructuredTop100(
          analysis.generatedCombinations,
          decay.top20,
          'pair',
          experimentId,
          20_260_807 + experimentIndex,
          256,
        );
        expect(selected).toHaveLength(100);
        expect(new Set(selected).size).toBe(100);

        if (experimentId === 'P4_NUMBER_COVERAGE') {
          const appearances = new Map(decay.top20.map((number) => [number, 0]));
          selected.forEach((index) => {
            analysis.generatedCombinations[index]!.numbers.forEach((number) => {
              appearances.set(number, appearances.get(number)! + 1);
            });
          });
          const counts = [...appearances.values()];
          expect(Math.min(...counts)).toBeGreaterThanOrEqual(27);
          expect(Math.max(...counts)).toBeLessThanOrEqual(33);
        }

        if (experimentId === 'P4_OVERLAP_LIMIT' || experimentId === 'P4_RANK_PROFILE') {
          for (let left = 0; left < selected.length; left += 1) {
            for (let right = left + 1; right < selected.length; right += 1) {
              const leftNumbers =
                analysis.generatedCombinations[selected[left]!]!.numbers;
              const rightNumbers = new Set(
                analysis.generatedCombinations[selected[right]!]!.numbers,
              );
              expect(
                leftNumbers.filter((number) => rightNumbers.has(number)).length,
              ).toBeLessThan(5);
            }
          }
        }
      });

    const first = selectPhase4StructuredTop100(
      analysis.generatedCombinations,
      decay.top20,
      'pair',
      'P4_NUMBER_BAND_PAIR',
      20_260_807,
      256,
    );
    const second = selectPhase4StructuredTop100(
      analysis.generatedCombinations,
      decay.top20,
      'pair',
      'P4_NUMBER_BAND_PAIR',
      20_260_807,
      256,
    );
    expect(second).toEqual(first);
  }, 180_000);
});

describe.skipIf(!runFull)('Uriel Phase 4 full Development evaluation', () => {
  it('keeps operations frozen and evaluates only the Development gate', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runCandidatePhase4Coverage(
      draws,
      {
        startRound: 1044,
        endRound: 1235,
        poolSize: 20,
        seed: 20260807,
        monteCarloRuns: 1000,
        greedySampleSize: 128,
      },
      (completed, total, round, source) => {
        if (completed % 6 === 0 || completed === total) {
          console.log(
            `URIEL_PHASE4_PROGRESS=${completed}/${total}:round=${round}:source=${source}`,
          );
        }
      },
    );
    const output =
      process.env.URIEL_PHASE4_OUTPUT ?? '/tmp/uriel-phase4-development.json';
    await writeFile(output, JSON.stringify(result, null, 2), 'utf8');

    expect(result).toMatchObject({
      operatingAlgorithmFrozen: true,
      startRound: 1044,
      endRound: 1235,
      evaluatedRounds: 192,
      candidatePhase4Coverage: {
        development: {
          current: { fourPlus: 42, fivePlus: 7, six: 0 },
          decay: { fourPlus: 54, fivePlus: 14, six: 1 },
          gridTransition: { fourPlus: 47, fivePlus: 8, six: 4 },
        },
        historical: null,
        locked: null,
        selected: {
          decay: {
            source: 'decay',
            experimentId: 'P4_OVERLAP_LIMIT',
            top100: { fourPlus: 24, fivePlus: 2, six: 0 },
            result: 'KEEP',
          },
          'grid-transition': null,
        },
      },
    });
    expect(result.candidatePhase4Coverage.experiments).toHaveLength(14);
  }, 7_200_000);
});

describe.skipIf(!runValidation)('Uriel Phase 4 frozen validation', () => {
  it('runs Historical once and opens Locked only after a pass', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const progress =
      (label: string) => (completed: number, total: number, round: number) => {
        if (completed % 12 === 0 || completed === total) {
          console.log(`URIEL_PHASE4_${label}=${completed}/${total}:round=${round}`);
        }
      };
    const historical = runCandidatePhase4FrozenValidation(
      draws,
      'historical-reference',
      { seed: 20260807, monteCarloRuns: 1000, greedySampleSize: 128 },
      progress('HISTORICAL'),
    );
    const locked = historical.passed
      ? runCandidatePhase4FrozenValidation(
          draws,
          'locked-holdout',
          { seed: 20260807, monteCarloRuns: 1000, greedySampleSize: 128 },
          progress('LOCKED'),
        )
      : null;
    const output =
      process.env.URIEL_PHASE4_VALIDATION_OUTPUT ?? '/tmp/uriel-phase4-validation.json';
    await writeFile(output, JSON.stringify({ historical, locked }, null, 2), 'utf8');

    expect(historical).toMatchObject({
      tuningAllowed: false,
      selectorFrozen: true,
      mode: 'historical-reference',
      source: 'decay',
      experimentId: 'P4_OVERLAP_LIMIT',
      startRound: 852,
      endRound: 1043,
      evaluatedRounds: 192,
      candidate: { fourPlus: 29, fivePlus: 4, six: 0 },
      baseline: {
        top100: { fourPlus: 4, fivePlus: 1, six: 0 },
      },
      experiment: {
        top100: { fourPlus: 12, fivePlus: 0, six: 0 },
        result: 'REJECT',
      },
      passed: false,
    });
    expect(locked).toBeNull();
  }, 7_200_000);
});
