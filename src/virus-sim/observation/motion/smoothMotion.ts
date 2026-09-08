import type { ObservationMotionState, ObservationVec3 } from '../types';
import { hashUnit, rotateQuaternion } from './math';

const SEGMENT_SECONDS = 4;
const MIN_ANGULAR_SPEED = (3 * Math.PI) / 180;
const MAX_CONTROL_ANGULAR_SPEED = (6 * Math.PI) / 180;
export const MAX_SMOOTH_ANGULAR_SPEED = (12 * Math.PI) / 180;

export interface SmoothStepOptions {
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly radius: number;
}

export function stepSmoothMotion(
  state: ObservationMotionState,
  options: SmoothStepOptions,
  dt: number,
): ObservationMotionState {
  const translationTick = state.translationTick + (options.translationEnabled ? 1 : 0);
  const rotationTick = state.rotationTick + (options.rotationEnabled ? 1 : 0);
  const nextPosition = options.translationEnabled
    ? add(
        state.anchorPosition,
        evaluateSmoothPosition(state.seed, translationTick * dt, options.radius),
      )
    : state.position;
  const angularVelocity = options.rotationEnabled
    ? evaluateSmoothAngularVelocity(state.seed ^ 0xa341316c, state.rotationTick * dt)
    : { x: 0, y: 0, z: 0 };
  const nextQuaternion = options.rotationEnabled
    ? rotateQuaternion(state.quaternion, {
        x: angularVelocity.x * dt,
        y: angularVelocity.y * dt,
        z: angularVelocity.z * dt,
      })
    : state.quaternion;

  return {
    ...state,
    position: nextPosition,
    previousPosition: state.position,
    quaternion: nextQuaternion,
    previousQuaternion: state.quaternion,
    tick: state.tick + 1,
    translationTick,
    rotationTick,
  };
}

export function evaluateSmoothPosition(
  seed: number,
  time: number,
  radius: number,
): ObservationVec3 {
  const value = evaluateSpline(time / SEGMENT_SECONDS, (index) =>
    positionControl(seed, index, radius),
  );
  return value;
}

export function evaluateSmoothAngularVelocity(
  seed: number,
  time: number,
): ObservationVec3 {
  const value = evaluateSpline(time / SEGMENT_SECONDS, (index) =>
    angularControl(seed, index),
  );
  const speed = Math.hypot(value.x, value.y, value.z);
  if (speed <= MAX_SMOOTH_ANGULAR_SPEED || speed < 1e-12) return value;
  const scale = MAX_SMOOTH_ANGULAR_SPEED / speed;
  return { x: value.x * scale, y: value.y * scale, z: value.z * scale };
}

function evaluateSpline(
  segmentTime: number,
  control: (index: number) => ObservationVec3,
): ObservationVec3 {
  const segment = Math.floor(segmentTime);
  const t = segmentTime - segment;
  const t2 = t * t;
  const t3 = t2 * t;
  const weights = [
    (1 - 3 * t + 3 * t2 - t3) / 6,
    (4 - 6 * t2 + 3 * t3) / 6,
    (1 + 3 * t + 3 * t2 - 3 * t3) / 6,
    t3 / 6,
  ] as const;
  const points = [
    control(segment),
    control(segment + 1),
    control(segment + 2),
    control(segment + 3),
  ];
  return points.reduce<ObservationVec3>(
    (sum, point, index) => {
      const weight = weights[index] ?? 0;
      return {
        x: sum.x + point.x * weight,
        y: sum.y + point.y * weight,
        z: sum.z + point.z * weight,
      };
    },
    { x: 0, y: 0, z: 0 },
  );
}

function positionControl(seed: number, index: number, radius: number): ObservationVec3 {
  const direction = randomUnitVector(seed, index * 5);
  const magnitude = radius * (0.42 + hashUnit(seed ^ 0x68bc21eb, index * 5 + 3) * 0.58);
  return {
    x: direction.x * magnitude,
    y: direction.y * magnitude,
    z: direction.z * magnitude,
  };
}

function angularControl(seed: number, index: number): ObservationVec3 {
  const direction = randomUnitVector(seed, index * 7);
  const speed =
    MIN_ANGULAR_SPEED +
    hashUnit(seed ^ 0x02e5be93, index * 7 + 4) *
      (MAX_CONTROL_ANGULAR_SPEED - MIN_ANGULAR_SPEED);
  return { x: direction.x * speed, y: direction.y * speed, z: direction.z * speed };
}

function randomUnitVector(seed: number, index: number): ObservationVec3 {
  const z = hashUnit(seed, index) * 2 - 1;
  const angle = hashUnit(seed ^ 0x9e3779b9, index + 1) * Math.PI * 2;
  const radial = Math.sqrt(Math.max(0, 1 - z * z));
  return { x: Math.cos(angle) * radial, y: z, z: Math.sin(angle) * radial };
}

function add(left: ObservationVec3, right: ObservationVec3): ObservationVec3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}
