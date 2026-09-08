import { normalizeSeed } from '../../common/random';
import type {
  MotionMode,
  ObservationMotionState,
  ObservationQuaternion,
  ObservationVec3,
} from '../types';
import { stepBrownianMotion } from './brownianMotion';
import { slerpQuaternion } from './math';
import { evaluateSmoothPosition, stepSmoothMotion } from './smoothMotion';

export const OBSERVATION_FIXED_DT = 1 / 60;

export interface MotionOptions {
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly diffusion: number;
  readonly rotationalDiffusion: number;
  readonly boundary: number;
  readonly smoothRadius: number;
}

export const DEFAULT_MOTION_OPTIONS: MotionOptions = {
  translationEnabled: true,
  rotationEnabled: true,
  diffusion: 0.022,
  rotationalDiffusion: 0.035,
  boundary: 2.4,
  smoothRadius: 0.42,
};

const ORIGIN = { x: 0, y: 0, z: 0 } as const;
const IDENTITY = { x: 0, y: 0, z: 0, w: 1 } as const;

export function createObservationMotion(
  seed: number,
  mode: MotionMode = 'active',
  pose: { position: ObservationVec3; quaternion: ObservationQuaternion } = {
    position: ORIGIN,
    quaternion: IDENTITY,
  },
): ObservationMotionState {
  const normalized = normalizeSeed(seed);
  const pathOrigin =
    mode === 'active' || mode === 'calm'
      ? evaluateSmoothPosition(
          normalized,
          0,
          mode === 'active'
            ? DEFAULT_MOTION_OPTIONS.smoothRadius
            : DEFAULT_MOTION_OPTIONS.smoothRadius * 0.55,
          mode,
        )
      : ORIGIN;
  return {
    version: 'observation-motion-v2.5',
    mode,
    position: { ...pose.position },
    previousPosition: { ...pose.position },
    quaternion: { ...pose.quaternion },
    previousQuaternion: { ...pose.quaternion },
    anchorPosition: {
      x: pose.position.x - pathOrigin.x,
      y: pose.position.y - pathOrigin.y,
      z: pose.position.z - pathOrigin.z,
    },
    anchorQuaternion: { ...pose.quaternion },
    seed: normalized,
    tick: 0,
    translationTick: 0,
    rotationTick: 0,
    translationPhase: 0,
    rotationPhase: 0,
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
  if (state.mode === 'static') {
    return {
      ...state,
      previousPosition: state.position,
      previousQuaternion: state.quaternion,
    };
  }
  if (state.mode === 'brownian') return stepBrownianMotion(state, options, dt);
  return stepSmoothMotion(
    state,
    {
      translationEnabled: options.translationEnabled,
      rotationEnabled: options.rotationEnabled,
      mode: state.mode,
      radius:
        state.mode === 'active' ? options.smoothRadius : options.smoothRadius * 0.55,
    },
    dt,
  );
}

export function freezeObservationMotion(
  state: ObservationMotionState,
  interpolation: number,
): ObservationMotionState {
  const t = Math.min(1, Math.max(0, interpolation));
  const position = {
    x: state.previousPosition.x + (state.position.x - state.previousPosition.x) * t,
    y: state.previousPosition.y + (state.position.y - state.previousPosition.y) * t,
    z: state.previousPosition.z + (state.position.z - state.previousPosition.z) * t,
  };
  const quaternion = slerpQuaternion(state.previousQuaternion, state.quaternion, t);
  const reset = createObservationMotion(state.seed, state.mode, {
    position,
    quaternion,
  });
  return { ...reset, tick: state.tick };
}

export function switchObservationMotion(
  state: ObservationMotionState,
  mode: MotionMode,
): ObservationMotionState {
  if (state.mode === mode) return state;
  const next = createObservationMotion(state.seed, mode, {
    position: state.position,
    quaternion: state.quaternion,
  });
  return { ...next, tick: state.tick };
}
