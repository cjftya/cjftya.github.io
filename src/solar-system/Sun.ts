import {
  AdditiveBlending,
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
    this.object.add(this.outerGlow, this.innerGlow, this.core, this.light);
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
    this.coreMaterial.dispose();
    this.innerGlowMaterial.dispose();
    this.outerGlowMaterial.dispose();
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
