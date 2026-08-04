import type { LayoutMode, LottoDraw, NumberPoint, ShapeMetrics } from '../types';

const CIRCLE_RADIUS = 0.88;
const BOARD_RADIUS = 0.86;

export function pointForNumber(number: number, layout: LayoutMode): NumberPoint {
  if (layout === 'circle') {
    const angle = -Math.PI / 2 + ((number - 1) / 45) * Math.PI * 2;
    return {
      number,
      x: Math.cos(angle) * CIRCLE_RADIUS,
      y: Math.sin(angle) * CIRCLE_RADIUS,
    };
  }

  const index = number - 1;
  const column = index % 7;
  const row = Math.floor(index / 7);
  return {
    number,
    x: ((column - 3) / 3) * BOARD_RADIUS,
    y: ((row - 3) / 3) * BOARD_RADIUS,
  };
}

export function pointsForNumbers(
  numbers: readonly number[],
  layout: LayoutMode,
): NumberPoint[] {
  const points = numbers.map((number) => pointForNumber(number, layout));
  return orderAroundCentroid(points);
}

export function metricsForDraw(draw: LottoDraw, layout: LayoutMode): ShapeMetrics {
  return metricsForNumbers(draw.numbers, layout);
}

export function metricsForNumbers(
  numbers: readonly number[],
  layout: LayoutMode,
): ShapeMetrics {
  const points = pointsForNumbers(numbers, layout);
  const centroid = meanPoint(points);
  let twiceArea = 0;
  let perimeter = 0;

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]!;
    twiceArea += point.x * next.y - next.x * point.y;
    perimeter += Math.hypot(next.x - point.x, next.y - point.y);
  });

  const area = Math.abs(twiceArea) / 2;
  const spread =
    points.reduce(
      (sum, point) => sum + Math.hypot(point.x - centroid.x, point.y - centroid.y),
      0,
    ) / points.length;
  const covariance = points.reduce(
    (value, point) => {
      const dx = point.x - centroid.x;
      const dy = point.y - centroid.y;
      value.xx += dx * dx;
      value.yy += dy * dy;
      value.xy += dx * dy;
      return value;
    },
    { xx: 0, yy: 0, xy: 0 },
  );
  const orientationRadians =
    0.5 * Math.atan2(2 * covariance.xy, covariance.xx - covariance.yy);

  return {
    centroidX: centroid.x,
    centroidY: centroid.y,
    area,
    perimeter,
    compactness: perimeter === 0 ? 0 : (4 * Math.PI * area) / perimeter ** 2,
    spread,
    orientation: (orientationRadians * 180) / Math.PI,
  };
}

export function meanPoint(points: readonly NumberPoint[]): { x: number; y: number } {
  const total = points.reduce(
    (value, point) => ({ x: value.x + point.x, y: value.y + point.y }),
    { x: 0, y: 0 },
  );

  return { x: total.x / points.length, y: total.y / points.length };
}

function orderAroundCentroid(points: readonly NumberPoint[]): NumberPoint[] {
  const centroid = meanPoint(points);
  return [...points].sort(
    (left, right) =>
      Math.atan2(left.y - centroid.y, left.x - centroid.x) -
      Math.atan2(right.y - centroid.y, right.x - centroid.x),
  );
}
