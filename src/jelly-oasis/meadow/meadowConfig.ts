export const MEADOW_SEED = 0x03671012;
export const MEADOW_KINDS = ['lilac', 'cream', 'grass', 'shrub'] as const;
export type MeadowKind = (typeof MEADOW_KINDS)[number];
export type MeadowVariant = 'off' | 'a' | 'b';
// Broad connected foreground colour fields, separated by the protected entry corridor.
export const MEADOW_PATCHES = [
  {
    id: 'southwest-lilac',
    center: [-0.25, 0.22],
    radius: 28,
    counts: [85, 15, 35, 12],
  },
  { id: 'south-cream', center: [0.08, 0.35], radius: 34, counts: [15, 90, 35, 14] },
  { id: 'southeast-lilac', center: [0.31, 0.22], radius: 26, counts: [75, 15, 30, 10] },
] as const;
export const MEADOW_SHAPES = {
  lilac: { radius: 0.58, slope: 0.28 },
  cream: { radius: 0.58, slope: 0.28 },
  grass: { radius: 0.18, slope: 0.3 },
  shrub: { radius: 0.53, slope: 0.26 },
};
export function selectMeadow(debug: boolean, query: string | null): MeadowVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
