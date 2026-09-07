import type { LottoDraw } from '../../../types';
import { resolveShapeConfig, type ShapeConfig } from './config';
import { shapeSignature, SHAPE_FEATURE_NAMES } from './signature';

export interface ShapeHistoryRow {
  round: number;
  signature: readonly number[];
}
export interface ShapeForecast {
  config: ShapeConfig;
  trainedThrough: number;
  trainingSamples: number;
  neighborSuccessorRounds: readonly number[];
  neighborDistances: readonly number[];
  mean: readonly number[];
  scale: readonly number[];
  target: readonly number[];
  unconditionalTarget: readonly number[];
}

export function buildShapeHistory(
  draws: readonly LottoDraw[],
  metric: ShapeConfig['metric'] = 'euclidean',
): ShapeHistoryRow[] {
  return draws.map((draw, index) => {
    if (
      !Number.isInteger(draw.round) ||
      draw.round < 1 ||
      (index > 0 && draw.round !== draws[index - 1]!.round + 1)
    ) {
      throw new Error('Shape 상태 전이에는 누락·중복 없는 오름차순 회차가 필요해요.');
    }
    return { round: draw.round, signature: shapeSignature(draw.numbers, metric) };
  });
}

/** Caller supplies only known history; the query and every neighbor successor are disjoint. */
export function forecastShape(
  history: readonly ShapeHistoryRow[],
  requested: Partial<ShapeConfig> = {},
): ShapeForecast {
  const config = resolveShapeConfig(requested);
  const rows =
    config.trainingWindow > 0 ? history.slice(-config.trainingWindow) : history;
  if (rows.length < 60)
    throw new Error('Shape Core에는 최소 60회 학습 기록이 필요해요.');
  const dimensions = SHAPE_FEATURE_NAMES.length;
  const mean = Array<number>(dimensions).fill(0),
    scale = Array<number>(dimensions).fill(0);
  for (const row of rows)
    for (let f = 0; f < dimensions; f++) mean[f]! += row.signature[f]! / rows.length;
  for (const row of rows)
    for (let f = 0; f < dimensions; f++)
      scale[f]! += (row.signature[f]! - mean[f]!) ** 2 / rows.length;
  for (let f = 0; f < dimensions; f++) scale[f] = Math.sqrt(scale[f]!) || 1;
  const normalized = rows.map((row) =>
    row.signature.map((v, f) => (v - mean[f]!) / scale[f]!),
  );
  const queryStart = rows.length - config.stateWindow;
  const neighbors: { end: number; distance: number }[] = [];
  for (let end = config.stateWindow - 1; end + 1 < queryStart; end++) {
    let distance = 0;
    for (let lag = 0; lag < config.stateWindow; lag++) {
      const a = normalized[end - lag]!,
        b = normalized[rows.length - 1 - lag]!;
      for (let f = 0; f < dimensions; f++) distance += (a[f]! - b[f]!) ** 2;
    }
    neighbors.push({ end, distance: distance / (dimensions * config.stateWindow) });
  }
  neighbors.sort((a, b) => a.distance - b.distance || a.end - b.end);
  const nearest = neighbors.slice(0, config.neighbors);
  const target = Array<number>(dimensions).fill(0);
  for (const { end } of nearest)
    for (let f = 0; f < dimensions; f++) {
      target[f]! += normalized[end + 1]![f]! / nearest.length;
    }
  return {
    config,
    trainedThrough: rows.at(-1)!.round,
    trainingSamples: rows.length,
    neighborSuccessorRounds: nearest.map(({ end }) => rows[end + 1]!.round),
    neighborDistances: nearest.map((n) => n.distance),
    mean,
    scale,
    target,
    unconditionalTarget: Array<number>(dimensions).fill(0),
  };
}

export function forecastDistance(
  signature: readonly number[],
  forecast: ShapeForecast,
  unconditional = false,
): number {
  const target = unconditional ? forecast.unconditionalTarget : forecast.target;
  let distance = 0;
  for (let f = 0; f < target.length; f++) {
    distance +=
      ((signature[f]! - forecast.mean[f]!) / forecast.scale[f]! - target[f]!) ** 2;
  }
  return distance / target.length;
}
