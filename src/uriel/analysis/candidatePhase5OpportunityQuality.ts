import type { Candidate, LottoDraw } from '../types';
import { resolveBacktestRoundRange } from './backtest';
import {
  buildFrozenPhase3CandidateRoundDiagnostic,
  exactRandomCandidateBaseline,
  type CandidateRoundDiagnostic,
} from './candidatePhase2';
import {
  buildCombinationAnalysis,
  combinationScoreFor,
  type CombinationCandidate,
  type CombinationVector,
} from './combination';
import { selectPhase4StructuredTop100 } from './candidatePhase4Coverage';
import { buildTailCoverageGames } from './purchase';

export type Phase5Period = 'development' | 'historical-reference';
export type Phase5BaselineId = 'current' | 'decay' | 'grid-transition';
export type Phase5HypothesisId =
  'P5_A_STRONG_FLOOR' | 'P5_B_CROSS_MODEL' | 'P5_C_CONTROLLED_SPECIALIST';
export type Phase5EngineId = Phase5BaselineId | Phase5HypothesisId;
export type Phase5Decision = 'SUCCESS' | 'INCONCLUSIVE' | 'FAIL';

export interface Phase5CandidateNumberInput {
  number: number;
  currentRank: number;
  decayRank: number;
  gridTransitionRank: number;
}

export interface Phase5HypothesisDefinition {
  id: Phase5HypothesisId;
  purpose: string;
  changedFeatures: readonly string[];
  expectedEffect: string;
  failureCondition: string;
  fixedPortfolio: string;
}

export const phase5HypothesisDefinitions: readonly Phase5HypothesisDefinition[] = [
  {
    id: 'P5_A_STRONG_FLOOR',
    purpose: 'Raise the weakest cross-source support instead of the average alone.',
    changedFeatures: [
      'minimum source-rank percentile',
      'median source-rank percentile',
      'mean source-rank percentile',
    ],
    expectedEffect:
      'Reduce the chance that the fifth or sixth useful number survives only at the Top20 edge.',
    failureCondition:
      '5+ opportunity or two independent quality directions do not improve without delivery loss.',
    fixedPortfolio: 'Pure ranking; no specialist slots.',
  },
  {
    id: 'P5_B_CROSS_MODEL',
    purpose:
      'Prefer numbers receiving simultaneous support from all frozen Candidate sources.',
    changedFeatures: [
      'median source-rank percentile',
      'mean source-rank percentile',
      'Top20 source agreement count',
    ],
    expectedEffect:
      'Create winner-related combinations supported by more than one downstream ranking.',
    failureCondition:
      'Agreement improves Candidate recall without improving ensemble floor and Pair rank.',
    fixedPortfolio: 'Pure ranking; no specialist slots.',
  },
  {
    id: 'P5_C_CONTROLLED_SPECIALIST',
    purpose: 'Keep a consensus core while preserving bounded source-specific evidence.',
    changedFeatures: [
      'cross-model consensus core',
      'best single-source support',
      'fixed source specialist slots',
    ],
    expectedEffect:
      'Preserve rare useful numbers without turning all Top20 slots into diversity coverage.',
    failureCondition:
      'Specialist slots raise 4+ only, weaken 5+ quality, or reduce frozen Top100 delivery.',
    fixedPortfolio:
      '14 consensus core + 2 Current + 2 Decay + 2 Grid specialists, then consensus fallback.',
  },
] as const;

export interface Phase5CandidateRanking {
  id: Phase5HypothesisId;
  ranking: readonly number[];
  top20: readonly number[];
  normalizedScores: readonly number[];
}

export interface Phase5StageSummary {
  fourPlus: number;
  fivePlus: number;
  six: number;
}

export interface Phase5Distribution {
  count: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
}

export interface Phase5CandidateNumberQuality {
  scoreMean: number;
  scoreMedian: number;
  scoreMin: number;
  scoreStandardDeviation: number;
  lowestWinnerNumberRank: number;
  worstWinnerSourceRank: number;
}

export interface Phase5CombinationQuality {
  vectorIndex: number;
  numbers: readonly number[];
  pairRank: number;
  transitionRank: number;
  shapeRank: number;
  numberRank: number;
  pairScore: number;
  pairPercentile: number;
  pairGini: number;
  pairEntropy: number;
  pairTop1Share: number;
  pairTop3Share: number;
  pairMaxMeanRatio: number;
  ensembleMeanPercentile: number;
  ensembleMedianPercentile: number;
  ensembleWorstPercentile: number;
  ensembleBestPercentile: number;
  ensemblePercentileStandardDeviation: number;
  top100Agreement: number;
  top500Agreement: number;
  top1000Agreement: number;
}

export interface Phase5BasinMetrics {
  combinations: number;
  pairRankMedian: number;
  pairRankQ1: number;
  pairRankQ3: number;
  pairRankBest: number;
  pairTop100Count: number;
  pairTop500Count: number;
  pairTop1000Count: number;
  pairTop100Density: number;
  pairTop500Density: number;
  pairTop1000Density: number;
  transitionRankMedian: number;
  shapeRankMedian: number;
  numberRankMedian: number;
  ensembleFloorMedian: number;
  top100AgreementCount: number;
  rankDensity: number;
}

export interface Phase5DistanceLayer extends Phase5BasinMetrics {
  distance: 0 | 1 | 2 | 3;
}

export interface Phase5OpportunityQuality {
  round: number;
  period: Phase5Period;
  engineId: Phase5EngineId;
  candidateRecall: number;
  winningRanks: readonly number[];
  best5PairRank: number;
  exact6: Phase5CombinationQuality | null;
  target: Phase5CombinationQuality;
  candidate: Phase5CandidateNumberQuality;
  recall5Basin: Phase5BasinMetrics | null;
  distance1Basin: Phase5BasinMetrics | null;
  distanceLayers: readonly Phase5DistanceLayer[];
  transitionTop100Hit: number;
  finalTop10Hit: number;
}

export interface Phase5QualityAggregate {
  opportunities: number;
  best5PairRank: Phase5Distribution;
  exact6PairRank: Phase5Distribution;
  pairScore: Phase5Distribution;
  pairGini: Phase5Distribution;
  pairEntropy: Phase5Distribution;
  pairTop1Share: Phase5Distribution;
  pairTop3Share: Phase5Distribution;
  pairMaxMeanRatio: Phase5Distribution;
  candidateMean: Phase5Distribution;
  candidateMin: Phase5Distribution;
  candidateWorstRank: Phase5Distribution;
  ensembleMean: Phase5Distribution;
  ensembleWorst: Phase5Distribution;
  ensembleStandardDeviation: Phase5Distribution;
  distance1PairMedian: Phase5Distribution;
  distance1Top500Density: Phase5Distribution;
  recall5PairMedian: Phase5Distribution;
  recall5Top500Density: Phase5Distribution;
}

export interface Phase5EngineSummary {
  engineId: Phase5EngineId;
  candidate: Phase5StageSummary;
  transitionTop100: Phase5StageSummary;
  finalTop10: Phase5StageSummary;
  preservation: {
    fivePlus: number;
    six: number;
  };
  quality: Phase5QualityAggregate;
  opportunities: readonly Phase5OpportunityQuality[];
}

export type Phase5CoreQualityMetric =
  | 'best5PairRank'
  | 'candidateMin'
  | 'ensembleWorst'
  | 'distance1PairMedian'
  | 'exact6PairRank';

export interface Phase5QualityDirection {
  metric: Phase5CoreQualityMetric;
  baselineMedian: number | null;
  candidateMedian: number | null;
  relativeChange: number | null;
  improved: boolean;
  comparable: boolean;
}

export interface Phase5LeaveOneOut {
  testedRounds: number;
  stableRounds: number;
  minimumImprovedMetrics: number;
  conclusionStable: boolean;
}

export interface Phase5DevelopmentGate {
  opportunity: boolean;
  quality: boolean;
  noSingleRoundDependency: boolean;
  delivery: boolean;
}

export interface Phase5DevelopmentComparison {
  hypothesis: Phase5HypothesisDefinition;
  summary: Phase5EngineSummary;
  qualityDirections: readonly Phase5QualityDirection[];
  improvedQualityMetrics: number;
  leaveOneOut: Phase5LeaveOneOut;
  gate: Phase5DevelopmentGate;
  result: 'KEEP' | 'REJECT';
  reason: string;
}

export interface Phase5PeriodResult {
  period: Phase5Period;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  baselines: Record<Phase5BaselineId, Phase5EngineSummary>;
  hypotheses: Partial<Record<Phase5HypothesisId, Phase5EngineSummary>>;
}

export interface Phase5Regression {
  development: {
    candidate: Phase5StageSummary;
    pair: Phase5StageSummary;
    structured: Phase5StageSummary;
  };
  historical: {
    candidate: Phase5StageSummary;
    pair: Phase5StageSummary;
    structured: Phase5StageSummary;
  };
}

