import {
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  MathUtils,
  Vector3,
} from 'three';
import type { OrbitSettings } from '../data/Project';

export class Orbit {
  readonly object = new Group();

  private readonly geometry: BufferGeometry;
  private readonly material: LineBasicMaterial;

  constructor(settings: OrbitSettings) {
    const segments = 96;
    const points: Vector3[] = [];

    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      points.push(
        new Vector3(
          Math.cos(angle) * settings.radius,
          0,
          Math.sin(angle) * settings.radius,
        ),
      );
    }

    this.geometry = new BufferGeometry().setFromPoints(points);
    this.material = new LineBasicMaterial({
      color: new Color('#55607a'),
      transparent: true,
      opacity: 0.34,
    });
    this.object.rotation.z = MathUtils.degToRad(settings.inclination);
    this.object.add(new LineLoop(this.geometry, this.material));
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
