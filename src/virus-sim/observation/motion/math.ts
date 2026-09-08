import type { ObservationQuaternion, ObservationVec3 } from '../types';

export function rotateQuaternion(
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

export function multiplyQuaternion(
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

export function normalizeQuaternion(
  value: ObservationQuaternion,
): ObservationQuaternion {
  const length = Math.hypot(value.x, value.y, value.z, value.w) || 1;
  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
    w: value.w / length,
  };
}

export function slerpQuaternion(
  from: ObservationQuaternion,
  to: ObservationQuaternion,
  amount: number,
): ObservationQuaternion {
  const t = Math.min(1, Math.max(0, amount));
  let end = to;
  let dot = from.x * to.x + from.y * to.y + from.z * to.z + from.w * to.w;
  if (dot < 0) {
    dot = -dot;
    end = { x: -to.x, y: -to.y, z: -to.z, w: -to.w };
  }
  if (dot > 0.9995) {
    return normalizeQuaternion({
      x: from.x + (end.x - from.x) * t,
      y: from.y + (end.y - from.y) * t,
      z: from.z + (end.z - from.z) * t,
      w: from.w + (end.w - from.w) * t,
    });
  }
  const theta = Math.acos(Math.min(1, Math.max(-1, dot)));
  const sinTheta = Math.sin(theta);
  const fromScale = Math.sin((1 - t) * theta) / sinTheta;
  const toScale = Math.sin(t * theta) / sinTheta;
  return normalizeQuaternion({
    x: from.x * fromScale + end.x * toScale,
    y: from.y * fromScale + end.y * toScale,
    z: from.z * fromScale + end.z * toScale,
    w: from.w * fromScale + end.w * toScale,
  });
}

export function hashUnit(seed: number, index: number): number {
  let value = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

export function gaussian(seed: number, sampleIndex: number): number {
  const first = Math.max(hashUnit(seed, sampleIndex * 2), Number.EPSILON);
  const second = hashUnit(seed, sampleIndex * 2 + 1);
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}
