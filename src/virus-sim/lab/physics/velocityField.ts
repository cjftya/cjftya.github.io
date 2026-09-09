import type { LabEnvironment, Vec3Tuple } from '../types';
import type { ChamberDescriptor } from '../chambers/descriptors';
import { clamp } from './math';

export function effectiveFlowSpeed(environment: LabEnvironment): number {
  return (
    clamp(environment.drive, 0, 2) * (1.15 / clamp(environment.viscosityRatio, 0.25, 4))
  );
}

export function sampleVelocityField(
  environment: LabEnvironment,
  position: Vec3Tuple,
  chamber?: ChamberDescriptor,
): Vec3Tuple {
  if (
    chamber?.obstacles.some((box) =>
      position.every(
        (coordinate, axis) =>
          coordinate >= box.min[axis]! && coordinate <= box.max[axis]!,
      ),
    )
  )
    return [0, 0, 0];
  const speed = effectiveFlowSpeed(environment);
  const direction = environment.flowDirection;
  switch (environment.flowPreset) {
    case 'linear':
      return [direction * speed, 0, 0];
    case 'shear': {
      const normalizedY = clamp(position[1] / 3.2, -1, 1);
      const localSpeed = Math.max(
        0.08,
        speed * (1 + normalizedY * environment.shearStrength * 0.72),
      );
      return [direction * localSpeed, 0, 0];
    }
    case 'vortex': {
      const x = position[0];
      const y = position[1];
      const radius = Math.hypot(x, y);
      const core = 0.85;
      const tangential =
        speed * environment.vortexStrength * (radius / (core * core + radius * radius));
      if (radius < 1e-7) return [0, 0, 0];
      return [
        (-y / radius) * tangential * direction,
        (x / radius) * tangential * direction,
        0,
      ];
    }
  }
}

export function sampleLocalRotation(
  environment: LabEnvironment,
  position: Vec3Tuple,
): Vec3Tuple {
  if (environment.flowPreset === 'shear') {
    const shear =
      effectiveFlowSpeed(environment) *
      environment.shearStrength *
      environment.flowDirection;
    return [0, 0, -shear * 0.22];
  }
  if (environment.flowPreset === 'vortex') {
    const core = 0.85;
    const radiusSquared = position[0] ** 2 + position[1] ** 2;
    const rotation =
      (effectiveFlowSpeed(environment) * environment.vortexStrength * core) /
      (core * core + radiusSquared);
    return [0, 0, rotation * environment.flowDirection];
  }
  return [0, 0, 0];
}
