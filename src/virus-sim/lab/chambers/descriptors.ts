import type { ChamberKind, LabEnvironment, Vec3Tuple } from '../types';

export interface AxisAlignedBox {
  readonly id: string;
  readonly min: Vec3Tuple;
  readonly max: Vec3Tuple;
}

export interface ChamberDescriptor {
  readonly kind: ChamberKind;
  readonly bounds: AxisAlignedBox;
  readonly obstacles: readonly AxisAlignedBox[];
  readonly exitPlaneX: number | null;
  readonly appliedGapWidth: number;
}

const BOUNDS: AxisAlignedBox = {
  id: 'chamber-bounds',
  min: [-6, -3.2, -2.5],
  max: [6, 3.2, 2.5],
};

export function createChamberDescriptor(
  environment: LabEnvironment,
): ChamberDescriptor {
  if (environment.chamber === 'open') {
    return {
      kind: 'open',
      bounds: BOUNDS,
      obstacles: [],
      exitPlaneX: null,
      appliedGapWidth: environment.gapWidth,
    };
  }
  const gap = clamp(environment.gapWidth, 0.7, 4.2);
  const halfGap = gap / 2;
  const wallHalfThickness = 0.28;
  return {
    kind: 'obstacle',
    bounds: BOUNDS,
    obstacles: [
      {
        id: 'gate-lower',
        min: [-wallHalfThickness, BOUNDS.min[1], BOUNDS.min[2]],
        max: [wallHalfThickness, -halfGap, BOUNDS.max[2]],
      },
      {
        id: 'gate-upper',
        min: [-wallHalfThickness, halfGap, BOUNDS.min[2]],
        max: [wallHalfThickness, BOUNDS.max[1], BOUNDS.max[2]],
      },
    ],
    exitPlaneX: environment.flowDirection > 0 ? 5.25 : -5.25,
    appliedGapWidth: gap,
  };
}

export function isGapChangeSafe(
  environment: LabEnvironment,
  bodyRanges: readonly { readonly minY: number; readonly maxY: number }[],
): boolean {
  if (environment.chamber !== 'obstacle') return true;
  const halfGap = clamp(environment.gapWidth, 0.7, 4.2) / 2;
  return bodyRanges.every(
    (range) =>
      range.maxY <= -halfGap ||
      range.minY >= halfGap ||
      (range.minY >= -halfGap && range.maxY <= halfGap),
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
