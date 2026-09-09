import * as THREE from 'three';
import { createChamberDescriptor } from '../../lab/chambers/descriptors';
import { sampleVelocityField } from '../../lab/physics/velocityField';
import type { LabSnapshot, Vec3Tuple } from '../../lab/types';
import type { RenderQuality } from '../quality/quality';

export class LabFlowMarkers {
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material = new THREE.PointsMaterial({
    color: 0x72f7e6,
    size: 0.075,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  private readonly points: THREE.Points;
  private positions: Vec3Tuple[] = [];
  private positionAttribute: THREE.BufferAttribute | null = null;
  private lastSimTime = 0;
  private quality: RenderQuality;

  constructor(scene: THREE.Scene, quality: RenderQuality) {
    this.quality = quality;
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.userData.ignoreCameraBounds = true;
    scene.add(this.points);
    this.reset();
  }

  setQuality(quality: RenderQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.reset();
  }

  update(snapshot: LabSnapshot): void {
    const delta = snapshot.simTime - this.lastSimTime;
    if (delta < 0 || delta > 0.5) this.reset();
    const step = Math.max(0, Math.min(0.08, delta));
    const chamber = createChamberDescriptor(snapshot.config.environment);
    if (step > 0) {
      this.positions = this.positions.map((position, index) => {
        const velocity = sampleVelocityField(
          snapshot.config.environment,
          position,
          chamber,
        );
        let next: Vec3Tuple = [
          position[0] + velocity[0] * step,
          position[1] + velocity[1] * step,
          position[2] + velocity[2] * step,
        ];
        if (
          outside(next, chamber.bounds.min, chamber.bounds.max) ||
          chamber.obstacles.some((box) => inside(next, box.min, box.max))
        )
          next = markerPosition(
            index,
            this.positions.length,
            snapshot.config.environment.flowDirection,
          );
        return next;
      });
    }
    this.lastSimTime = snapshot.simTime;
    const attribute = this.positionAttribute;
    if (attribute) {
      const values = attribute.array as Float32Array;
      this.positions.forEach((position, index) => values.set(position, index * 3));
      attribute.needsUpdate = true;
    }
    this.material.opacity = snapshot.status === 'running' ? 0.78 : 0.42;
  }

  dispose(): void {
    this.points.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  private reset(): void {
    const count =
      this.quality === 'performance' ? 72 : this.quality === 'enhanced' ? 180 : 120;
    this.positions = Array.from({ length: count }, (_, index) =>
      markerPosition(index, count, 1),
    );
    const values = new Float32Array(count * 3);
    this.positions.forEach((position, index) => values.set(position, index * 3));
    this.positionAttribute = new THREE.BufferAttribute(values, 3);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.lastSimTime = 0;
  }
}

function markerPosition(index: number, count: number, direction: -1 | 1): Vec3Tuple {
  const x = -5.7 + ((index * 2.399963) % 1) * 11.4;
  const y = -2.85 + (((index * 37) % count) / Math.max(1, count - 1)) * 5.7;
  const z = -2.1 + (((index * 61) % count) / Math.max(1, count - 1)) * 4.2;
  return [direction > 0 ? x : -x, y, z];
}

function outside(value: Vec3Tuple, min: Vec3Tuple, max: Vec3Tuple): boolean {
  return value.some((item, axis) => item < min[axis]! || item > max[axis]!);
}

function inside(value: Vec3Tuple, min: Vec3Tuple, max: Vec3Tuple): boolean {
  return value.every((item, axis) => item >= min[axis]! && item <= max[axis]!);
}
