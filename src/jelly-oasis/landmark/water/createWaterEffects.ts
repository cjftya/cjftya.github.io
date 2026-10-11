import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  CircleGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Object3D,
  RingGeometry,
  Mesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
  Vector2,
  Raycaster,
  Vector3,
} from 'three';
import { createRealWaterEffects } from './createRealWaterEffects';
import { createReflectivePond } from './createReflectivePond';
import { createWaterNormal, createFoamTexture } from './waterTextures';
import type { LayoutGuide } from '../landmarkConfig';

export interface WaterOptions {
  water: boolean;
  waterfall: boolean;
  realistic?: boolean;
  mobile?: boolean;
  freeFall?: boolean;
  interaction?: boolean;
  realWater?: boolean;
  continuous?: boolean;
  basinOnly?: boolean;
}

// Keep standard lighting, fog and receiving shadows. Only the diffuse colour
// moves; geometry, shoreline, water level and transparency stay unchanged.
function flowingMaterial(
  material: MeshStandardMaterial,
  waterfall: boolean,
  realistic = false,
  freeFall = false,
  interaction = false,
) {
  const time = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.oasisTime = time;
    shader.uniforms.oasisFlightDuration = {
      value: material.userData.flightDuration ?? 1,
    };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 oasisPosition; uniform float oasisTime; uniform float oasisFlightDuration;' +
          (waterfall
            ? '\nattribute float flowDistance; attribute float flowAcross; attribute float flightTime; varying float oasisFlow; varying float oasisAcross; varying float oasisFlight;'
            : ''),
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\noasisPosition = position;' +
          (waterfall
            ? '\noasisFlow = flowDistance; oasisAcross = flowAcross; oasisFlight = flightTime;'
            : ''),
      );
    if (freeFall)
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `float edgeWave = sin(oasisFlight * 9.0 - oasisTime * 5.0 + oasisAcross * 4.0) * 0.07;
       float anchor = sin(clamp(oasisFlight / oasisFlightDuration, 0.0, 1.0) * 3.14159);
       transformed.x += edgeWave * anchor * oasisAcross * oasisAcross;
       transformed.z += sin(oasisFlight * 7.0 - oasisTime * 4.0 + oasisAcross * 3.0) * 0.035 * anchor;
       #include <project_vertex>`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 oasisPosition;\nuniform float oasisTime; uniform float oasisFlightDuration;' +
          (waterfall
            ? '\nvarying float oasisFlow; varying float oasisAcross; varying float oasisFlight;'
            : '') +
          (realistic
            ? `
float flowHash(vec2 p) {return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}
float flowNoise(vec2 p) {vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
return mix(mix(flowHash(i), flowHash(i+vec2(1.0,0.0)), f.x), mix(flowHash(i+vec2(0.0,1.0)),flowHash(i+vec2(1.0,1.0)),f.x),f.y);}`
            : ''),
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        ${
          waterfall
            ? realistic
              ? `vec2 fallingUV = vec2(oasisAcross * 5.0, ${freeFall ? 'oasisFlight * 11.0 - oasisTime * 11.0' : 'oasisFlow * 0.8 - oasisTime * 2.4'});
              float churn = flowNoise(fallingUV) * 0.65 + flowNoise(fallingUV * 2.3) * 0.35;
              float aeration = smoothstep(0.38, 0.8, churn) * 0.5;
              float edgeFoam = smoothstep(0.65, 1.0, abs(oasisAcross)) * (0.2 + 0.3 * aeration);
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.97, 0.95), aeration + edgeFoam);
              diffuseColor.a *= 0.65 + aeration * 0.7;
              ${
                freeFall
                  ? `float breakup = smoothstep(0.45, 1.0, oasisFlight / oasisFlightDuration);
              float fragment = flowNoise(vec2(oasisAcross * 8.0, oasisFlight * 17.0 - oasisTime * 17.0));
              diffuseColor.a *= mix(1.0, smoothstep(0.18, 0.56, fragment), breakup * 0.78);
              diffuseColor.a *= 1.0 - smoothstep(0.84, 1.02, abs(oasisAcross) + sin(fallingUV.y) * 0.035);`
                  : ''
              }`
              : `float lane = oasisAcross * 3.0;
             float falling = oasisFlow * 1.9 - oasisTime * 5.5;
             float weave = sin(lane * 2.3 + sin(falling * 0.45) * 0.7)
               + sin(lane * 4.7 - falling * 0.32) * 0.28;
             float streak = smoothstep(0.05, 0.95, weave);
             float pulse = 0.5 + 0.5 * sin(falling + lane * 1.6);
             float edge = smoothstep(0.74, 1.0, abs(oasisAcross));
             float white = clamp(streak * (0.22 + pulse * 0.35) + edge * 0.24, 0.0, 0.75);
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.97, 0.93), white);`
            : `float ripple = sin(oasisPosition.x * 1.6 + oasisPosition.z * 0.9 - oasisTime * 0.55)
               * sin(oasisPosition.z * 1.1 - oasisTime * 0.35);
             diffuseColor.rgb *= 1.0 + ripple * 0.065;`
        }
      `,
      );
  };
  material.customProgramCacheKey = () =>
    waterfall
      ? realistic
        ? freeFall
          ? interaction
            ? 'oasis-waterfall-v5'
            : 'oasis-waterfall-v4'
          : 'oasis-waterfall-v3'
        : 'oasis-waterfall-v2'
      : 'oasis-water-v1';
  material.needsUpdate = true;
  return time;
}

export function createWaterEffects(
  root: Group,
  content: Group,
  pond: Mesh<BufferGeometry, MeshStandardMaterial>,
  cliff: Group,
  guide: LayoutGuide,
  pondY: () => number,
  ground: (x: number, z: number) => number,
  options: WaterOptions,
) {
  if (options.realWater)
    return createRealWaterEffects(root, content, pond, cliff, pondY, ground, options);
  const clocks: { value: number }[] = [];
  const reflectivePond =
    options.realistic && options.water
      ? createReflectivePond(root, pond, ground, options.mobile ?? false)
      : undefined;
  const normalTexture = options.realistic ? createWaterNormal() : undefined;
  const foamTexture = options.realistic ? createFoamTexture() : undefined;
  if (options.water)
    clocks.push(reflectivePond?.time ?? flowingMaterial(pond.material, false));
  const waterfall = new Group();
  waterfall.name = 'WaterfallFlowV1';
  const path: Vector3[] = [];
  let triangles = 0;
  let flightDuration = 0;
  let rockClearance = Infinity;
  let flightStartIndex = 0;
  const flightOrigin = new Vector3();
  const ripples: Mesh[] = [];
  let droplets: InstancedMesh | undefined;
  let splashOrigin = new Vector3();
  const particle = new Object3D();
  const dropCount = options.freeFall ? 72 : options.realistic ? 40 : 18;
  function animateSplash(time: number) {
    ripples.forEach((r, i) => {
      const phase = (time * 0.48 + i / ripples.length) % 1;
      const radius = 0.6 + phase * 1.4;
      r.scale.set(radius, radius * 0.65, 1);
      (r.material as MeshStandardMaterial).opacity = (1 - phase) * 0.3;
    });
    if (!droplets) return;
    for (let i = 0; i < dropCount; i++) {
      if (options.freeFall && i < 24 && path.length) {
        const phase = (time / flightDuration + i / 24) % 1;
        const t = phase * flightDuration;
        particle.position.copy(flightOrigin).lerp(path[path.length - 1]!, phase);
        particle.position.y = flightOrigin.y - 4.9 * t * t;
        particle.position.x += Math.sin(i * 2.39996) * (0.45 + phase * 0.4);
        particle.position.z += 0.1 + (i % 3) * 0.04;
        particle.scale.set(0.021 + (i % 3) * 0.004, 0.07 + phase * 0.08, 0.025);
        particle.updateMatrix();
        droplets.setMatrixAt(i, particle.matrix);
        continue;
      }
      const phase = (time * 0.85 + i / dropCount) % 1;
      const angle = i * 2.39996;
      const speed = 0.65 + (i % 4) * 0.18;
      particle.position
        .copy(splashOrigin)
        .add(
          new Vector3(
            Math.cos(angle) * phase * speed,
            0.1 +
              Math.sin(phase * Math.PI) *
                (options.freeFall ? 0.9 + (i % 3) * 0.2 : 0.55 + (i % 3) * 0.16),
            Math.sin(angle) * phase * speed * 0.55,
          ),
        );
      const size = options.realistic
        ? 0.024 + (i % 4) * 0.008
        : 0.055 + (i % 3) * 0.018;
      particle.scale.set(size, size * (1.6 - phase * 0.7), size);
      particle.updateMatrix();
      droplets.setMatrixAt(i, particle.matrix);
    }
    droplets.instanceMatrix.needsUpdate = true;
  }
  function rebuild() {
    const retiredGeometry = new Set<BufferGeometry>();
    for (const object of [...waterfall.children]) {
      if (object instanceof Mesh) {
        if (object instanceof InstancedMesh) object.dispose();
        retiredGeometry.add(object.geometry);
        object.material.dispose();
      }
      waterfall.remove(object);
    }
    retiredGeometry.forEach((g) => g.dispose());
    clocks.splice(options.water ? 1 : 0);
    ripples.length = 0;
    droplets = undefined;
    triangles = 0;
    flightDuration = 0;
    rockClearance = Infinity;
    path.length = 0;
    reflectivePond?.rebuild();
    reflectivePond?.setImpact(null);
    if (!options.waterfall) return;
    root.updateMatrixWorld(true);
    const direction = new Vector3(0, 0, -1).transformDirection(root.matrixWorld);
    const ray = new Raycaster();
    const widths: number[] = [];
    // Trace the currently loaded front face, including its runtime grounding.
    // Source guide endpoints are obsolete for the refined cliff; never use them
    // as a guessed complete path. All hits are converted to the root frame.
    for (let h = 16.8; h >= 0.4; h -= 0.4) {
      const x = cliff.position.x + Math.sin(h * 0.45) * 0.28;
      const y = cliff.position.y + h;
      const width = 1.55 + ((16.8 - h) / 16.8) * 0.6;
      const hits: Vector3[] = [];
      for (const offset of [-width / 2, 0, width / 2]) {
        const origin = root.localToWorld(
          new Vector3(x + offset, y, cliff.position.z + 20),
        );
        ray.set(origin, direction);
        const hit = ray.intersectObject(cliff, true)[0];
        if (hit) hits.push(root.worldToLocal(hit.point.clone()));
      }
      if (hits.length !== 3) continue;
      path.push(new Vector3(x, y, Math.max(...hits.map((p) => p.z)) + 0.16));
      widths.push(width);
    }
    if (path.length < 8) throw new Error('Cannot trace current waterfall cliff');
    const tracedPath = path.map((p) => p.clone());
    // Round each cascade over the rock ledges while staying outside the exact
    // sampled face. This removes the hard accordion folds of the first ribbon.
    for (let pass = 0; pass < 5; pass++) {
      const previous = path.map((p) => p.z);
      path.forEach((p, i) => {
        const neighbours = previous.slice(Math.max(0, i - 2), i + 3);
        p.z = Math.max(p.z, neighbours.reduce((a, b) => a + b, 0) / neighbours.length);
      });
    }
    const last = path[path.length - 1]!;
    // Find the first pond triangle on the outlet's centre line, using the exact
    // shared guide instead of constructing a new circular shoreline.
    const pondGeometry = pond.geometry;
    pondGeometry.computeBoundingBox();
    const endZ = guide.positions[0]![2]!;
    const waterRay = new Raycaster();
    let landing: Vector3 | undefined;
    for (let z = last.z + 0.25; z <= endZ; z += 0.25) {
      waterRay.set(
        root.localToWorld(new Vector3(last.x, pondY() + 20, z)),
        new Vector3(0, -1, 0).transformDirection(root.matrixWorld),
      );
      const hit = waterRay.intersectObject(pond)[0];
      if (hit) {
        landing = root.worldToLocal(hit.point.clone());
        break;
      }
      path.push(
        new Vector3(last.x, Math.max(pondY() + 0.035, ground(last.x, z) + 0.065), z),
      );
      widths.push(1.65);
    }
    if (!landing) throw new Error('Waterfall outlet does not reach the shared pond');
    landing.z += 1.4;
    landing.y = pondY() + 0.035;
    path.push(landing);
    widths.push(1.9);
    // Closed, faceted cross sections give the falling water thickness from
    // side views. The front bulges away from the cliff instead of z-fighting.
    const flightTimes: number[] = [];
    if (options.freeFall) {
      let launch: Vector3[] | undefined;
      for (
        let lip = options.interaction ? 5 : 0;
        lip < Math.min(12, tracedPath.length - 8);
        lip++
      ) {
        const source = tracedPath[lip]!;
        const duration = Math.sqrt((2 * (source.y - landing.y)) / 9.8);
        const velocity = landing.clone().sub(source).divideScalar(duration);
        const candidate: Vector3[] = [];
        let clearance = Infinity;
        for (let i = 0; i <= 64; i++) {
          const t = (i / 64) * duration;
          const p = source.clone().addScaledVector(velocity, t);
          p.y = source.y - 4.9 * t * t;
          candidate.push(p);
          if (i > 0 && i < 64) {
            const width = 1.5 + (i / 64) ** 2 * 0.6;
            for (const offset of [-width / 2, 0, width / 2]) {
              ray.set(
                root.localToWorld(
                  new Vector3(p.x + offset, p.y, cliff.position.z + 20),
                ),
                direction,
              );
              const hit = ray.intersectObject(cliff, true)[0];
              if (hit)
                clearance = Math.min(
                  clearance,
                  p.z - root.worldToLocal(hit.point.clone()).z,
                );
            }
          }
        }
        if (clearance <= 0.08) continue;
        launch = candidate;
        flightDuration = duration;
        rockClearance = clearance;
        flightStartIndex = lip;
        flightOrigin.copy(source);
        break;
      }
      if (!launch)
        throw new Error('No clear free-fall trajectory from the sampled cliff lip');
      path.length = 0;
      widths.length = 0;
      // A short wetted crest feeds the first real lip that clears the rock.
      // Never move the emitter into empty air just to hide an intersection.
      for (let i = 0; i < flightStartIndex; i++) {
        path.push(tracedPath[i]!);
        widths.push(1.5);
        flightTimes.push((i - flightStartIndex) * 0.06);
      }
      launch.forEach((p, i) => {
        path.push(p);
        widths.push(1.5 + (i / 64) ** 2 * 0.6);
        flightTimes.push((i / 64) * flightDuration);
      });
      waterRay.set(
        root.localToWorld(new Vector3(landing.x, pondY() + 20, landing.z)),
        new Vector3(0, -1, 0).transformDirection(root.matrixWorld),
      );
      if (!waterRay.intersectObject(pond).length)
        throw new Error('Free fall misses the shared pond');
    }
    const positions: number[] = [],
      indices: number[] = [],
      distances: number[] = [],
      across: number[] = [],
      uvs: number[] = [],
      flights: number[] = [];
    const sides = 10;
    let length = 0;
    path.forEach((p, i) => {
      if (i) length += p.distanceTo(path[i - 1]!);
      const width = widths[i]! * (1.07 + 0.035 * Math.sin(i * 0.35));
      const tangent = path[Math.min(i + 1, path.length - 1)]!.clone()
        .sub(path[Math.max(0, i - 1)]!)
        .normalize();
      const outward = new Vector3(0, tangent.z, -tangent.y).normalize();
      const depth = 0.025 + Math.abs(tangent.y) * 0.18;
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const x = options.realistic ? (j / sides) * 2 - 1 : Math.cos(angle);
        const section = p
          .clone()
          .addScaledVector(
            outward,
            options.realistic
              ? 0.07 + Math.sin(x * 4.3 + i * 0.17) * 0.025
              : depth + 0.02 + Math.sin(angle) * depth,
          );
        positions.push(section.x + (x * width) / 2, section.y, section.z);
        distances.push(length);
        flights.push(flightTimes[i] ?? 0);
        across.push(x);
        uvs.push((x + 1) / 2, length * 0.18);
        if (i && j < sides) {
          const a = (i - 1) * (sides + 1) + j;
          const b = i * (sides + 1) + j;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('flightTime', new Float32BufferAttribute(flights, 1));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('flowDistance', new Float32BufferAttribute(distances, 1));
    geometry.setAttribute('flowAcross', new Float32BufferAttribute(across, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = options.realistic
      ? new MeshPhysicalMaterial({
          color: '#c2e0e3',
          roughness: 0.16,
          metalness: 0,
          transmission: 0.38,
          thickness: 0.09,
          ior: 1.333,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          side: DoubleSide,
          normalMap: normalTexture,
          normalScale: new Vector2(0.45, 0.65),
        })
      : new MeshStandardMaterial({
          color: '#9bcfcf',
          roughness: 0.7,
          metalness: 0.0,
          side: DoubleSide,
          flatShading: false,
        });
    material.userData.flightDuration = flightDuration || 1;
    clocks.push(
      flowingMaterial(
        material,
        true,
        options.realistic,
        options.freeFall,
        options.interaction,
      ),
    );
    const flow = new Mesh(geometry, material);
    flow.name = 'WaterfallVolume';
    flow.receiveShadow = true;
    waterfall.add(flow);
    triangles = indices.length / 3;
    if (options.realistic) {
      const veilMaterial = new MeshStandardMaterial({
        color: '#e4f2ef',
        roughness: 0.75,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        side: DoubleSide,
      });
      veilMaterial.userData.flightDuration = flightDuration || 1;
      clocks.push(
        flowingMaterial(
          veilMaterial,
          true,
          true,
          options.freeFall,
          options.interaction,
        ),
      );
      const originalCompile = veilMaterial.onBeforeCompile;
      veilMaterial.onBeforeCompile = (shader, renderer) => {
        originalCompile(shader, renderer);
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <alphatest_fragment>',
          `diffuseColor.a *= smoothstep(0.32, 0.72, flowNoise(vec2(oasisAcross * 9.0, ${options.freeFall ? 'oasisFlight * 19.0 - oasisTime * 19.0' : 'oasisFlow * 2.5 - oasisTime * 7.0'})));
