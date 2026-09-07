import { combinationPoints, type GridPoint } from './grid';
import type { ShapeConfig } from './config';

export const RADII = [1, 1.5, 2, 2.5, 3] as const;
export const SHAPE_FEATURE_NAMES: readonly string[] = [
  'distance_min',
  'distance_max',
  'distance_mean',
  'distance_median',
  'distance_std',
  'nearest_mean',
  'nearest_max',
  ...RADII.flatMap((r) => [`components_r${r}`, `largest_r${r}`, `edges_r${r}`]),
  ...Array.from({ length: 6 }, (_, i) => `cluster_size_${i + 1}_r2`),
  'isolated_r2',
  'within_cluster_distance_r2',
  'between_cluster_distance_r2',
  'cluster_centroid_distance_r2',
];

export interface GraphProfile {
  radius: number;
  components: readonly (readonly number[])[];
  clusterSizes: readonly number[];
  isolated: number;
  edges: number;
  averageDegree: number;
  density: number;
}

export function pairMatrix(
  points: readonly GridPoint[],
  metric: ShapeConfig['metric'],
): number[][] {
  return points.map((a) =>
    points.map((b) =>
      metric === 'manhattan'
        ? Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
        : Math.hypot(a.x - b.x, a.y - b.y),
    ),
  );
}

export function graphProfile(
  matrix: readonly (readonly number[])[],
  radius: number,
): GraphProfile {
  const seen = new Set<number>();
  const components: number[][] = [];
  let edges = 0;
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) if (matrix[i]![j]! <= radius) edges++;
    if (seen.has(i)) continue;
    const component = [i];
    seen.add(i);
    for (let cursor = 0; cursor < component.length; cursor++) {
      const node = component[cursor]!;
      for (let j = 0; j < 6; j++) {
        if (!seen.has(j) && matrix[node]![j]! <= radius) {
          seen.add(j);
          component.push(j);
        }
      }
    }
    components.push(component);
  }
  const clusterSizes = components.map((c) => c.length).sort((a, b) => b - a);
  return {
    radius,
    components,
    clusterSizes,
    isolated: clusterSizes.filter((s) => s === 1).length,
    edges,
    averageDegree: edges / 3,
    density: edges / 15,
  };
}

/** 32 structural dimensions. No coordinates, number identity or historical frequency. */
export function shapeSignature(
  numbers: readonly number[],
  metric: ShapeConfig['metric'] = 'euclidean',
): number[] {
  return signatureFromPoints(combinationPoints(numbers), metric);
}

/** Relative features are translation and D4 invariant; no invalid-cell rotation is sampled. */
export function signatureFromPoints(
  points: readonly GridPoint[],
  metric: ShapeConfig['metric'] = 'euclidean',
): number[] {
  if (
    points.length !== 6 ||
    points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
  ) {
    throw new Error('유한 좌표 6개가 필요해요.');
  }
  const matrix = pairMatrix(points, metric);
  const distances: number[] = [];
  const nearest = matrix.map((row, i) => Math.min(...row.filter((_, j) => i !== j)));
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++) distances.push(matrix[i]![j]!);
  distances.sort((a, b) => a - b);
  const mean = average(distances);
  const profiles = RADII.map((r) => graphProfile(matrix, r));
  const clusters = profiles[2]!;
  const membership = Array<number>(6);
  clusters.components.forEach((component, id) =>
    component.forEach((i) => {
      membership[i] = id;
    }),
  );
  const within: number[] = [],
    between: number[] = [];
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++) {
      (membership[i] === membership[j] ? within : between).push(matrix[i]![j]!);
    }
  const centroids = clusters.components.map((c) => ({
    x: average(c.map((i) => points[i]!.x)),
    y: average(c.map((i) => points[i]!.y)),
  }));
  const centroidDistances: number[] = [];
  for (let i = 0; i < centroids.length; i++)
    for (let j = i + 1; j < centroids.length; j++) {
      const a = centroids[i]!,
        b = centroids[j]!;
      centroidDistances.push(
        metric === 'euclidean'
          ? Math.hypot(a.x - b.x, a.y - b.y)
          : Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
      );
    }
  return [
    distances[0]!,
    distances[14]!,
    mean,
    distances[7]!,
    Math.sqrt(average(distances.map((d) => (d - mean) ** 2))),
    average(nearest),
    Math.max(...nearest),
    ...profiles.flatMap((p) => [p.components.length, p.clusterSizes[0]!, p.edges]),
    ...Array.from({ length: 6 }, (_, i) => clusters.clusterSizes[i] ?? 0),
    clusters.isolated,
    average(within),
    average(between),
    average(centroidDistances),
  ];
}

function average(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
}
