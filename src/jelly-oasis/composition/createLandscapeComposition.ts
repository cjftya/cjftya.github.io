import {
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import type { BufferGeometry } from 'three';
import { createVegetationGeometry } from '../vegetation/createVegetation';
import type {
  VegetationInstance,
  VegetationSite,
} from '../vegetation/vegetationPlacement';
import { COMPOSITION_KINDS, COMPOSITION_SEED } from './compositionConfig';
import type { CompositionKind, CompositionVariant } from './compositionConfig';
import { placeComposition } from './compositionPlacement';
export function createCompositionRock() {
  const geometry = new IcosahedronGeometry(1, 0);
  geometry.scale(1, 0.42, 0.78);
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox!.min.y, 0);
  geometry.computeVertexNormals();
  return geometry;
}
export function createLandscapeComposition(
  root: Group,
  variant: CompositionVariant = 'a',
  mobile = false,
) {
  const group = new Group();
  group.name = 'OasisLandscapeComposition';
  root.add(group);
  const meshes = new Map<
    CompositionKind,
    InstancedMesh<BufferGeometry, MeshStandardMaterial>
  >();
  // Off allocates no GPU resources.
  if (variant !== 'off')
    for (const kind of COMPOSITION_KINDS) {
      const mesh = new InstancedMesh(
        kind === 'rock' ? createCompositionRock() : createVegetationGeometry(kind),
        new MeshStandardMaterial({
          color: kind === 'rock' ? '#898b85' : '#ffffff',
          vertexColors: kind !== 'rock',
          flatShading: true,
          roughness: 1,
          side: kind === 'rock' ? undefined : DoubleSide,
        }),
        160,
      );
      mesh.name = `Composition_${kind}`;
      mesh.count = 0;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      group.add(mesh);
      meshes.set(kind, mesh);
    }
  let disposed = false;
  let placement = {
    instances: [] as ReturnType<typeof placeComposition>['instances'],
    requested: {} as Record<string, number>,
    rejected: {} as Record<string, number>,
    zoneCounts: {} as Record<string, number>,
  };
  const matrix = new Matrix4(),
    q = new Quaternion(),
    up = new Vector3(0, 1, 0),
    color = new Color();
  // Each source and material belongs solely to this owner.
  function refresh(site: VegetationSite, vegetation: VegetationInstance[]) {
    if (disposed) return;
    placement = placeComposition(site, vegetation, variant);
    for (const [kind, mesh] of meshes) {
      let count = 0,
        ordinal = 0;
      for (const p of placement.instances.filter((p) => p.kind === kind)) {
        if (mobile && ordinal++ % 3 === 2) continue;
        matrix.compose(
          new Vector3(p.x, p.y, p.z),
          q.setFromAxisAngle(up, p.rotation),
          new Vector3().setScalar(p.scale),
        );
        mesh.setMatrixAt(count, matrix);
        color.setScalar(0.92 + p.tint * 0.08);
        mesh.setColorAt(count++, color);
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
    instances: () => placement.instances.map((p) => ({ ...p })),
    snapshot: () => ({
      variant,
      seed: COMPOSITION_SEED,
      mobile,
      requested: placement.requested,
      rejected: placement.rejected,
      zoneCounts: placement.zoneCounts,
      placed: Object.fromEntries([...meshes].map(([k, m]) => [k, m.count])),
      instanceCount: [...meshes.values()].reduce((n, m) => n + m.count, 0),
      triangles: [...meshes.values()].reduce(
        (n, m) =>
          n +
          (m.count *
            (m.geometry.index?.count ?? m.geometry.attributes.position!.count)) /
            3,
        0,
      ),
      draws: [...meshes.values()].filter((m) => m.count).length,
      resources: { geometries: meshes.size, materials: meshes.size },
      visible: group.visible,
    }),
    refreshMaterials: () => {
      for (const mesh of meshes.values()) mesh.material.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const mesh of meshes.values()) {
        mesh.dispose();
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      group.clear();
    },
  };
}
