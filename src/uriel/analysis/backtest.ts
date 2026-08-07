import type { Candidate, LottoDraw } from '../types';
import {
  ablationStrategies,
  buildCombinationAnalysis,
  mainCombinationStrategies,
} from './combination';
import type { CombinationStrategy } from './combination';
import { buildPurchasePortfolio } from './purchase';

export type BacktestStrategy =
  'legacy' | 'legacy-portfolio' | CombinationStrategy | 'full-no-diversity' | 'random';

export interface BacktestOptions {
  rounds: number;
  poolSize: number;
  seed: number;
  monteCarloRuns: number;
  includeAblation: boolean;
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
}

export interface RoundStrategyResult {
  oracleMax: number;
  top100Max: number;
  naiveTop10Max: number;
  top10Max: number;
  conversionLoss: number;
}

export interface BacktestRoundResult {
  round: number;
  candidateRecall: Record<number, number>;
  legacyOracleMax: number;
  strategies: Partial<Record<BacktestStrategy, RoundStrategyResult>>;
}

export interface FailureCase {
  round: number;
  candidateRecall: number;
  strategyOracleMax: number;
  legacyOracleMax: number;
  top100Max: number;
  top10Max: number;
  conversionLoss: number;
}

export interface BacktestResult {
  generatedAt: string;
  dataAsOfRound: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  options: BacktestOptions;
  recall: readonly RecallSummary[];
  strategies: readonly StrategySummary[];
  rounds: readonly BacktestRoundResult[];
  failures: {
    combinationLoss: readonly FailureCase[];
    candidateFailure: readonly FailureCase[];
    success: readonly FailureCase[];
  };
  bestStrategy: BacktestStrategy;
  bottleneck: 'candidate-engine' | 'combination-engine' | 'mixed';
  bottleneckMessage: string;
}

