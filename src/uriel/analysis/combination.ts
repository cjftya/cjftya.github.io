import type { Candidate, LayoutMode, LottoDraw, ShapeMetrics } from '../types';
import { findShapeCandidates } from './candidates';
import { metricsForNumbers } from './geometry';
import {
  boardShapeDistance,
  boardShapeFeatures,
  forecastBoardShapeTransitions,
} from './shapeTransition';

export type CombinationStrategy =
  | 'number'
  | 'pair'
  | 'pair-triple'
  | 'shape'
  | 'transition'
  | 'hybrid'
  | 'full-hybrid'
  | 'full-no-pair'
  | 'full-no-triple'
  | 'full-no-shape'
  | 'full-no-transition';

export type CombinationGenerationMode = 'current' | 'full-enumeration';

export interface CombinationFeatureVector {
  individualNumberScore: number;
  pairScore: number;
  tripleScore: number;
  circleShapeScore: number;
  gridShapeScore: number;
  shapeTransitionScore: number;
  frequencyBalance: number;
  recencyBalance: number;
  oddEvenBalance: number;
  lowHighBalance: number;
  rangeBalance: number;
  gapBalance: number;
  sumBalance: number;
  spatialDensity: number;
  modelAgreement: number;
  modelDisagreement: number;
}

export interface CombinationCandidate extends Candidate {
  features: CombinationFeatureVector;
  combinationScore: number;
}

export interface CombinationVector {
  numbers: readonly number[];
  metrics: ShapeMetrics;
  features: CombinationFeatureVector;
}

export interface CombinationScoreContribution {
  numberScore: number;
  pairScore: number;
  tripleScore: number;
  shapeScore: number;
  transitionScore: number;
  balanceScore: number;
  diversityScore: number;
  ensembleScore: number;
  finalScore: number;
}

export interface CombinationAnalysis {
  candidatePool: readonly number[];
  candidateRanking: readonly number[];
  researchByStrategy: Record<CombinationStrategy, CombinationCandidate[]>;
  legacyResearch: Candidate[];
  generatedCombinations: readonly CombinationVector[];
  generationMode: CombinationGenerationMode;
  rawCombinationCount: number;
  expectedCombinationCount: number;
  generationComplete: boolean;
  seed: number;
}

export interface CandidatePoolAnalysis {
  candidatePool: readonly number[];
  candidateRanking: readonly number[];
  legacyResearch: Candidate[];
}

const RESEARCH_COUNT = 100;
const MAX_POOL_SIZE = 20;
const RECENT_WINDOW = 48;
const DECAY_HALF_LIFE = 36;

const STRATEGY_WEIGHTS: Record<
  CombinationStrategy,
  Partial<Record<keyof CombinationFeatureVector, number>>
> = {
  number: {
    individualNumberScore: 0.7,
    modelAgreement: 0.18,
    frequencyBalance: 0.06,
    recencyBalance: 0.06,
  },
  pair: {
    pairScore: 0.68,
    individualNumberScore: 0.18,
    frequencyBalance: 0.07,
    recencyBalance: 0.07,
  },
  'pair-triple': {
    pairScore: 0.48,
    tripleScore: 0.24,
    individualNumberScore: 0.14,
    frequencyBalance: 0.07,
    recencyBalance: 0.07,
  },
  shape: {
    circleShapeScore: 0.38,
    gridShapeScore: 0.42,
    spatialDensity: 0.08,
    individualNumberScore: 0.06,
    sumBalance: 0.06,
  },
  transition: {
    shapeTransitionScore: 0.68,
    gridShapeScore: 0.14,
    individualNumberScore: 0.1,
    modelAgreement: 0.08,
  },
  hybrid: {
    individualNumberScore: 0.2,
    pairScore: 0.23,
    circleShapeScore: 0.13,
    gridShapeScore: 0.17,
    shapeTransitionScore: 0.1,
    modelAgreement: 0.07,
    frequencyBalance: 0.04,
    recencyBalance: 0.03,
    gapBalance: 0.03,
  },
  'full-hybrid': {
    individualNumberScore: 0.16,
    pairScore: 0.2,
    tripleScore: 0.08,
    circleShapeScore: 0.1,
    gridShapeScore: 0.13,
    shapeTransitionScore: 0.11,
    frequencyBalance: 0.03,
    recencyBalance: 0.03,
    oddEvenBalance: 0.025,
    lowHighBalance: 0.025,
    rangeBalance: 0.02,
    gapBalance: 0.02,
    sumBalance: 0.02,
    spatialDensity: 0.02,
    modelAgreement: 0.06,
    modelDisagreement: 0.02,
  },
  'full-no-pair': {},
  'full-no-triple': {},
  'full-no-shape': {},
  'full-no-transition': {},
};

