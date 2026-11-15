import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from 'three';
import { seededRandom } from './weather';

export function createSnow(count: number) {
  const random = seededRandom(9032);
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < positions.length; i++) positions[i] = (random() - 0.5) * 100;
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      elapsed: { value: 0 },
      intensity: { value: 0 },
      pixelRatio: { value: 1 },
      windX: { value: 0 },
      windZ: { value: 0 },
    },
    vertexShader: `uniform float elapsed, pixelRatio, windX, windZ; varying float fade;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - elapsed * 3.0 + 50.0, 100.0) - 50.0;
        p.x = mod(p.x + elapsed * windX + 50.0, 100.0) - 50.0 + sin(elapsed + position.z) * 1.5;
        p.z = mod(p.z + elapsed * windZ + 50.0, 100.0) - 50.0;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        fade = smoothstep(2.0, 8.0, -view.z) * (1.0 - smoothstep(55.0, 85.0, -view.z));
        gl_PointSize = clamp(110.0 / max(1.0, -view.z), 1.0, 5.0) * pixelRatio;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `uniform float intensity; varying float fade;
      void main() {
        float alpha = (1.0 - smoothstep(0.2, 0.5, length(gl_PointCoord - 0.5))) * fade * intensity;
        gl_FragColor = vec4(0.93, 0.96, 1.0, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Points(geometry, material);
  mesh.name = 'OasisSnow';
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
