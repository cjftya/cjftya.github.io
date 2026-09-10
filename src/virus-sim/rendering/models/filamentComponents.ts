import * as THREE from 'three';
import type {
  CenterlineArchetype,
  GenomePathKind,
  HelicalCoatUnitShape,
  TerminalStructureSignature,
} from '../../catalog/structuralTypes';
import type { InstanceExplosion } from './types';
import { COLORS, createCylinderBetween, createTube, standardMaterial } from './shared';

export type Quality = 'high' | 'low';

export interface CenterlineFrame {
  readonly point: THREE.Vector3;
  readonly tangent: THREE.Vector3;
  readonly normal: THREE.Vector3;
  readonly binormal: THREE.Vector3;
}

export interface CenterlinePath {
  readonly points: readonly THREE.Vector3[];
  readonly curve: THREE.CatmullRomCurve3;
  readonly frames: readonly CenterlineFrame[];
}

export function createBodyCenterline(
  archetype: CenterlineArchetype,
  length: number,
  quality: Quality,
): CenterlinePath {
  const count = quality === 'high' ? 72 : 40;
  const points = Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    const y = (t - 0.5) * length;
    if (archetype === 'straight') return new THREE.Vector3(0, y, 0);
    if (archetype === 'gentle-bend') {
      return new THREE.Vector3(
        Math.sin((t - 0.5) * Math.PI) * length * 0.055,
        y,
        Math.sin(t * Math.PI) * length * 0.025,
      );
    }
    return new THREE.Vector3(
      Math.sin((t - 0.5) * Math.PI * 1.7) * length * 0.09,
      y,
      Math.sin(t * Math.PI * 2) * length * 0.035,
    );
  });
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.45);
  return { points, curve, frames: sampleCenterlineFrames(curve, count) };
}

export function sampleCenterlineFrames(
  curve: THREE.Curve<THREE.Vector3>,
  segments: number,
): CenterlineFrame[] {
  const frames: CenterlineFrame[] = [];
  let previousTangent = curve.getTangentAt(0).normalize();
  let normal = leastAlignedAxis(previousTangent)
    .addScaledVector(
      previousTangent,
      -leastAlignedAxis(previousTangent).dot(previousTangent),
    )
    .normalize();

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const tangent = curve.getTangentAt(t).normalize();
    if (index > 0) {
      const transport = new THREE.Quaternion().setFromUnitVectors(
        previousTangent,
        tangent,
      );
      normal.applyQuaternion(transport);
      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    }
    const binormal = tangent.clone().cross(normal).normalize();
    normal = binormal.clone().cross(tangent).normalize();
    frames.push({
      point: curve.getPointAt(t),
      tangent: tangent.clone(),
      normal: normal.clone(),
      binormal,
    });
    previousTangent = tangent;
  }
  return frames;
}

export function sampleFrame(path: CenterlinePath, t: number): CenterlineFrame {
  const position = THREE.MathUtils.clamp(t, 0, 1) * (path.frames.length - 1);
  return path.frames[Math.round(position)]!;
}

export function createHelicalCoat(options: {
  path: CenterlinePath;
  radius: number;
  pitch: number;
  strandCount: number;
  unitScale: number;
  unitShape: HelicalCoatUnitShape;
  quality: Quality;
  color?: number;
  name: string;
}): Omit<InstanceExplosion, 'distance'> {
  const unitsPerStrand = options.quality === 'high' ? 84 : 46;
  const total = options.strandCount * unitsPerStrand;
  const mesh = new THREE.InstancedMesh(
    coatGeometry(options.unitShape, options.unitScale, options.quality),
    standardMaterial(options.color ?? COLORS.capsomer),
    total,
  );
  mesh.name = options.name;
  const origins: THREE.Vector3[] = [];
  const directions: THREE.Vector3[] = [];
  const quaternions: THREE.Quaternion[] = [];
  const scales: THREE.Vector3[] = [];
  const matrix = new THREE.Matrix4();
  const localUp = new THREE.Vector3(0, 1, 0);
  let cursor = 0;
  for (let strand = 0; strand < options.strandCount; strand += 1) {
    for (let index = 0; index < unitsPerStrand; index += 1) {
      const t = index / (unitsPerStrand - 1);
      const frame = sampleFrame(options.path, t);
      const angle =
        (t * options.path.curve.getLength() * Math.PI * 2) / options.pitch +
        (strand / options.strandCount) * Math.PI * 2;
      const radial = frame.normal
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(frame.binormal, Math.sin(angle))
        .normalize();
      const origin = frame.point.clone().addScaledVector(radial, options.radius);
      const quaternion = new THREE.Quaternion()
        .setFromUnitVectors(localUp, frame.tangent)
        .multiply(new THREE.Quaternion().setFromAxisAngle(localUp, angle));
      const scale = new THREE.Vector3(1, 1, 1);
      matrix.compose(origin, quaternion, scale);
      mesh.setMatrixAt(cursor, matrix);
      origins.push(origin);
      directions.push(radial);
      quaternions.push(quaternion);
      scales.push(scale);
      cursor += 1;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  mesh.userData.centerlineArchetype = options.path.points;
  return { mesh, origins, directions, quaternions, scales };
}

export function createGenomeAlongPath(options: {
  path: CenterlinePath;
  kind: GenomePathKind;
  radius: number;
  pitch: number;
  quality: Quality;
  tubeRadius?: number;
  name: string;
}): THREE.Mesh {
  const samples = options.quality === 'high' ? 132 : 72;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const frame = sampleFrame(options.path, t);
    if (options.kind === 'central-path' || options.kind === 'centerline-following') {
      const offset =
        options.kind === 'centerline-following' ? options.radius * 0.12 : 0;
      return frame.point
        .clone()
        .addScaledVector(frame.normal, Math.sin(t * Math.PI * 5) * offset);
    }
    const angle = (t * options.path.curve.getLength() * Math.PI * 2) / options.pitch;
    return frame.point
      .clone()
      .addScaledVector(frame.normal, Math.cos(angle) * options.radius)
      .addScaledVector(frame.binormal, Math.sin(angle) * options.radius);
  });
  const genome = createTube(
    points,
    options.tubeRadius ?? 0.035,
    options.quality,
    false,
  );
  genome.name = options.name;
  return genome;
}

