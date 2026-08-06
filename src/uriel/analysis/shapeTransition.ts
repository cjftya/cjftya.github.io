import type { LottoDraw, ShapeMetrics } from '../types';
import { metricsForNumbers } from './geometry';

const SEQUENCE_LENGTH = 3;
const NEIGHBOR_COUNT = 24;
const SCENARIO_COUNT = 3;

export interface ShapeTransitionScenario {
  features: readonly number[];
  probability: number;
  support: number;
  label: string;
}

export interface ShapeTransitionForecast {
  currentFeatures: readonly number[];
  scenarios: readonly ShapeTransitionScenario[];
  neighbors: number;
  confidence: number;
  metrics: ShapeMetrics;
}

interface TransitionNeighbor {
  distance: number;
  weight: number;
  next: readonly number[];
}

/**
 * Encodes the actual topology of a 7x7 ticket shape. Every feature is normalized
 * to roughly 0..1 so a moving centroid cannot drown out topology and adjacency.
 */
export function boardShapeFeatures(numbers: readonly number[]): number[] {
  const cells = numbers.map((number) => ({
    row: Math.floor((number - 1) / 7),
    column: (number - 1) % 7,
  }));
  const rows = cells.map(({ row }) => row);
  const columns = cells.map(({ column }) => column);
  const rowCounts = Array(7).fill(0) as number[];
  const columnCounts = Array(7).fill(0) as number[];
  const distances: number[] = [];
  let orthogonal = 0;
  let diagonal = 0;

  cells.forEach(({ row, column }, index) => {
    rowCounts[row] = rowCounts[row]! + 1;
    columnCounts[column] = columnCounts[column]! + 1;
    cells.slice(index + 1).forEach((other) => {
      const rowDelta = Math.abs(row - other.row);
      const columnDelta = Math.abs(column - other.column);
      distances.push(Math.hypot(rowDelta, columnDelta));
      if (rowDelta + columnDelta === 1) orthogonal += 1;
      if (rowDelta === 1 && columnDelta === 1) diagonal += 1;
    });
  });

  const metrics = metricsForNumbers(numbers, 'board');
  const distanceMean = mean(distances);
  const distanceDeviation = Math.sqrt(
    mean(distances.map((distance) => (distance - distanceMean) ** 2)),
  );
  const orientation = (metrics.orientation * Math.PI) / 90;

  return [
    mean(columns) / 6,
    mean(rows) / 6,
    (Math.max(...columns) - Math.min(...columns)) / 6,
    (Math.max(...rows) - Math.min(...rows)) / 6,
    metrics.area / 3,
    metrics.perimeter / 10,
    metrics.compactness,
    metrics.spread / 1.25,
    Math.cos(orientation),
    Math.sin(orientation),
    convexHullSize(cells) / 6,
    distanceMean / 8.5,
    distanceDeviation / 4,
    Math.min(...distances) / 8.5,
    Math.max(...distances) / 8.5,
    orthogonal / 15,
    diagonal / 15,
    entropy(rowCounts) / Math.log(6),
    entropy(columnCounts) / Math.log(6),
  ];
}

/**
 * Finds past three-shape paths that resemble the current three-shape path and
 * clusters what followed them. This is intentionally independent from the
 * numerical baseline and never reads a draw after `index`.
 */
export function forecastBoardShapeTransitions(
  draws: readonly LottoDraw[],
  index: number,
): ShapeTransitionForecast {
  const known = draws.slice(0, index + 1);
  const states = known.map((draw) => boardShapeFeatures(draw.numbers));
  const currentFeatures = states.at(-1) ?? boardShapeFeatures([1, 8, 15, 22, 29, 36]);
  const currentPath = states.slice(-SEQUENCE_LENGTH);
  const neighbors: TransitionNeighbor[] = [];

  if (currentPath.length === SEQUENCE_LENGTH) {
    for (let pathEnd = SEQUENCE_LENGTH - 1; pathEnd < states.length - 1; pathEnd += 1) {
      const historicalPath = states.slice(pathEnd - SEQUENCE_LENGTH + 1, pathEnd + 1);
      const distance = pathDistance(historicalPath, currentPath);
      const recency = 0.72 + 0.28 * (pathEnd / Math.max(states.length - 2, 1));
      neighbors.push({
        distance,
        weight: recency / Math.max(distance, 0.035),
        next: states[pathEnd + 1]!,
      });
    }
  }

  const selected = neighbors
    .sort((left, right) => left.distance - right.distance)
    .slice(0, NEIGHBOR_COUNT);
  const scenarios = buildScenarios(selected, currentFeatures);
  const allDistance = mean(neighbors.map(({ distance }) => distance));
  const selectedDistance = mean(selected.map(({ distance }) => distance));
  const separation = clamp(
    (allDistance - selectedDistance) / Math.max(allDistance, 1e-9),
    0,
    1,
  );
  const support = Math.min(selected.length / NEIGHBOR_COUNT, 1);
  const concentration = Math.max(...scenarios.map(({ probability }) => probability));
  const confidence = clamp(
    separation * 0.65 + support * 0.2 + concentration * 0.15,
    0,
    1,
  );
  const combined = weightedMean(
    scenarios.map((scenario) => ({
      values: scenario.features,
      weight: scenario.probability,
    })),
  );

  return {
    currentFeatures,
    scenarios,
    neighbors: selected.length,
    confidence,
    metrics: metricsFromFeatures(combined),
  };
}