STRATEGY_WEIGHTS['full-no-pair'] = without(
  STRATEGY_WEIGHTS['full-hybrid'],
  'pairScore',
);
STRATEGY_WEIGHTS['full-no-triple'] = without(
  STRATEGY_WEIGHTS['full-hybrid'],
  'tripleScore',
);
STRATEGY_WEIGHTS['full-no-shape'] = without(
  without(STRATEGY_WEIGHTS['full-hybrid'], 'circleShapeScore'),
  'gridShapeScore',
);
STRATEGY_WEIGHTS['full-no-transition'] = without(
  STRATEGY_WEIGHTS['full-hybrid'],
  'shapeTransitionScore',
);

interface NumberSignals {
  consensus: number[];
  disagreement: number[];
  frequency: number[];
  recency: number[];
}

interface RelationshipStats {
  pair: Map<string, number>;
  triple: Map<string, number>;
}

interface DistributionTarget {
  mean: number;
  deviation: number;
}

interface PatternTargets {
  sum: DistributionTarget;
  range: DistributionTarget;
  gap: DistributionTarget;
  odd: DistributionTarget;
  low: DistributionTarget;
  density: DistributionTarget;
  circle: ShapeMetrics;
  board: ShapeMetrics;
}

export const mainCombinationStrategies: readonly CombinationStrategy[] = [
  'number',
  'pair',
  'pair-triple',
  'shape',
  'transition',
  'hybrid',
  'full-hybrid',
];

export const ablationStrategies: readonly CombinationStrategy[] = [
  'full-no-pair',
  'full-no-triple',
  'full-no-shape',
  'full-no-transition',
];

export function buildCombinationAnalysis(
  draws: readonly LottoDraw[],
  index: number,
  poolSize = 15,
  includeAblation = true,
  generationMode: CombinationGenerationMode = 'current',
): CombinationAnalysis {
  const safePoolSize = Math.min(Math.max(poolSize, 10), MAX_POOL_SIZE);
  const candidateContext = buildCandidateContext(draws, index, safePoolSize);
  const { candidatePool, candidateRanking, legacyResearch, signals } = candidateContext;
  const combinations = combinationsOfSix(candidatePool);
  const known = draws.slice(0, index + 1);
  const relationships = buildRelationshipStats(known);
  const targets = buildPatternTargets(known);
  const shapeForecast = forecastBoardShapeTransitions(draws, index);
  const vectors: CombinationVector[] = combinations.map((numbers) => ({
    numbers,
    metrics: metricsForNumbers(numbers, 'board'),
    features: combinationFeatures(
      numbers,
      signals,
      relationships,
      targets,
      shapeForecast.scenarios,
    ),
  }));
  const requestedStrategies = includeAblation
    ? [...mainCombinationStrategies, ...ablationStrategies]
    : [...mainCombinationStrategies];
  const researchByStrategy = Object.fromEntries(
    requestedStrategies.map((strategy) => [
      strategy,
      rankCombinations(vectors, strategy).slice(0, RESEARCH_COUNT),
    ]),
  ) as Record<CombinationStrategy, CombinationCandidate[]>;

  if (!includeAblation) {
    ablationStrategies.forEach((strategy) => {
      researchByStrategy[strategy] = [];
    });
  }

  return {
    candidatePool,
    candidateRanking,
    researchByStrategy,
    legacyResearch,
    generatedCombinations: vectors,
    generationMode,
    rawCombinationCount: combinations.length,
    expectedCombinationCount: choose(safePoolSize, 6),
    generationComplete: combinations.length === choose(safePoolSize, 6),
    seed: deterministicSeed(draws[index]?.round ?? index + 1),
  };
}