export function createTerminalStructures(options: {
  path: CenterlinePath;
  signatures: readonly TerminalStructureSignature[];
  bodyRadius: number;
  quality: Quality;
  name: string;
}): THREE.Group {
  const group = new THREE.Group();
  group.name = options.name;
  const material = standardMaterial(COLORS.receptor);
  for (const signature of options.signatures) {
    const ends = signature.end === 'both' ? ['start', 'end'] : [signature.end];
    for (const end of ends) {
      const frame =
        end === 'start' ? options.path.frames[0]! : options.path.frames.at(-1)!;
      const outward = frame.tangent.clone().multiplyScalar(end === 'start' ? -1 : 1);
      if (signature.kind === 'fiber') {
        for (let index = 0; index < signature.count; index += 1) {
          const angle = (index / signature.count) * Math.PI * 2;
          const radial = frame.normal
            .clone()
            .multiplyScalar(Math.cos(angle))
            .addScaledVector(frame.binormal, Math.sin(angle));
          const start = frame.point
            .clone()
            .addScaledVector(radial, options.bodyRadius * 0.28);
          const endPoint = start
            .clone()
            .addScaledVector(outward, signature.relativeLength)
            .addScaledVector(radial, options.bodyRadius * 0.85);
          const fiber = createCylinderBetween(
            start,
            endPoint,
            Math.max(0.025, options.bodyRadius * 0.045),
            material,
            options.quality === 'high' ? 7 : 5,
          );
          fiber.userData.endpointTangent = outward.toArray();
          group.add(fiber);
        }
        continue;
      }
      const length = Math.max(options.bodyRadius * 0.35, signature.relativeLength);
      const geometry =
        signature.kind === 'tail'
          ? new THREE.ConeGeometry(
              options.bodyRadius * 0.18,
              length,
              options.quality === 'high' ? 10 : 6,
            )
          : new THREE.SphereGeometry(
              options.bodyRadius * (signature.kind === 'protein-cluster' ? 0.72 : 0.58),
              options.quality === 'high' ? 14 : 8,
              options.quality === 'high' ? 10 : 6,
            );
      const object = new THREE.Mesh(geometry, material);
      object.position.copy(frame.point).addScaledVector(outward, length * 0.48);
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
      if (signature.kind !== 'tail') object.scale.y = 0.65;
      object.userData.endpointTangent = outward.toArray();
      group.add(object);
    }
  }
  return group;
}

function coatGeometry(
  shape: HelicalCoatUnitShape,
  scale: number,
  quality: Quality,
): THREE.BufferGeometry {
  const radial = quality === 'high' ? 7 : 5;
  if (shape === 'wedge-like') {
    return new THREE.CylinderGeometry(scale * 0.62, scale, scale * 2.1, radial);
  }
  if (shape === 'disc-like') {
    return new THREE.CylinderGeometry(scale, scale, scale * 0.58, radial);
  }
  if (shape === 'short-rod') {
    return new THREE.CapsuleGeometry(scale * 0.58, scale * 1.45, 2, radial);
  }
  return new THREE.CapsuleGeometry(scale, scale * 1.65, 3, radial);
}

function leastAlignedAxis(tangent: THREE.Vector3): THREE.Vector3 {
  const axes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
  ];
  return axes.reduce((best, axis) =>
    Math.abs(axis.dot(tangent)) < Math.abs(best.dot(tangent)) ? axis : best,
  );
}
