import type { LottoDraw } from '../types';
import {
  buildFrozenPhase3CandidateRoundDiagnostic,
  type CandidateRankingId,
  type CandidateRoundDiagnostic,
} from './candidatePhase2';
import {
  ablationStrategies,
  buildCombinationAnalysis,
  buildCombinationVectorSample,
  combinationFeatureKeys,
  combinationScoreFor,
  mainCombinationStrategies,
  scoreContributionFor,
  type CombinationFeatureVector,
  type CombinationScoreContribution,
  type CombinationStrategy,
  type CombinationVector,
} from './combination';
import { resolveBacktestRoundRange } from './backtest';

export type Phase3CandidateSource = 'current' | 'decay' | 'grid-transition';

export const phase3CandidateSources: readonly Phase3CandidateSource[] = [
  'current',
  'decay',
  'grid-transition',
];

export const phase3CombinationStrategies: readonly CombinationStrategy[] = [
  ...mainCombinationStrategies,
  ...ablationStrategies,
];

export interface CandidatePhase3Options {
  startRound: number;
  endRound: number;
  poolSize: 20;
  seed: number;
  monteCarloRuns: number;
  featureSamplesPerRound: number;
}

export interface Phase3Distribution {
  count: number;
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  max: number;
}

export interface Phase3PipelineStageSummary {
  fourPlus: number;
  fivePlus: number;
  six: number;
}

export interface Phase3BranchSupportFeatures {
  sourceRankMean: number;
  sourceRankMedian: number;
  sourceRankMin: number;
  sourceRankMax: number;
  sourceRankVariance: number;
  sourcePercentileMean: number;
  sourcePercentileWorst: number;
}

export interface Phase3RankingRoundDiagnostic {
  round: number;
  candidateSource: Phase3CandidateSource;
  candidateRecall: number;
  winningNumberRanks: readonly number[];
  rankingStrategy: CombinationStrategy;
  bestMaxHitRank: number | null;
  best4HitRank: number | null;
  best5HitRank: number | null;
  best6HitRank: number | null;
  median4HitRank: number | null;
  median5HitRank: number | null;
  top100MaxHit: number;
  top10MaxHit: number;
  branchSupportFeatures: Phase3BranchSupportFeatures | null;
  featureContributions: CombinationScoreContribution | null;
}

export interface Phase3RankingMatrixEntry {
  candidateSource: Phase3CandidateSource;
  rankingStrategy: CombinationStrategy;
  candidate: Phase3PipelineStageSummary;
  generation: Phase3PipelineStageSummary;
  top100: Phase3PipelineStageSummary;
  top10: Phase3PipelineStageSummary;
  preservation: {
    fourPlus: number;
    fivePlus: number;
    six: number;
  };
  best4HitRank: Phase3Distribution;
  best5HitRank: Phase3Distribution;
  best6HitRank: Phase3Distribution;
  median4HitRank: Phase3Distribution;
  median5HitRank: Phase3Distribution;
  blocks: readonly Phase3BlockSummary[];
  conditionalLift: {
    top100FivePlus: number;
    top100Six: number;
    top10FivePlus: number;
    top10Six: number;
  };
}

export interface Phase3BlockSummary {
  block: 'A' | 'B' | 'C' | 'D';
  startRound: number;
  endRound: number;
  top100FourPlus: number;
  top100FivePlus: number;
  top100Six: number;
}

export interface Phase3RandomSelectionSummary {
  eligibleRounds: number;
  exactMeanRate: number;
  monteCarloRate: Phase3Distribution;
}

export interface Phase3ConditionalRandomBaseline {
  candidateSource: Phase3CandidateSource;
  runs: number;
  seed: number;
  top100: {
    fourPlus: Phase3RandomSelectionSummary;
    fivePlus: Phase3RandomSelectionSummary;
    six: Phase3RandomSelectionSummary;
  };
  top10: {
    fourPlus: Phase3RandomSelectionSummary;
    fivePlus: Phase3RandomSelectionSummary;
    six: Phase3RandomSelectionSummary;
  };
}

export type Phase3FeatureName = keyof CombinationFeatureVector | 'transitionFinalScore';

export interface Phase3FeatureDistribution {
  sampleMethod: 'deterministic-systematic' | 'all-opportunity-combinations';
  sampleSize: number;
  features: Record<Phase3FeatureName, Phase3Distribution>;
}

