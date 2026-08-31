import { fourNumberSubsets, selectBestStable } from './selection';
import type {
  Candidate,
  CandidateHypothesis,
  CandidateMethod,
  CandidateModel,
  CandidateTier,
  LayoutMode,
  LottoDraw,
  ShapeMetrics,
} from '../types';
import { metricsForDraw, metricsForNumbers } from './geometry';
import {
  boardShapeDistance,
  boardShapeFeatures,
  forecastBoardShapeTransitions,
} from './shapeTransition';

const SEARCH_SPACE = 40000;
const TOTAL_COMBINATIONS = 8145060;
const COMBINATION_STEP = 7919;
const COMBINATION_OFFSET = 104729;
const TRANSITION_NEIGHBORS = 16;
const DIVERSITY_POOL_SIZE = 1600;
const HISTORY_WINDOWS = [8, 24, 72] as const;
const RIDGE_MINIMUM_SAMPLES = 72;
const RIDGE_MAXIMUM_SAMPLES = 720;
const RIDGE_LAMBDA = 24;
const PORTFOLIO_RATIOS: Record<CandidateTier, number> = {
  explore: 0.55,
  focus: 0.35,
  confidence: 0.1,
};

interface FeatureDefinition {
  scale: number;
  weight: number;
}

interface CandidateBasis {
  numbers: readonly number[];
  metrics: ShapeMetrics;
  features: readonly number[];
}

interface ScoredBasis extends CandidateBasis {
  distance: number;
  hypothesis?: CandidateHypothesis;
}

interface HypothesisScore extends CandidateBasis {
  baselineDistance: number;
  transitionDistance: number;
  ridgeDistance: number;
  consensusDistance: number;
  disagreement: number;
}

interface TargetEstimate {
  features: number[];
  metrics: ShapeMetrics;
  transitionNeighbors: number;
  hypotheses: {
    baseline: number[];
    transition: number[];
    ridge: number[];
  };
  ridgeTrainingSamples: number;
}

const BASE_FEATURES: readonly FeatureDefinition[] = [
  { scale: 0.55, weight: 1 },
  { scale: 0.55, weight: 1 },
  { scale: 0.75, weight: 1 },
  { scale: 2.2, weight: 0.7 },
  { scale: 0.28, weight: 1 },
  { scale: 0.35, weight: 1 },
  { scale: 1, weight: 0.28 },
  { scale: 1, weight: 0.28 },
];

const BOARD_FEATURES: readonly FeatureDefinition[] = [
  ...Array.from({ length: 14 }, () => ({ scale: 1.35, weight: 0.22 })),
  { scale: 1.8, weight: 0.45 },
  { scale: 1.8, weight: 0.45 },
  { scale: 1.5, weight: 0.55 },
  { scale: 1.2, weight: 0.35 },
  { scale: 1.1, weight: 0.35 },
  { scale: 1.6, weight: 0.35 },
  { scale: 1.4, weight: 0.4 },
  { scale: 1.3, weight: 0.35 },
  { scale: 1.3, weight: 0.35 },
  { scale: 1.3, weight: 0.35 },
  { scale: 3.2, weight: 0.45 },
  { scale: 0.5, weight: 0.3 },
  { scale: 0.5, weight: 0.3 },
];

const FIXED_COMBINATIONS = buildFixedCombinations();
const cachedCandidateBasis = new Map<LayoutMode, CandidateBasis[]>();
const cachedShapeBasis = new Map<LayoutMode, CandidateBasis[]>();

