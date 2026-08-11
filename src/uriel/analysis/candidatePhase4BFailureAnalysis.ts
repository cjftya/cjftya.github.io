import type { LottoDraw } from '../types';
import { resolveBacktestRoundRange } from './backtest';
import { buildFrozenPhase3CandidateRoundDiagnostic } from './candidatePhase2';
import {
  buildCombinationAnalysis,
  combinationScoreFor,
  type CombinationStrategy,
  type CombinationVector,
} from './combination';
import { selectPhase4StructuredTop100 } from './candidatePhase4Coverage';

export type Phase4BPeriod = 'development' | 'historical-reference';
export type Phase4BClassification =
  'A_STRUCTURED_ONLY' | 'B_PAIR_ONLY' | 'C_BOTH_SUCCESS' | 'D_BOTH_FAILURE';
export type Phase4BResult =
  'COMBINATION_SIGNAL_FOUND' | 'INCONCLUSIVE' | 'NO_COMBINATION_SIGNAL';

export interface CandidatePhase4BOptions {
  seed: 20260807;
  poolSize: 20;
  greedySampleSize: 128;
}

export interface Phase4BDistribution {
  count: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
}

export interface Phase4BRankStructureFeatures {
  sourceRanks: readonly number[];
  bestRank: number;
  worstRank: number;
  meanRank: number;
  medianRank: number;
  rankStandardDeviation: number;
  rankRange: number;
  rankQuartile: number;
  bandCounts: readonly [number, number, number, number];
  bandProfile: string;
}

export interface Phase4BPairDistributionFeatures {
  scalarScore: number;
  percentile: number;
  rank: number;
  constituentScores: readonly number[];
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  range: number;
  lowerQuartile: number;
  upperQuartile: number;
  top1Share: number;
  top3Share: number;
  gini: number;
  normalizedEntropy: number;
  maxMeanRatio: number;
}

export interface Phase4BCandidateScoreFeatures {
  scores: readonly number[];
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  range: number;
  topScoreShare: number;
}

export interface Phase4BRankingFeatures {
  pairRank: number;
  transitionRank: number;
  shapeRank: number;
  numberRank: number;
  pairPercentile: number;
  transitionPercentile: number;
  shapePercentile: number;
  numberPercentile: number;
}

export interface Phase4BEnsembleFeatures {
  meanPercentile: number;
  bestPercentile: number;
  worstPercentile: number;
  percentileStandardDeviation: number;
  percentileRange: number;
  top100Agreement: number;
  top500Agreement: number;
  top1000Agreement: number;
  oneSpecialistDominance: number;
  pairHighShapeLow: number;
  shapeHighPairLow: number;
  transitionHighPairLow: number;
}

export interface Phase4BCoverageNoveltyFeatures {
  numberRarity: number;
  pairRarity: number;
  tripleRarity: number;
  bandRarity: number;
  rankProfileRarity: number;
  averageOverlapWithPairTop100: number;
  averageOverlapWithStructuredTop100: number;
}

export interface Phase4BBaselineDistanceFeatures {
  numberFrequencyDistance: number;
  pairFrequencyDistance: number;
  averageOverlap: number;
  nearestTop100Overlap: number;
  bandProfileDistance: number;
  rankProfileDistance: number;
}

export interface Phase4BCombinationFeatures {
  vectorIndex: number;
  numbers: readonly number[];
  rank: Phase4BRankStructureFeatures;
  pair: Phase4BPairDistributionFeatures;
  candidateScore: Phase4BCandidateScoreFeatures;
  ranking: Phase4BRankingFeatures;
  ensemble: Phase4BEnsembleFeatures;
  novelty: Phase4BCoverageNoveltyFeatures;
  baselineDistance: Phase4BBaselineDistanceFeatures;
}

export interface Phase4BNeighborhoodFeatures {
  overlap: 3 | 4 | 5;
  totalNeighbors: number;
  pairTop100Neighbors: number;
  structuredTop100Neighbors: number;
  pairScoreMean: number;
  pairScoreMax: number;
  pairRankMedian: number;
  pairRankBest: number;
  pairRankTop100: number;
  pairRankTop500: number;
}

export interface Phase4BBasinDistanceSummary {
  distance: 0 | 1 | 2 | 3;
  combinations: number;
  pairRank: Phase4BDistribution;
  shapeRank: Phase4BDistribution;
  transitionRank: Phase4BDistribution;
  pairPercentile: Phase4BDistribution;
  shapePercentile: Phase4BDistribution;
  transitionPercentile: Phase4BDistribution;
  structuredSelected: number;
  structuredSelectionRate: number;
}

export interface Phase4BSelectionTrace {
  targetVectorIndex: number;
  targetPairRank: number;
  targetStructuredRank: number | null;
  baselineHeadCandidate: boolean;
  consideredSteps: number;
  feasibleConsideredSteps: number;
  higherGainLosses: number;
  firstHardOverlapAfterStep: number | null;
  conflictVectorIndex: number | null;
  conflictPairRank: number | null;
  conflictOverlap: number;
  exclusionReason:
    'selected' | 'overlap-hard-limit' | 'coverage-gain' | 'sampled-candidate-miss';
}

export interface Phase4BFeatureSummary {
  [feature: string]: number;
}

export interface Phase4BOpportunityCase {
  round: number;
  period: Phase4BPeriod;
  candidateRecall: number;
  pairMaxHit: number;
  pairBest5Rank: number | null;
  pairBest6Rank: number | null;
  structuredMaxHit: number;
  structuredBest5Rank: number | null;
  structuredBest6Rank: number | null;
  winningSourceRanks: readonly number[];
  bandProfile: string;
  classification: Phase4BClassification;
  winnerRelatedCombinationCount: number;
  featureSummary: Phase4BFeatureSummary;
  rankTrajectory: {
    pairBestFive: Phase4BRankTrajectory | null;
    structuredBestFive: Phase4BRankTrajectory | null;
  };
}

export interface Phase4BRankTrajectory {
  vectorIndex: number;
  pair: number;
  transition: number;
  shape: number;
  number: number;
  structured: number | null;
}

export interface Phase4BGroupFeatureComparison {
  feature: string;
  groups: Partial<Record<Phase4BClassification, Phase4BDistribution>>;
}

export interface Phase4BPeriodEffect {
  period: Phase4BPeriod;
  successCount: number;
  failureCount: number;
  successMedian: number;
  failureMedian: number;
  medianDifference: number;
  cliffsDelta: number;
  direction: -1 | 0 | 1;
}

export interface Phase4BSignalCandidate {
  feature: string;
  development: Phase4BPeriodEffect;
  historical: Phase4BPeriodEffect;
  sameDirection: boolean;
  moderateEffectBothPeriods: boolean;
  leaveOneOpportunityOutStable: boolean;
  unstableWhenRemoved: readonly number[];
}

export interface Phase4BCounterfactualSummary {
  round: number;
  pairOnlyCount: number;
  structuredOnlyCount: number;
  commonCount: number;
  removedFeatureMedian: Phase4BFeatureSummary;
  replacementFeatureMedian: Phase4BFeatureSummary;
  pairFiveHitRemoved: boolean;
}

export interface Phase4BDetailedCase {
  round: number;
  period: Phase4BPeriod;
  bestPairFive: Phase4BCombinationFeatures | null;
  bestStructuredFive: Phase4BCombinationFeatures | null;
  exactSix: Phase4BCombinationFeatures | null;
  bestPairFiveNeighborhood: readonly Phase4BNeighborhoodFeatures[];
  exactSixBasin: readonly Phase4BBasinDistanceSummary[];
  selectionTrace: Phase4BSelectionTrace | null;
  counterfactual: Phase4BCounterfactualSummary;
}

export interface Phase4BFourFiveBoundary {
  historicalPairFourPlus: number;
  historicalStructuredFourPlus: number;
  structuredOnlyFourPlusRounds: readonly number[];
  pairOnlyFourPlusRounds: readonly number[];
  netFourPlusGain: number;
  additionalFourHitFeatures: readonly Phase4BFeatureSummary[];
  missedFiveHitFeatures: readonly Phase4BFeatureSummary[];
  comparison: readonly {
    feature: string;
    additionalFourHit: Phase4BDistribution;
    missedFiveHit: Phase4BDistribution;
  }[];
}

