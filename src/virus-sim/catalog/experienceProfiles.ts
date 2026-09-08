import type { ObservationLayerId, ObservationVec3 } from '../observation/types';
import { VIRUS_CATALOG } from './registry';

export interface FocusPoint {
  readonly label: string;
  readonly direction: ObservationVec3;
  readonly distance: number;
}

export interface InteriorPoint {
  readonly position: ObservationVec3;
  readonly target: ObservationVec3;
  readonly label: string;
}

export interface CameraPreset {
  readonly position: ObservationVec3;
  readonly target: ObservationVec3;
}

export interface VirusExperienceProfile {
  readonly virusId: string;
  readonly hero: boolean;
  readonly preferredCameraDistance: number;
  readonly surfaceStops: readonly FocusPoint[];
  readonly interiorPath?: readonly InteriorPoint[];
  readonly explodedSequence: readonly ObservationLayerId[];
  readonly documentaryAngles: readonly CameraPreset[];
  readonly supportedExperience: {
    readonly surfaceDive: boolean;
    readonly interiorDive: boolean;
    readonly explodedView: boolean;
    readonly cutaway: boolean;
  };
}

const HERO_IDS = new Set([
  't4',
  'influenza-a',
  'hsv1',
  'adenovirus-5',
  'rotavirus-rrv',
  'vaccinia-mv',
  'tmv',
  'm13',
  'stiv',
  'ssv1',
]);

const DEFAULT_ANGLES: readonly CameraPreset[] = [
  { position: { x: 0.9, y: 0.46, z: 1.35 }, target: { x: 0, y: 0, z: 0 } },
  { position: { x: -1.2, y: 0.3, z: 0.86 }, target: { x: 0, y: 0.05, z: 0 } },
  { position: { x: 0.35, y: -0.72, z: -1.28 }, target: { x: 0, y: 0, z: 0 } },
];

export const VIRUS_EXPERIENCE_PROFILES: readonly VirusExperienceProfile[] =
  VIRUS_CATALOG.map((virus, index) => {
    const hero = HERO_IDS.has(virus.id);
    const axis = index % 3;
    const surfaceDirection =
      axis === 0
        ? { x: 0.64, y: 0.28, z: 0.72 }
        : axis === 1
          ? { x: -0.58, y: 0.48, z: 0.66 }
          : { x: 0.42, y: -0.5, z: 0.76 };
    return {
      virusId: virus.id,
      hero,
      preferredCameraDistance: Math.max(2.2, virus.sectionRadius * 2.65),
      surfaceStops: [
        {
          label: virus.feature,
          direction: surfaceDirection,
          distance: hero ? 0.2 : 0.28,
        },
        {
          label: virus.layers[0]?.name ?? '표면 구조',
          direction: { x: -surfaceDirection.z, y: 0.2, z: surfaceDirection.x },
          distance: hero ? 0.15 : 0.24,
        },
      ],
      interiorPath: hero ? createInteriorPath(virus.shortName, axis) : undefined,
      explodedSequence: virus.layers.map((layer) => layer.id),
      documentaryAngles: rotateAngles(DEFAULT_ANGLES, index * 0.41),
      supportedExperience: {
        surfaceDive: true,
        interiorDive: hero,
        explodedView: true,
        cutaway: true,
      },
    } satisfies VirusExperienceProfile;
  });

const PROFILE_BY_ID = new Map(
  VIRUS_EXPERIENCE_PROFILES.map((profile) => [profile.virusId, profile]),
);

export function getExperienceProfile(virusId: string): VirusExperienceProfile {
  return PROFILE_BY_ID.get(virusId) ?? VIRUS_EXPERIENCE_PROFILES[0]!;
}

export function isHeroVirus(virusId: string): boolean {
  return HERO_IDS.has(virusId);
}

function createInteriorPath(label: string, axis: number): readonly InteriorPoint[] {
  const variants: readonly ObservationVec3[][] = [
    [
      { x: 0.34, y: 0.12, z: 0.28 },
      { x: 0.1, y: 0.24, z: 0.12 },
      { x: -0.22, y: -0.08, z: -0.18 },
    ],
    [
      { x: -0.3, y: 0.2, z: 0.22 },
      { x: 0.12, y: -0.24, z: 0.08 },
      { x: 0.24, y: 0.05, z: -0.2 },
    ],
    [
      { x: 0.18, y: -0.3, z: 0.26 },
      { x: -0.2, y: 0.14, z: 0.06 },
      { x: 0.08, y: 0.2, z: -0.24 },
    ],
  ];
  return (variants[axis] ?? variants[0]!).map((position, index) => ({
    position,
    target: index === 2 ? { x: 0, y: 0, z: 0 } : { x: 0, y: 0.04, z: 0 },
    label:
      index === 0
        ? `${label} 외곽 통과`
        : index === 1
          ? `${label} 내부 층`
          : `${label} 유전체 영역`,
  }));
}

function rotateAngles(
  presets: readonly CameraPreset[],
  rotation: number,
): readonly CameraPreset[] {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return presets.map((preset) => ({
    ...preset,
    position: {
      x: preset.position.x * cosine - preset.position.z * sine,
      y: preset.position.y,
      z: preset.position.x * sine + preset.position.z * cosine,
    },
  }));
}
