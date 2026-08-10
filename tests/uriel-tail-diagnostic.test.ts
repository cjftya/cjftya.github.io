import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { diagnoseStrategyRanking } from '../src/uriel/analysis/backtest';
import {
  ablationStrategies,
  buildCandidatePoolAnalysis,
  buildCombinationAnalysis,
  mainCombinationStrategies,
} from '../src/uriel/analysis/combination';
import { buildPurchasePortfolio } from '../src/uriel/analysis/purchase';
import { parseDrawCsv } from '../src/uriel/data';
import type { Candidate } from '../src/uriel/types';

const opportunityRounds = [1044, 1066, 1072, 1100, 1102, 1123, 1133, 1199];
const enabled = process.env.URIEL_TAIL_DIAGNOSTIC === '1';
const scanOnly = process.env.URIEL_CANDIDATE_SCAN_ONLY === '1';
const scanStart = Number(process.env.URIEL_SCAN_START ?? 1044);
const scanEnd = Number(process.env.URIEL_SCAN_END ?? 1235);
const selectedRounds =
  process.env.URIEL_FULL_SCAN === '1'
    ? Array.from(
        { length: Math.max(scanEnd - scanStart + 1, 0) },
        (_, index) => scanStart + index,
      )
    : opportunityRounds;

describe.skipIf(!enabled)('Uriel 5+ tail diagnostic', () => {
  it('reports exhaustive strategy ranks for the known candidate opportunities', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const strategies = [...mainCombinationStrategies, ...ablationStrategies];
    const result = selectedRounds.map((round) => {
      const actualIndex = draws.findIndex((draw) => draw.round === round);
      const actual = draws[actualIndex]!;
      const candidateAnalysis = buildCandidatePoolAnalysis(draws, actualIndex - 1, 20);
      const candidatePool = candidateAnalysis.candidateRanking.slice(0, 20);
      const candidateMatches = matchingNumbers(candidatePool, actual.numbers);
      if (candidateMatches.length < 5 || scanOnly) {
        return {
          round,
          actual: actual.numbers,
          candidatePool,
          candidateMatches,
          strategyResults: {},
        };
      }
      const analysis = buildCombinationAnalysis(
        draws,
        actualIndex - 1,
        20,
        true,
        'full-enumeration',
      );
      const strategyResults = Object.fromEntries(
        strategies.map((strategy) => {
          const research = analysis.researchByStrategy[strategy];
          const portfolio = buildPurchasePortfolio(research, 'board').games;
          const diagnostic = diagnoseStrategyRanking(
            analysis.generatedCombinations,
            strategy,
            actual.numbers,
            analysis.seed,
          );
          return [
            strategy,
            {
              top100MaxHit: maximumMatch(research, actual.numbers),
              top10MaxHit: maximumMatch(portfolio, actual.numbers),
              bestFive: diagnostic.bestFiveHitCombination,
              scorePercentiles: diagnostic.scorePercentiles,
            },
          ];
        }),
      );
      expect(analysis.rawCombinationCount).toBe(38_760);
      return {
        round,
        actual: actual.numbers,
        candidatePool: analysis.candidatePool,
        candidateMatches,
        strategyResults,
      };
    });

    console.log(
      `URIEL_TAIL_DIAGNOSTIC_RESULT=${JSON.stringify(
        result
          .filter((round) => round.candidateMatches.length >= 5)
          .map((round) => ({
            round: round.round,
            candidateMatches: round.candidateMatches,
            strategies: Object.fromEntries(
              Object.entries(round.strategyResults).map(([strategy, diagnostic]) => [
                strategy,
                {
                  top100MaxHit: diagnostic.top100MaxHit,
                  top10MaxHit: diagnostic.top10MaxHit,
                  bestFiveRank: diagnostic.bestFive?.rank ?? null,
                  bestFiveScore: diagnostic.bestFive?.score ?? null,
                  contribution: diagnostic.bestFive?.featureContribution ?? null,
                },
              ]),
            ),
          })),
      )}`,
    );
  }, 1_200_000);
});

function maximumMatch(
  candidates: readonly Candidate[],
  actual: readonly number[],
): number {
  return candidates.reduce(
    (maximum, candidate) =>
      Math.max(maximum, matchingNumbers(candidate.numbers, actual).length),
    0,
  );
}

function matchingNumbers(
  candidates: readonly number[],
  actual: readonly number[],
): number[] {
  return actual.filter((number) => candidates.includes(number));
}
