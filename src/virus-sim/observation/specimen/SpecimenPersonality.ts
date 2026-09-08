import { normalizeSeed } from '../../common/random';
import type { ObservationVec3 } from '../types';

export interface SpecimenPersonality {
  readonly seed: number;
  readonly driftBias: number;
  readonly rotationBias: ObservationVec3;
  readonly rhythmOffset: number;
  readonly pathScale: number;
  readonly pauseTendency: number;
}

export function createSpecimenPersonality(
  baseSeed: number,
  specimenId: string,
  instanceIndex = 0,
): SpecimenPersonality {
  let state = normalizeSeed(baseSeed ^ hashString(`${specimenId}:${instanceIndex}`));
  const next = (): number => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
  return {
    seed: normalizeSeed(state),
    driftBias: lerp(-0.16, 0.16, next()),
    rotationBias: {
      x: lerp(-0.12, 0.12, next()),
      y: lerp(-0.12, 0.12, next()),
      z: lerp(-0.12, 0.12, next()),
    },
    rhythmOffset: next() * Math.PI * 2,
    pathScale: lerp(0.82, 1.18, next()),
    pauseTendency: lerp(0.04, 0.24, next()),
  };
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
