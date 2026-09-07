import type { LottoDraw } from '../../../types';
import { createRandom, mixSeed, sampleCombination } from '../random';
import { average, quantile } from '../statistics';
import { GAME_COUNTS, type GameCount } from '../types';
import { resolveShapeConfig, SHAPE_VERSION, type ShapeConfig } from './config';
import { buildShapeHistory, forecastDistance, forecastShape } from './predictor';
import { generateShapeGames, sampleShapeSpace, type ShapeSample } from './candidates';
import {
  blockMeanInterval,
  holmCorrection,
  measurePortfolio,
  temporalMeans,
  upperTailPValue,
} from './evaluation';

export interface ShapeStudyConfig {
  seed: number;
  sampleSize: number;
  topFraction: number;
  rounds: number;
  nullHistories: number;
  bootstrapIterations: number;
  shape: ShapeConfig;
  nullKind: 'synthetic' | 'shuffled';
}

export const DEFAULT_SHAPE_STUDY: ShapeStudyConfig = {
  seed: 20_260_905,
  sampleSize: 1_000,
  topFraction: 0.25,
  rounds: 96,
  nullHistories: 1_000,
  bootstrapIterations: 1_000,
  shape: resolveShapeConfig({ trainingWindow: 120 }),
  nullKind: 'synthetic',
};

interface StudyTrajectory {
  /** Seven prespecified tests: 3 coverage-adjusted hits, 3 best hits, 1 forecast gain. */
  series: number[][];
  recall: Record<GameCount, number[]>;
  unionSize: Record<GameCount, number[]>;
  unconditionalBestHit: Record<GameCount, number[]>;
  rawShapeDistance: number[];
  unconditionalShapeDistance: number[];
}

export interface ShapeStudyEndpoint {
  name: string;
  observed: number;
  nullMean: number;
  nullInterval: readonly [number, number];
  differenceInterval: readonly [number, number];
  pValue: number;
  adjustedPValue: number;
  percentile: number;
  standardizedEffect: number;
  temporalExcess: readonly number[];
  validationExcess: number;
  holdoutExcess: number;
}

/** Entire learner + selection is rerun for every null history, not just random labels at the end. */
export function runShapeNullStudy(
  draws: readonly LottoDraw[],
  requested: Partial<ShapeStudyConfig> = {},
  onProgress?: (completed: number, total: number) => void,
) {
  const config = {
    ...DEFAULT_SHAPE_STUDY,
    ...requested,
    shape: resolveShapeConfig(requested.shape ?? DEFAULT_SHAPE_STUDY.shape),
  };
  validateStudy(config, draws.length);
  const startedAt = new Date().toISOString();
  // A history-independent Monte Carlo bank is fixed for ALL observed/null folds.
  // This conditions the test on approximation noise and avoids unequal computation budgets.
  const samples = [
    ...sampleShapeSpace(
      config.sampleSize,
      mixSeed(config.seed, 0xcad),
      config.shape.metric,
    ),
  ];
  const observed = trajectory(draws, config, samples, true);
  const nullValues: number[][] = Array.from({ length: 7 }, () => []);
  for (let iteration = 0; iteration < config.nullHistories; iteration++) {
    const random = createRandom(mixSeed(config.seed, iteration, 0x7157));
    let synthetic: LottoDraw[];
    if (config.nullKind === 'shuffled') {
      const shuffled = draws.map((draw) => draw.numbers);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = random.integer(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
      }
      synthetic = draws.map((draw, i) => ({ ...draw, numbers: shuffled[i]! }));
    } else
      synthetic = draws.map((draw) => ({
        ...draw,
        numbers: sampleCombination(random),
      }));
    const simulated = trajectory(synthetic, config, samples, false);
    simulated.series.forEach((values, f) => nullValues[f]!.push(average(values)));
    onProgress?.(iteration + 1, config.nullHistories);
  }
  const rawP = observed.series.map((series, f) =>
    upperTailPValue(average(series), nullValues[f]!),
  );
  const adjusted = holmCorrection(rawP);
  const names = [
    ...GAME_COUNTS.map((k) => `coverage_adjusted_hit@${k}`),
    ...GAME_COUNTS.map((k) => `best_hit@${k}`),
    'shape_forecast_gain',
  ];
  const endpoints = observed.series.map((series, f): ShapeStudyEndpoint => {
    const value = average(series),
      simulated = nullValues[f]!,
      baseline = average(simulated);
    const sorted = [...simulated].sort((a, b) => a - b);
    const deviation = Math.sqrt(average(simulated.map((v) => (v - baseline) ** 2)));
    return {
      name: names[f]!,
      observed: value,
      nullMean: baseline,
      nullInterval: [quantile(sorted, 0.025), quantile(sorted, 0.975)],
      differenceInterval: blockMeanInterval(
        series.map((v) => v - baseline),
        config.bootstrapIterations,
        mixSeed(config.seed, f, 0xb007),
      ),
      pValue: rawP[f]!,
      adjustedPValue: adjusted[f]!,
      percentile: simulated.filter((v) => v < value).length / simulated.length,
      standardizedEffect: deviation === 0 ? 0 : (value - baseline) / deviation,
      temporalExcess: temporalMeans(series).map((v) => v - baseline),
      validationExcess:
        average(series.slice(0, Math.floor(series.length / 2))) - baseline,
      holdoutExcess: average(series.slice(Math.floor(series.length / 2))) - baseline,
    };
  });
  const qualified = endpoints.filter(
    (e) =>
      e.adjustedPValue <= 0.05 &&
      e.differenceInterval[0] > 0 &&
      e.temporalExcess.every((v) => v > 0) &&
      e.validationExcess > 0 &&
      e.holdoutExcess > 0,
  );
  // Historical data has already been inspected in Uriel. Even a positive result is exploratory.
  const signal =
    config.nullHistories >= 1_000 &&
    config.rounds >= 60 &&
    qualified.some((e) => e.name !== 'shape_forecast_gain')
      ? 'weak-signal'
      : 'no-signal';
  return {
    schemaVersion: 1,
    modelVersion: SHAPE_VERSION,
    startedAt,
    completedAt: new Date().toISOString(),
    config,
    dataRange: { from: draws[0]!.round, to: draws.at(-1)!.round },
    evaluationRange: {
      from: draws[draws.length - config.rounds]!.round,
      to: draws.at(-1)!.round,
    },
    validationEndRound:
      draws[draws.length - config.rounds + Math.floor(config.rounds / 2) - 1]!.round,
    signal,
    qualifiedEndpoints: qualified.map((e) => e.name),
    endpoints,
    portfolios: GAME_COUNTS.map((count, i) => ({
      count,
      recall: average(observed.recall[count]),
      meanUnionSize: average(observed.unionSize[count]),
      matchedUnionRandomRecall: average(observed.unionSize[count]) / 45,
      meanBestHit: average(observed.series[i + 3]!),
      unconditionalMeanBestHit: average(observed.unconditionalBestHit[count]),
    })),
    meanShapeDistance: average(observed.rawShapeDistance),
    unconditionalMeanShapeDistance: average(observed.unconditionalShapeDistance),
    limitations: [
      'Exploratory historical validation/holdout split; not an untouched prospective holdout. No potential/strong-signal promotion.',
      'Null and observed use the same sample budget and fixed history-independent candidate bank; not comparable to a different sample-size run.',
      'Seven within-study endpoints use Holm correction. Further models, seeds, layouts and studies need cross-study multiplicity control.',
      'Bootstrap difference intervals condition on the simulated null mean; null mean Monte Carlo uncertainty is not included.',
      'Core v1 graph connectivity is not persistent homology. Geometry/empty space/family Markov models are deferred.',
    ],
    nullDistributions: nullValues,
  };
}

