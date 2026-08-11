import type { Candidate, LottoDraw } from '../types';
import { findShapeCandidates } from './candidates';
import { resolveBacktestRoundRange } from './backtest';
import { forecastBoardShapeTransitions } from './shapeTransition';

export const PHASE2_CANDIDATE_POOL_SIZE = 20;
export const PHASE2_EXACT_RANDOM = exactRandomCandidateBaseline(
  PHASE2_CANDIDATE_POOL_SIZE,
);

export type CandidatePhase2Mode =
  'development' | 'historical-reference' | 'locked-holdout';

export type CandidateRankingId =
  | 'current'
  | 'grid-baseline'
  | 'grid-hybrid'
  | 'grid-transition'
  | 'grid'
  | 'circle-baseline'
  | 'circle-hybrid'
  | 'circle'
  | 'pair'
  | 'triple'
  | 'independent'
  | 'cumulative'
  | 'decay'
  | 'rank-normalization'
  | 'rank-fusion'
  | 'tail-rescue'
  | 'multi-view'
  | 'conditional-transition'
  | 'temporal-stability';

export type CandidateFeatureKey =
  | 'numberScore'
  | 'pairSupport'
  | 'tripleSupport'
  | 'circleShapeSupport'
  | 'gridShapeSupport'
  | 'transitionSupport'
  | 'frequency'
  | 'recency'
  | 'agreement'
  | 'disagreement'
  | 'independent'
  | 'cumulative'
  | 'decay';

export interface CandidatePhase2Options {
  mode: CandidatePhase2Mode;
  startRound: number;
  endRound: number;
  poolSize: 20;
  seed: number;
  monteCarloRuns: number;
  frozenStrategyId?: CandidateRankingId;
}

export type CandidateNumberFeatures = Record<CandidateFeatureKey, number>;

export interface CandidateNumberDiagnostic {
  number: number;
  currentRank: number;
  currentScore: number;
  currentPercentile: number;
  winning: boolean;
  inCurrentTop20: boolean;
  features: CandidateNumberFeatures;
  ranks: Partial<Record<CandidateRankingId, number>>;
}

export interface CandidateRoundRankingResult {
  rankingId: CandidateRankingId;
  top20: readonly number[];
  recall: number;
  matchedNumbers: readonly number[];
  winningRanks: readonly number[];
  r5: number;
  r6: number;
  sixthWinnerDistance: number;
}

export interface CandidateRoundDiagnostic {
  round: number;
  winningNumbers: readonly number[];
  transitionConfidence: number;
  rankings: Partial<Record<CandidateRankingId, CandidateRoundRankingResult>>;
  numbers: readonly CandidateNumberDiagnostic[];
}

export interface DistributionStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface CandidateMetricSummary {
  rankingId: CandidateRankingId;
  evaluatedRounds: number;
  recallDistribution: readonly number[];
  recallAverage: number;
  fourPlusCount: number;
  fourPlusRate: number;
  fivePlusCount: number;
  fivePlusRate: number;
  sixCount: number;
  sixRate: number;
  recallLift: number;
  fourPlusLift: number;
  fivePlusLift: number;
  sixLift: number;
  r5: DistributionStatistics;
  r6: DistributionStatistics;
  sixthWinnerDistance: DistributionStatistics;
  near6: {
    at20: number;
    at22: number;
    at25: number;
    at30: number;
    at20Rate: number;
    at22Rate: number;
    at25Rate: number;
    at30Rate: number;
  };
  blocks: readonly CandidateBlockSummary[];
}

export interface CandidateBlockSummary {
  block: 'A' | 'B' | 'C' | 'D';
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  recallAverage: number;
  fourPlusCount: number;
  fivePlusCount: number;
  sixCount: number;
  r6Median: number;
  near6At25: number;
}

export interface CandidateExperimentDefinition {
  experimentId: CandidateRankingId;
  description: string;
  changedRule: string;
}

export interface CandidateExperimentResult {
  experiment: CandidateExperimentDefinition;
  summary: CandidateMetricSummary;
  gate: {
    recallOrTail: boolean;
    fivePlus: boolean;
    r6OrNear6: boolean;
    randomLift: boolean;
    temporalStability: boolean;
    passedBlocks: number;
  };
  result: 'KEEP' | 'REJECT';
  reason: string;
}

export interface ExactRandomCandidateBaseline {
  poolSize: number;
  expectedRecall: number;
  hitProbabilities: readonly number[];
  fourPlusRate: number;
  fivePlusRate: number;
  sixRate: number;
}

export interface MonteCarloInterval {
  mean: number;
  p5: number;
  p50: number;
  p95: number;
}

export interface CandidateRandomMonteCarlo {
  runs: number;
  seed: number;
  recallAverage: MonteCarloInterval;
  fourPlusCount: MonteCarloInterval;
  fivePlusCount: MonteCarloInterval;
  sixCount: MonteCarloInterval;
  r6Median: MonteCarloInterval;
  near6At22: MonteCarloInterval;
  near6At25: MonteCarloInterval;
  percentileAgainstRandom: {
    recallAverage: number;
    fourPlusCount: number;
    fivePlusCount: number;
    sixCount: number;
    r6Median: number;
    near6At22: number;
    near6At25: number;
  };
}

export interface FeatureGroupStatistics {
  group:
    | 'winning-top20'
    | 'winning-outside-top20'
    | 'non-winning-top20'
    | 'non-winning-outside-top20';
  count: number;
  features: Record<CandidateFeatureKey, DistributionStatistics>;
}

export interface MissingWinnerDiagnostic {
  round: number;
  number: number;
  candidateRank: number;
  candidateScore: number;
  candidatePercentile: number;
  features: CandidateNumberFeatures;
}

export interface CandidateFeatureCorrelation {
  left: CandidateFeatureKey;
  right: CandidateFeatureKey;
  correlation: number;
}

