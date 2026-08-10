import type { Candidate, LottoDraw } from '../types';
import {
  ablationStrategies,
  buildCombinationAnalysis,
  combinationScoreFor,
  mainCombinationStrategies,
  scoreContributionFor,
} from './combination';
import type {
  CombinationGenerationMode,
  CombinationScoreContribution,
  CombinationStrategy,
  CombinationVector,
} from './combination';
import { buildPurchasePortfolio, buildTailCoverageGames } from './purchase';
import { RankingDiagnosticsCollector } from './rankingDiagnostics';
import type { RankingDiagnostics } from './rankingDiagnostics';

export type BacktestStrategy =
  'legacy' | 'legacy-portfolio' | CombinationStrategy | 'full-no-diversity' | 'random';

export type BacktestRangeMode = 'recent' | 'previous-192' | 'custom';

export interface BacktestOptions {
  rounds: number;
  rangeMode: BacktestRangeMode;
  startRound: number | null;
  endRound: number | null;
  poolSize: number;
  seed: number;
  monteCarloRuns: number;
  includeAblation: boolean;
  generationMode: CombinationGenerationMode;
  includeRankingDiagnostics: boolean;
}

export interface RecallSummary {
  poolSize: number;
  distribution: readonly number[];
  average: number;
  atLeastFourRate: number;
  atLeastFiveRate: number;
  allSixRate: number;
}

export interface ConversionRate {
  eligible: number;
  successes: number;
  rate: number;
}

export interface ConversionSummary {
  oracle4To4: ConversionRate;
  oracle5To4: ConversionRate;
  oracle5To5: ConversionRate;
  oracle6To4: ConversionRate;
  oracle6To5: ConversionRate;
  oracle6To6: ConversionRate;
  averageLoss: number;
}

export interface StrategySummary {
  strategy: BacktestStrategy;
  label: string;
  hitDistribution: readonly number[];
  averageMaxHit: number;
  averageTop100MaxHit: number;
  threePlusRate: number;
  fourPlusRate: number;
  fivePlusRate: number;
  sixRate: number;
  portfolioImprovementRounds: number;
  conversion: ConversionSummary;
  pipeline?: TailPipelineSummary;
}

export interface PortfolioHitSummary {
  hitDistribution: readonly number[];
  averageMaxHit: number;
  threePlusRate: number;
  fourPlusRate: number;
  fivePlusRate: number;
  sixRate: number;
}

export interface PortfolioExperimentSummary {
  strategy: 'transition';
  method: 'tail-coverage';
  before: PortfolioHitSummary;
  after: PortfolioHitSummary;
  improvedRounds: number;
  unchangedRounds: number;
  worsenedRounds: number;
}

export interface TailStageConversion {
  candidateOpportunities: number;
  generationSuccesses: number;
  top100Successes: number;
  top10Successes: number;
  candidateToGenerationRate: number;
  candidateToTop100Rate: number;
  candidateToTop10Rate: number;
}

export interface TailPipelineSummary {
  fourPlus: TailStageConversion;
  fivePlus: TailStageConversion;
  six: TailStageConversion;
}

export interface BestHitCombinationDiagnostic {
  rank: number;
  score: number;
  scorePercentile: number;
  numbers: readonly number[];
  matchedNumbers: readonly number[];
  featureContribution: CombinationScoreContribution;
}

export interface StrategyRankingDiagnostic {
  bestFiveHitCombination: BestHitCombinationDiagnostic | null;
  scorePercentiles: {
    fiveHit: number | null;
    fourHit: number | null;
    threeHit: number | null;
    randomCombination: number;
  };
}

export interface RoundStrategyResult {
  strategyOracleMax: number;
  strategyOracleMatches: readonly number[];
  strategyOracleSource: 'candidate-pool' | 'legacy-priority';
  top100Max: number;
  naiveTop10Max: number;
  top10Max: number;
  rankingLoss: number | null;
  finalCompressionLoss: number;
  conversionLoss: number;
  baselineTop10Max?: number;
  rankingDiagnostic?: StrategyRankingDiagnostic;
}

export interface BacktestRoundResult {
  round: number;
  candidateRecall: Record<number, number>;
  candidateMatches: Record<number, readonly number[]>;
  combinationGenerationMaxHit: number;
  combinationGenerationBestNumbers: readonly number[];
  combinationGenerationMatches: readonly number[];
  generationLoss: number;
  rawCombinationCount: number;
  expectedCombinationCount: number;
  generationComplete: boolean;
  legacyOracleMax: number;
  legacyOracleMatches: readonly number[];
  strategies: Partial<Record<BacktestStrategy, RoundStrategyResult>>;
}

export interface FailureCase {
  round: number;
  candidateRecall: number;
  candidateMatches: readonly number[];
  strategyOracleMax: number;
  strategyOracleMatches: readonly number[];
  strategyOracleSource: RoundStrategyResult['strategyOracleSource'];
  legacyOracleMax: number;
  legacyOracleMatches: readonly number[];
  generationMaxHit: number;
  top100Max: number;
  top10Max: number;
  generationLoss: number;
  rankingLoss: number | null;
  finalCompressionLoss: number;
  conversionLoss: number;
}

