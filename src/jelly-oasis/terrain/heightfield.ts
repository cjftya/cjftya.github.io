/** World size and mesh density are independent; landmarks use normalized coordinates. */
export interface TerrainConfig {
  size: number;
  segments: number;
  maxHeight: number;
  seed: number;
  flatCenterRadius: number;
  flatCenterFeather: number;
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
    config.size <= 0 ||
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
