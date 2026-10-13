import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import type { BufferGeometry } from 'three';
import type { VegetationSite } from '../vegetation/vegetationPlacement';
import { MEADOW_KINDS, MEADOW_SEED } from './meadowConfig';
import type { MeadowKind, MeadowVariant } from './meadowConfig';
import { createMeadowGeometry } from './meadowGeometry';
import { placeMeadow } from './meadowPlacement';
import type { Occupied } from '../scenery/sceneryPlacement';
export function createMeadow(
  root: Group,
  variant: MeadowVariant = 'a',
  mobile = false,
) {
  const group = new Group();
  group.name = 'OasisMeadow';
  root.add(group);
  const meshes = new Map<
    MeadowKind,
    InstancedMesh<BufferGeometry, MeshStandardMaterial>
  >();
  if (variant !== 'off')
    for (const kind of MEADOW_KINDS) {
      const geometry = createMeadowGeometry(kind);
      const mesh = new InstancedMesh(
        geometry,
        new MeshStandardMaterial({
          color: '#ffffff',
          vertexColors: true,
          side: DoubleSide,
          flatShading: true,
          roughness: 1,
        }),
        256,
      );
      mesh.name = `Meadow_${kind}`;
      mesh.count = 0;
      // Meadow tufts are merged and instanced, so enabling the mesh adds one
      // shadow draw per visible kind rather than one draw per flower cluster.
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.set(kind, mesh);
      group.add(mesh);
    }
  let disposed = false,
    placement = placeMeadow({} as VegetationSite, [], 'off');
  const matrix = new Matrix4(),
    q = new Quaternion(),
    up = new Vector3(0, 1, 0),
    color = new Color();
  function refresh(site: VegetationSite, occupied: readonly Occupied[]) {
    if (disposed) return;
    placement = placeMeadow(site, occupied, variant);
    for (const [kind, mesh] of meshes) {
      let count = 0,
        ordinal = 0;
      for (const p of placement.instances.filter((p) => p.kind === kind)) {
        // Stable two-of-three subset of each source; preserve master occupancy.
        if (mobile && ordinal++ % 3 === 2) continue;
        matrix.compose(
          new Vector3(p.x, p.y, p.z),
          q.setFromAxisAngle(up, p.rotation),
          new Vector3().setScalar(p.scale),
        );
        mesh.setMatrixAt(count, matrix);
        mesh.setColorAt(count++, color.setScalar(0.9 + p.tint * 0.12));
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
      mobile,
      seed: MEADOW_SEED,
      requested: placement.requested,
      rejected: placement.rejected,
      zoneCounts: placement.zoneCounts,
      placed: Object.fromEntries([...meshes].map(([kind, mesh]) => [kind, mesh.count])),
      instanceCount: [...meshes.values()].reduce((n, m) => n + m.count, 0),
      draws: [...meshes.values()].filter((m) => m.count).length,
      triangles: [...meshes.values()].reduce(
        (n, m) =>
          n +
          (m.count *
            (m.geometry.index?.count ?? m.geometry.attributes.position!.count)) /
            3,
        0,
      ),
      resources: { geometries: meshes.size, materials: meshes.size, textures: 0 },
      visible: group.visible,
    }),
    refreshMaterials() {
      if (!disposed) for (const m of meshes.values()) m.material.needsUpdate = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const m of meshes.values()) {
        m.dispose();
        m.geometry.dispose();
        m.material.dispose();
      }
      group.clear();
    },
  };
}
