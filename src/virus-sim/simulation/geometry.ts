import { WORLD } from '../model/presets';
import type { Vec3 } from '../model/types';

export interface SurfaceContact {
  readonly point: Vec3;
  readonly normal: Vec3;
  readonly distance: number;
}

export function closestBacteriumSurface(position: Vec3): SurfaceContact {
  const axisX = clamp(
    position.x,
    -WORLD.bacteriumHalfLength,
    WORLD.bacteriumHalfLength,
  );
  const dx = position.x - axisX;
  const dy = position.y;
  const dz = position.z;
  const length = Math.hypot(dx, dy, dz);
  const normal =
    length > 1e-9
      ? { x: dx / length, y: dy / length, z: dz / length }
      : { x: 0, y: 1, z: 0 };

  return {
    point: {
      x: axisX + normal.x * WORLD.bacteriumRadius,
      y: normal.y * WORLD.bacteriumRadius,
      z: normal.z * WORLD.bacteriumRadius,
    },
    normal,
    distance: length - WORLD.bacteriumRadius,
  };
}

export function isInsideBacterium(position: Vec3, padding = 0): boolean {
  return closestBacteriumSurface(position).distance < padding;
}

export function reflectCoordinate(value: number, halfExtent: number): number {
  let reflected = value;
  while (reflected > halfExtent || reflected < -halfExtent) {
    if (reflected > halfExtent) reflected = halfExtent - (reflected - halfExtent);
    if (reflected < -halfExtent) reflected = -halfExtent + (-halfExtent - reflected);
  }
  return reflected;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
