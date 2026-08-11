import type { LottoDraw } from '../types';
import { resolveBacktestRoundRange } from './backtest';
import {
  buildFrozenPhase3CandidateRoundDiagnostic,
  type CandidateRankingId,
} from './candidatePhase2';
import {
  buildCombinationAnalysis,
  combinationScoreFor,
  type CombinationStrategy,
  type CombinationVector,
} from './combination';
import type {
  Phase3CandidateSource,
  Phase3Distribution,
  Phase3PipelineStageSummary,
} from './candidatePhase3';

export type Phase4SpecialistSource = Exclude<Phase3CandidateSource, 'current'>;

export type Phase4ExperimentId =
  | 'P4_BASELINE'
  | 'P4_NUMBER_COVERAGE'
  | 'P4_NUMBER_BAND'
  | 'P4_NUMBER_BAND_PAIR'
  | 'P4_OVERLAP_LIMIT'
  | 'P4_WORST_RANK_BAND'
  | 'P4_RANK_PROFILE';

export const phase4ExperimentIds: readonly Phase4ExperimentId[] = [
  'P4_BASELINE',
  'P4_NUMBER_COVERAGE',
  'P4_NUMBER_BAND',
  'P4_NUMBER_BAND_PAIR',
  'P4_OVERLAP_LIMIT',
  'P4_WORST_RANK_BAND',
  'P4_RANK_PROFILE',
];

export interface CandidatePhase4CoverageOptions {
  startRound: number;
  endRound: number;
  poolSize: 20;
  seed: number;
  monteCarloRuns: number;
  greedySampleSize: number;
}

export interface Phase4NumberCoverage {
  appearancesByRank: readonly number[];
  uniqueNumberCoverage: number;
  minAppearance: number;
  maxAppearance: number;
  meanAppearance: number;
  standardDeviation: number;
  gini: number;
  normalizedEntropy: number;
  rankBandShares: readonly [number, number, number, number];
}

export interface Phase4PairCoverage {
  uniquePairCoverage: number;
  repeatedPairSlots: number;
  minAppearance: number;
  maxAppearance: number;
  meanAppearance: number;
  gini: number;
  normalizedEntropy: number;
  sameBandShare: number;
  crossBandShare: number;
}

export interface Phase4TripleCoverage {
  uniqueTripleCoverage: number;
  repeatedTripleSlots: number;
}

export interface Phase4PatternCoverage {
  uniquePatterns: number;
  normalizedEntropy: number;
}

export interface Phase4OverlapCoverage {
  pairs: number;
  distribution: readonly [number, number, number, number, number, number];
  overlap4PlusRate: number;
  overlap5PlusRate: number;
}

export interface Phase4CoverageDiagnostics {
  number: Phase4NumberCoverage;
  pair: Phase4PairCoverage;
  triple: Phase4TripleCoverage;
  rankBands: Phase4PatternCoverage;
  rankProfiles: Phase4PatternCoverage;
  overlap: Phase4OverlapCoverage;
}

export interface Phase4CoverageAggregate {
  rounds: number;
  meanAppearancesByRank: readonly number[];
  meanRankBandShares: readonly [number, number, number, number];
  uniqueNumberCoverage: Phase3Distribution;
  numberAppearanceStandardDeviation: Phase3Distribution;
  numberGini: Phase3Distribution;
  numberEntropy: Phase3Distribution;
  uniquePairCoverage: Phase3Distribution;
  pairGini: Phase3Distribution;
  pairEntropy: Phase3Distribution;
  uniqueTripleCoverage: Phase3Distribution;
  repeatedTripleSlots: Phase3Distribution;
  uniqueBandPatterns: Phase3Distribution;
  bandPatternEntropy: Phase3Distribution;
  uniqueRankProfiles: Phase3Distribution;
  rankProfileEntropy: Phase3Distribution;
  overlap4PlusRate: Phase3Distribution;
  overlap5PlusRate: Phase3Distribution;
}

export interface Phase4BestRanks {
  fourPlus: number | null;
  fivePlus: number | null;
  six: number | null;
}

export interface Phase4WinnerRankDiagnostic {
  round: number;
  source: Phase3CandidateSource;
  candidateRecall: number;
  winningRanks: readonly number[];
  winnerBandPattern: string;
  worstRank: number;
  rankMean: number;
  rankMedian: number;
  rankVariance: number;
}

export interface Phase4OpportunityExperimentRound {
  round: number;
  source: Phase4SpecialistSource;
  experimentId: Phase4ExperimentId;
  candidateRecall: number;
  winningRanks: readonly number[];
  winnerBandPattern: string;
  baselineBestRanks: Phase4BestRanks;
  structuredBestRanks: Phase4BestRanks;
  baselineTop100Hit: number;
  structuredTop100Hit: number;
  selectedCombinationCountContainingEachWinner: readonly number[];
  coverage: Phase4CoverageDiagnostics;
}

export interface Phase4BlockSummary {
  block: 'A' | 'B' | 'C' | 'D';
  startRound: number;
  endRound: number;
  top100FourPlus: number;
  top100FivePlus: number;
  top100Six: number;
  fivePlusRankImprovedRounds: number;
  targetRankImprovedRounds: number;
  targetPreservedOrImproved: boolean;
}

export interface Phase4SelectorGate {
  specialistPreservation: boolean;
  fourPlusGuardrail: boolean;
  rankDistributionImproved: boolean;
  randomLift: boolean;
  blockStability: boolean;
  conditionalRandomLift: number;
  coverageAwareRandomLift: number;
  improvedTargetRounds: number;
  stableBlocks: number;
}

export interface Phase4ExperimentSummary {
  source: Phase4SpecialistSource;
  experimentId: Phase4ExperimentId;
  candidate: Phase3PipelineStageSummary;
  top100: Phase3PipelineStageSummary;
  preservation: {
    fourPlus: number;
    fivePlus: number;
    six: number;
  };
  baselineBest5Rank: Phase3Distribution;
  structuredBest5Rank: Phase3Distribution;
  baselineBest6Rank: Phase3Distribution;
  structuredBest6Rank: Phase3Distribution;
  coverage: Phase4CoverageAggregate;
  blocks: readonly Phase4BlockSummary[];
  gate: Phase4SelectorGate;
  result: 'BASELINE' | 'KEEP' | 'REJECT';
  reason: string;
}

export interface Phase4RandomThresholdSummary {
  eligibleRounds: number;
  exactMeanRate: number;
  simpleMonteCarloMeanRate: number;
  simpleMonteCarloRoundRates: Phase3Distribution;
  coverageAwareMonteCarloMeanRate: number;
  coverageAwareMonteCarloRoundRates: Phase3Distribution;
}

export interface Phase4RandomBaseline {
  source: Phase3CandidateSource;
  runs: number;
  seed: number;
  top100: {
    fourPlus: Phase4RandomThresholdSummary;
    fivePlus: Phase4RandomThresholdSummary;
    six: Phase4RandomThresholdSummary;
  };
}

