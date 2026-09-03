import type { LottoDraw } from '../../types';
import { predictNextCandidates } from './prediction';
import { createRandom, mixSeed } from './random';
import { average, quantile } from './statistics';
import type { CandidateSize, ResearchAlgorithmId, ResearchConfig } from './types';
import { CANDIDATE_SIZES, sanitizeResearchConfig } from './types';

export type V3BacktestRangeMode = 'recent' | 'previous-192' | 'custom';

export interface V3BacktestOptions {
  algorithmId: ResearchAlgorithmId;
  rounds: number;
  rangeMode: V3BacktestRangeMode;
  startRound: number | null;
  endRound: number | null;
  config: Partial<ResearchConfig>;
  randomBaselineIterations: number;
  resultBootstrapIterations: number;
}

export interface CandidateHitSummary {
  candidateSize: CandidateSize;
  distribution: readonly number[];
  meanHit: number;
  medianHit: number;
  hitAtLeast3Rate: number;
  hitAtLeast4Rate: number;
  hitAtLeast5Rate: number;
  hit6Rate: number;
  candidateRecall: number;
  candidatePrecision: number;
  confidenceInterval: readonly [number, number];
  randomMeanHit: number;
  randomHitDistribution: readonly number[];
  randomConfidenceInterval: readonly [number, number];
  randomPercentile: number;
  lift: number;
  absoluteLift: number;
}

export interface V3BacktestRoundResult {
  round: number;
  hits: Record<CandidateSize, number>;
}

export interface V3BacktestResult {
  metricSchemaVersion: 3;
  generatedAt: string;
  dataAsOfRound: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  options: V3BacktestOptions;
  summaries: readonly CandidateHitSummary[];
  rounds: readonly V3BacktestRoundResult[];
  verdict: 'above-random' | 'indistinguishable' | 'below-random';
  verdictMessage: string;
}

export interface V3ResolvedBacktestRange {
  startHistoryIndex: number;
  endHistoryIndex: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
}

const MINIMUM_HISTORY = 60;
const DEFAULT_OPTIONS: V3BacktestOptions = {
  algorithmId: 'random-baseline',
  rounds: 96,
  rangeMode: 'recent',
  startRound: null,
  endRound: null,
  config: {
    sampleSize: 100_000,
    nullSampleSize: 10_000,
    bootstrapIterations: 0,
    permutationIterations: 0,
  },
  randomBaselineIterations: 10_000,
  resultBootstrapIterations: 1_000,
};

export function resolveV3BacktestRange(
  draws: readonly LottoDraw[],
  requested: Partial<V3BacktestOptions> = {},
): V3ResolvedBacktestRange {
  const options = resolveOptions(requested);
  if (draws.length <= MINIMUM_HISTORY) {
    throw new Error(
      `v3 Walk-forward 검증에는 최소 ${MINIMUM_HISTORY + 1}회가 필요해요.`,
    );
  }
  let startActualIndex: number;
  let endActualIndex: number;
  if (options.rangeMode === 'custom') {
    if (options.startRound === null || options.endRound === null) {
      throw new Error('사용자 지정 구간의 시작 회차와 종료 회차가 필요해요.');
    }
    if (options.startRound > options.endRound) {
      throw new Error('시작 회차는 종료 회차보다 클 수 없어요.');
    }
    startActualIndex = draws.findIndex(({ round }) => round === options.startRound);
    endActualIndex = draws.findIndex(({ round }) => round === options.endRound);
    if (startActualIndex < 0 || endActualIndex < 0) {
      throw new Error('선택한 회차의 데이터가 없어요.');
    }
  } else {
    endActualIndex =
      options.rangeMode === 'previous-192'
        ? draws.length - options.rounds - 1
        : draws.length - 1;
    startActualIndex = endActualIndex - options.rounds + 1;
  }
  if (startActualIndex < MINIMUM_HISTORY) {
    throw new Error(
      `검증 시작 전에 ${MINIMUM_HISTORY}회 이상의 학습 데이터가 필요해요.`,
    );
  }
  if (endActualIndex < startActualIndex) {
    throw new Error('검증할 회차 범위가 비어 있어요.');
  }
  return {
    startHistoryIndex: startActualIndex - 1,
    endHistoryIndex: endActualIndex - 1,
    startRound: draws[startActualIndex]!.round,
    endRound: draws[endActualIndex]!.round,
    evaluatedRounds: endActualIndex - startActualIndex + 1,
  };
}

