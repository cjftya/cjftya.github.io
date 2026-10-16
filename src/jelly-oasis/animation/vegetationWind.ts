import {
  Float32BufferAttribute,
  InstancedMesh,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  RGBADepthPacking,
  Vector2,
} from 'three';
import type { BufferGeometry, Material, Object3D } from 'three';
import type { WeatherProfile } from '../environment/weather';

/** Rest-space anchor XZ and bending/flutter amplitudes; preserves painted RGB. */
export function windWeights(
  geometry: BufferGeometry,
  x: number,
  z: number,
  weights: (x: number, y: number, z: number) => readonly [number, number],
): BufferGeometry {
  const p = geometry.attributes.position!;
  const data = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    const [bend, detail] = weights(p.getX(i), p.getY(i), p.getZ(i));
    data.set([x, z, bend, detail], i * 4);
  }
  geometry.setAttribute('oasisWind', new Float32BufferAttribute(data, 4));
  return geometry;
}

export function rootedWind(
  geometry: BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
  height = 0.4,
  amplitude = 0.055,
): BufferGeometry {
  return windWeights(geometry, x, z, (_x, py) => {
    const t = Math.min(1, Math.max(0, (py - y) / Math.max(height, 0.001)));
    return [amplitude * t * t * (3 - 2 * t), 0];
  });
}

// Identical deformation for color and directional shadow passes. World-space
// anchors keep rotated/scaled instances responsive to the same moving breeze.
const WIND_GLSL = /* glsl */ `
attribute vec4 oasisWind;
uniform float oasisWindTime;
uniform float oasisWindStrength;
uniform float oasisWindGust;
uniform vec2 oasisWindDirection;
vec3 oasisDeform(vec3 p) {
  mat4 basis = modelMatrix;
  #ifdef USE_INSTANCING
    basis = modelMatrix * instanceMatrix;
  #endif
  vec3 anchor = (basis * vec4(oasisWind.x, 0., oasisWind.y, 1.)).xyz;
  float phase = dot(anchor.xz, vec2(.173, .271));
  float travel = dot(anchor.xz, oasisWindDirection) * .045 - oasisWindTime * .52;
  float gust = .5 + .5 * sin(travel + .32 * sin(travel * .43));
  float strength = clamp(oasisWindStrength + oasisWindGust * gust, 0., 1.);
  float sway = .48 + .32 * sin(oasisWindTime * .83 + phase)
                     + .20 * sin(oasisWindTime * 1.37 + phase * 1.71);
  float flutter = sin(oasisWindTime * 2.3 + phase * 2.1);
  vec3 direction = vec3(oasisWindDirection.x, 0., oasisWindDirection.y);
  vec3 localDirection = normalize(vec3(
    dot(direction, basis[0].xyz) / max(dot(basis[0].xyz, basis[0].xyz), .0001),
    dot(direction, basis[1].xyz) / max(dot(basis[1].xyz, basis[1].xyz), .0001),
    dot(direction, basis[2].xyz) / max(dot(basis[2].xyz, basis[2].xyz), .0001)
  ));
  return p + localDirection * strength * (oasisWind.z * sway + oasisWind.w * flutter);
}
`;

type Binding = { mesh: Mesh; original: Material; depth: Material | undefined };

/** One per scene, constant CPU work per frame. No per-instance matrix uploads. */
export class VegetationWind {
  readonly uniforms = {
    oasisWindTime: { value: 0 },
    oasisWindStrength: { value: 0 },
    oasisWindGust: { value: 0 },
    oasisWindDirection: { value: new Vector2(1, 0) },
  };
  enabled = true;
  paused = false;
  private bindings: Binding[] = [];
  private materials = new Map<Material, MeshStandardMaterial>();
  private depths = new Map<Material, MeshDepthMaterial>();