export function findShapeCandidates(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count = 6,
  model: CandidateModel = 'hybrid',
): { candidates: Candidate[]; target: ShapeMetrics; method: CandidateMethod } {
  if (model === 'shape-transition') {
    const forecast = forecastBoardShapeTransitions(draws, index);
    return {
      candidates: shapeTransitionCandidates(layout, forecast.scenarios, count),
      target: forecast.metrics,
      method: {
        algorithmId: 'transition-tail',
        sourceModel: model,
        searchSpace: SEARCH_SPACE,
        featureCount: forecast.currentFeatures.length,
        transitionNeighbors: 0,
        diversified: true,
        ridgeTrainingSamples: 0,
        shapeSequenceNeighbors: forecast.neighbors,
        shapeScenarioCount: forecast.scenarios.length,
      },
    };
  }
  const estimate = estimateTarget(draws, index, layout, model === 'hybrid');
  const definitions = featureDefinitions(layout);
  const candidates =
    model === 'baseline'
      ? baselineCandidates(layout, estimate.features, definitions, count)
      : hybridCandidates(layout, estimate, definitions, count);

  return {
    candidates,
    target: estimate.metrics,
    method: {
      algorithmId: model === 'baseline' ? 'baseline' : 'transition-tail',
      sourceModel: model,
      searchSpace: SEARCH_SPACE,
      featureCount: definitions.length,
      transitionNeighbors: estimate.transitionNeighbors,
      diversified: true,
      ridgeTrainingSamples: model === 'hybrid' ? estimate.ridgeTrainingSamples : 0,
      portfolio: model === 'hybrid' ? countByTier(candidates) : undefined,
    },
  };
}

function shapeTransitionCandidates(
  layout: LayoutMode,
  scenarios: readonly { features: readonly number[]; probability: number }[],
  count: number,
): Candidate[] {
  const ranked = selectBestStable(
    shapeCandidateBasis(layout).map((basis): ScoredBasis => {
      const distance = Math.min(
        ...scenarios.map(
          (scenario) =>
            boardShapeDistance(basis.features, scenario.features) /
            Math.max(Math.sqrt(scenario.probability), 0.35),
        ),
      );
      return {
        ...basis,
        distance,
        hypothesis: 'transition',
      };
    }),
    Math.max(DIVERSITY_POOL_SIZE, count * 16),
    (left, right) => left.distance - right.distance,
  );

  return diversifyCandidates(ranked, count, {
    tier: 'explore',
    overlapPenalty: 0.24,
    exposurePenalty: 0.12,
    unseenBonus: 0.024,
    fourSetBonus: 0.003,
  });
}

function shapeCandidateBasis(layout: LayoutMode): CandidateBasis[] {
  const cached = cachedShapeBasis.get(layout);
  if (cached !== undefined) return cached;
  const values = FIXED_COMBINATIONS.map((numbers) => ({
    numbers,
    metrics: metricsForNumbers(numbers, layout),
    features: boardShapeFeatures(numbers),
  }));
  cachedShapeBasis.set(layout, values);
  return values;
}

export function findBaselineCandidates(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count = 6,
): { candidates: Candidate[]; target: ShapeMetrics; method: CandidateMethod } {
  return findShapeCandidates(draws, index, layout, count, 'baseline');
}

export function estimateNextMetrics(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
): ShapeMetrics {
  return estimateTarget(draws, index, layout).metrics;
}

function baselineCandidates(
  layout: LayoutMode,
  target: readonly number[],
  definitions: readonly FeatureDefinition[],
  count: number,
): Candidate[] {
  const ranked = selectBestStable(
    candidateBasis(layout).map((basis): ScoredBasis => ({
      ...basis,
      distance: featureDistance(basis.features, target, definitions),
    })),
    Math.max(DIVERSITY_POOL_SIZE, count * 12),
    (left, right) => left.distance - right.distance,
  );
  return diversifyCandidates(ranked, count);
}