export interface Phase3OpportunityDiagnostic {
  round: number;
  candidateSource: Phase3CandidateSource;
  candidateRecall: number;
  winningNumberRanks: readonly number[];
  strategies: readonly Phase3RankingRoundDiagnostic[];
}

export interface Phase3ExistingRankingGate {
  candidateSource: Phase3CandidateSource;
  rankingStrategy: CombinationStrategy;
  gateA_decayFivePreserved: boolean;
  gateB_gridSixPreservedOrRankShift: boolean;
  gateC_fourPlusMaintained: boolean;
  gateD_multipleOpportunityRanksImproved: boolean;
  gateDImprovedRounds: number;
  randomConditionalLift: boolean;
  result: 'KEEP' | 'REJECT' | 'BASELINE';
  reason: string;
}

export interface CandidatePhase3CompatibilityResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  tuningAllowed: true;
  options: CandidatePhase3Options;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  candidateCombinationCompatibility: {
    sources: Record<Phase3CandidateSource, Phase3PipelineStageSummary>;
    rankingMatrix: readonly Phase3RankingMatrixEntry[];
    branchDiagnostics: readonly Phase3OpportunityDiagnostic[];
    conditionalRandomBaseline: readonly Phase3ConditionalRandomBaseline[];
    sourceFeatureDistributions: Record<
      Phase3CandidateSource,
      Phase3FeatureDistribution
    >;
    opportunityFeatureDistributions: Record<string, Phase3FeatureDistribution>;
    rankingScoreCalibration: Record<
      Phase3CandidateSource,
      Record<CombinationStrategy, Phase3Distribution>
    >;
    existingRankingGates: readonly Phase3ExistingRankingGate[];
    sourceAwareExperiments: readonly [];
    branchTop100: readonly Phase3RankingMatrixEntry[];
    mergedResearch: null;
    finalPortfolio: null;
  };
}

interface RankedRoundResult extends Phase3RankingRoundDiagnostic {
  bestTargetVectorIndex: number | null;
}

interface SourceRoundState {
  round: number;
  recall: number;
  combinationHitCounts: readonly [number, number, number];
}

interface SampleAccumulator {
  values: Record<Phase3FeatureName, number[]>;
}

const TOTAL_COMBINATIONS = 38_760;
const TOP100 = 100;
const TOP10 = 10;
const DEFAULT_SEED = 20_260_807;
const SOURCE_RANKING: Record<Phase3CandidateSource, CandidateRankingId> = {
  current: 'current',
  decay: 'decay',
  'grid-transition': 'grid-transition',
};
const FEATURE_NAMES: readonly Phase3FeatureName[] = [
  ...combinationFeatureKeys,
  'transitionFinalScore',
];