export interface CandidatePhase4BFailureAnalysisResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  tuningAllowed: false;
  operatingAlgorithmFrozen: true;
  selectorFrozen: true;
  winnerIndependentFeatures: true;
  lockedHoldoutAccessed: false;
  additionalBlindHoldoutAccessed: false;
  options: CandidatePhase4BOptions;
  ranges: {
    development: readonly [1044, 1235];
    historicalReference: readonly [852, 1043];
    locked: null;
    additionalBlind: null;
  };
  regression: {
    development: {
      candidate: { fourPlus: number; fivePlus: number; six: number };
      pair: { fourPlus: number; fivePlus: number; six: number };
      structured: { fourPlus: number; fivePlus: number; six: number };
    };
    historical: {
      candidate: { fourPlus: number; fivePlus: number; six: number };
      pair: { fourPlus: number; fivePlus: number; six: number };
      structured: { fourPlus: number; fivePlus: number; six: number };
    };
  };
  opportunityCases: readonly Phase4BOpportunityCase[];
  groupFeatureComparison: readonly Phase4BGroupFeatureComparison[];
  signalCandidates: readonly Phase4BSignalCandidate[];
  counterfactuals: readonly Phase4BCounterfactualSummary[];
  detailedCases: readonly Phase4BDetailedCase[];
  fourHitVsFiveHitBoundary: Phase4BFourFiveBoundary;
  gates: {
    observableSeparation: boolean;
    crossPeriodDirection: boolean;
    winnerIndependence: true;
    stability: boolean;
  };
  result: Phase4BResult;
  reason: string;
}

interface SafeNumberFeature {
  number: number;
  decayScore: number;
}

interface IntrinsicRoundContext {
  vectors: readonly CombinationVector[];
  candidateRanking: readonly number[];
  candidateScores: ReadonlyMap<number, number>;
  pairRelationshipScores: ReadonlyMap<string, number>;
  orders: Record<'pair' | 'transition' | 'shape' | 'number', readonly number[]>;
  positions: Record<'pair' | 'transition' | 'shape' | 'number', Uint32Array>;
  pairTop100: readonly number[];
  structuredTop100: readonly number[];
  pairSelected: Uint8Array;
  structuredSelected: Uint8Array;
  sourceRanks: Uint8Array;
  pairTop100Profile: Top100Profile;
  structuredNumberCounts: readonly number[];
}

interface Top100Profile {
  numberCounts: readonly number[];
  pairCounts: ReadonlyMap<string, number>;
  tripleCounts: ReadonlyMap<string, number>;
  bandCounts: ReadonlyMap<string, number>;
  rankProfileCounts: ReadonlyMap<string, number>;
  meanBandCounts: readonly [number, number, number, number];
  meanRanksByPosition: readonly number[];
}

interface PeriodAccumulator {
  period: Phase4BPeriod;
  candidateHits: number[];
  pairHits: number[];
  structuredHits: number[];
}

interface RoundComputation {
  period: Phase4BPeriod;
  round: number;
  candidateRecall: number;
  winningSourceRanks: readonly number[];
  vectors: readonly CombinationVector[];
  context: IntrinsicRoundContext | null;
  featureRows: readonly Phase4BCombinationFeatures[] | null;
  hits: Uint8Array;
  pairOrder: readonly number[];
  structuredOrder: readonly number[];
  pairMaxHit: number;
  structuredMaxHit: number;
  selectorSeed: number;
}

const DEVELOPMENT_RANGE = [1044, 1235] as const;
const HISTORICAL_RANGE = [852, 1043] as const;
const TOTAL_COMBINATIONS = 38_760;
const TOP100 = 100;
const DEFAULT_SEED = 20_260_807;
const GREEDY_SAMPLE_SIZE = 128;
const MODERATE_CLIFFS_DELTA = 1 / 3;
const RANK_PAIR_INDEX = buildRankPairIndex();
const FEATURE_KEYS = [
  'rank.mean',
  'rank.median',
  'rank.std',
  'rank.range',
  'rank.worst',
  'rank.bandDCount',
  'pair.score',
  'pair.gini',
  'pair.entropy',
  'pair.top1Share',
  'pair.top3Share',
  'pair.maxMeanRatio',
  'candidate.mean',
  'candidate.min',
  'candidate.std',
  'candidate.topShare',
  'ensemble.mean',
  'ensemble.worst',
  'ensemble.std',
  'ensemble.top100Agreement',
  'ensemble.oneSpecialistDominance',
  'ensemble.pairHighShapeLow',
  'ensemble.shapeHighPairLow',
  'ensemble.transitionHighPairLow',
  'novelty.numberRarity',
  'novelty.pairRarity',
  'novelty.tripleRarity',
  'novelty.bandRarity',
  'distance.averageOverlap',
  'distance.nearestOverlap',
  'distance.bandProfile',
  'distance.rankProfile',
] as const;

