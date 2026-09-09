import { getPhysicalDimensions } from '../../catalog/dimensions';
import { getGeometryProfile } from '../../catalog/geometryProfiles';
import { VIRUS_CATALOG, getCatalogEntry } from '../../catalog/registry';
import type { ObservationPresetId } from '../../catalog/types';
import type { LabScaleMode, PhysicsProfile, Vec3Tuple } from '../types';

const FLEXIBLE_FILAMENTS = new Set(['m13', 'ebola-virus']);

export const VIRUS_PHYSICS_PROFILE_IDS: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      VIRUS_CATALOG.map((entry) => [entry.id, `physics:${entry.id}:v1`]),
    ),
  );

const PROFILES = new Map(
  VIRUS_CATALOG.map((entry) => {
    const geometry = getGeometryProfile(entry.geometryProfileId);
    const elongated = geometry.elongation ?? 1;
    const contourLength = geometry.filamentLength ?? geometry.radius * elongated * 2;
    const radius = normalizedRadius(geometry.radius, contourLength);
    const compoundOffsets: readonly Vec3Tuple[] = compoundOffsetsFor(
      geometry.family,
      radius,
      contourLength,
    );
    const flexible =
      geometry.family === 'filament' &&
      (FLEXIBLE_FILAMENTS.has(entry.id) || (geometry.bend ?? 0) > 0.08);
    const shape: PhysicsProfile['shape'] =
      geometry.family === 'phage' ||
      geometry.family === 'geminate' ||
      geometry.family === 'spindle'
        ? 'compound'
        : flexible
          ? 'filament'
          : geometry.family === 'rod' ||
              geometry.family === 'filament' ||
              elongated > 1.3 ||
              entry.silhouette === 'bullet' ||
              entry.silhouette === 'brick'
            ? 'capsule'
            : 'sphere';
    const halfLength =
      shape === 'sphere'
        ? 0
        : Math.max(radius * 0.65, Math.min(1.65, contourLength * 0.16));
    const profile: PhysicsProfile = {
      id: VIRUS_PHYSICS_PROFILE_IDS[entry.id]!,
      virusId: entry.id,
      shape,
      localAxis: [1, 0, 0],
      radius,
      halfLength,
      segmentCount: shape === 'filament' ? 10 : 1,
      dragParallel: shape === 'sphere' ? 1 : 0.91,
      dragPerpendicular: shape === 'sphere' ? 1 : shape === 'compound' ? 0.72 : 0.64,
      rotationResponse: shape === 'sphere' ? 0.28 : shape === 'compound' ? 0.82 : 1,
      flexibility: shape === 'filament' ? 0.22 : 0,
      compoundOffsets,
      evidence: entry.evidenceStatus,
      approximationNote:
        entry.id === 'tmv'
          ? 'TMV는 filament 렌더 계열이지만 강직 막대 surrogate로 계산해요.'
          : shape === 'filament'
            ? '제한된 capsule chain 계열 근사이며 실측 굽힘 계수가 아니에요.'
            : `${geometry.family} 외형을 ${shape} 충돌체로 단순화한 개념 근사예요.`,
      version: 1,
    };
    return [entry.id, profile] as const;
  }),
);

if (PROFILES.size !== VIRUS_CATALOG.length) {
  throw new Error('Every Virus Sim catalog entry must have one physics profile');
}

export function getPhysicsProfile(virusId: ObservationPresetId): PhysicsProfile {
  const profile = PROFILES.get(virusId);
  if (!profile)
    throw new Error(`Missing physics profile for Virus Sim entry: ${virusId}`);
  return profile;
}

export function getPhysicsProfileById(profileId: string): PhysicsProfile {
  const profile = [...PROFILES.values()].find((item) => item.id === profileId);
  if (!profile) throw new Error(`Unknown Virus Sim physics profile: ${profileId}`);
  return profile;
}

export function scaleForVirus(
  virusId: ObservationPresetId,
  mode: LabScaleMode,
): { readonly scale: number; readonly physical: boolean; readonly note: string } {
  if (mode === 'representative-length') {
    return {
      scale: 1,
      physical: false,
      note: '대표 길이 맞춤 · 실제 크기·부피·질량 비율이 아니에요.',
    };
  }
  const dimensions = getPhysicalDimensions(virusId);
  if (!dimensions) {
    return {
      scale: 1,
      physical: false,
      note: '대표 치수 근거가 없어 개념 크기로 표시해요.',
    };
  }
  return {
    scale: Math.max(0.3, Math.min(3, dimensions.representativeNm / 120)),
    physical: true,
    note: `${getCatalogEntry(virusId).shortName} · ${dimensions.metric} ${dimensions.representativeNm} nm 기준`,
  };
}

export function scalesForViruses(
  virusIds: readonly ObservationPresetId[],
  mode: LabScaleMode,
): readonly number[] {
  const targetMaximum = virusIds.length <= 1 ? 3 : virusIds.length <= 3 ? 2.1 : 1.5;
  if (mode === 'representative-length') {
    return virusIds.map(
      (virusId) =>
        targetMaximum / representativeProfileLength(getPhysicsProfile(virusId)),
    );
  }
  const dimensions = virusIds.map((virusId) => getPhysicalDimensions(virusId));
  const maximumNm = Math.max(
    1,
    ...dimensions.map((dimension) => dimension?.representativeNm ?? 0),
  );
  return virusIds.map((virusId, index) => {
    const dimension = dimensions[index];
    if (!dimension)
      return targetMaximum / representativeProfileLength(getPhysicsProfile(virusId));
    const targetLength = targetMaximum * (dimension.representativeNm / maximumNm);
    return targetLength / representativeProfileLength(getPhysicsProfile(virusId));
  });
}

export function validatePhysicsProfiles(): readonly string[] {
  return VIRUS_CATALOG.flatMap((entry) => {
    const profile = PROFILES.get(entry.id);
    if (!profile) return [`${entry.id}: profile missing`];
    if (profile.shape === 'filament' && profile.segmentCount < 8)
      return [`${entry.id}: filament segment count is too small`];
    if (entry.id === 'tmv' && profile.shape !== 'capsule')
      return ['tmv: must remain a rigid capsule'];
    return [];
  });
}

function normalizedRadius(sourceRadius: number, length: number): number {
  const ratio = sourceRadius / Math.max(length, sourceRadius * 2);
  return Math.max(0.16, Math.min(0.62, 0.32 + ratio * 0.35));
}

function compoundOffsetsFor(
  family: string,
  radius: number,
  length: number,
): readonly Vec3Tuple[] {
  if (family === 'phage')
    return [
      [0.55, 0, 0],
      [-0.15, 0, 0],
      [-Math.min(1.5, length * 0.18), 0, 0],
      [-Math.min(1.75, length * 0.22), radius * 0.75, 0],
      [-Math.min(1.75, length * 0.22), -radius * 0.75, 0],
    ];
  if (family === 'geminate')
    return [
      [-radius * 0.7, 0, 0],
      [radius * 0.7, 0, 0],
    ];
  if (family === 'spindle')
    return [
      [-0.55, 0, 0],
      [0, 0, 0],
      [0.55, 0, 0],
    ];
  return [];
}

function representativeProfileLength(profile: PhysicsProfile): number {
  if (profile.compoundOffsets.length > 0) {
    const x = profile.compoundOffsets.map((offset) => offset[0]);
    return Math.max(...x) - Math.min(...x) + profile.radius * 2;
  }
  return profile.radius * 2 + profile.halfLength * 2;
}
