import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { diagnoseStrategyRanking } from '../src/uriel/analysis/backtest';
import { runWalkForwardBacktest } from '../src/uriel/analysis/backtest';
import {
  ablationStrategies,
  buildCandidatePoolAnalysis,
  buildCombinationAnalysis,
  mainCombinationStrategies,
} from '../src/uriel/analysis/combination';
import {
  buildPurchasePortfolio,
  buildTailCoverageGames,
} from '../src/uriel/analysis/purchase';
import { RankingDiagnosticsCollector } from '../src/uriel/analysis/rankingDiagnostics';
import { parseDrawCsv } from '../src/uriel/data';
import type { Candidate } from '../src/uriel/types';

const opportunityRounds = [1044, 1066, 1072, 1100, 1102, 1123, 1133, 1199];
const enabled = process.env.URIEL_TAIL_DIAGNOSTIC === '1';
const rankingPhaseOne = process.env.URIEL_RANKING_PHASE1 === '1';
const rankingFull = process.env.URIEL_RANKING_FULL === '1';
const tailCoverage = process.env.URIEL_TAIL_COVERAGE === '1';
const tailCoverageFull = process.env.URIEL_TAIL_COVERAGE_FULL === '1';
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
          const bestFiveNumbers = diagnostic.bestFiveHitCombination?.numbers ?? [];
          const tailByNovelty = research
            .slice(30, 80)
            .map((candidate, index) => ({
              key: candidate.numbers.join('-'),
              researchRank: index + 31,
              maximumOverlap: portfolio.reduce(
                (maximum, game) =>
                  Math.max(
                    maximum,
                    matchingNumbers(candidate.numbers, game.numbers).length,
                  ),
                0,
              ),
            }))
            .sort(
              (left, right) =>
                left.maximumOverlap - right.maximumOverlap ||
                left.researchRank - right.researchRank,
            );
          return [
            strategy,
            {
              top100MaxHit: maximumMatch(research, actual.numbers),
              top10MaxHit: maximumMatch(portfolio, actual.numbers),
              portfolioRanks: portfolio.map((candidate) => candidate.researchRank),
              bestFiveTailNoveltyRank:
                tailByNovelty.findIndex(
                  ({ key }) => key === bestFiveNumbers.join('-'),
                ) + 1 || null,
              bestFiveMaximumPortfolioOverlap:
                bestFiveNumbers.length === 0
                  ? null
                  : portfolio.reduce(
                      (maximum, game) =>
                        Math.max(
                          maximum,
                          matchingNumbers(bestFiveNumbers, game.numbers).length,
                        ),
                      0,
                    ),
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
          .filter((round) => round.candidateMatches.length >= (scanOnly ? 4 : 5))
          .map((round) => ({
            round: round.round,
            candidateMatches: round.candidateMatches,
            strategies: Object.fromEntries(
              Object.entries(round.strategyResults).map(([strategy, diagnostic]) => [
                strategy,
                {
                  top100MaxHit: diagnostic.top100MaxHit,
                  top10MaxHit: diagnostic.top10MaxHit,
                  portfolioRanks: diagnostic.portfolioRanks,
                  bestFiveTailNoveltyRank: diagnostic.bestFiveTailNoveltyRank,
                  bestFiveMaximumPortfolioOverlap:
                    diagnostic.bestFiveMaximumPortfolioOverlap,
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

describe.skipIf(!rankingPhaseOne)('Uriel ranking distribution diagnostic', () => {
  it('summarizes baseline feature distributions on 5-hit opportunities', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const strategies = [...mainCombinationStrategies, ...ablationStrategies];
    const collector = new RankingDiagnosticsCollector(strategies);

    opportunityRounds.forEach((round) => {
      const actualIndex = draws.findIndex((draw) => draw.round === round);
      const actual = draws[actualIndex]!;
      const candidate = buildCandidatePoolAnalysis(draws, actualIndex - 1, 20);
      const candidateRecall = matchingNumbers(
        candidate.candidateRanking.slice(0, 20),
        actual.numbers,
      ).length;
      if (candidateRecall < 5) return;
      const analysis = buildCombinationAnalysis(
        draws,
        actualIndex - 1,
        20,
        true,
        'full-enumeration',
      );
      collector.addRound(
        round,
        candidateRecall,
        analysis.generatedCombinations,
        actual.numbers,
      );
    });

    const diagnostic = collector.build();
    const compact = {
      method: diagnostic.method,
      analyzedRounds: diagnostic.analyzedRounds,
      fiveHitRanks: diagnostic.fiveHitOpportunities.map((opportunity) => ({
        round: opportunity.round,
        strategies: Object.fromEntries(
          Object.entries(opportunity.strategies).map(([strategy, result]) => [
            strategy,
            {
              before: result?.bestFiveBefore?.rank ?? null,
              after: result?.bestFiveAfter?.rank ?? null,
            },
          ]),
        ),
      })),
      featureScales: Object.fromEntries(
        Object.entries(diagnostic.featureScales).map(([feature, distribution]) => [
          feature,
          {
            min: distribution.min,
            max: distribution.max,
            mean: distribution.mean,
            standardDeviation: distribution.standardDeviation,
            p5: distribution.p5,
            p95: distribution.p95,
          },
        ]),
      ),
      featureMedians: Object.fromEntries(
        Object.entries(diagnostic.featureDistributions).map(
          ([group, distributions]) => [
            group,
            Object.fromEntries(
              Object.entries(distributions ?? {}).map(([feature, distribution]) => [
                feature,
                distribution.median,
              ]),
            ),
          ],
        ),
      ),
      strongestCorrelations: diagnostic.featureCorrelations.slice(0, 20),
    };
    console.log(`URIEL_RANKING_PHASE1_RESULT=${JSON.stringify(compact)}`);
    expect(diagnostic.analyzedRounds).toBe(7);
  }, 1_200_000);
});

describe.skipIf(!rankingFull)('Uriel full ranking diagnostic', () => {
  it('summarizes all Candidate 4+ opportunities without future leakage', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runWalkForwardBacktest(draws, {
      rounds: 192,
      poolSize: 20,
      seed: 20260807,
      monteCarloRuns: 32,
      includeAblation: true,
      generationMode: 'full-enumeration',
    });
    const diagnostic = result.rankingDiagnostics!;
    const compact = {
      recall: result.recall.find(({ poolSize }) => poolSize === 20),
      strategies: result.strategies.map((strategy) => ({
        strategy: strategy.strategy,
        averageMaxHit: strategy.averageMaxHit,
        threePlusRate: strategy.threePlusRate,
        fourPlusRate: strategy.fourPlusRate,
        fivePlusRate: strategy.fivePlusRate,
        sixRate: strategy.sixRate,
        pipeline: strategy.pipeline,
      })),
      analyzedRounds: diagnostic.analyzedRounds,
      featureScales: Object.fromEntries(
        Object.entries(diagnostic.featureScales).map(([feature, distribution]) => [
          feature,
          {
            mean: distribution.mean,
            standardDeviation: distribution.standardDeviation,
            p5: distribution.p5,
            p95: distribution.p95,
          },
        ]),
      ),
      featureMedians: Object.fromEntries(
        Object.entries(diagnostic.featureDistributions).map(
          ([group, distributions]) => [
            group,
            Object.fromEntries(
              Object.entries(distributions ?? {}).map(([feature, distribution]) => [
                feature,
                distribution.median,
              ]),
            ),
          ],
        ),
      ),
      fullHybridContributions:
        diagnostic.featureContributionDistributions['full-hybrid'],
      hitGroupRanks: Object.fromEntries(
        mainCombinationStrategies.map((strategy) => [
          strategy,
          Object.fromEntries(
            ['3', '4', '5'].map((hit) => {
              const group = diagnostic.hitGroupDistributions[strategy]?.[hit];
              return [
                hit,
                group === undefined
                  ? null
                  : {
                      scoreMedian: group.score.median,
                      rankMedian: group.rank.median,
                      top10Rate: group.top10Rate,
                      top100Rate: group.top100Rate,
                      top500Rate: group.top500Rate,
                      top1000Rate: group.top1000Rate,
                    },
              ];
            }),
          ),
        ]),
      ),
      strongestCorrelations: diagnostic.featureCorrelations.slice(0, 24),
      opportunityBestRanks: diagnostic.fourHitOpportunities.map((opportunity) => {
        const target =
          opportunity.candidateRecall >= 5 ? 'bestFiveBefore' : 'bestFourBefore';
        const ranked = Object.entries(opportunity.strategies)
          .map(([strategy, strategyResult]) => ({
            strategy,
            rank: strategyResult?.[target]?.rank ?? Number.POSITIVE_INFINITY,
          }))
          .sort((left, right) => left.rank - right.rank);
        return {
          round: opportunity.round,
          candidateRecall: opportunity.candidateRecall,
          bestStrategy: ranked[0]?.strategy ?? null,
          bestRank: Number.isFinite(ranked[0]?.rank) ? ranked[0]?.rank : null,
        };
      }),
    };
    console.log(`URIEL_RANKING_FULL_RESULT=${JSON.stringify(compact)}`);
    expect(diagnostic.analyzedRounds).toBe(42);
  }, 1_800_000);
});

describe.skipIf(!tailCoverage)('Uriel tail-coverage compression experiment', () => {
  it('reserves three outcome-blind games for ranks 31 through 80', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const rows = opportunityRounds.flatMap((round) => {
      const actualIndex = draws.findIndex((draw) => draw.round === round);
      const actual = draws[actualIndex]!;
      const candidate = buildCandidatePoolAnalysis(draws, actualIndex - 1, 20);
      const candidateRecall = matchingNumbers(
        candidate.candidateRanking.slice(0, 20),
        actual.numbers,
      ).length;
      if (candidateRecall < 5) return [];
      const analysis = buildCombinationAnalysis(
        draws,
        actualIndex - 1,
        20,
        false,
        'full-enumeration',
      );
      const strategyRows = Object.fromEntries(
        mainCombinationStrategies.map((strategy) => {
          const research = analysis.researchByStrategy[strategy];
          const baseline = buildPurchasePortfolio(research, 'board').games;
          const after = buildTailCoverageGames(research, 'board');
          return [
            strategy,
            {
              before: maximumMatch(baseline, actual.numbers),
              after: maximumMatch(after, actual.numbers),
              selectedRanks: after.map(
                (candidate) =>
                  research.findIndex(
                    (source) =>
                      source.numbers.join('-') === candidate.numbers.join('-'),
                  ) + 1,
              ),
            },
          ];
        }),
      );
      return [{ round, strategies: strategyRows }];
    });
    console.log(`URIEL_TAIL_COVERAGE_RESULT=${JSON.stringify(rows)}`);
    expect(rows).toHaveLength(7);
  }, 1_200_000);
});

describe.skipIf(!tailCoverageFull)('Uriel full tail-coverage guardrail', () => {
  it('validates Transition tail coverage across all 192 rounds', async () => {
    const fileUrl = new URL('../public/projects/uriel/data/draws.csv', import.meta.url);
    const draws = parseDrawCsv(await readFile(fileUrl, 'utf8'));
    const result = runWalkForwardBacktest(draws, {
      rounds: 192,
      poolSize: 20,
      seed: 20260807,
      monteCarloRuns: 32,
      includeAblation: true,
      generationMode: 'full-enumeration',
      includeRankingDiagnostics: false,
    });
    const selected = result.strategies.filter(({ strategy }) =>
      ['transition', 'random'].includes(strategy),
    );
    console.log(
      `URIEL_TAIL_COVERAGE_FULL_RESULT=${JSON.stringify({
        recall: result.recall.find(({ poolSize }) => poolSize === 20),
        strategies: selected,
        fiveHitOpportunities: result.fiveHitOpportunities.map((opportunity) => ({
          round: opportunity.round,
          transition: opportunity.strategies.transition,
        })),
      })}`,
    );
    expect(result.recall.find(({ poolSize }) => poolSize === 20)?.average).toBe(
      2.609375,
    );
  }, 1_800_000);
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