function hybridCandidates(
  layout: LayoutMode,
  estimate: TargetEstimate,
  definitions: readonly FeatureDefinition[],
  count: number,
): Candidate[] {
  const scored = candidateBasis(layout).map((basis): HypothesisScore => {
    const baselineDistance = featureDistance(
      basis.features,
      estimate.hypotheses.baseline,
      definitions,
    );
    const transitionDistance = featureDistance(
      basis.features,
      estimate.hypotheses.transition,
      definitions,
    );
    const ridgeDistance = featureDistance(
      basis.features,
      estimate.hypotheses.ridge,
      definitions,
    );
    const distances = [baselineDistance, transitionDistance, ridgeDistance];
    const distanceMean = mean(distances);
    return {
      ...basis,
      baselineDistance,
      transitionDistance,
      ridgeDistance,
      consensusDistance:
        baselineDistance * 0.34 + transitionDistance * 0.36 + ridgeDistance * 0.3,
      disagreement: Math.sqrt(
        mean(distances.map((distance) => (distance - distanceMean) ** 2)),
      ),
    };
  });
  const allocations = allocatePortfolio(count);
  const used = new Set<string>();
  const selected: Record<CandidateTier, Candidate[]> = {
    explore: selectExplore(scored, allocations.explore, used),
    focus: selectPortfolioTier(
      scored,
      allocations.focus,
      used,
      'focus',
      (candidate) => candidate.consensusDistance,
      0.2,
    ),
    confidence: selectPortfolioTier(
      scored,
      allocations.confidence,
      used,
      'confidence',
      (candidate) => candidate.consensusDistance + candidate.disagreement * 0.75,
      0.06,
    ),
  };
  return interleavePortfolio(selected, count);
}

function selectExplore(
  scored: readonly HypothesisScore[],
  count: number,
  used: Set<string>,
): Candidate[] {
  const pools = (
    [
      ['baselineDistance', 0],
      ['transitionDistance', 1],
      ['ridgeDistance', 2],
    ] as const
  ).map(([key, hypothesis]) =>
    selectBestStable(
      scored,
      DIVERSITY_POOL_SIZE,
      (left, right) => left[key] - right[key],
    ).map((candidate) => ({ candidate, hypothesis })),
  );
  const merged = pools
    .flat()
    .sort(
      (left, right) =>
        hypothesisDistance(left.candidate, left.hypothesis) -
        hypothesisDistance(right.candidate, right.hypothesis),
    );
  const ranked: ScoredBasis[] = [];
  const seen = new Set<string>();
  merged.forEach(({ candidate, hypothesis }) => {
    const key = candidate.numbers.join('-');
    if (seen.has(key)) return;
    seen.add(key);
    ranked.push({
      numbers: candidate.numbers,
      metrics: candidate.metrics,
      features: candidate.features,
      distance: hypothesisDistance(candidate, hypothesis),
      hypothesis: hypothesisName(hypothesis),
    });
  });
  return diversifyCandidates(ranked, count, {
    tier: 'explore',
    used,
    overlapPenalty: 0.34,
    exposurePenalty: 0.22,
    unseenBonus: 0.05,
    fourSetBonus: 0.006,
  });
}

function selectPortfolioTier(
  scored: readonly HypothesisScore[],
  count: number,
  used: Set<string>,
  tier: CandidateTier,
  score: (candidate: HypothesisScore) => number,
  overlapPenalty: number,
): Candidate[] {
  const ranked = selectBestStable(
    scored
      .filter((candidate) => !used.has(candidate.numbers.join('-')))
      .map((candidate): ScoredBasis => ({
        numbers: candidate.numbers,
        metrics: candidate.metrics,
        features: candidate.features,
        distance: score(candidate),
        hypothesis: 'consensus',
      })),
    DIVERSITY_POOL_SIZE,
    (left, right) => left.distance - right.distance,
  );
  return diversifyCandidates(ranked, count, {
    tier,
    used,
    overlapPenalty,
    exposurePenalty: tier === 'focus' ? 0.1 : 0.025,
    unseenBonus: tier === 'focus' ? 0.018 : 0,
    fourSetBonus: tier === 'focus' ? 0.0015 : 0,
  });
}

function hypothesisDistance(candidate: HypothesisScore, hypothesis: number): number {
  if (hypothesis === 0) return candidate.baselineDistance;
  if (hypothesis === 1) return candidate.transitionDistance;
  return candidate.ridgeDistance;
}

function hypothesisName(hypothesis: number): CandidateHypothesis {
  if (hypothesis === 0) return 'baseline';
  if (hypothesis === 1) return 'transition';
  return 'ridge';
}

