import { landscapeRelief } from './landscapeRelief';
/** World coordinates are metres; mesh density and landmark scale remain independent. */
export interface TerrainConfig {
  size: number;
  segments: number;
  maxHeight: number;
  seed: number;
  flatCenterRadius: number;
  flatCenterFeather: number;
  /** Compact layout anchor; both coordinates must be supplied together. */
  oasisX?: number;
  oasisZ?: number;
  /** 0: legacy, 1: amphitheatre, 2: canyon inspection. */
  artRelief?: number;
  /** Radius of the faceted outer corners; omitted for the legacy square. */
  cornerRadius?: number;
}
export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  size: 320,
  segments: 80,
  maxHeight: 26,
  seed: 0x4a4f5953,
  flatCenterRadius: 42,
  flatCenterFeather: 54,
};
export function smoothstep(low: number, high: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}
function mound(
  x: number,
  z: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
): number {
  return 1 - smoothstep(0, 1, Math.hypot((x - cx) / rx, (z - cz) / rz));
}
export function sampleTerrainHeight(
  x: number,
  z: number,
  config = DEFAULT_TERRAIN_CONFIG,
): number {
  if (config.oasisX !== undefined && config.oasisZ !== undefined) {
    const dx = x - config.oasisX,
      dz = z - config.oasisZ;
    // Translate the approved oasis ground without scaling it. Multiples of four
    // preserve the old triangle grid and diagonal, including excavation samples.
    const preserved = sampleTerrainHeight(dx + 70, dz + 58, DEFAULT_TERRAIN_CONFIG);
    const { oasisX: _x, oasisZ: _z, ...outer } = config;
    void _x;
    void _z;
    const blend = smoothstep(60, 80, Math.hypot(dx, dz));
    // The old northern mound and added ridge used to stack into a single wall.
    // Lower only that outer foundation; the lake/ruin reservation stays exact.
    const outerHeight =
      sampleTerrainHeight(x, z, outer) *
      (config.artRelief === 1
        ? 1 -
          0.45 *
            (1 - smoothstep(-5, 20, z)) *
            (1 -
              smoothstep(
                config.size / 2 - 12,
                config.size / 2,
                Math.max(Math.abs(x), Math.abs(z)),
              ))
        : 1);
    return (
      preserved * (1 - blend) +
      outerHeight * blend +
      landscapeRelief(x, z, config.size, config.artRelief ?? 0)
    );
  }
  const u = x / config.size;
  const v = z / config.size;
  const north = mound(u, v, 0.03, -0.35, 0.48, 0.28);
  const west = mound(u, v, -0.35, -0.07, 0.22, 0.42);
  const east = mound(u, v, 0.38, -0.16, 0.21, 0.3);
  const basin = mound(u, v, 0.23, 0.2, 0.17, 0.18);
  const south = mound(u, v, -0.21, 0.36, 0.31, 0.2);
  const centerBlend = smoothstep(
    config.flatCenterRadius,
    config.flatCenterRadius + config.flatCenterFeather,
    Math.hypot(x, z),
  );
  // Low-frequency seeded undulation only, with no fine noise.
  const phase = (((config.seed >>> 0) % 65521) / 65521) * Math.PI * 2;
  const undulation = Math.sin(u * 15 + phase) * Math.cos(v * 12 - phase) * 0.035;
  return (
    config.maxHeight *
    ((north * 1.05 + west * 0.68 + east * 0.5 + south * 0.25 + undulation) *
      centerBlend -
      basin * 0.23)
  );
}
export function validateTerrainConfig(config: TerrainConfig): void {
  if (
    !Object.values(config).every(Number.isFinite) ||
    (config.oasisX === undefined) !== (config.oasisZ === undefined) ||
    config.size <= 0 ||
    (config.cornerRadius ?? 0) < 0 ||
    (config.cornerRadius ?? 0) >= config.size / 2 ||
    !Number.isInteger(config.segments) ||
    config.segments < 1 ||
    config.segments > 256 ||
    config.maxHeight <= 0 ||
    config.flatCenterRadius < 0 ||
    config.flatCenterFeather <= 0
  ) {
    throw new Error(
      'Invalid terrain configuration. Segments must be an integer between 1 and 256.',
    );
  }
}
