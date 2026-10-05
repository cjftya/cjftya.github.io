import {
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { ENVIRONMENT_CONFIG, seededRandom } from './weather';

export function createSky() {
  const group = new Group();
  group.name = 'OasisSky';
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      zenith: { value: new Color() },
      horizon: { value: new Color() },
      sunColor: { value: new Color() },
      sunDirection: { value: new Vector3() },
      sunStrength: { value: 1 },
    },
    vertexShader: `varying vec3 direction;
      void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 direction;
      uniform vec3 zenith, horizon, sunColor, sunDirection;
      uniform float sunStrength;
      void main() {
        vec3 ray = normalize(direction);
        float heightBlend = smoothstep(-0.55, 0.85, ray.y);
        vec3 color = mix(horizon, zenith, heightBlend);
        float sunDot = max(0.0, dot(ray, sunDirection));
        float glow = pow(sunDot, 24.0) * 0.12;
        float disc = smoothstep(0.9992, 0.9997, sunDot);
        color += sunColor * (glow + disc * 0.8) * sunStrength;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const dome = new Mesh(new SphereGeometry(1400, 24, 12), material);
  dome.frustumCulled = false;
  dome.renderOrder = -100;
  group.add(dome);
  const random = seededRandom(1073);
  const points = new Float32Array(ENVIRONMENT_CONFIG.starCount * 3);
  for (let i = 0; i < ENVIRONMENT_CONFIG.starCount; i++) {
    const y = random() * 1.7 - 0.7;
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    points.set(
      [Math.cos(angle) * r * 1300, y * 1300, Math.sin(angle) * r * 1300],
      i * 3,
    );
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { brightness: { value: 0 }, pixelRatio: { value: 1 } },
    vertexShader: `uniform float pixelRatio; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 2.2 * pixelRatio; }`,
    fragmentShader: `uniform float brightness; void main() {
      float radius = length(gl_PointCoord - 0.5);
      float alpha = (1.0 - smoothstep(0.12, 0.5, radius)) * brightness;
      gl_FragColor = vec4(0.8, 0.86, 1.0, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = -90;
  group.add(stars);
  return {
    group,
    material,
    stars,
    starMaterial,
    dispose() {
      dome.geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    },
  };
}
