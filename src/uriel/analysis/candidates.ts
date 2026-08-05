import type {
  Candidate,
  CandidateMethod,
  LayoutMode,
  LottoDraw,
  ShapeMetrics,
} from '../types';
import { metricsForDraw, metricsForNumbers } from './geometry';

const SEARCH_SPACE = 40000;
const TOTAL_COMBINATIONS = 8145060;
const COMBINATION_STEP = 7919;
const COMBINATION_OFFSET = 104729;
const TRANSITION_NEIGHBORS = 16;
const DIVERSITY_POOL_SIZE = 1600;
const HISTORY_WINDOWS = [8, 24, 72] as const;

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
}

interface TargetEstimate {
  features: number[];
  metrics: ShapeMetrics;
  transitionNeighbors: number;
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
let cachedBasis: { layout: LayoutMode; values: CandidateBasis[] } | null = null;

export function findShapeCandidates(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count = 6,
): { candidates: Candidate[]; target: ShapeMetrics; method: CandidateMethod } {
  const estimate = estimateTarget(draws, index, layout);
  const definitions = featureDefinitions(layout);
  const ranked = candidateBasis(layout)
    .map((basis): ScoredBasis => ({
      ...basis,
      distance: featureDistance(basis.features, estimate.features, definitions),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, Math.max(DIVERSITY_POOL_SIZE, count * 12));
  const candidates = diversifyCandidates(ranked, count);

  return {
    candidates,
    target: estimate.metrics,
    method: {
      searchSpace: SEARCH_SPACE,
      featureCount: definitions.length,
      transitionNeighbors: estimate.transitionNeighbors,
      diversified: true,
    },
  };
}

export function estimateNextMetrics(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
): ShapeMetrics {
  return estimateTarget(draws, index, layout).metrics;
}

function estimateTarget(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
): TargetEstimate {
  const history = draws
    .slice(0, index + 1)
    .map((draw) => encodeFeatures(draw.numbers, metricsForDraw(draw, layout), layout));
  if (history.length === 0) {
    const features = Array(featureDefinitions(layout).length).fill(0) as number[];
    return { features, metrics: zeroMetrics(), transitionNeighbors: 0 };
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
  const target =
    transitions.length === 0
      ? baseline
      : baseline.map((value, featureIndex) => {
          const transition = weightedTransitionDelta(transitions, featureIndex);
          return value * 0.45 + (latest[featureIndex]! + transition) * 0.55;
        });
  normalizeOrientation(target);

  return {
    features: target,
    metrics: metricsFromFeatures(target),
    transitionNeighbors: transitions.length,
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

function candidateBasis(layout: LayoutMode): CandidateBasis[] {
  if (cachedBasis?.layout === layout) return cachedBasis.values;
  const values = FIXED_COMBINATIONS.map((numbers) => {
    const metrics = metricsForNumbers(numbers, layout);
    return { numbers, metrics, features: encodeFeatures(numbers, metrics, layout) };
  });
  cachedBasis = { layout, values };
  return values;
}

function diversifyCandidates(
  ranked: readonly ScoredBasis[],
  count: number,
): Candidate[] {
  const available = [...ranked];
  const selected: ScoredBasis[] = [];
  const numberUses = Array(46).fill(0) as number[];

  while (selected.length < count && available.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    available.forEach((candidate, candidateIndex) => {
      const maximumOverlap = selected.reduce(
        (maximum, other) =>
          Math.max(maximum, overlap(candidate.numbers, other.numbers)),
        0,
      );
      const exposure =
        selected.length === 0
          ? 0
          : Math.max(...candidate.numbers.map((number) => numberUses[number]!)) /
            selected.length;
      const unseenNumbers = candidate.numbers.filter(
        (number) => numberUses[number] === 0,
      ).length;
      const selectionScore =
        candidate.distance +
        (maximumOverlap / 6) ** 2 * 0.28 +
        exposure * 0.16 -
        unseenNumbers * 0.035;
      if (selectionScore < bestScore) {
        bestScore = selectionScore;
        bestIndex = candidateIndex;
      }
    });
    const [chosen] = available.splice(bestIndex, 1);
    if (chosen === undefined) break;
    selected.push(chosen);
    chosen.numbers.forEach((number) => {
      numberUses[number] = (numberUses[number] ?? 0) + 1;
    });
  }

  return selected.map(({ numbers, metrics, distance }) => ({
    numbers,
    metrics,
    score: distance,
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