export function runCandidatePhase3Compatibility(
  draws: readonly LottoDraw[],
  requested: Partial<CandidatePhase3Options> = {},
  onProgress?: (
    completed: number,
    total: number,
    round: number,
    source: Phase3CandidateSource,
  ) => void,
): CandidatePhase3CompatibilityResult {
  const options = sanitizeOptions(requested);
  if (options.startRound !== 1044 || options.endRound !== 1235) {
    throw new Error(
      'Phase 3 Compatibility 선택과 실험은 Development 1044–1235에서만 실행해요.',
    );
  }
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: options.startRound,
    endRound: options.endRound,
    poolSize: options.poolSize,
  });
  const sourceRecalls = Object.fromEntries(
    phase3CandidateSources.map((source) => [source, [] as number[]]),
  ) as Record<Phase3CandidateSource, number[]>;
  const sourceStates = Object.fromEntries(
    phase3CandidateSources.map((source) => [source, [] as SourceRoundState[]]),
  ) as Record<Phase3CandidateSource, SourceRoundState[]>;
  const matrixRounds = new Map<string, Phase3RankingRoundDiagnostic[]>();
  const sourceFeatures = Object.fromEntries(
    phase3CandidateSources.map((source) => [source, newSampleAccumulator()]),
  ) as Record<Phase3CandidateSource, SampleAccumulator>;
  const opportunityFeatures = new Map<string, SampleAccumulator>();
  const scoreCalibration = Object.fromEntries(
    phase3CandidateSources.map((source) => [
      source,
      Object.fromEntries(
        phase3CombinationStrategies.map((strategy) => [strategy, [] as number[]]),
      ),
    ]),
  ) as Record<Phase3CandidateSource, Record<CombinationStrategy, number[]>>;
  const opportunities: Phase3OpportunityDiagnostic[] = [];
  let completed = 0;
  const total = range.evaluatedRounds * phase3CandidateSources.length;

  for (
    let historyIndex = range.startHistoryIndex;
    historyIndex <= range.endHistoryIndex;
    historyIndex += 1
  ) {
    const actual = draws[historyIndex + 1]!;
    const candidateRound = buildFrozenPhase3CandidateRoundDiagnostic(
      draws,
      historyIndex,
      actual,
    );

    for (const source of phase3CandidateSources) {
      const analyzed = analyzeCandidateCombinationRound(
        draws,
        historyIndex,
        candidateRound,
        source,
        phase3CombinationStrategies,
        options.featureSamplesPerRound,
      );
      sourceRecalls[source].push(analyzed.candidateRecall);
      sourceStates[source].push({
        round: analyzed.round,
        recall: analyzed.candidateRecall,
        combinationHitCounts: hitCountsForRecall(analyzed.candidateRecall),
      });
      sampleSourceDistributions(
        analyzed.vectors,
        analyzed.hits,
        source,
        sourceFeatures[source],
        opportunityFeatures,
        scoreCalibration[source],
        options.featureSamplesPerRound,
      );
      analyzed.strategies.forEach((diagnostic) => {
        const key = matrixKey(source, diagnostic.rankingStrategy);
        const stored = matrixRounds.get(key) ?? [];
        stored.push(stripInternalDiagnostic(diagnostic));
        matrixRounds.set(key, stored);
      });
      if (analyzed.candidateRecall >= 5) {
        opportunities.push({
          round: analyzed.round,
          candidateSource: source,
          candidateRecall: analyzed.candidateRecall,
          winningNumberRanks: analyzed.winningNumberRanks,
          strategies: analyzed.strategies.map(stripInternalDiagnostic),
        });
      }
      completed += 1;
      onProgress?.(completed, total, actual.round, source);
    }
  }

  const conditionalRandomBaseline = phase3CandidateSources.map((source, index) =>
    buildConditionalRandomBaseline(
      source,
      sourceStates[source],
      options.monteCarloRuns,
      options.seed + index * 10_007,
    ),
  );
  const randomBySource = Object.fromEntries(
    conditionalRandomBaseline.map((baseline) => [baseline.candidateSource, baseline]),
  ) as Record<Phase3CandidateSource, Phase3ConditionalRandomBaseline>;
  const sourceSummaries = Object.fromEntries(
    phase3CandidateSources.map((source) => [
      source,
      stageSummary(sourceRecalls[source]),
    ]),
  ) as Record<Phase3CandidateSource, Phase3PipelineStageSummary>;
  const rankingMatrix = phase3CandidateSources.flatMap((source) =>
    phase3CombinationStrategies.map((strategy) =>
      summarizeMatrixEntry(
        source,
        strategy,
        sourceSummaries[source],
        matrixRounds.get(matrixKey(source, strategy)) ?? [],
        randomBySource[source],
        options.startRound,
        options.endRound,
      ),
    ),
  );
  const existingRankingGates = evaluateExistingRankingGates(
    rankingMatrix,
    matrixRounds,
  );
  const keptKeys = new Set(
    existingRankingGates
      .filter(({ result }) => result === 'KEEP' || result === 'BASELINE')
      .map(({ candidateSource, rankingStrategy }) =>
        matrixKey(candidateSource, rankingStrategy),
      ),
  );

  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tuningAllowed: true,
    options,
    startRound: options.startRound,
    endRound: options.endRound,
    evaluatedRounds: range.evaluatedRounds,
    candidateCombinationCompatibility: {
      sources: sourceSummaries,
      rankingMatrix,
      branchDiagnostics: opportunities,
      conditionalRandomBaseline,
      sourceFeatureDistributions: Object.fromEntries(
        phase3CandidateSources.map((source) => [
          source,
          finishFeatureDistribution(sourceFeatures[source], 'deterministic-systematic'),
        ]),
      ) as Record<Phase3CandidateSource, Phase3FeatureDistribution>,
      opportunityFeatureDistributions: Object.fromEntries(
        [...opportunityFeatures.entries()].map(([key, accumulator]) => [
          key,
          finishFeatureDistribution(accumulator, 'all-opportunity-combinations'),
        ]),
      ),
      rankingScoreCalibration: Object.fromEntries(
        phase3CandidateSources.map((source) => [
          source,
          Object.fromEntries(
            phase3CombinationStrategies.map((strategy) => [
              strategy,
              distribution(scoreCalibration[source][strategy]),
            ]),
          ),
        ]),
      ) as Record<
        Phase3CandidateSource,
        Record<CombinationStrategy, Phase3Distribution>
      >,
      existingRankingGates,
      sourceAwareExperiments: [],
      branchTop100: rankingMatrix.filter(({ candidateSource, rankingStrategy }) =>
        keptKeys.has(matrixKey(candidateSource, rankingStrategy)),
      ),
      mergedResearch: null,
      finalPortfolio: null,
    },
  };
}