export interface CandidatePhase5Result {
  metricSchemaVersion: 1;
  generatedAt: string;
  finalDecision: Phase5Decision;
  decisionBaseline: 'current-operating';
  operatingAlgorithmFrozen: true;
  combinationEngineFrozen: true;
  historicalTuningAllowed: false;
  lockedHoldoutAccessed: false;
  additionalBlindHoldoutAccessed: false;
  developmentResearchFourPlusComplete: boolean;
  options: {
    seed: 20260807;
    poolSize: 20;
    hypothesisLimit: 3;
    representativeRanking: 'transition';
    finalSelector: 'tail-coverage';
  };
  randomBaseline: ReturnType<typeof exactRandomCandidateBaseline> & {
    expectedPer192: Phase5StageSummary;
  };
  hypothesisDefinitions: readonly Phase5HypothesisDefinition[];
  development: Phase5PeriodResult;
  developmentComparisons: readonly Phase5DevelopmentComparison[];
  frozenHypothesisId: Phase5HypothesisId | null;
  historical: Phase5PeriodResult | null;
  crossPeriodQualityDirections: readonly Phase5QualityDirection[];
  gates: {
    s1Opportunity: boolean;
    s2OpportunityQuality: boolean;
    s3Delivery: boolean;
    s4Stability: boolean;
    s5NoRegressionTrick: boolean;
  };
  regression: Phase5Regression;
  reason: string;
}

interface EngineRound {
  id: Phase5EngineId;
  ranking: readonly number[];
  top20: readonly number[];
  scores: readonly number[];
  positions: readonly number[];
  recall: number;
  winningRanks: readonly number[];
}

interface EngineAccumulator {
  engineId: Phase5EngineId;
  recalls: number[];
  transitionTop100Hits: number[];
  finalTop10Hits: number[];
  opportunities: Phase5OpportunityQuality[];
}

interface FrozenRegressionAccumulator {
  candidateHits: number[];
  pairHits: number[];
  structuredHits: number[];
}

interface RankedPoolAnalysis {
  vectors: readonly CombinationVector[];
  hits: Uint8Array;
  transitionTop100: readonly CombinationCandidate[];
  transitionTop100Hit: number;
  finalTop10Hit: number;
  orders: Partial<Record<QualityRanking, readonly number[]>>;
  positions: Partial<Record<QualityRanking, Uint32Array>>;
}

type QualityRanking = 'pair' | 'transition' | 'shape' | 'number';

const DEVELOPMENT_RANGE = [1044, 1235] as const;
const HISTORICAL_RANGE = [852, 1043] as const;
const BASELINE_IDS: readonly Phase5BaselineId[] = [
  'current',
  'decay',
  'grid-transition',
];
const QUALITY_RANKINGS: readonly QualityRanking[] = [
  'pair',
  'transition',
  'shape',
  'number',
];
const TOTAL_COMBINATIONS = 38_760;
const TOP100 = 100;
const DEFAULT_SEED = 20_260_807 as const;
const GREEDY_SAMPLE_SIZE = 128;
const MIN_RANK_IMPROVEMENT = 0.1;
const MIN_PERCENTILE_IMPROVEMENT = 0.02;

/**
 * Winner-independent Phase 5 Candidate hypotheses. The three formulas and all
 * portfolio slots are fixed before Development is evaluated.
 */
export function buildPhase5CandidateHypothesis(
  numbers: readonly Phase5CandidateNumberInput[],
  hypothesisId: Phase5HypothesisId,
): Phase5CandidateRanking {
  if (numbers.length !== 45) {
    throw new Error(
      `Phase 5 requires 45 Candidate number rows; got ${numbers.length}.`,
    );
  }
  const values = Array(46).fill(0) as number[];
  const consensusValues = Array(46).fill(0) as number[];
  numbers.forEach(({ number, currentRank, decayRank, gridTransitionRank }) => {
    const sourcePercentiles = [currentRank, decayRank, gridTransitionRank].map(
      candidateRankPercentile,
    );
    const floor = Math.min(...sourcePercentiles);
    const middle = median(sourcePercentiles);
    const average = mean(sourcePercentiles);
    const agreement =
      [currentRank, decayRank, gridTransitionRank].filter((rank) => rank <= 20).length /
      3;
    const best = Math.max(...sourcePercentiles);
    consensusValues[number] = middle * 0.5 + average * 0.3 + agreement * 0.2;
    values[number] =
      hypothesisId === 'P5_A_STRONG_FLOOR'
        ? floor * 0.55 + middle * 0.3 + average * 0.15
        : hypothesisId === 'P5_B_CROSS_MODEL'
          ? consensusValues[number]!
          : consensusValues[number]! * 0.65 + best * 0.35;
  });
  const normalizedScores = normalizeNumberScores(values);
  const scoreRanking = rankByScores(normalizedScores);
  const consensusRanking = rankByScores(normalizeNumberScores(consensusValues));
  const ranking =
    hypothesisId === 'P5_C_CONTROLLED_SPECIALIST'
      ? buildControlledSpecialistRanking(numbers, consensusRanking, scoreRanking)
      : scoreRanking;
  return {
    id: hypothesisId,
    ranking,
    top20: ranking.slice(0, 20),
    normalizedScores,
  };
}

export function runCandidatePhase5FinalDecision(
  draws: readonly LottoDraw[],
  onProgress?: (
    completed: number,
    total: number,
    round: number,
    period: Phase5Period,
  ) => void,
): CandidatePhase5Result {
  validateDraws(draws);
  const developmentExecution = evaluatePeriod(
    draws,
    'development',
    DEVELOPMENT_RANGE,
    phase5HypothesisDefinitions.map(({ id }) => id),
    [],
    onProgress,
    0,
    384,
  );
  assertDevelopmentRegression(developmentExecution.regression);
  const currentDevelopment = developmentExecution.result.baselines.current;
  const developmentComparisons = phase5HypothesisDefinitions.map((hypothesis) => {
    const summary = developmentExecution.result.hypotheses[hypothesis.id];
    if (summary === undefined) throw new Error(`Missing ${hypothesis.id}.`);
    return compareDevelopmentHypothesis(hypothesis, currentDevelopment, summary);
  });
  completeDevelopmentResearchFourPlus(
    draws,
    developmentExecution.result,
    developmentComparisons,
  );
  const frozen = selectFrozenHypothesis(developmentComparisons);
  const historicalExecution = evaluatePeriod(
    draws,
    'historical-reference',
    HISTORICAL_RANGE,
    frozen === null ? [] : [frozen.hypothesis.id],
    frozen === null ? [] : [frozen.hypothesis.id],
    onProgress,
    192,
    384,
  );
  const historical = historicalExecution.result;
  const historicalFrozen =
    frozen === null || historical === null
      ? null
      : (historical.hypotheses[frozen.hypothesis.id] ?? null);
  const historicalDirections =
    historicalFrozen === null || historical === null
      ? []
      : compareQuality(historical.baselines.current.quality, historicalFrozen.quality);
  const crossPeriodQualityDirections =
    frozen === null
      ? []
      : frozen.qualityDirections.map((developmentDirection) => {
          const historicalDirection = historicalDirections.find(
            ({ metric }) => metric === developmentDirection.metric,
          );
          return {
            ...developmentDirection,
            improved:
              developmentDirection.improved && historicalDirection?.improved === true,
            comparable:
              developmentDirection.comparable &&
              historicalDirection?.comparable === true,
          };
        });
  const historicalLoo =
    historicalFrozen === null || historical === null
      ? emptyLeaveOneOut()
      : runLeaveOneOut(historical.baselines.current, historicalFrozen);
  const gates = buildFinalGates(
    currentDevelopment,
    frozen,
    historical?.baselines.current ?? null,
    historicalFrozen,
    crossPeriodQualityDirections,
    historicalLoo,
  );
  const finalDecision = decidePhase5(frozen, historicalFrozen, gates);
  const random = exactRandomCandidateBaseline(20);
  const regression: Phase5Regression = {
    development: developmentExecution.regression,
    historical: historicalExecution.regression,
  };
  assertFrozenRegression(regression);
  const reason = decisionReason(
    finalDecision,
    frozen,
    historicalFrozen,
    gates,
    crossPeriodQualityDirections,
  );
  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    finalDecision,
    decisionBaseline: 'current-operating',
    operatingAlgorithmFrozen: true,
    combinationEngineFrozen: true,
    historicalTuningAllowed: false,
    lockedHoldoutAccessed: false,
    additionalBlindHoldoutAccessed: false,
    developmentResearchFourPlusComplete: true,
    options: {
      seed: DEFAULT_SEED,
      poolSize: 20,
      hypothesisLimit: 3,
      representativeRanking: 'transition',
      finalSelector: 'tail-coverage',
    },
    randomBaseline: {
      ...random,
      expectedPer192: {
        fourPlus: random.fourPlusRate * 192,
        fivePlus: random.fivePlusRate * 192,
        six: random.sixRate * 192,
      },
    },
    hypothesisDefinitions: phase5HypothesisDefinitions,
    development: developmentExecution.result,
    developmentComparisons,
    frozenHypothesisId: frozen?.hypothesis.id ?? null,
    historical,
    crossPeriodQualityDirections,
    gates,
    regression,
    reason,
  };
}