#include <alphatest_fragment>`,
        );
      };
      veilMaterial.customProgramCacheKey = () =>
        options.freeFall
          ? options.interaction
            ? 'oasis-waterfall-foam-veil-v5'
            : 'oasis-waterfall-foam-veil-v4'
          : 'oasis-waterfall-foam-veil-v3';
      const veil = new Mesh(geometry, veilMaterial);
      veil.name = 'WaterfallAerationVeil';
      veil.position.z = 0.025;
      veil.receiveShadow = true;
      waterfall.add(veil);
      triangles += indices.length / 3;
    }

    // A scalloped foam patch follows the actual outlet into the shared pond.
    // Horizontal effects sit just above that same surface, never a new basin.
    splashOrigin = landing.clone();
    if (!options.interaction) splashOrigin.z += 0.22;
    splashOrigin.y = pondY() + 0.065;
    if (options.interaction)
      reflectivePond?.setImpact(new Vector2(landing.x, landing.z), 0.85);
    const foamMaterial = () =>
      new MeshStandardMaterial({
        color: '#d4e8da',
        roughness: 0.9,
        transparent: true,
        opacity: options.realistic ? 0.65 : 0.72,
        map: options.realistic ? foamTexture : undefined,
        depthWrite: false,
        side: DoubleSide,
      });
    for (let i = 0; i < (options.interaction ? 2 : 5); i++) {
      const foam = new Mesh(
        new CircleGeometry(options.realistic ? 0.7 : 0.45, options.realistic ? 32 : 7),
        foamMaterial(),
      );
      foam.name = 'WaterfallFoam';
      foam.rotation.x = -Math.PI / 2;
      foam.position.copy(splashOrigin);
      foam.position.x += options.interaction ? (i - 0.5) * 0.34 : (i - 2) * 0.38;
      foam.position.z += options.interaction
        ? Math.sin(i * 2.1) * 0.12
        : Math.sin(i * 2.1) * 0.18;
      foam.position.y += i * 0.002;
      foam.scale.set(
        options.interaction ? 1.15 : 1.3,
        options.interaction ? 0.62 : 0.8,
        1,
      );
      foam.receiveShadow = true;
      waterfall.add(foam);
      triangles += options.realistic ? 32 : 7;
    }
    for (let i = 0; i < (options.interaction ? 0 : 3); i++) {
      const ripple = new Mesh(
        new RingGeometry(options.realistic ? 0.985 : 0.96, 1, 32),
        foamMaterial(),
      );
      ripple.name = 'WaterfallImpactRipple';
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.copy(splashOrigin);
      ripple.position.y += 0.02 + i * 0.003;
      waterfall.add(ripple);
      ripples.push(ripple);
      triangles += 64;
    }
    droplets = new InstancedMesh(
      options.realistic ? new SphereGeometry(1, 8, 6) : new IcosahedronGeometry(1, 0),
      options.freeFall
        ? new MeshStandardMaterial({
            color: '#d9f1f4',
            roughness: 0.22,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          })
        : new MeshStandardMaterial({
            color: '#c5e6df',
            roughness: 0.55,
            flatShading: !options.realistic,
          }),
      dropCount,
    );
    droplets.name = 'WaterfallSplashDrops';
    droplets.frustumCulled = false;
    waterfall.add(droplets);
    triangles += dropCount * (options.realistic ? 80 : 20);
    animateSplash(0);
  }
  content.add(waterfall);
  rebuild();
  let elapsed = 0,
    previousHour = -1,
    previousEnvironment = '';
  return {
    group: waterfall,
    rebuild,
    update(dt: number, hour: number, reduced: boolean, environmentKey = '') {
      const hourBucket = Math.floor(hour * 60);
      if (hourBucket !== previousHour || environmentKey !== previousEnvironment) {
        previousEnvironment = environmentKey;
        reflectivePond?.invalidate();
        previousHour = hourBucket;
      }
      if (
        reduced ||
        dt <= 0 ||
        !Number.isFinite(dt) ||
        !root.visible ||
        !((options.water && pond.visible) || (options.waterfall && waterfall.visible))
      )
        return false;
      elapsed = (elapsed + Math.min(dt, 0.1)) % 10000;
      for (const clock of clocks) clock.value = elapsed;
      animateSplash(elapsed);
      if (normalTexture) normalTexture.offset.y = -elapsed * 0.42;
      return clocks.length > 0;
    },
    invalidate() {
      reflectivePond?.invalidate();
    },
    dispose() {
      reflectivePond?.dispose();
      normalTexture?.dispose();
      foamTexture?.dispose();
    },
    snapshot: () => ({
      ...options,
      elapsed,
      triangles,
      version: options.interaction
        ? 5
        : options.freeFall
          ? 4
          : options.realistic
            ? 3
            : 2,
      flightDuration,
      flightStartIndex,
      rockClearance: Number.isFinite(rockClearance) ? rockClearance : null,
      impact: options.interaction ? [splashOrigin.x, splashOrigin.z] : null,
      reflection: reflectivePond?.snapshot() ?? null,
      droplets: droplets?.count ?? 0,
      ripples: ripples.length,
      path: path.map((p) => root.localToWorld(p.clone()).toArray()),
    }),
  };
}