export interface FiveHitOpportunity {
  round: number;
  candidateRecall: number;
  candidateMatches: readonly number[];
  generationMaxHit: number;
  generationLoss: number;
  rawCombinationCount: number;
  strategies: Partial<
    Record<
      CombinationStrategy,
      {
        top100MaxHit: number;
        top10MaxHitBefore: number;
        top10MaxHit: number;
        rankOfBest5HitCombination: number | null;
        scoreOfBest5HitCombination: number | null;
        scorePercentile: number | null;
        featureContribution: CombinationScoreContribution | null;
      }
    >
  >;
}

export interface BacktestResult {
  metricSchemaVersion: 4;
  generatedAt: string;
  dataAsOfRound: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  options: BacktestOptions;
  recall: readonly RecallSummary[];
  strategies: readonly StrategySummary[];
  rounds: readonly BacktestRoundResult[];
  rankingDiagnostics?: RankingDiagnostics;
  portfolioExperiment: PortfolioExperimentSummary;
  fiveHitOpportunities: readonly FiveHitOpportunity[];
  failures: {
    combinationLoss: readonly FailureCase[];
    candidateFailure: readonly FailureCase[];
    success: readonly FailureCase[];
  };
  bestStrategy: BacktestStrategy;
  bestCombinationStrategy: CombinationStrategy;
  bottleneck: 'candidate-engine' | 'combination-engine' | 'mixed';
  bottleneckMessage: string;
}

export interface ResolvedBacktestRoundRange {
  startHistoryIndex: number;
  endHistoryIndex: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
}

const POOL_SIZES = [10, 12, 15, 18, 20] as const;
const MINIMUM_HISTORY = 96;
const DEFAULT_OPTIONS: BacktestOptions = {
  rounds: 96,
  rangeMode: 'recent',
  startRound: null,
  endRound: null,
  poolSize: 15,
  seed: 20260807,
  monteCarloRuns: 32,
  includeAblation: true,
  generationMode: 'current',
  includeRankingDiagnostics: true,
};

export const strategyLabels: Record<BacktestStrategy, string> = {
  legacy: '기존 Uriel',
  'legacy-portfolio': '기존 + Diversity',
  number: 'Number 중심',
  pair: 'Pair 중심',
  'pair-triple': 'Pair + Triple',
  shape: 'Shape 중심',
  transition: 'Shape Transition',
  hybrid: 'Number + Pair + Shape',
  'full-hybrid': 'Full Hybrid',
  'full-no-pair': 'Full − Pair',
  'full-no-triple': 'Full − Triple',
  'full-no-shape': 'Full − Shape',
  'full-no-transition': 'Full − Transition',
  'full-no-diversity': 'Full − Diversity',
  random: 'Random Monte Carlo',
};

export function resolveBacktestRoundRange(
  draws: readonly LottoDraw[],
  requested: Partial<BacktestOptions> = {},
): ResolvedBacktestRoundRange {
  const options = sanitizeOptions({ ...DEFAULT_OPTIONS, ...requested });
  if (draws.length <= MINIMUM_HISTORY) {
    throw new Error(`Walk-forward 검증에는 최소 ${MINIMUM_HISTORY + 1}회가 필요해요.`);
  }

  const latestActualIndex = draws.length - 1;
  let actualStartIndex: number;
  let actualEndIndex: number;

  if (options.rangeMode === 'previous-192') {
    actualEndIndex = latestActualIndex - 192;
    actualStartIndex = actualEndIndex - 191;
  } else if (options.rangeMode === 'custom') {
    if (options.startRound === null || options.endRound === null) {
      throw new Error('사용자 지정 구간의 시작 회차와 종료 회차를 입력해 주세요.');
    }
    if (options.startRound > options.endRound) {
      throw new Error('시작 회차는 종료 회차보다 클 수 없어요.');
    }
    actualStartIndex = draws.findIndex(({ round }) => round === options.startRound);
    actualEndIndex = draws.findIndex(({ round }) => round === options.endRound);
    if (actualStartIndex < 0 || actualEndIndex < 0) {
      throw new Error(
        `사용자 지정 구간 ${options.startRound}–${options.endRound}회의 데이터가 없어요.`,
      );
    }
  } else {
    actualEndIndex = latestActualIndex;
    actualStartIndex = Math.max(MINIMUM_HISTORY, actualEndIndex - options.rounds + 1);
  }

  if (actualStartIndex < MINIMUM_HISTORY || actualEndIndex < actualStartIndex) {
    throw new Error(
      `선택한 검증 구간에는 각 회차보다 앞선 ${MINIMUM_HISTORY}회 이상의 학습 데이터가 필요해요.`,
    );
  }

  const startRound = draws[actualStartIndex]?.round;
  const endRound = draws[actualEndIndex]?.round;
  if (startRound === undefined || endRound === undefined) {
    throw new Error('선택한 검증 구간이 현재 회차 데이터 범위를 벗어났어요.');
  }

  const evaluatedRounds = actualEndIndex - actualStartIndex + 1;
  if (endRound - startRound + 1 !== evaluatedRounds) {
    throw new Error(`선택한 ${startRound}–${endRound}회 구간에 누락된 회차가 있어요.`);
  }

  return {
    startHistoryIndex: actualStartIndex - 1,
    endHistoryIndex: actualEndIndex - 1,
    startRound,
    endRound,
    evaluatedRounds,
  };
}

