import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Vector3,
} from 'three';
import type { LayoutGuide } from '../landmarkConfig';

export interface WaterOptions {
  water: boolean;
  waterfall: boolean;
}

// Keep standard lighting, fog and receiving shadows. Only the diffuse colour
// moves; geometry, shoreline, water level and transparency stay unchanged.
function flowingMaterial(material: MeshStandardMaterial, waterfall: boolean) {
  const time = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.oasisTime = time;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 oasisPosition;' +
          (waterfall ? '\nattribute float flowDistance; varying float oasisFlow;' : ''),
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\noasisPosition = position;' +
          (waterfall ? '\noasisFlow = flowDistance;' : ''),
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 oasisPosition;\nuniform float oasisTime;' +
          (waterfall ? '\nvarying float oasisFlow;' : ''),
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        ${
          waterfall
            ? `float flow = sin(-oasisFlow * 3.2 + oasisTime * 3.8 + oasisPosition.x * 0.7);
             float streak = pow(max(0.0, sin(oasisPosition.x * 7.0 + oasisPosition.z * 0.5)), 5.0);
             diffuseColor.rgb *= 0.94 + 0.10 * flow + 0.14 * streak;`
            : `float ripple = sin(oasisPosition.x * 1.6 + oasisPosition.z * 0.9 - oasisTime * 0.55)
               * sin(oasisPosition.z * 1.1 - oasisTime * 0.35);
             diffuseColor.rgb *= 1.0 + ripple * 0.065;`
        }
      `,
      );
  };
  material.customProgramCacheKey = () =>
    waterfall ? 'oasis-waterfall-v1' : 'oasis-water-v1';
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
  const clocks: { value: number }[] = [];
  if (options.water) clocks.push(flowingMaterial(pond.material, false));
  const waterfall = new Group();
  waterfall.name = 'WaterfallFlowV1';
  const path: Vector3[] = [];
  let triangles = 0;
  function rebuild() {
    for (const object of [...waterfall.children]) {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
      waterfall.remove(object);
    }
    clocks.splice(options.water ? 1 : 0);
    path.length = 0;
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
      const width = h > 9 ? 1.45 : 1.8;
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
    landing.z += 0.4;
    landing.y = pondY() + 0.035;
    path.push(landing);
    widths.push(1.9);
    const positions: number[] = [],
      indices: number[] = [];
    path.forEach((p, i) => {
      positions.push(p.x - widths[i]! / 2, p.y, p.z, p.x + widths[i]! / 2, p.y, p.z);
      if (i) {
        const a = (i - 1) * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const distances: number[] = [];
    let length = 0;
    path.forEach((p, i) => {
      if (i) length += p.distanceTo(path[i - 1]!);
      distances.push(length, length);
    });
    geometry.setAttribute('flowDistance', new Float32BufferAttribute(distances, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({
      color: '#82b8ba',
      roughness: 0.8,
      side: DoubleSide,
      flatShading: true,
    });
    clocks.push(flowingMaterial(material, true));
    const flow = new Mesh(geometry, material);
    flow.name = 'WaterfallRibbon';
    flow.receiveShadow = true;
    waterfall.add(flow);
    triangles = indices.length / 3;
  }
  content.add(waterfall);
  rebuild();
  let elapsed = 0;
  return {
    group: waterfall,
    rebuild,
    update(dt: number, _hour: number, reduced: boolean) {
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
      return clocks.length > 0;
    },
    snapshot: () => ({
      ...options,
      elapsed,
      triangles,
      path: path.map((p) => root.localToWorld(p.clone()).toArray()),
    }),
  };
}
