import type { VegetationKind } from '../vegetation/vegetationConfig';
export const COMPOSITION_SEED = 0x0c051710;
export const COMPOSITION_KINDS = ['rock', 'grass', 'shrub', 'flower'] as const;
export type CompositionKind = 'rock' | VegetationKind;
export type CompositionVariant = 'off' | 'a' | 'b';
export interface CompositionZone {
  id: string;
  basis: 'landmark-local' | 'world';
  centers: readonly (readonly [number, number])[];
  radius: number;
  counts: Record<CompositionKind, number>;
  slope: number;
  intent: string;
}
// Sparse, asymmetric patches. Paths and shoreline remain controlled by the shared mask.
export const COMPOSITION_ZONES: readonly CompositionZone[] = [
  {
    id: 'shore-transition',
    basis: 'landmark-local',
    centers: [
      [-17, 7],
      [-15, 16],
    ],
    radius: 3.5,
    counts: { rock: 5, grass: 12, shrub: 2, flower: 4 },
    slope: 0.22,
    intent: 'Low shore transition; preserve the water foreground',
  },
  {
    id: 'tree-edge',
    basis: 'landmark-local',
    centers: [
      [-24, -15],
      [-14, -23],
    ],
    radius: 4,
    counts: { rock: 4, grass: 10, shrub: 3, flower: 3 },
    slope: 0.25,
    intent: 'Frame the outer roots with gaps between patches',
  },
  {
    id: 'ruin-frame',
    basis: 'landmark-local',
    centers: [
      [22, -15],
      [24, 8],
    ],
    radius: 3,
    counts: { rock: 4, grass: 8, shrub: 2, flower: 5 },
    slope: 0.22,
    intent: 'Asymmetric low framing outside the arch access',
  },
  {
    id: 'meadow-transition',
    basis: 'landmark-local',
    centers: [
      [-43, -13],
      [41, 18],
      [-19, 42],
    ],
    radius: 4.5,
    counts: { rock: 5, grass: 10, shrub: 2, flower: 2 },
    slope: 0.25,
    intent: 'Fade landmark detail into open meadow',
  },
  {
    id: 'west-hills',
    basis: 'world',
    centers: [
      [-58, 24],
      [-64, 33],
    ],
    radius: 4,
    counts: { rock: 3, grass: 4, shrub: 1, flower: 0 },
    slope: 0.22,
    intent: 'Two quiet distant markers with broad empty space',
  },
  {
    id: 'north-highland',
    basis: 'world',
    centers: [
      [-18, -78],
      [-8, -83],
    ],
    radius: 4,
    counts: { rock: 3, grass: 4, shrub: 1, flower: 0 },
    slope: 0.22,
    intent: 'Sparse markers on the northern rise',
  },
];
export function selectComposition(
  debug: boolean,
  query: string | null,
): CompositionVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