export function analyzeCandidateCombinationRound(
  draws: readonly LottoDraw[],
  historyIndex: number,
  candidateRound: CandidateRoundDiagnostic,
  source: Phase3CandidateSource,
  strategies: readonly CombinationStrategy[],
  featureSampleCount = 512,
): {
  round: number;
  candidateRecall: number;
  winningNumberRanks: readonly number[];
  vectors: readonly CombinationVector[];
  hits: Uint8Array;
  strategies: readonly RankedRoundResult[];
} {
  const ranking = candidateRound.rankings[SOURCE_RANKING[source]];
  if (ranking === undefined) {
    throw new Error(
      `Candidate round ${candidateRound.round} does not include ${source}.`,
    );
  }
  const actual = draws[historyIndex + 1];
  if (actual === undefined || actual.round !== candidateRound.round) {
    throw new Error(`Round ${candidateRound.round} is not aligned with its history.`);
  }
  const vectors =
    ranking.recall >= 4
      ? completeOpportunityVectors(draws, historyIndex, ranking.top20)
      : buildCombinationVectorSample(
          draws,
          historyIndex,
          20,
          ranking.top20,
          featureSampleCount,
        ).vectors;
  const winning = new Set(actual.numbers);
  const hits = Uint8Array.from(
    vectors.map(({ numbers }) =>
      numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
    ),
  );
  const rankPositions = Object.fromEntries(
    candidateRound.numbers.map(({ number, ranks }) => [
      number,
      ranks[SOURCE_RANKING[source]] ?? 45,
    ]),
  ) as Record<number, number>;
  const ranked =
    ranking.recall < 4
      ? strategies.map((strategy) =>
          emptyRankingDiagnostic(
            candidateRound.round,
            source,
            ranking.recall,
            ranking.winningRanks,
            strategy,
          ),
        )
      : strategies.map((strategy) =>
          rankRound(
            vectors,
            hits,
            rankPositions,
            candidateRound.round,
            source,
            ranking.recall,
            ranking.winningRanks,
            strategy,
          ),
        );
  return {
    round: candidateRound.round,
    candidateRecall: ranking.recall,
    winningNumberRanks: ranking.winningRanks,
    vectors,
    hits,
    strategies: ranked,
  };
}

function completeOpportunityVectors(
  draws: readonly LottoDraw[],
  historyIndex: number,
  candidateTop20: readonly number[],
): readonly CombinationVector[] {
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
      `Phase 3 requires complete Top20 enumeration; got ${analysis.rawCombinationCount}.`,
    );
  }
  return analysis.generatedCombinations;
}

