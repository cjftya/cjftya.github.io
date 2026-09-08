import { normalizeSeed } from '../simulation/random';
import type {
  ObservationMotionState,
  ObservationQuaternion,
  ObservationVec3,
} from './types';

export const OBSERVATION_FIXED_DT = 1 / 60;

export interface MotionOptions {
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly diffusion: number;
  readonly rotationalDiffusion: number;
  readonly boundary: number;
}

export const DEFAULT_MOTION_OPTIONS: MotionOptions = {
  translationEnabled: true,
  rotationEnabled: true,
  diffusion: 0.022,
  rotationalDiffusion: 0.035,
  boundary: 2.4,
};

export function createObservationMotion(seed: number): ObservationMotionState {
  const normalized = normalizeSeed(seed);
  const identity = { x: 0, y: 0, z: 0, w: 1 } as const;
  const origin = { x: 0, y: 0, z: 0 } as const;
  return {
    position: origin,
    previousPosition: origin,
    quaternion: identity,
    previousQuaternion: identity,
    seed: normalized,
    tick: 0,
  };
}

export function stepObservationMotion(
  state: ObservationMotionState,
  options: MotionOptions,
  dt = OBSERVATION_FIXED_DT,
): ObservationMotionState {
  if (Math.abs(dt - OBSERVATION_FIXED_DT) > 1e-12) {
    throw new Error(`Observation motion requires fixed dt ${OBSERVATION_FIXED_DT}.`);
  }

  const sampleBase = state.tick * 6;
  const translationScale = Math.sqrt(2 * options.diffusion * dt);
  const rotationScale = Math.sqrt(2 * options.rotationalDiffusion * dt);
  const nextPosition = options.translationEnabled
    ? {
        x: reflect(
          state.position.x + gaussian(state.seed, sampleBase) * translationScale,
          options.boundary,
        ),
        y: reflect(
          state.position.y + gaussian(state.seed, sampleBase + 1) * translationScale,
          options.boundary,
        ),
        z: reflect(
          state.position.z + gaussian(state.seed, sampleBase + 2) * translationScale,
          options.boundary,
        ),
      }
    : state.position;

  const nextQuaternion = options.rotationEnabled
    ? rotateQuaternion(state.quaternion, {
        x: gaussian(state.seed, sampleBase + 3) * rotationScale,
        y: gaussian(state.seed, sampleBase + 4) * rotationScale,
        z: gaussian(state.seed, sampleBase + 5) * rotationScale,
      })
    : state.quaternion;

  return {
    position: nextPosition,
    previousPosition: state.position,
    quaternion: nextQuaternion,
    previousQuaternion: state.quaternion,
    seed: state.seed,
    tick: state.tick + 1,
  };
}

function reflect(value: number, boundary: number): number {
  if (boundary <= 0) return 0;
  let reflected = value;
  while (reflected > boundary || reflected < -boundary) {
    if (reflected > boundary) reflected = boundary * 2 - reflected;
    if (reflected < -boundary) reflected = -boundary * 2 - reflected;
  }
  return reflected;
}

function rotateQuaternion(
  quaternion: ObservationQuaternion,
  rotationVector: ObservationVec3,
): ObservationQuaternion {
  const angle = Math.hypot(rotationVector.x, rotationVector.y, rotationVector.z);
  if (angle < 1e-12) return quaternion;
  const half = angle * 0.5;
  const factor = Math.sin(half) / angle;
  const delta = {
    x: rotationVector.x * factor,
    y: rotationVector.y * factor,
    z: rotationVector.z * factor,
    w: Math.cos(half),
  };
  return normalizeQuaternion(multiplyQuaternion(quaternion, delta));
}

function multiplyQuaternion(
  left: ObservationQuaternion,
  right: ObservationQuaternion,
): ObservationQuaternion {
  return {
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
  };
}

function normalizeQuaternion(value: ObservationQuaternion): ObservationQuaternion {
  const length = Math.hypot(value.x, value.y, value.z, value.w) || 1;
  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
    w: value.w / length,
  };
}

function gaussian(seed: number, sampleIndex: number): number {
  const first = Math.max(hashUnit(seed, sampleIndex * 2), Number.EPSILON);
  const second = hashUnit(seed, sampleIndex * 2 + 1);
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function hashUnit(seed: number, index: number): number {
  let value = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}