function evaluatePeriod(
  draws: readonly LottoDraw[],
  period: Phase5Period,
  bounds: readonly [number, number],
  hypothesisIds: readonly Phase5HypothesisId[],
  fourPlusHypothesisIds: readonly Phase5HypothesisId[],
  onProgress: Parameters<typeof runCandidatePhase5FinalDecision>[1],
  progressOffset: number,
  progressTotal: number,
): {
  result: Phase5PeriodResult;
  regression: Phase5Regression['development'];
} {
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: bounds[0],
    endRound: bounds[1],
    poolSize: 20,
  });
  const engineIds: Phase5EngineId[] = [...BASELINE_IDS, ...hypothesisIds];
  const accumulators = new Map<Phase5EngineId, EngineAccumulator>(
    engineIds.map((engineId) => [engineId, newEngineAccumulator(engineId)]),
  );
  const regression: FrozenRegressionAccumulator = {
    candidateHits: [],
    pairHits: [],
    structuredHits: [],
  };
  let completed = 0;

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
    const safeInputs = safeCandidateInputs(diagnostic);
    const engines = [
      ...BASELINE_IDS.map((id) => buildBaselineEngineRound(diagnostic, id)),
      ...hypothesisIds.map((id) =>
        buildHypothesisEngineRound(safeInputs, actual.numbers, id),
      ),
    ];

    engines.forEach((engine) => {
      const accumulator = accumulators.get(engine.id)!;
      accumulator.recalls.push(engine.recall);
      accumulator.transitionTop100Hits.push(0);
      accumulator.finalTop10Hits.push(0);
    });
    const decay = engines.find(({ id }) => id === 'decay')!;
    regression.candidateHits.push(decay.recall);
    regression.pairHits.push(0);
    regression.structuredHits.push(0);

    const eligible = engines.filter(
      ({ id, recall }) =>
        recall >= 5 ||
        (recall >= 4 &&
          (id === 'current' ||
            id === 'decay' ||
            fourPlusHypothesisIds.includes(id as Phase5HypothesisId))),
    );
    const groups = groupEnginesByPool(eligible);
    let pairScores: ReadonlyMap<string, number> | null = null;
    for (const group of groups.values()) {
      const needsQuality = group.some(({ recall }) => recall >= 5);
      const containsDecay = group.some(({ id }) => id === 'decay');
      const pool = group[0]!.top20;
      const ranked = analyzePool(
        draws,
        historyIndex,
        actual.numbers,
        pool,
        needsQuality,
        containsDecay,
      );
      group.forEach((engine) => {
        const accumulator = accumulators.get(engine.id)!;
        accumulator.transitionTop100Hits[accumulator.transitionTop100Hits.length - 1] =
          ranked.transitionTop100Hit;
        accumulator.finalTop10Hits[accumulator.finalTop10Hits.length - 1] =
          ranked.finalTop10Hit;
        if (engine.recall >= 5) {
          pairScores ??= buildPairRelationshipScores(draws.slice(0, historyIndex + 1));
          accumulator.opportunities.push(
            evaluateOpportunity(period, actual, engine, safeInputs, ranked, pairScores),
          );
        }
      });

      if (containsDecay) {
        const pairOrder = ensureOrder(ranked, 'pair');
        const pairHit = maxHit(pairOrder.slice(0, TOP100), ranked.hits);
        const structured = selectPhase4StructuredTop100(
          ranked.vectors,
          decay.top20,
          'pair',
          'P4_OVERLAP_LIMIT',
          phase4SelectorSeed(actual.round, period),
          GREEDY_SAMPLE_SIZE,
        );
        regression.pairHits[regression.pairHits.length - 1] = pairHit;
        regression.structuredHits[regression.structuredHits.length - 1] = maxHit(
          structured,
          ranked.hits,
        );
      }
    }

    completed += 1;
    onProgress?.(progressOffset + completed, progressTotal, actual.round, period);
  }

  const summaries = Object.fromEntries(
    [...accumulators.entries()].map(([id, accumulator]) => [
      id,
      finishEngineAccumulator(accumulator),
    ]),
  ) as Record<Phase5EngineId, Phase5EngineSummary>;
  return {
    result: {
      period,
      startRound: bounds[0],
      endRound: bounds[1],
      evaluatedRounds: range.evaluatedRounds,
      baselines: {
        current: summaries.current,
        decay: summaries.decay,
        'grid-transition': summaries['grid-transition'],
      },
      hypotheses: Object.fromEntries(
        hypothesisIds.map((id) => [id, summaries[id]]),
      ) as Partial<Record<Phase5HypothesisId, Phase5EngineSummary>>,
    },
    regression: {
      candidate: stageSummary(regression.candidateHits),
      pair: stageSummary(regression.pairHits),
      structured: stageSummary(regression.structuredHits),
    },
  };
}

function newEngineAccumulator(engineId: Phase5EngineId): EngineAccumulator {
  return {
    engineId,
    recalls: [],
    transitionTop100Hits: [],
    finalTop10Hits: [],
    opportunities: [],
  };
}

export function completePhase5DevelopmentFourPlusDiagnostics(
  draws: readonly LottoDraw[],
  result: CandidatePhase5Result,
): CandidatePhase5Result {
  if (result.frozenHypothesisId === null) {
    result.reason =
      'No predeclared Candidate hypothesis passed the Development opportunity, quality, leave-one-out, and delivery gates. No Phase 5 hypothesis entered Historical; frozen Historical baselines were still reproduced.';
  }
  if (result.developmentResearchFourPlusComplete === true) return result;
  completeDevelopmentResearchFourPlus(
    draws,
    result.development,
    result.developmentComparisons,
  );
  result.developmentResearchFourPlusComplete = true;
  return result;
}

function completeDevelopmentResearchFourPlus(
  draws: readonly LottoDraw[],
  development: Phase5PeriodResult,
  comparisons: readonly Phase5DevelopmentComparison[],
): void {
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: DEVELOPMENT_RANGE[0],
    endRound: DEVELOPMENT_RANGE[1],
    poolSize: 20,
  });
  const additions = Object.fromEntries(
    phase5HypothesisDefinitions.map(({ id }) => [id, { top100: 0, top10: 0 }]),
  ) as Record<Phase5HypothesisId, { top100: number; top10: number }>;
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
    const safeInputs = safeCandidateInputs(diagnostic);
    const engines = phase5HypothesisDefinitions
      .map(({ id }) => buildHypothesisEngineRound(safeInputs, actual.numbers, id))
      .filter(({ recall }) => recall === 4);
    const groups = groupEnginesByPool(engines);
    groups.forEach((group) => {
      const analysis = analyzePool(
        draws,
        historyIndex,
        actual.numbers,
        group[0]!.top20,
        false,
        false,
      );
      group.forEach(({ id }) => {
        const target = additions[id as Phase5HypothesisId];
        if (analysis.transitionTop100Hit >= 4) target.top100 += 1;
        if (analysis.finalTop10Hit >= 4) target.top10 += 1;
      });
    });
  }
  phase5HypothesisDefinitions.forEach(({ id }) => {
    const summary = development.hypotheses[id];
    if (summary === undefined) throw new Error(`Missing Development ${id}.`);
    summary.transitionTop100.fourPlus += additions[id].top100;
    summary.finalTop10.fourPlus += additions[id].top10;
    const comparison = comparisons.find(({ hypothesis }) => hypothesis.id === id);
    if (comparison === undefined) throw new Error(`Missing comparison ${id}.`);
    comparison.summary.transitionTop100.fourPlus = summary.transitionTop100.fourPlus;
    comparison.summary.finalTop10.fourPlus = summary.finalTop10.fourPlus;
  });
}

function finishEngineAccumulator(accumulator: EngineAccumulator): Phase5EngineSummary {
  const candidate = stageSummary(accumulator.recalls);
  const transitionTop100 = stageSummary(accumulator.transitionTop100Hits);
  const finalTop10 = stageSummary(accumulator.finalTop10Hits);
  return {
    engineId: accumulator.engineId,
    candidate,
    transitionTop100,
    finalTop10,
    preservation: {
      fivePlus: ratio(transitionTop100.fivePlus, candidate.fivePlus),
      six: ratio(transitionTop100.six, candidate.six),
    },
    quality: aggregateQuality(accumulator.opportunities),
    opportunities: accumulator.opportunities,
  };
}

function safeCandidateInputs(
  diagnostic: CandidateRoundDiagnostic,
): Phase5CandidateNumberInput[] {
  return diagnostic.numbers.map(({ number, ranks }) => ({
    number,
    currentRank: ranks.current ?? 45,
    decayRank: ranks.decay ?? 45,
    gridTransitionRank: ranks['grid-transition'] ?? 45,
  }));
}

function buildBaselineEngineRound(
  diagnostic: CandidateRoundDiagnostic,
  id: Phase5BaselineId,
): EngineRound {
  const result = diagnostic.rankings[id];
  if (result === undefined) throw new Error(`Missing frozen Candidate source ${id}.`);
  const ranking = diagnostic.numbers
    .map(({ number, ranks }) => ({ number, rank: ranks[id] ?? 45 }))
    .sort((left, right) => left.rank - right.rank || left.number - right.number)
    .map(({ number }) => number);
  const rawScores = Array(46).fill(0) as number[];
  diagnostic.numbers.forEach(({ number, currentScore, features }) => {
    rawScores[number] =
      id === 'current'
        ? currentScore
        : id === 'decay'
          ? features.decay
          : features.transitionSupport;
  });
  return {
    id,
    ranking,
    top20: result.top20,
    scores: normalizeNumberScores(rawScores),
    positions: rankPositions(ranking),
    recall: result.recall,
    winningRanks: result.winningRanks,
  };
}