export interface CandidatePhase2Result {
  metricSchemaVersion: 1;
  generatedAt: string;
  mode: CandidatePhase2Mode;
  tuningAllowed: boolean;
  candidateGateWinnerId: CandidateRankingId;
  frozenStrategyId: CandidateRankingId;
  options: CandidatePhase2Options;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  exactRandom: ExactRandomCandidateBaseline & {
    expectedCounts: {
      fourPlus: number;
      fivePlus: number;
      six: number;
    };
  };
  randomMonteCarlo: CandidateRandomMonteCarlo;
  summaries: Partial<Record<CandidateRankingId, CandidateMetricSummary>>;
  experiments: readonly CandidateExperimentResult[];
  cutoffLoss: {
    allMissingWinnerRanks: Record<'21-25' | '26-30' | '31-35' | '36-45', number>;
    fiveHitMissingWinnerRanks: Record<'21-25' | '26-30' | '31-35' | '36-45', number>;
  };
  fiveHitMissingWinners: readonly MissingWinnerDiagnostic[];
  featureGroups: readonly FeatureGroupStatistics[];
  highFeatureCorrelations: readonly CandidateFeatureCorrelation[];
  rounds: readonly CandidateRoundDiagnostic[];
}

const FEATURE_KEYS: readonly CandidateFeatureKey[] = [
  'numberScore',
  'pairSupport',
  'tripleSupport',
  'circleShapeSupport',
  'gridShapeSupport',
  'transitionSupport',
  'frequency',
  'recency',
  'agreement',
  'disagreement',
  'independent',
  'cumulative',
  'decay',
];

const DIAGNOSTIC_RANKINGS: readonly CandidateRankingId[] = [
  'current',
  'grid-baseline',
  'grid-hybrid',
  'grid-transition',
  'grid',
  'circle-baseline',
  'circle-hybrid',
  'circle',
  'pair',
  'triple',
  'independent',
  'cumulative',
  'decay',
];

export const candidateExperimentDefinitions: readonly CandidateExperimentDefinition[] =
  [
    {
      experimentId: 'rank-normalization',
      description: '번호 단위 신호를 0–1 범위에서 동일 비중으로 결합',
      changedRule: 'Current 점수 대신 Grid/Circle/Transition/Pair 정규화 평균',
    },
    {
      experimentId: 'rank-fusion',
      description: '서로 다른 번호 신호의 순위를 Reciprocal Rank Fusion으로 결합',
      changedRule: 'Current 단일 순위 대신 사전 정의된 5-view RRF(k=60)',
    },
    {
      experimentId: 'tail-rescue',
      description: 'Current Top16을 유지하고 대체 신호로 4개 Tail 슬롯을 구성',
      changedRule: 'Top20 전체 Current 대신 Current 16 + Alternative RRF 4',
    },
    {
      experimentId: 'multi-view',
      description: 'Current/Grid/Circle/Transition/Pair의 고정 슬롯 포트폴리오',
      changedRule: '고정 슬롯 8/4/4/2/2를 중복 제거 후 Current로 보충',
    },
    {
      experimentId: 'conditional-transition',
      description: '예측 시점 Transition confidence가 높을 때만 Transition 순위 반영',
      changedRule: 'confidence >= 0.55인 회차에서 Current 2 : Transition 1 RRF',
    },
    {
      experimentId: 'decay',
      description: '최근 회차일수록 큰 지수 감쇠 가중치를 적용한 번호 순위',
      changedRule: 'Current Grid consensus 대신 고정 half-life 36회의 Decay 순위',
    },
    {
      experimentId: 'temporal-stability',
      description: 'Current·Cumulative·Decay 관점에서 안정적인 번호를 우선',
      changedRule: '세 순위 평균과 순위 분산 페널티로 Top20 결정',
    },
  ];

export function runCandidatePhase2Evaluation(
  draws: readonly LottoDraw[],
  requested: Partial<CandidatePhase2Options>,
  onProgress?: (completed: number, total: number, round: number) => void,
): CandidatePhase2Result {
  const options = sanitizeOptions(requested);
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: options.startRound,
    endRound: options.endRound,
    poolSize: PHASE2_CANDIDATE_POOL_SIZE,
  });
  const tuningAllowed =
    options.mode === 'development' &&
    range.startRound === 1044 &&
    range.endRound === 1235;
  const rankingIds = tuningAllowed
    ? Array.from(
        new Set<CandidateRankingId>([
          ...DIAGNOSTIC_RANKINGS,
          ...candidateExperimentDefinitions.map(({ experimentId }) => experimentId),
        ]),
      )
    : Array.from(
        new Set<CandidateRankingId>(['current', options.frozenStrategyId ?? 'current']),
      );
  const rounds: CandidateRoundDiagnostic[] = [];
  const currentOnly =
    !tuningAllowed && rankingIds.length === 1 && rankingIds[0] === 'current';

  for (
    let index = range.startHistoryIndex;
    index <= range.endHistoryIndex;
    index += 1
  ) {
    const actual = draws[index + 1]!;
    const built = currentOnly
      ? buildCurrentOnlyRoundDiagnostic(draws, index, actual)
      : buildCandidateRoundDiagnostic(draws, index, actual, rankingIds);
    rounds.push(built);
    onProgress?.(rounds.length, range.evaluatedRounds, actual.round);
  }

  const summaries = Object.fromEntries(
    rankingIds.map((rankingId) => [
      rankingId,
      summarizeCandidateRanking(rounds, rankingId),
    ]),
  ) as Partial<Record<CandidateRankingId, CandidateMetricSummary>>;
  const baseline = summaries.current!;
  const experiments = tuningAllowed
    ? candidateExperimentDefinitions.map((experiment) =>
        evaluateExperiment(experiment, summaries[experiment.experimentId]!, baseline),
      )
    : [];
  const candidateGateWinnerId = tuningAllowed
    ? selectFrozenStrategy(experiments)
    : (options.frozenStrategyId ?? 'current');
  const frozenStrategyId = options.frozenStrategyId ?? 'current';
  const exactRandom = {
    ...PHASE2_EXACT_RANDOM,
    expectedCounts: {
      fourPlus: PHASE2_EXACT_RANDOM.fourPlusRate * rounds.length,
      fivePlus: PHASE2_EXACT_RANDOM.fivePlusRate * rounds.length,
      six: PHASE2_EXACT_RANDOM.sixRate * rounds.length,
    },
  };
  const cutoffLoss = buildCutoffLoss(rounds);
  const featureGroups = tuningAllowed ? buildFeatureGroupStatistics(rounds) : [];
  const highFeatureCorrelations = tuningAllowed
    ? buildFeatureCorrelations(rounds).filter(
        ({ correlation }) => Math.abs(correlation) >= 0.75,
      )
    : [];
  const fiveHitMissingWinners = buildFiveHitMissingWinners(rounds);
  const randomMonteCarlo = runRandomCandidateMonteCarlo(
    rounds,
    baseline,
    options.monteCarloRuns,
    options.seed,
  );

  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    tuningAllowed,
    candidateGateWinnerId,
    frozenStrategyId,
    options,
    startRound: range.startRound,
    endRound: range.endRound,
    evaluatedRounds: rounds.length,
    exactRandom,
    randomMonteCarlo,
    summaries,
    experiments,
    cutoffLoss,
    fiveHitMissingWinners,
    featureGroups,
    highFeatureCorrelations,
    rounds,
  };
}