export function runCandidatePhase4BFailureAnalysis(
  draws: readonly LottoDraw[],
  onProgress?: (
    completed: number,
    total: number,
    round: number,
    period: Phase4BPeriod,
  ) => void,
): CandidatePhase4BFailureAnalysisResult {
  validateInputDraws(draws);
  const options: CandidatePhase4BOptions = {
    seed: DEFAULT_SEED,
    poolSize: 20,
    greedySampleSize: GREEDY_SAMPLE_SIZE,
  };
  const periods: readonly {
    period: Phase4BPeriod;
    bounds: readonly [number, number];
  }[] = [
    { period: 'development', bounds: DEVELOPMENT_RANGE },
    { period: 'historical-reference', bounds: HISTORICAL_RANGE },
  ];
  const accumulators = new Map<Phase4BPeriod, PeriodAccumulator>();
  periods.forEach(({ period }) => {
    accumulators.set(period, {
      period,
      candidateHits: [],
      pairHits: [],
      structuredHits: [],
    });
  });
  const opportunities: Phase4BOpportunityCase[] = [];
  const counterfactuals: Phase4BCounterfactualSummary[] = [];
  const detailedCases: Phase4BDetailedCase[] = [];
  const additionalFourHitFeatures: Phase4BFeatureSummary[] = [];
  const structuredOnlyFourPlusRounds: number[] = [];
  const pairOnlyFourPlusRounds: number[] = [];
  let completed = 0;
  const total = periods.reduce((sum, { bounds }) => sum + bounds[1] - bounds[0] + 1, 0);

  for (const { period, bounds } of periods) {
    const range = resolveBacktestRoundRange(draws, {
      rangeMode: 'custom',
      startRound: bounds[0],
      endRound: bounds[1],
      poolSize: 20,
    });
    const accumulator = accumulators.get(period)!;
    for (
      let historyIndex = range.startHistoryIndex;
      historyIndex <= range.endHistoryIndex;
      historyIndex += 1
    ) {
      const actual = draws[historyIndex + 1]!;
      const diagnostic = buildFrozenPhase3CandidateRoundDiagnostic(
        draws,
        historyIndex,
        actual,
      );
      const decay = diagnostic.rankings.decay;
      if (decay === undefined) throw new Error(`Round ${actual.round} has no decay.`);
      accumulator.candidateHits.push(decay.recall);
      if (decay.recall >= 4) {
        const safeNumbers = diagnostic.numbers.map(
          ({ number, features }): SafeNumberFeature => ({
            number,
            decayScore: features.decay,
          }),
        );
        const round = computeRound(
          draws,
          historyIndex,
          actual,
          period,
          decay.top20,
          decay.recall,
          decay.winningRanks,
          options,
        );
        accumulator.pairHits.push(round.pairMaxHit);
        accumulator.structuredHits.push(round.structuredMaxHit);
        const requiresDetailedFeatures =
          decay.recall >= 5 ||
          (period === 'historical-reference' &&
            round.pairMaxHit < 4 &&
            round.structuredMaxHit >= 4);
        const enriched = requiresDetailedFeatures
          ? ensureFeatureRows(round, draws, historyIndex, decay.top20, safeNumbers)
          : null;
        if (decay.recall >= 5) {
          if (enriched === null) throw new Error('Missing 5+ feature context.');
          const built = buildOpportunityCase(enriched);
          opportunities.push(built.opportunity);
          counterfactuals.push(built.counterfactual);
          if ([984, 1135, 1176].includes(actual.round)) {
            detailedCases.push(buildDetailedCase(enriched));
          }
        }
        if (
          period === 'historical-reference' &&
          round.pairMaxHit < 4 &&
          round.structuredMaxHit >= 4
        ) {
          if (enriched === null) throw new Error('Missing 4+ boundary context.');
          structuredOnlyFourPlusRounds.push(actual.round);
          const fourIndices = indicesAtLeast(enriched.hits, 4);
          additionalFourHitFeatures.push(
            aggregateFeatureRows(
              fourIndices.map((index) => enriched.featureRows![index]!),
            ),
          );
        }
        if (
          period === 'historical-reference' &&
          round.pairMaxHit >= 4 &&
          round.structuredMaxHit < 4
        ) {
          pairOnlyFourPlusRounds.push(actual.round);
        }
      }
      completed += 1;
      onProgress?.(completed, total, actual.round, period);
    }
  }

  const development = accumulators.get('development')!;
  const historical = accumulators.get('historical-reference')!;
  const regression = {
    development: {
      candidate: stageSummary(development.candidateHits),
      pair: stageSummary(development.pairHits),
      structured: stageSummary(development.structuredHits),
    },
    historical: {
      candidate: stageSummary(historical.candidateHits),
      pair: stageSummary(historical.pairHits),
      structured: stageSummary(historical.structuredHits),
    },
  };
  assertFrozenRegression(regression);
  const groupFeatureComparison = compareGroups(opportunities);
  const signalCandidates = analyzeSignals(opportunities);
  const candidateSignals = signalCandidates.filter(
    ({ sameDirection, moderateEffectBothPeriods }) =>
      sameDirection && moderateEffectBothPeriods,
  );
  const stableSignals = candidateSignals.filter(
    ({ leaveOneOpportunityOutStable }) => leaveOneOpportunityOutStable,
  );
  const missedFiveHitFeatures = opportunities
    .filter(({ structuredMaxHit }) => structuredMaxHit < 5)
    .map(({ featureSummary }) => featureSummary);
  const boundaryComparison = FEATURE_KEYS.map((feature) => ({
    feature,
    additionalFourHit: distribution(
      additionalFourHitFeatures.map((summary) => summary[feature] ?? 0),
    ),
    missedFiveHit: distribution(
      missedFiveHitFeatures.map((summary) => summary[feature] ?? 0),
    ),
  }));
  const gates = {
    observableSeparation: candidateSignals.length > 0,
    crossPeriodDirection: candidateSignals.length > 0,
    winnerIndependence: true as const,
    stability: stableSignals.length > 0,
  };
  const result: Phase4BResult =
    gates.observableSeparation && gates.crossPeriodDirection && gates.stability
      ? 'COMBINATION_SIGNAL_FOUND'
      : candidateSignals.length > 0
        ? 'INCONCLUSIVE'
        : 'NO_COMBINATION_SIGNAL';

  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tuningAllowed: false,
    operatingAlgorithmFrozen: true,
    selectorFrozen: true,
    winnerIndependentFeatures: true,
    lockedHoldoutAccessed: false,
    additionalBlindHoldoutAccessed: false,
    options,
    ranges: {
      development: DEVELOPMENT_RANGE,
      historicalReference: HISTORICAL_RANGE,
      locked: null,
      additionalBlind: null,
    },
    regression,
    opportunityCases: opportunities.sort((left, right) => left.round - right.round),
    groupFeatureComparison,
    signalCandidates,
    counterfactuals: counterfactuals.sort((left, right) => left.round - right.round),
    detailedCases: detailedCases.sort((left, right) => left.round - right.round),
    fourHitVsFiveHitBoundary: {
      historicalPairFourPlus: regression.historical.pair.fourPlus,
      historicalStructuredFourPlus: regression.historical.structured.fourPlus,
      structuredOnlyFourPlusRounds,
      pairOnlyFourPlusRounds,
      netFourPlusGain:
        regression.historical.structured.fourPlus - regression.historical.pair.fourPlus,
      additionalFourHitFeatures,
      missedFiveHitFeatures,
      comparison: boundaryComparison,
    },
    gates,
    result,
    reason:
      result === 'COMBINATION_SIGNAL_FOUND'
        ? `${stableSignals.length} winner-independent signals passed cross-period and leave-one-out gates.`
        : result === 'INCONCLUSIVE'
          ? `${candidateSignals.length} cross-period descriptive signals were found, but none survived leave-one-opportunity-out.`
          : 'No winner-independent feature showed the same moderate direction in both periods.',
  };
}

function computeRound(
  draws: readonly LottoDraw[],
  historyIndex: number,
  actual: LottoDraw,
  period: Phase4BPeriod,
  candidateTop20: readonly number[],
  candidateRecall: number,
  winningSourceRanks: readonly number[],
  options: CandidatePhase4BOptions,
): RoundComputation {
  const analysis = buildCombinationAnalysis(
    draws,
    historyIndex,
    20,
    false,
    'full-enumeration',
    candidateTop20,
    [],
  );
  if (
    !analysis.generationComplete ||
    analysis.rawCombinationCount !== TOTAL_COMBINATIONS
  ) {
    throw new Error(
      `Phase 4B requires 38,760 combinations; got ${analysis.rawCombinationCount}.`,
    );
  }
  const pairOrder = orderFor(analysis.generatedCombinations, 'pair');
  const selectorSeed = phase4SelectorSeed(actual.round, period, options.seed);
  const structuredOrder = selectPhase4StructuredTop100(
    analysis.generatedCombinations,
    candidateTop20,
    'pair',
    'P4_OVERLAP_LIMIT',
    selectorSeed,
    options.greedySampleSize,
  );
  const winning = new Set(actual.numbers);
  const hits = Uint8Array.from(
    analysis.generatedCombinations.map(({ numbers }) =>
      numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
    ),
  );
  return {
    period,
    round: actual.round,
    candidateRecall,
    winningSourceRanks,
    vectors: analysis.generatedCombinations,
    context: null,
    featureRows: null,
    hits,
    pairOrder,
    structuredOrder,
    pairMaxHit: maxHit(pairOrder.slice(0, TOP100), hits),
    structuredMaxHit: maxHit(structuredOrder, hits),
    selectorSeed,
  };
}

function ensureFeatureRows(
  round: RoundComputation,
  draws: readonly LottoDraw[],
  historyIndex: number,
  candidateTop20: readonly number[],
  safeNumbers: readonly SafeNumberFeature[],
): RoundComputation & {
  context: IntrinsicRoundContext;
  featureRows: readonly Phase4BCombinationFeatures[];
} {
  if (round.featureRows !== null && round.context !== null) {
    return round as RoundComputation & {
      context: IntrinsicRoundContext;
      featureRows: readonly Phase4BCombinationFeatures[];
    };
  }
  const context = buildIntrinsicRoundContext(
    draws,
    historyIndex,
    round.vectors,
    candidateTop20,
    safeNumbers,
    round.pairOrder,
    round.structuredOrder,
  );
  const featureRows = round.vectors.map((_, vectorIndex) =>
    extractPhase4BCombinationFeature(context, vectorIndex),
  );
  return { ...round, context, featureRows };
}

function buildIntrinsicRoundContext(
  draws: readonly LottoDraw[],
  historyIndex: number,
  vectors: readonly CombinationVector[],
  candidateRanking: readonly number[],
  safeNumbers: readonly SafeNumberFeature[],
  pairOrder: readonly number[],
  structuredTop100: readonly number[],
): IntrinsicRoundContext {
  const orders = {
    pair: pairOrder,
    transition: orderFor(vectors, 'transition'),
    shape: orderFor(vectors, 'shape'),
    number: orderFor(vectors, 'number'),
  };
  const positions = {
    pair: positionsFor(orders.pair),
    transition: positionsFor(orders.transition),
    shape: positionsFor(orders.shape),
    number: positionsFor(orders.number),
  };
  const pairTop100 = pairOrder.slice(0, TOP100);
  const pairSelected = selectedFlags(vectors.length, pairTop100);
  const structuredSelected = selectedFlags(vectors.length, structuredTop100);
  const sourceRanks = new Uint8Array(46);
  candidateRanking.forEach((number, offset) => {
    sourceRanks[number] = offset + 1;
  });
  return {
    vectors,
    candidateRanking,
    candidateScores: new Map(
      safeNumbers.map(({ number, decayScore }) => [number, decayScore]),
    ),
    pairRelationshipScores: buildPairRelationshipScores(
      draws.slice(0, historyIndex + 1),
    ),
    orders,
    positions,
    pairTop100,
    structuredTop100,
    pairSelected,
    structuredSelected,
    sourceRanks,
    pairTop100Profile: buildTop100Profile(vectors, pairTop100, sourceRanks),
    structuredNumberCounts: numberCountsForSelection(
      vectors,
      structuredTop100,
      sourceRanks,
    ),
  };
}