function buildHypothesisEngineRound(
  inputs: readonly Phase5CandidateNumberInput[],
  winningNumbers: readonly number[],
  id: Phase5HypothesisId,
): EngineRound {
  const built = buildPhase5CandidateHypothesis(inputs, id);
  const positions = rankPositions(built.ranking);
  const winningRanks = winningNumbers
    .map((number) => positions[number]!)
    .sort((left, right) => left - right);
  return {
    id,
    ranking: built.ranking,
    top20: built.top20,
    scores: built.normalizedScores,
    positions,
    recall: winningRanks.filter((rank) => rank <= 20).length,
    winningRanks,
  };
}

function groupEnginesByPool(
  engines: readonly EngineRound[],
): Map<string, EngineRound[]> {
  const groups = new Map<string, EngineRound[]>();
  engines.forEach((engine) => {
    const key = [...engine.top20].sort((left, right) => left - right).join('-');
    const stored = groups.get(key) ?? [];
    stored.push(engine);
    groups.set(key, stored);
  });
  return groups;
}

function analyzePool(
  draws: readonly LottoDraw[],
  historyIndex: number,
  winningNumbers: readonly number[],
  candidateTop20: readonly number[],
  needsQuality: boolean,
  needsPairRegression: boolean,
): RankedPoolAnalysis {
  const analysis = buildCombinationAnalysis(
    draws,
    historyIndex,
    20,
    false,
    'full-enumeration',
    candidateTop20,
    ['transition'],
  );
  if (
    !analysis.generationComplete ||
    analysis.rawCombinationCount !== TOTAL_COMBINATIONS
  ) {
    throw new Error(
      `Phase 5 requires 38,760 combinations; got ${analysis.rawCombinationCount}.`,
    );
  }
  const winning = new Set(winningNumbers);
  const hits = Uint8Array.from(
    analysis.generatedCombinations.map(({ numbers }) =>
      numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
    ),
  );
  const transitionTop100 = analysis.researchByStrategy.transition;
  const transitionTop100Hit = maximumCandidateHit(transitionTop100, winningNumbers);
  const finalTop10 = buildTailCoverageGames(transitionTop100, 'board');
  const finalTop10Hit = maximumCandidateHit(finalTop10, winningNumbers);
  const ranked: RankedPoolAnalysis = {
    vectors: analysis.generatedCombinations,
    hits,
    transitionTop100,
    transitionTop100Hit,
    finalTop10Hit,
    orders: {},
    positions: {},
  };
  if (needsQuality) {
    QUALITY_RANKINGS.forEach((strategy) => buildOrder(ranked, strategy));
  } else if (needsPairRegression) {
    buildOrder(ranked, 'pair');
  }
  return ranked;
}

function buildOrder(analysis: RankedPoolAnalysis, strategy: QualityRanking): void {
  const keys = analysis.vectors.map(({ numbers }) => numbers.join('-'));
  const scores = Float64Array.from(analysis.vectors, ({ features }) =>
    combinationScoreFor(features, strategy),
  );
  const order = Array.from(
    { length: analysis.vectors.length },
    (_, index) => index,
  ).sort(
    (left, right) =>
      scores[right]! - scores[left]! || keys[left]!.localeCompare(keys[right]!),
  );
  analysis.orders[strategy] = order;
  analysis.positions[strategy] = positionsFor(order);
}

function ensureOrder(
  analysis: RankedPoolAnalysis,
  strategy: QualityRanking,
): readonly number[] {
  if (analysis.orders[strategy] === undefined) buildOrder(analysis, strategy);
  return analysis.orders[strategy]!;
}

function ensurePositions(
  analysis: RankedPoolAnalysis,
  strategy: QualityRanking,
): Uint32Array {
  ensureOrder(analysis, strategy);
  return analysis.positions[strategy]!;
}

function evaluateOpportunity(
  period: Phase5Period,
  actual: LottoDraw,
  engine: EngineRound,
  safeInputs: readonly Phase5CandidateNumberInput[],
  analysis: RankedPoolAnalysis,
  pairScores: ReadonlyMap<string, number>,
): Phase5OpportunityQuality {
  const pairPositions = ensurePositions(analysis, 'pair');
  QUALITY_RANKINGS.forEach((strategy) => ensurePositions(analysis, strategy));
  const winnerRelated = indicesAtLeast(analysis.hits, 5);
  const targetIndex = [...winnerRelated].sort(
    (left, right) => pairPositions[left]! - pairPositions[right]!,
  )[0];
  if (targetIndex === undefined) {
    throw new Error(`Round ${actual.round} has Candidate 5+ without a 5+ combination.`);
  }
  const exactIndex = analysis.hits.findIndex((hit) => hit === 6);
  const matchedWinners = actual.numbers.filter(
    (number) => engine.positions[number]! <= 20,
  );
  const matchedScores = matchedWinners.map((number) => engine.scores[number]!);
  const sourceByNumber = new Map(safeInputs.map((input) => [input.number, input]));
  const candidate: Phase5CandidateNumberQuality = {
    scoreMean: mean(matchedScores),
    scoreMedian: median(matchedScores),
    scoreMin: Math.min(...matchedScores),
    scoreStandardDeviation: standardDeviation(matchedScores),
    lowestWinnerNumberRank: Math.max(
      ...matchedWinners.map((number) => engine.positions[number]!),
    ),
    worstWinnerSourceRank: Math.max(
      ...matchedWinners.flatMap((number) => {
        const input = sourceByNumber.get(number)!;
        return [input.currentRank, input.decayRank, input.gridTransitionRank];
      }),
    ),
  };
  const recall5Indices = engine.recall === 5 ? exactHitIndices(analysis.hits, 5) : [];
  const distance1Indices = engine.recall === 6 ? exactHitIndices(analysis.hits, 5) : [];
  if (engine.recall === 6 && distance1Indices.length !== 84) {
    throw new Error(
      `Round ${actual.round} expected 84 distance-1 combinations; got ${distance1Indices.length}.`,
    );
  }
  const distanceLayers: Phase5DistanceLayer[] =
    engine.recall === 6
      ? ([0, 1, 2, 3] as const).map((distance) => ({
          distance,
          ...basinMetrics(analysis, exactHitIndices(analysis.hits, 6 - distance)),
        }))
      : [];
  return {
    round: actual.round,
    period,
    engineId: engine.id,
    candidateRecall: engine.recall,
    winningRanks: engine.winningRanks,
    best5PairRank: pairPositions[targetIndex]!,
    exact6:
      exactIndex < 0 ? null : combinationQuality(analysis, exactIndex, pairScores),
    target: combinationQuality(analysis, targetIndex, pairScores),
    candidate,
    recall5Basin:
      recall5Indices.length === 0 ? null : basinMetrics(analysis, recall5Indices),
    distance1Basin:
      distance1Indices.length === 0 ? null : basinMetrics(analysis, distance1Indices),
    distanceLayers,
    transitionTop100Hit: analysis.transitionTop100Hit,
    finalTop10Hit: analysis.finalTop10Hit,
  };
}

function combinationQuality(
  analysis: RankedPoolAnalysis,
  vectorIndex: number,
  pairScores: ReadonlyMap<string, number>,
): Phase5CombinationQuality {
  const vector = analysis.vectors[vectorIndex]!;
  const ranks = QUALITY_RANKINGS.map(
    (strategy) => ensurePositions(analysis, strategy)[vectorIndex]!,
  );
  const percentiles = ranks.map((rank) => combinationRankPercentile(rank));
  const constituentPairScores = combinations(vector.numbers, 2).map(
    (pair) => pairScores.get(pair.join('-')) ?? 0,
  );
  return {
    vectorIndex,
    numbers: vector.numbers,
    pairRank: ranks[0]!,
    transitionRank: ranks[1]!,
    shapeRank: ranks[2]!,
    numberRank: ranks[3]!,
    pairScore: vector.features.pairScore,
    pairPercentile: percentiles[0]!,
    pairGini: gini(constituentPairScores),
    pairEntropy: normalizedEntropy(constituentPairScores),
    pairTop1Share: topShare(constituentPairScores, 1),
    pairTop3Share: topShare(constituentPairScores, 3),
    pairMaxMeanRatio: ratio(
      Math.max(...constituentPairScores),
      mean(constituentPairScores),
    ),
    ensembleMeanPercentile: mean(percentiles),
    ensembleMedianPercentile: median(percentiles),
    ensembleWorstPercentile: Math.min(...percentiles),
    ensembleBestPercentile: Math.max(...percentiles),
    ensemblePercentileStandardDeviation: standardDeviation(percentiles),
    top100Agreement: ranks.filter((rank) => rank <= 100).length,
    top500Agreement: ranks.filter((rank) => rank <= 500).length,
    top1000Agreement: ranks.filter((rank) => rank <= 1000).length,
  };
}