export interface Phase4WinnerRankSummary {
  source: Phase3CandidateSource;
  opportunities: number;
  bandPatternFrequency: readonly { pattern: string; count: number }[];
  worstRank: Phase3Distribution;
  rankMean: Phase3Distribution;
  rankMedian: Phase3Distribution;
  rankVariance: Phase3Distribution;
}

export interface CandidatePhase4CoverageResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  tuningAllowed: true;
  operatingAlgorithmFrozen: true;
  options: CandidatePhase4CoverageOptions;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  candidatePhase4Coverage: {
    development: {
      current: Phase3PipelineStageSummary;
      decay: Phase3PipelineStageSummary;
      gridTransition: Phase3PipelineStageSummary;
    };
    coverageDiagnostics: Record<Phase3CandidateSource, Phase4CoverageAggregate>;
    winnerRankBands: readonly Phase4WinnerRankSummary[];
    randomBaselines: readonly Phase4RandomBaseline[];
    experiments: readonly Phase4ExperimentSummary[];
    opportunityDetails: readonly Phase4OpportunityExperimentRound[];
    branchTop100: readonly Phase4ExperimentSummary[];
    gates: readonly {
      source: Phase4SpecialistSource;
      experimentId: Phase4ExperimentId;
      gate: Phase4SelectorGate;
      result: 'BASELINE' | 'KEEP' | 'REJECT';
    }[];
    selected: Record<Phase4SpecialistSource, Phase4ExperimentSummary | null>;
    historical: null;
    locked: null;
  };
}

export type Phase4ValidationMode = 'historical-reference' | 'locked-holdout';

export interface CandidatePhase4FrozenValidationResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  tuningAllowed: false;
  operatingAlgorithmFrozen: true;
  selectorFrozen: true;
  mode: Phase4ValidationMode;
  source: 'decay';
  experimentId: 'P4_OVERLAP_LIMIT';
  options: CandidatePhase4CoverageOptions;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  candidate: Phase3PipelineStageSummary;
  baseline: Phase4ExperimentSummary;
  experiment: Phase4ExperimentSummary;
  randomBaseline: Phase4RandomBaseline;
  coverageDiagnostics: Phase4CoverageAggregate;
  winnerRankBands: Phase4WinnerRankSummary;
  opportunityDetails: readonly Phase4OpportunityExperimentRound[];
  passed: boolean;
  selected: Phase4ExperimentSummary | null;
}

interface CombinationStructure {
  vectorIndex: number;
  mask: number;
  ranks: readonly number[];
  pairs: readonly number[];
  bandPattern: string;
  rankProfile: string;
  worstRankGroup: 0 | 1 | 2;
}

interface SelectorConfig {
  number: boolean;
  band: boolean;
  pair: boolean;
  overlap: boolean;
  worstRank: boolean;
  rankProfile: boolean;
}

interface CoverageState {
  numberCounts: Uint16Array;
  pairCounts: Uint16Array;
  bandPatterns: Map<string, number>;
  rankProfiles: Map<string, number>;
  worstRankCounts: Uint16Array;
  selectedMasks: number[];
}

interface RandomAccumulator {
  exact: Record<4 | 5 | 6, number[]>;
  simple: Record<4 | 5 | 6, number[]>;
  coverageAware: Record<4 | 5 | 6, number[]>;
}

const SOURCES: readonly Phase3CandidateSource[] = [
  'current',
  'decay',
  'grid-transition',
];
const SPECIALIST_SOURCES: readonly Phase4SpecialistSource[] = [
  'decay',
  'grid-transition',
];
const SOURCE_RANKING: Record<Phase3CandidateSource, CandidateRankingId> = {
  current: 'current',
  decay: 'decay',
  'grid-transition': 'grid-transition',
};
const BASELINE_STRATEGY: Record<Phase3CandidateSource, CombinationStrategy> = {
  current: 'transition',
  decay: 'pair',
  'grid-transition': 'shape',
};
const EXPERIMENT_CONFIG: Record<Phase4ExperimentId, SelectorConfig> = {
  P4_BASELINE: {
    number: false,
    band: false,
    pair: false,
    overlap: false,
    worstRank: false,
    rankProfile: false,
  },
  P4_NUMBER_COVERAGE: {
    number: true,
    band: false,
    pair: false,
    overlap: false,
    worstRank: false,
    rankProfile: false,
  },
  P4_NUMBER_BAND: {
    number: true,
    band: true,
    pair: false,
    overlap: false,
    worstRank: false,
    rankProfile: false,
  },
  P4_NUMBER_BAND_PAIR: {
    number: true,
    band: true,
    pair: true,
    overlap: false,
    worstRank: false,
    rankProfile: false,
  },
  P4_OVERLAP_LIMIT: {
    number: true,
    band: true,
    pair: true,
    overlap: true,
    worstRank: false,
    rankProfile: false,
  },
  P4_WORST_RANK_BAND: {
    number: true,
    band: true,
    pair: false,
    overlap: false,
    worstRank: true,
    rankProfile: false,
  },
  P4_RANK_PROFILE: {
    number: true,
    band: true,
    pair: true,
    overlap: true,
    worstRank: false,
    rankProfile: true,
  },
};
const TOTAL_COMBINATIONS = 38_760;
const TOP100 = 100;
const DEFAULT_SEED = 20_260_807;
const BASELINE_HEAD_SAMPLE = 64;
const WORST_RANK_QUOTAS: readonly [number, number, number] = [10, 30, 60];
const ROTATION_OFFSETS = 20;
const pairIndex = buildPairIndex();