export function extractPhase4BCombinationFeature(
  context: IntrinsicRoundContext,
  vectorIndex: number,
): Phase4BCombinationFeatures {
  const vector = context.vectors[vectorIndex];
  if (vector === undefined) throw new Error(`Missing vector ${vectorIndex}.`);
  const sourceRanks = vector.numbers
    .map((number) => context.sourceRanks[number] ?? 45)
    .sort((left, right) => left - right);
  const bandCounts = bandCountsFor(sourceRanks);
  const pairKeys = combinations(vector.numbers, 2).map((pair) => pair.join('-'));
  const pairScores = pairKeys
    .map((key) => context.pairRelationshipScores.get(key) ?? 0)
    .sort((left, right) => left - right);
  const constituentPairMean = mean(pairScores);
  if (Math.abs(constituentPairMean - vector.features.pairScore) > 1e-10) {
    throw new Error(
      `Pair constituent score mismatch at vector ${vectorIndex}: ${constituentPairMean} != ${vector.features.pairScore}.`,
    );
  }
  const candidateScores = vector.numbers
    .map((number) => context.candidateScores.get(number) ?? 0)
    .sort((left, right) => left - right);
  const pairRank = context.positions.pair[vectorIndex]!;
  const transitionRank = context.positions.transition[vectorIndex]!;
  const shapeRank = context.positions.shape[vectorIndex]!;
  const numberRank = context.positions.number[vectorIndex]!;
  const percentiles = [
    percentile(pairRank, context.vectors.length),
    percentile(transitionRank, context.vectors.length),
    percentile(shapeRank, context.vectors.length),
    percentile(numberRank, context.vectors.length),
  ];
  const sortedPercentiles = [...percentiles].sort((left, right) => right - left);
  const bandProfile = formatBandProfile(bandCounts);
  const rankProfile = formatRankProfile(sourceRanks);
  const novelty = coverageNovelty(context, sourceRanks, bandProfile, rankProfile);
  const baselineDistance = baselineDistanceFeatures(
    context,
    vector.numbers,
    sourceRanks,
    bandCounts,
  );
  return {
    vectorIndex,
    numbers: vector.numbers,
    rank: {
      sourceRanks,
      bestRank: sourceRanks[0]!,
      worstRank: sourceRanks.at(-1)!,
      meanRank: mean(sourceRanks),
      medianRank: median(sourceRanks),
      rankStandardDeviation: standardDeviation(sourceRanks),
      rankRange: sourceRanks.at(-1)! - sourceRanks[0]!,
      rankQuartile: Math.floor((sourceRanks.at(-1)! - 1) / 5) + 1,
      bandCounts,
      bandProfile,
    },
    pair: {
      scalarScore: vector.features.pairScore,
      percentile: percentiles[0]!,
      rank: pairRank,
      constituentScores: pairScores,
      mean: constituentPairMean,
      median: median(pairScores),
      min: Math.min(...pairScores),
      max: Math.max(...pairScores),
      standardDeviation: standardDeviation(pairScores),
      range: Math.max(...pairScores) - Math.min(...pairScores),
      lowerQuartile: quantile(pairScores, 0.25),
      upperQuartile: quantile(pairScores, 0.75),
      top1Share: topShare(pairScores, 1),
      top3Share: topShare(pairScores, 3),
      gini: gini(pairScores),
      normalizedEntropy: normalizedEntropy(pairScores),
      maxMeanRatio: ratio(Math.max(...pairScores), constituentPairMean),
    },
    candidateScore: {
      scores: candidateScores,
      mean: mean(candidateScores),
      median: median(candidateScores),
      min: Math.min(...candidateScores),
      max: Math.max(...candidateScores),
      standardDeviation: standardDeviation(candidateScores),
      range: Math.max(...candidateScores) - Math.min(...candidateScores),
      topScoreShare: topShare(candidateScores, 1),
    },
    ranking: {
      pairRank,
      transitionRank,
      shapeRank,
      numberRank,
      pairPercentile: percentiles[0]!,
      transitionPercentile: percentiles[1]!,
      shapePercentile: percentiles[2]!,
      numberPercentile: percentiles[3]!,
    },
    ensemble: {
      meanPercentile: mean(percentiles),
      bestPercentile: Math.max(...percentiles),
      worstPercentile: Math.min(...percentiles),
      percentileStandardDeviation: standardDeviation(percentiles),
      percentileRange: Math.max(...percentiles) - Math.min(...percentiles),
      top100Agreement: [pairRank, transitionRank, shapeRank, numberRank].filter(
        (rank) => rank <= 100,
      ).length,
      top500Agreement: [pairRank, transitionRank, shapeRank, numberRank].filter(
        (rank) => rank <= 500,
      ).length,
      top1000Agreement: [pairRank, transitionRank, shapeRank, numberRank].filter(
        (rank) => rank <= 1000,
      ).length,
      oneSpecialistDominance: sortedPercentiles[0]! - sortedPercentiles[1]!,
      pairHighShapeLow: percentiles[0]! - percentiles[2]!,
      shapeHighPairLow: percentiles[2]! - percentiles[0]!,
      transitionHighPairLow: percentiles[1]! - percentiles[0]!,
    },
    novelty,
    baselineDistance,
  };
}

function buildOpportunityCase(
  round: RoundComputation & { featureRows: readonly Phase4BCombinationFeatures[] },
): {
  opportunity: Phase4BOpportunityCase;
  counterfactual: Phase4BCounterfactualSummary;
} {
  const winnerRelated = indicesAtLeast(round.hits, 5);
  const pairBest5Rank = firstRankAtLeast(round.pairOrder, round.hits, 5);
  const pairBest6Rank = firstRankAtLeast(round.pairOrder, round.hits, 6);
  const structuredBest5Rank = firstRankAtLeast(round.structuredOrder, round.hits, 5);
  const structuredBest6Rank = firstRankAtLeast(round.structuredOrder, round.hits, 6);
  const classification = classify(round.pairMaxHit, round.structuredMaxHit);
  const pairBestIndex = firstIndexAtLeast(round.pairOrder, round.hits, 5);
  const structuredBestIndex = firstIndexAtLeast(round.structuredOrder, round.hits, 5);
  const pairSet = new Set(round.pairOrder.slice(0, TOP100));
  const structuredSet = new Set(round.structuredOrder);
  const pairOnly = [...pairSet].filter((index) => !structuredSet.has(index));
  const structuredOnly = [...structuredSet].filter((index) => !pairSet.has(index));
  const common = [...pairSet].filter((index) => structuredSet.has(index));
  const counterfactual: Phase4BCounterfactualSummary = {
    round: round.round,
    pairOnlyCount: pairOnly.length,
    structuredOnlyCount: structuredOnly.length,
    commonCount: common.length,
    removedFeatureMedian: aggregateFeatureRows(
      pairOnly.map((index) => round.featureRows[index]!),
    ),
    replacementFeatureMedian: aggregateFeatureRows(
      structuredOnly.map((index) => round.featureRows[index]!),
    ),
    pairFiveHitRemoved: pairOnly.some((index) => round.hits[index]! >= 5),
  };
  return {
    opportunity: {
      round: round.round,
      period: round.period,
      candidateRecall: round.candidateRecall,
      pairMaxHit: round.pairMaxHit,
      pairBest5Rank,
      pairBest6Rank,
      structuredMaxHit: round.structuredMaxHit,
      structuredBest5Rank,
      structuredBest6Rank,
      winningSourceRanks: round.winningSourceRanks,
      bandProfile: formatWinnerBandProfile(round.winningSourceRanks),
      classification,
      winnerRelatedCombinationCount: winnerRelated.length,
      featureSummary: aggregateFeatureRows(
        winnerRelated.map((index) => round.featureRows[index]!),
      ),
      rankTrajectory: {
        pairBestFive: buildRankTrajectory(
          pairBestIndex,
          round.featureRows,
          round.structuredOrder,
        ),
        structuredBestFive: buildRankTrajectory(
          structuredBestIndex,
          round.featureRows,
          round.structuredOrder,
        ),
      },
    },
    counterfactual,
  };
}

