import { MathUtils } from 'three';
import { sampleSeededNoise } from './seededNoise';

export const SURFACE_PATTERN_COUNT = 5;

export function getSurfacePatternIndex(seed: number): number {
  return Math.abs(seed) % SURFACE_PATTERN_COUNT;
}

export function sampleSurfacePattern(
  normalX: number,
  normalY: number,
  normalZ: number,
  seed: number,
): number {
  const detail = sampleSeededNoise(
    normalX * 3.4,
    normalY * 3.4,
    normalZ * 3.4,
    seed + 211,
  );
  const broad = sampleSeededNoise(
    normalX * 1.35,
    normalY * 1.35,
    normalZ * 1.35,
    seed + 431,
  );
  let pattern: number;

  switch (getSurfacePatternIndex(seed)) {
    case 0:
      pattern = Math.sin(normalY * 18 + broad * 2.8);
      break;
    case 1:
      pattern = Math.sin((normalX + normalZ * 0.72) * 8 + broad * 7);
      break;
    case 2:
      pattern = Math.pow(Math.abs(normalY), 2.2) * 2 - 0.72 + (detail - 0.5) * 0.4;
      break;
    case 3:
      pattern = Math.sin(normalY * 13 + normalX * 4.5 + detail * 4.2);
      break;
    default:
      pattern = (broad * 0.62 + detail * 0.38 - 0.5) * 2;
      break;
  }

  return MathUtils.clamp(pattern * 0.76 + (detail - 0.5) * 0.48, -1, 1);
}
