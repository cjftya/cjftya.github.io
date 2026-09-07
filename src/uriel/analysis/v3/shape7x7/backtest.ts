import type { LottoDraw } from '../../../types';
import type { V3BacktestOptions, V3BacktestResult, GameHitSummary } from '../backtest';
import type { GameCount } from '../types';
import { GAME_COUNTS, sanitizeResearchConfig } from '../types';
import { average, quantile } from '../statistics';
import { createRandom, mixSeed } from '../random';
import { resolveShapeConfig, SHAPE_VERSION } from './config';
import { buildShapeHistory, forecastDistance, forecastShape } from './predictor';
import { generateShapeGames, randomShapeGames } from './candidates';
import {
  blockMeanInterval,
  measurePortfolio,
  temporalMeans,
  type PortfolioMetrics,
} from './evaluation';

export interface ShapeRoundResult {
  round: number;
  trainedThrough: number;
  metrics: Record<GameCount, PortfolioMetrics>;
  random: Record<GameCount, PortfolioMetrics>;
  shapeDistance: number;
  unconditionalShapeDistance: number;
}

export interface ShapePortfolioSummary {
  gameCount: GameCount;
  recall: number;
  randomRecall: number;
  recallInterval: readonly [number, number];
  meanUnionSize: number;
  randomUnionSize: number;
  coverageAdjustedHits: number;
  adjustedInterval: readonly [number, number];
  meanGameHit: number;
  meanOverlap: number;
  diversity: number;
  temporalAdjustedHits: readonly number[];
}

export interface ShapeBacktestDiagnostics {
  version: string;
  status: 'no-signal';
  nullHistories: number;
  note: string;
  signatureDimensions: number;
  shapeDistance: number;
  unconditionalShapeDistance: number;
  portfolios: readonly ShapePortfolioSummary[];
  rounds: readonly ShapeRoundResult[];
}