function buildDetailedCase(
  round: RoundComputation & {
    context: IntrinsicRoundContext;
    featureRows: readonly Phase4BCombinationFeatures[];
  },
): Phase4BDetailedCase {
  const bestPairFiveIndex = firstIndexAtLeast(round.pairOrder, round.hits, 5);
  const bestStructuredFiveIndex = firstIndexAtLeast(
    round.structuredOrder,
    round.hits,
    5,
  );
  const exactSixIndex = firstIndexAtLeast(round.pairOrder, round.hits, 6);
  const pairSet = new Set(round.pairOrder.slice(0, TOP100));
  const structuredSet = new Set(round.structuredOrder);
  const pairOnly = [...pairSet].filter((index) => !structuredSet.has(index));
  const structuredOnly = [...structuredSet].filter((index) => !pairSet.has(index));
  const common = [...pairSet].filter((index) => structuredSet.has(index));
  const traceTarget =
    round.round === 984
      ? bestPairFiveIndex
      : round.round === 1176
        ? exactSixIndex
        : bestStructuredFiveIndex;
  return {
    round: round.round,
    period: round.period,
    bestPairFive:
      bestPairFiveIndex === null ? null : round.featureRows[bestPairFiveIndex]!,
    bestStructuredFive:
      bestStructuredFiveIndex === null
        ? null
        : round.featureRows[bestStructuredFiveIndex]!,
    exactSix: exactSixIndex === null ? null : round.featureRows[exactSixIndex]!,
    bestPairFiveNeighborhood:
      bestPairFiveIndex === null
        ? []
        : neighborhoodFeatures(round.context, bestPairFiveIndex),
    exactSixBasin:
      exactSixIndex === null
        ? []
        : basinFeatures(round.context, exactSixIndex, round.structuredOrder),
    selectionTrace:
      traceTarget === null
        ? null
        : traceSelection(
            round.context,
            traceTarget,
            round.structuredOrder,
            round.selectorSeed,
          ),
    counterfactual: {
      round: round.round,
      pairOnlyCount: pairOnly.length,
      structuredOnlyCount: structuredOnly.length,
      commonCount: common.length,
      removedFeatureMedian: aggregateFeatureRows(
        pairOnly.map((index) => round.featureRows[index]!),
      ),
      replacementFeatureMedian: aggregateFeatureRows(
        structuredOnly.map((index) => round.featureRows[index]!),
      ),
      pairFiveHitRemoved: pairOnly.some((index) => round.hits[index]! >= 5),
    },
  };
}

function buildRankTrajectory(
  vectorIndex: number | null,
  featureRows: readonly Phase4BCombinationFeatures[],
  structuredOrder: readonly number[],
): Phase4BRankTrajectory | null {
  if (vectorIndex === null) return null;
  const feature = featureRows[vectorIndex]!;
  const structuredOffset = structuredOrder.indexOf(vectorIndex);
  return {
    vectorIndex,
    pair: feature.ranking.pairRank,
    transition: feature.ranking.transitionRank,
    shape: feature.ranking.shapeRank,
    number: feature.ranking.numberRank,
    structured: structuredOffset < 0 ? null : structuredOffset + 1,
  };
}

function neighborhoodFeatures(
  context: IntrinsicRoundContext,
  targetIndex: number,
): Phase4BNeighborhoodFeatures[] {
  const target = new Set(context.vectors[targetIndex]!.numbers);
  return ([3, 4, 5] as const).map((overlap) => {
    const neighbors = context.vectors
      .map(({ numbers }, index) => ({
        index,
        overlap: numbers.filter((number) => target.has(number)).length,
      }))
      .filter(({ index, overlap: value }) => index !== targetIndex && value === overlap)
      .map(({ index }) => index);
    const pairRanks = neighbors.map((index) => context.positions.pair[index]!);
    const pairScores = neighbors.map(
      (index) => context.vectors[index]!.features.pairScore,
    );
    return {
      overlap,
      totalNeighbors: neighbors.length,
      pairTop100Neighbors: neighbors.filter(
        (index) => context.pairSelected[index] === 1,
      ).length,
      structuredTop100Neighbors: neighbors.filter(
        (index) => context.structuredSelected[index] === 1,
      ).length,
      pairScoreMean: mean(pairScores),
      pairScoreMax: Math.max(...pairScores),
      pairRankMedian: median(pairRanks),
      pairRankBest: Math.min(...pairRanks),
      pairRankTop100: pairRanks.filter((rank) => rank <= 100).length,
      pairRankTop500: pairRanks.filter((rank) => rank <= 500).length,
    };
  });
}

function basinFeatures(
  context: IntrinsicRoundContext,
  exactIndex: number,
  structuredOrder: readonly number[],
): Phase4BBasinDistanceSummary[] {
  const exact = new Set(context.vectors[exactIndex]!.numbers);
  const structured = new Set(structuredOrder);
  return ([0, 1, 2, 3] as const).map((distance) => {
    const overlap = 6 - distance;
    const indices = context.vectors
      .map(({ numbers }, index) => ({
        index,
        overlap: numbers.filter((number) => exact.has(number)).length,
      }))
      .filter(({ overlap: value }) => value === overlap)
      .map(({ index }) => index);
    const ranks = (key: keyof IntrinsicRoundContext['positions']) =>
      indices.map((index) => context.positions[key][index]!);
    const percentiles = (key: keyof IntrinsicRoundContext['positions']) =>
      ranks(key).map((rank) => percentile(rank, context.vectors.length));
    const selected = indices.filter((index) => structured.has(index)).length;
    return {
      distance,
      combinations: indices.length,
      pairRank: distribution(ranks('pair')),
      shapeRank: distribution(ranks('shape')),
      transitionRank: distribution(ranks('transition')),
      pairPercentile: distribution(percentiles('pair')),
      shapePercentile: distribution(percentiles('shape')),
      transitionPercentile: distribution(percentiles('transition')),
      structuredSelected: selected,
      structuredSelectionRate: ratio(selected, indices.length),
    };
  });
}

function traceSelection(
  context: IntrinsicRoundContext,
  targetIndex: number,
  structuredOrder: readonly number[],
  selectorSeed: number,
): Phase4BSelectionTrace {
  const targetPairRank = context.positions.pair[targetIndex]!;
  const targetStructuredPosition = structuredOrder.indexOf(targetIndex);
  const selected = new Uint8Array(context.vectors.length);
  const state = newTraceState();
  let consideredSteps = 0;
  let feasibleConsideredSteps = 0;
  let higherGainLosses = 0;
  let conflictVectorIndex: number | null = null;
  let conflictPairRank: number | null = null;
  let firstHardOverlapAfterStep: number | null = null;
  let conflictOverlap = 0;
  for (let step = 0; step < structuredOrder.length; step += 1) {
    const chosen = structuredOrder[step]!;
    const targetStructure = traceStructure(context, targetIndex);
    const currentOverlap = maximumOverlap(targetStructure.mask, state.selectedMasks);
    if (currentOverlap >= 5) break;
    const considered = isGreedyCandidate(
      context.orders.pair,
      selected,
      targetIndex,
      selectorSeed,
      step,
    );
    if (considered) {
      consideredSteps += 1;
      feasibleConsideredSteps += 1;
      if (chosen === targetIndex) {
        return {
          targetVectorIndex: targetIndex,
          targetPairRank,
          targetStructuredRank: step + 1,
          baselineHeadCandidate: targetPairRank <= 64,
          consideredSteps,
          feasibleConsideredSteps,
          higherGainLosses,
          firstHardOverlapAfterStep: null,
          conflictVectorIndex: null,
          conflictPairRank: null,
          conflictOverlap: 0,
          exclusionReason: 'selected',
        };
      }
      const targetGain = traceCoverageGain(targetStructure, state);
      const chosenGain = traceCoverageGain(traceStructure(context, chosen), state);
      if (chosenGain >= targetGain) higherGainLosses += 1;
    }
    selected[chosen] = 1;
    applyTraceStructure(traceStructure(context, chosen), state);
    const overlapAfter = popcount(
      traceStructure(context, chosen).mask & targetStructure.mask,
    );
    if (overlapAfter >= 5) {
      firstHardOverlapAfterStep = step + 1;
      conflictVectorIndex = chosen;
      conflictPairRank = context.positions.pair[chosen]!;
      conflictOverlap = overlapAfter;
      break;
    }
  }
  return {
    targetVectorIndex: targetIndex,
    targetPairRank,
    targetStructuredRank:
      targetStructuredPosition < 0 ? null : targetStructuredPosition + 1,
    baselineHeadCandidate: targetPairRank <= 64,
    consideredSteps,
    feasibleConsideredSteps,
    higherGainLosses,
    firstHardOverlapAfterStep,
    conflictVectorIndex,
    conflictPairRank,
    conflictOverlap,
    exclusionReason:
      firstHardOverlapAfterStep !== null
        ? 'overlap-hard-limit'
        : consideredSteps > 0
          ? 'coverage-gain'
          : 'sampled-candidate-miss',
  };
}

