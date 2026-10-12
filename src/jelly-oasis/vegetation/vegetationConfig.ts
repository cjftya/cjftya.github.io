export const VEGETATION_SEED = 0x0a515202;
export const VEGETATION_KINDS = ['grass', 'shrub', 'flower'] as const;
export type VegetationKind = (typeof VEGETATION_KINDS)[number];
export type VegetationDensity = 'density-a' | 'density-b' | 'off';
export const VEGETATION_COUNTS = {
  'density-a': { grass: 120, shrub: 24, flower: 36 },
  'density-b': { grass: 210, shrub: 36, flower: 54 },
  off: { grass: 0, shrub: 0, flower: 0 },
};
// Radius encloses the entire source geometry, including its largest scale.
export const VEGETATION_SHAPES = {
  grass: { radius: 0.28, minScale: 0.65, maxScale: 1.25, slope: 0.38 },
  shrub: { radius: 0.63, minScale: 0.7, maxScale: 1.2, slope: 0.25 },
  flower: { radius: 0.22, minScale: 0.75, maxScale: 1.25, slope: 0.32 },
};
export function selectVegetation(
  debug: boolean,
  query: string | null,
): VegetationDensity {
  return debug && (query === 'off' || query === 'density-b') ? query : 'density-a';
}