function buildCurrentOnlyRoundDiagnostic(
  draws: readonly LottoDraw[],
  index: number,
  actual: LottoDraw,
): CandidateRoundDiagnostic {
  const baseline = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'baseline').candidates,
  );
  const hybrid = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'hybrid').candidates,
  );
  const transition = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'shape-transition').candidates,
  );
  const current = averageSignals([baseline, hybrid, transition]);
  const ranking = rankByScore(current);
  const positions = rankPositions(ranking);
  const rankingResult = evaluateRoundRanking('current', ranking, actual.numbers);
  const emptyFeatures = (number: number): CandidateNumberFeatures => ({
    numberScore: current[number]!,
    pairSupport: 0,
    tripleSupport: 0,
    circleShapeSupport: 0,
    gridShapeSupport: current[number]!,
    transitionSupport: transition[number]!,
    frequency: 0,
    recency: 0,
    agreement: 0,
    disagreement: 0,
    independent: 0,
    cumulative: 0,
    decay: 0,
  });
  return {
    round: actual.round,
    winningNumbers: actual.numbers,
    transitionConfidence: forecastBoardShapeTransitions(draws, index).confidence,
    rankings: { current: rankingResult },
    numbers: Array.from({ length: 45 }, (_, offset) => {
      const number = offset + 1;
      return {
        number,
        currentRank: positions[number]!,
        currentScore: current[number]!,
        currentPercentile: rankPercentile(positions[number]!),
        winning: actual.numbers.includes(number),
        inCurrentTop20: positions[number]! <= PHASE2_CANDIDATE_POOL_SIZE,
        features: emptyFeatures(number),
        ranks: { current: positions[number]! },
      };
    }),
  };
}

/**
 * Builds only the three frozen Candidate sources required by Phase 3. It is
 * intentionally equivalent to the corresponding rankings in the full Phase 2
 * diagnostic, while avoiding unrelated Circle/Pair/experiment calculations.
 */
export function buildFrozenPhase3CandidateRoundDiagnostic(
  draws: readonly LottoDraw[],
  index: number,
  actual: LottoDraw,
): CandidateRoundDiagnostic {
  const gridBaseline = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'baseline').candidates,
  );
  const gridHybrid = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'hybrid').candidates,
  );
  const gridTransition = supportFromCandidates(
    findShapeCandidates(draws, index, 'board', 100, 'shape-transition').candidates,
  );
  const current = averageSignals([gridBaseline, gridHybrid, gridTransition]);
  const decay = frequencySignal(draws.slice(0, index + 1), true);
  const rankings = {
    current: rankByScore(current),
    decay: rankByScore(decay),
    'grid-transition': rankByScore(gridTransition),
  } satisfies Record<'current' | 'decay' | 'grid-transition', number[]>;
  const positions = {
    current: rankPositions(rankings.current),
    decay: rankPositions(rankings.decay),
    'grid-transition': rankPositions(rankings['grid-transition']),
  };
  const rankingResults = {
    current: evaluateRoundRanking('current', rankings.current, actual.numbers),
    decay: evaluateRoundRanking('decay', rankings.decay, actual.numbers),
    'grid-transition': evaluateRoundRanking(
      'grid-transition',
      rankings['grid-transition'],
      actual.numbers,
    ),
  };
  return {
    round: actual.round,
    winningNumbers: actual.numbers,
    transitionConfidence: forecastBoardShapeTransitions(draws, index).confidence,
    rankings: rankingResults,
    numbers: Array.from({ length: 45 }, (_, offset) => {
      const number = offset + 1;
      const currentRank = positions.current[number]!;
      return {
        number,
        currentRank,
        currentScore: current[number]!,
        currentPercentile: rankPercentile(currentRank),
        winning: actual.numbers.includes(number),
        inCurrentTop20: currentRank <= PHASE2_CANDIDATE_POOL_SIZE,
        features: {
          numberScore: current[number]!,
          pairSupport: 0,
          tripleSupport: 0,
          circleShapeSupport: 0,
          gridShapeSupport: current[number]!,
          transitionSupport: gridTransition[number]!,
          frequency: 0,
          recency: decay[number]!,
          agreement: 0,
          disagreement: 0,
          independent: 0,
          cumulative: 0,
          decay: decay[number]!,
        },
        ranks: {
          current: positions.current[number]!,
          decay: positions.decay[number]!,
          'grid-transition': positions['grid-transition'][number]!,
        },
      };
    }),
  };
}

function selectFrozenStrategy(
  experiments: readonly CandidateExperimentResult[],
): CandidateRankingId {
  return (
    [...experiments]
      .filter(({ result }) => result === 'KEEP')
      .sort(
        (left, right) =>
          right.summary.fivePlusCount - left.summary.fivePlusCount ||
          right.summary.sixCount - left.summary.sixCount ||
          right.summary.near6.at25 - left.summary.near6.at25 ||
          right.summary.near6.at22 - left.summary.near6.at22 ||
          right.summary.fourPlusCount - left.summary.fourPlusCount ||
          right.summary.recallAverage - left.summary.recallAverage,
      )[0]?.experiment.experimentId ?? 'current'
  );
}

