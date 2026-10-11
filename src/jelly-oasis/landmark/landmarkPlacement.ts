import { samplePatchedTerrain } from '../terrain/terrainSampling';
import { sampleTerrainHeight, DEFAULT_TERRAIN_CONFIG } from '../terrain/heightfield';
import type { TerrainConfig } from '../terrain/heightfield';
import type { LandmarkPlacement } from './landmarkConfig';

export function landmarkWorldPoint(x: number, z: number, placement: LandmarkPlacement) {
  const c = Math.cos(placement.rotationY),
    s = Math.sin(placement.rotationY);
  return {
    x: placement.position.x + (x * c + z * s) * placement.scale,
    z: placement.position.z + (-x * s + z * c) * placement.scale,
  };
}

/** Interpolate the actual terrain triangles, not just the analytic heightfield.
 * This avoids small hovering seams between the terrain's four-metre vertices. */
export function sampleGround(
  x: number,
  z: number,
  config: TerrainConfig = DEFAULT_TERRAIN_CONFIG,
): number {
  const patched = samplePatchedTerrain(x, z, config);
  if (patched !== undefined) return patched;
  return sampleOriginalGround(x, z, config);
}

export function sampleOriginalGround(
  x: number,
  z: number,
  config: TerrainConfig = DEFAULT_TERRAIN_CONFIG,
): number {
  const step = config.size / config.segments,
    half = config.size / 2;
  const ix = Math.max(0, Math.min(config.segments - 1, Math.floor((x + half) / step)));
  const iz = Math.max(0, Math.min(config.segments - 1, Math.floor((z + half) / step)));
  const x0 = ix * step - half,
    z0 = iz * step - half;
  const u = Math.max(0, Math.min(1, (x - x0) / step));
  const v = Math.max(0, Math.min(1, (z - z0) / step));
  const a = sampleTerrainHeight(x0, z0, config);
  const b = sampleTerrainHeight(x0, z0 + step, config);
  const d = sampleTerrainHeight(x0 + step, z0, config);
  if (u + v <= 1) return a + u * (d - a) + v * (b - a);
  const c = sampleTerrainHeight(x0 + step, z0 + step, config);
  return c + (1 - u) * (b - c) + (1 - v) * (d - c);
}

export function surveySite(
  placement: LandmarkPlacement,
  config = DEFAULT_TERRAIN_CONFIG,
) {
  const heights: number[] = [],
    shore: number[] = [];
  let insideWorld = true,
    meadowSamples = 0;
  for (let x = -40; x <= 40; x += 4) {
    for (let z = -38; z <= 38; z += 4) {
      const p = landmarkWorldPoint(x, z, placement);
      insideWorld &&= Math.max(Math.abs(p.x), Math.abs(p.z)) <= config.size / 2;
      if (Math.hypot(p.x, p.z) < config.flatCenterRadius) meadowSamples++;
      heights.push(sampleGround(p.x, p.z, config));
    }
  }
  for (let i = 0; i < 48; i++) {
    const a = (i * Math.PI) / 24;
    const p = landmarkWorldPoint(12 * Math.cos(a), 7 + 10 * Math.sin(a), placement);
    shore.push(sampleGround(p.x, p.z, config));
  }
  return {
    relief: Math.max(...heights) - Math.min(...heights),
    pondRelief: Math.max(...shore) - Math.min(...shore),
    insideWorld,
    meadowOverlap: meadowSamples / heights.length,
    worldAreaFraction: (80 * 76 * placement.scale ** 2) / config.size ** 2,
  };
}