export function runWalkForwardBacktest(
  draws: readonly LottoDraw[],
  requested: Partial<BacktestOptions> = {},
  onProgress?: (completed: number, total: number, round: number) => void,
): BacktestResult {
  const sanitizedOptions = sanitizeOptions({ ...DEFAULT_OPTIONS, ...requested });
  if (draws.length <= MINIMUM_HISTORY) {
    throw new Error(`Walk-forward 검증에는 최소 ${MINIMUM_HISTORY + 1}회가 필요해요.`);
  }
  const range = resolveBacktestRoundRange(draws, sanitizedOptions);
  const options: BacktestOptions = {
    ...sanitizedOptions,
    rounds: range.evaluatedRounds,
    startRound: range.startRound,
    endRound: range.endRound,
  };
  const startIndex = range.startHistoryIndex;
  const endIndex = range.endHistoryIndex;
  const totalRounds = range.evaluatedRounds;
  const deterministicStrategies: BacktestStrategy[] = [
    'legacy',
    'legacy-portfolio',
    ...mainCombinationStrategies,
    ...(options.includeAblation
      ? [...ablationStrategies, 'full-no-diversity' as const]
      : []),
  ];
  const roundResults: BacktestRoundResult[] = [];
  const randomHits: number[] = [];
  const diagnosticStrategies = [
    ...mainCombinationStrategies,
    ...(options.includeAblation ? ablationStrategies : []),
  ];
  const rankingDiagnostics =
    options.generationMode === 'full-enumeration' && options.includeRankingDiagnostics
      ? new RankingDiagnosticsCollector(diagnosticStrategies)
      : null;

  for (let index = startIndex; index <= endIndex; index += 1) {
    const actual = draws[index + 1]!;
    const analysis = buildCombinationAnalysis(
      draws,
      index,
      options.poolSize,
      options.includeAblation,
      options.generationMode,
    );
    const candidateMatches = Object.fromEntries(
      POOL_SIZES.map((size) => [
        size,
        matchingNumbers(analysis.candidateRanking.slice(0, size), actual.numbers),
      ]),
    );
    const candidateRecall = Object.fromEntries(
      POOL_SIZES.map((size) => [size, candidateMatches[size]?.length ?? 0]),
    );
    const candidateOracleMatches = candidateMatches[options.poolSize] ?? [];
    const generationBest = bestGeneratedCombination(
      analysis.generatedCombinations,
      actual.numbers,
    );
    const combinationGenerationMaxHit = generationBest.matchedNumbers.length;
    const generationLoss = Math.max(
      candidateOracleMatches.length - combinationGenerationMaxHit,
      0,
    );
    const strategies: Partial<Record<BacktestStrategy, RoundStrategyResult>> = {};

    rankingDiagnostics?.addRound(
      actual.round,
      candidateOracleMatches.length,
      analysis.generatedCombinations,
      actual.numbers,
    );

    const legacyTop100 = analysis.legacyResearch;
    const legacyTop10 = legacyTop100.slice(0, 10);
    const legacyPortfolio = buildPurchasePortfolio(legacyTop100, 'board');
    const legacyOracleMatches = matchingNumbers(
      legacyPortfolio.priorityNumbers.slice(0, options.poolSize),
      actual.numbers,
    );
    const legacyOracleMax = legacyOracleMatches.length;
    strategies.legacy = evaluateStrategy(
      legacyTop100,
      legacyTop10,
      legacyTop10,
      actual.numbers,
      legacyOracleMatches,
      'legacy-priority',
      undefined,
      undefined,
    );
    strategies['legacy-portfolio'] = evaluateStrategy(
      legacyTop100,
      legacyTop10,
      legacyPortfolio.games,
      actual.numbers,
      legacyOracleMatches,
      'legacy-priority',
      undefined,
      undefined,
    );

    mainCombinationStrategies.forEach((strategy) => {
      const research = analysis.researchByStrategy[strategy];
      const baselinePortfolio = buildPurchasePortfolio(research, 'board').games;
      const portfolio =
        strategy === 'transition'
          ? buildTailCoverageGames(research, 'board')
          : baselinePortfolio;
      const rankingDiagnostic =
        options.generationMode === 'full-enumeration' &&
        candidateOracleMatches.length >= 5
          ? diagnoseStrategyRanking(
              analysis.generatedCombinations,
              strategy,
              actual.numbers,
              analysis.seed,
            )
          : undefined;
      const evaluated = evaluateStrategy(
        research,
        research.slice(0, 10),
        portfolio,
        actual.numbers,
        candidateOracleMatches,
        'candidate-pool',
        combinationGenerationMaxHit,
        rankingDiagnostic,
      );
      strategies[strategy] =
        strategy === 'transition'
          ? {
              ...evaluated,
              baselineTop10Max: maximumMatch(baselinePortfolio, actual.numbers),
            }
          : evaluated;
    });

    if (options.includeAblation) {
      ablationStrategies.forEach((strategy) => {
        const research = analysis.researchByStrategy[strategy];
        const portfolio = buildPurchasePortfolio(research, 'board').games;
        const rankingDiagnostic =
          options.generationMode === 'full-enumeration' &&
          candidateOracleMatches.length >= 5
            ? diagnoseStrategyRanking(
                analysis.generatedCombinations,
                strategy,
                actual.numbers,
                analysis.seed,
              )
            : undefined;
        strategies[strategy] = evaluateStrategy(
          research,
          research.slice(0, 10),
          portfolio,
          actual.numbers,
          candidateOracleMatches,
          'candidate-pool',
          combinationGenerationMaxHit,
          rankingDiagnostic,
        );
      });
      const full = analysis.researchByStrategy['full-hybrid'];
      strategies['full-no-diversity'] = evaluateStrategy(
        full,
        full.slice(0, 10),
        full.slice(0, 10),
        actual.numbers,
        candidateOracleMatches,
        'candidate-pool',
        combinationGenerationMaxHit,
        strategies['full-hybrid']?.rankingDiagnostic,
      );
    }

    for (let run = 0; run < options.monteCarloRuns; run += 1) {
      const seed =
        options.seed ^
        Math.imul(actual.round, 2246822519) ^
        Math.imul(run + 1, 3266489917);
      randomHits.push(maximumMatch(randomPortfolio(seed), actual.numbers));
    }

    const roundResult: BacktestRoundResult = {
      round: actual.round,
      candidateRecall,
      candidateMatches,
      combinationGenerationMaxHit,
      combinationGenerationBestNumbers: generationBest.numbers,
      combinationGenerationMatches: generationBest.matchedNumbers,
      generationLoss,
      rawCombinationCount: analysis.rawCombinationCount,
      expectedCombinationCount: analysis.expectedCombinationCount,
      generationComplete: analysis.generationComplete,
      legacyOracleMax,
      legacyOracleMatches,
      strategies,
    };
    assertBacktestRoundMetrics(roundResult, options.poolSize, options.generationMode);
    roundResults.push(roundResult);
    onProgress?.(roundResults.length, totalRounds, actual.round);
  }

  const summaries = deterministicStrategies.map((strategy) =>
    summarizeStrategy(strategy, roundResults, options.poolSize),
  );
  summaries.push(summarizeRandom(randomHits, options));
  const ranked = summaries
    .filter(({ strategy }) => strategy !== 'random')
    .sort(
      (left, right) =>
        right.fivePlusRate - left.fivePlusRate ||
        right.sixRate - left.sixRate ||
        right.fourPlusRate - left.fourPlusRate ||
        right.threePlusRate - left.threePlusRate ||
        right.averageMaxHit - left.averageMaxHit,
    );
  const bestStrategy = ranked[0]?.strategy ?? 'legacy';
  const bestCombinationStrategy =
    (ranked.find(({ strategy }) =>
      mainCombinationStrategies.includes(strategy as CombinationStrategy),
    )?.strategy as CombinationStrategy | undefined) ?? 'full-hybrid';
  const failures = classifyFailures(
    roundResults,
    bestCombinationStrategy,
    options.poolSize,
  );
  const candidateFailureRate =
    roundResults.filter((round) => (round.candidateRecall[options.poolSize] ?? 0) <= 3)
      .length / Math.max(roundResults.length, 1);
  const conversionFailureRate =
    roundResults.filter(
      (round) =>
        (round.strategies[bestCombinationStrategy]?.strategyOracleMax ?? 0) >= 4 &&
        (round.strategies[bestCombinationStrategy]?.top10Max ?? 0) < 4,
    ).length / Math.max(roundResults.length, 1);
  const bottleneck =
    Math.abs(candidateFailureRate - conversionFailureRate) < 0.08
      ? 'mixed'
      : candidateFailureRate > conversionFailureRate
        ? 'candidate-engine'
        : 'combination-engine';
  const bottleneckMessage =
    bottleneck === 'candidate-engine'
      ? `후보 Pool ${options.poolSize}가 4개 미만을 담은 회차가 ${(candidateFailureRate * 100).toFixed(1)}%로, 후보 생성이 더 큰 병목이에요.`
      : bottleneck === 'combination-engine'
        ? `Oracle 4+인데 Top-10 4+로 전환하지 못한 회차가 ${(conversionFailureRate * 100).toFixed(1)}%로, 조합 압축이 더 큰 병목이에요.`
        : `후보 생성 실패 ${(candidateFailureRate * 100).toFixed(1)}%와 조합 전환 실패 ${(conversionFailureRate * 100).toFixed(1)}%가 함께 나타나요.`;

  return {
    metricSchemaVersion: 4,
    generatedAt: new Date().toISOString(),
    dataAsOfRound: draws.at(-1)?.round ?? 0,
    startRound: roundResults[0]?.round ?? 0,
    endRound: roundResults.at(-1)?.round ?? 0,
    evaluatedRounds: roundResults.length,
    options,
    recall: summarizeRecall(roundResults),
    strategies: summaries,
    rounds: roundResults,
    portfolioExperiment: summarizePortfolioExperiment(roundResults),
    ...(rankingDiagnostics === null
      ? {}
      : { rankingDiagnostics: rankingDiagnostics.build() }),
    fiveHitOpportunities: buildFiveHitOpportunities(
      roundResults,
      options.poolSize,
      options.includeAblation,
    ),
    failures,
    bestStrategy,
    bestCombinationStrategy,
    bottleneck,
    bottleneckMessage,
  };
}

