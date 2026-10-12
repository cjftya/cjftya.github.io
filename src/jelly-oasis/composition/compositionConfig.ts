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
// Keep two quiet core transitions; outer massing belongs to scenery and meadow.
export const COMPOSITION_ZONES: readonly CompositionZone[] = [
  {
    id: 'shore-transition',
    basis: 'landmark-local',
    centers: [
      [-17, 7],
      [-15, 16],
    ],
    radius: 3.5,
    counts: { rock: 0, grass: 8, shrub: 2, flower: 0 },
    slope: 0.22,
    intent: 'Low pond framing',
  },
  {
    id: 'tree-edge',
    basis: 'landmark-local',
    centers: [
      [-24, -15],
      [-14, -23],
    ],
    radius: 4,
    counts: { rock: 0, grass: 6, shrub: 2, flower: 0 },
    slope: 0.25,
    intent: 'Quiet root transition',
  },
];
export function selectComposition(
  debug: boolean,
  query: string | null,
): CompositionVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