export function runV3WalkForwardBacktest(
  draws: readonly LottoDraw[],
  requested: Partial<V3BacktestOptions> = {},
  onProgress?: (completed: number, total: number, round: number) => void,
): V3BacktestResult {
  const options = resolveOptions(requested);
  const range = resolveV3BacktestRange(draws, options);
  const fastConfig = sanitizeResearchConfig({
    ...options.config,
    bootstrapIterations: 0,
    permutationIterations: 0,
  });
  const rounds: V3BacktestRoundResult[] = [];
  for (
    let historyIndex = range.startHistoryIndex;
    historyIndex <= range.endHistoryIndex;
    historyIndex += 1
  ) {
    const actual = draws[historyIndex + 1]!;
    const prediction = predictNextCandidates(
      draws,
      historyIndex,
      options.algorithmId,
      fastConfig,
    );
    const hits = Object.fromEntries(
      prediction.candidateSets.map(({ size, numbers }) => [
        size,
        intersectionSize(numbers, actual.numbers),
      ]),
    ) as Record<CandidateSize, number>;
    rounds.push({ round: actual.round, hits });
    onProgress?.(rounds.length, range.evaluatedRounds, actual.round);
  }
  const summaries = CANDIDATE_SIZES.map((candidateSize) =>
    summarizeCandidateSize(
      candidateSize,
      rounds.map(({ hits }) => hits[candidateSize]),
      rounds.map(({ round }) => draws.find((draw) => draw.round === round)!.numbers),
      options,
    ),
  );
  const relevant = summaries.filter(({ candidateSize }) => candidateSize >= 15);
  const clearlyAbove = relevant.filter(
    ({ confidenceInterval, randomMeanHit }) => confidenceInterval[0] > randomMeanHit,
  ).length;
  const clearlyBelow = relevant.filter(
    ({ confidenceInterval, randomMeanHit }) => confidenceInterval[1] < randomMeanHit,
  ).length;
  const verdict =
    clearlyAbove >= 3
      ? 'above-random'
      : clearlyBelow >= 3
        ? 'below-random'
        : 'indistinguishable';
  const verdictMessage =
    verdict === 'above-random'
      ? '여러 Candidate@K에서 평균 적중 신뢰구간이 무작위 평균보다 높아요.'
      : verdict === 'below-random'
        ? '여러 Candidate@K에서 평균 적중 신뢰구간이 무작위 평균보다 낮아요.'
        : '현재 구간에서는 Random Baseline과 구분되는 안정적 성능을 확인하지 못했어요.';
  return {
    metricSchemaVersion: 3,
    generatedAt: new Date().toISOString(),
    dataAsOfRound: draws.at(-1)?.round ?? 0,
    startRound: range.startRound,
    endRound: range.endRound,
    evaluatedRounds: range.evaluatedRounds,
    options,
    summaries,
    rounds,
    verdict,
    verdictMessage,
  };
}

