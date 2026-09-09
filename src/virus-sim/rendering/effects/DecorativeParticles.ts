import * as THREE from 'three';
import type { DecorationLevel } from '../../observation/types';
import { QUALITY_SETTINGS, type RenderQuality } from '../quality/quality';

export class DecorativeParticles {
  readonly root = new THREE.Group();
  private readonly layers: THREE.Points[] = [];
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
    const opacity = level === 'rich' ? 1 : level === 'subtle' ? 0.52 : 0;
    for (const points of this.layers) {
      const material = points.material as THREE.ShaderMaterial;
      material.uniforms.uOpacity!.value =
        opacity * (points.userData.layerOpacity as number);
    }
  }

  update(elapsedSeconds: number): void {
    if (this.level === 'off' || this.paused) return;
    for (const points of this.layers) {
      const material = points.material as THREE.ShaderMaterial;
      material.uniforms.uTime!.value = elapsedSeconds;
    }
  }

  dispose(): void {
    this.disposeLayers();
    this.scene.remove(this.root);
  }

  private rebuild(quality: RenderQuality): void {
    this.disposeLayers();
    const base = QUALITY_SETTINGS[quality].particleCount;
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    const total = mobile
      ? Math.min(500, Math.max(220, base))
      : Math.min(1200, Math.max(650, base * 2));
    this.layers.push(
      createLayer(Math.round(total * 0.72), 6, 24, 0x78cbd0, 781, 2.4, 0.34),
      createLayer(Math.round(total * 0.28), 3, 11, 0xd4eff0, 1597, 6.2, 0.2),
    );
    this.root.add(...this.layers);
    this.setState(this.level, this.paused);
  }

  private disposeLayers(): void {
    for (const points of this.layers) {
      this.root.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    }
    this.layers.length = 0;
  }
}

function createLayer(
  count: number,
  minimumRadius: number,
  maximumRadius: number,
  color: number,
  initialSeed: number,
  pointSize: number,
  layerOpacity: number,
): THREE.Points {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  let state = initialSeed;
  const next = (): number => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const radius = minimumRadius + next() * (maximumRadius - minimumRadius);
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
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: layerOpacity },
      uPointSize: { value: pointSize },
    },
    vertexShader: `
      attribute float aPhase;
      uniform float uTime;
      uniform float uPointSize;
      varying float vPulse;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.18 + aPhase) * 0.12;
        p.x += cos(uTime * 0.11 + aPhase * 1.7) * 0.07;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPointSize * (280.0 / max(1.0, -mv.z));
        vPulse = 0.72 + 0.28 * sin(uTime * 0.31 + aPhase);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vPulse;
      void main() {
        vec2 p = gl_PointCoord - vec2(0.5);
        float radius = length(p);
        float alpha = smoothstep(0.5, 0.08, radius) * uOpacity * vPulse;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.ignoreCameraBounds = true;
  points.userData.layerOpacity = layerOpacity;
  return points;
}