function basinMetrics(
  analysis: RankedPoolAnalysis,
  indices: readonly number[],
): Phase5BasinMetrics {
  if (indices.length === 0) return emptyBasinMetrics();
  const ranks = Object.fromEntries(
    QUALITY_RANKINGS.map((strategy) => [
      strategy,
      indices.map((index) => ensurePositions(analysis, strategy)[index]!),
    ]),
  ) as Record<QualityRanking, number[]>;
  const pairDistribution = distribution(ranks.pair);
  const floorPercentiles = indices.map((_, offset) =>
    Math.min(
      ...QUALITY_RANKINGS.map((strategy) =>
        combinationRankPercentile(ranks[strategy][offset]!),
      ),
    ),
  );
  const agreementCount = indices.reduce(
    (total, _, offset) =>
      total +
      QUALITY_RANKINGS.filter((strategy) => ranks[strategy][offset]! <= 100).length,
    0,
  );
  const density = mean(
    indices.map((_, offset) =>
      mean(
        QUALITY_RANKINGS.map((strategy) =>
          combinationRankPercentile(ranks[strategy][offset]!),
        ),
      ),
    ),
  );
  return {
    combinations: indices.length,
    pairRankMedian: pairDistribution.median,
    pairRankQ1: pairDistribution.q1,
    pairRankQ3: pairDistribution.q3,
    pairRankBest: pairDistribution.min,
    pairTop100Count: ranks.pair.filter((rank) => rank <= 100).length,
    pairTop500Count: ranks.pair.filter((rank) => rank <= 500).length,
    pairTop1000Count: ranks.pair.filter((rank) => rank <= 1000).length,
    pairTop100Density: ratio(
      ranks.pair.filter((rank) => rank <= 100).length,
      indices.length,
    ),
    pairTop500Density: ratio(
      ranks.pair.filter((rank) => rank <= 500).length,
      indices.length,
    ),
    pairTop1000Density: ratio(
      ranks.pair.filter((rank) => rank <= 1000).length,
      indices.length,
    ),
    transitionRankMedian: median(ranks.transition),
    shapeRankMedian: median(ranks.shape),
    numberRankMedian: median(ranks.number),
    ensembleFloorMedian: median(floorPercentiles),
    top100AgreementCount: agreementCount,
    rankDensity: density,
  };
}

function emptyBasinMetrics(): Phase5BasinMetrics {
  return {
    combinations: 0,
    pairRankMedian: 0,
    pairRankQ1: 0,
    pairRankQ3: 0,
    pairRankBest: 0,
    pairTop100Count: 0,
    pairTop500Count: 0,
    pairTop1000Count: 0,
    pairTop100Density: 0,
    pairTop500Density: 0,
    pairTop1000Density: 0,
    transitionRankMedian: 0,
    shapeRankMedian: 0,
    numberRankMedian: 0,
    ensembleFloorMedian: 0,
    top100AgreementCount: 0,
    rankDensity: 0,
  };
}

function aggregateQuality(
  opportunities: readonly Phase5OpportunityQuality[],
): Phase5QualityAggregate {
  return {
    opportunities: opportunities.length,
    best5PairRank: distribution(
      opportunities.map(({ best5PairRank }) => best5PairRank),
    ),
    exact6PairRank: distribution(
      opportunities.flatMap(({ exact6 }) => (exact6 === null ? [] : [exact6.pairRank])),
    ),
    pairScore: distribution(opportunities.map(({ target }) => target.pairScore)),
    pairGini: distribution(opportunities.map(({ target }) => target.pairGini)),
    pairEntropy: distribution(opportunities.map(({ target }) => target.pairEntropy)),
    pairTop1Share: distribution(
      opportunities.map(({ target }) => target.pairTop1Share),
    ),
    pairTop3Share: distribution(
      opportunities.map(({ target }) => target.pairTop3Share),
    ),
    pairMaxMeanRatio: distribution(
      opportunities.map(({ target }) => target.pairMaxMeanRatio),
    ),
    candidateMean: distribution(
      opportunities.map(({ candidate }) => candidate.scoreMean),
    ),
    candidateMin: distribution(
      opportunities.map(({ candidate }) => candidate.scoreMin),
    ),
    candidateWorstRank: distribution(
      opportunities.map(({ candidate }) => candidate.lowestWinnerNumberRank),
    ),
    ensembleMean: distribution(
      opportunities.map(({ target }) => target.ensembleMeanPercentile),
    ),
    ensembleWorst: distribution(
      opportunities.map(({ target }) => target.ensembleWorstPercentile),
    ),
    ensembleStandardDeviation: distribution(
      opportunities.map(({ target }) => target.ensemblePercentileStandardDeviation),
    ),
    distance1PairMedian: distribution(
      opportunities.flatMap(({ distance1Basin }) =>
        distance1Basin === null ? [] : [distance1Basin.pairRankMedian],
      ),
    ),
    distance1Top500Density: distribution(
      opportunities.flatMap(({ distance1Basin }) =>
        distance1Basin === null ? [] : [distance1Basin.pairTop500Density],
      ),
    ),
    recall5PairMedian: distribution(
      opportunities.flatMap(({ recall5Basin }) =>
        recall5Basin === null ? [] : [recall5Basin.pairRankMedian],
      ),
    ),
    recall5Top500Density: distribution(
      opportunities.flatMap(({ recall5Basin }) =>
        recall5Basin === null ? [] : [recall5Basin.pairTop500Density],
      ),
    ),
  };
}

function compareDevelopmentHypothesis(
  hypothesis: Phase5HypothesisDefinition,
  baseline: Phase5EngineSummary,
  candidate: Phase5EngineSummary,
): Phase5DevelopmentComparison {
  const qualityDirections = compareQuality(baseline.quality, candidate.quality);
  const improvedQualityMetrics = qualityDirections.filter(
    ({ improved }) => improved,
  ).length;
  const leaveOneOut = runLeaveOneOut(baseline, candidate);
  const gate: Phase5DevelopmentGate = {
    opportunity:
      candidate.candidate.fivePlus >= baseline.candidate.fivePlus &&
      candidate.candidate.fivePlus > 0,
    quality: improvedQualityMetrics >= 2,
    noSingleRoundDependency: leaveOneOut.conclusionStable,
    delivery: candidate.transitionTop100.fivePlus >= baseline.transitionTop100.fivePlus,
  };
  const kept = Object.values(gate).every(Boolean);
  return {
    hypothesis,
    summary: candidate,
    qualityDirections,
    improvedQualityMetrics,
    leaveOneOut,
    gate,
    result: kept ? 'KEEP' : 'REJECT',
    reason: kept
      ? `${improvedQualityMetrics} core quality metrics improved and all Development gates passed.`
      : `Failed Development gates: ${Object.entries(gate)
          .filter(([, passed]) => !passed)
          .map(([name]) => name)
          .join(', ')}.`,
  };
}

function compareQuality(
  baseline: Phase5QualityAggregate,
  candidate: Phase5QualityAggregate,
): Phase5QualityDirection[] {
  const definitions: readonly {
    metric: Phase5CoreQualityMetric;
    baseline: Phase5Distribution;
    candidate: Phase5Distribution;
    direction: 'lower' | 'higher';
    threshold: number;
  }[] = [
    {
      metric: 'best5PairRank',
      baseline: baseline.best5PairRank,
      candidate: candidate.best5PairRank,
      direction: 'lower',
      threshold: MIN_RANK_IMPROVEMENT,
    },
    {
      metric: 'candidateMin',
      baseline: baseline.candidateMin,
      candidate: candidate.candidateMin,
      direction: 'higher',
      threshold: MIN_PERCENTILE_IMPROVEMENT,
    },
    {
      metric: 'ensembleWorst',
      baseline: baseline.ensembleWorst,
      candidate: candidate.ensembleWorst,
      direction: 'higher',
      threshold: MIN_PERCENTILE_IMPROVEMENT,
    },
    {
      metric: 'distance1PairMedian',
      baseline: baseline.distance1PairMedian,
      candidate: candidate.distance1PairMedian,
      direction: 'lower',
      threshold: MIN_RANK_IMPROVEMENT,
    },
    {
      metric: 'exact6PairRank',
      baseline: baseline.exact6PairRank,
      candidate: candidate.exact6PairRank,
      direction: 'lower',
      threshold: MIN_RANK_IMPROVEMENT,
    },
  ];
  return definitions.map((definition) => {
    const comparable = definition.baseline.count > 0 && definition.candidate.count > 0;
    const baselineMedian = comparable ? definition.baseline.median : null;
    const candidateMedian = comparable ? definition.candidate.median : null;
    const relativeChange =
      baselineMedian === null || candidateMedian === null
        ? null
        : definition.direction === 'lower'
          ? ratio(baselineMedian - candidateMedian, Math.abs(baselineMedian))
          : candidateMedian - baselineMedian;
    return {
      metric: definition.metric,
      baselineMedian,
      candidateMedian,
      relativeChange,
      comparable,
      improved:
        comparable && relativeChange !== null && relativeChange >= definition.threshold,
    };
  });
}