export function runShapeBacktest(
  draws: readonly LottoDraw[],
  options: V3BacktestOptions,
  range: {
    startHistoryIndex: number;
    endHistoryIndex: number;
    evaluatedRounds: number;
    startRound: number;
    endRound: number;
  },
  onProgress?: (completed: number, total: number, round: number) => void,
): V3BacktestResult {
  const config = sanitizeResearchConfig(options.config);
  const shapeConfig = resolveShapeConfig(config.shape);
  config.shape = shapeConfig;
  config.coordinateSystem = 'board';
  const history = buildShapeHistory(
    draws.slice(0, range.endHistoryIndex + 2),
    shapeConfig.metric,
  );
  const rows: ShapeRoundResult[] = [];
  const randomHits: Record<GameCount, number[]> = { 5: [], 10: [], 30: [] };
  // Each fold uses an independent candidate stream and fresh equal-diversity random portfolios.
  for (let index = range.startHistoryIndex; index <= range.endHistoryIndex; index++) {
    const actual = draws[index + 1]!;
    const forecast = forecastShape(history.slice(0, index + 1), shapeConfig);
    const generated = generateShapeGames(
      forecast,
      config.sampleSize,
      mixSeed(config.seed, draws[index]!.round, 6),
      config.topFraction,
    );
    const metrics = Object.fromEntries(
      generated.gameSets.map((set) => [
        set.count,
        measurePortfolio(set.games, actual.numbers),
      ]),
    ) as Record<GameCount, PortfolioMetrics>;
    const randomSamples: Record<GameCount, PortfolioMetrics[]> = {
      5: [],
      10: [],
      30: [],
    };
    for (let iteration = 0; iteration < options.randomBaselineIterations; iteration++) {
      const games = randomShapeGames(
        30,
        mixSeed(config.seed, actual.round, iteration, 0xba5e),
        shapeConfig.maxOverlap,
      );
      for (const count of GAME_COUNTS) {
        const measured = measurePortfolio(games.slice(0, count), actual.numbers);
        randomSamples[count].push(measured);
        randomHits[count].push(measured.bestHit);
      }
    }
    const random = Object.fromEntries(
      GAME_COUNTS.map((count) => [count, averageMetrics(randomSamples[count])]),
    ) as Record<GameCount, PortfolioMetrics>;
    rows.push({
      round: actual.round,
      trainedThrough: forecast.trainedThrough,
      metrics,
      random,
      shapeDistance: forecastDistance(history[index + 1]!.signature, forecast),
      unconditionalShapeDistance: forecastDistance(
        history[index + 1]!.signature,
        forecast,
        true,
      ),
    });
    onProgress?.(rows.length, range.evaluatedRounds, actual.round);
  }
  const portfolios = GAME_COUNTS.map((gameCount): ShapePortfolioSummary => {
    const values = rows.map((row) => row.metrics[gameCount]),
      baseline = rows.map((row) => row.random[gameCount]);
    return {
      gameCount,
      recall: average(values.map((v) => v.recall)),
      randomRecall: average(baseline.map((v) => v.recall)),
      recallInterval: blockMeanInterval(
        values.map((v) => v.recall),
        options.resultBootstrapIterations,
        mixSeed(config.seed, gameCount, 1),
      ),
      meanUnionSize: average(values.map((v) => v.unionSize)),
      randomUnionSize: average(baseline.map((v) => v.unionSize)),
      coverageAdjustedHits: average(values.map((v) => v.coverageAdjustedHits)),
      adjustedInterval: blockMeanInterval(
        values.map((v) => v.coverageAdjustedHits),
        options.resultBootstrapIterations,
        mixSeed(config.seed, gameCount, 2),
      ),
      meanGameHit: average(values.map((v) => v.meanGameHit)),
      meanOverlap: average(values.map((v) => v.meanOverlap)),
      diversity: average(values.map((v) => v.diversity)),
      temporalAdjustedHits: temporalMeans(values.map((v) => v.coverageAdjustedHits)),
    };
  });
  const summaries = GAME_COUNTS.map((gameCount): GameHitSummary => {
    const hits = rows.map((row) => row.metrics[gameCount].bestHit),
      random = rows.map((row) => row.random[gameCount].bestHit);
    const distribution = Array.from(
      { length: 7 },
      (_, hit) => hits.filter((h) => h === hit).length,
    );
    const meanHit = average(hits),
      randomMeanHit = average(random);
    const rate = (min: number) => hits.filter((hit) => hit >= min).length / hits.length;
    const nullMeans = simulatedMeans(
      randomHits[gameCount],
      rows.length,
      options.resultBootstrapIterations,
      mixSeed(config.seed, gameCount, 3),
    );
    return {
      gameCount,
      distribution,
      meanHit,
      randomMeanHit,
      medianHit: quantile(
        [...hits].sort((a, b) => a - b),
        0.5,
      ),
      hitAtLeast3Rate: rate(3),
      hitAtLeast4Rate: rate(4),
      hitAtLeast5Rate: rate(5),
      hit6Rate: rate(6),
      confidenceInterval: blockMeanInterval(
        hits,
        options.resultBootstrapIterations,
        mixSeed(config.seed, gameCount, 4),
      ),
      randomHitDistribution: Array.from(
        { length: 7 },
        (_, hit) =>
          randomHits[gameCount].filter((h) => h === hit).length /
          randomHits[gameCount].length,
      ),
      randomConfidenceInterval: [
        quantile(nullMeans, 0.025),
        quantile(nullMeans, 0.975),
      ],
      randomPercentile: nullMeans.filter((v) => v < meanHit).length / nullMeans.length,
      lift: meanHit / randomMeanHit,
      absoluteLift: meanHit - randomMeanHit,
    };
  });
  return {
    metricSchemaVersion: 4,
    generatedAt: new Date().toISOString(),
    dataAsOfRound: draws.at(-1)!.round,
    startRound: range.startRound,
    endRound: range.endRound,
    evaluatedRounds: rows.length,
    signalRounds: 0,
    options: { ...options, config },
    summaries,
    rounds: rows.map((row) => ({
      round: row.round,
      selectedFeatureCount: 0,
      bestHits: Object.fromEntries(
        GAME_COUNTS.map((count) => [count, row.metrics[count].bestHit]),
      ) as Record<GameCount, number>,
    })),
    verdict: 'indistinguishable',
    verdictMessage:
      'NO SIGNAL · 이 화면은 탐색적 walk-forward 결과예요. 전체 랜덤 이력 재학습 검증과 독립 holdout 없이 신호로 승격하지 않아요.',
    shape: {
      version: SHAPE_VERSION,
      status: 'no-signal',
      nullHistories: 0,
      note: '동일 게임 수·중복 상한 랜덤 비교. 랜덤 이력 전체 파이프라인 검증은 별도 연구 명령으로 실행해요.',
      signatureDimensions: history[0]!.signature.length,
      shapeDistance: average(rows.map((r) => r.shapeDistance)),
      unconditionalShapeDistance: average(
        rows.map((r) => r.unconditionalShapeDistance),
      ),
      portfolios,
      rounds: rows,
    },
  };
}

function averageMetrics(values: readonly PortfolioMetrics[]): PortfolioMetrics {
  return Object.fromEntries(
    Object.keys(values[0]!).map((key) => [
      key,
      average(values.map((value) => value[key as keyof PortfolioMetrics])),
    ]),
  ) as unknown as PortfolioMetrics;
}

function simulatedMeans(
  values: readonly number[],
  rounds: number,
  iterations: number,
  seed: number,
): number[] {
  const random = createRandom(seed);
  return Array.from({ length: iterations }, () => {
    let sum = 0;
    for (let i = 0; i < rounds; i++) sum += values[random.integer(values.length)]!;
    return sum / rounds;
  }).sort((a, b) => a - b);
}
