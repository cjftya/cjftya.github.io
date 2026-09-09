import * as THREE from 'three';
import type { DecorationLevel } from '../../observation/types';
import { QUALITY_SETTINGS, type RenderQuality } from '../quality/quality';

export class DecorativeParticles {
  readonly root = new THREE.Group();
  private points: THREE.Points | null = null;
  private level: DecorationLevel = 'subtle';
  private paused = false;

  constructor(
    private readonly scene: THREE.Scene,
    quality: RenderQuality,
  ) {
    this.root.name = 'decorative-particles';
    this.root.userData.ignoreCameraBounds = true;
    scene.add(this.root);
    this.rebuild(quality);
  }

  setQuality(quality: RenderQuality): void {
    this.rebuild(quality);
  }

  setState(level: DecorationLevel, paused: boolean): void {
    this.level = level;
    this.paused = paused;
    this.root.visible = level !== 'off';
  }

  update(elapsedSeconds: number): void {
    if (this.level === 'off' || this.paused || !this.points) return;
    const material = this.points.material as THREE.ShaderMaterial;
    material.uniforms.uTime!.value = elapsedSeconds;
  }

  dispose(): void {
    this.disposePoints();
    this.scene.remove(this.root);
  }

  private rebuild(quality: RenderQuality): void {
    this.disposePoints();
    const base = QUALITY_SETTINGS[quality].particleCount;
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    const count = mobile
      ? Math.min(180, Math.max(110, Math.round(base * 0.32)))
      : Math.min(320, Math.max(180, Math.round(base * 0.48)));
    this.points = createParticles(count);
    this.root.add(this.points);
    this.setState(this.level, this.paused);
  }

  private disposePoints(): void {
    if (!this.points) return;
    this.root.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.points = null;
  }
}

function createParticles(count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  let state = 781;
  const next = (): number => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const radius = 6 + next() * 14;
    const theta = next() * Math.PI * 2;
    const phi = Math.acos(2 * next() - 1);
    positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = radius * Math.cos(phi);
    positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);
    phases[index] = next() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x9bc9ca) },
      uOpacity: { value: 0.3 },
    },
    vertexShader: `
      attribute float aPhase;
      uniform float uTime;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.09 + aPhase) * 0.05;
        p.x += cos(uTime * 0.07 + aPhase * 1.4) * 0.035;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(1.55 * (10.0 / max(1.0, -mv.z)), 1.0, 2.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float alpha = (1.0 - smoothstep(0.38, 0.5, radius)) * uOpacity;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.ignoreCameraBounds = true;
  return points;
}
