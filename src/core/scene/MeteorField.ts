import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  LineBasicMaterial,
  LineSegments,
  Vector3,
} from 'three';

const SEGMENT_COUNT = 6;
const METEOR_DURATION_SECONDS = 0.8;

export class MeteorField {
  readonly object: LineSegments<BufferGeometry, LineBasicMaterial>;

  private readonly geometry = new BufferGeometry();
  private readonly material = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly positions = new Float32Array(SEGMENT_COUNT * 2 * 3);
  private readonly colors = new Float32Array(SEGMENT_COUNT * 2 * 3);
  private readonly start = new Vector3();
  private readonly direction = new Vector3();
  private readonly head = new Vector3();
  private readonly segmentStart = new Vector3();
  private readonly segmentEnd = new Vector3();
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private readonly isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  private activeElapsedSeconds: number | null = null;
  private secondsUntilNext = this.getNextDelay();

  constructor() {
    this.geometry.setAttribute(
      'position',
      new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage),
    );
    this.geometry.setAttribute('color', new BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, 0);
    this.setSegmentColors();

    this.object = new LineSegments(this.geometry, this.material);
    this.object.frustumCulled = false;
  }

  update(deltaSeconds: number): void {
    if (this.prefersReducedMotion) {
      return;
    }

    if (this.activeElapsedSeconds === null) {
      this.secondsUntilNext -= deltaSeconds;

      if (this.secondsUntilNext <= 0) {
        this.spawn();
      }
      return;
    }

    this.activeElapsedSeconds += deltaSeconds;
    const progress = this.activeElapsedSeconds / METEOR_DURATION_SECONDS;

    if (progress >= 1) {
      this.activeElapsedSeconds = null;
      this.material.opacity = 0;
      this.geometry.setDrawRange(0, 0);
      this.secondsUntilNext = this.getNextDelay();
      return;
    }

    this.updateSegments(progress);
    this.material.opacity = Math.sin(progress * Math.PI) * 0.78;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }

  private spawn(): void {
    this.start.set(
      this.randomBetween(-11, 6),
      this.randomBetween(5, 11),
      this.randomBetween(-6, 5),
    );
    this.direction
      .set(this.randomBetween(0.65, 1), this.randomBetween(-0.62, -0.35), -0.08)
      .normalize();
    this.activeElapsedSeconds = 0;
    this.geometry.setDrawRange(0, SEGMENT_COUNT * 2);
    this.updateSegments(0);
  }

  private updateSegments(progress: number): void {
    const travelDistance = progress * 18;
    this.head.copy(this.start).addScaledVector(this.direction, travelDistance);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const offset = (index / SEGMENT_COUNT) * 4.6;
      const nextOffset = ((index + 0.82) / SEGMENT_COUNT) * 4.6;
      this.segmentStart.copy(this.head).addScaledVector(this.direction, -offset);
      this.segmentEnd.copy(this.head).addScaledVector(this.direction, -nextOffset);

      const positionIndex = index * 6;
      this.segmentStart.toArray(this.positions, positionIndex);
      this.segmentEnd.toArray(this.positions, positionIndex + 3);
    }

    const positionAttribute = this.geometry.getAttribute('position');
    positionAttribute.needsUpdate = true;
  }

  private setSegmentColors(): void {
    const headColor = new Color('#eef6ff');

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const strength = 1 - index / SEGMENT_COUNT;
      const color = headColor.clone().multiplyScalar(strength * strength);
      const colorIndex = index * 6;
      color.toArray(this.colors, colorIndex);
      color.multiplyScalar(0.72).toArray(this.colors, colorIndex + 3);
    }
  }

  private getNextDelay(): number {
    const minimum = this.isCoarsePointer ? 14 : 9;
    const range = this.isCoarsePointer ? 12 : 10;
    return minimum + Math.random() * range;
  }

  private randomBetween(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }
}
