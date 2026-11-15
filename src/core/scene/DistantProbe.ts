import {
  BoxGeometry,
  BufferAttribute,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
  type BufferGeometry,
  type PerspectiveCamera,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function createProbeHull(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const add = (geometry: BufferGeometry, color: string): void => {
    const tint = new Color(color);
    const colors = new Float32Array(geometry.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i);
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    parts.push(geometry);
  };
  add(new BoxGeometry(0.58, 0.4, 0.45), '#c2cbd4');
  add(new BoxGeometry(0.3, 0.28, 0.47), '#b59866');
  for (const side of [-1, 1]) {
    add(new BoxGeometry(0.9, 0.035, 0.55).translate(side * 0.9, 0, 0), '#466684');
    add(new BoxGeometry(0.38, 0.045, 0.05).translate(side * 0.42, 0, 0), '#a5aeb8');
  }
  add(new CylinderGeometry(0.28, 0.07, 0.15, 6).translate(0, 0.3, 0), '#c8d0d7');
  add(new CylinderGeometry(0.015, 0.015, 0.28, 4).translate(0, 0.5, 0), '#b59866');
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (merged === null) throw new Error('Could not assemble the distant probe.');
  return merged;
}

export class DistantProbe {
  readonly object = new Group();
  private readonly hull = new Mesh(
    createProbeHull(),
    new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }),
  );
  private readonly beacon = new Mesh(
    new IcosahedronGeometry(0.055, 0),
    new MeshBasicMaterial({
      color: '#abd9d1',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    }),
  );
  private readonly skyOffset = new Vector3();
  private initialized = false;
  private elapsed = 0;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches;

  constructor() {
    this.object.name = 'distant-probe';
    this.beacon.position.set(0.22, 0.18, 0.24);
    this.hull.add(this.beacon);
    this.hull.rotation.set(0.4, -0.35, -0.3);
    this.object.add(this.hull);
  }

  update(deltaSeconds: number, camera: PerspectiveCamera): void {
    if (!this.initialized) {
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * 80;
      this.skyOffset.set(-halfHeight * camera.aspect * 0.7, halfHeight * 0.48, -80);
      this.skyOffset.applyQuaternion(camera.quaternion).setLength(85);
      this.initialized = true;
    }
    // A distant sky landmark: zooming never brings it into the foreground.
    this.object.position.copy(camera.position).add(this.skyOffset);
    if (this.reducedMotion) return;
    this.elapsed += deltaSeconds;
    this.hull.rotation.y = -0.35 + Math.sin(this.elapsed * 0.06) * 0.12;
    this.hull.rotation.z = -0.3 + Math.sin(this.elapsed * 0.045) * 0.06;
    const signal = Math.max(0, Math.cos((this.elapsed * Math.PI) / 3));
    this.beacon.material.opacity = 0.2 + Math.pow(signal, 8) * 0.55;
  }

  dispose(): void {
    this.hull.geometry.dispose();
    this.hull.material.dispose();
    this.beacon.geometry.dispose();
    this.beacon.material.dispose();
    this.object.clear();
  }
}