export function buildCandidateRoundDiagnostic(
  draws: readonly LottoDraw[],
  index: number,
  actual: LottoDraw,
  requestedRankings: readonly CandidateRankingId[],
): CandidateRoundDiagnostic {
  const gridBaselineCandidates = findShapeCandidates(
    draws,
    index,
    'board',
    100,
    'baseline',
  ).candidates;
  const gridHybridCandidates = findShapeCandidates(
    draws,
    index,
    'board',
    100,
    'hybrid',
  ).candidates;
  const gridTransitionCandidates = findShapeCandidates(
    draws,
    index,
    'board',
    100,
    'shape-transition',
  ).candidates;
  const circleBaselineCandidates = findShapeCandidates(
    draws,
    index,
    'circle',
    100,
    'baseline',
  ).candidates;
  const circleHybridCandidates = findShapeCandidates(
    draws,
    index,
    'circle',
    100,
    'hybrid',
  ).candidates;
  const gridBaseline = supportFromCandidates(gridBaselineCandidates);
  const gridHybrid = supportFromCandidates(gridHybridCandidates);
  const gridTransition = supportFromCandidates(gridTransitionCandidates);
  const circleBaseline = supportFromCandidates(circleBaselineCandidates);
  const circleHybrid = supportFromCandidates(circleHybridCandidates);
  const grid = averageSignals([gridBaseline, gridHybrid, gridTransition]);
  const circle = averageSignals([circleBaseline, circleHybrid]);
  const current = grid;
  const known = draws.slice(0, index + 1);
  const frequency = frequencySignal(known, false);
  const recency = frequencySignal(known, true);
  const currentRanking = rankByScore(current);
  const relationships = relationshipSignals(known, currentRanking.slice(0, 20));
  const independent = independentSignal(
    known.at(-1)?.numbers ?? [],
    relationships.pairMap,
  );
  const rawSignals: Record<
    | 'current'
    | 'grid-baseline'
    | 'grid-hybrid'
    | 'grid-transition'
    | 'grid'
    | 'circle-baseline'
    | 'circle-hybrid'
    | 'circle'
    | 'pair'
    | 'triple'
    | 'independent'
    | 'cumulative'
    | 'decay',
    number[]
  > = {
    current,
    'grid-baseline': gridBaseline,
    'grid-hybrid': gridHybrid,
    'grid-transition': gridTransition,
    grid,
    'circle-baseline': circleBaseline,
    'circle-hybrid': circleHybrid,
    circle,
    pair: relationships.pairSupport,
    triple: relationships.tripleSupport,
    independent,
    cumulative: frequency,
    decay: recency,
  };
  const baseRankings = Object.fromEntries(
    Object.entries(rawSignals).map(([id, signal]) => [id, rankByScore(signal)]),
  ) as Record<keyof typeof rawSignals, number[]>;
  const agreementMembers: readonly (keyof typeof rawSignals)[] = [
    'grid-baseline',
    'grid-hybrid',
    'grid-transition',
    'circle-baseline',
    'circle-hybrid',
    'pair',
  ];
  const agreement = Array(46).fill(0) as number[];
  const disagreement = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    const values = agreementMembers.map((id) => rawSignals[id][number]!);
    agreement[number] =
      agreementMembers.filter((id) => baseRankings[id].slice(0, 20).includes(number))
        .length / agreementMembers.length;
    disagreement[number] = standardDeviation(values);
  }
  const transitionConfidence = forecastBoardShapeTransitions(draws, index).confidence;
  const experimentRankings = buildExperimentRankings(
    baseRankings,
    rawSignals,
    agreement,
    disagreement,
    transitionConfidence,
  );
  const allRankings: Partial<Record<CandidateRankingId, readonly number[]>> = {
    ...baseRankings,
    ...experimentRankings,
  };
  const rankingResults = Object.fromEntries(
    requestedRankings.map((rankingId) => {
      const ranking = allRankings[rankingId];
      if (ranking === undefined) {
        throw new Error(`Candidate ranking ${rankingId} was not built.`);
      }
      return [rankingId, evaluateRoundRanking(rankingId, ranking, actual.numbers)];
    }),
  ) as Partial<Record<CandidateRankingId, CandidateRoundRankingResult>>;
  const currentRanks = rankPositions(currentRanking);
  const signalRankPositions = Object.fromEntries(
    Object.entries(baseRankings).map(([id, ranking]) => [id, rankPositions(ranking)]),
  ) as Record<keyof typeof baseRankings, number[]>;

  const numbers = Array.from({ length: 45 }, (_, offset): CandidateNumberDiagnostic => {
    const number = offset + 1;
    const modelValues = agreementMembers.map((id) => rawSignals[id][number]!);
    const features: CandidateNumberFeatures = {
      numberScore: current[number]!,
      pairSupport: relationships.pairSupport[number]!,
      tripleSupport: relationships.tripleSupport[number]!,
      circleShapeSupport: circle[number]!,
      gridShapeSupport: grid[number]!,
      transitionSupport: gridTransition[number]!,
      frequency: frequency[number]!,
      recency: recency[number]!,
      agreement: agreement[number]!,
      disagreement: standardDeviation(modelValues),
      independent: independent[number]!,
      cumulative: frequency[number]!,
      decay: recency[number]!,
    };
    return {
      number,
      currentRank: currentRanks[number]!,
      currentScore: current[number]!,
      currentPercentile: rankPercentile(currentRanks[number]!),
      winning: actual.numbers.includes(number),
      inCurrentTop20: currentRanks[number]! <= PHASE2_CANDIDATE_POOL_SIZE,
      features,
      ranks: Object.fromEntries(
        Object.entries(signalRankPositions).map(([id, positions]) => [
          id,
          positions[number],
        ]),
      ),
    };
  });

  return {
    round: actual.round,
    winningNumbers: actual.numbers,
    transitionConfidence,
    rankings: rankingResults,
    numbers,
  };
}