export function buildCandidatePoolAnalysis(
  draws: readonly LottoDraw[],
  index: number,
  poolSize = 15,
): CandidatePoolAnalysis {
  const safePoolSize = Math.min(Math.max(poolSize, 10), MAX_POOL_SIZE);
  const { candidatePool, candidateRanking, legacyResearch } = buildCandidateContext(
    draws,
    index,
    safePoolSize,
  );
  return { candidatePool, candidateRanking, legacyResearch };
}

function buildCandidateContext(
  draws: readonly LottoDraw[],
  index: number,
  poolSize: number,
): CandidatePoolAnalysis & { signals: NumberSignals } {
  const baseline = findShapeCandidates(draws, index, 'board', 100, 'baseline');
  const hybrid = findShapeCandidates(draws, index, 'board', 100, 'hybrid');
  const transition = findShapeCandidates(
    draws,
    index,
    'board',
    100,
    'shape-transition',
  );
  const models = [baseline.candidates, hybrid.candidates, transition.candidates];
  const signals = buildNumberSignals(draws.slice(0, index + 1), models);
  const candidateRanking = Array.from(
    { length: 45 },
    (_, numberIndex) => numberIndex + 1,
  ).sort(
    (left, right) =>
      signals.consensus[right]! - signals.consensus[left]! || left - right,
  );
  return {
    candidatePool: candidateRanking.slice(0, poolSize),
    candidateRanking,
    legacyResearch: transition.candidates,
    signals,
  };
}

function buildNumberSignals(
  known: readonly LottoDraw[],
  models: readonly (readonly Candidate[])[],
): NumberSignals {
  const modelSignals = models.map((candidates) => {
    const values = Array(46).fill(0) as number[];
    candidates.forEach((candidate, rank) => {
      const rankWeight = 1 / (1 + rank / 16);
      const tierWeight =
        candidate.tier === 'confidence' ? 1.18 : candidate.tier === 'focus' ? 1.08 : 1;
      candidate.numbers.forEach((number) => {
        values[number] = values[number]! + rankWeight * tierWeight;
      });
    });
    return normalizeNumberArray(values);
  });
  const consensus = Array(46).fill(0) as number[];
  const disagreement = Array(46).fill(0) as number[];
  for (let number = 1; number <= 45; number += 1) {
    const values = modelSignals.map((signal) => signal[number]!);
    const average = mean(values);
    consensus[number] = average;
    disagreement[number] = clamp01(
      Math.sqrt(mean(values.map((value) => (value - average) ** 2))) * 2.4,
    );
  }

  const frequency = Array(46).fill(0) as number[];
  const recency = Array(46).fill(0) as number[];
  known.forEach((draw, drawIndex) => {
    const age = known.length - 1 - drawIndex;
    const decay = 0.5 ** (age / DECAY_HALF_LIFE);
    draw.numbers.forEach((number) => {
      frequency[number] = frequency[number]! + 1;
      recency[number] = recency[number]! + decay;
    });
  });
  return {
    consensus,
    disagreement,
    frequency: normalizeNumberArray(frequency),
    recency: normalizeNumberArray(recency),
  };
}

function buildRelationshipStats(known: readonly LottoDraw[]): RelationshipStats {
  const pairRaw = new Map<string, number>();
  const tripleRaw = new Map<string, number>();
  known.forEach((draw, drawIndex) => {
    const age = known.length - 1 - drawIndex;
    const decay = 0.5 ** (age / DECAY_HALF_LIFE);
    const recent = age < RECENT_WINDOW ? 0.35 : 0;
    const weight = 0.65 * decay + recent;
    combinations(draw.numbers, 2).forEach((values) => {
      addMap(pairRaw, values.join('-'), weight);
    });
    combinations(draw.numbers, 3).forEach((values) => {
      addMap(tripleRaw, values.join('-'), weight);
    });
  });
  return {
    pair: normalizeMap(pairRaw),
    triple: normalizeMap(tripleRaw),
  };
}

