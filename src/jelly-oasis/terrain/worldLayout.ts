import { DEFAULT_TERRAIN_CONFIG } from './heightfield';
import type { TerrainConfig } from './heightfield';
import { OVERGROWN_RUIN_CONFIG } from '../landmark/landmarkConfig';

// A single production layout. Other sizes are opt-in inspection fixtures only.
export const FINAL_TERRAIN_SIZE = 224;
export function selectWorldSize(debug: boolean, query: string | null): number {
  return debug && ['320', '224', '192'].includes(query ?? '')
    ? Number(query)
    : FINAL_TERRAIN_SIZE;
}
export function createWorldConfig(
  size = FINAL_TERRAIN_SIZE,
  artRelief = 1,
): TerrainConfig {
  if (![320, 224, 192].includes(size)) throw new Error('Unsupported world size');
  return size === 320
    ? { ...DEFAULT_TERRAIN_CONFIG }
    : {
        ...DEFAULT_TERRAIN_CONFIG,
        size,
        segments: size / 4,
        oasisX: 14,
        oasisZ: 14,
        artRelief,
      };
}
export function worldLandmarkPlacement(config: TerrainConfig) {
  return {
    ...OVERGROWN_RUIN_CONFIG,
    position: {
      x: config.oasisX ?? OVERGROWN_RUIN_CONFIG.position.x,
      z: config.oasisZ ?? OVERGROWN_RUIN_CONFIG.position.z,
    },
  };
}