function buildExperimentRankings(
  rankings: Record<
    | 'current'
    | 'grid-baseline'
    | 'grid-hybrid'
    | 'grid-transition'
    | 'grid'
    | 'circle-baseline'
    | 'circle-hybrid'
    | 'circle'
    | 'pair'
    | 'triple'
    | 'independent'
    | 'cumulative'
    | 'decay',
    number[]
  >,
  signals: Record<string, number[]>,
  agreement: readonly number[],
  disagreement: readonly number[],
  transitionConfidence: number,
): Partial<Record<CandidateRankingId, readonly number[]>> {
  const rankNormalizationSignal = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    rankNormalizationSignal[number] = mean([
      signals.current![number]!,
      signals.circle![number]!,
      signals['grid-transition']![number]!,
      signals.pair![number]!,
    ]);
  }
  const rankNormalization = rankByScore(rankNormalizationSignal);
  const rankFusion = reciprocalRankFusion(
    [
      rankings.current,
      rankings['grid-baseline'],
      rankings['grid-hybrid'],
      rankings.circle,
      rankings['grid-transition'],
      rankings.pair,
    ],
    [2, 1, 1, 1, 1, 1],
  );
  const tailAlternatives = reciprocalRankFusion(
    [rankings.circle, rankings['grid-transition'], rankings.pair],
    [1, 1, 1],
    disagreement,
  );
  const tailRescue = composeFixedSlots(
    [
      { ranking: rankings.current, slots: 16 },
      { ranking: tailAlternatives, slots: 4 },
    ],
    rankings.current,
  );
  const multiView = composeFixedSlots(
    [
      { ranking: rankings.current, slots: 8 },
      { ranking: rankings.grid, slots: 4 },
      { ranking: rankings.circle, slots: 4 },
      { ranking: rankings['grid-transition'], slots: 2 },
      { ranking: rankings.pair, slots: 2 },
    ],
    rankings.current,
  );
  const conditionalTransition =
    transitionConfidence >= 0.55
      ? reciprocalRankFusion([rankings.current, rankings['grid-transition']], [2, 1])
      : rankings.current;
  const positions = [
    rankPositions(rankings.current),
    rankPositions(rankings.cumulative),
    rankPositions(rankings.decay),
  ];
  const temporalSignal = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    const numberRanks = positions.map((values) => values[number]!);
    temporalSignal[number] = -mean(numberRanks) - standardDeviation(numberRanks) * 0.2;
  }
  const temporalStability = rankByScore(temporalSignal);
  void agreement;
  return {
    'rank-normalization': rankNormalization,
    'rank-fusion': rankFusion,
    'tail-rescue': tailRescue,
    'multi-view': multiView,
    'conditional-transition': conditionalTransition,
    'temporal-stability': temporalStability,
  };
}

function evaluateRoundRanking(
  rankingId: CandidateRankingId,
  ranking: readonly number[],
  winningNumbers: readonly number[],
): CandidateRoundRankingResult {
  const positions = rankPositions(ranking);
  const winningRanks = winningNumbers
    .map((number) => positions[number]!)
    .sort((left, right) => left - right);
  const top20 = ranking.slice(0, PHASE2_CANDIDATE_POOL_SIZE);
  const matchedNumbers = winningNumbers.filter((number) => top20.includes(number));
  const r5 = winningRanks[4] ?? 45;
  const r6 = winningRanks[5] ?? 45;
  return {
    rankingId,
    top20,
    recall: matchedNumbers.length,
    matchedNumbers,
    winningRanks,
    r5,
    r6,
    sixthWinnerDistance: Math.max(0, r6 - PHASE2_CANDIDATE_POOL_SIZE),
  };
}

function summarizeCandidateRanking(
  rounds: readonly CandidateRoundDiagnostic[],
  rankingId: CandidateRankingId,
): CandidateMetricSummary {
  const results = rounds
    .map(({ rankings }) => rankings[rankingId])
    .filter((result): result is CandidateRoundRankingResult => result !== undefined);
  const recalls = results.map(({ recall }) => recall);
  const r5Values = results.map(({ r5 }) => r5);
  const r6Values = results.map(({ r6 }) => r6);
  const distances = results.map(({ sixthWinnerDistance }) => sixthWinnerDistance);
  const fourPlusCount = recalls.filter((value) => value >= 4).length;
  const fivePlusCount = recalls.filter((value) => value >= 5).length;
  const sixCount = recalls.filter((value) => value >= 6).length;
  const evaluatedRounds = results.length;
  const near6 = {
    at20: r6Values.filter((value) => value <= 20).length,
    at22: r6Values.filter((value) => value <= 22).length,
    at25: r6Values.filter((value) => value <= 25).length,
    at30: r6Values.filter((value) => value <= 30).length,
  };
  return {
    rankingId,
    evaluatedRounds,
    recallDistribution: hitDistribution(recalls, evaluatedRounds),
    recallAverage: mean(recalls),
    fourPlusCount,
    fourPlusRate: ratio(fourPlusCount, evaluatedRounds),
    fivePlusCount,
    fivePlusRate: ratio(fivePlusCount, evaluatedRounds),
    sixCount,
    sixRate: ratio(sixCount, evaluatedRounds),
    recallLift: ratio(mean(recalls), PHASE2_EXACT_RANDOM.expectedRecall),
    fourPlusLift: ratio(
      ratio(fourPlusCount, evaluatedRounds),
      PHASE2_EXACT_RANDOM.fourPlusRate,
    ),
    fivePlusLift: ratio(
      ratio(fivePlusCount, evaluatedRounds),
      PHASE2_EXACT_RANDOM.fivePlusRate,
    ),
    sixLift: ratio(ratio(sixCount, evaluatedRounds), PHASE2_EXACT_RANDOM.sixRate),
    r5: distributionStatistics(r5Values),
    r6: distributionStatistics(r6Values),
    sixthWinnerDistance: distributionStatistics(distances),
    near6: {
      ...near6,
      at20Rate: ratio(near6.at20, evaluatedRounds),
      at22Rate: ratio(near6.at22, evaluatedRounds),
      at25Rate: ratio(near6.at25, evaluatedRounds),
      at30Rate: ratio(near6.at30, evaluatedRounds),
    },
    blocks: summarizeBlocks(rounds, rankingId),
  };
}

function summarizeBlocks(
  rounds: readonly CandidateRoundDiagnostic[],
  rankingId: CandidateRankingId,
): CandidateBlockSummary[] {
  const labels = ['A', 'B', 'C', 'D'] as const;
  const blockSize = Math.ceil(rounds.length / 4);
  return labels.map((block, blockIndex) => {
    const blockRounds = rounds.slice(
      blockIndex * blockSize,
      Math.min((blockIndex + 1) * blockSize, rounds.length),
    );
    const results = blockRounds
      .map(({ rankings }) => rankings[rankingId])
      .filter((result): result is CandidateRoundRankingResult => result !== undefined);
    const recalls = results.map(({ recall }) => recall);
    const r6 = results.map((result) => result.r6);
    return {
      block,
      startRound: blockRounds[0]?.round ?? 0,
      endRound: blockRounds.at(-1)?.round ?? 0,
      evaluatedRounds: results.length,
      recallAverage: mean(recalls),
      fourPlusCount: recalls.filter((value) => value >= 4).length,
      fivePlusCount: recalls.filter((value) => value >= 5).length,
      sixCount: recalls.filter((value) => value >= 6).length,
      r6Median: quantile(r6, 0.5),
      near6At25: r6.filter((value) => value <= 25).length,
    };
  });
}

