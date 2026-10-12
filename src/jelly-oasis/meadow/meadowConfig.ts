export const MEADOW_SEED = 0x03671012;
export const MEADOW_KINDS = ['lilac', 'cream', 'grass', 'shrub'] as const;
export type MeadowKind = (typeof MEADOW_KINDS)[number];
export type MeadowVariant = 'off' | 'a' | 'b';
// Broad connected foreground colour fields, separated by the protected entry corridor.
export const MEADOW_PATCHES = [
  {
    id: 'southwest-lilac',
    center: [-0.22, 0.3],
    radius: 21,
    counts: [210, 35, 90, 12],
  },
  { id: 'south-cream', center: [0.16, 0.31], radius: 22, counts: [35, 230, 100, 14] },
  {
    id: 'southeast-lilac',
    center: [0.31, 0.24],
    radius: 19,
    counts: [190, 30, 85, 10],
  },
] as const;
export const MEADOW_SHAPES = {
  lilac: { radius: 0.29, slope: 0.28 },
  cream: { radius: 0.29, slope: 0.28 },
  grass: { radius: 0.18, slope: 0.3 },
  shrub: { radius: 0.53, slope: 0.26 },
};
export function selectMeadow(debug: boolean, query: string | null): MeadowVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
