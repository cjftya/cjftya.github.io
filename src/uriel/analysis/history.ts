import type {
  HistoryFrame,
  HistoryMode,
  LayoutMode,
  LottoDraw,
  WeightedDraw,
} from '../types';
import { pointForNumber } from './geometry';

const MAX_TRAILS = 52;

export function buildHistoryFrame(
  draws: readonly LottoDraw[],
  index: number,
  mode: HistoryMode,
  halfLife: number,
  layout: LayoutMode,
): HistoryFrame {
  const visible = draws.slice(0, index + 1);
  const current = visible.at(-1);

  if (current === undefined) {
    return {
      draws: [],
      trails: [],
      numberWeights: Array.from({ length: 46 }, () => 0),
      weightedCentroid: { x: 0, y: 0 },
    };
  }

  const weightedDraws = visible.map((draw, drawIndex): WeightedDraw => {
    const age = visible.length - drawIndex - 1;
    const weight =
      mode === 'independent'
        ? age === 0
          ? 1
          : 0
        : mode === 'cumulative'
          ? 1
          : Math.exp((-Math.LN2 * age) / halfLife);
    return { draw, weight };
  });
  const activeDraws = weightedDraws.filter(({ weight }) => weight > 0.001);
  const numberWeights = Array.from({ length: 46 }, () => 0);
  activeDraws.forEach(({ draw, weight }) => {
    draw.numbers.forEach((number) => {
      numberWeights[number] = (numberWeights[number] ?? 0) + weight;
    });
  });
  const maximum = Math.max(...numberWeights, 1);
  const normalizedWeights = numberWeights.map((weight) => weight / maximum);
  let totalWeight = 0;
  let centroidX = 0;
  let centroidY = 0;

  activeDraws.forEach(({ draw, weight }) => {
    draw.numbers.forEach((number) => {
      const point = pointForNumber(number, layout);
      centroidX += point.x * weight;
      centroidY += point.y * weight;
      totalWeight += weight;
    });
  });

  return {
    draws: activeDraws,
    trails: sampleTrails(activeDraws),
    numberWeights: normalizedWeights,
    weightedCentroid:
      totalWeight === 0
        ? { x: 0, y: 0 }
        : { x: centroidX / totalWeight, y: centroidY / totalWeight },
  };
}

function sampleTrails(draws: readonly WeightedDraw[]): WeightedDraw[] {
  if (draws.length <= MAX_TRAILS) {
    return [...draws];
  }

  const step = (draws.length - 1) / (MAX_TRAILS - 1);
  return Array.from({ length: MAX_TRAILS }, (_, index) => {
    const sourceIndex = Math.round(index * step);
    return draws[sourceIndex]!;
  });
}
