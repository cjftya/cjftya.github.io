import {
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import type { BufferGeometry } from 'three';
import type { VegetationSite } from '../vegetation/vegetationPlacement';
import { SCENERY_KINDS, SCENERY_SEED, SCENERY_ZONES } from './sceneryConfig';
import type { SceneryKind, SceneryVariant } from './sceneryConfig';
import { createSceneryGeometry, projectedFootprint } from './sceneryGeometry';
import { placeScenery } from './sceneryPlacement';
import type { Occupied, SceneryFootprints } from './sceneryPlacement';
export function createScenery(
  root: Group,
  variant: SceneryVariant = 'a',
  mobile = false,
) {
  const group = new Group();
  group.name = 'OasisScenery';
  root.add(group);
  const meshes = new Map<
      SceneryKind,
      InstancedMesh<BufferGeometry, MeshStandardMaterial>
    >(),
    footprints: SceneryFootprints = {};
  if (variant !== 'off')
    for (const kind of SCENERY_KINDS) {
      const geometry = createSceneryGeometry(kind);
      footprints[kind] = projectedFootprint(geometry);
      const mesh = new InstancedMesh(
        geometry,
        new MeshStandardMaterial({
          color: '#ffffff',
          vertexColors: true,
          flatShading: true,
          roughness: 1,
        }),
        Math.max(
          1,
          SCENERY_ZONES.reduce(
            (sum, zone) => sum + Math.ceil((zone.counts[kind] ?? 0) * 1.5),
            0,
          ),
        ),
      );
      mesh.name = `Scenery_${kind}`;
      mesh.count = 0;
      // The monumental grove is assembled from these low-poly instances.
      // Keep them in the active sun/moon shadow pass so the added trees are
      // grounded against the terrain instead of appearing uniformly lit.
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshes.set(kind, mesh);
      group.add(mesh);
    }
  let disposed = false,
    placement = placeScenery({} as VegetationSite, [], {}, 'off');
  const matrix = new Matrix4(),
    q = new Quaternion(),
    up = new Vector3(0, 1, 0),
    color = new Color();
  const priorityZones = new Set(
    SCENERY_ZONES.filter((z) => z.priority).map((z) => z.id),
  );
  function refresh(site: VegetationSite, occupied: readonly Occupied[]) {
    if (disposed) return;
    placement = placeScenery(site, occupied, footprints, variant);
    for (const [kind, mesh] of meshes) {
      let count = 0,
        ordinal = 0;
      for (const p of placement.instances.filter((p) => p.kind === kind)) {
        // Keep connecting groves and rock shoulders; thin only the outer filling.
        if (
          mobile &&
          kind !== 'ridge' &&
          !priorityZones.has(p.zone) &&
          ordinal++ % 4 === 3
        )
          continue;
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
      seed: SCENERY_SEED,
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
