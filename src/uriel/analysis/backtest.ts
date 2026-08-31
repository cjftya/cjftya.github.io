import type { AlgorithmId, LayoutMode, LottoDraw } from '../types';
import { runAlgorithm } from './algorithmRunner';
import { buildAlgorithmPurchasePortfolio } from './purchase';

export type BacktestRangeMode = 'recent' | 'previous-192' | 'custom';

export interface BacktestOptions {
  algorithmId: AlgorithmId;
  layout: LayoutMode;
  rounds: number;
  rangeMode: BacktestRangeMode;
  startRound: number | null;
  endRound: number | null;
}

export interface HitSummary {
  label: string;
  distribution: readonly number[];
  averageMaxHit: number;
  threePlusRate: number;
  fourPlusRate: number;
  fivePlusRate: number;
  sixRate: number;
}

export interface CandidateCountSummary extends HitSummary {
  candidateCount: number;
}

export interface BacktestRoundResult {
  round: number;
  candidateMaxHits: Record<number, number>;
  purchaseMaxHit: number;
}

export interface BacktestResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  dataAsOfRound: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  options: BacktestOptions;
  candidates: readonly CandidateCountSummary[];
  purchase: HitSummary;
  rounds: readonly BacktestRoundResult[];
  bottleneck: 'candidate-ranking' | 'purchase-compression' | 'balanced';
  bottleneckMessage: string;
}

export interface ResolvedBacktestRoundRange {
  startHistoryIndex: number;
  endHistoryIndex: number;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
}

const CANDIDATE_COUNTS = [6, 12, 24, 50, 100] as const;
const MINIMUM_HISTORY = 24;
const DEFAULT_OPTIONS: BacktestOptions = {
  algorithmId: 'baseline',
  layout: 'circle',
  rounds: 96,
  rangeMode: 'recent',
  startRound: null,
  endRound: null,
};

export function resolveBacktestRoundRange(
  draws: readonly LottoDraw[],
  requested: Partial<BacktestOptions> = {},
): ResolvedBacktestRoundRange {
  const options = sanitizeOptions({ ...DEFAULT_OPTIONS, ...requested });
  if (draws.length <= MINIMUM_HISTORY) {
    throw new Error(`Walk-forward 검증에는 최소 ${MINIMUM_HISTORY + 1}회가 필요해요.`);
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
  if (startActualIndex <= MINIMUM_HISTORY - 1) {
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

export function runWalkForwardBacktest(
  draws: readonly LottoDraw[],
  requested: Partial<BacktestOptions> = {},
  onProgress?: (completed: number, total: number, round: number) => void,
): BacktestResult {
  const options = sanitizeOptions({ ...DEFAULT_OPTIONS, ...requested });
  const range = resolveBacktestRoundRange(draws, options);
  const rounds: BacktestRoundResult[] = [];

  for (
    let historyIndex = range.startHistoryIndex;
    historyIndex <= range.endHistoryIndex;
    historyIndex += 1
  ) {
    const actual = draws[historyIndex + 1]!;
    const prediction = runAlgorithm(
      options.algorithmId,
      draws,
      historyIndex,
      options.layout,
      100,
    );
    const candidateMaxHits = Object.fromEntries(
      CANDIDATE_COUNTS.map((count) => [
        count,
        maximumMatch(prediction.candidates.slice(0, count), actual.numbers),
      ]),
    ) as Record<number, number>;
    const purchase = buildAlgorithmPurchasePortfolio(
      options.algorithmId,
      prediction.candidates,
      prediction.layout,
    );
    rounds.push({
      round: actual.round,
      candidateMaxHits,
      purchaseMaxHit: maximumMatch(purchase.games, actual.numbers),
    });
    onProgress?.(rounds.length, range.evaluatedRounds, actual.round);
  }

  const candidates = CANDIDATE_COUNTS.map((candidateCount) => ({
    candidateCount,
    ...summarize(
      `후보 ${candidateCount}개`,
      rounds.map(({ candidateMaxHits }) => candidateMaxHits[candidateCount] ?? 0),
    ),
  }));
  const purchase = summarize(
    '구매 10게임',
    rounds.map(({ purchaseMaxHit }) => purchaseMaxHit),
  );
  const candidateAverage = candidates.at(-1)?.averageMaxHit ?? 0;
  const loss = candidateAverage - purchase.averageMaxHit;
  const bottleneck =
    candidateAverage < 3
      ? 'candidate-ranking'
      : loss > 0.35
        ? 'purchase-compression'
        : 'balanced';
  const bottleneckMessage =
    bottleneck === 'candidate-ranking'
      ? '후보 100개의 실제 번호 포착력이 먼저 개선되어야 해요.'
      : bottleneck === 'purchase-compression'
        ? '후보 100개에서 구매 10게임으로 줄이는 과정의 손실이 커요.'
        : '후보 순위와 구매 압축의 손실이 비슷한 수준이에요.';

  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dataAsOfRound: draws.at(-1)?.round ?? 0,
    startRound: range.startRound,
    endRound: range.endRound,
    evaluatedRounds: range.evaluatedRounds,
    options,
    candidates,
    purchase,
    rounds,
    bottleneck,
    bottleneckMessage,
  };
}

function sanitizeOptions(options: BacktestOptions): BacktestOptions {
  const rounds =
    options.rangeMode === 'previous-192'
      ? 192
      : Math.max(1, Math.min(Math.trunc(options.rounds), 384));
  return { ...options, rounds };
}

function summarize(label: string, values: readonly number[]): HitSummary {
  const distribution = Array(7).fill(0) as number[];
  values.forEach((value) => {
    const index = Math.min(Math.max(value, 0), 6);
    distribution[index] = (distribution[index] ?? 0) + 1;
  });
  const total = Math.max(values.length, 1);
  const rate = (minimum: number) =>
    distribution.slice(minimum).reduce((sum, count) => sum + count, 0) / total;
  return {
    label,
    distribution,
    averageMaxHit: values.reduce((sum, value) => sum + value, 0) / total,
    threePlusRate: rate(3),
    fourPlusRate: rate(4),
    fivePlusRate: rate(5),
    sixRate: rate(6),
  };
}

function maximumMatch(
  candidates: readonly { numbers: readonly number[] }[],
  actualNumbers: readonly number[],
): number {
  return candidates.reduce(
    (maximum, candidate) =>
      Math.max(
        maximum,
        candidate.numbers.filter((number) => actualNumbers.includes(number)).length,
      ),
    0,
  );
}