interface TraceStructure {
  mask: number;
  ranks: readonly number[];
  pairs: readonly number[];
  bandProfile: string;
}

interface TraceState {
  numberCounts: Uint16Array;
  pairCounts: Uint16Array;
  bandCounts: Map<string, number>;
  selectedMasks: number[];
}

function newTraceState(): TraceState {
  return {
    numberCounts: new Uint16Array(20),
    pairCounts: new Uint16Array(190),
    bandCounts: new Map(),
    selectedMasks: [],
  };
}

function traceStructure(
  context: IntrinsicRoundContext,
  vectorIndex: number,
): TraceStructure {
  const ranks = context.vectors[vectorIndex]!.numbers.map(
    (number) => context.sourceRanks[number]!,
  ).sort((left, right) => left - right);
  let mask = 0;
  ranks.forEach((rank) => {
    mask |= 1 << (rank - 1);
  });
  return {
    mask,
    ranks,
    pairs: rankPairs(ranks),
    bandProfile: formatBandProfile(bandCountsFor(ranks)),
  };
}

function traceCoverageGain(structure: TraceStructure, state: TraceState): number {
  if (maximumOverlap(structure.mask, state.selectedMasks) >= 5) {
    return Number.NEGATIVE_INFINITY;
  }
  let gain = mean(
    structure.ranks.map((rank) => 1 / (1 + state.numberCounts[rank - 1]!)),
  );
  gain += 1 / (1 + (state.bandCounts.get(structure.bandProfile) ?? 0));
  gain += mean(structure.pairs.map((pair) => 1 / (1 + state.pairCounts[pair]!)));
  if (maximumOverlap(structure.mask, state.selectedMasks) === 4) gain -= 1;
  return gain;
}

function applyTraceStructure(structure: TraceStructure, state: TraceState): void {
  structure.ranks.forEach((rank) => {
    state.numberCounts[rank - 1] = state.numberCounts[rank - 1]! + 1;
  });
  structure.pairs.forEach((pair) => {
    state.pairCounts[pair] = state.pairCounts[pair]! + 1;
  });
  state.bandCounts.set(
    structure.bandProfile,
    (state.bandCounts.get(structure.bandProfile) ?? 0) + 1,
  );
  state.selectedMasks.push(structure.mask);
}

function isGreedyCandidate(
  baselineOrder: readonly number[],
  selected: Uint8Array,
  targetIndex: number,
  seed: number,
  step: number,
): boolean {
  let head = 0;
  for (const vectorIndex of baselineOrder) {
    if (selected[vectorIndex] === 0) {
      if (vectorIndex === targetIndex) return true;
      head += 1;
      if (head >= 64) break;
    }
  }
  const offset = hash32(seed + step * 2_654_435_761) % baselineOrder.length;
  for (let sample = 0; sample < GREEDY_SAMPLE_SIZE; sample += 1) {
    const position =
      (Math.floor(((sample + 0.5) * baselineOrder.length) / GREEDY_SAMPLE_SIZE) +
        offset) %
      baselineOrder.length;
    if (baselineOrder[position] === targetIndex && selected[targetIndex] === 0) {
      return true;
    }
  }
  return false;
}

function buildTop100Profile(
  vectors: readonly CombinationVector[],
  selected: readonly number[],
  sourceRanks: Uint8Array,
): Top100Profile {
  const numberCounts = new Array<number>(20).fill(0);
  const pairCounts = new Map<string, number>();
  const tripleCounts = new Map<string, number>();
  const bandCounts = new Map<string, number>();
  const rankProfileCounts = new Map<string, number>();
  const ranksByPosition = Array.from({ length: 6 }, () => [] as number[]);
  selected.forEach((index) => {
    const vector = vectors[index]!;
    const ranks = vector.numbers
      .map((number) => sourceRanks[number]!)
      .sort((left, right) => left - right);
    ranks.forEach((rank, position) => {
      numberCounts[rank - 1] = numberCounts[rank - 1]! + 1;
      ranksByPosition[position]!.push(rank);
    });
    combinations(ranks, 2).forEach((pair) => addCount(pairCounts, pair.join('-')));
    combinations(ranks, 3).forEach((triple) =>
      addCount(tripleCounts, triple.join('-')),
    );
    addCount(bandCounts, formatBandProfile(bandCountsFor(ranks)));
    addCount(rankProfileCounts, formatRankProfile(ranks));
  });
  const bandSlots = [0, 1, 2, 3].map(
    (band) =>
      selected.reduce((sum, index) => {
        const ranks = vectors[index]!.numbers.map((number) => sourceRanks[number]!);
        return sum + ranks.filter((rank) => bandOf(rank) === band).length;
      }, 0) / selected.length,
  ) as [number, number, number, number];
  return {
    numberCounts,
    pairCounts,
    tripleCounts,
    bandCounts,
    rankProfileCounts,
    meanBandCounts: bandSlots,
    meanRanksByPosition: ranksByPosition.map((values) => mean(values)),
  };
}

function numberCountsForSelection(
  vectors: readonly CombinationVector[],
  selected: readonly number[],
  sourceRanks: Uint8Array,
): number[] {
  const counts = new Array<number>(20).fill(0);
  selected.forEach((index) => {
    vectors[index]!.numbers.forEach((number) => {
      const rank = sourceRanks[number]!;
      counts[rank - 1] = counts[rank - 1]! + 1;
    });
  });
  return counts;
}

function coverageNovelty(
  context: IntrinsicRoundContext,
  sourceRanks: readonly number[],
  bandProfile: string,
  rankProfile: string,
): Phase4BCoverageNoveltyFeatures {
  const triples = combinations(sourceRanks, 3).map((values) => values.join('-'));
  return {
    numberRarity: mean(
      sourceRanks.map(
        (rank) => 1 / (1 + context.pairTop100Profile.numberCounts[rank - 1]!),
      ),
    ),
    pairRarity: mean(
      combinations(sourceRanks, 2).map(
        (pair) =>
          1 / (1 + (context.pairTop100Profile.pairCounts.get(pair.join('-')) ?? 0)),
      ),
    ),
    tripleRarity: mean(
      triples.map(
        (key) => 1 / (1 + (context.pairTop100Profile.tripleCounts.get(key) ?? 0)),
      ),
    ),
    bandRarity: 1 / (1 + (context.pairTop100Profile.bandCounts.get(bandProfile) ?? 0)),
    rankProfileRarity:
      1 / (1 + (context.pairTop100Profile.rankProfileCounts.get(rankProfile) ?? 0)),
    averageOverlapWithPairTop100: averageOverlap(
      sourceRanks,
      context.pairTop100Profile.numberCounts,
    ),
    averageOverlapWithStructuredTop100: averageOverlap(
      sourceRanks,
      context.structuredNumberCounts,
    ),
  };
}

function baselineDistanceFeatures(
  context: IntrinsicRoundContext,
  numbers: readonly number[],
  sourceRanks: readonly number[],
  bandCounts: readonly [number, number, number, number],
): Phase4BBaselineDistanceFeatures {
  const selectedNumberFrequency = sourceRanks.reduce(
    (sum, rank) => sum + context.pairTop100Profile.numberCounts[rank - 1]! / TOP100,
    0,
  );
  const numberFrequencyDistance = (12 - 2 * selectedNumberFrequency) / 20;
  const selectedPairFrequency = combinations(sourceRanks, 2).reduce(
    (sum, pair) =>
      sum + (context.pairTop100Profile.pairCounts.get(pair.join('-')) ?? 0) / TOP100,
    0,
  );
  const pairFrequencyDistance = (30 - 2 * selectedPairFrequency) / 190;
  const selectedNumbers = new Set(numbers);
  const overlaps = context.pairTop100.map(
    (index) =>
      context.vectors[index]!.numbers.filter((number) => selectedNumbers.has(number))
        .length,
  );
  return {
    numberFrequencyDistance,
    pairFrequencyDistance,
    averageOverlap: averageOverlap(sourceRanks, context.pairTop100Profile.numberCounts),
    nearestTop100Overlap: Math.max(...overlaps),
    bandProfileDistance: Math.sqrt(
      mean(
        bandCounts.map(
          (count, index) =>
            (count - context.pairTop100Profile.meanBandCounts[index]!) ** 2,
        ),
      ),
    ),
    rankProfileDistance: Math.sqrt(
      mean(
        sourceRanks.map(
          (rank, index) =>
            (rank - context.pairTop100Profile.meanRanksByPosition[index]!) ** 2,
        ),
      ),
    ),
  };
}