function evaluateStrategy(
  research: readonly Candidate[],
  naive: readonly Candidate[],
  portfolio: readonly Candidate[],
  actual: readonly number[],
  strategyOracleMatches: readonly number[],
  strategyOracleSource: RoundStrategyResult['strategyOracleSource'],
  generationMaxHit: number | undefined,
  rankingDiagnostic: StrategyRankingDiagnostic | undefined,
): RoundStrategyResult {
  const top100Max = maximumMatch(research, actual);
  const naiveTop10Max = maximumMatch(naive, actual);
  const top10Max = maximumMatch(portfolio, actual);
  return {
    strategyOracleMax: strategyOracleMatches.length,
    strategyOracleMatches,
    strategyOracleSource,
    top100Max,
    naiveTop10Max,
    top10Max,
    rankingLoss:
      generationMaxHit === undefined ? null : Math.max(generationMaxHit - top100Max, 0),
    finalCompressionLoss: Math.max(top100Max - top10Max, 0),
    conversionLoss: Math.max(strategyOracleMatches.length - top10Max, 0),
    ...(rankingDiagnostic === undefined ? {} : { rankingDiagnostic }),
  };
}

function summarizeRecall(rounds: readonly BacktestRoundResult[]): RecallSummary[] {
  return POOL_SIZES.map((poolSize) => {
    const values = rounds.map((round) => round.candidateRecall[poolSize] ?? 0);
    return {
      poolSize,
      distribution: hitDistribution(values, rounds.length),
      average: mean(values),
      atLeastFourRate: rate(values, 4),
      atLeastFiveRate: rate(values, 5),
      allSixRate: rate(values, 6),
    };
  });
}

