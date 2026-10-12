export const MEADOW_SEED = 0x03671012;
export const MEADOW_KINDS = ['lilac', 'cream', 'grass', 'shrub'] as const;
export type MeadowKind = (typeof MEADOW_KINDS)[number];
export type MeadowVariant = 'off' | 'a' | 'b';
// Fractions of the adopted stage width: three separated foreground patches,
// with sparse woodland/highland transitions. Central oasis corridors stay open.
export const MEADOW_PATCHES = [
  { id: 'southwest-lilac', center: [-0.125, 0.2], radius: 3.3, counts: [29, 7, 9, 2] },
  { id: 'south-cream', center: [0.2, 0.245], radius: 3.2, counts: [6, 24, 9, 2] },
  { id: 'southeast-lilac', center: [0.27, 0.16], radius: 3, counts: [19, 5, 7, 1] },
  { id: 'west-edge', center: [-0.23, 0.15], radius: 3, counts: [2, 0, 5, 2] },
  { id: 'north-rock-edge', center: [0.26, -0.3], radius: 3, counts: [0, 0, 5, 1] },
  { id: 'northwest-edge', center: [-0.2, -0.02], radius: 3, counts: [1, 1, 4, 1] },
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