function buildPatternTargets(known: readonly LottoDraw[]): PatternTargets {
  const recent = known.slice(-96);
  const sums = recent.map((draw) => sum(draw.numbers));
  const ranges = recent.map(
    (draw) => Math.max(...draw.numbers) - Math.min(...draw.numbers),
  );
  const gaps = recent.map((draw) => gapMean(draw.numbers));
  const odds = recent.map(
    (draw) => draw.numbers.filter((number) => number % 2 === 1).length,
  );
  const lows = recent.map(
    (draw) => draw.numbers.filter((number) => number <= 22).length,
  );
  const densities = recent.map(
    (draw) => metricsForNumbers(draw.numbers, 'board').compactness,
  );
  return {
    sum: distribution(sums),
    range: distribution(ranges),
    gap: distribution(gaps),
    odd: distribution(odds),
    low: distribution(lows),
    density: distribution(densities),
    circle: weightedMetricMean(recent, 'circle'),
    board: weightedMetricMean(recent, 'board'),
  };
}

function combinationFeatures(
  numbers: readonly number[],
  signals: NumberSignals,
  relationships: RelationshipStats,
  targets: PatternTargets,
  scenarios: readonly { features: readonly number[]; probability: number }[],
): CombinationFeatureVector {
  const pairs = combinations(numbers, 2);
  const triples = combinations(numbers, 3);
  const circle = metricsForNumbers(numbers, 'circle');
  const board = metricsForNumbers(numbers, 'board');
  const pairScore = mean(
    pairs.map((pair) => relationships.pair.get(pair.join('-')) ?? 0),
  );
  const exactTriple = mean(
    triples.map((triple) => relationships.triple.get(triple.join('-')) ?? 0),
  );
  const pairConsistency = mean(
    triples.map((triple) =>
      mean(
        combinations(triple, 2).map(
          (pair) => relationships.pair.get(pair.join('-')) ?? 0,
        ),
      ),
    ),
  );
  const transitionDistance = Math.min(
    ...scenarios.map(
      (scenario) =>
        boardShapeDistance(boardShapeFeatures(numbers), scenario.features) /
        Math.max(Math.sqrt(scenario.probability), 0.35),
    ),
  );
  const agreement = mean(numbers.map((number) => signals.consensus[number]!));
  const disagreement = mean(numbers.map((number) => signals.disagreement[number]!));
  return {
    individualNumberScore: agreement,
    pairScore,
    tripleScore: exactTriple * 0.45 + pairConsistency * 0.55,
    circleShapeScore: shapeCloseness(circle, targets.circle),
    gridShapeScore: shapeCloseness(board, targets.board),
    shapeTransitionScore: Math.exp(-transitionDistance * 4.2),
    frequencyBalance: closeness(
      mean(numbers.map((number) => signals.frequency[number]!)),
      { mean: 0.5, deviation: 0.24 },
    ),
    recencyBalance: closeness(mean(numbers.map((number) => signals.recency[number]!)), {
      mean: 0.5,
      deviation: 0.24,
    }),
    oddEvenBalance: closeness(
      numbers.filter((number) => number % 2 === 1).length,
      targets.odd,
    ),
    lowHighBalance: closeness(
      numbers.filter((number) => number <= 22).length,
      targets.low,
    ),
    rangeBalance: closeness(Math.max(...numbers) - Math.min(...numbers), targets.range),
    gapBalance: closeness(gapMean(numbers), targets.gap),
    sumBalance: closeness(sum(numbers), targets.sum),
    spatialDensity: closeness(board.compactness, targets.density),
    modelAgreement: agreement,
    modelDisagreement: disagreement,
  };
}

export function rankCombinations(
  vectors: readonly CombinationVector[],
  strategy: CombinationStrategy,
): CombinationCandidate[] {
  return vectors
    .map((vector): CombinationCandidate => {
      const combinationScore = combinationScoreFor(vector.features, strategy);
      return {
        ...vector,
        score: 1 - combinationScore,
        combinationScore,
        hypothesis: strategy === 'transition' ? 'transition' : 'consensus',
      };
    })
    .sort(
      (left, right) =>
        right.combinationScore - left.combinationScore ||
        left.numbers.join('-').localeCompare(right.numbers.join('-')),
    );
}

export function combinationScoreFor(
  features: CombinationFeatureVector,
  strategy: CombinationStrategy,
): number {
  const weights = STRATEGY_WEIGHTS[strategy];
  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + weight,
    0,
  );
  return (
    Object.entries(weights).reduce(
      (total, [feature, weight]) =>
        total + features[feature as keyof CombinationFeatureVector] * weight,
      0,
    ) / Math.max(totalWeight, 1e-9)
  );
}