function rankRound(
  vectors: readonly CombinationVector[],
  hits: Uint8Array,
  sourceRanks: Record<number, number>,
  round: number,
  source: Phase3CandidateSource,
  candidateRecall: number,
  winningRanks: readonly number[],
  strategy: CombinationStrategy,
): RankedRoundResult {
  const scores = Float64Array.from(vectors, ({ features }) =>
    combinationScoreFor(features, strategy),
  );
  const order = Array.from({ length: vectors.length }, (_, index) => index).sort(
    (left, right) => scores[right]! - scores[left]! || left - right,
  );
  const fourRanks: number[] = [];
  const fiveRanks: number[] = [];
  let best4: number | null = null;
  let best5: number | null = null;
  let best6: number | null = null;
  let bestMax: number | null = null;
  let bestTargetVectorIndex: number | null = null;
  let top100MaxHit = 0;
  let top10MaxHit = 0;
  const maximumReachable = Math.min(candidateRecall, 6);

  order.forEach((vectorIndex, offset) => {
    const rank = offset + 1;
    const hit = hits[vectorIndex]!;
    if (rank <= TOP100) top100MaxHit = Math.max(top100MaxHit, hit);
    if (rank <= TOP10) top10MaxHit = Math.max(top10MaxHit, hit);
    if (hit >= 4) {
      best4 ??= rank;
      fourRanks.push(rank);
    }
    if (hit >= 5) {
      best5 ??= rank;
      fiveRanks.push(rank);
    }
    if (hit >= 6) best6 ??= rank;
    if (hit >= maximumReachable && bestMax === null) {
      bestMax = rank;
      bestTargetVectorIndex = vectorIndex;
    }
  });
  const target =
    bestTargetVectorIndex === null ? null : (vectors[bestTargetVectorIndex] ?? null);
  return {
    round,
    candidateSource: source,
    candidateRecall,
    winningNumberRanks: winningRanks,
    rankingStrategy: strategy,
    bestMaxHitRank: bestMax,
    best4HitRank: best4,
    best5HitRank: best5,
    best6HitRank: best6,
    median4HitRank: nullableMedian(fourRanks),
    median5HitRank: nullableMedian(fiveRanks),
    top100MaxHit,
    top10MaxHit,
    branchSupportFeatures:
      target === null ? null : branchSupportFeatures(target.numbers, sourceRanks),
    featureContributions:
      target === null ? null : scoreContributionFor(target.features, strategy),
    bestTargetVectorIndex,
  };
}

function emptyRankingDiagnostic(
  round: number,
  source: Phase3CandidateSource,
  candidateRecall: number,
  winningRanks: readonly number[],
  strategy: CombinationStrategy,
): RankedRoundResult {
  return {
    round,
    candidateSource: source,
    candidateRecall,
    winningNumberRanks: winningRanks,
    rankingStrategy: strategy,
    bestMaxHitRank: null,
    best4HitRank: null,
    best5HitRank: null,
    best6HitRank: null,
    median4HitRank: null,
    median5HitRank: null,
    top100MaxHit: 0,
    top10MaxHit: 0,
    branchSupportFeatures: null,
    featureContributions: null,
    bestTargetVectorIndex: null,
  };
}

function summarizeMatrixEntry(
  source: Phase3CandidateSource,
  strategy: CombinationStrategy,
  candidate: Phase3PipelineStageSummary,
  rounds: readonly Phase3RankingRoundDiagnostic[],
  random: Phase3ConditionalRandomBaseline,
  startRound: number,
  endRound: number,
): Phase3RankingMatrixEntry {
  const top100 = stageSummary(rounds.map(({ top100MaxHit }) => top100MaxHit));
  const top10 = stageSummary(rounds.map(({ top10MaxHit }) => top10MaxHit));
  return {
    candidateSource: source,
    rankingStrategy: strategy,
    candidate,
    generation: candidate,
    top100,
    top10,
    preservation: {
      fourPlus: ratio(top100.fourPlus, candidate.fourPlus),
      fivePlus: ratio(top100.fivePlus, candidate.fivePlus),
      six: ratio(top100.six, candidate.six),
    },
    best4HitRank: distribution(nonNull(rounds.map(({ best4HitRank }) => best4HitRank))),
    best5HitRank: distribution(nonNull(rounds.map(({ best5HitRank }) => best5HitRank))),
    best6HitRank: distribution(nonNull(rounds.map(({ best6HitRank }) => best6HitRank))),
    median4HitRank: distribution(
      nonNull(rounds.map(({ median4HitRank }) => median4HitRank)),
    ),
    median5HitRank: distribution(
      nonNull(rounds.map(({ median5HitRank }) => median5HitRank)),
    ),
    blocks: blockSummaries(rounds, startRound, endRound),
    conditionalLift: {
      top100FivePlus: ratio(
        ratio(top100.fivePlus, candidate.fivePlus),
        random.top100.fivePlus.exactMeanRate,
      ),
      top100Six: ratio(
        ratio(top100.six, candidate.six),
        random.top100.six.exactMeanRate,
      ),
      top10FivePlus: ratio(
        ratio(top10.fivePlus, candidate.fivePlus),
        random.top10.fivePlus.exactMeanRate,
      ),
      top10Six: ratio(ratio(top10.six, candidate.six), random.top10.six.exactMeanRate),
    },
  };
}

