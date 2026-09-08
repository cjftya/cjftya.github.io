import * as THREE from 'three';
import { QUALITY_SETTINGS, type ExperienceQuality } from '../quality/quality';

export class FluidAmbience {
  private readonly root = new THREE.Group();
  private near: THREE.Points | null = null;
  private far: THREE.Points | null = null;

  constructor(private readonly scene: THREE.Scene) {
    this.root.name = 'fluid-ambience';
    this.scene.add(this.root);
    this.setQuality('standard');
  }

  setQuality(quality: ExperienceQuality): void {
    this.disposePoints();
    const settings = QUALITY_SETTINGS[quality];
    this.scene.fog = new THREE.FogExp2(0x06101d, settings.haze);
    this.far = createParticles(
      Math.round(settings.particleCount * 0.72),
      7,
      24,
      0x7aaebe,
      quality === 'performance' ? 0.026 : 0.034,
      0.3,
      781,
    );
    this.near = createParticles(
      Math.round(settings.particleCount * 0.28),
      3.4,
      10,
      0xb2d9d8,
      quality === 'enhanced' ? 0.075 : 0.058,
      0.16,
      1597,
    );
    this.near.userData.ignoreCameraBounds = true;
    this.far.userData.ignoreCameraBounds = true;
    this.root.add(this.far, this.near);
  }

  update(elapsedSeconds: number): void {
    if (this.far) {
      this.far.rotation.y = elapsedSeconds * 0.006;
      this.far.rotation.x = Math.sin(elapsedSeconds * 0.025) * 0.012;
    }
    if (this.near) {
      this.near.rotation.y = -elapsedSeconds * 0.012;
      this.near.position.y = Math.sin(elapsedSeconds * 0.11) * 0.08;
    }
  }

  dispose(): void {
    this.disposePoints();
    this.scene.remove(this.root);
    this.scene.fog = null;
  }

  private disposePoints(): void {
    for (const points of [this.near, this.far]) {
      if (!points) continue;
      this.root.remove(points);
      points.geometry.dispose();
      if (points.material instanceof THREE.Material) points.material.dispose();
    }
    this.near = null;
    this.far = null;
  }
}

function createParticles(
  count: number,
  minimumRadius: number,
  maximumRadius: number,
  color: number,
  size: number,
  opacity: number,
  initialSeed: number,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  let state = initialSeed;
  const next = (): number => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
  for (let index = 0; index < positions.length; index += 3) {
    const radius = minimumRadius + next() * (maximumRadius - minimumRadius);
    const theta = next() * Math.PI * 2;
    const phi = Math.acos(2 * next() - 1);
    positions[index] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index + 1] = radius * Math.cos(phi);
    positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}
