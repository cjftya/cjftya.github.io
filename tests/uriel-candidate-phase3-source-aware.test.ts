import { readFile, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { runCandidatePhase3SourceAwareExperiments } from '../src/uriel/analysis/candidatePhase3SourceAware';
import { parseDrawCsv } from '../src/uriel/data';

const runFull = process.env.URIEL_PHASE3_SOURCE_AWARE_FULL === '1';

describe.skipIf(!runFull)('Uriel Phase 3 Branch Rank Prior', () => {
  it('tests only the predefined Development lambdas', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runCandidatePhase3SourceAwareExperiments(
      draws,
      (completed, total, round, source) => {
        if (completed % 12 === 0 || completed === total) {
          console.log(
            `URIEL_PHASE3_SOURCE_AWARE_PROGRESS=${completed}/${total}:round=${round}:source=${source}`,
          );
        }
      },
    );
    const output =
      process.env.URIEL_PHASE3_SOURCE_AWARE_OUTPUT ??
      '/tmp/uriel-phase3-source-aware-development.json';
    await writeFile(output, JSON.stringify(result, null, 2), 'utf8');

    expect(result).toMatchObject({
      startRound: 1044,
      endRound: 1235,
      evaluatedRounds: 192,
      options: { lambdas: [0.05, 0.1, 0.2], worstMemberLambda: 0.1 },
    });
    expect(result.experiments).toHaveLength(10);
    expect(
      result.experiments.filter(
        ({ experimentId }) => experimentId === 'transition-baseline',
      ),
    ).toHaveLength(2);
    expect(
      result.experiments.find(
        ({ candidateSource, experimentId }) =>
          candidateSource === 'decay' && experimentId === 'transition-baseline',
      ),
    ).toMatchObject({
      candidate: { fourPlus: 54, fivePlus: 14, six: 1 },
      top100: { fourPlus: 9, fivePlus: 0, six: 0 },
    });
    expect(
      result.experiments.find(
        ({ candidateSource, experimentId }) =>
          candidateSource === 'grid-transition' &&
          experimentId === 'transition-baseline',
      ),
    ).toMatchObject({
      candidate: { fourPlus: 47, fivePlus: 8, six: 4 },
      top100: { fourPlus: 10, fivePlus: 1, six: 0 },
    });
  }, 7_200_000);
});