function allocatePortfolio(count: number): Record<CandidateTier, number> {
  if (count <= 0) return { explore: 0, focus: 0, confidence: 0 };
  const confidence = count >= 6 ? Math.max(1, Math.round(count * 0.1)) : 0;
  const focus = count >= 3 ? Math.max(1, Math.round(count * 0.35)) : 0;
  return {
    explore: count - focus - confidence,
    focus,
    confidence,
  };
}

function interleavePortfolio(
  groups: Record<CandidateTier, Candidate[]>,
  count: number,
): Candidate[] {
  const tiers = Object.keys(PORTFOLIO_RATIOS) as CandidateTier[];
  const consumed: Record<CandidateTier, number> = {
    explore: 0,
    focus: 0,
    confidence: 0,
  };
  const result: Candidate[] = [];
  while (result.length < count) {
    const available = tiers.filter((tier) => consumed[tier] < groups[tier].length);
    if (available.length === 0) break;
    const tier = [...available].sort(
      (left, right) =>
        consumed[left] / PORTFOLIO_RATIOS[left] -
        consumed[right] / PORTFOLIO_RATIOS[right],
    )[0]!;
    result.push(groups[tier][consumed[tier]]!);
    consumed[tier] += 1;
  }
  return result;
}

function countByTier(candidates: readonly Candidate[]): Record<CandidateTier, number> {
  return candidates.reduce(
    (counts, candidate) => {
      if (candidate.tier !== undefined) counts[candidate.tier] += 1;
      return counts;
    },
    { explore: 0, focus: 0, confidence: 0 },
  );
}

function estimateTarget(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  includeRidge = false,
): TargetEstimate {
  const history = draws
    .slice(0, index + 1)
    .map((draw) => encodeFeatures(draw.numbers, metricsForDraw(draw, layout), layout));
  if (history.length === 0) {
    const features = Array(featureDefinitions(layout).length).fill(0) as number[];
    return {
      features,
      metrics: zeroMetrics(),
      transitionNeighbors: 0,
      hypotheses: { baseline: features, transition: features, ridge: features },
      ridgeTrainingSamples: 0,
    };
  }

  const latest = history.at(-1)!;
  const previous = history.at(-2) ?? latest;
  const windowMeans = HISTORY_WINDOWS.map((window) =>
    weightedMean(history.slice(Math.max(0, history.length - window))),
  );
  const windowWeights = [0.5, 0.3, 0.2];
  const baseline = latest.map((_, featureIndex) =>
    windowMeans.reduce(
      (sum, mean, meanIndex) => sum + mean[featureIndex]! * windowWeights[meanIndex]!,
      0,
    ),
  );
  baseline.forEach((value, featureIndex) => {
    baseline[featureIndex] =
      value + (latest[featureIndex]! - previous[featureIndex]!) * 0.12;
  });

  const transitions = similarStateTransitions(history, featureDefinitions(layout));
  const transitionTarget =
    transitions.length === 0
      ? [...baseline]
      : latest.map(
          (value, featureIndex) =>
            value + weightedTransitionDelta(transitions, featureIndex),
        );
  const ridge = includeRidge
    ? ridgeTransitionTarget(history, featureDefinitions(layout))
    : null;
  const ridgeTarget = ridge?.features ?? [...baseline];
  const target = baseline.map(
    (value, featureIndex) => value * 0.45 + transitionTarget[featureIndex]! * 0.55,
  );
  normalizeOrientation(target);
  normalizeOrientation(baseline);
  normalizeOrientation(transitionTarget);
  normalizeOrientation(ridgeTarget);

  return {
    features: target,
    metrics: metricsFromFeatures(target),
    transitionNeighbors: transitions.length,
    hypotheses: {
      baseline,
      transition: transitionTarget,
      ridge: ridgeTarget,
    },
    ridgeTrainingSamples: ridge?.trainingSamples ?? 0,
  };
}

