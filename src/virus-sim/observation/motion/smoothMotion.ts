import type { MotionMode, ObservationMotionState, ObservationVec3 } from '../types';
import { hashUnit, rotateQuaternion } from './math';

const DEGREE = Math.PI / 180;
export const MAX_ACTIVE_ANGULAR_SPEED = 18 * DEGREE;
export const MAX_CALM_ANGULAR_SPEED = 12 * DEGREE;

export interface SmoothStepOptions {
  readonly translationEnabled: boolean;
  readonly rotationEnabled: boolean;
  readonly mode: Extract<MotionMode, 'active' | 'calm'>;
  readonly radius: number;
}

export function stepSmoothMotion(
  state: ObservationMotionState,
  options: SmoothStepOptions,
  dt: number,
): ObservationMotionState {
  const rhythm =
    1 +
    0.2 * Math.sin(state.translationPhase * ((Math.PI * 2) / 9) + state.seed * 0.00001);
  const translationPhase =
    state.translationPhase + (options.translationEnabled ? dt * rhythm : 0);
  const rotationPhase =
    state.rotationPhase + (options.rotationEnabled ? dt * (0.94 + rhythm * 0.08) : 0);
  const translationTick = state.translationTick + (options.translationEnabled ? 1 : 0);
  const rotationTick = state.rotationTick + (options.rotationEnabled ? 1 : 0);
  const nextPosition = options.translationEnabled
    ? add(
        state.anchorPosition,
        evaluateSmoothPosition(
          state.seed,
          translationPhase,
          options.radius,
          options.mode,
        ),
      )
    : state.position;
  const angularVelocity = options.rotationEnabled
    ? evaluateSmoothAngularVelocity(
        state.seed ^ 0xa341316c,
        rotationPhase,
        options.mode,
      )
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
    translationPhase,
    rotationPhase,
  };
}

export function evaluateSmoothPosition(
  seed: number,
  time: number,
  radius: number,
  mode: Extract<MotionMode, 'active' | 'calm'> = 'active',
): ObservationVec3 {
  const segmentSeconds = mode === 'active' ? 3.2 : 4.4;
  return evaluateSpline(time / segmentSeconds, (index) =>
    positionControl(seed, index, radius),
  );
}

export function evaluateSmoothAngularVelocity(
  seed: number,
  time: number,
  mode: Extract<MotionMode, 'active' | 'calm'> = 'active',
): ObservationVec3 {
  const segmentSeconds = mode === 'active' ? 3.2 : 4.4;
  const value = evaluateSpline(time / segmentSeconds, (index) =>
    angularControl(seed, index, mode),
  );
  const limit = mode === 'active' ? MAX_ACTIVE_ANGULAR_SPEED : MAX_CALM_ANGULAR_SPEED;
  const speed = Math.hypot(value.x, value.y, value.z);
  if (speed <= limit || speed < 1e-12) return value;
  const scale = limit / speed;
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
    (sum, point, index) => ({
      x: sum.x + point.x * (weights[index] ?? 0),
      y: sum.y + point.y * (weights[index] ?? 0),
      z: sum.z + point.z * (weights[index] ?? 0),
    }),
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

function angularControl(
  seed: number,
  index: number,
  mode: Extract<MotionMode, 'active' | 'calm'>,
): ObservationVec3 {
  const direction = randomUnitVector(seed, index * 7);
  const minimum = (mode === 'active' ? 6 : 3) * DEGREE;
  const maximum = (mode === 'active' ? 12 : 6) * DEGREE;
  const speed =
    minimum + hashUnit(seed ^ 0x02e5be93, index * 7 + 4) * (maximum - minimum);
  return {
    x: direction.x * speed,
    y: direction.y * speed,
    z: direction.z * speed,
  };
}

function randomUnitVector(seed: number, index: number): ObservationVec3 {
  const z = hashUnit(seed, index) * 2 - 1;
  const angle = hashUnit(seed ^ 0x9e3779b9, index + 1) * Math.PI * 2;
  const radial = Math.sqrt(Math.max(0, 1 - z * z));
  return {
    x: Math.cos(angle) * radial,
    y: z,
    z: Math.sin(angle) * radial,
  };
}

function add(left: ObservationVec3, right: ObservationVec3): ObservationVec3 {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  };
}