export function boardShapeDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  return Math.sqrt(
    mean(left.map((value, index) => (value - (right[index] ?? 0)) ** 2)),
  );
}

function pathDistance(
  historical: readonly (readonly number[])[],
  current: readonly (readonly number[])[],
): number {
  const frameWeights = [0.55, 0.85, 1.25];
  let total = 0;
  let weightTotal = 0;
  historical.forEach((state, frameIndex) => {
    const weight = frameWeights[frameIndex]!;
    total += boardShapeDistance(state, current[frameIndex]!) * weight;
    weightTotal += weight;
    if (frameIndex === 0) return;
    const historicalDelta = subtract(state, historical[frameIndex - 1]!);
    const currentDelta = subtract(current[frameIndex]!, current[frameIndex - 1]!);
    total += boardShapeDistance(historicalDelta, currentDelta) * 0.8;
    weightTotal += 0.8;
  });
  return total / weightTotal;
}

function buildScenarios(
  neighbors: readonly TransitionNeighbor[],
  fallback: readonly number[],
): ShapeTransitionScenario[] {
  if (neighbors.length === 0) {
    return [
      { features: [...fallback], probability: 1, support: 0, label: '현재 형태 유지' },
    ];
  }

  const clusterCount = Math.min(SCENARIO_COUNT, neighbors.length);
  const centers: number[][] = [[...neighbors[0]!.next]];
  while (centers.length < clusterCount) {
    const next = [...neighbors].sort((left, right) => {
      const leftDistance = Math.min(
        ...centers.map((center) => boardShapeDistance(left.next, center)),
      );
      const rightDistance = Math.min(
        ...centers.map((center) => boardShapeDistance(right.next, center)),
      );
      return rightDistance - leftDistance;
    })[0]!;
    centers.push([...next.next]);
  }

  let assignments = Array(neighbors.length).fill(0) as number[];
  for (let iteration = 0; iteration < 8; iteration += 1) {
    assignments = neighbors.map((neighbor) => nearestCenter(neighbor.next, centers));
    centers.forEach((_, clusterIndex) => {
      const members = neighbors.filter(
        (_neighbor, neighborIndex) => assignments[neighborIndex] === clusterIndex,
      );
      if (members.length === 0) return;
      centers[clusterIndex] = weightedMean(
        members.map((member) => ({ values: member.next, weight: member.weight })),
      );
    });
  }

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
  return centers
    .map((features, clusterIndex): ShapeTransitionScenario => {
      const members = neighbors.filter(
        (_neighbor, neighborIndex) => assignments[neighborIndex] === clusterIndex,
      );
      const weight = members.reduce((sum, member) => sum + member.weight, 0);
      return {
        features,
        probability: weight / Math.max(totalWeight, 1e-9),
        support: members.length,
        label: scenarioLabel(fallback, features),
      };
    })
    .filter(({ support }) => support > 0)
    .sort((left, right) => right.probability - left.probability);
}

function scenarioLabel(current: readonly number[], next: readonly number[]): string {
  const horizontal = next[0]! - current[0]!;
  const vertical = next[1]! - current[1]!;
  const spread = next[7]! - current[7]!;
  const movement = [
    Math.abs(horizontal) < 0.035 ? '' : horizontal > 0 ? '우측' : '좌측',
    Math.abs(vertical) < 0.035 ? '' : vertical > 0 ? '하단' : '상단',
  ].filter(Boolean);
  const scale = Math.abs(spread) < 0.035 ? '유지형' : spread > 0 ? '확장형' : '수축형';
  return `${movement.length > 0 ? `${movement.join('·')} 이동 · ` : ''}${scale}`;
}

function metricsFromFeatures(features: readonly number[]): ShapeMetrics {
  const orientation = (Math.atan2(features[9] ?? 0, features[8] ?? 1) * 90) / Math.PI;
  return {
    centroidX: (features[0]! * 2 - 1) * 0.86,
    centroidY: (features[1]! * 2 - 1) * 0.86,
    area: features[4]! * 3,
    perimeter: features[5]! * 10,
    compactness: features[6]!,
    spread: features[7]! * 1.25,
    orientation,
  };
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
  const half = (source: typeof sorted) => {
    const hull: typeof sorted = [];
    source.forEach((point) => {
      while (hull.length >= 2 && cross(hull.at(-2)!, hull.at(-1)!, point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    });
    return hull;
  };
  return Math.max(1, half(sorted).length + half([...sorted].reverse()).length - 2);
}

function entropy(counts: readonly number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return counts.reduce((value, count) => {
    if (count === 0) return value;
    const probability = count / total;
    return value - probability * Math.log(probability);
  }, 0);
}

function nearestCenter(
  values: readonly number[],
  centers: readonly number[][],
): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  centers.forEach((center, index) => {
    const distance = boardShapeDistance(values, center);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });
  return bestIndex;
}

function weightedMean(
  values: readonly { values: readonly number[]; weight: number }[],
): number[] {
  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0);
  return (values[0]?.values ?? []).map(
    (_, featureIndex) =>
      values.reduce(
        (sum, value) => sum + value.values[featureIndex]! * value.weight,
        0,
      ) / Math.max(totalWeight, 1e-9),
  );
}

function subtract(left: readonly number[], right: readonly number[]): number[] {
  return left.map((value, index) => value - right[index]!);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
