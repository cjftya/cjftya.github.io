import type { ScannerAxis } from '../observation/types';

export interface SlabRange {
  readonly minimum: number;
  readonly maximum: number;
  readonly center: number;
  readonly halfThickness: number;
}

export function normalizedSlabRange(
  minimum: number,
  maximum: number,
  normalizedPosition: number,
  normalizedThickness: number,
): SlabRange {
  const low = Math.min(minimum, maximum);
  const high = Math.max(minimum, maximum);
  const span = Math.max(0.001, high - low);
  const position = clamp(normalizedPosition, 0, 1);
  const halfThickness = Math.max(
    span * clamp(normalizedThickness, 0.001, 1) * 0.5,
    span * 0.003,
  );
  return {
    minimum: low,
    maximum: high,
    center: low + span * position,
    halfThickness,
  };
}

export function axisComponents(axis: ScannerAxis): readonly [number, number, number] {
  return axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
