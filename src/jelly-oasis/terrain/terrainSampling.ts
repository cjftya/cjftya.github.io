import type { TerrainConfig } from './heightfield';
// Scoped to one terrain configuration: geometry and queries share one surface.
const surfaces = new WeakMap<
  TerrainConfig,
  (x: number, z: number) => number | undefined
>();
export function setTerrainSampler(
  config: TerrainConfig,
  sample?: (x: number, z: number) => number | undefined,
) {
  if (sample) surfaces.set(config, sample);
  else surfaces.delete(config);
}
export function samplePatchedTerrain(x: number, z: number, config: TerrainConfig) {
  return surfaces.get(config)?.(x, z);
}