function summarizeStrategy(
  strategy: BacktestStrategy,
  rounds: readonly BacktestRoundResult[],
  poolSize: number,
): StrategySummary {
  const records = rounds.map((round) => round.strategies[strategy]!).filter(Boolean);
  const hits = records.map(({ top10Max }) => top10Max);
  const top100 = records.map(({ top100Max }) => top100Max);
  return {
    strategy,
    label: strategyLabels[strategy],
    hitDistribution: hitDistribution(hits, rounds.length),
    averageMaxHit: mean(hits),
    averageTop100MaxHit: mean(top100),
    threePlusRate: rate(hits, 3),
    fourPlusRate: rate(hits, 4),
    fivePlusRate: rate(hits, 5),
    sixRate: rate(hits, 6),
    portfolioImprovementRounds: records.filter(
      ({ top10Max, naiveTop10Max }) => top10Max > naiveTop10Max,
    ).length,
    conversion: summarizeConversion(rounds, strategy),
    ...(records[0]?.strategyOracleSource === 'candidate-pool'
      ? { pipeline: summarizeTailPipeline(rounds, strategy, poolSize) }
      : {}),
  };
}

function summarizePortfolioExperiment(
  rounds: readonly BacktestRoundResult[],
): PortfolioExperimentSummary {
  const beforeHits = rounds.map((round) => {
    const result = round.strategies.transition;
    return result?.baselineTop10Max ?? result?.top10Max ?? 0;
  });
  const afterHits = rounds.map((round) => round.strategies.transition?.top10Max ?? 0);
  const summary = (hits: readonly number[]): PortfolioHitSummary => ({
    hitDistribution: hitDistribution(hits, rounds.length),
    averageMaxHit: mean(hits),
    threePlusRate: rate(hits, 3),
    fourPlusRate: rate(hits, 4),
    fivePlusRate: rate(hits, 5),
    sixRate: rate(hits, 6),
  });
  return {
    strategy: 'transition',
    method: 'tail-coverage',
    before: summary(beforeHits),
    after: summary(afterHits),
    improvedRounds: afterHits.filter((hit, index) => hit > (beforeHits[index] ?? 0))
      .length,
    unchangedRounds: afterHits.filter((hit, index) => hit === (beforeHits[index] ?? 0))
      .length,
    worsenedRounds: afterHits.filter((hit, index) => hit < (beforeHits[index] ?? 0))
      .length,
  };
}

function summarizeRandom(
  hits: readonly number[],
  options: BacktestOptions,
): StrategySummary {
  const normalizedDistribution = hitDistribution(hits, hits.length).map(
    (count) => count / options.monteCarloRuns,
  );
  return {
    strategy: 'random',
    label: `${strategyLabels.random} × ${options.monteCarloRuns}`,
    hitDistribution: normalizedDistribution,
    averageMaxHit: mean(hits),
    averageTop100MaxHit: 0,
    threePlusRate: rate(hits, 3),
    fourPlusRate: rate(hits, 4),
    fivePlusRate: rate(hits, 5),
    sixRate: rate(hits, 6),
    portfolioImprovementRounds: 0,
    conversion: emptyConversion(),
  };
}

