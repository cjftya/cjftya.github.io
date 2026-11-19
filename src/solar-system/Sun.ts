import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import type { StarProfile } from '../data/Project';
import { createCoronaGeometry } from './starSurface';

const vertexShader = /* glsl */ `
  varying vec3 vSurface;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    vSurface = normalize(position);
    vNormalDirection = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uPatternScale;
  uniform float uFlowSpeed;
  uniform vec3 uBaseColor;
  uniform vec3 uMiddleColor;
  uniform vec3 uHotColor;

  varying vec3 vSurface;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  float hash(vec3 point) {
    return fract(sin(dot(point, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec3 point) {
    vec3 cell = floor(point);
    vec3 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);

    float n000 = hash(cell);
    float n100 = hash(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash(cell + vec3(1.0, 1.0, 1.0));

    float nearZ = mix(
      mix(n000, n100, fraction.x),
      mix(n010, n110, fraction.x),
      fraction.y
    );
    float farZ = mix(
      mix(n001, n101, fraction.x),
      mix(n011, n111, fraction.x),
      fraction.y
    );
    return mix(nearZ, farZ, fraction.z);
  }

  void main() {
    float travel = uTime * uFlowSpeed;
    vec3 seedOffset = vec3(uSeed * 0.013, uSeed * 0.007, -uSeed * 0.011);
    vec3 flow = vec3(travel, -travel * 0.72, travel * 0.46);
    float broad = noise(vSurface * uPatternScale + seedOffset + flow);
    float detail = noise(
      vSurface * (uPatternScale * 2.15) - seedOffset * 0.37 - flow * 1.4
    );
    float convection = sin(
      (vSurface.y + broad * 0.34) * uPatternScale * 3.2 +
      travel * 5.0 +
      uSeed * 0.021
    ) * 0.5 + 0.5;
    float pattern = clamp(broad * 0.52 + detail * 0.24 + convection * 0.24, 0.0, 1.0);
    vec3 color = mix(uBaseColor, uMiddleColor, smoothstep(0.18, 0.7, pattern));
    color = mix(color, uHotColor, smoothstep(0.68, 0.96, pattern));

    float facing = max(
      dot(normalize(vNormalDirection), normalize(vViewDirection)),
      0.0
    );
    float limbGlow = pow(1.0 - facing, 2.2);
    color += uHotColor * limbGlow * 0.2;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class Sun {
  readonly object = new Group();

  private readonly geometry = new SphereGeometry(1.15, 32, 24);
  private readonly timeUniform = { value: 0 };
  private readonly seedUniform = { value: 0 };
  private readonly patternScaleUniform = { value: 4 };
  private readonly flowSpeedUniform = { value: 0 };
  private readonly baseColorUniform = { value: new Color('#f6a85f') };
  private readonly middleColorUniform = { value: new Color('#ffd27d') };
  private readonly hotColorUniform = { value: new Color('#fff4c7') };
  private readonly coreMaterial = new ShaderMaterial({
    uniforms: {
      uTime: this.timeUniform,
      uSeed: this.seedUniform,
      uPatternScale: this.patternScaleUniform,
      uFlowSpeed: this.flowSpeedUniform,
      uBaseColor: this.baseColorUniform,
      uMiddleColor: this.middleColorUniform,
      uHotColor: this.hotColorUniform,
    },
    vertexShader,
    fragmentShader,
  });
  private readonly innerGlowMaterial = new MeshBasicMaterial({
    color: '#ff9e6d',
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly outerGlowMaterial = new MeshBasicMaterial({
    color: '#ff9e6d',
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly core = new Mesh(this.geometry, this.coreMaterial);
  private readonly innerGlow = new Mesh(
    createCoronaGeometry(0, 0, 0),
    this.innerGlowMaterial,
  );
  private readonly outerGlow = new Mesh(
    createCoronaGeometry(0, 0, 173),
    this.outerGlowMaterial,
  );
  private readonly wind = this.createStellarWind();
  private readonly light = new PointLight('#ffe0ad', 105, 82, 1.45);
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private elapsedSeconds = 0;
  private pulseAmount = 0;
  private innerGlowScale = 1.62;
  private outerGlowScale = 2.18;
  private coronaOpacity = 0.14;

  constructor() {
    this.innerGlow.scale.setScalar(this.innerGlowScale);
    this.outerGlow.scale.setScalar(this.outerGlowScale);
    this.outerGlow.renderOrder = -1;
    this.object.add(this.outerGlow, this.innerGlow, this.core, this.light, this.wind);
    this.wind.visible = !this.prefersReducedMotion;
  }

  setProfile(profile: StarProfile): void {
    this.seedUniform.value = profile.seed;
    this.patternScaleUniform.value = profile.patternScale;
    this.flowSpeedUniform.value = profile.flowSpeed;
    this.baseColorUniform.value.set(profile.colors.base);
    this.middleColorUniform.value.set(profile.colors.middle);
    this.hotColorUniform.value.set(profile.colors.hot);
    this.pulseAmount = profile.pulseAmount;
    this.innerGlowScale = profile.corona.innerScale;
    this.outerGlowScale = profile.corona.outerScale;
    this.coronaOpacity = profile.corona.opacity;
    this.innerGlowMaterial.color.set(profile.corona.color);
    this.outerGlowMaterial.color
      .set(profile.corona.color)
      .lerp(new Color(profile.colors.base), 0.34);
    this.light.color
      .set(profile.colors.middle)
      .lerp(new Color(profile.colors.hot), 0.48);

    this.innerGlow.geometry.dispose();
    this.outerGlow.geometry.dispose();
    this.innerGlow.geometry = createCoronaGeometry(
      profile.seed,
      profile.corona.irregularity,
      0,
    );
    this.outerGlow.geometry = createCoronaGeometry(
      profile.seed,
      profile.corona.irregularity * 1.35,
      173,
    );
    this.applyPulse(0);
  }

  update(deltaSeconds: number): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    this.timeUniform.value = this.elapsedSeconds;
    const pulse = Math.sin(this.elapsedSeconds * 1.15 + this.seedUniform.value * 0.01);
    this.applyPulse(pulse);
    this.innerGlow.rotation.y += deltaSeconds * (0.018 + this.flowSpeedUniform.value);
    this.innerGlow.rotation.x += deltaSeconds * 0.006;
    this.outerGlow.rotation.y -=
      deltaSeconds * (0.012 + this.flowSpeedUniform.value * 0.6);
  }

  dispose(): void {
    this.geometry.dispose();
    this.innerGlow.geometry.dispose();
    this.outerGlow.geometry.dispose();
    this.wind.geometry.dispose();
    this.wind.material.dispose();
    this.coreMaterial.dispose();
    this.innerGlowMaterial.dispose();
    this.outerGlowMaterial.dispose();
  }

  private createStellarWind(): Mesh<BufferGeometry, ShaderMaterial> {
    const positions: number[] = [];
    const particles: number[] = [];
    for (let index = 0; index < 24; index += 1) {
      const speed = ((index * 17) % 24) / 24;
      // Local triangle coordinates: forward tip, then the two rear corners.
      const corners = [[1, 0], [-0.6, 0.55], [-0.6, -0.55]];
      if (speed > 0.75) {
        corners.push([-0.6, 0.25], [-2.1, 0], [-0.6, -0.25]);
      }
      for (const [forward, across] of corners) {
        positions.push(forward, across, 0);
        particles.push(index, speed);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('particle', new Float32BufferAttribute(particles, 2));
    const material = new ShaderMaterial({
      side: DoubleSide,
      uniforms: {
        uTime: this.timeUniform,
        uSeed: this.seedUniform,
        uColor: this.middleColorUniform,
      },
      vertexShader: `
        attribute vec2 particle;
        uniform float uTime;
        uniform float uSeed;
        varying float vShade;

        void main() {
          float progress = uTime * (0.17 + 0.09 * particle.y) + particle.x * 0.618034;
          float age = fract(progress);
          float path = particle.x + floor(progress) * 0.73 + uSeed * 0.001;
          float latitude = 1.65 * (fract(path * 0.381966 + 0.5) - 0.5);
          float angle = path * 2.39996 + 0.40 * age * (2.0 - age);
          float circle = sqrt(1.0 - latitude * latitude);
          vec3 radial = vec3(circle * cos(angle), latitude, circle * sin(angle));
          float radius = 1.12 + age * (1.85 + particle.y * 0.65);
          vec3 tangent = vec3(-radial.z, 0.0, radial.x);
          vec3 velocity = radial * (1.85 + particle.y * 0.65)
                        + tangent * radius * 0.80 * (1.0 - age);
          vec4 center = modelViewMatrix * vec4(radial * radius, 1.0);
          vec3 motion = mat3(modelViewMatrix) * velocity;
          vec2 projected = motion.xy - center.xy * motion.z / min(center.z, -0.001);
          vec2 forward = normalize(projected + vec2(0.00001, 0.0));
          vec2 across = vec2(-forward.y, forward.x);
          float size = clamp(-center.z * 0.0028 / projectionMatrix[1][1], 0.046, 0.16);
          size *= smoothstep(0.0, 0.10, age) * (1.0 - smoothstep(0.67, 1.0, age));
          center.xy += (position.x * forward + position.y * across) * size;
          gl_Position = projectionMatrix * center;
          vShade = 0.65 + 0.25 * particle.y;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vShade;
        void main() {
          gl_FragColor = vec4(uColor * vShade, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const wind = new Mesh(geometry, material);
    // Positions are expanded around the star by the vertex shader.
    wind.frustumCulled = false;
    return wind;
  }

  private applyPulse(pulse: number): void {
    this.core.scale.setScalar(1 + pulse * this.pulseAmount);
    this.innerGlow.scale.setScalar(
      this.innerGlowScale + pulse * this.pulseAmount * 1.5,
    );
    this.outerGlow.scale.setScalar(
      this.outerGlowScale + pulse * this.pulseAmount * 2.4,
    );
    this.innerGlowMaterial.opacity = this.coronaOpacity + pulse * 0.01;
    this.outerGlowMaterial.opacity = this.coronaOpacity * 0.4 + pulse * 0.006;
  }
}