function aggregateFeatureRows(
  rows: readonly Phase4BCombinationFeatures[],
): Phase4BFeatureSummary {
  if (rows.length === 0) {
    return Object.fromEntries(FEATURE_KEYS.map((key) => [key, 0]));
  }
  const values = rows.map(flattenFeatureRow);
  return Object.fromEntries(
    FEATURE_KEYS.map((key) => [key, median(values.map((value) => value[key]!))]),
  );
}

function flattenFeatureRow(row: Phase4BCombinationFeatures): Phase4BFeatureSummary {
  return {
    'rank.mean': row.rank.meanRank,
    'rank.median': row.rank.medianRank,
    'rank.std': row.rank.rankStandardDeviation,
    'rank.range': row.rank.rankRange,
    'rank.worst': row.rank.worstRank,
    'rank.bandDCount': row.rank.bandCounts[3],
    'pair.score': row.pair.scalarScore,
    'pair.gini': row.pair.gini,
    'pair.entropy': row.pair.normalizedEntropy,
    'pair.top1Share': row.pair.top1Share,
    'pair.top3Share': row.pair.top3Share,
    'pair.maxMeanRatio': row.pair.maxMeanRatio,
    'candidate.mean': row.candidateScore.mean,
    'candidate.min': row.candidateScore.min,
    'candidate.std': row.candidateScore.standardDeviation,
    'candidate.topShare': row.candidateScore.topScoreShare,
    'ensemble.mean': row.ensemble.meanPercentile,
    'ensemble.worst': row.ensemble.worstPercentile,
    'ensemble.std': row.ensemble.percentileStandardDeviation,
    'ensemble.top100Agreement': row.ensemble.top100Agreement,
    'ensemble.oneSpecialistDominance': row.ensemble.oneSpecialistDominance,
    'ensemble.pairHighShapeLow': row.ensemble.pairHighShapeLow,
    'ensemble.shapeHighPairLow': row.ensemble.shapeHighPairLow,
    'ensemble.transitionHighPairLow': row.ensemble.transitionHighPairLow,
    'novelty.numberRarity': row.novelty.numberRarity,
    'novelty.pairRarity': row.novelty.pairRarity,
    'novelty.tripleRarity': row.novelty.tripleRarity,
    'novelty.bandRarity': row.novelty.bandRarity,
    'distance.averageOverlap': row.baselineDistance.averageOverlap,
    'distance.nearestOverlap': row.baselineDistance.nearestTop100Overlap,
    'distance.bandProfile': row.baselineDistance.bandProfileDistance,
    'distance.rankProfile': row.baselineDistance.rankProfileDistance,
  };
}

function compareGroups(
  opportunities: readonly Phase4BOpportunityCase[],
): Phase4BGroupFeatureComparison[] {
  const groups: readonly Phase4BClassification[] = [
    'A_STRUCTURED_ONLY',
    'B_PAIR_ONLY',
    'C_BOTH_SUCCESS',
    'D_BOTH_FAILURE',
  ];
  return FEATURE_KEYS.map((feature) => ({
    feature,
    groups: Object.fromEntries(
      groups
        .map((group) => [
          group,
          distribution(
            opportunities
              .filter(({ classification }) => classification === group)
              .map(({ featureSummary }) => featureSummary[feature] ?? 0),
          ),
        ])
        .filter(([, value]) => (value as Phase4BDistribution).count > 0),
    ),
  }));
}

function analyzeSignals(
  opportunities: readonly Phase4BOpportunityCase[],
): Phase4BSignalCandidate[] {
  return FEATURE_KEYS.map((feature) => {
    const development = periodEffect(opportunities, 'development', feature);
    const historical = periodEffect(opportunities, 'historical-reference', feature);
    const sameDirection =
      development.direction !== 0 && development.direction === historical.direction;
    const moderateEffectBothPeriods =
      Math.abs(development.cliffsDelta) >= MODERATE_CLIFFS_DELTA &&
      Math.abs(historical.cliffsDelta) >= MODERATE_CLIFFS_DELTA;
    const unstableWhenRemoved = opportunities
      .filter((removed) => {
        const remaining = opportunities.filter(({ round }) => round !== removed.round);
        const developmentAfter = periodEffect(remaining, 'development', feature);
        const historicalAfter = periodEffect(
          remaining,
          'historical-reference',
          feature,
        );
        return !(
          developmentAfter.successCount > 0 &&
          developmentAfter.failureCount > 0 &&
          historicalAfter.successCount > 0 &&
          historicalAfter.failureCount > 0 &&
          developmentAfter.direction !== 0 &&
          developmentAfter.direction === historicalAfter.direction &&
          Math.abs(developmentAfter.cliffsDelta) >= MODERATE_CLIFFS_DELTA &&
          Math.abs(historicalAfter.cliffsDelta) >= MODERATE_CLIFFS_DELTA
        );
      })
      .map(({ round }) => round);
    return {
      feature,
      development,
      historical,
      sameDirection,
      moderateEffectBothPeriods,
      leaveOneOpportunityOutStable:
        sameDirection && moderateEffectBothPeriods && unstableWhenRemoved.length === 0,
      unstableWhenRemoved,
    };
  });
}

function periodEffect(
  opportunities: readonly Phase4BOpportunityCase[],
  period: Phase4BPeriod,
  feature: string,
): Phase4BPeriodEffect {
  const selected = opportunities.filter((opportunity) => opportunity.period === period);
  const success = selected
    .filter(({ classification }) => classification !== 'D_BOTH_FAILURE')
    .map(({ featureSummary }) => featureSummary[feature] ?? 0);
  const failure = selected
    .filter(({ classification }) => classification === 'D_BOTH_FAILURE')
    .map(({ featureSummary }) => featureSummary[feature] ?? 0);
  const successMedian = median(success);
  const failureMedian = median(failure);
  const medianDifference = successMedian - failureMedian;
  return {
    period,
    successCount: success.length,
    failureCount: failure.length,
    successMedian,
    failureMedian,
    medianDifference,
    cliffsDelta: cliffsDelta(success, failure),
    direction: sign(medianDifference),
  };
}

function buildPairRelationshipScores(
  known: readonly LottoDraw[],
): ReadonlyMap<string, number> {
  const raw = new Map<string, number>();
  known.forEach((draw, drawIndex) => {
    const age = known.length - 1 - drawIndex;
    const decay = 0.5 ** (age / 36);
    const recent = age < 48 ? 0.35 : 0;
    const weight = 0.65 * decay + recent;
    combinations(draw.numbers, 2).forEach((pair) => {
      const key = pair.join('-');
      raw.set(key, (raw.get(key) ?? 0) + weight);
    });
  });
  const maximum = Math.max(...raw.values(), 1e-9);
  return new Map([...raw].map(([key, value]) => [key, value / maximum]));
}

function orderFor(
  vectors: readonly CombinationVector[],
  strategy: CombinationStrategy,
): number[] {
  const scores = Float64Array.from(vectors, ({ features }) =>
    combinationScoreFor(features, strategy),
  );
  const keys = vectors.map(({ numbers }) => numbers.join('-'));
  return Array.from({ length: vectors.length }, (_, index) => index).sort(
    (left, right) =>
      scores[right]! - scores[left]! || keys[left]!.localeCompare(keys[right]!),
  );
}

function positionsFor(order: readonly number[]): Uint32Array {
  const result = new Uint32Array(order.length);
  order.forEach((vectorIndex, offset) => {
    result[vectorIndex] = offset + 1;
  });
  return result;
}

