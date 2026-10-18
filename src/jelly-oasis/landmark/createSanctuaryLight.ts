import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
} from 'three';

/** Art-directed shafts through canopy openings. World-space geometry and depth
 * testing keep them inside the sanctuary from every camera angle. Not fog planes
 * placed over the screen, and not a claim of physically ray-marched scattering. */
export function createSanctuaryLight() {
  const material = new ShaderMaterial({
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.fog!),
      elapsed: { value: 0 },
      strength: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    blending: AdditiveBlending,
    fog: true,
    vertexShader: `
      varying vec2 shaftUv;
      #include <fog_pars_vertex>
      void main() {
        shaftUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec2 shaftUv;
      uniform float elapsed, strength;
      #include <fog_pars_fragment>
      void main() {
        float across = abs(shaftUv.x * 2. - 1.);
        float edge = pow(1. - smoothstep(.0, 1., across), 2.);
        float ends = smoothstep(0., .19, shaftUv.y) * (1.-smoothstep(.78, 1., shaftUv.y));
        float filaments = .65 + .35 * pow(.5 + .5 * sin(shaftUv.x * 31.
          + sin(shaftUv.y * 6. + elapsed * .08)), 3.);
        gl_FragColor = vec4(mix(vec3(.18,.62,.64),vec3(.72,.84,.62),shaftUv.y),
          edge * ends * filaments * strength);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const mesh = new Mesh(new BufferGeometry(), material);
  mesh.name = 'CanopyLightShafts';
  let disposed = false;
  return {
    mesh,
    place(ground: (x: number, z: number) => number) {
      if (disposed) return;
      const positions: number[] = [],
        uvs: number[] = [];
      // Unequal openings form a broken light rhythm around the tree silhouette.
      for (const [x, z, height, width] of [
        [-32, -31, 48, 5],
        [-2, -36, 58, 7],
        [19, -19, 43, 4],
        [-34, 4, 35, 3],
        [14, 9, 31, 3],
      ] as const) {
        const y = ground(x, z) + 0.6;
        for (let side = 0; side < 2; side++) {
          const angle = (side * Math.PI) / 2 + 0.35;
          const dx = Math.cos(angle) * width,
            dz = Math.sin(angle) * width;
          const corners = [
            [x - dx, y, z - dz],
            [x + dx, y, z + dz],
            [x + 7 + dx * 0.32, y + height, z - 5 + dz * 0.32],
            [x + 7 - dx * 0.32, y + height, z - 5 - dz * 0.32],
          ];
          const tex = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ];
          for (const i of [0, 1, 2, 0, 2, 3]) {
            positions.push(...corners[i]!);
            uvs.push(...tex[i]!);
          }
        }
      }
      mesh.geometry.dispose();
      mesh.geometry = new BufferGeometry();
      mesh.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      mesh.geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      mesh.geometry.computeBoundingSphere();
    },
    update(elapsed: number, night: number, cloudDarkness: number) {
      if (disposed) return;
      material.uniforms.elapsed!.value = elapsed;
      material.uniforms.strength!.value =
        (0.12 + night * 0.12) * (1 - cloudDarkness * 0.7);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mesh.removeFromParent();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