function similarStateTransitions(
  history: readonly (readonly number[])[],
  definitions: readonly FeatureDefinition[],
): { distance: number; recency: number; delta: number[] }[] {
  if (history.length < 10) return [];
  const current = history.at(-1)!;
  return history
    .slice(0, -1)
    .map((state, stateIndex) => ({
      distance: featureDistance(state, current, definitions),
      recency: 0.7 + 0.3 * (stateIndex / Math.max(history.length - 2, 1)),
      delta: history[stateIndex + 1]!.map(
        (value, featureIndex) => value - state[featureIndex]!,
      ),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, Math.min(TRANSITION_NEIGHBORS, history.length - 1));
}

function weightedTransitionDelta(
  transitions: readonly {
    distance: number;
    recency: number;
    delta: readonly number[];
  }[],
  featureIndex: number,
): number {
  let total = 0;
  let weightTotal = 0;
  transitions.forEach((transition) => {
    const weight = transition.recency / Math.max(transition.distance, 0.08);
    total += transition.delta[featureIndex]! * weight;
    weightTotal += weight;
  });
  return total / Math.max(weightTotal, 1e-9);
}

function weightedMean(values: readonly (readonly number[])[]): number[] {
  const totalWeight = values.reduce((sum, _, index) => sum + index + 1, 0);
  return values[0]!.map((_, featureIndex) =>
    values.reduce(
      (sum, value, index) => sum + value[featureIndex]! * ((index + 1) / totalWeight),
      0,
    ),
  );
}

function ridgeTransitionTarget(
  history: readonly (readonly number[])[],
  definitions: readonly FeatureDefinition[],
): { features: number[]; trainingSamples: number } | null {
  const trainingSamples = Math.min(
    Math.max(history.length - 2, 0),
    RIDGE_MAXIMUM_SAMPLES,
  );
  if (trainingSamples < RIDGE_MINIMUM_SAMPLES) return null;

  const start = history.length - trainingSamples - 2;
  const featureCount = definitions.length;
  const predictorCount = featureCount * 2 + 1;
  const xtx = Array.from(
    { length: predictorCount },
    () => Array(predictorCount).fill(0) as number[],
  );
  const xty = Array.from(
    { length: predictorCount },
    () => Array(featureCount).fill(0) as number[],
  );

  for (let stateIndex = start + 1; stateIndex < history.length; stateIndex += 1) {
    const previous = history[stateIndex - 1]!;
    const current = history[stateIndex]!;
    const next = history[stateIndex + 1];
    if (next === undefined) break;
    const predictors = ridgePredictors(previous, current, definitions);
    const response = next.map(
      (value, featureIndex) =>
        (value - current[featureIndex]!) / definitions[featureIndex]!.scale,
    );
    accumulateNormalEquation(xtx, xty, predictors, response);
  }

  for (let diagonal = 1; diagonal < predictorCount; diagonal += 1) {
    xtx[diagonal]![diagonal] = xtx[diagonal]![diagonal]! + RIDGE_LAMBDA;
  }
  xtx[0]![0] = xtx[0]![0]! + 0.001;
  const coefficients = solveLinearSystem(xtx, xty);
  if (coefficients === null) return null;

  const latest = history.at(-1)!;
  const previous = history.at(-2) ?? latest;
  const predictors = ridgePredictors(previous, latest, definitions);
  const delta = Array.from({ length: featureCount }, (_, featureIndex) =>
    predictors.reduce(
      (sum, predictor, predictorIndex) =>
        sum + predictor * coefficients[predictorIndex]![featureIndex]!,
      0,
    ),
  );
  const features = latest.map((value, featureIndex) => {
    const scaledDelta = clamp(delta[featureIndex]!, -1.6, 1.6);
    return value + scaledDelta * definitions[featureIndex]!.scale;
  });
  return { features, trainingSamples };
}

function ridgePredictors(
  previous: readonly number[],
  current: readonly number[],
  definitions: readonly FeatureDefinition[],
): number[] {
  const state = current.map(
    (value, featureIndex) => value / definitions[featureIndex]!.scale,
  );
  const delta = current.map(
    (value, featureIndex) =>
      (value - previous[featureIndex]!) / definitions[featureIndex]!.scale,
  );
  return [1, ...state, ...delta];
}

function accumulateNormalEquation(
  xtx: number[][],
  xty: number[][],
  predictors: readonly number[],
  response: readonly number[],
): void {
  predictors.forEach((left, leftIndex) => {
    predictors.forEach((right, rightIndex) => {
      xtx[leftIndex]![rightIndex] = xtx[leftIndex]![rightIndex]! + left * right;
    });
    response.forEach((value, responseIndex) => {
      xty[leftIndex]![responseIndex] = xty[leftIndex]![responseIndex]! + left * value;
    });
  });
}

function solveLinearSystem(
  matrix: readonly (readonly number[])[],
  outputs: readonly (readonly number[])[],
): number[][] | null {
  const size = matrix.length;
  const outputCount = outputs[0]?.length ?? 0;
  const augmented = matrix.map((row, index) => [...row, ...(outputs[index] ?? [])]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row]![column]!) > Math.abs(augmented[pivot]![column]!)) {
        pivot = row;
      }
    }
    if (Math.abs(augmented[pivot]![column]!) < 1e-10) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot]!, augmented[column]!];
    const divisor = augmented[column]![column]!;
    for (let valueIndex = column; valueIndex < size + outputCount; valueIndex += 1) {
      augmented[column]![valueIndex] = augmented[column]![valueIndex]! / divisor;
    }
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row]![column]!;
      if (Math.abs(factor) < 1e-12) continue;
      for (let valueIndex = column; valueIndex < size + outputCount; valueIndex += 1) {
        augmented[row]![valueIndex] =
          augmented[row]![valueIndex]! - factor * augmented[column]![valueIndex]!;
      }
    }
  }
  return augmented.map((row) => row.slice(size));
}

