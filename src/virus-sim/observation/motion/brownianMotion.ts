import type { ObservationMotionState } from '../types';
import { gaussian, rotateQuaternion } from './math';

export interface BrownianStepOptions {
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly diffusion: number;
  readonly rotationalDiffusion: number;
  readonly boundary: number;
}

export function stepBrownianMotion(
  state: ObservationMotionState,
  options: BrownianStepOptions,
  dt: number,
): ObservationMotionState {
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
    ...state,
    position: nextPosition,
    previousPosition: state.position,
    quaternion: nextQuaternion,
    previousQuaternion: state.quaternion,
    tick: state.tick + 1,
    translationTick: state.translationTick + (options.translationEnabled ? 1 : 0),
    rotationTick: state.rotationTick + (options.rotationEnabled ? 1 : 0),
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
