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

interface HeightGrid {
  config: TerrainConfig;
  base: TerrainConfig;
  heights: Float64Array;
}

const heightGrids = new WeakMap<TerrainConfig, HeightGrid>();

function sameHeightConfig(a: TerrainConfig, b: TerrainConfig): boolean {
  return (
    a.size === b.size &&
    a.segments === b.segments &&
    a.maxHeight === b.maxHeight &&
    a.seed === b.seed &&
    a.flatCenterRadius === b.flatCenterRadius &&
    a.flatCenterFeather === b.flatCenterFeather &&
    a.oasisX === b.oasisX &&
    a.oasisZ === b.oasisZ &&
    a.artRelief === b.artRelief
  );
}

function getHeightGrid(config: TerrainConfig): Float64Array {
  const base = DEFAULT_TERRAIN_CONFIG;
  let grid = heightGrids.get(config);
  if (
    !grid ||
    !sameHeightConfig(config, grid.config) ||
    !sameHeightConfig(base, grid.base)
  ) {
    grid = {
      config: { ...config },
      base: { ...base },
      heights: new Float64Array((config.segments + 1) ** 2).fill(NaN),
    };
    heightGrids.set(config, grid);
  }
  return grid.heights;
}

function gridHeight(
  heights: Float64Array | undefined,
  index: number,
  x: number,
  z: number,
  config: TerrainConfig,
): number {
  if (!heights) return sampleTerrainHeight(x, z, config);
  const cached = heights[index]!;
  if (!Number.isNaN(cached)) return cached;
  const height = sampleTerrainHeight(x, z, config);
  heights[index] = height;
  return height;
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
  // Whole-metre steps preserve identical shared coordinates between adjacent cells.
  // Fractional steps keep the original arithmetic and rounding for each cell.
  const heights =
    Number.isSafeInteger(config.size) &&
    Number.isInteger(step) &&
    step > 0 &&
    Number.isInteger(config.segments) &&
    config.segments >= 1 &&
    config.segments <= 256 &&
    Number.isFinite(ix) &&
    Number.isFinite(iz)
      ? getHeightGrid(config)
      : undefined;
  const stride = config.segments + 1;
  const index = iz * stride + ix;
  const a = gridHeight(heights, index, x0, z0, config);
  const b = gridHeight(heights, index + stride, x0, z0 + step, config);
  const d = gridHeight(heights, index + 1, x0 + step, z0, config);
  if (u + v <= 1) return a + u * (d - a) + v * (b - a);
  const c = gridHeight(heights, index + stride + 1, x0 + step, z0 + step, config);
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