function runLeaveOneOut(
  baseline: Phase5EngineSummary,
  candidate: Phase5EngineSummary,
): Phase5LeaveOneOut {
  const rounds = [
    ...new Set([
      ...baseline.opportunities.map(({ round }) => round),
      ...candidate.opportunities.map(({ round }) => round),
    ]),
  ];
  if (rounds.length === 0) return emptyLeaveOneOut();
  let stableRounds = 0;
  let minimumImprovedMetrics = Number.POSITIVE_INFINITY;
  rounds.forEach((removedRound) => {
    const baselineOpportunities = baseline.opportunities.filter(
      ({ round }) => round !== removedRound,
    );
    const candidateOpportunities = candidate.opportunities.filter(
      ({ round }) => round !== removedRound,
    );
    const improvedMetrics = compareQuality(
      aggregateQuality(baselineOpportunities),
      aggregateQuality(candidateOpportunities),
    ).filter(({ improved }) => improved).length;
    minimumImprovedMetrics = Math.min(minimumImprovedMetrics, improvedMetrics);
    const baselineDelivery = baselineOpportunities.filter(
      ({ transitionTop100Hit }) => transitionTop100Hit >= 5,
    ).length;
    const candidateDelivery = candidateOpportunities.filter(
      ({ transitionTop100Hit }) => transitionTop100Hit >= 5,
    ).length;
    if (
      candidateOpportunities.length >= baselineOpportunities.length &&
      improvedMetrics >= 2 &&
      candidateDelivery >= baselineDelivery
    ) {
      stableRounds += 1;
    }
  });
  return {
    testedRounds: rounds.length,
    stableRounds,
    minimumImprovedMetrics: Number.isFinite(minimumImprovedMetrics)
      ? minimumImprovedMetrics
      : 0,
    conclusionStable: stableRounds === rounds.length,
  };
}

function emptyLeaveOneOut(): Phase5LeaveOneOut {
  return {
    testedRounds: 0,
    stableRounds: 0,
    minimumImprovedMetrics: 0,
    conclusionStable: false,
  };
}

function selectFrozenHypothesis(
  comparisons: readonly Phase5DevelopmentComparison[],
): Phase5DevelopmentComparison | null {
  return (
    [...comparisons]
      .filter(({ result }) => result === 'KEEP')
      .sort(
        (left, right) =>
          right.improvedQualityMetrics - left.improvedQualityMetrics ||
          right.leaveOneOut.minimumImprovedMetrics -
            left.leaveOneOut.minimumImprovedMetrics ||
          right.summary.candidate.fivePlus - left.summary.candidate.fivePlus ||
          right.summary.candidate.six - left.summary.candidate.six ||
          right.summary.transitionTop100.fivePlus -
            left.summary.transitionTop100.fivePlus ||
          right.summary.transitionTop100.six - left.summary.transitionTop100.six ||
          right.summary.candidate.fourPlus - left.summary.candidate.fourPlus ||
          left.hypothesis.id.localeCompare(right.hypothesis.id),
      )[0] ?? null
  );
}

function buildFinalGates(
  developmentBaseline: Phase5EngineSummary,
  frozen: Phase5DevelopmentComparison | null,
  historicalBaseline: Phase5EngineSummary | null,
  historicalFrozen: Phase5EngineSummary | null,
  crossPeriodDirections: readonly Phase5QualityDirection[],
  historicalLoo: Phase5LeaveOneOut,
): CandidatePhase5Result['gates'] {
  if (frozen === null || historicalBaseline === null || historicalFrozen === null) {
    return {
      s1Opportunity: false,
      s2OpportunityQuality: false,
      s3Delivery: false,
      s4Stability: false,
      s5NoRegressionTrick: false,
    };
  }
  const developmentFrozen = frozen.summary;
  const s1Opportunity =
    developmentFrozen.candidate.fivePlus >= developmentBaseline.candidate.fivePlus &&
    historicalFrozen.candidate.fivePlus >= historicalBaseline.candidate.fivePlus;
  const s2OpportunityQuality =
    crossPeriodDirections.filter(({ improved }) => improved).length >= 2;
  const deliveryMaintained =
    developmentFrozen.transitionTop100.fivePlus >=
      developmentBaseline.transitionTop100.fivePlus &&
    historicalFrozen.transitionTop100.fivePlus >=
      historicalBaseline.transitionTop100.fivePlus;
  const deliveryImproved =
    developmentFrozen.transitionTop100.fivePlus >
      developmentBaseline.transitionTop100.fivePlus ||
    historicalFrozen.transitionTop100.fivePlus >
      historicalBaseline.transitionTop100.fivePlus;
  const s3Delivery = deliveryMaintained && deliveryImproved;
  const s4Stability =
    frozen.leaveOneOut.conclusionStable && historicalLoo.conclusionStable;
  const s5NoRegressionTrick =
    s1Opportunity &&
    s2OpportunityQuality &&
    (developmentFrozen.candidate.fivePlus > developmentBaseline.candidate.fivePlus ||
      historicalFrozen.candidate.fivePlus > historicalBaseline.candidate.fivePlus ||
      s3Delivery);
  return {
    s1Opportunity,
    s2OpportunityQuality,
    s3Delivery,
    s4Stability,
    s5NoRegressionTrick,
  };
}

function decidePhase5(
  frozen: Phase5DevelopmentComparison | null,
  historicalFrozen: Phase5EngineSummary | null,
  gates: CandidatePhase5Result['gates'],
): Phase5Decision {
  if (Object.values(gates).every(Boolean)) return 'SUCCESS';
  if (frozen === null || historicalFrozen === null) return 'FAIL';
  if (
    (!gates.s1Opportunity && !gates.s2OpportunityQuality) ||
    (!gates.s2OpportunityQuality && !gates.s3Delivery)
  ) {
    return 'FAIL';
  }
  return 'INCONCLUSIVE';
}

function decisionReason(
  decision: Phase5Decision,
  frozen: Phase5DevelopmentComparison | null,
  historicalFrozen: Phase5EngineSummary | null,
  gates: CandidatePhase5Result['gates'],
  crossPeriodDirections: readonly Phase5QualityDirection[],
): string {
  if (frozen === null) {
    return 'No predeclared Candidate hypothesis passed the Development opportunity, quality, leave-one-out, and delivery gates. No Phase 5 hypothesis entered Historical; frozen Historical baselines were still reproduced.';
  }
  const qualityCount = crossPeriodDirections.filter(({ improved }) => improved).length;
  if (decision === 'SUCCESS') {
    return `${frozen.hypothesis.id} preserved 5+ opportunity in both periods, improved ${qualityCount} core quality metrics in the same direction, and improved frozen Top100 delivery without leave-one-out dependence.`;
  }
  if (decision === 'INCONCLUSIVE') {
    return `${frozen.hypothesis.id} showed partial cross-period evidence, but the full SUCCESS gate set was not stable: ${Object.entries(
      gates,
    )
      .filter(([, passed]) => !passed)
      .map(([name]) => name)
      .join(', ')}.`;
  }
  return `${frozen.hypothesis.id} did not reproduce a viable Candidate landscape on Historical${
    historicalFrozen === null ? ' because frozen validation was not eligible' : ''
  }; failed gates: ${Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)
    .join(', ')}.`;
}