function evaluateExperiment(
  experiment: CandidateExperimentDefinition,
  summary: CandidateMetricSummary,
  baseline: CandidateMetricSummary,
): CandidateExperimentResult {
  const recallOrTail =
    summary.recallAverage > baseline.recallAverage ||
    (summary.recallAverage >= baseline.recallAverage - 0.01 &&
      (summary.fivePlusCount > baseline.fivePlusCount ||
        summary.near6.at25 > baseline.near6.at25));
  const fivePlus =
    summary.fivePlusCount > baseline.fivePlusCount &&
    summary.fivePlusRate > PHASE2_EXACT_RANDOM.fivePlusRate;
  const r6OrNear6 =
    summary.r6.median < baseline.r6.median ||
    summary.r6.p75 < baseline.r6.p75 ||
    summary.near6.at22 > baseline.near6.at22 ||
    summary.near6.at25 > baseline.near6.at25;
  const randomLift =
    summary.fivePlusLift > 1 &&
    summary.fivePlusLift > baseline.fivePlusLift &&
    (summary.recallLift >= baseline.recallLift ||
      summary.near6.at25 > baseline.near6.at25);
  const passedBlocks = summary.blocks.filter((block, index) => {
    const current = baseline.blocks[index];
    if (current === undefined) return false;
    return (
      block.fivePlusCount > current.fivePlusCount ||
      (block.fivePlusCount === current.fivePlusCount &&
        (block.r6Median < current.r6Median || block.near6At25 > current.near6At25))
    );
  }).length;
  const temporalStability = passedBlocks >= 3;
  const passed =
    recallOrTail && fivePlus && r6OrNear6 && randomLift && temporalStability;
  const failed = [
    !recallOrTail ? 'Gate A Recall/Tail' : '',
    !fivePlus ? 'Gate B 5+' : '',
    !r6OrNear6 ? 'Gate C r6/Near6' : '',
    !randomLift ? 'Gate D Random Lift' : '',
    !temporalStability ? `Gate E Blocks(${passedBlocks}/4)` : '',
  ].filter(Boolean);
  return {
    experiment,
    summary,
    gate: {
      recallOrTail,
      fivePlus,
      r6OrNear6,
      randomLift,
      temporalStability,
      passedBlocks,
    },
    result: passed ? 'KEEP' : 'REJECT',
    reason: passed ? '모든 사전 채택 Gate를 통과했어요.' : `${failed.join(', ')} 실패`,
  };
}

export function exactRandomCandidateBaseline(
  poolSize: number,
): ExactRandomCandidateBaseline {
  const total = choose(45, poolSize);
  const hitProbabilities = Array.from({ length: 7 }, (_, hits) => {
    const misses = poolSize - hits;
    if (misses < 0 || misses > 39) return 0;
    return (choose(6, hits) * choose(39, misses)) / total;
  });
  return {
    poolSize,
    expectedRecall: (poolSize * 6) / 45,
    hitProbabilities,
    fourPlusRate: hitProbabilities.slice(4).reduce((sum, value) => sum + value, 0),
    fivePlusRate: hitProbabilities.slice(5).reduce((sum, value) => sum + value, 0),
    sixRate: hitProbabilities[6] ?? 0,
  };
}

function runRandomCandidateMonteCarlo(
  rounds: readonly CandidateRoundDiagnostic[],
  baseline: CandidateMetricSummary,
  runs: number,
  seed: number,
): CandidateRandomMonteCarlo {
  const random = createRandom(seed);
  const recallAverage: number[] = [];
  const fourPlusCount: number[] = [];
  const fivePlusCount: number[] = [];
  const sixCount: number[] = [];
  const r6Median: number[] = [];
  const near6At22: number[] = [];
  const near6At25: number[] = [];
  for (let run = 0; run < runs; run += 1) {
    const recalls: number[] = [];
    const r6: number[] = [];
    rounds.forEach(({ winningNumbers }) => {
      const ranking = randomPermutation45(random);
      const evaluated = evaluateRoundRanking('current', ranking, winningNumbers);
      recalls.push(evaluated.recall);
      r6.push(evaluated.r6);
    });
    recallAverage.push(mean(recalls));
    fourPlusCount.push(recalls.filter((value) => value >= 4).length);
    fivePlusCount.push(recalls.filter((value) => value >= 5).length);
    sixCount.push(recalls.filter((value) => value >= 6).length);
    r6Median.push(quantile(r6, 0.5));
    near6At22.push(r6.filter((value) => value <= 22).length);
    near6At25.push(r6.filter((value) => value <= 25).length);
  }
  return {
    runs,
    seed,
    recallAverage: monteCarloInterval(recallAverage),
    fourPlusCount: monteCarloInterval(fourPlusCount),
    fivePlusCount: monteCarloInterval(fivePlusCount),
    sixCount: monteCarloInterval(sixCount),
    r6Median: monteCarloInterval(r6Median),
    near6At22: monteCarloInterval(near6At22),
    near6At25: monteCarloInterval(near6At25),
    percentileAgainstRandom: {
      recallAverage: percentileAtOrBelow(recallAverage, baseline.recallAverage),
      fourPlusCount: percentileAtOrBelow(fourPlusCount, baseline.fourPlusCount),
      fivePlusCount: percentileAtOrBelow(fivePlusCount, baseline.fivePlusCount),
      sixCount: percentileAtOrBelow(sixCount, baseline.sixCount),
      r6Median: percentileAtOrAbove(r6Median, baseline.r6.median),
      near6At22: percentileAtOrBelow(near6At22, baseline.near6.at22),
      near6At25: percentileAtOrBelow(near6At25, baseline.near6.at25),
    },
  };
}