function summarizeTailPipeline(
  rounds: readonly BacktestRoundResult[],
  strategy: BacktestStrategy,
  poolSize: number,
): TailPipelineSummary {
  const summarize = (threshold: number): TailStageConversion => {
    const eligible = rounds.filter(
      (round) => (round.candidateRecall[poolSize] ?? 0) >= threshold,
    );
    const candidateOpportunities = eligible.length;
    const generationSuccesses = eligible.filter(
      (round) => round.combinationGenerationMaxHit >= threshold,
    ).length;
    const top100Successes = eligible.filter(
      (round) => (round.strategies[strategy]?.top100Max ?? 0) >= threshold,
    ).length;
    const top10Successes = eligible.filter(
      (round) => (round.strategies[strategy]?.top10Max ?? 0) >= threshold,
    ).length;
    return {
      candidateOpportunities,
      generationSuccesses,
      top100Successes,
      top10Successes,
      candidateToGenerationRate:
        generationSuccesses / Math.max(candidateOpportunities, 1),
      candidateToTop100Rate: top100Successes / Math.max(candidateOpportunities, 1),
      candidateToTop10Rate: top10Successes / Math.max(candidateOpportunities, 1),
    };
  };
  return {
    fourPlus: summarize(4),
    fivePlus: summarize(5),
    six: summarize(6),
  };
}

function summarizeConversion(
  rounds: readonly BacktestRoundResult[],
  strategy: BacktestStrategy,
): ConversionSummary {
  const conversion = (oracle: number, target: number): ConversionRate => {
    const eligible = rounds.filter(
      (round) => round.strategies[strategy]?.strategyOracleMax === oracle,
    );
    const successes = eligible.filter(
      (round) => (round.strategies[strategy]?.top10Max ?? 0) >= target,
    ).length;
    return {
      eligible: eligible.length,
      successes,
      rate: successes / Math.max(eligible.length, 1),
    };
  };
  return {
    oracle4To4: conversion(4, 4),
    oracle5To4: conversion(5, 4),
    oracle5To5: conversion(5, 5),
    oracle6To4: conversion(6, 4),
    oracle6To5: conversion(6, 5),
    oracle6To6: conversion(6, 6),
    averageLoss: mean(
      rounds.map((round) => round.strategies[strategy]?.conversionLoss ?? 0),
    ),
  };
}

function emptyConversion(): ConversionSummary {
  const empty = { eligible: 0, successes: 0, rate: 0 };
  return {
    oracle4To4: empty,
    oracle5To4: empty,
    oracle5To5: empty,
    oracle6To4: empty,
    oracle6To5: empty,
    oracle6To6: empty,
    averageLoss: 0,
  };
}

function buildFiveHitOpportunities(
  rounds: readonly BacktestRoundResult[],
  poolSize: number,
  includeAblation: boolean,
): FiveHitOpportunity[] {
  const strategies = [
    ...mainCombinationStrategies,
    ...(includeAblation ? ablationStrategies : []),
  ];
  return rounds
    .filter((round) => (round.candidateRecall[poolSize] ?? 0) >= 5)
    .map((round) => ({
      round: round.round,
      candidateRecall: round.candidateRecall[poolSize] ?? 0,
      candidateMatches: round.candidateMatches[poolSize] ?? [],
      generationMaxHit: round.combinationGenerationMaxHit,
      generationLoss: round.generationLoss,
      rawCombinationCount: round.rawCombinationCount,
      strategies: Object.fromEntries(
        strategies.map((strategy) => {
          const result = round.strategies[strategy];
          const bestFive = result?.rankingDiagnostic?.bestFiveHitCombination;
          return [
            strategy,
            {
              top100MaxHit: result?.top100Max ?? 0,
              top10MaxHitBefore: result?.baselineTop10Max ?? result?.top10Max ?? 0,
              top10MaxHit: result?.top10Max ?? 0,
              rankOfBest5HitCombination: bestFive?.rank ?? null,
              scoreOfBest5HitCombination: bestFive?.score ?? null,
              scorePercentile: bestFive?.scorePercentile ?? null,
              featureContribution: bestFive?.featureContribution ?? null,
            },
          ];
        }),
      ),
    }));
}

function bestGeneratedCombination(
  generated: readonly CombinationVector[],
  actual: readonly number[],
): { numbers: readonly number[]; matchedNumbers: readonly number[] } {
  let bestNumbers: readonly number[] = [];
  let bestMatches: readonly number[] = [];
  generated.forEach(({ numbers }) => {
    const matches = matchingNumbers(numbers, actual);
    if (
      matches.length > bestMatches.length ||
      (matches.length === bestMatches.length &&
        combinationKey(numbers).localeCompare(combinationKey(bestNumbers)) < 0)
    ) {
      bestNumbers = numbers;
      bestMatches = matches;
    }
  });
  return { numbers: bestNumbers, matchedNumbers: bestMatches };
}

