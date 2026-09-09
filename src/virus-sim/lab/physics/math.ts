import type { QuaternionTuple, Vec3Tuple } from '../types';

export const ZERO: Vec3Tuple = [0, 0, 0];

export function add(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subtract(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(value: Vec3Tuple, amount: number): Vec3Tuple {
  return [value[0] * amount, value[1] * amount, value[2] * amount];
}

export function dot(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length(value: Vec3Tuple): number {
  return Math.hypot(value[0], value[1], value[2]);
}

export function normalize(
  value: Vec3Tuple,
  fallback: Vec3Tuple = [1, 0, 0],
): Vec3Tuple {
  const magnitude = length(value);
  return magnitude > 1e-9 ? scale(value, 1 / magnitude) : fallback;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function rotateVector(
  vector: Vec3Tuple,
  quaternion: QuaternionTuple,
): Vec3Tuple {
  const [x, y, z, w] = quaternion;
  const qVector: Vec3Tuple = [x, y, z];
  const uv = cross(qVector, vector);
  const uuv = cross(qVector, uv);
  return add(vector, add(scale(uv, 2 * w), scale(uuv, 2)));
}

export function integrateQuaternion(
  quaternion: QuaternionTuple,
  angularVelocity: Vec3Tuple,
  dt: number,
): QuaternionTuple {
  const speed = length(angularVelocity);
  if (speed < 1e-10 || dt <= 0) return quaternion;
  const halfAngle = (speed * dt) / 2;
  const axis = scale(angularVelocity, 1 / speed);
  const sine = Math.sin(halfAngle);
  return normalizeQuaternion(
    multiplyQuaternion(quaternion, [
      axis[0] * sine,
      axis[1] * sine,
      axis[2] * sine,
      Math.cos(halfAngle),
    ]),
  );
}

export function multiplyQuaternion(
  a: QuaternionTuple,
  b: QuaternionTuple,
): QuaternionTuple {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export function normalizeQuaternion(value: QuaternionTuple): QuaternionTuple {
  const magnitude = Math.hypot(value[0], value[1], value[2], value[3]);
  if (!Number.isFinite(magnitude) || magnitude < 1e-9) return [0, 0, 0, 1];
  return [
    value[0] / magnitude,
    value[1] / magnitude,
    value[2] / magnitude,
    value[3] / magnitude,
  ];
}

export function finiteVector(value: Vec3Tuple): boolean {
  return value.every(Number.isFinite);
}
