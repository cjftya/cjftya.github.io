import type { ObservationVec3 } from './types';

export function calculateExplodedPosition(
  origin: ObservationVec3,
  direction: ObservationVec3,
  amount: number,
  distance: number,
): ObservationVec3 {
  const normalized = Math.min(1, Math.max(0, amount));
  return {
    x: origin.x + direction.x * normalized * distance,
    y: origin.y + direction.y * normalized * distance,
    z: origin.z + direction.z * normalized * distance,
  };
}