function buildCutoffLoss(rounds: readonly CandidateRoundDiagnostic[]): {
  allMissingWinnerRanks: Record<'21-25' | '26-30' | '31-35' | '36-45', number>;
  fiveHitMissingWinnerRanks: Record<'21-25' | '26-30' | '31-35' | '36-45', number>;
} {
  const blank = () => ({ '21-25': 0, '26-30': 0, '31-35': 0, '36-45': 0 });
  const allMissingWinnerRanks = blank();
  const fiveHitMissingWinnerRanks = blank();
  rounds.forEach((round) => {
    const current = round.rankings.current!;
    current.winningRanks
      .filter((rank) => rank > PHASE2_CANDIDATE_POOL_SIZE)
      .forEach((rank) => {
        allMissingWinnerRanks[rankBucket(rank)] += 1;
        if (current.recall === 5) fiveHitMissingWinnerRanks[rankBucket(rank)] += 1;
      });
  });
  return { allMissingWinnerRanks, fiveHitMissingWinnerRanks };
}

function buildFiveHitMissingWinners(
  rounds: readonly CandidateRoundDiagnostic[],
): MissingWinnerDiagnostic[] {
  return rounds.flatMap((round) => {
    if (round.rankings.current?.recall !== 5) return [];
    return round.numbers
      .filter(({ winning, inCurrentTop20 }) => winning && !inCurrentTop20)
      .map((number) => ({
        round: round.round,
        number: number.number,
        candidateRank: number.currentRank,
        candidateScore: number.currentScore,
        candidatePercentile: number.currentPercentile,
        features: number.features,
      }));
  });
}

function buildFeatureGroupStatistics(
  rounds: readonly CandidateRoundDiagnostic[],
): FeatureGroupStatistics[] {
  const groups: FeatureGroupStatistics['group'][] = [
    'winning-top20',
    'winning-outside-top20',
    'non-winning-top20',
    'non-winning-outside-top20',
  ];
  const records = rounds.flatMap(({ numbers }) => numbers);
  return groups.map((group) => {
    const selected = records.filter((record) => featureGroupFor(record) === group);
    return {
      group,
      count: selected.length,
      features: Object.fromEntries(
        FEATURE_KEYS.map((feature) => [
          feature,
          distributionStatistics(selected.map(({ features }) => features[feature])),
        ]),
      ) as Record<CandidateFeatureKey, DistributionStatistics>,
    };
  });
}

function buildFeatureCorrelations(
  rounds: readonly CandidateRoundDiagnostic[],
): CandidateFeatureCorrelation[] {
  const records = rounds.flatMap(({ numbers }) => numbers);
  const correlations: CandidateFeatureCorrelation[] = [];
  FEATURE_KEYS.forEach((left, leftIndex) => {
    FEATURE_KEYS.slice(leftIndex + 1).forEach((right) => {
      correlations.push({
        left,
        right,
        correlation: pearson(
          records.map(({ features }) => features[left]),
          records.map(({ features }) => features[right]),
        ),
      });
    });
  });
  return correlations.sort(
    (left, right) => Math.abs(right.correlation) - Math.abs(left.correlation),
  );
}

function supportFromCandidates(candidates: readonly Candidate[]): number[] {
  const values = Array(46).fill(0) as number[];
  candidates.forEach((candidate, rank) => {
    const rankWeight = 1 / (1 + rank / 16);
    const tierWeight =
      candidate.tier === 'confidence' ? 1.18 : candidate.tier === 'focus' ? 1.08 : 1;
    candidate.numbers.forEach((number) => {
      values[number] = values[number]! + rankWeight * tierWeight;
    });
  });
  return normalizeNumberSignal(values);
}

function averageSignals(signals: readonly (readonly number[])[]): number[] {
  return Array.from({ length: 46 }, (_, number) =>
    number === 0 ? 0 : mean(signals.map((signal) => signal[number]!)),
  );
}

function frequencySignal(draws: readonly LottoDraw[], decay: boolean): number[] {
  const signal = Array(46).fill(0) as number[];
  draws.forEach((draw, drawIndex) => {
    const age = draws.length - 1 - drawIndex;
    const weight = decay ? 0.5 ** (age / 36) : 1;
    draw.numbers.forEach((number) => {
      signal[number] = signal[number]! + weight;
    });
  });
  return normalizeNumberSignal(signal);
}

function relationshipSignals(
  draws: readonly LottoDraw[],
  anchors: readonly number[],
): {
  pairSupport: number[];
  tripleSupport: number[];
  pairMap: Map<string, number>;
} {
  const pairRaw = new Map<string, number>();
  const tripleRaw = new Map<string, number>();
  draws.forEach((draw, drawIndex) => {
    const age = draws.length - 1 - drawIndex;
    const weight = 0.65 * 0.5 ** (age / 36) + (age < 48 ? 0.35 : 0);
    combinations(draw.numbers, 2).forEach((values) =>
      addMap(pairRaw, values.join('-'), weight),
    );
    combinations(draw.numbers, 3).forEach((values) =>
      addMap(tripleRaw, values.join('-'), weight),
    );
  });
  const pairMap = normalizeMap(pairRaw);
  const tripleMap = normalizeMap(tripleRaw);
  const pairSupport = Array(46).fill(0) as number[];
  const tripleSupport = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    pairSupport[number] = mean(
      anchors
        .filter((anchor) => anchor !== number)
        .map((anchor) => pairMap.get(pairKey(number, anchor)) ?? 0),
    );
    const values = combinations(
      anchors.filter((anchor) => anchor !== number),
      2,
    )
      .map(([left, right]) => tripleMap.get(tripleKey(number, left!, right!)) ?? 0)
      .sort((left, right) => right - left)
      .slice(0, 24);
    tripleSupport[number] = mean(values);
  }
  return {
    pairSupport: normalizeNumberSignal(pairSupport),
    tripleSupport: normalizeNumberSignal(tripleSupport),
    pairMap,
  };
}

function independentSignal(
  previousNumbers: readonly number[],
  pairMap: Map<string, number>,
): number[] {
  const signal = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    signal[number] = mean(
      previousNumbers.map((previous) => pairMap.get(pairKey(number, previous)) ?? 0),
    );
  }
  return normalizeNumberSignal(signal);
}

function reciprocalRankFusion(
  rankings: readonly (readonly number[])[],
  weights: readonly number[],
  bonus?: readonly number[],
): number[] {
  const positions = rankings.map(rankPositions);
  const scores = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    scores[number] =
      positions.reduce(
        (sum, ranking, index) => sum + (weights[index] ?? 1) / (60 + ranking[number]!),
        0,
      ) +
      (bonus?.[number] ?? 0) * 0.0005;
  }
  return rankByScore(scores);
}

