import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
} from 'three';
import type { Matrix4 } from 'three';
import { rootedWind } from '../animation/vegetationWind';
import { polygonDistance } from '../terrain/excavateTerrain';
import { segmentDistance } from '../vegetation/vegetationPlacement';
import type { LayoutGuide } from './landmarkConfig';
import { ENCHANTED_COLONIES, ENCHANTED_COLORS } from './enchantedPalette';

const random = (n: number) => {
  const value = Math.sin(n * 127.1 + 81.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Connected stems, folded leaves and cups/caps. Only tips and gills emit light. */
function plantGeometry(mushroom: boolean) {
  const positions: number[] = [],
    colors: number[] = [],
    glow: number[] = [];
  const leaf = new Color('#3d857a'),
    stem = new Color('#567d71');
  const white = new Color('#e5ddf7'),
    core = new Color('#ffe4ae');
  function triangle(a: number[], b: number[], c: number[], tint: Color, emission = 0) {
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) {
      colors.push(tint.r, tint.g, tint.b);
      glow.push(emission);
    }
  }
  const ring = (a: number, r: number, y: number) => [
    Math.cos(a) * r,
    y,
    Math.sin(a) * r,
  ];
  const h = mushroom ? 0.57 : 0.94;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3,
      b = ((i + 1) * Math.PI) / 3;
    triangle(ring(a, 0.055, 0), ring(b, 0.055, 0), ring(a, 0.035, h), stem);
    triangle(ring(b, 0.055, 0), ring(b, 0.035, h), ring(a, 0.035, h), stem);
  }
  if (mushroom) {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5,
        b = ((i + 1) * Math.PI) / 5;
      triangle([0, 0.91, 0], ring(a, 0.27, 0.78), ring(b, 0.27, 0.78), white, 0.24);
      triangle(
        ring(a, 0.27, 0.78),
        ring(a, 0.49, 0.57),
        ring(b, 0.49, 0.57),
        white,
        0.48,
      );
      triangle(
        ring(a, 0.27, 0.78),
        ring(b, 0.49, 0.57),
        ring(b, 0.27, 0.78),
        white,
        0.48,
      );
      triangle([0, 0.56, 0], ring(b, 0.49, 0.57), ring(a, 0.49, 0.57), core, 0.85);
      triangle(ring(a, 0.49, 0.57), ring(a, 0.46, 0.52), ring(b, 0.49, 0.57), white, 1);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const root = ring(a, 0.055, h),
        l = ring(a - 0.42, 0.36, h + 0.12);
      const tipL = ring(a - 0.2, 0.53, h + 0.25),
        tipR = ring(a + 0.2, 0.53, h + 0.25),
        r = ring(a + 0.42, 0.36, h + 0.12);
      triangle(root, l, tipL, white, 0.4);
      triangle(root, tipL, tipR, white, 0.65);
      triangle(root, tipR, r, white, 0.5);
      triangle(
        [0, h + 0.035, 0],
        ring(a, 0.12, h + 0.07),
        ring(a + 1.26, 0.12, h + 0.07),
        core,
        1.3,
      );
    }
    for (let i = 0; i < 3; i++) {
      const a = i * 2.399;
      triangle([0, 0.18, 0], ring(a - 0.36, 0.32, 0.32), ring(a, 0.7, 0.52), leaf);
      triangle([0, 0.18, 0], ring(a, 0.7, 0.52), ring(a + 0.36, 0.32, 0.29), leaf);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.setAttribute('enchantedGlow', new Float32BufferAttribute(glow, 1));
  g.computeVertexNormals();
  return rootedWind(g, 0, 0, 0, 1.3, mushroom ? 0.025 : 0.14);
}

export function createEnchantedUnderstory(pond: LayoutGuide, approach?: LayoutGuide) {
  const group = new Group();
  group.name = 'EnchantedUnderstory';
  // Shader uniforms stay shared when VegetationWind clones the material.
  const uniforms = { enchantedNight: { value: 0 } };
  const material = new MeshStandardMaterial({
    color: 'white',
    vertexColors: true,
    flatShading: true,
    side: DoubleSide,
    roughness: 0.82,
    emissive: 'white',
    emissiveIntensity: 1,
  });
  material.name = 'EnchantedPetalsAndGills';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      'attribute float enchantedGlow; varying float vEnchantedGlow;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvEnchantedGlow = enchantedGlow;',
    );
    shader.fragmentShader =
      'uniform float enchantedNight; varying float vEnchantedGlow;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor.rgb * vEnchantedGlow * mix(.28, 2.1, enchantedNight);',
    );
  };
  material.customProgramCacheKey = () => 'enchanted-petals-v1';
  const poolMaterial = new ShaderMaterial({
    uniforms: { ...UniformsUtils.clone(UniformsLib.fog!), ...uniforms },
    vertexShader: `attribute float softness; attribute vec3 color;
      varying float vSoftness; varying vec3 vTint;
      #include <fog_pars_vertex>
      void main(){ vSoftness=softness; vTint=color;
        vec4 mvPosition=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float enchantedNight; varying float vSoftness; varying vec3 vTint;
      #include <fog_pars_fragment>
      void main(){ gl_FragColor=vec4(vTint, vSoftness*mix(.025,.19,enchantedNight));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const flowerGeometry = plantGeometry(false),
    mushroomGeometry = plantGeometry(true);
  let poolGeometry: BufferGeometry | undefined;
  let anchors: { x: number; y: number; z: number; kind: string }[] = [];
  let disposed = false;
  const route: number[][] = [];
  if (approach)
    for (let i = 0; i + 1 < approach.positions.length; i += 2) {
      const a = approach.positions[i]!,
        b = approach.positions[i + 1]!;
      route.push([(a[0]! + b[0]!) / 2, (a[2]! + b[2]!) / 2]);
    }
  function allowed(x: number, z: number) {
    return (
      polygonDistance(x, z, pond.positions) < -1.15 &&
      Math.abs(Math.hypot(x / 34, z / 32) - 1) * 32 > 3.3 &&
      !route
        .slice(1)
        .some(
          (b, i) =>
            segmentDistance(x, z, route[i]![0]!, route[i]![1]!, b[0]!, b[1]!) < 3.8,
        ) &&
      !(x > 12 && x < 18 && z > -12 && z < 1)
    );
  }
  function clear() {
    group.traverse((o) => {
      if (o instanceof InstancedMesh) o.dispose();
    });
    group.clear();
    poolGeometry?.dispose();
    poolGeometry = undefined;
    anchors = [];
  }
  function place(ground: (x: number, z: number) => number) {
    if (disposed) return;
    clear();
    const dummy = new Object3D();
    // Same silhouettes and colony density on desktop and mobile: two plant draws.
    for (const mushroom of [false, true]) {
      const transforms: Matrix4[] = [],
        tints: Color[] = [];
      ENCHANTED_COLONIES.forEach((c, ci) => {
        for (let i = 0; i < (mushroom ? 9 : 27); i++) {
          const seed = ci * 71 + i + (mushroom ? 903 : 0);
          const a = i * 2.399 + ci,
            r =
              Math.sqrt(random(seed)) * c.radius * (0.85 + 0.25 * Math.sin(a * 3 + ci));
          const x = c.x + Math.cos(a) * r,
            z = c.z + Math.sin(a) * r * 0.72;
          if (!allowed(x, z)) continue;
          const y = ground(x, z),
            scale = (mushroom ? 1.15 : 1.2) + random(seed + 17) * 1.1;
          // Reject sharp ledges; avoid plants emerging sideways from rock faces.
          if (
            Math.max(
              Math.abs(ground(x + 0.65, z) - y),
              Math.abs(ground(x, z + 0.65) - y),
            ) > 0.8
          )
            continue;
          dummy.position.set(x, y - 0.04, z);
          dummy.rotation.set(0, a, 0);
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          transforms.push(dummy.matrix.clone());
          const tint = new Color(ENCHANTED_COLORS[c.palette]);
          if (i % 5 === 0) tint.lerp(new Color('#c6c8ee'), 0.32);
          tint.multiplyScalar(0.72 + random(seed + 81) * 0.28);
          tints.push(tint);
          anchors.push({ x, y, z, kind: mushroom ? 'mushroom' : 'flower' });
        }
      });
      const mesh = new InstancedMesh(
        mushroom ? mushroomGeometry : flowerGeometry,
        material,
        transforms.length,
      );
      mesh.name = mushroom ? 'EnchantedMushrooms' : 'EnchantedFlowers';
      transforms.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, tints[i]!);
      });
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    // Feathered, terrain-conforming colour bounce: no per-flower dynamic lights.
    const positions: number[] = [],
      colors: number[] = [],
      softness: number[] = [];
    ENCHANTED_COLONIES.forEach((c, ci) => {
      const color = new Color(ENCHANTED_COLORS[c.palette]);
      const vertex = (ring: number, side: number) => {
        const angle = (side * Math.PI) / 8;
        const r =
          ((c.radius * 1.35 * ring) / 4) * (1 + 0.18 * Math.sin(angle * 3 + ci));
        const x = c.x + Math.cos(angle) * r,
          z = c.z + Math.sin(angle) * r * 0.72;
        return { x, z, w: (1 - ring / 4) ** 2 * (allowed(x, z) ? 1 : 0) };
      };
      for (let r = 0; r < 4; r++)
        for (let s = 0; s < 16; s++) {
          const a = vertex(r, s),
            b = vertex(r + 1, s),
            d = vertex(r, s + 1),
            e = vertex(r + 1, s + 1);
          for (const v of [a, e, b, a, d, e]) {
            positions.push(v.x, ground(v.x, v.z) + 0.055, v.z);
            colors.push(color.r, color.g, color.b);
            softness.push(v.w);
          }
        }
    });
    poolGeometry = new BufferGeometry();
    poolGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    poolGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    poolGeometry.setAttribute('softness', new Float32BufferAttribute(softness, 1));
    const pool = new Mesh(poolGeometry, poolMaterial);
    pool.name = 'UnderstoryColourBounce';
    group.add(pool);
  }
  return {
    group,
    place,
    update: (night: number) => {
      uniforms.enchantedNight.value = night;
    },
    snapshot: () => ({
      colonies: ENCHANTED_COLONIES.length,
      anchors: anchors.map((a) => ({ ...a })),
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      flowerGeometry.dispose();
      mushroomGeometry.dispose();
      material.dispose();
      poolMaterial.dispose();
      group.removeFromParent();
    },
  };
}