  update(seconds: number, weather: Readonly<WeatherProfile>, reducedMotion: boolean) {
    const u = this.uniforms;
    const wasMoving = u.oasisWindStrength.value > 0 || u.oasisWindGust.value > 0;
    if (!this.enabled) {
      u.oasisWindStrength.value = u.oasisWindGust.value = 0;
      return wasMoving;
    }
    if (this.paused) return false;
    const dt = Number.isFinite(seconds) ? Math.min(0.1, Math.max(0, seconds)) : 0;
    u.oasisWindTime.value += dt;
    const t = u.oasisWindTime.value;
    const angle = 0.6 + 0.28 * Math.sin(t * 0.025) + 0.12 * Math.sin(t * 0.067);
    u.oasisWindDirection.value.set(Math.cos(angle), Math.sin(angle));
    // Keep the breeze alive on every device. Reduced motion softens movement
    // instead of silently freezing the entire landscape. No device-specific gain.
    const blend = 1 - Math.exp(-dt * 1.8);
    u.oasisWindStrength.value +=
      (weather.windStrength * (reducedMotion ? 0.65 : 1) - u.oasisWindStrength.value) *
      blend;
    u.oasisWindGust.value +=
      (weather.windGust * (reducedMotion ? 0.35 : 1) - u.oasisWindGust.value) * blend;
    return dt > 0 && this.bindings.length > 0;
  }

  private patch(material: Material) {
    const before = material.onBeforeCompile;
    const key = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      before.call(material, shader, renderer);
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = WIND_GLSL + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        'transformed = oasisDeform(transformed);\n#include <project_vertex>',
      );
    };
    material.customProgramCacheKey = () => `${key}:oasis-wind-v2`;
    material.needsUpdate = true;
  }

  /** Restore original material ownership before a placement rebuild/disposal. */
  unbind() {
    for (const { mesh, original, depth } of this.bindings) {
      mesh.material = original;
      mesh.customDepthMaterial = depth;
    }
    this.bindings = [];
  }

  bind(root: Object3D) {
    this.unbind();
    root.traverse((mesh) => {
      if (!(mesh instanceof Mesh) || !(mesh.material instanceof MeshStandardMaterial))
        return;
      const weights = mesh.geometry.getAttribute('oasisWind');
      if (!weights) return;
      let maxMotion = 0;
      for (let i = 0; i < weights.count; i++)
        maxMotion = Math.max(
          maxMotion,
          Math.abs(weights.getZ(i)) + Math.abs(weights.getW(i)),
        );
      if (!maxMotion) return;
      const original = mesh.material;
      let material = this.materials.get(original);
      if (!material) {
        material = original.clone();
        material.onBeforeCompile = original.onBeforeCompile;
        material.customProgramCacheKey = original.customProgramCacheKey.bind(original);
        this.patch(material);
        this.materials.set(original, material);
      }
      let depth = this.depths.get(original);
      if (!depth) {
        depth = new MeshDepthMaterial({
          depthPacking: RGBADepthPacking,
          side: original.side,
        });
        this.patch(depth);
        this.depths.set(original, depth);
      }
      this.bindings.push({ mesh, original, depth: mesh.customDepthMaterial });
      mesh.material = material;
      mesh.customDepthMaterial = depth;
      // Bound the maximum shader displacement; do not accumulate padding on rebuild.
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
      mesh.geometry.boundingBox!.expandByScalar(maxMotion * 1.05);
      mesh.geometry.boundingSphere!.radius += maxMotion * 1.05;
      if (mesh instanceof InstancedMesh) {
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    });
  }

  refreshMaterials() {
    for (const material of [...this.materials.values(), ...this.depths.values()])
      material.needsUpdate = true;
  }

  snapshot() {
    return {
      enabled: this.enabled,
      paused: this.paused,
      time: this.uniforms.oasisWindTime.value,
      strength: this.uniforms.oasisWindStrength.value,
      gust: this.uniforms.oasisWindGust.value,
      direction: this.uniforms.oasisWindDirection.value.toArray(),
      meshes: this.bindings.map(({ mesh }) => mesh.name),
      materials: this.materials.size,
      depthMaterials: this.depths.size,
    };
  }

  dispose() {
    this.unbind();
    for (const material of [...this.materials.values(), ...this.depths.values()])
      material.dispose();
    this.materials.clear();
    this.depths.clear();
  }
}
