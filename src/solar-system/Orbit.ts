import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineLoop,
  MathUtils,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import type { OrbitSettings } from '../data/Project';

export class Orbit {
  readonly object = new Group();

  private readonly geometry: BufferGeometry;
  private readonly material: LineBasicMaterial;
  private readonly flowGeometry = new BufferGeometry();
  private readonly flowMaterial: PointsMaterial;
  private readonly flowPosition = new Float32Array(3);
  private readonly radius: number;
  private readonly flowSpeed: number;
  private flowAngle = 0;
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
    this.radius = settings.radius;
    this.flowSpeed = 0.19 + settings.speed * 1.8;
    this.flowAngle = MathUtils.degToRad(settings.startAngle);
    this.highlightColor = new Color(highlightColor).lerp(new Color('#ffffff'), 0.28);
    this.material = new LineBasicMaterial({
      color: this.baseColor,
      transparent: true,
      opacity: 0.28,
    });
    this.flowGeometry.setAttribute(
      'position',
      new BufferAttribute(this.flowPosition, 3).setUsage(DynamicDrawUsage),
    );
    this.flowMaterial = new PointsMaterial({
      color: this.highlightColor,
      size: 0.095,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.object.rotation.z = MathUtils.degToRad(settings.inclination);
    this.object.add(
      new LineLoop(this.geometry, this.material),
      new Points(this.flowGeometry, this.flowMaterial),
    );
  }

  update(deltaSeconds: number, selected: boolean, hovered: boolean): void {
    const highlighted = selected || hovered;
    const targetOpacity = selected ? 0.72 : hovered ? 0.48 : 0.28;
    const colorMix = 1 - Math.exp(-deltaSeconds * 9);
    this.flowAngle += this.flowSpeed * deltaSeconds;
    this.flowPosition[0] = Math.cos(this.flowAngle) * this.radius;
    this.flowPosition[1] = 0;
    this.flowPosition[2] = Math.sin(this.flowAngle) * this.radius;
    this.flowGeometry.getAttribute('position').needsUpdate = true;

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
    this.flowMaterial.opacity = MathUtils.damp(
      this.flowMaterial.opacity,
      selected ? 0.92 : hovered ? 0.58 : 0.22,
      8,
      deltaSeconds,
    );
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.flowGeometry.dispose();
    this.flowMaterial.dispose();
  }
}