const POOL_SIZES = [10, 12, 15, 18, 20] as const;
const MINIMUM_HISTORY = 96;
const DEFAULT_OPTIONS: BacktestOptions = {
  rounds: 96,
  poolSize: 15,
  seed: 20260807,
  monteCarloRuns: 32,
  includeAblation: true,
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

export function runWalkForwardBacktest(
  draws: readonly LottoDraw[],
  requested: Partial<BacktestOptions> = {},
  onProgress?: (completed: number, total: number, round: number) => void,
): BacktestResult {
  const options = sanitizeOptions({ ...DEFAULT_OPTIONS, ...requested });
  if (draws.length <= MINIMUM_HISTORY) {
    throw new Error(`Walk-forward 검증에는 최소 ${MINIMUM_HISTORY + 1}회가 필요해요.`);
  }
  const endIndex = draws.length - 2;
  const startIndex = Math.max(MINIMUM_HISTORY - 1, endIndex - options.rounds + 1);
  const totalRounds = endIndex - startIndex + 1;
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

  for (let index = startIndex; index <= endIndex; index += 1) {
    const actual = draws[index + 1]!;
    const analysis = buildCombinationAnalysis(
      draws,
      index,
      options.poolSize,
      options.includeAblation,
    );
    const candidateRecall = Object.fromEntries(
      POOL_SIZES.map((size) => [
        size,
        countMatches(analysis.candidateRanking.slice(0, size), actual.numbers),
      ]),
    );
    const candidateOracleMax = candidateRecall[options.poolSize] ?? 0;
    const strategies: Partial<Record<BacktestStrategy, RoundStrategyResult>> = {};

    const legacyTop100 = analysis.legacyResearch;
    const legacyTop10 = legacyTop100.slice(0, 10);
    const legacyPortfolio = buildPurchasePortfolio(legacyTop100, 'board');
    const legacyOracleMax = countMatches(
      legacyPortfolio.priorityNumbers.slice(0, options.poolSize),
      actual.numbers,
    );
    strategies.legacy = evaluateStrategy(
      legacyTop100,
      legacyTop10,
      legacyTop10,
      actual.numbers,
      legacyOracleMax,
    );
    strategies['legacy-portfolio'] = evaluateStrategy(
      legacyTop100,
      legacyTop10,
      legacyPortfolio.games,
      actual.numbers,
      legacyOracleMax,
    );

    mainCombinationStrategies.forEach((strategy) => {
      const research = analysis.researchByStrategy[strategy];
      const portfolio = buildPurchasePortfolio(research, 'board').games;
      strategies[strategy] = evaluateStrategy(
        research,
        research.slice(0, 10),
        portfolio,
        actual.numbers,
        candidateOracleMax,
      );
    });

    if (options.includeAblation) {
      ablationStrategies.forEach((strategy) => {
        const research = analysis.researchByStrategy[strategy];
        const portfolio = buildPurchasePortfolio(research, 'board').games;
        strategies[strategy] = evaluateStrategy(
          research,
          research.slice(0, 10),
          portfolio,
          actual.numbers,
          candidateOracleMax,
        );
      });
      const full = analysis.researchByStrategy['full-hybrid'];
      strategies['full-no-diversity'] = evaluateStrategy(
        full,
        full.slice(0, 10),
        full.slice(0, 10),
        actual.numbers,
        candidateOracleMax,
      );
    }

    for (let run = 0; run < options.monteCarloRuns; run += 1) {
      const seed =
        options.seed ^
        Math.imul(actual.round, 2246822519) ^
        Math.imul(run + 1, 3266489917);
      randomHits.push(maximumMatch(randomPortfolio(seed), actual.numbers));
    }

    roundResults.push({
      round: actual.round,
      candidateRecall,
      legacyOracleMax,
      strategies,
    });
    onProgress?.(roundResults.length, totalRounds, actual.round);
  }

  const summaries = deterministicStrategies.map((strategy) =>
    summarizeStrategy(strategy, roundResults),
  );
  summaries.push(summarizeRandom(randomHits, options));
  const ranked = summaries
    .filter(({ strategy }) => strategy !== 'random')
    .sort(
      (left, right) =>
        right.fourPlusRate - left.fourPlusRate ||
        right.fivePlusRate - left.fivePlusRate ||
        right.sixRate - left.sixRate ||
        right.averageMaxHit - left.averageMaxHit,
    );
  const bestStrategy = ranked[0]?.strategy ?? 'legacy';
  const failures = classifyFailures(roundResults, bestStrategy, options.poolSize);
  const candidateFailureRate =
    roundResults.filter(
      (round) => (round.candidateRecall[options.poolSize] ?? 0) <= 3,
    ).length / Math.max(roundResults.length, 1);
  const conversionFailureRate =
    roundResults.filter(
      (round) =>
        (round.strategies[bestStrategy]?.oracleMax ?? 0) >= 4 &&
        (round.strategies[bestStrategy]?.top10Max ?? 0) < 4,
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
    generatedAt: new Date().toISOString(),
    dataAsOfRound: draws.at(-1)?.round ?? 0,
    startRound: roundResults[0]?.round ?? 0,
    endRound: roundResults.at(-1)?.round ?? 0,
    evaluatedRounds: roundResults.length,
    options,
    recall: summarizeRecall(roundResults),
    strategies: summaries,
    rounds: roundResults,
    failures,
    bestStrategy,
    bottleneck,
    bottleneckMessage,
  };
}

function evaluateStrategy(
  research: readonly Candidate[],
  naive: readonly Candidate[],
  portfolio: readonly Candidate[],
  actual: readonly number[],
  oracle: number,
): RoundStrategyResult {
  const top100Max = maximumMatch(research, actual);
  const naiveTop10Max = maximumMatch(naive, actual);
  const top10Max = maximumMatch(portfolio, actual);
  return {
    oracleMax: oracle,
    top100Max,
    naiveTop10Max,
    top10Max,
    conversionLoss: Math.max(oracle - top10Max, 0),
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

function summarizeConversion(
  rounds: readonly BacktestRoundResult[],
  strategy: BacktestStrategy,
): ConversionSummary {
  const conversion = (oracle: number, target: number): ConversionRate => {
    const eligible = rounds.filter(
      (round) => round.strategies[strategy]?.oracleMax === oracle,
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

function classifyFailures(
  rounds: readonly BacktestRoundResult[],
  strategy: BacktestStrategy,
  poolSize: number,
): BacktestResult['failures'] {
  const cases = rounds.map((round) => buildFailureCase(round, strategy, poolSize));
  return {
    combinationLoss: cases
      .filter(
        ({ strategyOracleMax, top10Max }) =>
          strategyOracleMax >= 5 && top10Max <= 3,
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
    strategyOracleMax: result.oracleMax,
    legacyOracleMax: round.legacyOracleMax,
    top100Max: result.top100Max,
    top10Max: result.top10Max,
    conversionLoss: result.conversionLoss,
  };
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
  return {
    rounds: Math.min(Math.max(Math.round(options.rounds), 24), 384),
    poolSize: [10, 12, 15, 18, 20].includes(options.poolSize) ? options.poolSize : 15,
    seed: options.seed >>> 0,
    monteCarloRuns: Math.min(Math.max(Math.round(options.monteCarloRuns), 8), 128),
    includeAblation: options.includeAblation,
  };
}