export function scoreContributionFor(
  features: CombinationFeatureVector,
  strategy: CombinationStrategy,
): CombinationScoreContribution {
  const weights = STRATEGY_WEIGHTS[strategy];
  const totalWeight = Math.max(
    Object.values(weights).reduce((total, weight) => total + weight, 0),
    1e-9,
  );
  const contribution = (feature: keyof CombinationFeatureVector) =>
    (features[feature] * (weights[feature] ?? 0)) / totalWeight;
  const sumFeatures = (featureNames: readonly (keyof CombinationFeatureVector)[]) =>
    featureNames.reduce((total, feature) => total + contribution(feature), 0);
  const result: CombinationScoreContribution = {
    numberScore: contribution('individualNumberScore'),
    pairScore: contribution('pairScore'),
    tripleScore: contribution('tripleScore'),
    shapeScore: sumFeatures(['circleShapeScore', 'gridShapeScore']),
    transitionScore: contribution('shapeTransitionScore'),
    balanceScore: sumFeatures([
      'frequencyBalance',
      'recencyBalance',
      'oddEvenBalance',
      'lowHighBalance',
      'rangeBalance',
      'gapBalance',
      'sumBalance',
      'spatialDensity',
    ]),
    diversityScore: contribution('modelDisagreement'),
    ensembleScore: contribution('modelAgreement'),
    finalScore: 0,
  };
  result.finalScore =
    result.numberScore +
    result.pairScore +
    result.tripleScore +
    result.shapeScore +
    result.transitionScore +
    result.balanceScore +
    result.diversityScore +
    result.ensembleScore;
  return result;
}

function combinationsOfSix(numbers: readonly number[]): number[][] {
  return combinations(
    [...numbers].sort((left, right) => left - right),
    6,
  );
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

function weightedMetricMean(
  draws: readonly LottoDraw[],
  layout: LayoutMode,
): ShapeMetrics {
  if (draws.length === 0) return metricsForNumbers([1, 8, 15, 22, 29, 36], layout);
  const weighted = draws.map((draw, index) => ({
    value: metricsForNumbers(draw.numbers, layout),
    weight: index + 1,
  }));
  const totalWeight = weighted.reduce((total, entry) => total + entry.weight, 0);
  const field = (key: keyof ShapeMetrics) =>
    weighted.reduce((total, entry) => total + entry.value[key] * entry.weight, 0) /
    totalWeight;
  return {
    centroidX: field('centroidX'),
    centroidY: field('centroidY'),
    area: field('area'),
    perimeter: field('perimeter'),
    compactness: field('compactness'),
    spread: field('spread'),
    orientation: field('orientation'),
  };
}

function shapeCloseness(left: ShapeMetrics, right: ShapeMetrics): number {
  const distance = Math.sqrt(
    mean([
      ((left.centroidX - right.centroidX) / 0.55) ** 2,
      ((left.centroidY - right.centroidY) / 0.55) ** 2,
      ((left.area - right.area) / 0.75) ** 2,
      ((left.perimeter - right.perimeter) / 2.2) ** 2,
      ((left.compactness - right.compactness) / 0.28) ** 2,
      ((left.spread - right.spread) / 0.35) ** 2,
    ]),
  );
  return Math.exp(-distance);
}

function distribution(values: readonly number[]): DistributionTarget {
  const average = mean(values);
  return {
    mean: average,
    deviation: Math.max(
      Math.sqrt(mean(values.map((value) => (value - average) ** 2))),
      0.35,
    ),
  };
}

function closeness(value: number, target: DistributionTarget): number {
  const z = (value - target.mean) / Math.max(target.deviation, 1e-9);
  return Math.exp(-0.5 * z * z);
}

function gapMean(numbers: readonly number[]): number {
  const sorted = [...numbers].sort((left, right) => left - right);
  return mean(sorted.slice(1).map((number, index) => number - sorted[index]!));
}

function normalizeNumberArray(values: readonly number[]): number[] {
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

function without(
  weights: Partial<Record<keyof CombinationFeatureVector, number>>,
  key: keyof CombinationFeatureVector,
): Partial<Record<keyof CombinationFeatureVector, number>> {
  return Object.fromEntries(
    Object.entries(weights).filter(([feature]) => feature !== key),
  );
}

function deterministicSeed(round: number): number {
  return (round * 2654435761) >>> 0;
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

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