function buildConditionalRandomBaseline(
  source: Phase3CandidateSource,
  states: readonly SourceRoundState[],
  runs: number,
  seed: number,
): Phase3ConditionalRandomBaseline {
  const summarize = (picks: number, thresholdOffset: 0 | 1 | 2) => {
    const eligible = states.filter(({ recall }) => recall >= thresholdOffset + 4);
    const probabilities = eligible.map(({ combinationHitCounts }) =>
      probabilityAtLeastOne(
        TOTAL_COMBINATIONS,
        combinationHitCounts[thresholdOffset],
        picks,
      ),
    );
    const random = mulberry32(seed + picks * 97 + thresholdOffset * 997);
    const rates = Array.from({ length: runs }, () =>
      mean(probabilities.map((probability) => Number(random() < probability))),
    );
    return {
      eligibleRounds: eligible.length,
      exactMeanRate: mean(probabilities),
      monteCarloRate: distribution(rates),
    };
  };
  return {
    candidateSource: source,
    runs,
    seed,
    top100: {
      fourPlus: summarize(TOP100, 0),
      fivePlus: summarize(TOP100, 1),
      six: summarize(TOP100, 2),
    },
    top10: {
      fourPlus: summarize(TOP10, 0),
      fivePlus: summarize(TOP10, 1),
      six: summarize(TOP10, 2),
    },
  };
}

function sampleSourceDistributions(
  vectors: readonly CombinationVector[],
  hits: Uint8Array,
  source: Phase3CandidateSource,
  sourceAccumulator: SampleAccumulator,
  opportunityAccumulators: Map<string, SampleAccumulator>,
  scoreCalibration: Record<CombinationStrategy, number[]>,
  requestedSamples: number,
): void {
  const sampleCount = Math.min(requestedSamples, vectors.length);
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const index = Math.min(
      Math.floor(((sample + 0.5) * vectors.length) / sampleCount),
      vectors.length - 1,
    );
    const vector = vectors[index]!;
    appendFeatures(sourceAccumulator, vector.features);
    phase3CombinationStrategies.forEach((strategy) => {
      scoreCalibration[strategy].push(combinationScoreFor(vector.features, strategy));
    });
  }
  vectors.forEach((vector, index) => {
    const hit = hits[index]!;
    if (hit < 4) return;
    const key = `${source}:${hit}-hit`;
    const accumulator = opportunityAccumulators.get(key) ?? newSampleAccumulator();
    appendFeatures(accumulator, vector.features);
    opportunityAccumulators.set(key, accumulator);
  });
}

function appendFeatures(
  accumulator: SampleAccumulator,
  features: CombinationFeatureVector,
): void {
  combinationFeatureKeys.forEach((feature) => {
    accumulator.values[feature].push(features[feature]);
  });
  accumulator.values.transitionFinalScore.push(
    combinationScoreFor(features, 'transition'),
  );
}

function newSampleAccumulator(): SampleAccumulator {
  return {
    values: Object.fromEntries(
      FEATURE_NAMES.map((feature) => [feature, [] as number[]]),
    ) as Record<Phase3FeatureName, number[]>,
  };
}

function finishFeatureDistribution(
  accumulator: SampleAccumulator,
  sampleMethod: Phase3FeatureDistribution['sampleMethod'],
): Phase3FeatureDistribution {
  return {
    sampleMethod,
    sampleSize: accumulator.values.individualNumberScore.length,
    features: Object.fromEntries(
      FEATURE_NAMES.map((feature) => [
        feature,
        distribution(accumulator.values[feature]),
      ]),
    ) as Record<Phase3FeatureName, Phase3Distribution>,
  };
}

