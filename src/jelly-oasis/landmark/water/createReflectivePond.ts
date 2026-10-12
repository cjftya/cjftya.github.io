import {
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  PlaneGeometry,
  Vector2,
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

import { pondSurfaceGLSL } from './gpgpuPondShader';
import type { PondSurface } from './cpuPondSurface';
import { flowNoiseGLSL } from './flowMaterial';
import { shallowWaterGLSL } from './shallowWater';
import type { ShallowWater } from './shallowWater';
import { realPondFieldGLSL } from './pondWaves';
import { subdividePond, tessellatePond } from './subdividePond';

/** One pair of bounded planar captures, shared by the whole pond surface. */
export function createReflectivePond(
  root: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  ground: (x: number, z: number) => number,
  mobile: boolean,
  realWater = false,
  excavated = false,
  fluid?: { value: ShallowWater | undefined },
  gpu?: { value: PondSurface | undefined },
  subdivide = true,
) {
  if (realWater && subdivide) {
    const source = pond.geometry;
    pond.geometry = gpu
      ? tessellatePond(source, mobile ? 0.7 : 0.45, source.attributes.position!.getY(0))
      : subdividePond(source, fluid ? (mobile ? 2 : 3) : mobile ? 3 : 4);
    source.dispose();
  }
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
    captured = { value: 0 },
    impact = { value: new Vector3(0, 0, 0) };
  const flowDirection = { value: new Vector2(0, 1) };
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
  material.transparent = !!fluid;
  material.depthWrite = !fluid;
  const waterLevel = { value: pond.geometry.attributes.position!.getY(0) };
  const fluidTexture = { value: fluid?.value?.texture };
  const fluidBounds = { value: fluid?.value?.bounds };
  const gpuField = { value: gpu?.value?.texture.value ?? fluid?.value?.texture };
  const gpuMask = { value: gpu?.value?.maskTexture ?? fluid?.value?.texture };
  const gpuBounds = { value: gpu?.value?.bounds ?? fluid?.value?.bounds };
  const gpuActive = { value: gpu?.value?.active.value ?? 0 };
  const gpuAmplitude = { value: gpu?.value?.amplitude.value ?? 1 };
  const gpuNeutral = { value: gpu?.value?.neutral.value ?? 0 };
  const heightGLSL = gpu
    ? (fluid
        ? shallowWaterGLSL
            .replace(/waterHeight/g, 'cpuWaterHeight')
            .replace(/waterFoam/g, 'cpuWaterFoam')
        : '') +
      pondSurfaceGLSL +
      `
    float waterHeight(vec2 p, float depth) { return gpuPondActive > 0.5 ? gpuPondHeight(p) : ${fluid ? 'cpuWaterHeight(p, depth)' : '0.0'}; }
    float waterFoam(vec2 p, float depth) { return ${fluid ? 'gpuPondActive > 0.5 ? 0.0 : cpuWaterFoam(p, depth)' : '0.0'}; }
  `
    : shallowWaterGLSL;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      gpuPondField: gpuField,
      gpuPondMask: gpuMask,
      gpuPondBounds: gpuBounds,
      gpuPondActive: gpuActive,
      gpuPondAmplitude: gpuAmplitude,
      gpuPondNeutral: gpuNeutral,
      waterTime: time,
      fluidField: fluidTexture,
      fluidBounds,
      waterLevel,
      waterCaptured: captured,
      waterReflection: { value: reflector.getRenderTarget().texture },
      waterRefraction: { value: refractor.getRenderTarget().texture },
      waterReflectionMatrix: { value: reflectionMatrix },
      waterRefractionMatrix: { value: refractionMatrix },
      waterNormalMatrix: { value: normalMatrix },
      waterImpact: impact,
      waterFlowDirection: flowDirection,
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
      attribute float waterDepth;
      ${gpu ? 'attribute float gpuVertexWeight;' : ''}
      ${fluid ? 'attribute float channelTravel, channelMask; varying float inletTravel, inletMask;' : ''}
      varying vec3 waterPosition; varying vec3 waterBaseNormal;
      varying float waterThickness;
      varying vec4 waterReflectCoord, waterRefractCoord;
      uniform mat4 waterReflectionMatrix, waterRefractionMatrix;
      ${realWater ? `uniform float waterTime; uniform vec3 waterImpact; uniform vec2 waterFlowDirection; ${fluid || gpu ? heightGLSL : realPondFieldGLSL}` : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        ${realWater ? (gpu ? 'transformed.y += gpuPondActive > 0.5 ? waterHeight(position.xz, waterDepth) * step(0.000001, gpuVertexWeight) : waterHeight(position.xz, waterDepth);' : 'transformed.y += waterHeight(position.xz, waterDepth);') : ''}
        waterPosition = position; waterBaseNormal = normal;
        ${fluid ? 'inletTravel=channelTravel; inletMask=channelMask;' : ''}
        waterThickness = waterDepth;
        waterReflectCoord = waterReflectionMatrix * vec4(transformed, 1.0);
        waterRefractCoord = waterRefractionMatrix * vec4(transformed, 1.0);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
      uniform float waterTime, waterCaptured, waterLevel;
      ${gpu ? 'uniform float gpuPondNeutral;' : ''}
      ${fluid ? 'varying float inletTravel, inletMask;' + flowNoiseGLSL : ''}
      uniform vec3 waterImpact; uniform vec2 waterFlowDirection;
      uniform sampler2D waterReflection, waterRefraction;
      uniform mat3 waterNormalMatrix;
      varying vec3 waterPosition; varying vec3 waterBaseNormal;
      varying float waterThickness;
      varying vec4 waterReflectCoord, waterRefractCoord;
      ${
        realWater
          ? fluid || gpu
            ? heightGLSL
            : realPondFieldGLSL
          : `      float waterHeight(vec2 p) {
        float radius = length((p - waterImpact.xy) * vec2(1.0, 0.89));
        p += vec2(sin(p.y * 0.31), cos(p.x * 0.27)) * 0.45;
        float wake = sin(radius * 8.0 - waterTime * 5.2 + sin(p.x * 1.3) * 0.15)
          * exp(-radius * 0.5) * smoothstep(0.08, 0.6, radius) * waterImpact.z * 0.12;
        return wake + sin(dot(p, vec2(1.2, 0.8)) - waterTime * 0.65) * 0.029
          + sin(dot(p, vec2(-2.1, 2.7)) - waterTime * 0.93) * 0.018
          + sin(dot(p, vec2(5.9, 4.3)) + waterTime * 1.14) * 0.006
          + sin(dot(p, vec2(-11.1, 8.5)) - waterTime * 1.72) * 0.002;
      }`
      }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        ${excavated ? 'if (waterThickness < 0.006) discard;' : ''}
        float wave = waterHeight(waterPosition.xz${realWater ? ', waterThickness' : ''});
        vec2 slope = vec2(waterHeight(waterPosition.xz + vec2(0.025, 0.0)${realWater ? ', waterThickness' : ''}) - wave,
          waterHeight(waterPosition.xz + vec2(0.0, 0.025)${realWater ? ', waterThickness' : ''}) - wave) / 0.025;
        ${fluid ? 'float channelNoise = rwFbm(vec2(waterPosition.x * 4.3, (inletTravel-waterTime)*7.9)); slope += vec2(channelNoise-0.5, channelNoise-0.5) * inletMask * 0.14;' : ''}
        float shore = ${gpu ? 'gpuPondActive > 0.5 ? 1.0 : ' : ''}smoothstep(0.0, 0.5, waterThickness);
        normal = normalize(waterNormalMatrix * (normalize(waterBaseNormal) + vec3(-slope.x * shore, 0.0, -slope.y * shore)));
        normal *= gl_FrontFacing ? 1.0 : -1.0;`,
      )
      .replace(
        '#include <opaque_fragment>',
        `
        if (waterCaptured > 0.5 && gl_FrontFacing) {
          vec2 distortion = slope * ${fluid ? '0.012' : '0.007'} * shore;
          vec2 reflectionUV = waterReflectCoord.xy / waterReflectCoord.w;
          vec2 refractionUV = waterRefractCoord.xy / waterRefractCoord.w;
          vec3 reflected = texture2D(waterReflection, clamp(reflectionUV + distortion, 0.002, 0.998)).rgb;
          vec3 refracted = texture2D(waterRefraction, clamp(refractionUV - distortion, 0.002, 0.998)).rgb;
          float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
          float fresnel = 0.02 + 0.98 * pow(1.0 - facing, 5.0);
          float depth = max(0.03, waterThickness) / max(0.25, facing);
          vec3 absorption = exp(-vec3(0.65, 0.19, 0.12) * depth);
          vec3 body = refracted * absorption + outgoingLight * (1.0 - absorption) * 0.65;
          vec3 capturedWater = mix(body, reflected, fresnel) + reflectedLight.directSpecular * 0.8;
          ${fluid ? 'float flatCapture = 1.0 - smoothstep(0.005, 0.10, abs(waterPosition.y - waterLevel));' : ''}
          outgoingLight = ${fluid ? 'mix(outgoingLight, capturedWater, flatCapture); diffuseColor.a = mix(0.24, 1.0, flatCapture)' : 'capturedWater'};
        }
        ${
          realWater
            ? `float foam = waterFoam(waterPosition.xz, waterThickness);
        vec3 foamLight = (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse) / max(diffuseColor.rgb, vec3(0.04)) * vec3(0.72, 0.81, 0.78);
        outgoingLight = mix(outgoingLight, foamLight, foam);`
            : ''
        }
        ${
          gpu
            ? `if (gpuPondActive > 0.5 && gpuPondNeutral > 0.5 && waterPosition.z >= gpuPondBounds.y && abs(waterPosition.y - waterLevel) < 0.0001) {
          vec3 neutralLight = normalize(waterNormalMatrix * vec3(-0.7, 0.7, 0.2));
          vec3 neutralHalf = normalize(waterNormalMatrix * vec3(0.12, 1.0, 0.06));
          float glint = pow(max(0.0, dot(normal, neutralHalf)), 96.0);
          outgoingLight = vec3(0.38) * (0.3 + 0.7 * max(0.0, dot(normal, neutralLight))) + vec3(0.55) * glint;
          diffuseColor.a = 1.0;
        }`
            : ''
        }
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () =>
    gpu
      ? 'oasis-gpgpu-pond-prototype-v1'
      : fluid
        ? 'oasis-shallow-water-v8'
        : excavated
          ? 'oasis-reflective-pond-excavated-v1'
          : realWater
            ? 'oasis-reflective-pond-v4'
            : 'oasis-reflective-pond-v3';
  material.needsUpdate = true;
  function rebuild() {
    gpuField.value = gpu?.value?.texture.value ?? fluid?.value?.texture;
    gpuMask.value = gpu?.value?.maskTexture ?? fluid?.value?.texture;
    gpuBounds.value = gpu?.value?.bounds ?? fluid?.value?.bounds;
    gpuActive.value = gpu?.value?.active.value ?? 0;
    gpuNeutral.value = gpu?.value?.neutral.value ?? 0;
    waterLevel.value = pond.geometry.attributes.position!.getY(0);
    fluidTexture.value = fluid?.value?.texture;
    fluidBounds.value = fluid?.value?.bounds;
    const positions = pond.geometry.attributes.position!;
    const depths: number[] = [];
    const weights: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      if (gpu?.value)
        weights.push(gpu.value.maskAt(positions.getX(i), positions.getZ(i)));
      depths.push(
        Math.max(
          excavated ? 0 : 0.03,
          positions.getY(i) - ground(positions.getX(i), positions.getZ(i)),
        ) * root.scale.x,
      );
    }
    pond.geometry.setAttribute('waterDepth', new Float32BufferAttribute(depths, 1));
    if (gpu?.value)
      pond.geometry.setAttribute(
        'gpuVertexWeight',
        new Float32BufferAttribute(weights, 1),
      );
    lastBucket = -1;
    captured.value = 0;
  }
  rebuild();
  pond.onBeforeRender = (renderer, scene, camera) => {
    if (!root.visible || !pond.visible) return;
    gpuField.value = gpu?.value?.texture.value ?? fluid?.value?.texture;
    gpuActive.value = gpu?.value?.active.value ?? 0;
    gpuAmplitude.value = gpu?.value?.amplitude.value ?? 1;
    gpuNeutral.value = gpu?.value?.neutral.value ?? 0;
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
    if (gpuActive.value && gpuNeutral.value) {
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
    setImpact(point: Vector2 | null, strength = 0, direction?: Vector2) {
      impact.value.set(point?.x ?? 0, point?.y ?? 0, point ? strength : 0);
      if (direction) flowDirection.value.copy(direction).normalize();
    },
    invalidate() {
      environmentRevision++;
    },
    snapshot: () => ({
      size,
      version: realWater ? 4 : 3,
      vertices: pond.geometry.attributes.position!.count,
      triangles:
        (pond.geometry.index?.count ?? pond.geometry.attributes.position!.count) / 3,
      captures,
      passes: 2,
      captured: captured.value === 1,
      impact: impact.value.toArray(),
      flowDirection: flowDirection.value.toArray(),
    }),
    dispose() {
      pond.onBeforeRender = () => {};
      reflector.dispose();
      refractor.dispose();
      plane.dispose();
    },
  };
}
