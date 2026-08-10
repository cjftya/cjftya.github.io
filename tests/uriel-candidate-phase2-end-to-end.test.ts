import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import type {
  CandidatePhase2Result,
  CandidateRankingId,
} from '../src/uriel/analysis/candidatePhase2';
import { runCandidateEndToEndEvaluation } from '../src/uriel/analysis/candidatePhase2EndToEnd';
import { buildCombinationAnalysis } from '../src/uriel/analysis/combination';
import { parseDrawCsv } from '../src/uriel/data';

const runFull = process.env.URIEL_PHASE2_END_TO_END === '1';

describe('Uriel Phase 2 Candidate override', () => {
  it('uses an explicit Top20 without changing the frozen combination signals', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const actualIndex = draws.findIndex(({ round }) => round === 1044);
    const override = Array.from({ length: 20 }, (_, index) => index + 1);
    const analysis = buildCombinationAnalysis(
      draws,
      actualIndex - 1,
      20,
      false,
      'full-enumeration',
      override,
      ['transition'],
    );

    expect(analysis.candidatePool).toEqual(override);
    expect(analysis.candidateRanking.slice(0, 20)).toEqual(override);
    expect(analysis.generatedCombinations).toHaveLength(38_760);
    expect(analysis.researchByStrategy.transition).toHaveLength(100);
    expect(analysis.researchByStrategy['full-hybrid']).toEqual([]);
  }, 120_000);
});

describe.skipIf(!runFull)('Uriel Phase 2 selected Candidate end-to-end', () => {
  it('runs the requested Development candidates through the frozen pipeline', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const candidatePath =
      process.env.URIEL_PHASE2_DEVELOPMENT_RESULT ??
      '/tmp/uriel-phase2-development.json';
    const candidateResult = JSON.parse(
      await readFile(candidatePath, 'utf8'),
    ) as CandidatePhase2Result;
    const selected = (process.env.URIEL_PHASE2_END_TO_END_RANKINGS?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [
      'tail-rescue',
      'temporal-stability',
    ]) as CandidateRankingId[];

    for (const rankingId of selected) {
      const result = runCandidateEndToEndEvaluation(
        draws,
        candidateResult,
        rankingId,
        (completed, total, round) => {
          if (completed % 24 === 0 || completed === total) {
            console.log(
              `URIEL_PHASE2_END_TO_END_PROGRESS=${rankingId}:${completed}/${total}:round=${round}`,
            );
          }
        },
      );
      await writeFile(
        `/tmp/uriel-phase2-end-to-end-${rankingId}.json`,
        JSON.stringify(result, null, 2),
        'utf8',
      );
      console.log(
        `URIEL_PHASE2_END_TO_END_RESULT=${rankingId}:${JSON.stringify({
          stages: result.stages,
          conversion: result.conversion,
          sixHitTraces: result.sixHitTraces,
        })}`,
      );
      expect(result).toMatchObject({
        rankingId,
        startRound: 1044,
        endRound: 1235,
        evaluatedRounds: 192,
      });
      expect(result.stages.candidate.fivePlus).toBe(rankingId === 'decay' ? 14 : 11);
      expect(result.stages.candidate.six).toBe(1);
      expect(result.stages.generation).toEqual(result.stages.candidate);
    }
  }, 7_200_000);
});