function selectedFlags(total: number, selected: readonly number[]): Uint8Array {
  const result = new Uint8Array(total);
  selected.forEach((index) => {
    result[index] = 1;
  });
  return result;
}

function phase4SelectorSeed(
  round: number,
  period: Phase4BPeriod,
  seed: number,
): number {
  const roundSeed = seed + round * 131 + 10_007;
  const experimentIndex = period === 'development' ? 4 : 1;
  return roundSeed + experimentIndex * 65_537;
}

function classify(pairHit: number, structuredHit: number): Phase4BClassification {
  const pair = pairHit >= 5;
  const structured = structuredHit >= 5;
  if (structured && !pair) return 'A_STRUCTURED_ONLY';
  if (pair && !structured) return 'B_PAIR_ONLY';
  if (pair && structured) return 'C_BOTH_SUCCESS';
  return 'D_BOTH_FAILURE';
}

function firstIndexAtLeast(
  order: readonly number[],
  hits: Uint8Array,
  threshold: 5 | 6,
): number | null {
  return order.find((index) => hits[index]! >= threshold) ?? null;
}

function firstRankAtLeast(
  order: readonly number[],
  hits: Uint8Array,
  threshold: 5 | 6,
): number | null {
  const offset = order.findIndex((index) => hits[index]! >= threshold);
  return offset < 0 ? null : offset + 1;
}

function indicesAtLeast(hits: Uint8Array, threshold: 4 | 5): number[] {
  const result: number[] = [];
  hits.forEach((hit, index) => {
    if (hit >= threshold) result.push(index);
  });
  return result;
}

function maxHit(selected: readonly number[], hits: Uint8Array): number {
  return selected.reduce((maximum, index) => Math.max(maximum, hits[index]!), 0);
}

function formatWinnerBandProfile(ranks: readonly number[]): string {
  const counts = [0, 0, 0, 0, 0];
  ranks.forEach((rank) => {
    const index = rank <= 20 ? bandOf(rank) : 4;
    counts[index] = counts[index]! + 1;
  });
  return `A${counts[0]}-B${counts[1]}-C${counts[2]}-D${counts[3]}-X${counts[4]}`;
}

function bandCountsFor(ranks: readonly number[]): [number, number, number, number] {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  ranks.forEach((rank) => {
    counts[bandOf(rank)] += 1;
  });
  return counts;
}

function formatBandProfile(counts: readonly number[]): string {
  return `A${counts[0]}-B${counts[1]}-C${counts[2]}-D${counts[3]}`;
}

function formatRankProfile(ranks: readonly number[]): string {
  const average = mean(ranks);
  const deviation = standardDeviation(ranks);
  return [
    `T5${ranks.filter((rank) => rank <= 5).length}`,
    `T10${ranks.filter((rank) => rank <= 10).length}`,
    `B5${ranks.filter((rank) => rank >= 16).length}`,
    `M${Math.floor((average - 1) / 4)}`,
    `S${Math.floor(deviation / 2)}`,
  ].join('-');
}

function bandOf(rank: number): 0 | 1 | 2 | 3 {
  return Math.min(3, Math.floor((rank - 1) / 5)) as 0 | 1 | 2 | 3;
}

function rankPairs(ranks: readonly number[]): number[] {
  return combinations(ranks, 2).map(([left, right]) => pairIndex(left!, right!));
}

function pairIndex(left: number, right: number): number {
  const index = RANK_PAIR_INDEX[left]?.[right];
  if (index === undefined || index < 0) {
    throw new Error(`Invalid rank pair ${left}-${right}.`);
  }
  return index;
}

function buildRankPairIndex(): number[][] {
  const result = Array.from({ length: 21 }, () => new Array<number>(21).fill(-1));
  let index = 0;
  for (let left = 1; left <= 20; left += 1) {
    for (let right = left + 1; right <= 20; right += 1) {
      result[left]![right] = index;
      result[right]![left] = index;
      index += 1;
    }
  }
  return result;
}

function combinations(values: readonly number[], size: number): number[][] {
  const result: number[][] = [];
  const selected: number[] = [];
  const visit = (start: number) => {
    if (selected.length === size) {
      result.push([...selected]);
      return;
    }
    const remaining = size - selected.length;
    for (let index = start; index <= values.length - remaining; index += 1) {
      selected.push(values[index]!);
      visit(index + 1);
      selected.pop();
    }
  };
  visit(0);
  return result;
}

function addCount(target: Map<string, number>, key: string): void {
  target.set(key, (target.get(key) ?? 0) + 1);
}

function averageOverlap(
  sourceRanks: readonly number[],
  numberCounts: readonly number[],
): number {
  return (
    sourceRanks.reduce((sum, rank) => sum + (numberCounts[rank - 1] ?? 0), 0) / TOP100
  );
}

function maximumOverlap(mask: number, masks: readonly number[]): number {
  return masks.reduce((maximum, other) => Math.max(maximum, popcount(mask & other)), 0);
}

function percentile(rank: number, total: number): number {
  return total <= 1 ? 1 : (total - rank) / (total - 1);
}

function topShare(values: readonly number[], count: number): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  return (
    [...values]
      .sort((left, right) => right - left)
      .slice(0, count)
      .reduce((sum, value) => sum + value, 0) / total
  );
}

function distribution(values: readonly number[]): Phase4BDistribution {
  if (values.length === 0) {
    return { count: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0 };
  }
  return {
    count: values.length,
    median: quantile(values, 0.5),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function stageSummary(values: readonly number[]): {
  fourPlus: number;
  fivePlus: number;
  six: number;
} {
  return {
    fourPlus: values.filter((value) => value >= 4).length,
    fivePlus: values.filter((value) => value >= 5).length,
    six: values.filter((value) => value >= 6).length,
  };
}

function assertFrozenRegression(
  regression: CandidatePhase4BFailureAnalysisResult['regression'],
): void {
  const actual = JSON.stringify(regression);
  const expected = JSON.stringify({
    development: {
      candidate: { fourPlus: 54, fivePlus: 14, six: 1 },
      pair: { fourPlus: 13, fivePlus: 0, six: 0 },
      structured: { fourPlus: 24, fivePlus: 2, six: 0 },
    },
    historical: {
      candidate: { fourPlus: 29, fivePlus: 4, six: 0 },
      pair: { fourPlus: 4, fivePlus: 1, six: 0 },
      structured: { fourPlus: 12, fivePlus: 0, six: 0 },
    },
  });
  if (actual !== expected) {
    throw new Error(
      `Phase 4 regression changed. expected=${expected} actual=${actual}`,
    );
  }
}

function validateInputDraws(draws: readonly LottoDraw[]): void {
  const maximumRound = Math.max(...draws.map(({ round }) => round));
  if (maximumRound < HISTORICAL_RANGE[1] || maximumRound < DEVELOPMENT_RANGE[1]) {
    throw new Error('Phase 4B requires draws through round 1235.');
  }
}

function cliffsDelta(left: readonly number[], right: readonly number[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  let greater = 0;
  let lower = 0;
  left.forEach((leftValue) => {
    right.forEach((rightValue) => {
      if (leftValue > rightValue) greater += 1;
      if (leftValue < rightValue) lower += 1;
    });
  });
  return (greater - lower) / (left.length * right.length);
}

function quantile(values: readonly number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentileValue;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const fraction = position - lower;
  return sorted[lower]! * (1 - fraction) + sorted[upper]! * fraction;
}

function median(values: readonly number[]): number {
  return quantile(values, 0.5);
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: readonly number[]): number {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function gini(values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0 || values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function normalizedEntropy(values: readonly number[]): number {
  const positive = values.filter((value) => value > 0);
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (positive.length <= 1 || total === 0) return 0;
  const entropy = -positive.reduce((sum, value) => {
    const probability = value / total;
    return sum + probability * Math.log(probability);
  }, 0);
  return entropy / Math.log(values.length);
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function sign(value: number): -1 | 0 | 1 {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

function popcount(value: number): number {
  let remaining = value >>> 0;
  remaining -= (remaining >>> 1) & 0x55555555;
  remaining = (remaining & 0x33333333) + ((remaining >>> 2) & 0x33333333);
  return (((remaining + (remaining >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function hash32(value: number): number {
  let result = value >>> 0;
  result ^= result >>> 16;
  result = Math.imul(result, 0x7feb352d);
  result ^= result >>> 15;
  result = Math.imul(result, 0x846ca68b);
  result ^= result >>> 16;
  return result >>> 0;
}
