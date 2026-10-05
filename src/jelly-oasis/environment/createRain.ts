import {
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  ShaderMaterial,
} from 'three';
import { seededRandom } from './weather';

export function createRain(count: number) {
  const random = seededRandom(9031);
  const positions = new Float32Array(count * 6);
  const tips = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = (random() - 0.5) * 140;
    const y = (random() - 0.5) * 100;
    const z = (random() - 0.5) * 140;
    positions.set([x, y, z, x, y, z], i * 6);
    tips[i * 2 + 1] = 1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('tip', new Float32BufferAttribute(tips, 1));
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { elapsed: { value: 0 }, intensity: { value: 0 } },
    vertexShader: `attribute float tip; uniform float elapsed; varying float fade;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - elapsed * 45.0 + 50.0, 100.0) - 50.0;
        p.x += tip * 0.55; p.y -= tip * 3.0;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        fade = smoothstep(3.0, 12.0, -view.z) * (1.0 - smoothstep(65.0, 95.0, -view.z));
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `uniform float intensity; varying float fade;
      void main() { gl_FragColor = vec4(0.67, 0.78, 0.87, intensity * fade * 0.4);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const mesh = new LineSegments(geometry, material);
  mesh.name = 'OasisRain';
  mesh.frustumCulled = false;
  mesh.visible = false;
  return {
    mesh,
    count,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