export function buildPhase5DecisionReport(result: CandidatePhase5Result): string {
  const frozenId = result.frozenHypothesisId;
  const developmentFrozen =
    frozenId === null ? null : (result.development.hypotheses[frozenId] ?? null);
  const historicalFrozen =
    frozenId === null || result.historical === null
      ? null
      : (result.historical.hypotheses[frozenId] ?? null);
  const opportunityRows = BASELINE_IDS.map((id) =>
    opportunityTableRow(
      id,
      result.development.baselines[id],
      result.historical?.baselines[id] ?? null,
    ),
  );
  if (frozenId !== null && developmentFrozen !== null) {
    opportunityRows.push(
      opportunityTableRow(frozenId, developmentFrozen, historicalFrozen),
    );
  }
  const qualityRows: readonly [string, keyof Phase5QualityAggregate][] = [
    ['best-5 Pair rank median', 'best5PairRank'],
    ['Pair score', 'pairScore'],
    ['Pair Gini', 'pairGini'],
    ['Pair entropy', 'pairEntropy'],
    ['Candidate mean', 'candidateMean'],
    ['Candidate min', 'candidateMin'],
    ['Ensemble mean', 'ensembleMean'],
    ['Ensemble worst', 'ensembleWorst'],
    ['Distance-1 Pair median', 'distance1PairMedian'],
    ['Distance-1 Top500 density', 'distance1Top500Density'],
  ];
  const recallSixRows = [
    ...Object.values(result.development.baselines),
    ...Object.values(result.development.hypotheses),
    ...(result.historical === null
      ? []
      : [
          ...Object.values(result.historical.baselines),
          ...Object.values(result.historical.hypotheses),
        ]),
  ]
    .flatMap((summary) => summary?.opportunities ?? [])
    .filter(({ candidateRecall }) => candidateRecall === 6)
    .map(({ round, period, engineId, exact6, distance1Basin }) =>
      [
        round,
        period,
        engineId,
        exact6?.pairRank ?? '-',
        exact6?.transitionRank ?? '-',
        exact6?.shapeRank ?? '-',
        exact6?.numberRank ?? '-',
        distance1Basin?.pairRankMedian ?? '-',
        distance1Basin?.pairTop500Count ?? '-',
      ].join(' | '),
    );
  const developmentComparisonRows = result.developmentComparisons.map(
    ({
      hypothesis,
      summary,
      improvedQualityMetrics,
      leaveOneOut,
      result: gateResult,
    }) =>
      `${hypothesis.id} | ${formatStage(summary.candidate)} | ${improvedQualityMetrics} | ${leaveOneOut.stableRounds}/${leaveOneOut.testedRounds} | ${formatStage(summary.transitionTop100)} | ${gateResult}`,
  );
  const developmentQualityRows = [
    result.development.baselines.current,
    ...result.developmentComparisons.map(({ summary }) => summary),
  ].map(({ engineId, quality }) =>
    [
      engineId,
      qualityMedian(quality, 'best5PairRank'),
      qualityMedian(quality, 'candidateMin'),
      qualityMedian(quality, 'ensembleWorst'),
      qualityMedian(quality, 'exact6PairRank'),
      qualityMedian(quality, 'distance1PairMedian'),
    ].join(' | '),
  );
  const deliveryRows = [
    deliveryTableRow('Development Current', result.development.baselines.current),
    ...result.developmentComparisons.map(({ hypothesis, summary }) =>
      deliveryTableRow(`Development ${hypothesis.id}`, summary),
    ),
    ...(result.historical === null
      ? []
      : [deliveryTableRow('Historical Current', result.historical.baselines.current)]),
    ...(historicalFrozen === null
      ? []
      : [deliveryTableRow(`Historical ${frozenId}`, historicalFrozen)]),
  ];
  const sameDirection = result.crossPeriodQualityDirections
    .filter(({ improved }) => improved)
    .map(({ metric }) => metric);
  const questions = [
    `1. Candidate Recall은 개선됐는가? ${answerOpportunity(result, developmentFrozen, historicalFrozen)}`,
    `2. 5+/6 Opportunity Quality도 같이 개선됐는가? ${answerQuality(result, sameDirection)}`,
    `3. exact winner rank는 상위 영역으로 이동했는가? ${answerExactRank(result)}`,
    `4. winner 주변 distance-1 basin이 형성됐는가? ${answerDistanceOne(result, developmentFrozen, historicalFrozen)}`,
    `5. 여러 ranking의 ensemble floor가 개선됐는가? ${answerMetric(result, 'ensembleWorst')}`,
    `6. Development 개선이 Historical에서도 같은 방향으로 재현됐는가? ${frozenId === null ? '검증하지 않았다. Development gate에서 모든 가설이 탈락해 P5 가설은 Historical에 진입하지 않았다.' : sameDirection.length >= 2 ? '예.' : '충분히 재현되지 않았다.'}`,
    `7. Top100 전달력이 개선됐는가? ${result.gates.s3Delivery ? '예.' : '아니요.'}`,
    `8. 개선이 특정 1~2회에 의존하는가? ${result.gates.s4Stability ? '아니요. 두 기간 LOO가 유지됐다.' : '예 또는 판단 불가. LOO 안정성 gate를 통과하지 못했다.'}`,
    `9. 현재 Uriel v1을 계속 연구할 근거가 있는가? ${result.finalDecision === 'SUCCESS' ? 'Locked Validation을 한 번 수행할 근거가 있다.' : '없다. v1 추가 개발과 Locked/Blind 실행을 중단한다.'}`,
    `10. 최종 판정은 무엇인가? ${result.finalDecision}.`,
  ];

  return `# FINAL DECISION: ${result.finalDecision}

## Uriel Phase 5 — Candidate Opportunity Quality & Final Viability Decision

${result.reason}

- Decision baseline: Current operating Candidate
- Frozen hypothesis: ${frozenId ?? 'none — no Development hypothesis passed'}
- Operating path: Current Candidate → Transition Top100 → Tail Coverage Final Top10 (unchanged)
- Locked Holdout accessed: no
- Additional Blind Holdout accessed: no

## Predeclared Candidate hypotheses

| Hypothesis | Fixed design | Expected effect |
| --- | --- | --- |
${result.hypothesisDefinitions.map(({ id, fixedPortfolio, expectedEffect }) => `${id} | ${fixedPortfolio} | ${expectedEffect}`).join('\n')}

## Development selection

| Hypothesis | Candidate 4+/5+/6 | Improved core metrics | Stable LOO | Transition Top100 4+/5+/6 | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
${developmentComparisonRows.join('\n')}

### Development hypothesis quality

| Engine | best-5 Pair median | Candidate min | Ensemble worst | Exact-6 Pair | D1 Pair median |
| --- | ---: | ---: | ---: | ---: | ---: |
${developmentQualityRows.join('\n')}

## Candidate Opportunity

| Engine | Development 4+/5+/6 | Historical 4+/5+/6 |
| --- | ---: | ---: |
${opportunityRows.join('\n')}

Exact Random Top20 expected per 192 rounds: ${formatStage(result.randomBaseline.expectedPer192)}.

## Opportunity Quality

| Metric | Dev Current | Dev P5 | Hist Current | Hist P5 |
| --- | ---: | ---: | ---: | ---: |
${qualityRows
  .map(([label, key]) =>
    [
      label,
      qualityMedian(result.development.baselines.current.quality, key),
      qualityMedian(developmentFrozen?.quality ?? null, key),
      qualityMedian(result.historical?.baselines.current.quality ?? null, key),
      qualityMedian(historicalFrozen?.quality ?? null, key),
    ].join(' | '),
  )
  .join('\n')}

Core quality metrics improving in both periods: ${sameDirection.length === 0 ? 'none' : sameDirection.join(', ')}.

## Recall 6 detail

| Round | Period | Engine | Exact Pair | Transition | Shape | Number | D1 Pair Median | D1 Top500 |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
${recallSixRows.length === 0 ? '- | - | No Recall 6 opportunity | - | - | - | - | - | -' : recallSixRows.join('\n')}

## Top100 Delivery and Final Top10

| Engine | Candidate 4+/5+/6 | Transition Top100 4+/5+/6 | 5+ preservation | Final Top10 4+/5+/6 |
| --- | ---: | ---: | ---: | ---: |
${deliveryRows.join('\n')}

## Frozen regression

| Period | Decay Candidate | Pair Top100 | P4_OVERLAP_LIMIT |
| --- | ---: | ---: | ---: |
Development | ${formatStage(result.regression.development.candidate)} | ${formatStage(result.regression.development.pair)} | ${formatStage(result.regression.development.structured)}
Historical | ${formatStage(result.regression.historical.candidate)} | ${formatStage(result.regression.historical.pair)} | ${formatStage(result.regression.historical.structured)}

## Final questions

${questions.join('\n\n')}

## Interpretation

SUCCESS would only authorize one frozen Locked Validation run. INCONCLUSIVE or FAIL ends or indefinitely pauses Uriel v1; neither authorizes Phase 6, Candidate/Combination retuning, or Locked/Blind access.
`;
}