export function diagnoseStrategyRanking(
  generated: readonly CombinationVector[],
  strategy: CombinationStrategy,
  actual: readonly number[],
  seed: number,
): StrategyRankingDiagnostic {
  const scored = generated.map((vector) => ({
    vector,
    score: combinationScoreFor(vector.features, strategy),
    matches: matchingNumbers(vector.numbers, actual),
  }));
  const bestForHit = (minimum: number, maximum = minimum) =>
    scored
      .filter(({ matches }) => matches.length >= minimum && matches.length <= maximum)
      .sort(compareScored)[0];
  const bestFive = bestForHit(5, 6);
  const bestFour = bestForHit(4);
  const bestThree = bestForHit(3);
  const random = scored[seed % Math.max(scored.length, 1)];
  const rankOf = (target: (typeof scored)[number] | undefined): number | null => {
    if (target === undefined) return null;
    return (
      1 + scored.filter((candidate) => compareScored(candidate, target) < 0).length
    );
  };
  const percentileOf = (target: (typeof scored)[number] | undefined) => {
    const rank = rankOf(target);
    return rank === null ? null : (scored.length - rank + 1) / scored.length;
  };
  const bestFiveRank = rankOf(bestFive);
  return {
    bestFiveHitCombination:
      bestFive === undefined || bestFiveRank === null
        ? null
        : {
            rank: bestFiveRank,
            score: bestFive.score,
            scorePercentile: percentileOf(bestFive) ?? 0,
            numbers: bestFive.vector.numbers,
            matchedNumbers: bestFive.matches,
            featureContribution: scoreContributionFor(
              bestFive.vector.features,
              strategy,
            ),
          },
    scorePercentiles: {
      fiveHit: percentileOf(bestFive),
      fourHit: percentileOf(bestFour),
      threeHit: percentileOf(bestThree),
      randomCombination: percentileOf(random) ?? 0,
    },
  };
}

function compareScored(
  left: { vector: CombinationVector; score: number },
  right: { vector: CombinationVector; score: number },
): number {
  return (
    right.score - left.score ||
    combinationKey(left.vector.numbers).localeCompare(
      combinationKey(right.vector.numbers),
    )
  );
}

function combinationKey(numbers: readonly number[]): string {
  return numbers.join('-');
}

function classifyFailures(
  rounds: readonly BacktestRoundResult[],
  strategy: BacktestStrategy,
  poolSize: number,
): BacktestResult['failures'] {
  const cases = rounds.map((round) => buildFailureCase(round, strategy, poolSize));
  return {
    combinationLoss: cases
      .filter(
        ({ strategyOracleMax, top10Max }) => strategyOracleMax >= 5 && top10Max <= 3,
      )
      .slice(-20),
    candidateFailure: cases
      .filter(({ candidateRecall }) => candidateRecall <= 3)
      .slice(-20),
    success: cases.filter(({ top10Max }) => top10Max >= 4).slice(-20),
  };
}

export function buildFailureCase(
  round: BacktestRoundResult,
  strategy: BacktestStrategy,
  poolSize: number,
): FailureCase {
  const result = round.strategies[strategy];
  if (result === undefined) {
    throw new Error(`${strategy} 전략의 ${round.round}회 결과가 없어요.`);
  }
  return {
    round: round.round,
    candidateRecall: round.candidateRecall[poolSize] ?? 0,
    candidateMatches: round.candidateMatches[poolSize] ?? [],
    strategyOracleMax: result.strategyOracleMax,
    strategyOracleMatches: result.strategyOracleMatches,
    strategyOracleSource: result.strategyOracleSource,
    legacyOracleMax: round.legacyOracleMax,
    legacyOracleMatches: round.legacyOracleMatches,
    generationMaxHit: round.combinationGenerationMaxHit,
    top100Max: result.top100Max,
    top10Max: result.top10Max,
    generationLoss: round.generationLoss,
    rankingLoss: result.rankingLoss,
    finalCompressionLoss: result.finalCompressionLoss,
    conversionLoss: result.conversionLoss,
  };
}