export function runCandidatePhase4Coverage(
  draws: readonly LottoDraw[],
  requested: Partial<CandidatePhase4CoverageOptions> = {},
  onProgress?: (
    completed: number,
    total: number,
    round: number,
    source: Phase3CandidateSource,
  ) => void,
): CandidatePhase4CoverageResult {
  const options = sanitizeOptions(requested);
  if (options.startRound !== 1044 || options.endRound !== 1235) {
    throw new Error('Phase 4 선택은 Development 1044–1235에서만 실행해요.');
  }
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: options.startRound,
    endRound: options.endRound,
    poolSize: options.poolSize,
  });
  const recalls = Object.fromEntries(
    SOURCES.map((source) => [source, [] as number[]]),
  ) as Record<Phase3CandidateSource, number[]>;
  const baselineCoverage = Object.fromEntries(
    SOURCES.map((source) => [source, [] as Phase4CoverageDiagnostics[]]),
  ) as Record<Phase3CandidateSource, Phase4CoverageDiagnostics[]>;
  const winnerRanks = Object.fromEntries(
    SOURCES.map((source) => [source, [] as Phase4WinnerRankDiagnostic[]]),
  ) as Record<Phase3CandidateSource, Phase4WinnerRankDiagnostic[]>;
  const randomAccumulators = Object.fromEntries(
    SOURCES.map((source) => [source, newRandomAccumulator()]),
  ) as Record<Phase3CandidateSource, RandomAccumulator>;
  const experimentRounds = new Map<string, Phase4OpportunityExperimentRound[]>();
  let completed = 0;
  const total = range.evaluatedRounds * SOURCES.length;

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

    for (const [sourceIndex, source] of SOURCES.entries()) {
      const ranking = candidateRound.rankings[SOURCE_RANKING[source]];
      if (ranking === undefined) {
        throw new Error(`Round ${actual.round} does not include ${source}.`);
      }
      recalls[source].push(ranking.recall);
      if (ranking.recall >= 4) {
        const analyzed = analyzePhase4OpportunityRound(
          draws,
          historyIndex,
          source,
          ranking.top20,
          ranking.recall,
          ranking.winningRanks,
          actual,
          options,
          sourceIndex,
        );
        baselineCoverage[source].push(analyzed.baselineCoverage);
        winnerRanks[source].push(analyzed.winnerRanks);
        appendRandomEvaluation(randomAccumulators[source], analyzed.randomEvaluation);
        analyzed.experiments.forEach((round) => {
          const key = experimentKey(round.source, round.experimentId);
          const stored = experimentRounds.get(key) ?? [];
          stored.push(round);
          experimentRounds.set(key, stored);
        });
      }
      completed += 1;
      onProgress?.(completed, total, actual.round, source);
    }
  }

  const sourceSummaries = Object.fromEntries(
    SOURCES.map((source) => [source, stageSummary(recalls[source])]),
  ) as Record<Phase3CandidateSource, Phase3PipelineStageSummary>;
  const randomBaselines = SOURCES.map((source, index) =>
    finishRandomBaseline(
      source,
      randomAccumulators[source],
      options.monteCarloRuns,
      options.seed + index * 10_007,
    ),
  );
  const randomBySource = Object.fromEntries(
    randomBaselines.map((baseline) => [baseline.source, baseline]),
  ) as Record<Phase3CandidateSource, Phase4RandomBaseline>;
  const experiments = SPECIALIST_SOURCES.flatMap((source) =>
    phase4ExperimentIds.map((experimentId) =>
      summarizeExperiment(
        source,
        experimentId,
        sourceSummaries[source],
        experimentRounds.get(experimentKey(source, experimentId)) ?? [],
        experimentRounds.get(experimentKey(source, 'P4_BASELINE')) ?? [],
        randomBySource[source],
        options.startRound,
      ),
    ),
  );
  const selected = Object.fromEntries(
    SPECIALIST_SOURCES.map((source) => [source, selectExperiment(source, experiments)]),
  ) as Record<Phase4SpecialistSource, Phase4ExperimentSummary | null>;
  const branchTop100 = Object.values(selected).filter(
    (summary): summary is Phase4ExperimentSummary => summary !== null,
  );

  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tuningAllowed: true,
    operatingAlgorithmFrozen: true,
    options,
    startRound: options.startRound,
    endRound: options.endRound,
    evaluatedRounds: range.evaluatedRounds,
    candidatePhase4Coverage: {
      development: {
        current: sourceSummaries.current,
        decay: sourceSummaries.decay,
        gridTransition: sourceSummaries['grid-transition'],
      },
      coverageDiagnostics: Object.fromEntries(
        SOURCES.map((source) => [source, aggregateCoverage(baselineCoverage[source])]),
      ) as Record<Phase3CandidateSource, Phase4CoverageAggregate>,
      winnerRankBands: SOURCES.map((source) =>
        summarizeWinnerRanks(source, winnerRanks[source]),
      ),
      randomBaselines,
      experiments,
      opportunityDetails: [...experimentRounds.values()].flat(),
      branchTop100,
      gates: experiments.map(({ source, experimentId, gate, result }) => ({
        source,
        experimentId,
        gate,
        result,
      })),
      selected,
      historical: null,
      locked: null,
    },
  };
}

/**
 * Runs the one frozen Development winner without allowing source, selector, or
 * range changes. Historical must pass before callers invoke locked-holdout.
 */
export function runCandidatePhase4FrozenValidation(
  draws: readonly LottoDraw[],
  mode: Phase4ValidationMode,
  requested: Partial<CandidatePhase4CoverageOptions> = {},
  onProgress?: (completed: number, total: number, round: number) => void,
): CandidatePhase4FrozenValidationResult {
  const bounds =
    mode === 'historical-reference'
      ? { startRound: 852, endRound: 1043 }
      : { startRound: 660, endRound: 851 };
  const options = sanitizeOptions({
    ...requested,
    startRound: bounds.startRound,
    endRound: bounds.endRound,
  });
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: options.startRound,
    endRound: options.endRound,
    poolSize: options.poolSize,
  });
  const source: Phase4SpecialistSource = 'decay';
  const experimentId: Phase4ExperimentId = 'P4_OVERLAP_LIMIT';
  const recalls: number[] = [];
  const baselineCoverage: Phase4CoverageDiagnostics[] = [];
  const winnerRanks: Phase4WinnerRankDiagnostic[] = [];
  const randomAccumulator = newRandomAccumulator();
  const experimentRounds = new Map<
    Phase4ExperimentId,
    Phase4OpportunityExperimentRound[]
  >();
  let completed = 0;

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
    const ranking = candidateRound.rankings.decay;
    if (ranking === undefined)
      throw new Error(`Round ${actual.round} does not include decay.`);
    recalls.push(ranking.recall);
    if (ranking.recall >= 4) {
      const analyzed = analyzePhase4OpportunityRound(
        draws,
        historyIndex,
        source,
        ranking.top20,
        ranking.recall,
        ranking.winningRanks,
        actual,
        options,
        1,
        ['P4_BASELINE', experimentId],
      );
      baselineCoverage.push(analyzed.baselineCoverage);
      winnerRanks.push(analyzed.winnerRanks);
      appendRandomEvaluation(randomAccumulator, analyzed.randomEvaluation);
      analyzed.experiments.forEach((round) => {
        const stored = experimentRounds.get(round.experimentId) ?? [];
        stored.push(round);
        experimentRounds.set(round.experimentId, stored);
      });
    }
    completed += 1;
    onProgress?.(completed, range.evaluatedRounds, actual.round);
  }

  const candidate = stageSummary(recalls);
  const randomBaseline = finishRandomBaseline(
    source,
    randomAccumulator,
    options.monteCarloRuns,
    options.seed + 10_007,
  );
  const baselineRounds = experimentRounds.get('P4_BASELINE') ?? [];
  const selectedRounds = experimentRounds.get(experimentId) ?? [];
  const baseline = summarizeExperiment(
    source,
    'P4_BASELINE',
    candidate,
    baselineRounds,
    baselineRounds,
    randomBaseline,
    options.startRound,
  );
  const experiment = summarizeExperiment(
    source,
    experimentId,
    candidate,
    selectedRounds,
    baselineRounds,
    randomBaseline,
    options.startRound,
  );
  const passed = experiment.result === 'KEEP';
  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tuningAllowed: false,
    operatingAlgorithmFrozen: true,
    selectorFrozen: true,
    mode,
    source: 'decay',
    experimentId: 'P4_OVERLAP_LIMIT',
    options,
    startRound: options.startRound,
    endRound: options.endRound,
    evaluatedRounds: range.evaluatedRounds,
    candidate,
    baseline,
    experiment,
    randomBaseline,
    coverageDiagnostics: aggregateCoverage(baselineCoverage),
    winnerRankBands: summarizeWinnerRanks(source, winnerRanks),
    opportunityDetails: [...baselineRounds, ...selectedRounds],
    passed,
    selected: passed ? experiment : null,
  };
}