function candidateBasis(layout: LayoutMode): CandidateBasis[] {
  const cached = cachedCandidateBasis.get(layout);
  if (cached !== undefined) return cached;
  const values = FIXED_COMBINATIONS.map((numbers) => {
    const metrics = metricsForNumbers(numbers, layout);
    return { numbers, metrics, features: encodeFeatures(numbers, metrics, layout) };
  });
  cachedCandidateBasis.set(layout, values);
  return values;
}

function diversifyCandidates(
  ranked: readonly ScoredBasis[],
  count: number,
  options: {
    tier?: CandidateTier;
    used?: Set<string>;
    overlapPenalty?: number;
    exposurePenalty?: number;
    unseenBonus?: number;
    fourSetBonus?: number;
  } = {},
): Candidate[] {
  const fourSetBonus = options.fourSetBonus ?? 0;
  const available = ranked
    .filter((candidate) => !options.used?.has(candidate.numbers.join('-')))
    .map((candidate) => ({
      candidate,
      maximumOverlap: 0,
      fourSets: fourSetBonus === 0 ? [] : fourNumberSubsets(candidate.numbers),
    }));
  const selected: ScoredBasis[] = [];
  const numberUses = Array(46).fill(0) as number[];
  const coveredFourSets = new Set<string>();
  const overlapPenalty = options.overlapPenalty ?? 0.28;
  const exposurePenalty = options.exposurePenalty ?? 0.16;
  const unseenBonus = options.unseenBonus ?? 0.035;

  while (selected.length < count && available.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    available.forEach(({ candidate, maximumOverlap, fourSets }, candidateIndex) => {
      const exposure =
        selected.length === 0
          ? 0
          : Math.max(...candidate.numbers.map((number) => numberUses[number]!)) /
            selected.length;
      const unseenNumbers = candidate.numbers.filter(
        (number) => numberUses[number] === 0,
      ).length;
      const novelFourSets = fourSets.filter((key) => !coveredFourSets.has(key)).length;
      const selectionScore =
        candidate.distance +
        (maximumOverlap / 6) ** 2 * overlapPenalty +
        exposure * exposurePenalty -
        unseenNumbers * unseenBonus -
        novelFourSets * fourSetBonus;
      if (selectionScore < bestScore) {
        bestScore = selectionScore;
        bestIndex = candidateIndex;
      }
    });
    const [entry] = available.splice(bestIndex, 1);
    if (entry === undefined) break;
    const chosen = entry.candidate;
    selected.push(chosen);
    options.used?.add(chosen.numbers.join('-'));
    chosen.numbers.forEach((number) => {
      numberUses[number] = (numberUses[number] ?? 0) + 1;
    });
    entry.fourSets.forEach((key) => coveredFourSets.add(key));
    // Only the newly selected candidate can increase the existing maximum.
    // This preserves scores and tie order without rescanning the selected history.
    available.forEach((remaining) => {
      remaining.maximumOverlap = Math.max(
        remaining.maximumOverlap,
        overlap(remaining.candidate.numbers, chosen.numbers),
      );
    });
  }

  return selected.map(({ numbers, metrics, distance, hypothesis }) => ({
    numbers,
    metrics,
    score: distance,
    tier: options.tier,
    hypothesis,
  }));
}

