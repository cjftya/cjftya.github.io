import { isVirusId } from '../catalog/registry';
import { getVariant } from '../catalog/variants/registry';
import { createLabWorld, validateWorld } from './physics/world';
import { getPhysicsProfile } from './profiles/registry';
import type { LabConfig } from './types';

const STORAGE_KEY = 'virus-sim:lab-config:v1';

export interface LabConfigLoadResult {
  readonly config: LabConfig | null;
  readonly error: string | null;
}

export function saveLabConfig(storage: Storage, config: LabConfig): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function loadLabConfig(storage: Storage): LabConfig | null {
  return loadLabConfigWithStatus(storage).config;
}

export function loadLabConfigWithStatus(storage: Storage): LabConfigLoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      config: null,
      error: '브라우저 저장소에 접근할 수 없어 안전한 기본 설정을 사용해요.',
    };
  }
  if (!raw) return { config: null, error: null };
  try {
    const value: unknown = JSON.parse(raw);
    const error = getLabConfigError(value);
    if (error) throw new Error(error);
    return { config: value as LabConfig, error: null };
  } catch (error) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // The safe default still works when a locked storage area cannot be cleaned.
    }
    return {
      config: null,
      error:
        error instanceof SyntaxError
          ? '저장된 실험 설정 JSON이 손상되어 안전한 기본 설정으로 되돌렸어요.'
          : `${error instanceof Error ? error.message : '저장 설정을 읽을 수 없어요.'} 안전한 기본 설정으로 되돌렸어요.`,
    };
  }
}

export function isValidLabConfig(value: unknown): value is LabConfig {
  return getLabConfigError(value) === null;
}

function getLabConfigError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return '저장 설정 형식이 올바르지 않아요.';
  const config = value as Partial<LabConfig>;
  if (config.schemaVersion !== 1) return '지원하지 않는 저장 schema 버전이에요.';
  if (config.engineVersion !== 'virus-lab-v4.0')
    return '현재 물리 엔진과 맞지 않는 저장 설정이에요.';
  if (config.scaleMode !== 'representative-length' && config.scaleMode !== 'physical')
    return '알 수 없는 크기 방식이 저장되어 있어요.';
  if (
    !Number.isInteger(config.seed) ||
    (config.seed ?? -1) < 0 ||
    (config.seed ?? Number.MAX_SAFE_INTEGER) > 0xffffffff
  )
    return 'seed가 유효한 32비트 정수가 아니에요.';
  if (![60, 120, 300].includes(config.durationSeconds ?? -1))
    return '지원하지 않는 실험 제한 시간이에요.';
  if (!config.environment) return '환경 설정이 빠져 있어요.';
  if (
    !Array.isArray(config.initialInstances) ||
    config.initialInstances.length < 1 ||
    config.initialInstances.length > 8
  )
    return '표본은 1개 이상 8개 이하여야 해요.';

  const environment = config.environment;
  if (!['open', 'obstacle'].includes(environment.chamber))
    return '알 수 없는 챔버 설정이에요.';
  if (!['linear', 'shear', 'vortex'].includes(environment.flowPreset))
    return '알 수 없는 흐름 설정이에요.';
  if (
    !inRange(environment.drive, 0, 2) ||
    !inRange(environment.viscosityRatio, 0.25, 4) ||
    !inRange(environment.shearStrength, 0, 1.5) ||
    !inRange(environment.vortexStrength, 0, 1.5) ||
    !inRange(environment.gapWidth, 0.7, 4.2) ||
    ![-1, 1].includes(environment.flowDirection) ||
    typeof environment.brownianEnabled !== 'boolean'
  )
    return '환경 값이 지원 범위를 벗어났어요.';

  const ids = new Set<string>();
  for (const instance of config.initialInstances) {
    if (!instance || typeof instance.instanceId !== 'string' || !instance.instanceId)
      return '표본 instance ID가 올바르지 않아요.';
    if (ids.has(instance.instanceId)) return '중복된 표본 instance ID가 있어요.';
    if (!isVirusId(instance.virusId)) return '도감에 없는 표본이 저장되어 있어요.';
    const variant = getVariant(instance.variantId);
    if (
      instance.variantId !== null &&
      (!variant || variant.parentVirusId !== instance.virusId)
    )
      return '표본과 변이 정보가 서로 맞지 않아요.';
    if (
      !finiteTuple(instance.position, 3) ||
      !finiteTuple(instance.orientation, 4) ||
      !isUnitQuaternion(instance.orientation)
    )
      return '표본의 시작 pose가 올바르지 않아요.';
    if (instance.physicsProfileId !== getPhysicsProfile(instance.virusId).id)
      return '저장된 물리 프로필 버전이 현재 도감과 맞지 않아요.';
    ids.add(instance.instanceId);
  }
  try {
    const worldErrors = validateWorld(createLabWorld(config as LabConfig));
    if (worldErrors.length > 0)
      return `저장된 시작 배치가 유효하지 않아요: ${worldErrors[0]}`;
  } catch {
    return '저장된 표본으로 안전한 물리 world를 만들 수 없어요.';
  }
  return null;
}

function inRange(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
  );
}

function finiteTuple(value: unknown, length: number): boolean {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function isUnitQuaternion(value: readonly number[]): boolean {
  const magnitude = Math.hypot(...value);
  return Math.abs(magnitude - 1) <= 1e-4;
}
