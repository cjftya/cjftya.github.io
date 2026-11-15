import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  LineBasicMaterial,
  LineSegments,
  Vector3,
  type PerspectiveCamera,
} from 'three';

const SEGMENT_COUNT = 6;
const BACKGROUND_DISTANCE = 90;

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
  private secondsUntilLarge = this.randomBetween(35, 60);
  private durationSeconds = 0.8;
  private travelDistance = 18;
  private tailLength = 4.6;
  private peakOpacity = 0.62;

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

  update(deltaSeconds: number, camera: PerspectiveCamera): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.secondsUntilLarge -= deltaSeconds;
    if (this.activeElapsedSeconds === null) {
      this.secondsUntilNext -= deltaSeconds;
      if (this.secondsUntilLarge <= 0 || this.secondsUntilNext <= 0) {
        this.spawn(camera, this.secondsUntilLarge <= 0);
      }
      return;
    }

    this.activeElapsedSeconds += deltaSeconds;
    const progress = this.activeElapsedSeconds / this.durationSeconds;

    if (progress >= 1) {
      this.activeElapsedSeconds = null;
      this.material.opacity = 0;
      this.geometry.setDrawRange(0, 0);
      this.secondsUntilNext = this.getNextDelay();
      return;
    }

    this.updateSegments(progress);
    this.material.opacity = Math.sin(progress * Math.PI) * this.peakOpacity;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }

  private spawn(camera: PerspectiveCamera, large: boolean): void {
    // Snapshot the current view so the event begins on screen, including on phones
    // and while inspecting a planet. It remains in world space during its flight.
    this.object.position.copy(camera.position);
    this.object.quaternion.copy(camera.quaternion);
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * BACKGROUND_DISTANCE;
    const halfWidth = halfHeight * camera.aspect;
    const span = Math.min(halfHeight, halfWidth);
    const reverse = Math.random() < 0.5 ? -1 : 1;
    this.start.set(
      -reverse * this.randomBetween(0.35, 0.7) * halfWidth,
      this.randomBetween(0.35, 0.7) * halfHeight,
      -BACKGROUND_DISTANCE,
    );
    this.direction.set(reverse, -this.randomBetween(0.35, 0.65), 0).normalize();
    this.durationSeconds = large ? 1.5 : 0.8;
    this.travelDistance = span * (large ? 1.65 : 1.25);
    this.tailLength = span * (large ? 0.48 : 0.24);
    this.peakOpacity = large ? 0.72 : 0.58;
    if (large) {
      this.secondsUntilLarge = this.randomBetween(35, 60);
    }
    this.activeElapsedSeconds = 0;
    this.geometry.setDrawRange(0, SEGMENT_COUNT * 2);
    this.updateSegments(0);
  }

  private updateSegments(progress: number): void {
    const travelDistance = progress * this.travelDistance;
    this.head.copy(this.start).addScaledVector(this.direction, travelDistance);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const offset = (index / SEGMENT_COUNT) * this.tailLength;
      const nextOffset = ((index + 0.82) / SEGMENT_COUNT) * this.tailLength;
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
    const minimum = this.isCoarsePointer ? 9 : 6;
    const range = this.isCoarsePointer ? 7 : 6;
    return minimum + Math.random() * range;
  }

  private randomBetween(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }
}
