import { readFile, writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildPhase5CandidateHypothesis,
  buildPhase5DecisionReport,
  completePhase5DevelopmentFourPlusDiagnostics,
  phase5HypothesisDefinitions,
  runCandidatePhase5FinalDecision,
  type CandidatePhase5Result,
  type Phase5CandidateNumberInput,
} from '../src/uriel/analysis/candidatePhase5OpportunityQuality';
import { buildFrozenPhase3CandidateRoundDiagnostic } from '../src/uriel/analysis/candidatePhase2';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const runFull = process.env.URIEL_PHASE5_FULL === '1';
const completeFourPlus = process.env.URIEL_PHASE5_COMPLETE_FOUR_PLUS === '1';

describe('Uriel Phase 5 Candidate boundaries', () => {
  let draws: LottoDraw[];
  let source: string;

  beforeAll(async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    source = await readFile(
      new URL(
        '../src/uriel/analysis/candidatePhase5OpportunityQuality.ts',
        import.meta.url,
      ),
      'utf8',
    );
  });

  it('predeclares exactly three deterministic, winner-independent hypotheses', () => {
    expect(phase5HypothesisDefinitions.map(({ id }) => id)).toEqual([
      'P5_A_STRONG_FLOOR',
      'P5_B_CROSS_MODEL',
      'P5_C_CONTROLLED_SPECIALIST',
    ]);
    expect(buildPhase5CandidateHypothesis).toHaveLength(2);
    const builder = source.slice(
      source.indexOf('export function buildPhase5CandidateHypothesis'),
      source.indexOf('export function runCandidatePhase5FinalDecision'),
    );
    expect(builder).not.toContain('winningNumbers');
    expect(builder).not.toContain('actual.numbers');
    expect(builder).not.toContain('.winning');

    const actualIndex = draws.findIndex(({ round }) => round === 1176);
    const diagnostic = buildFrozenPhase3CandidateRoundDiagnostic(
      draws,
      actualIndex - 1,
      draws[actualIndex]!,
    );
    const inputs: Phase5CandidateNumberInput[] = diagnostic.numbers.map(
      ({ number, ranks }) => ({
        number,
        currentRank: ranks.current!,
        decayRank: ranks.decay!,
        gridTransitionRank: ranks['grid-transition']!,
      }),
    );
    phase5HypothesisDefinitions.forEach(({ id }) => {
      const first = buildPhase5CandidateHypothesis(inputs, id);
      const second = buildPhase5CandidateHypothesis(inputs, id);
      expect(second).toEqual(first);
      expect(first.ranking).toHaveLength(45);
      expect(new Set(first.ranking).size).toBe(45);
      expect(first.top20).toHaveLength(20);
      expect(new Set(first.top20).size).toBe(20);
    });
  }, 30_000);

  it('keeps Locked and Additional Blind bounds out of executable Phase 5 code', () => {
    expect(source).not.toMatch(/startRound:\s*660/);
    expect(source).not.toMatch(/endRound:\s*851/);
    expect(source).not.toMatch(/startRound:\s*468/);
    expect(source).not.toMatch(/endRound:\s*659/);
    expect(source).toContain('lockedHoldoutAccessed: false');
    expect(source).toContain('additionalBlindHoldoutAccessed: false');
  });
});

describe.skipIf(!runFull)('Uriel Phase 5 full viability decision', () => {
  it('runs Development selection and at most one frozen Historical hypothesis', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runCandidatePhase5FinalDecision(
      draws,
      (completed, total, round, period) => {
        if (completed % 4 === 0 || completed === total) {
          console.log(
            `URIEL_PHASE5_PROGRESS=${completed}/${total}:round=${round}:period=${period}`,
          );
        }
      },
    );
    const jsonOutput =
      process.env.URIEL_PHASE5_OUTPUT ?? '/tmp/uriel-phase5-result.json';
    const reportOutput =
      process.env.URIEL_PHASE5_REPORT ?? '/tmp/uriel-phase5-report.md';
    await writeFile(jsonOutput, JSON.stringify(result, null, 2), 'utf8');
    await writeFile(reportOutput, buildPhase5DecisionReport(result), 'utf8');

    expect(result).toMatchObject({
      decisionBaseline: 'current-operating',
      operatingAlgorithmFrozen: true,
      combinationEngineFrozen: true,
      historicalTuningAllowed: false,
      lockedHoldoutAccessed: false,
      additionalBlindHoldoutAccessed: false,
      development: {
        startRound: 1044,
        endRound: 1235,
        evaluatedRounds: 192,
        baselines: {
          current: { candidate: { fourPlus: 42, fivePlus: 7, six: 0 } },
          decay: { candidate: { fourPlus: 54, fivePlus: 14, six: 1 } },
          'grid-transition': {
            candidate: { fourPlus: 47, fivePlus: 8, six: 4 },
          },
        },
      },
      regression: {
        development: {
          candidate: { fourPlus: 54, fivePlus: 14, six: 1 },
          pair: { fourPlus: 13, fivePlus: 0, six: 0 },
          structured: { fourPlus: 24, fivePlus: 2, six: 0 },
        },
      },
    });
    expect(result.developmentComparisons).toHaveLength(3);
    expect(Object.keys(result.development.hypotheses)).toHaveLength(3);
    expect(Object.keys(result.historical?.hypotheses ?? {})).toHaveLength(
      result.frozenHypothesisId === null ? 0 : 1,
    );
    expect(['SUCCESS', 'INCONCLUSIVE', 'FAIL']).toContain(result.finalDecision);
  }, 7_200_000);
});

describe.skipIf(!completeFourPlus)(
  'Uriel Phase 5 rejected-hypothesis 4+ completion',
  () => {
    it('completes Top100 and Final Top10 4+ diagnostics without rerunning quality', async () => {
      const fileUrl = new URL(
        '../public/projects/uriel/data/draws.csv',
        import.meta.url,
      );
      const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
      const input = process.env.URIEL_PHASE5_INPUT ?? '/tmp/uriel-phase5-result.json';
      const output = process.env.URIEL_PHASE5_OUTPUT ?? input;
      const report = process.env.URIEL_PHASE5_REPORT ?? '/tmp/uriel-phase5-report.md';
      const result = JSON.parse(await readFile(input, 'utf8')) as CandidatePhase5Result;
      const completed = completePhase5DevelopmentFourPlusDiagnostics(draws, result);
      await writeFile(output, JSON.stringify(completed, null, 2), 'utf8');
      await writeFile(report, buildPhase5DecisionReport(completed), 'utf8');
      expect(completed.developmentResearchFourPlusComplete).toBe(true);
      phase5HypothesisDefinitions.forEach(({ id }) => {
        expect(
          completed.development.hypotheses[id]!.transitionTop100.fourPlus,
        ).toBeGreaterThanOrEqual(
          completed.development.hypotheses[id]!.transitionTop100.fivePlus,
        );
      });
    }, 7_200_000);
  },
);
