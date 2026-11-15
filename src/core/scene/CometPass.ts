import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type PerspectiveCamera,
} from 'three';

const PASS_DURATION = 18;
const SEGMENTS = 12;

function createTail(): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const tint = new Color('#8fbbc9');
  const vertex = (t: number, edge: number): void => {
    positions.push(-t * 7, t * t * 0.6 + edge * (0.025 + t * 0.2), 0);
    tint
      .clone()
      .multiplyScalar(Math.pow(1 - t, 2))
      .toArray(colors, colors.length);
  };
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = i / SEGMENTS;
    const b = (i + 1) / SEGMENTS;
    vertex(a, -1);
    vertex(b, -1);
    vertex(a, 1);
    vertex(a, 1);
    vertex(b, -1);
    vertex(b, 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  return geometry;
}

export class CometPass {
  readonly object = new Group();
  private readonly body = new Group();
  private readonly tail = new Mesh(
    createTail(),
    new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      forceSinglePass: true,
      toneMapped: false,
    }),
  );
  private readonly nucleus = new Mesh(
    new IcosahedronGeometry(0.065, 0),
    new MeshBasicMaterial({
      color: '#d6e8e8',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    }),
  );
  private readonly start = new Vector3();
  private readonly end = new Vector3();
  private elapsed: number | null = null;
  private delay = 60 + Math.random() * 40;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches;

  constructor() {
    this.object.name = 'distant-comet';
    this.object.visible = false;
    this.body.add(this.tail, this.nucleus);
    this.object.add(this.body);
  }

  get active(): boolean {
    return this.elapsed !== null;
  }

  update(deltaSeconds: number, camera: PerspectiveCamera, allowStart = true): void {
    if (this.reducedMotion) return;
    if (this.elapsed === null) {
      this.delay -= deltaSeconds;
      if (this.delay <= 0 && allowStart) this.begin(camera);
      return;
    }
    this.elapsed += deltaSeconds;
    const progress = Math.min(this.elapsed / PASS_DURATION, 1);
    if (progress >= 1) {
      this.object.visible = false;
      this.elapsed = null;
      this.delay = 100 + Math.random() * 80;
      return;
    }
    this.body.position.lerpVectors(this.start, this.end, progress);
    const fade = Math.min(progress / 0.15, (1 - progress) / 0.2, 1);
    this.tail.material.opacity = fade * 0.28;
    this.nucleus.material.opacity = fade * 0.65;
  }

  dispose(): void {
    this.tail.geometry.dispose();
    this.tail.material.dispose();
    this.nucleus.geometry.dispose();
    this.nucleus.material.dispose();
    this.object.clear();
  }

  private begin(camera: PerspectiveCamera): void {
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * 90;
    const halfWidth = halfHeight * camera.aspect;
    this.object.position.copy(camera.position);
    this.object.quaternion.copy(camera.quaternion);
    this.start.set(-halfWidth * 0.85, halfHeight * 0.68, -90);
    this.end.set(halfWidth * 0.85, halfHeight * 0.3, -90);
    this.body.rotation.z = Math.atan2(
      this.end.y - this.start.y,
      this.end.x - this.start.x,
    );
    // Narrow viewports keep the same modest angular tail size relative to the scene.
    this.body.scale.setScalar(Math.min(camera.aspect, 1));
    this.body.position.copy(this.start);
    this.tail.material.opacity = 0;
    this.nucleus.material.opacity = 0;
    this.elapsed = 0;
    this.object.visible = true;
  }
}
