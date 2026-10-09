export interface LandmarkPlacement {
  position: { x: number; z: number };
  rotationY: number;
  scale: number;
}

export const LANDMARK_ASSET_PATH = `${import.meta.env.BASE_URL}assets/jelly-oasis/landmarks/overgrown-ruin/`;
export const LANDMARK_REFERENCE_FILE = 'Overgrown_Oasis_Ruin_Blockout_v1.glb';
export const LANDMARK_CANDIDATES = [
  {
    id: 'basin',
    label: '동쪽 분지',
    position: { x: 70, z: 58 },
    rotationY: Math.PI / 6,
    scale: 1,
  },
  {
    id: 'west',
    label: '서쪽 구릉',
    position: { x: -94, z: -12 },
    rotationY: 0,
    scale: 1,
  },
  {
    id: 'north',
    label: '북쪽 고지대',
    position: { x: 5, z: -94 },
    rotationY: 0,
    scale: 1,
  },
] as const;
export const OVERGROWN_RUIN_CONFIG: LandmarkPlacement = {
  ...LANDMARK_CANDIDATES[0],
  position: { ...LANDMARK_CANDIDATES[0].position },
};
export const LANDMARK_FIRST_IMPORTS = [
  'Rock_Large_A',
  'Ruin_Arch_A',
  'Cliff_Waterfall_A',
];
// Join the arch's east jamb to the broken wall while retaining the source layout reference.
export const LANDMARK_MODULE_OFFSETS: Record<string, { x: number; z: number }> = {
  Ruin_BrokenWall_A: { x: 4, z: 11 },
};
export type LandmarkCamera = 'overview' | 'medium' | 'ground';
export interface LayoutGuide {
  positions: number[][];
  indices: number[][];
}
export interface LandmarkLayout {
  scene: string;
  modules: {
    name: string;
    position: number[];
    bounds: { min: number[]; max: number[] };
  }[];
  guides: Record<string, LayoutGuide>;
}