function trajectory(
  draws: readonly LottoDraw[],
  config: ShapeStudyConfig,
  samples: readonly ShapeSample[],
  control: boolean,
): StudyTrajectory {
  const start = draws.length - config.rounds;
  const from =
    config.shape.trainingWindow > 0
      ? Math.max(0, start - config.shape.trainingWindow)
      : 0;
  const relevant = draws.slice(from);
  const history = buildShapeHistory(relevant, config.shape.metric);
  const result: StudyTrajectory = {
    series: Array.from({ length: 7 }, () => []),
    recall: { 5: [], 10: [], 30: [] },
    unionSize: { 5: [], 10: [], 30: [] },
    unconditionalBestHit: { 5: [], 10: [], 30: [] },
    rawShapeDistance: [],
    unconditionalShapeDistance: [],
  };
  for (let index = start - from; index < relevant.length; index++) {
    const forecast = forecastShape(history.slice(0, index), config.shape);
    const generated = generateShapeGames(
      forecast,
      config.sampleSize,
      config.seed,
      config.topFraction,
      samples,
    );
    const unconditional = control
      ? generateShapeGames(
          forecast,
          config.sampleSize,
          config.seed,
          config.topFraction,
          samples,
          true,
        )
      : null;
    generated.gameSets.forEach((set, i) => {
      const measured = measurePortfolio(set.games, relevant[index]!.numbers);
      result.series[i]!.push(measured.coverageAdjustedHits);
      result.series[i + 3]!.push(measured.bestHit);
      result.recall[set.count].push(measured.recall);
      result.unionSize[set.count].push(measured.unionSize);
      if (unconditional)
        result.unconditionalBestHit[set.count].push(
          measurePortfolio(unconditional.gameSets[i]!.games, relevant[index]!.numbers)
            .bestHit,
        );
    });
    const distance = forecastDistance(history[index]!.signature, forecast);
    const unconditionalDistance = forecastDistance(
      history[index]!.signature,
      forecast,
      true,
    );
    result.series[6]!.push(unconditionalDistance - distance);
    result.rawShapeDistance.push(distance);
    result.unconditionalShapeDistance.push(unconditionalDistance);
  }
  return result;
}

function validateStudy(config: ShapeStudyConfig, historySize: number): void {
  if (
    ![
      config.rounds,
      config.sampleSize,
      config.nullHistories,
      config.bootstrapIterations,
      config.seed,
    ].every(Number.isInteger) ||
    config.rounds < 6 ||
    config.rounds > historySize - 60 ||
    config.sampleSize < 1_000 ||
    config.sampleSize > 100_000 ||
    config.nullHistories < 1 ||
    config.nullHistories > 10_000 ||
    config.bootstrapIterations < 100 ||
    config.bootstrapIterations > 10_000 ||
    !Number.isFinite(config.topFraction) ||
    config.topFraction < 0.001 ||
    config.topFraction > 0.25 ||
    !['synthetic', 'shuffled'].includes(config.nullKind)
  ) {
    throw new Error(
      'Shape 연구 설정 범위를 확인해 주세요. 연구 표본은 1K~100K, null 이력은 1~10,000개예요.',
    );
  }
}
