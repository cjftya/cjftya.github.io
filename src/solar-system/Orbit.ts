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
  private readonly baseColor = new Color('#55607a');
  private readonly highlightColor: Color;

  constructor(settings: OrbitSettings, highlightColor: string) {
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
    this.highlightColor = new Color(highlightColor).lerp(new Color('#ffffff'), 0.28);
    this.material = new LineBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.28,
    });
    this.object.rotation.z = MathUtils.degToRad(settings.inclination);
    this.object.add(new LineLoop(this.geometry, this.material));
  }

  update(deltaSeconds: number, selected: boolean, hovered: boolean): void {
    const highlighted = selected || hovered;
    const targetOpacity = selected ? 0.72 : hovered ? 0.48 : 0.28;
    const colorMix = 1 - Math.exp(-deltaSeconds * 9);

    this.material.opacity = MathUtils.damp(
      this.material.opacity,
      targetOpacity,
      9,
      deltaSeconds,
    );
    this.material.color.lerp(
      highlighted ? this.highlightColor : this.baseColor,
      colorMix,
    );
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