export function selectPhase4StructuredTop100(
  vectors: readonly CombinationVector[],
  candidateRanking: readonly number[],
  baselineStrategy: CombinationStrategy,
  experimentId: Exclude<Phase4ExperimentId, 'P4_BASELINE'>,
  seed: number,
  greedySampleSize = 512,
): readonly number[] {
  if (vectors.length !== TOTAL_COMBINATIONS || candidateRanking.length !== 20) {
    throw new Error('Phase 4 selector requires the complete Top20 20C6 space.');
  }
  const structures = buildStructures(vectors, candidateRanking);
  const order = baselineOrder(vectors, baselineStrategy);
  return sampledGreedySelection(
    structures,
    order,
    EXPERIMENT_CONFIG[experimentId],
    seed,
    greedySampleSize,
  );
}

function analyzePhase4OpportunityRound(
  draws: readonly LottoDraw[],
  historyIndex: number,
  source: Phase3CandidateSource,
  candidateTop20: readonly number[],
  candidateRecall: number,
  winningRanks: readonly number[],
  actual: LottoDraw,
  options: CandidatePhase4CoverageOptions,
  sourceIndex: number,
  requestedExperiments: readonly Phase4ExperimentId[] = phase4ExperimentIds,
): {
  baselineCoverage: Phase4CoverageDiagnostics;
  winnerRanks: Phase4WinnerRankDiagnostic;
  randomEvaluation: ReturnType<typeof evaluateRandomBaselines>;
  experiments: Phase4OpportunityExperimentRound[];
} {
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
      `Phase 4 requires 38,760 combinations; got ${analysis.rawCombinationCount}.`,
    );
  }
  const vectors = analysis.generatedCombinations;
  const structures = buildStructures(vectors, candidateTop20);
  const strategy = BASELINE_STRATEGY[source];
  const order = baselineOrder(vectors, strategy);
  const baselineSelected = order.slice(0, TOP100);
  const winning = new Set(actual.numbers);
  const hits = Uint8Array.from(
    vectors.map(({ numbers }) =>
      numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
    ),
  );
  const baselineRanks = bestRanks(order, hits);
  const baselineTop100Hit = maxSelectedHit(baselineSelected, hits);
  const winnerMask = winningRanks.reduce(
    (mask, rank) => (rank <= 20 ? mask | (1 << (rank - 1)) : mask),
    0,
  );
  const seed = options.seed + actual.round * 131 + sourceIndex * 10_007;
  const randomEvaluation = evaluateRandomBaselines(
    structures,
    winnerMask,
    candidateRecall,
    options.monteCarloRuns,
    seed,
  );
  const winnerRankDiagnostic = buildWinnerRankDiagnostic(
    actual.round,
    source,
    candidateRecall,
    winningRanks,
  );
  const experiments: Phase4OpportunityExperimentRound[] = [];

  if (source !== 'current') {
    requestedExperiments.forEach((experimentId, experimentIndex) => {
      const selected =
        experimentId === 'P4_BASELINE'
          ? baselineSelected
          : sampledGreedySelection(
              structures,
              order,
              EXPERIMENT_CONFIG[experimentId],
              seed + experimentIndex * 65_537,
              options.greedySampleSize,
            );
      experiments.push({
        round: actual.round,
        source,
        experimentId,
        candidateRecall,
        winningRanks,
        winnerBandPattern: winnerRankDiagnostic.winnerBandPattern,
        baselineBestRanks: baselineRanks,
        structuredBestRanks: bestRanks(selected, hits),
        baselineTop100Hit,
        structuredTop100Hit: maxSelectedHit(selected, hits),
        selectedCombinationCountContainingEachWinner: actual.numbers.map((number) =>
          selected.reduce(
            (count, vectorIndex) =>
              count + Number(vectors[vectorIndex]!.numbers.includes(number)),
            0,
          ),
        ),
        coverage: coverageDiagnostics(selected, structures),
      });
    });
  }

  return {
    baselineCoverage: coverageDiagnostics(baselineSelected, structures),
    winnerRanks: winnerRankDiagnostic,
    randomEvaluation,
    experiments,
  };
}

function buildStructures(
  vectors: readonly CombinationVector[],
  candidateRanking: readonly number[],
): CombinationStructure[] {
  const ranks = new Map(candidateRanking.map((number, index) => [number, index + 1]));
  return vectors.map(({ numbers }, vectorIndex) => {
    const sourceRanks = numbers
      .map((number) => ranks.get(number) ?? 45)
      .sort((left, right) => left - right);
    let mask = 0;
    sourceRanks.forEach((rank) => {
      mask |= 1 << (rank - 1);
    });
    const pairs: number[] = [];
    for (let left = 0; left < sourceRanks.length; left += 1) {
      for (let right = left + 1; right < sourceRanks.length; right += 1) {
        pairs.push(pairIndex[sourceRanks[left]! - 1]![sourceRanks[right]! - 1]!);
      }
    }
    const maximum = sourceRanks.at(-1) ?? 20;
    return {
      vectorIndex,
      mask,
      ranks: sourceRanks,
      pairs,
      bandPattern: bandPattern(sourceRanks),
      rankProfile: rankProfile(sourceRanks),
      worstRankGroup: maximum <= 10 ? 0 : maximum <= 15 ? 1 : 2,
    };
  });
}

