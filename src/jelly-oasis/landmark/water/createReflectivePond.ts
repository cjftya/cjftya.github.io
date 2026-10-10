import {
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  PlaneGeometry,
  Vector3,
} from 'three';
import type {
  BufferGeometry,
  Group,
  ShaderMaterial,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { Refractor } from 'three/examples/jsm/objects/Refractor.js';

/** One pair of bounded planar captures, shared by the whole pond surface. */
export function createReflectivePond(
  root: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  ground: (x: number, z: number) => number,
  mobile: boolean,
) {
  const size = mobile ? 256 : 768;
  const plane = new PlaneGeometry(1, 1);
  const reflector = new Reflector(plane, {
    textureWidth: size,
    textureHeight: size,
    multisample: 0,
    clipBias: 0.002,
  });
  const refractor = new Refractor(plane, {
    textureWidth: size,
    textureHeight: size,
    multisample: 0,
    clipBias: 0.002,
  });
  const reflectionMaterial = reflector.material as ShaderMaterial;
  const reflectionMatrix = new Matrix4(),
    refractionMatrix = new Matrix4();
  const normalMatrix = new Matrix3(),
    viewModel = new Matrix4();
  const transform = new Matrix4(),
    inverse = new Matrix4();
  const time = { value: 0 },
    captured = { value: 0 };
  let captures = 0,
    lastBucket = -1,
    environmentRevision = 0,
    lastRevision = -1;
  const lastCamera = new Matrix4(),
    lastProjection = new Matrix4();
  const material = pond.material;
  material.color.set('#347982');
  material.roughness = 0.16;
  material.opacity = 1;
  material.transparent = false;
  material.depthWrite = true;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      waterTime: time,
      waterCaptured: captured,
      waterReflection: { value: reflector.getRenderTarget().texture },
      waterRefraction: { value: refractor.getRenderTarget().texture },
      waterReflectionMatrix: { value: reflectionMatrix },
      waterRefractionMatrix: { value: refractionMatrix },
      waterNormalMatrix: { value: normalMatrix },
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
      attribute float waterDepth;
      varying vec3 waterPosition;
      varying float waterThickness;
      varying vec4 waterReflectCoord, waterRefractCoord;
      uniform mat4 waterReflectionMatrix, waterRefractionMatrix;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        waterPosition = position;
        waterThickness = waterDepth;
        waterReflectCoord = waterReflectionMatrix * vec4(position, 1.0);
        waterRefractCoord = waterRefractionMatrix * vec4(position, 1.0);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
      uniform float waterTime, waterCaptured;
      uniform sampler2D waterReflection, waterRefraction;
      uniform mat3 waterNormalMatrix;
      varying vec3 waterPosition;
      varying float waterThickness;
      varying vec4 waterReflectCoord, waterRefractCoord;
      float waterHeight(vec2 p) {
        p += vec2(sin(p.y * 0.31), cos(p.x * 0.27)) * 0.45;
        return sin(dot(p, vec2(1.2, 0.8)) - waterTime * 0.65) * 0.055
          + sin(dot(p, vec2(-2.1, 2.7)) - waterTime * 0.93) * 0.018
          + sin(dot(p, vec2(5.9, 4.3)) + waterTime * 1.14) * 0.006
          + sin(dot(p, vec2(-11.1, 8.5)) - waterTime * 1.72) * 0.002;
      }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        float wave = waterHeight(waterPosition.xz);
        vec2 slope = vec2(waterHeight(waterPosition.xz + vec2(0.025, 0.0)) - wave,
          waterHeight(waterPosition.xz + vec2(0.0, 0.025)) - wave) / 0.025;
        float shore = smoothstep(0.0, 0.5, waterThickness);
        normal = normalize(waterNormalMatrix * vec3(-slope.x * shore, 1.0, -slope.y * shore));
        normal *= gl_FrontFacing ? 1.0 : -1.0;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `
        if (waterCaptured > 0.5 && gl_FrontFacing) {
          vec2 distortion = slope * 0.007 * shore;
          vec2 reflectionUV = waterReflectCoord.xy / waterReflectCoord.w;
          vec2 refractionUV = waterRefractCoord.xy / waterRefractCoord.w;
          vec3 reflected = texture2D(waterReflection, clamp(reflectionUV + distortion, 0.002, 0.998)).rgb;
          vec3 refracted = texture2D(waterRefraction, clamp(refractionUV - distortion, 0.002, 0.998)).rgb;
          float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
          float depth = max(0.03, waterThickness) / max(0.25, facing);
          vec3 absorption = exp(-vec3(0.65, 0.19, 0.12) * depth);
          vec3 body = refracted * absorption + outgoingLight * (1.0 - absorption) * 0.65;
          outgoingLight = mix(body, reflected, fresnel) + reflectedLight.directSpecular * 0.8;
        }
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => 'oasis-reflective-pond-v2';
  material.needsUpdate = true;
  function rebuild() {
    const positions = pond.geometry.attributes.position!;
    const depths: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      depths.push(
        Math.max(
          0.03,
          positions.getY(i) - ground(positions.getX(i), positions.getZ(i)),
        ) * root.scale.x,
      );
    }
    pond.geometry.setAttribute('waterDepth', new Float32BufferAttribute(depths, 1));
    lastBucket = -1;
    captured.value = 0;
  }
  rebuild();
  pond.onBeforeRender = (renderer, scene, camera) => {
    if (!root.visible || !pond.visible) return;
    pond.updateWorldMatrix(true, false);
    viewModel.multiplyMatrices(camera.matrixWorldInverse, pond.matrixWorld);
    normalMatrix.getNormalMatrix(viewModel);
    const surfaceY = new Vector3(
      0,
      pond.geometry.attributes.position!.getY(0),
      0,
    ).applyMatrix4(pond.matrixWorld).y;
    if (camera.position.y <= surfaceY + 0.05) {
      captured.value = 0;
      return;
    }
    const bucket = Math.floor(time.value * (mobile ? 10 : 20));
    const moved =
      !lastCamera.equals(camera.matrixWorld) ||
      !lastProjection.equals(camera.projectionMatrix);
    if (!moved && bucket === lastBucket && lastRevision === environmentRevision) return;
    // Helpers use a local +Z plane; rotate that plane to the pond's +Y normal.
    transform
      .makeTranslation(0, pond.geometry.attributes.position!.getY(0), 0)
      .multiply(new Matrix4().makeRotationX(-Math.PI / 2));
    reflector.matrixWorld.multiplyMatrices(pond.matrixWorld, transform);
    refractor.matrixWorld.copy(reflector.matrixWorld);
    inverse.copy(reflector.matrixWorld).invert().multiply(pond.matrixWorld);
    const previousTarget = renderer.getRenderTarget();
    const previousXR = renderer.xr.enabled,
      previousShadow = renderer.shadowMap.autoUpdate;
    pond.visible = false;
    try {
      reflector.onBeforeRender(
        renderer,
        scene,
        camera,
        plane,
        reflectionMaterial,
        root,
      );
      refractor.onBeforeRender(
        renderer,
        scene,
        camera,
        plane,
        refractor.material,
        root,
      );
      reflectionMatrix
        .copy(reflectionMaterial.uniforms.textureMatrix!.value)
        .multiply(inverse);
      refractionMatrix
        .copy(refractor.material.uniforms.textureMatrix!.value)
        .multiply(inverse);
      captured.value = 1;
      captures++;
      lastCamera.copy(camera.matrixWorld);
      lastProjection.copy(camera.projectionMatrix);
      lastBucket = bucket;
      lastRevision = environmentRevision;
    } finally {
      pond.visible = true;
      renderer.setRenderTarget(previousTarget);
      renderer.xr.enabled = previousXR;
      renderer.shadowMap.autoUpdate = previousShadow;
    }
  };
  return {
    time,
    rebuild,
    invalidate() {
      environmentRevision++;
    },
    snapshot: () => ({ size, captures, passes: 2, captured: captured.value === 1 }),
    dispose() {
      pond.onBeforeRender = () => {};
      reflector.dispose();
      refractor.dispose();
      plane.dispose();
    },
  };
}
