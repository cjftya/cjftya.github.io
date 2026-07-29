import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Points,
  PointsMaterial,
} from 'three';

interface PointFieldOptions {
  count: number;
  minRadius: number;
  maxRadius: number;
  seed: number;
  color: string;
  size: number;
  opacity: number;
}

interface PointField {
  points: Points<BufferGeometry, PointsMaterial>;
  geometry: BufferGeometry;
  material: PointsMaterial;
}

export class SpaceBackdrop {
  readonly object = new Group();

  private readonly farStars = this.createPointField({
    count: 680,
    minRadius: 42,
    maxRadius: 82,
    seed: 4101,
    color: '#dce6ff',
    size: 0.2,
    opacity: 0.82,
  });
  private readonly nearDust = this.createPointField({
    count: 160,
    minRadius: 16,
    maxRadius: 38,
    seed: 7303,
    color: '#8ea6d8',
    size: 0.075,
    opacity: 0.2,
  });
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  constructor() {
    this.object.add(this.farStars.points, this.nearDust.points);
  }

  update(deltaSeconds: number): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.farStars.points.rotation.y += deltaSeconds * 0.002;
    this.nearDust.points.rotation.y -= deltaSeconds * 0.006;
    this.nearDust.points.rotation.x += deltaSeconds * 0.0015;
  }

  dispose(): void {
    this.object.remove(this.farStars.points, this.nearDust.points);
    this.farStars.geometry.dispose();
    this.farStars.material.dispose();
    this.nearDust.geometry.dispose();
    this.nearDust.material.dispose();
  }

  private createPointField(options: PointFieldOptions): PointField {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(this.createSphericalPositions(options), 3),
    );

    const material = new PointsMaterial({
      color: options.color,
      size: options.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: options.opacity,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;

    return { points, geometry, material };
  }

  private createSphericalPositions(options: PointFieldOptions): Float32Array {
    const positions = new Float32Array(options.count * 3);
    const random = this.createSeededRandom(options.seed);
    const minRadiusCubed = options.minRadius ** 3;
    const radiusRangeCubed = options.maxRadius ** 3 - minRadiusCubed;

    for (let index = 0; index < options.count; index += 1) {
      const radius = Math.cbrt(minRadiusCubed + random() * radiusRangeCubed);
      const azimuth = random() * Math.PI * 2;
      const vertical = random() * 2 - 1;
      const horizontal = Math.sqrt(1 - vertical * vertical);
      const positionIndex = index * 3;

      positions[positionIndex] = radius * horizontal * Math.cos(azimuth);
      positions[positionIndex + 1] = radius * vertical;
      positions[positionIndex + 2] = radius * horizontal * Math.sin(azimuth);
    }

    return positions;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    };
  }
}