function baselineOrder(
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

function sampledGreedySelection(
  structures: readonly CombinationStructure[],
  baselineRanking: readonly number[],
  config: SelectorConfig,
  seed: number,
  sampleSize: number,
): number[] {
  const state: CoverageState = {
    numberCounts: new Uint16Array(20),
    pairCounts: new Uint16Array(190),
    bandPatterns: new Map(),
    rankProfiles: new Map(),
    worstRankCounts: new Uint16Array(3),
    selectedMasks: [],
  };
  const selected = new Uint8Array(structures.length);
  const baselinePosition = new Uint32Array(structures.length);
  baselineRanking.forEach((vectorIndex, position) => {
    baselinePosition[vectorIndex] = position;
  });
  const result: number[] = [];
  const safeSampleSize = Math.min(Math.max(sampleSize, 128), 2048);

  while (result.length < TOP100) {
    const candidates = new Set<number>();
    for (const vectorIndex of baselineRanking) {
      if (selected[vectorIndex] === 0) candidates.add(vectorIndex);
      if (candidates.size >= BASELINE_HEAD_SAMPLE) break;
    }
    const offset = hash32(seed + result.length * 2_654_435_761) % structures.length;
    for (let sample = 0; sample < safeSampleSize; sample += 1) {
      const position =
        (Math.floor(((sample + 0.5) * structures.length) / safeSampleSize) + offset) %
        structures.length;
      const vectorIndex = baselineRanking[position]!;
      if (selected[vectorIndex] === 0) candidates.add(vectorIndex);
    }

    let bestIndex = -1;
    let bestGain = Number.NEGATIVE_INFINITY;
    for (const vectorIndex of candidates) {
      const gain = coverageGain(structures[vectorIndex]!, state, config);
      const tie =
        ((structures.length - baselinePosition[vectorIndex]!) / structures.length) *
        1e-6;
      const value = gain + tie;
      if (
        value > bestGain ||
        (value === bestGain && (bestIndex < 0 || vectorIndex < bestIndex))
      ) {
        bestGain = value;
        bestIndex = vectorIndex;
      }
    }
    if (bestIndex < 0 || !Number.isFinite(bestGain)) {
      bestIndex =
        baselineRanking.find((vectorIndex) => selected[vectorIndex] === 0) ?? -1;
    }
    if (bestIndex < 0) throw new Error('Phase 4 selector exhausted combinations.');
    selected[bestIndex] = 1;
    result.push(bestIndex);
    applyCoverage(structures[bestIndex]!, state);
  }
  return result;
}

function coverageGain(
  structure: CombinationStructure,
  state: CoverageState,
  config: SelectorConfig,
): number {
  let gain = 0;
  if (config.number) {
    gain += mean(
      structure.ranks.map((rank) => 1 / (1 + state.numberCounts[rank - 1]!)),
    );
  }
  if (config.band) {
    gain += 1 / (1 + (state.bandPatterns.get(structure.bandPattern) ?? 0));
  }
  if (config.pair) {
    gain += mean(structure.pairs.map((pair) => 1 / (1 + state.pairCounts[pair]!)));
  }
  if (config.worstRank) {
    const group = structure.worstRankGroup;
    gain += Math.max(
      0,
      (WORST_RANK_QUOTAS[group] - state.worstRankCounts[group]!) /
        WORST_RANK_QUOTAS[group],
    );
  }
  if (config.rankProfile) {
    gain += 1 / (1 + (state.rankProfiles.get(structure.rankProfile) ?? 0));
  }
  if (config.overlap) {
    let maximumOverlap = 0;
    for (const mask of state.selectedMasks) {
      maximumOverlap = Math.max(maximumOverlap, popcount(mask & structure.mask));
      if (maximumOverlap >= 5) return Number.NEGATIVE_INFINITY;
    }
    if (maximumOverlap === 4) gain -= 1;
  }
  return gain;
}

function applyCoverage(structure: CombinationStructure, state: CoverageState): void {
  structure.ranks.forEach((rank) => {
    state.numberCounts[rank - 1] = state.numberCounts[rank - 1]! + 1;
  });
  structure.pairs.forEach((pair) => {
    state.pairCounts[pair] = state.pairCounts[pair]! + 1;
  });
  state.bandPatterns.set(
    structure.bandPattern,
    (state.bandPatterns.get(structure.bandPattern) ?? 0) + 1,
  );
  state.rankProfiles.set(
    structure.rankProfile,
    (state.rankProfiles.get(structure.rankProfile) ?? 0) + 1,
  );
  state.worstRankCounts[structure.worstRankGroup] =
    state.worstRankCounts[structure.worstRankGroup]! + 1;
  state.selectedMasks.push(structure.mask);
}

function coverageDiagnostics(
  selected: readonly number[],
  structures: readonly CombinationStructure[],
): Phase4CoverageDiagnostics {
  const numberCounts = new Array<number>(20).fill(0);
  const pairCounts = new Array<number>(190).fill(0);
  const tripleCounts = new Map<string, number>();
  const bandPatterns = new Map<string, number>();
  const rankProfiles = new Map<string, number>();
  let sameBandPairs = 0;

  selected.forEach((vectorIndex) => {
    const structure = structures[vectorIndex]!;
    structure.ranks.forEach((rank) => {
      numberCounts[rank - 1] = numberCounts[rank - 1]! + 1;
    });
    structure.pairs.forEach((pair) => {
      pairCounts[pair] = pairCounts[pair]! + 1;
    });
    for (let left = 0; left < structure.ranks.length; left += 1) {
      for (let middle = left + 1; middle < structure.ranks.length; middle += 1) {
        for (let right = middle + 1; right < structure.ranks.length; right += 1) {
          const key = `${structure.ranks[left]}-${structure.ranks[middle]}-${structure.ranks[right]}`;
          tripleCounts.set(key, (tripleCounts.get(key) ?? 0) + 1);
        }
      }
      for (let right = left + 1; right < structure.ranks.length; right += 1) {
        if (bandOf(structure.ranks[left]!) === bandOf(structure.ranks[right]!)) {
          sameBandPairs += 1;
        }
      }
    }
    bandPatterns.set(
      structure.bandPattern,
      (bandPatterns.get(structure.bandPattern) ?? 0) + 1,
    );
    rankProfiles.set(
      structure.rankProfile,
      (rankProfiles.get(structure.rankProfile) ?? 0) + 1,
    );
  });

  const overlapCounts = new Array<number>(6).fill(0);
  for (let left = 0; left < selected.length; left += 1) {
    for (let right = left + 1; right < selected.length; right += 1) {
      const overlap = popcount(
        structures[selected[left]!]!.mask & structures[selected[right]!]!.mask,
      );
      overlapCounts[overlap] = overlapCounts[overlap]! + 1;
    }
  }
  const numberMean = mean(numberCounts);
  const pairSlots = selected.length * 15;
  const tripleSlots = selected.length * 20;
  const overlapPairs = (selected.length * (selected.length - 1)) / 2;
  const bandSlots = [0, 1, 2, 3].map((band) =>
    numberCounts
      .slice(band * 5, band * 5 + 5)
      .reduce((total, count) => total + count, 0),
  ) as [number, number, number, number];
  return {
    number: {
      appearancesByRank: numberCounts,
      uniqueNumberCoverage: numberCounts.filter((count) => count > 0).length,
      minAppearance: Math.min(...numberCounts),
      maxAppearance: Math.max(...numberCounts),
      meanAppearance: numberMean,
      standardDeviation: Math.sqrt(
        mean(numberCounts.map((count) => (count - numberMean) ** 2)),
      ),
      gini: gini(numberCounts),
      normalizedEntropy: normalizedEntropy(numberCounts),
      rankBandShares: bandSlots.map((slots) => ratio(slots, selected.length * 6)) as [
        number,
        number,
        number,
        number,
      ],
    },
    pair: {
      uniquePairCoverage: pairCounts.filter((count) => count > 0).length,
      repeatedPairSlots: pairSlots - pairCounts.filter((count) => count > 0).length,
      minAppearance: Math.min(...pairCounts),
      maxAppearance: Math.max(...pairCounts),
      meanAppearance: mean(pairCounts),
      gini: gini(pairCounts),
      normalizedEntropy: normalizedEntropy(pairCounts),
      sameBandShare: ratio(sameBandPairs, pairSlots),
      crossBandShare: ratio(pairSlots - sameBandPairs, pairSlots),
    },
    triple: {
      uniqueTripleCoverage: tripleCounts.size,
      repeatedTripleSlots: tripleSlots - tripleCounts.size,
    },
    rankBands: {
      uniquePatterns: bandPatterns.size,
      normalizedEntropy: normalizedEntropy([...bandPatterns.values()]),
    },
    rankProfiles: {
      uniquePatterns: rankProfiles.size,
      normalizedEntropy: normalizedEntropy([...rankProfiles.values()]),
    },
    overlap: {
      pairs: overlapPairs,
      distribution: overlapCounts as [number, number, number, number, number, number],
      overlap4PlusRate: ratio(overlapCounts[4]! + overlapCounts[5]!, overlapPairs),
      overlap5PlusRate: ratio(overlapCounts[5]!, overlapPairs),
    },
  };
}

function aggregateCoverage(
  rounds: readonly Phase4CoverageDiagnostics[],
): Phase4CoverageAggregate {
  const scalar = (select: (round: Phase4CoverageDiagnostics) => number) =>
    distribution(rounds.map(select));
  return {
    rounds: rounds.length,
    meanAppearancesByRank: Array.from({ length: 20 }, (_, rank) =>
      mean(rounds.map(({ number }) => number.appearancesByRank[rank] ?? 0)),
    ),
    meanRankBandShares: [0, 1, 2, 3].map((band) =>
      mean(rounds.map(({ number }) => number.rankBandShares[band] ?? 0)),
    ) as [number, number, number, number],
    uniqueNumberCoverage: scalar(({ number }) => number.uniqueNumberCoverage),
    numberAppearanceStandardDeviation: scalar(({ number }) => number.standardDeviation),
    numberGini: scalar(({ number }) => number.gini),
    numberEntropy: scalar(({ number }) => number.normalizedEntropy),
    uniquePairCoverage: scalar(({ pair }) => pair.uniquePairCoverage),
    pairGini: scalar(({ pair }) => pair.gini),
    pairEntropy: scalar(({ pair }) => pair.normalizedEntropy),
    uniqueTripleCoverage: scalar(({ triple }) => triple.uniqueTripleCoverage),
    repeatedTripleSlots: scalar(({ triple }) => triple.repeatedTripleSlots),
    uniqueBandPatterns: scalar(({ rankBands }) => rankBands.uniquePatterns),
    bandPatternEntropy: scalar(({ rankBands }) => rankBands.normalizedEntropy),
    uniqueRankProfiles: scalar(({ rankProfiles }) => rankProfiles.uniquePatterns),
    rankProfileEntropy: scalar(({ rankProfiles }) => rankProfiles.normalizedEntropy),
    overlap4PlusRate: scalar(({ overlap }) => overlap.overlap4PlusRate),
    overlap5PlusRate: scalar(({ overlap }) => overlap.overlap5PlusRate),
  };
}

function summarizeExperiment(
  source: Phase4SpecialistSource,
  experimentId: Phase4ExperimentId,
  candidate: Phase3PipelineStageSummary,
  rounds: readonly Phase4OpportunityExperimentRound[],
  baselineRounds: readonly Phase4OpportunityExperimentRound[],
  random: Phase4RandomBaseline,
  startRound: number,
): Phase4ExperimentSummary {
  const top100 = stageSummary(
    rounds.map(({ structuredTop100Hit }) => structuredTop100Hit),
  );
  const baselineTop100 = stageSummary(
    baselineRounds.map(({ structuredTop100Hit }) => structuredTop100Hit),
  );
  const targetThreshold: 5 | 6 = source === 'decay' ? 5 : 6;
  const improvedTargetRounds = rounds.filter((round) =>
    rankImproved(
      targetThreshold === 5
        ? round.structuredBestRanks.fivePlus
        : round.structuredBestRanks.six,
      targetThreshold === 5
        ? round.baselineBestRanks.fivePlus
        : round.baselineBestRanks.six,
    ),
  ).length;
  const randomTarget =
    targetThreshold === 5 ? random.top100.fivePlus : random.top100.six;
  const targetCandidateCount =
    targetThreshold === 5 ? candidate.fivePlus : candidate.six;
  const targetTop100Count = targetThreshold === 5 ? top100.fivePlus : top100.six;
  const targetPreservation = ratio(targetTop100Count, targetCandidateCount);
  const blocks = blockSummaries(rounds, source, startRound);
  const specialistPreservation =
    source === 'decay'
      ? top100.fivePlus > 0
      : top100.six > 0 && top100.fivePlus >= baselineTop100.fivePlus;
  const fourPlusGuardrail = top100.fourPlus >= Math.max(0, baselineTop100.fourPlus - 1);
  const baselineBest5 = nonNull(
    rounds.map(({ baselineBestRanks }) => baselineBestRanks.fivePlus),
  );
  const structuredBest5 = nonNull(
    rounds.map(({ structuredBestRanks }) => structuredBestRanks.fivePlus),
  );
  const baselineBest6 = nonNull(
    rounds.map(({ baselineBestRanks }) => baselineBestRanks.six),
  );
  const structuredBest6 = nonNull(
    rounds.map(({ structuredBestRanks }) => structuredBestRanks.six),
  );
  const baselineTargetRanks = targetThreshold === 5 ? baselineBest5 : baselineBest6;
  const structuredTargetRanks =
    targetThreshold === 5 ? structuredBest5 : structuredBest6;
  const rankDistributionImproved =
    improvedTargetRounds >= 2 &&
    structuredTargetRanks.length > 0 &&
    median(structuredTargetRanks) < median(baselineTargetRanks);
  const conditionalRandomLift = ratio(targetPreservation, randomTarget.exactMeanRate);
  const coverageAwareRandomLift = ratio(
    targetPreservation,
    randomTarget.coverageAwareMonteCarloMeanRate,
  );
  const stableBlocks = blocks.filter(
    ({ targetPreservedOrImproved }) => targetPreservedOrImproved,
  ).length;
  const gate: Phase4SelectorGate = {
    specialistPreservation,
    fourPlusGuardrail,
    rankDistributionImproved,
    randomLift: conditionalRandomLift > 1,
    blockStability: stableBlocks >= 2,
    conditionalRandomLift,
    coverageAwareRandomLift,
    improvedTargetRounds,
    stableBlocks,
  };
  const keep =
    experimentId !== 'P4_BASELINE' &&
    gate.specialistPreservation &&
    gate.fourPlusGuardrail &&
    gate.rankDistributionImproved &&
    gate.randomLift &&
    gate.blockStability;
  return {
    source,
    experimentId,
    candidate,
    top100,
    preservation: {
      fourPlus: ratio(top100.fourPlus, candidate.fourPlus),
      fivePlus: ratio(top100.fivePlus, candidate.fivePlus),
      six: ratio(top100.six, candidate.six),
    },
    baselineBest5Rank: distribution(baselineBest5),
    structuredBest5Rank: distribution(structuredBest5),
    baselineBest6Rank: distribution(baselineBest6),
    structuredBest6Rank: distribution(structuredBest6),
    coverage: aggregateCoverage(rounds.map(({ coverage }) => coverage)),
    blocks,
    gate,
    result: experimentId === 'P4_BASELINE' ? 'BASELINE' : keep ? 'KEEP' : 'REJECT',
    reason:
      experimentId === 'P4_BASELINE'
        ? `Frozen ${BASELINE_STRATEGY[source]} Top100 baseline`
        : keep
          ? 'Specialist preservation, 4+ guardrail, rank distribution, random lift, and block stability passed'
          : `Gate ${[
              specialistPreservation ? null : 'Specialist',
              fourPlusGuardrail ? null : '4+',
              rankDistributionImproved ? null : 'Rank',
              conditionalRandomLift > 1 ? null : 'Random',
              stableBlocks >= 2 ? null : 'Block',
            ]
              .filter(Boolean)
              .join('/')} failed`,
  };
}

function blockSummaries(
  rounds: readonly Phase4OpportunityExperimentRound[],
  source: Phase4SpecialistSource,
  startRound: number,
): Phase4BlockSummary[] {
  const labels = ['A', 'B', 'C', 'D'] as const;
  return labels.map((block, index) => {
    const start = startRound + index * 48;
    const selected = rounds.filter(({ round }) => round >= start && round < start + 48);
    const summary = stageSummary(
      selected.map(({ structuredTop100Hit }) => structuredTop100Hit),
    );
    const fivePlusRankImprovedRounds = selected.filter((round) =>
      rankImproved(
        round.structuredBestRanks.fivePlus,
        round.baselineBestRanks.fivePlus,
      ),
    ).length;
    const targetRankImprovedRounds = selected.filter((round) =>
      rankImproved(
        source === 'decay'
          ? round.structuredBestRanks.fivePlus
          : round.structuredBestRanks.six,
        source === 'decay'
          ? round.baselineBestRanks.fivePlus
          : round.baselineBestRanks.six,
      ),
    ).length;
    const targetPreserved = source === 'decay' ? summary.fivePlus > 0 : summary.six > 0;
    return {
      block,
      startRound: start,
      endRound: start + 47,
      top100FourPlus: summary.fourPlus,
      top100FivePlus: summary.fivePlus,
      top100Six: summary.six,
      fivePlusRankImprovedRounds,
      targetRankImprovedRounds,
      targetPreservedOrImproved: targetPreserved || targetRankImprovedRounds > 0,
    };
  });
}

function selectExperiment(
  source: Phase4SpecialistSource,
  experiments: readonly Phase4ExperimentSummary[],
): Phase4ExperimentSummary | null {
  return (
    experiments
      .filter((summary) => summary.source === source && summary.result === 'KEEP')
      .sort(
        (left, right) =>
          right.top100.six - left.top100.six ||
          right.top100.fivePlus - left.top100.fivePlus ||
          right.top100.fourPlus - left.top100.fourPlus ||
          right.gate.stableBlocks - left.gate.stableBlocks ||
          phase4ExperimentIds.indexOf(left.experimentId) -
            phase4ExperimentIds.indexOf(right.experimentId),
      )[0] ?? null
  );
}

function evaluateRandomBaselines(
  structures: readonly CombinationStructure[],
  winnerMask: number,
  recall: number,
  runs: number,
  seed: number,
): {
  exact: Record<4 | 5 | 6, number>;
  simple: Record<4 | 5 | 6, number>;
  coverageAware: Record<4 | 5 | 6, number>;
} {
  const exact = {
    4: exactPreservationProbability(recall, 4),
    5: exactPreservationProbability(recall, 5),
    6: exactPreservationProbability(recall, 6),
  };
  const simpleCounts = { 4: 0, 5: 0, 6: 0 };
  const coverageCounts = { 4: 0, 5: 0, 6: 0 };
  const random = mulberry32(seed);
  for (let run = 0; run < runs; run += 1) {
    const simple = randomUniqueIndices(structures.length, TOP100, random);
    let simpleMax = 0;
    simple.forEach((index) => {
      simpleMax = Math.max(simpleMax, popcount(structures[index]!.mask & winnerMask));
    });
    const balancedMasks = numberBalancedRandomMasks(random);
    let coverageMax = 0;
    balancedMasks.forEach((mask) => {
      coverageMax = Math.max(coverageMax, popcount(mask & winnerMask));
    });
    ([4, 5, 6] as const).forEach((threshold) => {
      simpleCounts[threshold] += Number(simpleMax >= threshold);
      coverageCounts[threshold] += Number(coverageMax >= threshold);
    });
  }
  return {
    exact,
    simple: {
      4: simpleCounts[4] / runs,
      5: simpleCounts[5] / runs,
      6: simpleCounts[6] / runs,
    },
    coverageAware: {
      4: coverageCounts[4] / runs,
      5: coverageCounts[5] / runs,
      6: coverageCounts[6] / runs,
    },
  };
}

function appendRandomEvaluation(
  accumulator: RandomAccumulator,
  evaluation: ReturnType<typeof evaluateRandomBaselines>,
): void {
  ([4, 5, 6] as const).forEach((threshold) => {
    if (evaluation.exact[threshold] > 0) {
      accumulator.exact[threshold].push(evaluation.exact[threshold]);
      accumulator.simple[threshold].push(evaluation.simple[threshold]);
      accumulator.coverageAware[threshold].push(evaluation.coverageAware[threshold]);
    }
  });
}

function finishRandomBaseline(
  source: Phase3CandidateSource,
  accumulator: RandomAccumulator,
  runs: number,
  seed: number,
): Phase4RandomBaseline {
  const threshold = (value: 4 | 5 | 6): Phase4RandomThresholdSummary => ({
    eligibleRounds: accumulator.exact[value].length,
    exactMeanRate: mean(accumulator.exact[value]),
    simpleMonteCarloMeanRate: mean(accumulator.simple[value]),
    simpleMonteCarloRoundRates: distribution(accumulator.simple[value]),
    coverageAwareMonteCarloMeanRate: mean(accumulator.coverageAware[value]),
    coverageAwareMonteCarloRoundRates: distribution(accumulator.coverageAware[value]),
  });
  return {
    source,
    runs,
    seed,
    top100: {
      fourPlus: threshold(4),
      fivePlus: threshold(5),
      six: threshold(6),
    },
  };
}

function numberBalancedRandomMasks(random: () => number): number[] {
  const selected = new Set<number>();
  for (let cycle = 0; cycle < 5; cycle += 1) {
    let accepted: number[] | null = null;
    for (let attempt = 0; attempt < 32 && accepted === null; attempt += 1) {
      const permutation = shuffledRange(20, random);
      const offsets = shuffledRange(ROTATION_OFFSETS, random).slice(0, 6);
      const cycleMasks = Array.from({ length: 20 }, (_, row) => {
        let mask = 0;
        offsets.forEach((offset) => {
          mask |= 1 << permutation[(row + offset) % 20]!;
        });
        return mask;
      });
      if (
        new Set(cycleMasks).size === 20 &&
        cycleMasks.every((mask) => !selected.has(mask))
      ) {
        accepted = cycleMasks;
      }
    }
    if (accepted === null) throw new Error('Could not build balanced random Top100.');
    accepted.forEach((mask) => selected.add(mask));
  }
  return [...selected];
}

function exactPreservationProbability(recall: number, threshold: 4 | 5 | 6): number {
  if (recall < threshold) return 0;
  let successful = 0;
  for (let hit = threshold; hit <= Math.min(6, recall); hit += 1) {
    successful += choose(recall, hit) * choose(20 - recall, 6 - hit);
  }
  return probabilityAtLeastOne(TOTAL_COMBINATIONS, successful, TOP100);
}

function probabilityAtLeastOne(
  total: number,
  successful: number,
  picks: number,
): number {
  if (successful <= 0) return 0;
  let none = 1;
  for (let pick = 0; pick < picks; pick += 1) {
    none *= (total - successful - pick) / (total - pick);
  }
  return 1 - none;
}

function buildWinnerRankDiagnostic(
  round: number,
  source: Phase3CandidateSource,
  candidateRecall: number,
  winningRanks: readonly number[],
): Phase4WinnerRankDiagnostic {
  const average = mean(winningRanks);
  return {
    round,
    source,
    candidateRecall,
    winningRanks,
    winnerBandPattern: bandPattern(winningRanks),
    worstRank: Math.max(...winningRanks),
    rankMean: average,
    rankMedian: median(winningRanks),
    rankVariance: mean(winningRanks.map((rank) => (rank - average) ** 2)),
  };
}

function summarizeWinnerRanks(
  source: Phase3CandidateSource,
  rounds: readonly Phase4WinnerRankDiagnostic[],
): Phase4WinnerRankSummary {
  const patterns = new Map<string, number>();
  rounds.forEach(({ winnerBandPattern }) => {
    patterns.set(winnerBandPattern, (patterns.get(winnerBandPattern) ?? 0) + 1);
  });
  return {
    source,
    opportunities: rounds.length,
    bandPatternFrequency: [...patterns.entries()]
      .map(([pattern, count]) => ({ pattern, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.pattern.localeCompare(right.pattern),
      ),
    worstRank: distribution(rounds.map(({ worstRank }) => worstRank)),
    rankMean: distribution(rounds.map(({ rankMean }) => rankMean)),
    rankMedian: distribution(rounds.map(({ rankMedian }) => rankMedian)),
    rankVariance: distribution(rounds.map(({ rankVariance }) => rankVariance)),
  };
}

function bestRanks(order: readonly number[], hits: Uint8Array): Phase4BestRanks {
  const result: Phase4BestRanks = { fourPlus: null, fivePlus: null, six: null };
  order.forEach((vectorIndex, offset) => {
    const rank = offset + 1;
    const hit = hits[vectorIndex]!;
    if (hit >= 4) result.fourPlus ??= rank;
    if (hit >= 5) result.fivePlus ??= rank;
    if (hit >= 6) result.six ??= rank;
  });
  return result;
}

function maxSelectedHit(selected: readonly number[], hits: Uint8Array): number {
  return selected.reduce(
    (maximum, vectorIndex) => Math.max(maximum, hits[vectorIndex]!),
    0,
  );
}

function bandPattern(ranks: readonly number[]): string {
  const counts = [0, 0, 0, 0, 0];
  ranks.forEach((rank) => {
    const index = rank <= 20 ? bandOf(rank) : 4;
    counts[index] = counts[index]! + 1;
  });
  return `A${counts[0]}-B${counts[1]}-C${counts[2]}-D${counts[3]}-X${counts[4]}`;
}

function rankProfile(ranks: readonly number[]): string {
  const average = mean(ranks);
  const deviation = Math.sqrt(mean(ranks.map((rank) => (rank - average) ** 2)));
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
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower] ?? 0;
  const fraction = position - lower;
  return sorted[lower]! * (1 - fraction) + sorted[upper]! * fraction;
}

function median(values: readonly number[]): number {
  return quantile(values, 0.5);
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

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function nonNull(values: readonly (number | null)[]): number[] {
  return values.filter((value): value is number => value !== null);
}

function rankImproved(selected: number | null, baseline: number | null): boolean {
  return selected !== null && baseline !== null && selected < baseline;
}

function experimentKey(
  source: Phase4SpecialistSource,
  experimentId: Phase4ExperimentId,
) {
  return `${source}:${experimentId}`;
}

function buildPairIndex(): number[][] {
  const result = Array.from({ length: 20 }, () => new Array<number>(20).fill(-1));
  let index = 0;
  for (let left = 0; left < 20; left += 1) {
    for (let right = left + 1; right < 20; right += 1) {
      result[left]![right] = index;
      result[right]![left] = index;
      index += 1;
    }
  }
  return result;
}

function newRandomAccumulator(): RandomAccumulator {
  return {
    exact: { 4: [], 5: [], 6: [] },
    simple: { 4: [], 5: [], 6: [] },
    coverageAware: { 4: [], 5: [], 6: [] },
  };
}

function randomUniqueIndices(
  total: number,
  count: number,
  random: () => number,
): number[] {
  const selected = new Set<number>();
  while (selected.size < count) selected.add(Math.floor(random() * total));
  return [...selected];
}

function shuffledRange(length: number, random: () => number): number[] {
  const result = Array.from({ length }, (_, index) => index);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let index = 1; index <= Math.min(k, n - k); index += 1) {
    result = (result * (n - index + 1)) / index;
  }
  return result;
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

function sanitizeOptions(
  requested: Partial<CandidatePhase4CoverageOptions>,
): CandidatePhase4CoverageOptions {
  return {
    startRound: Math.floor(requested.startRound ?? 1044),
    endRound: Math.floor(requested.endRound ?? 1235),
    poolSize: 20,
    seed: Math.floor(requested.seed ?? DEFAULT_SEED),
    monteCarloRuns: Math.max(1000, Math.floor(requested.monteCarloRuns ?? 1000)),
    greedySampleSize: Math.min(
      2048,
      Math.max(128, Math.floor(requested.greedySampleSize ?? 128)),
    ),
  };
}