export function assertBacktestRoundMetrics(
  round: BacktestRoundResult,
  poolSize: number,
  generationMode: CombinationGenerationMode = 'current',
): void {
  POOL_SIZES.forEach((size) => {
    if (
      (round.candidateRecall[size] ?? 0) !== (round.candidateMatches[size] ?? []).length
    ) {
      throw new Error(
        `${round.round}회 Top-${size} Candidate Recall 지표가 적중 번호와 달라요.`,
      );
    }
  });
  const candidateMatches = round.candidateMatches[poolSize] ?? [];
  if (round.combinationGenerationMaxHit !== round.combinationGenerationMatches.length) {
    throw new Error(
      `${round.round}회 Combination Generation 지표가 적중 번호와 달라요.`,
    );
  }
  if (round.rawCombinationCount > round.expectedCombinationCount) {
    throw new Error(`${round.round}회 생성 조합 수가 전수조합 수를 초과해요.`);
  }
  if (
    generationMode === 'full-enumeration' &&
    (!round.generationComplete ||
      round.rawCombinationCount !== round.expectedCombinationCount)
  ) {
    throw new Error(`${round.round}회 Full Enumeration 조합이 누락됐어요.`);
  }
  if (
    generationMode === 'full-enumeration' &&
    round.combinationGenerationMaxHit !== candidateMatches.length
  ) {
    throw new Error(
      `${round.round}회 Full Enumeration Generation Max가 Candidate Recall과 달라요.`,
    );
  }
  if (
    round.generationLoss !==
    Math.max(candidateMatches.length - round.combinationGenerationMaxHit, 0)
  ) {
    throw new Error(`${round.round}회 Generation Loss 지표가 달라요.`);
  }
  if (round.legacyOracleMax !== round.legacyOracleMatches.length) {
    throw new Error(`${round.round}회 Legacy Oracle 지표가 적중 번호와 달라요.`);
  }

  Object.entries(round.strategies).forEach(([strategy, result]) => {
    if (result === undefined) return;
    const expectedMatches =
      result.strategyOracleSource === 'candidate-pool'
        ? candidateMatches
        : round.legacyOracleMatches;
    if (
      result.strategyOracleMax !== result.strategyOracleMatches.length ||
      !sameNumbers(result.strategyOracleMatches, expectedMatches)
    ) {
      throw new Error(
        `${round.round}회 ${strategy} Strategy Oracle 지표가 원본과 달라요.`,
      );
    }
    if (
      result.strategyOracleSource === 'candidate-pool' &&
      result.top100Max > result.strategyOracleMax
    ) {
      throw new Error(`${round.round}회 ${strategy} Top-100이 Oracle을 초과해요.`);
    }
    if (result.top10Max > result.top100Max) {
      throw new Error(`${round.round}회 ${strategy} Top-10이 Top-100을 초과해요.`);
    }
    if (
      result.rankingLoss !==
      (result.strategyOracleSource === 'candidate-pool'
        ? Math.max(round.combinationGenerationMaxHit - result.top100Max, 0)
        : null)
    ) {
      throw new Error(`${round.round}회 ${strategy} Ranking Loss 지표가 달라요.`);
    }
    if (
      result.finalCompressionLoss !== Math.max(result.top100Max - result.top10Max, 0)
    ) {
      throw new Error(
        `${round.round}회 ${strategy} Final Compression Loss 지표가 달라요.`,
      );
    }
    if (
      result.conversionLoss !== Math.max(result.strategyOracleMax - result.top10Max, 0)
    ) {
      throw new Error(`${round.round}회 ${strategy} Conversion Loss 지표가 달라요.`);
    }
    if (
      result.strategyOracleSource === 'candidate-pool' &&
      result.conversionLoss !==
        round.generationLoss + (result.rankingLoss ?? 0) + result.finalCompressionLoss
    ) {
      throw new Error(
        `${round.round}회 ${strategy} 단계별 Loss 합계가 Conversion Loss와 달라요.`,
      );
    }
  });
}

function randomPortfolio(seed: number): Candidate[] {
  const random = mulberry32(seed >>> 0);
  const games: Candidate[] = [];
  const seen = new Set<string>();
  while (games.length < 10) {
    const numbers = sampleNumbers(random);
    const key = numbers.join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    games.push({
      numbers,
      metrics: {
        centroidX: 0,
        centroidY: 0,
        area: 0,
        perimeter: 0,
        compactness: 0,
        spread: 0,
        orientation: 0,
      },
      score: 0,
    });
  }
  return games;
}

function sampleNumbers(random: () => number): number[] {
  const values = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [values[index], values[swap]] = [values[swap]!, values[index]!];
  }
  return values.slice(0, 6).sort((left, right) => left - right);
}

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function maximumMatch(
  candidates: readonly Candidate[],
  actual: readonly number[],
): number {
  return candidates.reduce(
    (maximum, candidate) => Math.max(maximum, countMatches(candidate.numbers, actual)),
    0,
  );
}

function countMatches(left: readonly number[], right: readonly number[]): number {
  return left.filter((number) => right.includes(number)).length;
}

function matchingNumbers(pool: readonly number[], actual: readonly number[]): number[] {
  return actual.filter((number) => pool.includes(number));
}

function sameNumbers(left: readonly number[], right: readonly number[]): boolean {
  return (
    left.length === right.length &&
    left.every((number, index) => number === right[index])
  );
}

function hitDistribution(values: readonly number[], expectedTotal: number): number[] {
  const distribution = Array(7).fill(0) as number[];
  values.forEach((value) => {
    distribution[Math.min(Math.max(Math.round(value), 0), 6)]! += 1;
  });
  if (values.length === 0 && expectedTotal > 0) distribution[0] = expectedTotal;
  return distribution;
}

function rate(values: readonly number[], threshold: number): number {
  return (
    values.filter((value) => value >= threshold).length / Math.max(values.length, 1)
  );
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sanitizeOptions(options: BacktestOptions): BacktestOptions {
  const rangeMode: BacktestRangeMode =
    options.rangeMode === 'previous-192' || options.rangeMode === 'custom'
      ? options.rangeMode
      : 'recent';
  return {
    rounds:
      rangeMode === 'previous-192'
        ? 192
        : Math.min(Math.max(Math.round(options.rounds), 24), 384),
    rangeMode,
    startRound:
      options.startRound === null || !Number.isFinite(options.startRound)
        ? null
        : Math.round(options.startRound),
    endRound:
      options.endRound === null || !Number.isFinite(options.endRound)
        ? null
        : Math.round(options.endRound),
    poolSize: [10, 12, 15, 18, 20].includes(options.poolSize) ? options.poolSize : 15,
    seed: options.seed >>> 0,
    monteCarloRuns: Math.min(Math.max(Math.round(options.monteCarloRuns), 8), 128),
    includeAblation: options.includeAblation,
    generationMode:
      options.generationMode === 'full-enumeration' ? 'full-enumeration' : 'current',
    includeRankingDiagnostics: options.includeRankingDiagnostics,
  };
}