function encodeFeatures(
  numbers: readonly number[],
  metrics: ShapeMetrics,
  layout: LayoutMode,
): number[] {
  const orientation = (metrics.orientation * Math.PI) / 90;
  const base = [
    metrics.centroidX,
    metrics.centroidY,
    metrics.area,
    metrics.perimeter,
    metrics.compactness,
    metrics.spread,
    Math.cos(orientation),
    Math.sin(orientation),
  ];
  return layout === 'board' ? [...base, ...boardFeatures(numbers)] : base;
}

function boardFeatures(numbers: readonly number[]): number[] {
  const cells = numbers.map((number) => ({
    row: Math.floor((number - 1) / 7),
    column: (number - 1) % 7,
  }));
  const rowCounts = Array(7).fill(0) as number[];
  const columnCounts = Array(7).fill(0) as number[];
  cells.forEach(({ row, column }) => {
    rowCounts[row] = (rowCounts[row] ?? 0) + 1;
    columnCounts[column] = (columnCounts[column] ?? 0) + 1;
  });
  const rows = cells.map(({ row }) => row);
  const columns = cells.map(({ column }) => column);
  const distances: number[] = [];
  let horizontal = 0;
  let vertical = 0;
  let diagonal = 0;
  cells.forEach((cell, index) => {
    cells.slice(index + 1).forEach((other) => {
      const rowDifference = Math.abs(cell.row - other.row);
      const columnDifference = Math.abs(cell.column - other.column);
      distances.push(Math.hypot(rowDifference, columnDifference));
      if (rowDifference === 0 && columnDifference === 1) horizontal += 1;
      if (rowDifference === 1 && columnDifference === 0) vertical += 1;
      if (rowDifference === 1 && columnDifference === 1) diagonal += 1;
    });
  });
  const distanceMean = mean(distances);
  const distanceDeviation = Math.sqrt(
    mean(distances.map((distance) => (distance - distanceMean) ** 2)),
  );

  return [
    ...rowCounts,
    ...columnCounts,
    Math.max(...columns) - Math.min(...columns),
    Math.max(...rows) - Math.min(...rows),
    distanceMean,
    distanceDeviation,
    Math.min(...distances),
    Math.max(...distances),
    convexHullSize(cells),
    horizontal,
    vertical,
    diagonal,
    minimumSpanningTreeLength(cells),
    symmetryScore(cells, 'horizontal'),
    symmetryScore(cells, 'vertical'),
  ];
}