function summarizeCandidateSize(
  candidateSize: CandidateSize,
  hits: readonly number[],
  actuals: readonly (readonly number[])[],
  options: V3BacktestOptions,
): CandidateHitSummary {
  const distribution = hitDistribution(hits);
  const meanHit = average(hits);
  const sorted = [...hits].sort((left, right) => left - right);
  const bootstrap = bootstrapMeans(
    hits,
    options.resultBootstrapIterations,
    mixSeed(options.config.seed ?? 0, candidateSize, 0xb00757),
  );
  const baseline = simulateRandomBaseline(
    candidateSize,
    actuals,
    options.randomBaselineIterations,
    mixSeed(options.config.seed ?? 0, candidateSize, 0xba5e11),
  );
  const rate = (minimum: number) =>
    distribution.slice(minimum).reduce((sum, count) => sum + count, 0) /
    Math.max(hits.length, 1);
  return {
    candidateSize,
    distribution,
    meanHit,
    medianHit: quantile(sorted, 0.5),
    hitAtLeast3Rate: rate(3),
    hitAtLeast4Rate: rate(4),
    hitAtLeast5Rate: rate(5),
    hit6Rate: rate(6),
    candidateRecall: meanHit / 6,
    candidatePrecision: meanHit / candidateSize,
    confidenceInterval: [quantile(bootstrap, 0.025), quantile(bootstrap, 0.975)],
    randomMeanHit: baseline.meanHit,
    randomHitDistribution: baseline.hitDistribution,
    randomConfidenceInterval: baseline.confidenceInterval,
    randomPercentile:
      baseline.means.filter((value) => value <= meanHit).length /
      Math.max(baseline.means.length, 1),
    lift: baseline.meanHit === 0 ? 0 : meanHit / baseline.meanHit,
    absoluteLift: meanHit - baseline.meanHit,
  };
}

function simulateRandomBaseline(
  candidateSize: CandidateSize,
  actuals: readonly (readonly number[])[],
  iterations: number,
  seed: number,
): {
  meanHit: number;
  hitDistribution: readonly number[];
  confidenceInterval: readonly [number, number];
  means: readonly number[];
} {
  const random = createRandom(seed);
  const allHits: number[] = [];
  const means = Array.from({ length: iterations }, () => {
    const iterationHits = actuals.map((actual) => {
      const candidate = sampleNumberSet(candidateSize, random);
      const hit = intersectionSize(candidate, actual);
      allHits.push(hit);
      return hit;
    });
    return average(iterationHits);
  }).sort((left, right) => left - right);
  return {
    meanHit: average(means),
    hitDistribution: hitDistribution(allHits).map(
      (count) => count / Math.max(allHits.length, 1),
    ),
    confidenceInterval: [quantile(means, 0.025), quantile(means, 0.975)],
    means,
  };
}

function sampleNumberSet(
  size: number,
  random: ReturnType<typeof createRandom>,
): number[] {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = 0; index < size; index += 1) {
    const selected = index + random.integer(45 - index);
    [pool[index], pool[selected]] = [pool[selected]!, pool[index]!];
  }
  return pool.slice(0, size);
}

function bootstrapMeans(
  values: readonly number[],
  iterations: number,
  seed: number,
): number[] {
  if (iterations <= 0) return [average(values)];
  const random = createRandom(seed);
  return Array.from({ length: iterations }, () => {
    let total = 0;
    for (let index = 0; index < values.length; index += 1) {
      total += values[random.integer(values.length)]!;
    }
    return total / values.length;
  }).sort((left, right) => left - right);
}

function hitDistribution(values: readonly number[]): number[] {
  const distribution = Array(7).fill(0) as number[];
  values.forEach((value) => {
    const hit = Math.min(Math.max(Math.trunc(value), 0), 6);
    distribution[hit] = distribution[hit]! + 1;
  });
  return distribution;
}

function intersectionSize(
  candidates: readonly number[],
  actual: readonly number[],
): number {
  const candidateSet = new Set(candidates);
  return actual.filter((number) => candidateSet.has(number)).length;
}

function resolveOptions(requested: Partial<V3BacktestOptions>): V3BacktestOptions {
  const merged = { ...DEFAULT_OPTIONS, ...requested };
  return {
    ...merged,
    rounds:
      merged.rangeMode === 'previous-192'
        ? 192
        : Math.min(Math.max(Math.trunc(merged.rounds), 1), 384),
    config: sanitizeResearchConfig({
      ...DEFAULT_OPTIONS.config,
      ...requested.config,
    }),
    randomBaselineIterations: Math.min(
      Math.max(Math.trunc(merged.randomBaselineIterations), 100),
      50_000,
    ),
    resultBootstrapIterations: Math.min(
      Math.max(Math.trunc(merged.resultBootstrapIterations), 100),
      10_000,
    ),
  };
}
