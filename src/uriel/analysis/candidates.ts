import type { Candidate, LayoutMode, LottoDraw, ShapeMetrics } from '../types';
import { metricsForDraw, metricsForNumbers } from './geometry';

const SAMPLE_COUNT = 12000;
const TARGET_HISTORY = 24;

export function findShapeCandidates(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count = 6,
): { candidates: Candidate[]; target: ShapeMetrics } {
  const target = estimateNextMetrics(draws, index, layout);
  const random = createRandom((draws[index]?.round ?? index + 1) * 2654435761);
  const candidates: Candidate[] = [];

  for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
    const numbers = randomNumbers(random);
    const metrics = metricsForNumbers(numbers, layout);
    const score = metricDistance(metrics, target);

    if (candidates.length < count || score < candidates.at(-1)!.score) {
      candidates.push({ numbers, metrics, score });
      candidates.sort((left, right) => left.score - right.score);
      candidates.length = Math.min(candidates.length, count);
    }
  }

  return { candidates, target };
}

export function estimateNextMetrics(
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
): ShapeMetrics {
  const start = Math.max(0, index - TARGET_HISTORY + 1);
  const recent = draws
    .slice(start, index + 1)
    .map((draw) => metricsForDraw(draw, layout));

  if (recent.length === 0) {
    return zeroMetrics();
  }

  const weightTotal = recent.reduce((sum, _, metricIndex) => sum + metricIndex + 1, 0);
  const weighted = recent.reduce((target, metrics, metricIndex) => {
    const weight = (metricIndex + 1) / weightTotal;
    target.centroidX += metrics.centroidX * weight;
    target.centroidY += metrics.centroidY * weight;
    target.area += metrics.area * weight;
    target.perimeter += metrics.perimeter * weight;
    target.compactness += metrics.compactness * weight;
    target.spread += metrics.spread * weight;
    target.orientation += metrics.orientation * weight;
    return target;
  }, zeroMetrics());
  const latest = recent.at(-1)!;
  const previous = recent.at(-2) ?? latest;
  const trend = 0.18;

  return {
    centroidX: clamp(
      weighted.centroidX + (latest.centroidX - previous.centroidX) * trend,
      -1,
      1,
    ),
    centroidY: clamp(
      weighted.centroidY + (latest.centroidY - previous.centroidY) * trend,
      -1,
      1,
    ),
    area: Math.max(0, weighted.area + (latest.area - previous.area) * trend),
    perimeter: Math.max(
      0,
      weighted.perimeter + (latest.perimeter - previous.perimeter) * trend,
    ),
    compactness: clamp(
      weighted.compactness + (latest.compactness - previous.compactness) * trend,
      0,
      1,
    ),
    spread: Math.max(0, weighted.spread + (latest.spread - previous.spread) * trend),
    orientation: clamp(
      weighted.orientation +
        shortestAngle(latest.orientation - previous.orientation) * trend,
      -90,
      90,
    ),
  };
}

function metricDistance(metrics: ShapeMetrics, target: ShapeMetrics): number {
  const orientationDifference =
    shortestAngle(metrics.orientation - target.orientation) / 90;
  return Math.sqrt(
    ((metrics.centroidX - target.centroidX) / 0.55) ** 2 +
      ((metrics.centroidY - target.centroidY) / 0.55) ** 2 +
      ((metrics.area - target.area) / 0.75) ** 2 +
      ((metrics.compactness - target.compactness) / 0.28) ** 2 +
      ((metrics.spread - target.spread) / 0.35) ** 2 +
      orientationDifference ** 2 * 0.35,
  );
}

function randomNumbers(random: () => number): number[] {
  const values = new Set<number>();
  while (values.size < 6) {
    values.add(1 + Math.floor(random() * 45));
  }
  return [...values].sort((left, right) => left - right);
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function shortestAngle(angle: number): number {
  let value = angle;
  while (value > 90) value -= 180;
  while (value < -90) value += 180;
  return value;
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