function evaluateExistingRankingGates(
  matrix: readonly Phase3RankingMatrixEntry[],
  matrixRounds: ReadonlyMap<string, readonly Phase3RankingRoundDiagnostic[]>,
): Phase3ExistingRankingGate[] {
  const entry = (source: Phase3CandidateSource, strategy: CombinationStrategy) => {
    const found = matrix.find(
      (candidate) =>
        candidate.candidateSource === source && candidate.rankingStrategy === strategy,
    );
    if (found === undefined)
      throw new Error(`Missing matrix entry ${source}/${strategy}.`);
    return found;
  };
  return phase3CandidateSources.flatMap((source) => {
    const baseline = entry(source, 'transition');
    return phase3CombinationStrategies.map((strategy) => {
      const candidate = entry(source, strategy);
      const gateA =
        source !== 'decay' ||
        (candidate.top100.fivePlus > 0 && candidate.conditionalLift.top100FivePlus > 1);
      const gateB =
        source !== 'grid-transition' ||
        candidate.top100.six > 0 ||
        (candidate.best6HitRank.count > 0 &&
          candidate.best6HitRank.median < TOTAL_COMBINATIONS / 4);
      const gateC =
        candidate.top100.fourPlus >= Math.max(0, baseline.top100.fourPlus - 1);
      const improvedRounds = rankImprovementCount(
        matrixRounds.get(matrixKey(source, strategy)) ?? [],
        matrixRounds.get(matrixKey(source, 'transition')) ?? [],
        source,
      );
      const gateD =
        source === 'current' ||
        improvedRounds >= 2 ||
        (strategy === 'transition' &&
          ((source === 'decay' && candidate.top100.fivePlus > 0) ||
            (source === 'grid-transition' && candidate.top100.six > 0)));
      const randomLift =
        source === 'current' ||
        (source === 'decay'
          ? candidate.conditionalLift.top100FivePlus > 1
          : candidate.conditionalLift.top100Six > 1);
      const isBaseline = source === 'current' && strategy === 'transition';
      const keep =
        !isBaseline &&
        source !== 'current' &&
        gateA &&
        gateB &&
        gateC &&
        gateD &&
        randomLift;
      return {
        candidateSource: source,
        rankingStrategy: strategy,
        gateA_decayFivePreserved: gateA,
        gateB_gridSixPreservedOrRankShift: gateB,
        gateC_fourPlusMaintained: gateC,
        gateD_multipleOpportunityRanksImproved: gateD,
        gateDImprovedRounds: improvedRounds,
        randomConditionalLift: randomLift,
        result: isBaseline ? 'BASELINE' : keep ? 'KEEP' : 'REJECT',
        reason: isBaseline
          ? 'Current + Transition 동결 운영 기준선'
          : keep
            ? 'Specialist Top100 보존, 4+ guardrail, 다중 Opportunity와 Random lift 통과'
            : `Gate ${[
                gateA ? null : 'A',
                gateB ? null : 'B',
                gateC ? null : 'C',
                gateD ? null : 'D',
                randomLift ? null : 'Random',
              ]
                .filter(Boolean)
                .join('/')} 미통과`,
      };
    });
  });
}

function rankImprovementCount(
  candidate: readonly Phase3RankingRoundDiagnostic[],
  baseline: readonly Phase3RankingRoundDiagnostic[],
  source: Phase3CandidateSource,
): number {
  if (source === 'current') return 0;
  const baselineByRound = new Map(baseline.map((round) => [round.round, round]));
  return candidate.filter((round) => {
    const reference = baselineByRound.get(round.round);
    if (reference === undefined) return false;
    const target =
      source === 'decay' || round.candidateRecall < 6 ? 'best5HitRank' : 'best6HitRank';
    const candidateRank = round[target];
    const baselineRank = reference[target];
    return (
      candidateRank !== null && baselineRank !== null && candidateRank < baselineRank
    );
  }).length;
}

function branchSupportFeatures(
  numbers: readonly number[],
  sourceRanks: Record<number, number>,
): Phase3BranchSupportFeatures {
  const ranks = numbers.map((number) => sourceRanks[number] ?? 45);
  const rankMean = mean(ranks);
  return {
    sourceRankMean: rankMean,
    sourceRankMedian: quantile(ranks, 0.5),
    sourceRankMin: Math.min(...ranks),
    sourceRankMax: Math.max(...ranks),
    sourceRankVariance: mean(ranks.map((rank) => (rank - rankMean) ** 2)),
    sourcePercentileMean: mean(ranks.map(rankPercentile)),
    sourcePercentileWorst: rankPercentile(Math.max(...ranks)),
  };
}