function convexHullSize(points: readonly { row: number; column: number }[]): number {
  const sorted = [...points].sort(
    (left, right) => left.column - right.column || left.row - right.row,
  );
  const cross = (
    origin: { row: number; column: number },
    left: { row: number; column: number },
    right: { row: number; column: number },
  ) =>
    (left.column - origin.column) * (right.row - origin.row) -
    (left.row - origin.row) * (right.column - origin.column);
  const half = (values: readonly { row: number; column: number }[]) => {
    const hull: { row: number; column: number }[] = [];
    values.forEach((point) => {
      while (hull.length >= 2 && cross(hull.at(-2)!, hull.at(-1)!, point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    });
    return hull;
  };
  return Math.max(2, half(sorted).length + half([...sorted].reverse()).length - 2);
}

function minimumSpanningTreeLength(
  points: readonly { row: number; column: number }[],
): number {
  const connected = new Set<number>([0]);
  let length = 0;
  while (connected.size < points.length) {
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestIndex = -1;
    connected.forEach((fromIndex) => {
      points.forEach((to, toIndex) => {
        if (connected.has(toIndex)) return;
        const from = points[fromIndex]!;
        const distance = Math.hypot(from.row - to.row, from.column - to.column);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = toIndex;
        }
      });
    });
    if (bestIndex < 0) break;
    connected.add(bestIndex);
    length += bestDistance;
  }
  return length;
}

function symmetryScore(
  cells: readonly { row: number; column: number }[],
  axis: 'horizontal' | 'vertical',
): number {
  const occupied = new Set(cells.map(({ row, column }) => `${row}-${column}`));
  return (
    cells.filter(({ row, column }) =>
      occupied.has(
        axis === 'horizontal' ? `${6 - row}-${column}` : `${row}-${6 - column}`,
      ),
    ).length / cells.length
  );
}

function featureDefinitions(layout: LayoutMode): readonly FeatureDefinition[] {
  return layout === 'board' ? [...BASE_FEATURES, ...BOARD_FEATURES] : BASE_FEATURES;
}

function featureDistance(
  left: readonly number[],
  right: readonly number[],
  definitions: readonly FeatureDefinition[],
): number {
  let total = 0;
  let weightTotal = 0;
  definitions.forEach(({ scale, weight }, index) => {
    total += ((left[index]! - right[index]!) / scale) ** 2 * weight;
    weightTotal += weight;
  });
  return Math.sqrt(total / weightTotal);
}

function metricsFromFeatures(features: readonly number[]): ShapeMetrics {
  return {
    centroidX: clamp(features[0]!, -1, 1),
    centroidY: clamp(features[1]!, -1, 1),
    area: Math.max(0, features[2]!),
    perimeter: Math.max(0, features[3]!),
    compactness: clamp(features[4]!, 0, 1),
    spread: Math.max(0, features[5]!),
    orientation: (Math.atan2(features[7]!, features[6]!) * 90) / Math.PI,
  };
}

function normalizeOrientation(features: number[]): void {
  const length = Math.hypot(features[6]!, features[7]!);
  if (length === 0) {
    features[6] = 1;
    features[7] = 0;
    return;
  }
  features[6] = features[6]! / length;
  features[7] = features[7]! / length;
}

function overlap(left: readonly number[], right: readonly number[]): number {
  return left.filter((number) => right.includes(number)).length;
}

function buildFixedCombinations(): readonly number[][] {
  return Array.from({ length: SEARCH_SPACE }, (_, index) =>
    unrankCombination(
      (COMBINATION_OFFSET + index * COMBINATION_STEP) % TOTAL_COMBINATIONS,
    ),
  );
}

function unrankCombination(rank: number): number[] {
  const values: number[] = [];
  let remainingRank = rank;
  let minimum = 1;
  for (let position = 0; position < 6; position += 1) {
    const remaining = 6 - position - 1;
    for (let value = minimum; value <= 45 - remaining; value += 1) {
      const blockSize = combination(45 - value, remaining);
      if (remainingRank < blockSize) {
        values.push(value);
        minimum = value + 1;
        break;
      }
      remainingRank -= blockSize;
    }
  }
  return values;
}

function combination(total: number, selected: number): number {
  if (selected === 0) return 1;
  let value = 1;
  for (let index = 1; index <= selected; index += 1) {
    value = (value * (total - selected + index)) / index;
  }
  return Math.round(value);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function zeroMetrics(): ShapeMetrics {
  return {
    centroidX: 0,
    centroidY: 0,
    area: 0,
    perimeter: 0,
    compactness: 0,
    spread: 0,
    orientation: 0,
  };
}
