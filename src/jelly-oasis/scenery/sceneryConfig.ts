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
  ribbon?: boolean;
  counts: Partial<Record<SceneryKind, number>>;
}
// Connected forest shoulders and a geological backdrop; no isolated pebble fields.
export const SCENERY_ZONES: readonly SceneryZone[] = [
  {
    id: 'west-grove',
    basis: 'world',
    ribbon: true,
    centers: [
      [-0.3, 0.28],
      [-0.3, 0.13],
      [-0.26, -0.03],
      [-0.22, -0.19],
      [-0.29, -0.3],
    ],
    radius: 22,
    counts: { broad: 40, spire: 20, young: 20 },
  },
  {
    id: 'southwest-frame',
    basis: 'world',
    ribbon: true,
    centers: [
      [-0.33, 0.19],
      [-0.29, 0.32],
      [-0.14, 0.38],
    ],
    radius: 16,
    counts: { broad: 14, spire: 8, young: 12 },
  },
  {
    id: 'northwest-grove',
    basis: 'world',
    ribbon: true,
    centers: [
      [-0.37, -0.08],
      [-0.36, -0.25],
      [-0.23, -0.36],
      [-0.07, -0.36],
    ],
    radius: 16,
    counts: { broad: 22, spire: 18, young: 10 },
  },
  {
    id: 'north-ridge',
    basis: 'world',
    ribbon: true,
    centers: [
      [-0.13, -0.19],
      [0, -0.23],
      [0.17, -0.25],
      [0.27, -0.22],
    ],
    radius: 14,
    counts: { broad: 16, spire: 12, young: 14 },
  },
  {
    id: 'ridge-crowns',
    basis: 'world',
    ribbon: true,
    centers: [
      [-0.26, -0.28],
      [-0.11, -0.36],
      [0.04, -0.36],
      [0.16, -0.38],
      [0.28, -0.26],
    ],
    radius: 18,
    counts: { broad: 18, spire: 26, young: 16 },
  },
  {
    id: 'east-shoulder',
    basis: 'world',
    ribbon: true,
    centers: [
      [0.33, -0.17],
      [0.35, 0],
      [0.34, 0.15],
      [0.33, 0.28],
    ],
    radius: 16,
    counts: { broad: 18, spire: 12, young: 18 },
  },
];
export const SCENERY_SCALE = {
  broad: 2.15,
  spire: 1.9,
  young: 2.1,
  pebble: 1,
  boulder: 2.4,
  ridge: 1.8,
};
// Crowns may interlock inside a forest body; rock and route reservations stay complete.
export function scenerySeparation(
  a: { kind?: string; radius: number },
  b: { kind?: string; radius: number },
) {
  const bothTrees =
    a.kind &&
    b.kind &&
    TREE_KINDS.some((kind) => kind === a.kind) &&
    TREE_KINDS.some((kind) => kind === b.kind);
  const bothRocks =
    a.kind &&
    b.kind &&
    ['ridge', 'boulder'].includes(a.kind) &&
    ['ridge', 'boulder'].includes(b.kind);
  return (a.radius + b.radius) * (bothTrees ? 0.32 : bothRocks ? 0.5 : 1) + 0.5;
}
export const SCENERY_SHAPES = {
  broad: { radius: 4.6, height: 7.4, slope: 0.75 },
  spire: { radius: 3.0, height: 9.0, slope: 0.75 },
  young: { radius: 2.4, height: 4.2, slope: 0.75 },
  pebble: { radius: 0.85, height: 0.65, slope: 0.32 },
  boulder: { radius: 2.25, height: 2.45, slope: 0.38 },
  ridge: { radius: 10.5, height: 12, slope: 0.55 },
} satisfies Record<SceneryKind, { radius: number; height: number; slope: number }>;
export function selectScenery(debug: boolean, query: string | null): SceneryVariant {
  return debug && (query === 'off' || query === 'b') ? query : 'a';
}