function blockSummaries(
  rounds: readonly Phase3RankingRoundDiagnostic[],
  startRound: number,
  endRound: number,
): Phase3BlockSummary[] {
  const labels = ['A', 'B', 'C', 'D'] as const;
  const size = Math.ceil((endRound - startRound + 1) / 4);
  return labels.map((block, blockIndex) => {
    const blockStart = startRound + blockIndex * size;
    const blockEnd = Math.min(endRound, blockStart + size - 1);
    const selected = rounds.filter(
      ({ round }) => round >= blockStart && round <= blockEnd,
    );
    const summary = stageSummary(selected.map(({ top100MaxHit }) => top100MaxHit));
    return {
      block,
      startRound: blockStart,
      endRound: blockEnd,
      top100FourPlus: summary.fourPlus,
      top100FivePlus: summary.fivePlus,
      top100Six: summary.six,
    };
  });
}

function hitCountsForRecall(recall: number): readonly [number, number, number] {
  const atLeast = (threshold: number) => {
    let total = 0;
    for (let hit = threshold; hit <= Math.min(recall, 6); hit += 1) {
      total += choose(recall, hit) * choose(20 - recall, 6 - hit);
    }
    return total;
  };
  return [atLeast(4), atLeast(5), atLeast(6)];
}

function probabilityAtLeastOne(
  population: number,
  successes: number,
  picks: number,
): number {
  if (successes <= 0 || picks <= 0) return 0;
  if (picks > population - successes) return 1;
  let none = 1;
  for (let index = 0; index < picks; index += 1) {
    none *= (population - successes - index) / (population - index);
  }
  return 1 - none;
}

function stageSummary(values: readonly number[]): Phase3PipelineStageSummary {
  return {
    fourPlus: values.filter((value) => value >= 4).length,
    fivePlus: values.filter((value) => value >= 5).length,
    six: values.filter((value) => value >= 6).length,
  };
}

function distribution(values: readonly number[]): Phase3Distribution {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      min: 0,
      p5: 0,
      p25: 0,
      p75: 0,
      p95: 0,
      max: 0,
    };
  }
  const average = mean(values);
  return {
    count: values.length,
    mean: average,
    median: quantile(values, 0.5),
    standardDeviation: Math.sqrt(mean(values.map((value) => (value - average) ** 2))),
    min: Math.min(...values),
    p5: quantile(values, 0.05),
    p25: quantile(values, 0.25),
    p75: quantile(values, 0.75),
    p95: quantile(values, 0.95),
    max: Math.max(...values),
  };
}

function quantile(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const fraction = position - lower;
  return sorted[lower]! * (1 - fraction) + sorted[upper]! * fraction;
}

function nullableMedian(values: readonly number[]): number | null {
  return values.length === 0 ? null : quantile(values, 0.5);
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function choose(total: number, selected: number): number {
  if (selected < 0 || selected > total) return 0;
  const k = Math.min(selected, total - selected);
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (total - k + index)) / index;
  }
  return Math.round(result);
}

function rankPercentile(rank: number): number {
  return 1 - (rank - 1) / 44;
}

function nonNull(values: readonly (number | null)[]): number[] {
  return values.filter((value): value is number => value !== null);
}

function matrixKey(
  source: Phase3CandidateSource,
  strategy: CombinationStrategy,
): string {
  return `${source}:${strategy}`;
}

function stripInternalDiagnostic(
  diagnostic: RankedRoundResult,
): Phase3RankingRoundDiagnostic {
  const { bestTargetVectorIndex, ...result } = diagnostic;
  void bestTargetVectorIndex;
  return result;
}

function sanitizeOptions(
  requested: Partial<CandidatePhase3Options>,
): CandidatePhase3Options {
  return {
    startRound: Math.floor(requested.startRound ?? 1044),
    endRound: Math.floor(requested.endRound ?? 1235),
    poolSize: 20,
    seed: Math.floor(requested.seed ?? DEFAULT_SEED),
    monteCarloRuns: Math.max(1000, Math.floor(requested.monteCarloRuns ?? 1000)),
    featureSamplesPerRound: Math.min(
      2048,
      Math.max(64, Math.floor(requested.featureSamplesPerRound ?? 512)),
    ),
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
