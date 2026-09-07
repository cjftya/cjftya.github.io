import type { LayoutMode, LottoDraw } from '../../types';
import type { ShapeConfig } from './shape7x7/config';
import type { ShapeForecast } from './shape7x7/predictor';
import type {
  V3BacktestOptions,
  V3BacktestResult,
  V3ResolvedBacktestRange,
} from './backtest';

export const GAME_COUNTS = [5, 10, 30] as const;
export type GameCount = (typeof GAME_COUNTS)[number];

export const SAMPLE_SIZES = [100_000, 500_000, 1_000_000, 2_000_000] as const;
export type MonteCarloSampleSize = (typeof SAMPLE_SIZES)[number];

export type ResearchAlgorithmId =
  | 'random-baseline'
  | 'distance'
  | 'distribution'
  | 'geometry'
  | 'contrastive-ensemble'
  | 'shape-7x7';

export type CoreRepresentationId = 'distance' | 'distribution' | 'geometry';
export type AdvancedRepresentationId = 'graph' | 'topology' | 'experimental';
export type RepresentationId = CoreRepresentationId | AdvancedRepresentationId;
export type CoordinateSystemId = LayoutMode;

export interface CombinationFeatureVector {
  representation: RepresentationId;
  names: readonly string[];
  values: readonly number[];
}

export interface ResearchConfig {
  shape?: Partial<ShapeConfig>;
  seed: number;
  sampleSize: number;
  nullSampleSize: number;
  topFraction: number;
  coordinateSystem: CoordinateSystemId;
  bootstrapIterations: number;
  permutationIterations: number;
}

export interface DatasetPartition {
  discovery: readonly LottoDraw[];
  validation: readonly LottoDraw[];
  holdout: readonly LottoDraw[];
}

export interface PartitionMetadata {
  discovery: number;
  validation: number;
  holdout: number;
}

export interface FeatureDiagnostic {
  representation: RepresentationId;
  name: string;
  winningMean: number;
  randomMean: number;
  effectSize: number;
  validationEffectSize: number;
  holdoutEffectSize: number;
  ksStatistic: number;
  wassersteinDistance: number;
  jensenShannonDivergence: number;
  permutationPValue: number;
  adjustedPValue: number;
  confidenceInterval: readonly [number, number];
  temporalEffects: readonly number[];
  temporalStability: number;
  selected: boolean;
  holdoutConfirmed: boolean;
}

export interface ModelDiagnostics {
  experimental?: {
    version: string;
    status: 'unvalidated';
    featureCount: number;
    forecast: ShapeForecast;
  };
  features: readonly FeatureDiagnostic[];
  selectedFeatureCount: number;
  partitions: PartitionMetadata;
  winningSamples: number;
  randomSamples: number;
}

export interface FittedCombinationModel {
  readonly id: ResearchAlgorithmId;
  readonly diagnostics: ModelDiagnostics;
  /** Structural similarity only. This is never a winning probability. */
  scoreCombination(numbers: readonly number[]): number;
  /** Optional algorithm-owned combination generator, independent of feature significance. */
  generateGames?(
    config: ResearchConfig,
    seed: number,
  ): {
    gameSets: readonly CandidateGameSet[];
    retainedCombinations: number;
  };
}

export interface CandidateAlgorithm {
  readonly id: ResearchAlgorithmId;
  fit(history: readonly LottoDraw[], config: ResearchConfig): FittedCombinationModel;
  backtest?(
    draws: readonly LottoDraw[],
    options: V3BacktestOptions,
    range: V3ResolvedBacktestRange,
    onProgress?: (completed: number, total: number, round: number) => void,
  ): V3BacktestResult;
}

export interface CandidateGame {
  numbers: readonly number[];
  /** Structural similarity only. This is never a winning probability. */
  structuralScore: number;
}

export interface CandidateGameSet {
  count: GameCount;
  games: readonly CandidateGame[];
}

export interface PredictionMetadata {
  algorithm: ResearchAlgorithmId;
  parameters: ResearchConfig;
  dataStartRound: number;
  dataEndRound: number;
  gameCounts: readonly GameCount[];
  randomSeed: number;
  sampleSize: number;
  retainedCombinations: number;
  executionDate: string;
  gitCommit: string | null;
}

export interface CandidatePrediction {
  algorithmId: ResearchAlgorithmId;
  gameSets: readonly CandidateGameSet[];
  diagnostics: ModelDiagnostics;
  metadata: PredictionMetadata;
}

export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  seed: 20_260_903,
  sampleSize: 100_000,
  nullSampleSize: 20_000,
  topFraction: 0.05,
  coordinateSystem: 'circle',
  bootstrapIterations: 200,
  permutationIterations: 200,
};

export function partitionHistory(history: readonly LottoDraw[]): DatasetPartition {
  if (history.length < 60) {
    throw new Error('Contrastive 분석에는 최소 60회 이상의 과거 데이터가 필요해요.');
  }
  const discoveryEnd = Math.max(1, Math.floor(history.length * 0.6));
  const validationEnd = Math.max(discoveryEnd + 1, Math.floor(history.length * 0.8));
  return {
    discovery: history.slice(0, discoveryEnd),
    validation: history.slice(discoveryEnd, validationEnd),
    holdout: history.slice(validationEnd),
  };
}

export function sanitizeResearchConfig(
  requested: Partial<ResearchConfig> = {},
): ResearchConfig {
  const merged = { ...DEFAULT_RESEARCH_CONFIG, ...requested };
  return {
    ...(merged.shape === undefined ? {} : { shape: { ...merged.shape } }),
    seed: Math.trunc(merged.seed) >>> 0,
    sampleSize: clampInteger(merged.sampleSize, 1_000, 2_000_000),
    nullSampleSize: clampInteger(merged.nullSampleSize, 1_000, 250_000),
    topFraction: Math.min(Math.max(merged.topFraction, 0.001), 0.25),
    coordinateSystem: merged.coordinateSystem === 'board' ? 'board' : 'circle',
    bootstrapIterations: clampInteger(merged.bootstrapIterations, 0, 2_000),
    permutationIterations: clampInteger(merged.permutationIterations, 0, 2_000),
  };
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}