function buildControlledSpecialistRanking(
  numbers: readonly Phase5CandidateNumberInput[],
  consensusRanking: readonly number[],
  fallback: readonly number[],
): number[] {
  const selected = consensusRanking.slice(0, 14);
  const sourceRankings = [
    [...numbers].sort(
      (left, right) =>
        left.currentRank - right.currentRank || left.number - right.number,
    ),
    [...numbers].sort(
      (left, right) => left.decayRank - right.decayRank || left.number - right.number,
    ),
    [...numbers].sort(
      (left, right) =>
        left.gridTransitionRank - right.gridTransitionRank ||
        left.number - right.number,
    ),
  ];
  sourceRankings.forEach((ranking) => {
    let added = 0;
    for (const { number } of ranking) {
      if (selected.includes(number)) continue;
      selected.push(number);
      added += 1;
      if (added === 2) break;
    }
  });
  [
    ...fallback,
    ...consensusRanking,
    ...Array.from({ length: 45 }, (_, index) => index + 1),
  ].forEach((number) => {
    if (!selected.includes(number)) selected.push(number);
  });
  return selected;
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

function phase4SelectorSeed(round: number, period: Phase5Period): number {
  const roundSeed = DEFAULT_SEED + round * 131 + 10_007;
  const experimentIndex = period === 'development' ? 4 : 1;
  return roundSeed + experimentIndex * 65_537;
}

function assertDevelopmentRegression(
  regression: Phase5Regression['development'],
): void {
  const expected = {
    candidate: { fourPlus: 54, fivePlus: 14, six: 1 },
    pair: { fourPlus: 13, fivePlus: 0, six: 0 },
    structured: { fourPlus: 24, fivePlus: 2, six: 0 },
  };
  if (JSON.stringify(regression) !== JSON.stringify(expected)) {
    throw new Error(
      `Phase 4 Development regression changed. expected=${JSON.stringify(expected)} actual=${JSON.stringify(regression)}`,
    );
  }
}

function assertFrozenRegression(regression: Phase5Regression): void {
  assertDevelopmentRegression(regression.development);
  const expectedHistorical = {
    candidate: { fourPlus: 29, fivePlus: 4, six: 0 },
    pair: { fourPlus: 4, fivePlus: 1, six: 0 },
    structured: { fourPlus: 12, fivePlus: 0, six: 0 },
  };
  if (JSON.stringify(regression.historical) !== JSON.stringify(expectedHistorical)) {
    throw new Error(
      `Phase 4 Historical regression changed. expected=${JSON.stringify(expectedHistorical)} actual=${JSON.stringify(regression.historical)}`,
    );
  }
}

function validateDraws(draws: readonly LottoDraw[]): void {
  const maximumRound = Math.max(...draws.map(({ round }) => round));
  if (maximumRound < DEVELOPMENT_RANGE[1]) {
    throw new Error('Phase 5 requires draws through round 1235.');
  }
}

function opportunityTableRow(
  label: string,
  development: Phase5EngineSummary,
  historical: Phase5EngineSummary | null,
): string {
  return `${label} | ${formatStage(development.candidate)} | ${historical === null ? '-' : formatStage(historical.candidate)}`;
}

function deliveryTableRow(label: string, summary: Phase5EngineSummary): string {
  return `${label} | ${formatStage(summary.candidate)} | ${formatStage(summary.transitionTop100)} | ${formatNumber(summary.preservation.fivePlus)} | ${formatStage(summary.finalTop10)}`;
}

function qualityMedian(
  quality: Phase5QualityAggregate | null,
  key: keyof Phase5QualityAggregate,
): string {
  if (quality === null) return '-';
  const value = quality[key];
  return typeof value === 'number'
    ? formatNumber(value)
    : value.count === 0
      ? '-'
      : formatNumber(value.median);
}

function answerOpportunity(
  result: CandidatePhase5Result,
  developmentFrozen: Phase5EngineSummary | null,
  historicalFrozen: Phase5EngineSummary | null,
): string {
  if (developmentFrozen === null || historicalFrozen === null) {
    const developmentCounts = result.developmentComparisons
      .map(
        ({ hypothesis, summary }) => `${hypothesis.id}=${summary.candidate.fivePlus}`,
      )
      .join(', ');
    return `Development에서는 Current 7회 대비 ${developmentCounts}로 늘었지만, quality·LOO·delivery gate를 통과한 가설이 없어 개선으로 채택하지 않았다. P5 가설의 Historical 검증은 실행하지 않았다.`;
  }
  const developmentBaseline = result.development.baselines.current.candidate.fivePlus;
  const historicalBaseline =
    result.historical?.baselines.current.candidate.fivePlus ?? 0;
  return result.gates.s1Opportunity
    ? `예. Development ${developmentBaseline}→${developmentFrozen.candidate.fivePlus}, Historical ${historicalBaseline}→${historicalFrozen.candidate.fivePlus}.`
    : `아니요. Development ${developmentBaseline}→${developmentFrozen.candidate.fivePlus}, Historical ${historicalBaseline}→${historicalFrozen.candidate.fivePlus}.`;
}

function answerExactRank(result: CandidatePhase5Result): string {
  if (result.frozenHypothesisId === null) {
    const exactRanks = result.developmentComparisons.flatMap(({ summary }) =>
      summary.opportunities.flatMap(({ exact6 }) =>
        exact6 === null ? [] : [exact6.pairRank],
      ),
    );
    return exactRanks.length === 0
      ? '판단 불가. Development P5 Recall 6 표본이 없다.'
      : `아니요. Development P5 exact Pair rank가 ${Math.min(...exactRanks).toLocaleString()}–${Math.max(...exactRanks).toLocaleString()}에 머물렀고, 통과 가설이 없어 Historical 재현도 검증하지 못했다.`;
  }
  const metric = result.crossPeriodQualityDirections.find(
    ({ metric: name }) => name === 'exact6PairRank',
  );
  if (metric?.improved === true)
    return '예. 두 기간의 비교 가능한 Recall 6에서 개선됐다.';
  return metric?.comparable === true
    ? '아니요. 비교 가능한 Recall 6에서 의미 있는 rank 이동이 없었다.'
    : '판단 불가. 두 기간에 비교 가능한 Recall 6 표본이 없다.';
}

function answerQuality(
  result: CandidatePhase5Result,
  sameDirection: readonly Phase5CoreQualityMetric[],
): string {
  if (result.frozenHypothesisId === null) {
    const improved = result.developmentComparisons
      .map(
        ({ hypothesis, improvedQualityMetrics, leaveOneOut }) =>
          `${hypothesis.id}=${improvedQualityMetrics}개(LOO ${leaveOneOut.stableRounds}/${leaveOneOut.testedRounds})`,
      )
      .join(', ');
    return `Development에서는 ${improved}였지만 안정적으로 남은 가설이 없어 개선으로 채택하지 않았다.`;
  }
  return result.gates.s2OpportunityQuality
    ? `예. ${sameDirection.join(', ')}가 두 기간에서 기준을 넘겼다.`
    : '아니요. 두 기간에서 같은 방향으로 개선된 핵심 지표가 2개 미만이다.';
}

function answerDistanceOne(
  result: CandidatePhase5Result,
  developmentFrozen: Phase5EngineSummary | null,
  historicalFrozen: Phase5EngineSummary | null,
): string {
  if (result.frozenHypothesisId === null) {
    const basins = result.developmentComparisons.flatMap(({ summary }) =>
      summary.opportunities.flatMap(({ distance1Basin }) =>
        distance1Basin === null ? [] : [distance1Basin],
      ),
    );
    return basins.length === 0
      ? '판단 불가. Development P5 Recall 6 basin 표본이 없다.'
      : `아니요. Development P5 D1 Pair median이 ${Math.min(...basins.map(({ pairRankMedian }) => pairRankMedian)).toLocaleString()}–${Math.max(...basins.map(({ pairRankMedian }) => pairRankMedian)).toLocaleString()}였고 Top500 진입은 모두 0/84였다.`;
  }
  const developmentCount = developmentFrozen?.quality.distance1PairMedian.count ?? 0;
  const historicalCount = historicalFrozen?.quality.distance1PairMedian.count ?? 0;
  return developmentCount > 0 && historicalCount > 0
    ? '두 기간 모두 측정됐으며 quality gate 결과로 판정했다.'
    : '판단 불가. 두 기간 모두에 Recall 6 distance-1 표본이 존재하지 않는다.';
}

function answerMetric(
  result: CandidatePhase5Result,
  metricName: Phase5CoreQualityMetric,
): string {
  if (result.frozenHypothesisId === null && metricName === 'ensembleWorst') {
    return '일관되게는 아니요. P5_A만 Development median이 개선됐지만 LOO 12/17로 불안정했고, P5_B는 악화됐으며 P5_C는 사전 0.02 기준에 못 미쳤다.';
  }
  const metric = result.crossPeriodQualityDirections.find(
    ({ metric }) => metric === metricName,
  );
  return metric?.improved === true
    ? '예. 두 기간에서 사전 기준 이상의 같은 방향 개선이 있었다.'
    : '아니요.';
}

function formatStage(summary: Phase5StageSummary): string {
  return `${formatNumber(summary.fourPlus)}/${formatNumber(summary.fivePlus)}/${formatNumber(summary.six)}`;
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function maximumCandidateHit(
  candidates: readonly Candidate[],
  actual: readonly number[],
): number {
  const winning = new Set(actual);
  return candidates.reduce(
    (maximum, { numbers }) =>
      Math.max(
        maximum,
        numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
      ),
    0,
  );
}

function maxHit(indices: readonly number[], hits: Uint8Array): number {
  return indices.reduce((maximum, index) => Math.max(maximum, hits[index]!), 0);
}

function indicesAtLeast(hits: Uint8Array, threshold: number): number[] {
  return Array.from(hits)
    .map((hit, index) => ({ hit, index }))
    .filter(({ hit }) => hit >= threshold)
    .map(({ index }) => index);
}

function exactHitIndices(hits: Uint8Array, target: number): number[] {
  return Array.from(hits)
    .map((hit, index) => ({ hit, index }))
    .filter(({ hit }) => hit === target)
    .map(({ index }) => index);
}

function positionsFor(order: readonly number[]): Uint32Array {
  const positions = new Uint32Array(order.length);
  order.forEach((vectorIndex, offset) => {
    positions[vectorIndex] = offset + 1;
  });
  return positions;
}

function rankPositions(ranking: readonly number[]): number[] {
  const positions = Array(46).fill(46) as number[];
  ranking.forEach((number, offset) => {
    positions[number] = offset + 1;
  });
  return positions;
}

function rankByScores(scores: readonly number[]): number[] {
  return Array.from({ length: 45 }, (_, index) => index + 1).sort(
    (left, right) => scores[right]! - scores[left]! || left - right,
  );
}

function normalizeNumberScores(values: readonly number[]): number[] {
  const relevant = values.slice(1);
  const minimum = Math.min(...relevant);
  const maximum = Math.max(...relevant);
  return values.map((value, index) =>
    index === 0 ? 0 : (value - minimum) / Math.max(maximum - minimum, 1e-9),
  );
}

function candidateRankPercentile(rank: number): number {
  return (46 - rank) / 45;
}

function combinationRankPercentile(rank: number): number {
  return (TOTAL_COMBINATIONS - rank) / (TOTAL_COMBINATIONS - 1);
}

function stageSummary(values: readonly number[]): Phase5StageSummary {
  return {
    fourPlus: values.filter((value) => value >= 4).length,
    fivePlus: values.filter((value) => value >= 5).length,
    six: values.filter((value) => value >= 6).length,
  };
}

function distribution(values: readonly number[]): Phase5Distribution {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0 };
  }
  return {
    count: values.length,
    mean: mean(values),
    median: quantile(values, 0.5),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
    min: Math.min(...values),
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

function median(values: readonly number[]): number {
  return quantile(values, 0.5);
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: readonly number[]): number {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
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

function combinations(values: readonly number[], size: number): number[][] {
  const result: number[][] = [];
  const selected: number[] = [];
  const visit = (start: number): void => {
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
