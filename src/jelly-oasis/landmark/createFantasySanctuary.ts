import type { Matrix4 } from 'three';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Points,
  ShaderMaterial,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { polygonDistance } from '../terrain/excavateTerrain';
import { sampleTime } from '../environment/timeOfDay';
import type { LayoutGuide } from './landmarkConfig';

// Asymmetric colonies frame the lake; the arch opening stays unobstructed.
export const CRYSTAL_COLONIES = [
  { x: -22, z: 11, height: 7.8, radius: 3.7, count: 9, palette: 0 },
  { x: 22, z: -16, height: 5.8, radius: 3.0, count: 7, palette: 1 },
  { x: -29, z: -23, height: 5.3, radius: 2.8, count: 7, palette: 0 },
  { x: 18, z: 20, height: 4.1, radius: 2.6, count: 6, palette: 0 },
  { x: -42, z: 5, height: 3.6, radius: 2.4, count: 5, palette: 1 },
  { x: 12, z: -37, height: 4.6, radius: 2.7, count: 6, palette: 1 },
] as const;
const palettes = ['#a582e2', '#65d0c7'];
const fract = (n: number) => n - Math.floor(n);
const noise = (n: number) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** Six-sided, shouldered crystals with a slanted tip and flat face shading. */
function crystalGeometry(): BufferGeometry {
  const positions: number[] = [],
    colors: number[] = [];
  const ring = (side: number, y: number, radius: number) => {
    const a = (side * Math.PI) / 3;
    return [Math.cos(a) * radius + y * 0.08, y, Math.sin(a) * radius];
  };
  function tri(a: number[], b: number[], c: number[], shade: number) {
    positions.push(...a, ...b, ...c);
    for (const p of [a, b, c]) {
      const light = shade * (0.62 + p[1]! * 0.38);
      colors.push(light, light, light);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = ring(i, 0, 0.78),
      b = ring(i + 1, 0, 0.78);
    const c = ring(i, 0.73 + 0.05 * Math.sin(i), 1);
    const d = ring(i + 1, 0.73 + 0.05 * Math.sin(i + 1), 1);
    const shade = [0.8, 1, 0.72, 0.9, 0.65, 0.94][i]!;
    tri(a, c, b, shade);
    tri(b, c, d, shade);
    tri(c, [0.24, 1, -0.1], d, Math.min(1, shade + 0.1));
    tri(a, b, [0, 0, 0], 0.55);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

const particleVertex = /* glsl */ `
attribute float phase;
attribute float size;
attribute vec3 tint;
uniform float elapsed;
uniform float night;
uniform float viewportHeight;
uniform float drift;
varying vec3 vTint;
varying float vOpacity;
void main() {
  vec3 p = position;
  p.x += sin(elapsed * .24 + phase) * drift;
  p.z += cos(elapsed * .19 + phase * 1.7) * drift;
  p.y += sin(elapsed * .31 + phase * 2.) * drift * .55;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(size * viewportHeight * projectionMatrix[1][1] / max(1., -mv.z), 1., 112.);
  vTint = tint;
  vOpacity = (.30 + .70 * night) * (.78 + .22 * sin(elapsed * .75 + phase));
}`;
const particleFragment = /* glsl */ `
uniform float halo;
varying vec3 vTint;
varying float vOpacity;
void main() {
  vec2 p = gl_PointCoord * 2. - 1.;
  float r = length(p);
  if (r > 1.) discard;
  float glow = exp(-r*r*6.) * (1.-smoothstep(.65,1.,r));
  float core = exp(-r*r*65.);
  float alpha = mix(glow * .65 + core * .6, glow * .16, halo) * vOpacity;
  gl_FragColor = vec4(vTint * mix(2.5, 1., halo), alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createFantasySanctuary(
  content: Group,
  pond: LayoutGuide,
  mobile = false,
) {
  const group = new Group();
  group.name = 'FantasySanctuary';
  content.add(group);
  const crystalMaterials = palettes.map((color) => {
    const material = new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.26,
      vertexColors: true,
      flatShading: true,
      roughness: 0.32,
      metalness: 0.12,
    });
    // Three r185 uses vec4 vColor. Keep RGB-only emission and visible facets.
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb * vColor.rgb;',
      );
    };
    material.customProgramCacheKey = () => 'oasis-faceted-crystal-v1';
    return material;
  });
  const stoneMaterial = new MeshStandardMaterial({
    color: '#7b8580',
    flatShading: true,
    roughness: 0.95,
  });
  const mossMaterial = new MeshStandardMaterial({
    color: '#668b61',
    flatShading: true,
    roughness: 1,
  });
  const flowerMaterial = new MeshStandardMaterial({
    color: 'white',
    emissive: '#7161a5',
    emissiveIntensity: 0.1,
    flatShading: true,
    roughness: 0.8,
  });
  const particleMaterials = [0, 1].map(
    (halo) =>
      new ShaderMaterial({
        uniforms: {
          elapsed: { value: 0 },
          night: { value: 0 },
          viewportHeight: { value: 800 },
          drift: { value: halo ? 0 : 0.65 },
          halo: { value: halo },
        },
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
      }),
  );
  const treeLight = new PointLight('#97cbd7', 0, 52, 2);
  const crystalLight = mobile ? null : new PointLight('#b19ade', 0, 24, 2);
  const mistMaterial = new ShaderMaterial({
    uniforms: { elapsed: { value: 0 }, opacity: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float elapsed; uniform float opacity;
      void main() {
        vec2 p = vUv * 2. - 1.;
        float edge = 1.-smoothstep(.2,1.,length(p));
        float wisps = .55+.22*sin(p.x*7.+sin(p.y*5.)+elapsed*.07)+.18*cos(p.y*8.-elapsed*.05);
        gl_FragColor=vec4(.48,.70,.72, edge*wisps*opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const owned: BufferGeometry[] = [];
  let disposed = false,
    elapsed = 0,
    previousNight = -1;
  let anchors: { x: number; y: number; z: number; height: number }[] = [];
  let particleCount = 0;
  function clear() {
    group.traverse((o) => {
      if (o instanceof InstancedMesh) o.dispose();
    });
    group.clear();
    owned.splice(0).forEach((g) => g.dispose());
  }
  function place(ground: (x: number, z: number) => number, waterY: number) {
    if (disposed) return;
    clear();
    anchors = [];
    const shards: BufferGeometry[][] = [[], []];
    const source = crystalGeometry();
    const dummy = new Object3D();
    const rocks: Matrix4[] = [],
      moss: Matrix4[] = [],
      flowers: Matrix4[] = [];
    const flowerColors: Color[] = [];
    const glowPositions: number[] = [],
      glowSizes: number[] = [],
      glowColors: number[] = [];
    CRYSTAL_COLONIES.forEach((colony, index) => {
      const { x, z, height, radius, count, palette } = colony;
      const y = ground(x, z);
      anchors.push({ x, y, z, height });
      const tint = new Color(palettes[palette]);
      for (let j = 0; j < count; j++) {
        const angle = j * 2.39996 + index * 0.83;
        const r = j === 0 ? 0 : radius * (0.45 + noise(j + index * 13) * 0.55);
        const px = x + Math.cos(angle) * r,
          pz = z + Math.sin(angle) * r * 0.7;
        const h = height * (j === 0 ? 1 : 0.24 + noise(j * 7 + index) * 0.4);
        const width = h * (0.19 + noise(j * 4 + index) * 0.055);
        const floor = ground(px, pz);
        dummy.position.set(px, floor - 0.22, pz);
        dummy.rotation.set(
          Math.cos(angle) * (j ? 0.22 : 0.06),
          angle,
          Math.sin(angle) * 0.22,
        );
        dummy.scale.set(width, h, width * 0.85);
        dummy.updateMatrix();
        shards[palette]!.push(source.clone().applyMatrix4(dummy.matrix));
        if (j < 3) {
          glowPositions.push(px, floor + h * 0.65, pz);
          glowSizes.push(h * 1.2);
          glowColors.push(tint.r, tint.g, tint.b);
        }
      }
      for (let j = 0; j < 12; j++) {
        const a = j * 2.399 + index,
          r = radius * (0.6 + noise(j + index * 31) * 0.7);
        const px = x + Math.cos(a) * r,
          pz = z + Math.sin(a) * r * 0.8;
        dummy.position.set(px, ground(px, pz) - 0.1, pz);
        dummy.rotation.set(j * 0.7, a, 0.2);
        const s = 0.45 + noise(j * 3 + index) * 0.65;
        dummy.scale.set(s * 1.4, s * 0.65, s);
        dummy.updateMatrix();
        rocks.push(dummy.matrix.clone());
        dummy.position.y += s * 0.35;
        dummy.scale.set(s * 1.45, s * 0.18, s * 0.9);
        dummy.updateMatrix();
        moss.push(dummy.matrix.clone());
      }
      for (let j = 0; j < (mobile ? 24 : 40); j++) {
        const a = j * 2.399,
          r = radius + 0.8 + noise(j + index * 43) * 2.6;
        const px = x + Math.cos(a) * r,
          pz = z + Math.sin(a) * r * 0.7;
        if (polygonDistance(px, pz, pond.positions) > -0.6) continue;
        const s = 0.12 + noise(j * 3 + index) * 0.12;
        dummy.position.set(px, ground(px, pz) + 0.15, pz);
        dummy.rotation.set(0, a, 0);
        dummy.scale.set(s * 1.3, s * 0.6, s);
        dummy.updateMatrix();
        flowers.push(dummy.matrix.clone());
        flowerColors.push(
          new Color(j % 4 === 0 ? '#e9d69c' : j % 3 === 0 ? '#d1b8ed' : '#8cad85'),
        );
      }
    });
    source.dispose();
    shards.forEach((parts, i) => {
      const geometry = mergeGeometries(parts)!;
      parts.forEach((g) => g.dispose());
      owned.push(geometry);
      const mesh = new Mesh(geometry, crystalMaterials[i]);
      mesh.name = `CrystalColonies_${i}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
    function instances(
      name: string,
      transforms: Matrix4[],
      material: MeshStandardMaterial,
      colors?: Color[],
    ) {
      const geometry = new DodecahedronGeometry(1, 0);
      owned.push(geometry);
      const mesh = new InstancedMesh(geometry, material, transforms.length);
      mesh.name = name;
      transforms.forEach((matrix, i) => {
        mesh.setMatrixAt(i, matrix);
        if (colors) mesh.setColorAt(i, colors[i]!);
      });
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    instances('CrystalStoneFeet', rocks, stoneMaterial);
    instances('CrystalMossSkirts', moss, mossMaterial);
    instances('CrystalFlowerSkirts', flowers, flowerMaterial, flowerColors);
    function points(
      name: string,
      positions: number[],
      sizes: number[],
      colors: number[],
      material: ShaderMaterial,
    ) {
      const geometry = new BufferGeometry();
      owned.push(geometry);
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
      geometry.setAttribute('tint', new Float32BufferAttribute(colors, 3));
      geometry.setAttribute(
        'phase',
        new Float32BufferAttribute(
          sizes.map((_, i) => noise(i + 88) * Math.PI * 2),
          1,
        ),
      );
      const mesh = new Points(geometry, material);
      mesh.name = name;
      geometry.computeBoundingSphere();
      geometry.boundingSphere!.radius += 1.5;
      group.add(mesh);
    }
    points('CrystalHalos', glowPositions, glowSizes, glowColors, particleMaterials[1]!);
    const positions: number[] = [],
      sizes: number[] = [],
      colors: number[] = [];
    particleCount = mobile ? 72 : 144;
    for (let i = 0; i < particleCount; i++) {
      const a = i * 2.399,
        r = Math.sqrt(noise(i + 15)) * 24;
      const x = -9 + Math.cos(a) * r,
        z = -8 + Math.sin(a) * r * 0.85;
      const overWater = polygonDistance(x, z, pond.positions) > 0;
      const y =
        Math.max(ground(x, z), overWater ? waterY : -Infinity) + 0.7 + noise(i * 5) * 8;
      positions.push(x, y, z);
      sizes.push(0.1 + noise(i * 9) * 0.15);
      const tint = new Color(i % 5 === 0 ? '#a3ebdf' : '#ffe3a0');
      colors.push(tint.r, tint.g, tint.b);
    }
    points('SanctuaryFireflies', positions, sizes, colors, particleMaterials[0]!);
    treeLight.position.set(-12, ground(-12, -18) + 14, 3);
    group.add(treeLight);
    if (crystalLight) {
      crystalLight.position.set(-22, ground(-22, 11) + 3.2, 11);
      group.add(crystalLight);
    }
    const mistGeometry = new PlaneGeometry(14, 5);
    owned.push(mistGeometry);
    for (let i = 0; i < 3; i++) {
      const mist = new Mesh(mistGeometry, mistMaterial);
      mist.name = `LakeWisp_${i}`;
      mist.rotation.set(-Math.PI / 2, 0, i * 0.8);
      mist.position.set(i - 1, waterY + 0.25 + i * 0.24, 5 + i * 2.5);
      group.add(mist);
    }
    previousNight = -1;
  }
  return {
    group,
    place,
    get night() {
      return Math.max(0, previousNight);
    },
    footprints: () =>
      CRYSTAL_COLONIES.map((c) => ({
        minX: c.x - c.radius - 1,
        maxX: c.x + c.radius + 1,
        minZ: c.z - c.radius - 1,
        maxZ: c.z + c.radius + 1,
      })),
    update(
      seconds: number,
      hour: number,
      reducedMotion: boolean,
      viewportHeight: number,
    ) {
      if (disposed) return false;
      const night = sampleTime(hour).stars;
      const changed = night !== previousNight;
      if (!reducedMotion) elapsed += Math.min(Math.max(seconds, 0), 0.1);
      crystalMaterials.forEach((m, i) => {
        const pulse = reducedMotion
          ? 1
          : 0.94 + 0.06 * Math.sin(elapsed * 0.55 + i * 2.1);
        m.emissiveIntensity = MathUtils.lerp(0.26, i === 0 ? 3.0 : 2.2, night) * pulse;
      });
      treeLight.intensity = night * 80;
      if (crystalLight) crystalLight.intensity = night * 18;
      mistMaterial.uniforms.elapsed!.value = elapsed;
      mistMaterial.uniforms.opacity!.value = night * 0.1;
      flowerMaterial.emissiveIntensity = 0.08 + night * 0.3;
      particleMaterials.forEach((m) => {
        m.uniforms.elapsed!.value = elapsed;
        m.uniforms.night!.value = night;
        m.uniforms.viewportHeight!.value = viewportHeight;
      });
      previousNight = night;
      return changed || !reducedMotion;
    },
    snapshot: () => ({
      colonies: anchors.map((a) => ({ ...a })),
      shards: CRYSTAL_COLONIES.reduce((n, c) => n + c.count, 0),
      particles: particleCount,
      night: previousNight,
      elapsed,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      [
        ...crystalMaterials,
        stoneMaterial,
        mossMaterial,
        flowerMaterial,
        mistMaterial,
        ...particleMaterials,
      ].forEach((m) => m.dispose());
      group.removeFromParent();
    },
  };
}