function composeFixedSlots(
  sources: readonly { ranking: readonly number[]; slots: number }[],
  fallback: readonly number[],
): number[] {
  const selected: number[] = [];
  sources.forEach(({ ranking, slots }) => {
    let added = 0;
    for (const number of ranking) {
      if (selected.includes(number)) continue;
      selected.push(number);
      added += 1;
      if (added >= slots) break;
    }
  });
  [...fallback, ...Array.from({ length: 45 }, (_, index) => index + 1)].forEach(
    (number) => {
      if (!selected.includes(number)) selected.push(number);
    },
  );
  return selected;
}

function rankByScore(scores: readonly number[]): number[] {
  return Array.from({ length: 45 }, (_, index) => index + 1).sort(
    (left, right) => scores[right]! - scores[left]! || left - right,
  );
}

function rankPositions(ranking: readonly number[]): number[] {
  const positions = Array(46).fill(46) as number[];
  ranking.forEach((number, index) => {
    positions[number] = index + 1;
  });
  return positions;
}

function rankPercentile(rank: number): number {
  return (46 - rank) / 45;
}

function rankBucket(rank: number): '21-25' | '26-30' | '31-35' | '36-45' {
  if (rank <= 25) return '21-25';
  if (rank <= 30) return '26-30';
  if (rank <= 35) return '31-35';
  return '36-45';
}

function featureGroupFor(
  record: CandidateNumberDiagnostic,
): FeatureGroupStatistics['group'] {
  if (record.winning && record.inCurrentTop20) return 'winning-top20';
  if (record.winning) return 'winning-outside-top20';
  if (record.inCurrentTop20) return 'non-winning-top20';
  return 'non-winning-outside-top20';
}

function distributionStatistics(values: readonly number[]): DistributionStatistics {
  return {
    mean: mean(values),
    median: quantile(values, 0.5),
    standardDeviation: standardDeviation(values),
    p25: quantile(values, 0.25),
    p50: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    p90: quantile(values, 0.9),
  };
}

function monteCarloInterval(values: readonly number[]): MonteCarloInterval {
  return {
    mean: mean(values),
    p5: quantile(values, 0.05),
    p50: quantile(values, 0.5),
    p95: quantile(values, 0.95),
  };
}

function hitDistribution(values: readonly number[], total: number): number[] {
  const distribution = Array(7).fill(0) as number[];
  values.forEach((value) => {
    distribution[value] = distribution[value]! + 1;
  });
  if (values.length < total) {
    distribution[0] = distribution[0]! + total - values.length;
  }
  return distribution;
}

function sanitizeOptions(
  requested: Partial<CandidatePhase2Options>,
): CandidatePhase2Options {
  const mode = requested.mode ?? 'development';
  const defaults =
    mode === 'development'
      ? { startRound: 1044, endRound: 1235 }
      : mode === 'historical-reference'
        ? { startRound: 852, endRound: 1043 }
        : { startRound: 660, endRound: 851 };
  const poolSize = requested.poolSize ?? PHASE2_CANDIDATE_POOL_SIZE;
  if (poolSize !== PHASE2_CANDIDATE_POOL_SIZE) {
    throw new Error('Phase 2 Candidate Pool은 Top20으로 고정되어 있어요.');
  }
  return {
    mode,
    startRound: Math.trunc(requested.startRound ?? defaults.startRound),
    endRound: Math.trunc(requested.endRound ?? defaults.endRound),
    poolSize,
    seed: Math.trunc(requested.seed ?? 20260807),
    monteCarloRuns: Math.max(1000, Math.trunc(requested.monteCarloRuns ?? 1000)),
    ...(requested.frozenStrategyId === undefined
      ? {}
      : { frozenStrategyId: requested.frozenStrategyId }),
  };
}

function normalizeNumberSignal(values: readonly number[]): number[] {
  const relevant = values.slice(1);
  const minimum = Math.min(...relevant);
  const maximum = Math.max(...relevant);
  return values.map((value, index) =>
    index === 0 ? 0 : (value - minimum) / Math.max(maximum - minimum, 1e-9),
  );
}

function normalizeMap(values: Map<string, number>): Map<string, number> {
  const maximum = Math.max(...values.values(), 1e-9);
  return new Map([...values].map(([key, value]) => [key, value / maximum]));
}

function addMap(target: Map<string, number>, key: string, value: number): void {
  target.set(key, (target.get(key) ?? 0) + value);
}

function pairKey(left: number, right: number): string {
  return [left, right].sort((a, b) => a - b).join('-');
}

function tripleKey(first: number, second: number, third: number): string {
  return [first, second, third].sort((a, b) => a - b).join('-');
}

function combinations(numbers: readonly number[], size: number): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const visit = (start: number) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    const remaining = size - current.length;
    for (let index = start; index <= numbers.length - remaining; index += 1) {
      current.push(numbers[index]!);
      visit(index + 1);
      current.pop();
    }
  };
  visit(0);
  return result;
}

function choose(total: number, selected: number): number {
  if (selected < 0 || selected > total) return 0;
  const smaller = Math.min(selected, total - selected);
  let value = 1;
  for (let index = 1; index <= smaller; index += 1) {
    value = (value * (total - smaller + index)) / index;
  }
  return Math.round(value);
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomPermutation45(random: () => number): number[] {
  const values = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [values[index], values[other]] = [values[other]!, values[index]!];
  }
  return values;
}

function percentileAtOrBelow(values: readonly number[], target: number): number {
  return ratio(values.filter((value) => value <= target).length, values.length);
}

function percentileAtOrAbove(values: readonly number[], target: number): number {
  return ratio(values.filter((value) => value >= target).length, values.length);
}

function pearson(left: readonly number[], right: readonly number[]): number {
  const leftMean = mean(left);
  const rightMean = mean(right);
  const numerator = left.reduce(
    (sum, value, index) =>
      sum + (value - leftMean) * ((right[index] ?? rightMean) - rightMean),
    0,
  );
  const denominator = Math.sqrt(
    left.reduce((sum, value) => sum + (value - leftMean) ** 2, 0) *
      right.reduce((sum, value) => sum + (value - rightMean) ** 2, 0),
  );
  return denominator <= 1e-12 ? 0 : numerator / denominator;
}

function standardDeviation(values: readonly number[]): number {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function quantile(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const weight = position - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}
