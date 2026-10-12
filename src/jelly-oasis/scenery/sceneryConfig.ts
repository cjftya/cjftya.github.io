export const SCENERY_SEED = 0x02671012;
export const SCENERY_KINDS = [
  'broad',
  'spire',
  'young',
  'pebble',
  'boulder',
  'ridge',
] as const;
export type SceneryKind = (typeof SCENERY_KINDS)[number];
export type SceneryVariant = 'off' | 'a' | 'b';
export const TREE_KINDS: readonly SceneryKind[] = ['broad', 'spire', 'young'];
export interface SceneryZone {
  id: string;
  basis: 'world' | 'landmark-local';
  // World centres are fractions of the adopted stage width, local centres are metres.
  centers: readonly (readonly [number, number])[];
  radius: number;
  counts: Partial<Record<SceneryKind, number>>;
}
export const SCENERY_ZONES: readonly SceneryZone[] = [
  {
    id: 'west-grove',
    basis: 'world',
    centers: [[-0.25, 0.07]],
    radius: 15,
    counts: { broad: 4, spire: 2, young: 2, boulder: 3, pebble: 4 },
  },
  {
    id: 'northwest-grove',
    basis: 'world',
    centers: [[-0.19, -0.11]],
    radius: 15,
    counts: { broad: 3, spire: 3, young: 2, boulder: 3, pebble: 4 },
  },
  {
    id: 'north-ridge',
    basis: 'world',
    centers: [
      [-0.27, -0.31],
      [0.015, -0.4],
      [0.27, -0.31],
    ],
    radius: 8,
    counts: { ridge: 3, boulder: 7, pebble: 3 },
  },
  {
    id: 'ruin-stones',
    basis: 'landmark-local',
    centers: [
      [25, -18],
      [25, 10],
    ],
    radius: 4,
    counts: { pebble: 3, boulder: 2 },
  },
  {
    id: 'meadow-stones',
    basis: 'world',
    centers: [
      [-0.16, 0.3],
      [0.19, 0.31],
      [0.33, 0.2],
    ],
    radius: 5,
    counts: { boulder: 3, pebble: 4 },
  },
];
export const SCENERY_SHAPES = {
  broad: { radius: 3.05, height: 7.4, slope: 0.28 },
  spire: { radius: 2.0, height: 9.0, slope: 0.28 },
  young: { radius: 1.6, height: 4.2, slope: 0.28 },
  pebble: { radius: 0.85, height: 0.65, slope: 0.32 },
  boulder: { radius: 2.25, height: 2.45, slope: 0.38 },
  ridge: { radius: 4.6, height: 3.4, slope: 0.38 },
} satisfies Record<SceneryKind, { radius: number; height: number; slope: number }>;
export function selectScenery(debug: boolean, query: string | null): SceneryVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
