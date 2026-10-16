import { rootedWind } from '../animation/vegetationWind';
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LandmarkPlacement, LayoutGuide } from '../landmark/landmarkConfig';
import type { TerrainConfig } from '../terrain/heightfield';
import { groundFootprints, placeVegetation } from './vegetationPlacement';
import type { Footprint } from './vegetationPlacement';
import {
  VEGETATION_COUNTS,
  VEGETATION_KINDS,
  VEGETATION_SEED,
} from './vegetationConfig';
import type { VegetationDensity, VegetationKind } from './vegetationConfig';
export function createVegetationGeometry(kind: VegetationKind): BufferGeometry {
  const parts: BufferGeometry[] = [];
  function add(geometry: BufferGeometry, color: string) {
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    flat.deleteAttribute('uv');
    flat.computeVertexNormals();
    const c = new Color(color),
      count = flat.attributes.position!.count;
    flat.setAttribute(
      'color',
      new Float32BufferAttribute(
        Array.from({ length: count }, () => [c.r, c.g, c.b]).flat(),
        3,
      ),
    );
    parts.push(flat);
  }
  function triangle(points: number[], color: string) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(points, 3));
    add(g, color);
  }
  if (kind === 'grass') {
    for (let i = 0; i < 5; i++) {
      const a = i * 2.399,
        h = [0.32, 0.24, 0.37, 0.29, 0.27][i]!;
      const dx = Math.cos(a),
        dz = Math.sin(a),
        width = 0.045;
      triangle(
        [
          -dz * width,
          0.005,
          dx * width,
          dz * width,
          0.005,
          -dx * width,
          dx * 0.16,
          h,
          dz * 0.16,
        ],
        i % 2 ? '#607d46' : '#728d50',
      );
      // Folded side catches light and reads as a blade, not an alpha card.
      triangle(
        [
          dz * width,
          0.005,
          -dx * width,
          dx * 0.055,
          0.05,
          dz * 0.055,
          dx * 0.16,
          h,
          dz * 0.16,
        ],
        '#7d9557',
      );
    }
  } else if (kind === 'shrub') {
    const stem = new CylinderGeometry(0.035, 0.05, 0.4, 5, 1);
    stem.translate(0, 0.2, 0);
    add(stem, '#6d7150');
    [
      [-0.22, 0.32, 0.03, 0.3],
      [0.2, 0.37, 0, 0.32],
      [0, 0.55, -0.11, 0.29],
    ].forEach(([x, y, z, r], i) => {
      const g = new IcosahedronGeometry(r!, 0);
      g.scale(1, 0.85, 0.82);
      g.rotateY(i * 0.8);
      g.translate(x!, y!, z!);
      add(g, ['#6d8858', '#77915c', '#819763'][i]!);
    });
  } else {
    const stem = new CylinderGeometry(0.013, 0.018, 0.4, 5, 1);
    stem.translate(0, 0.2, 0);
    add(stem, '#68804b');
    triangle([0, 0.12, 0, -0.13, 0.23, 0.03, -0.01, 0.23, 0.018], '#728c51');
    triangle([0, 0.22, 0, 0.13, 0.31, -0.01, 0.01, 0.3, 0.023], '#81985d');
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        b = a + 0.46;
      triangle(
        [
          Math.cos(a - 0.46) * 0.035,
          0.405,
          Math.sin(a - 0.46) * 0.035,
          Math.cos(a) * 0.125,
          0.43,
          Math.sin(a) * 0.125,
          Math.cos(b) * 0.035,
          0.405,
          Math.sin(b) * 0.035,
        ],
        i % 2 ? '#b4a1bd' : '#c4afd0',
      );
    }
    const center = new IcosahedronGeometry(0.036, 0);
    center.scale(1, 0.48, 1);
    center.translate(0, 0.42, 0);
    add(center, '#c4b97a');
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return rootedWind(
    merged,
    0,
    0.005,
    0,
    kind === 'shrub' ? 0.65 : 0.395,
    kind === 'shrub' ? 0.065 : 0.055,
  );
}
export function createVegetation(
  root: Group,
  modules: Map<string, Group>,
  terrain: TerrainConfig,
  pond: LayoutGuide,
  approach: LayoutGuide,
  density: VegetationDensity = 'density-a',
  mobile = false,
) {
  const group = new Group();
  group.name = 'OasisVegetation';
  root.add(group);
  const meshes = {} as Record<
    VegetationKind,
    InstancedMesh<BufferGeometry, MeshStandardMaterial>
  >;
  for (const kind of VEGETATION_KINDS) {
    const mesh = new InstancedMesh(
      createVegetationGeometry(kind),
      new MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 1,
        side: DoubleSide,
      }),
      VEGETATION_COUNTS['density-b'][kind],
    );
    mesh.name = `Vegetation_${kind}`;
    mesh.count = 0;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
    meshes[kind] = mesh;
  }
  let disposed = false;
  let result = {
    instances: [] as ReturnType<typeof placeVegetation>['instances'],
    rejected: {} as Record<string, number>,
    requested: { ...VEGETATION_COUNTS[density] },
  };
  const matrix = new Matrix4(),
    quaternion = new Quaternion(),
    up = new Vector3(0, 1, 0),
    tint = new Color();
  function refresh(placement: LandmarkPlacement, obstacles?: Footprint[]) {
    if (disposed) return;
    result = placeVegetation(
      {
        placement,
        rootY: root.position.y,
        terrain,
        pond,
        approach,
        obstacles:
          obstacles ??
          (density === 'off' ? [] : groundFootprints(root, modules, terrain)),
      },
      density,
    );
    for (const kind of VEGETATION_KINDS) {
      const mesh = meshes[kind];
      let count = 0,
        ordinal = 0;
      for (const p of result.instances.filter((p) => p.kind === kind)) {
        // Stable 2/3 subset of each species; never change the master seed.
        if (mobile && ordinal++ % 3 === 2) continue;
        matrix.compose(
          new Vector3(p.x, p.y, p.z),
          quaternion.setFromAxisAngle(up, p.rotation),
          new Vector3().setScalar(p.scale),
        );
        mesh.setMatrixAt(count, matrix);
        tint.setRGB(0.91 + p.tint * 0.09, 0.93 + p.tint * 0.07, 0.9 + p.tint * 0.1);
        mesh.setColorAt(count, tint);
        count++;
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
  }
  return {
    group,
    refresh,
    snapshot: () => ({
      seed: VEGETATION_SEED,
      density,
      mobile,
      requested: result.requested,
      placed: Object.fromEntries(VEGETATION_KINDS.map((k) => [k, meshes[k].count])),
      rejected: result.rejected,
      triangles: VEGETATION_KINDS.reduce(
        (n, k) =>
          n + (meshes[k].geometry.attributes.position!.count / 3) * meshes[k].count,
        0,
      ),
      instanceCount: VEGETATION_KINDS.reduce((n, k) => n + meshes[k].count, 0),
      draws: VEGETATION_KINDS.filter((k) => meshes[k].count > 0).length,
      visible: group.visible,
      sourceTriangles: Object.fromEntries(
        VEGETATION_KINDS.map((k) => [
          k,
          meshes[k].geometry.attributes.position!.count / 3,
        ]),
      ),
    }),
    instances: () => result.instances.map((p) => ({ ...p })),
    refreshMaterials: () => {
      for (const mesh of Object.values(meshes)) mesh.material.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const mesh of Object.values(meshes)) {
        mesh.dispose();
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      group.clear();
    },
  };
}
