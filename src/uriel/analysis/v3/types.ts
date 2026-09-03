import type { LayoutMode, LottoDraw } from '../../types';

export const CANDIDATE_SIZES = [10, 15, 20, 25, 30] as const;
export type CandidateSize = (typeof CANDIDATE_SIZES)[number];

export const SAMPLE_SIZES = [100_000, 500_000, 1_000_000, 2_000_000] as const;
export type MonteCarloSampleSize = (typeof SAMPLE_SIZES)[number];

export type ResearchAlgorithmId =
  'random-baseline' | 'distance' | 'distribution' | 'geometry' | 'contrastive-ensemble';

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
}

export interface CandidateAlgorithm {
  readonly id: ResearchAlgorithmId;
  fit(history: readonly LottoDraw[], config: ResearchConfig): FittedCombinationModel;
}

export interface NumberCandidateScore {
  number: number;
  rawScore: number;
  normalizedScore: number;
  inclusionRate: number;
}

export interface CandidateSet {
  size: CandidateSize;
  numbers: readonly number[];
}

export interface PredictionMetadata {
  algorithm: ResearchAlgorithmId;
  parameters: ResearchConfig;
  dataStartRound: number;
  dataEndRound: number;
  candidateSizes: readonly CandidateSize[];
  randomSeed: number;
  sampleSize: number;
  retainedCombinations: number;
  executionDate: string;
  gitCommit: string | null;
}

export interface CandidatePrediction {
  algorithmId: ResearchAlgorithmId;
  candidateSets: readonly CandidateSet[];
  numberScores: readonly NumberCandidateScore[];
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
