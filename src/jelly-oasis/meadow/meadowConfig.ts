export const MEADOW_SEED = 0x03671012;
export const MEADOW_KINDS = ['lilac', 'cream', 'grass', 'shrub'] as const;
export type MeadowKind = (typeof MEADOW_KINDS)[number];
export type MeadowVariant = 'off' | 'a' | 'b';
// Broad connected foreground colour fields, separated by the protected entry corridor.
export const MEADOW_PATCHES = [
  {
    id: 'southwest-lilac',
    center: [-0.18, 0.27],
    radius: 25,
    counts: [60, 12, 30, 18],
  },
  { id: 'south-cream', center: [0.08, 0.35], radius: 28, counts: [10, 55, 30, 16] },
  { id: 'southeast-lilac', center: [0.28, 0.2], radius: 26, counts: [50, 12, 25, 18] },
  { id: 'west-understory', center: [-0.18, 0.06], radius: 24, counts: [10, 4, 12, 14] },
  { id: 'east-understory', center: [0.24, -0.06], radius: 25, counts: [8, 6, 12, 14] },
] as const;
export const MEADOW_SHAPES = {
  lilac: { radius: 0.58, slope: 0.28 },
  cream: { radius: 0.58, slope: 0.28 },
  grass: { radius: 0.18, slope: 0.3 },
  shrub: { radius: 1.65, slope: 0.42 },
};
export function selectMeadow(debug: boolean, query: string | null): MeadowVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
