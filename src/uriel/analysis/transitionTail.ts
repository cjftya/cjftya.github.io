import type { Candidate, CandidateMethod, LottoDraw, ShapeMetrics } from '../types';
import { findShapeCandidates } from './candidates';
import { metricsForNumbers } from './geometry';
import { selectBestStable } from './selection';
import {
  boardShapeDistance,
  boardShapeFeatures,
  forecastBoardShapeTransitions,
} from './shapeTransition';

export interface TransitionFeatureVector {
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

export interface TransitionCandidate extends Candidate {
  features: TransitionFeatureVector;
  combinationScore: number;
}

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

const CANDIDATE_POOL_SIZE = 15;
const RESEARCH_COUNT = 100;
const RECENT_WINDOW = 48;
const DECAY_HALF_LIFE = 36;

export function buildTransitionTailCandidates(
  draws: readonly LottoDraw[],
  index: number,
  count = RESEARCH_COUNT,
): {
  candidates: TransitionCandidate[];
  target: ShapeMetrics;
  method: CandidateMethod;
} {
  const known = draws.slice(0, index + 1);
  const models = [
    findShapeCandidates(draws, index, 'board', 100, 'baseline').candidates,
    findShapeCandidates(draws, index, 'board', 100, 'hybrid').candidates,
    findShapeCandidates(draws, index, 'board', 100, 'shape-transition').candidates,
  ];
  const signals = buildNumberSignals(known, models);
  const candidatePool = Array.from({ length: 45 }, (_, offset) => offset + 1)
    .sort(
      (left, right) =>
        signals.consensus[right]! - signals.consensus[left]! || left - right,
    )
    .slice(0, CANDIDATE_POOL_SIZE);
  const combinations = combinationsOfSix(candidatePool);
  const relationships = buildRelationshipStats(known);
  const targets = buildPatternTargets(known);
  const forecast = forecastBoardShapeTransitions(draws, index);
  const candidates = selectBestStable(
    combinations.map((numbers): TransitionCandidate => {
      const features = combinationFeatures(
        numbers,
        signals,
        relationships,
        targets,
        forecast.scenarios,
      );
      const combinationScore =
        features.shapeTransitionScore * 0.68 +
        features.gridShapeScore * 0.14 +
        features.individualNumberScore * 0.1 +
        features.modelAgreement * 0.08;
      return {
        numbers,
        metrics: metricsForNumbers(numbers, 'board'),
        features,
        score: 1 - combinationScore,
        combinationScore,
        hypothesis: 'transition',
      };
    }),
    count,
    (left, right) =>
      right.combinationScore - left.combinationScore ||
      left.numbers.join('-').localeCompare(right.numbers.join('-')),
  );

  return {
    candidates,
    target: forecast.metrics,
    method: {
      algorithmId: 'transition-tail',
      sourceModel: 'shape-transition',
      searchSpace: combinations.length,
      featureCount: 16,
      transitionNeighbors: forecast.neighbors,
      diversified: false,
      shapeSequenceNeighbors: forecast.neighbors,
      shapeScenarioCount: forecast.scenarios.length,
    },
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
  return { pair: normalizeMap(pairRaw), triple: normalizeMap(tripleRaw) };
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
): TransitionFeatureVector {
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
  layout: 'circle' | 'board',
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

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
