import { readFile, writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  extractPhase4BCombinationFeature,
  runCandidatePhase4BFailureAnalysis,
} from '../src/uriel/analysis/candidatePhase4BFailureAnalysis';
import { parseDrawCsv } from '../src/uriel/data';
import type { LottoDraw } from '../src/uriel/types';

const runFull = process.env.URIEL_PHASE4B_FULL === '1';

describe('Uriel Phase 4B failure-analysis boundaries', () => {
  let source: string;

  beforeAll(async () => {
    const sourceUrl = new URL(
      '../src/uriel/analysis/candidatePhase4BFailureAnalysis.ts',
      import.meta.url,
    );
    source = await readFile(sourceUrl, 'utf8');
  });

  it('keeps winner labels outside the exported combination feature extractor', () => {
    expect(extractPhase4BCombinationFeature).toHaveLength(2);
    const extractor = source.slice(
      source.indexOf('export function extractPhase4BCombinationFeature'),
      source.indexOf('function buildOpportunityCase'),
    );
    expect(extractor).not.toContain('winningNumbers');
    expect(extractor).not.toContain('actual.numbers');
    expect(extractor).not.toContain('hits:');
  });

  it('does not encode Locked or Additional Blind ranges as executable bounds', () => {
    expect(source).not.toMatch(/startRound:\s*660/);
    expect(source).not.toMatch(/endRound:\s*851/);
    expect(source).not.toMatch(/startRound:\s*468/);
    expect(source).not.toMatch(/endRound:\s*659/);
    expect(source).toContain('lockedHoldoutAccessed: false');
    expect(source).toContain('additionalBlindHoldoutAccessed: false');
  });
});

describe.skipIf(!runFull)('Uriel Phase 4B full failure analysis', () => {
  it('reproduces Phase 4 and writes the frozen failure-analysis result', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws: LottoDraw[] = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runCandidatePhase4BFailureAnalysis(
      draws,
      (completed, total, round, period) => {
        if (completed % 12 === 0 || completed === total) {
          console.log(
            `URIEL_PHASE4B_PROGRESS=${completed}/${total}:round=${round}:period=${period}`,
          );
        }
      },
    );
    const output =
      process.env.URIEL_PHASE4B_OUTPUT ?? '/tmp/uriel-phase4b-analysis.json';
    await writeFile(output, JSON.stringify(result, null, 2), 'utf8');

    expect(result).toMatchObject({
      tuningAllowed: false,
      operatingAlgorithmFrozen: true,
      selectorFrozen: true,
      winnerIndependentFeatures: true,
      lockedHoldoutAccessed: false,
      additionalBlindHoldoutAccessed: false,
      regression: {
        development: {
          candidate: { fourPlus: 54, fivePlus: 14, six: 1 },
          pair: { fourPlus: 13, fivePlus: 0, six: 0 },
          structured: { fourPlus: 24, fivePlus: 2, six: 0 },
        },
        historical: {
          candidate: { fourPlus: 29, fivePlus: 4, six: 0 },
          pair: { fourPlus: 4, fivePlus: 1, six: 0 },
          structured: { fourPlus: 12, fivePlus: 0, six: 0 },
        },
      },
    });
    expect(result.opportunityCases).toHaveLength(18);
    expect(
      result.opportunityCases
        .filter(({ classification }) => classification === 'A_STRUCTURED_ONLY')
        .map(({ round }) => round),
    ).toEqual([1135, 1176]);
    expect(
      result.opportunityCases
        .filter(({ classification }) => classification === 'B_PAIR_ONLY')
        .map(({ round }) => round),
    ).toEqual([984]);
    expect(result.fourHitVsFiveHitBoundary.structuredOnlyFourPlusRounds).toHaveLength(
      9,
    );
    expect(result.fourHitVsFiveHitBoundary.pairOnlyFourPlusRounds).toHaveLength(1);
    expect(result.fourHitVsFiveHitBoundary.netFourPlusGain).toBe(8);
    expect(result.detailedCases.map(({ round }) => round)).toEqual([984, 1135, 1176]);
  }, 7_200_000);
});
