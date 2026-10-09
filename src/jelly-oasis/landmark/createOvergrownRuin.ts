import {
  Box3,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { TerrainConfig } from '../terrain/heightfield';
import { OVERGROWN_RUIN_CONFIG, LANDMARK_MODULE_OFFSETS } from './landmarkConfig';
import type { LandmarkPlacement, LayoutGuide } from './landmarkConfig';
import { landmarkWorldPoint, sampleGround } from './landmarkPlacement';
import {
  disposeLandmarkResources,
  loadLandmarkAssets,
  loadLandmarkReference,
} from './loadLandmarkAssets';

export function guideGeometry(guide: LayoutGuide): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(guide.positions.flat(), 3),
  );
  geometry.setIndex(guide.indices.flat());
  geometry.computeVertexNormals();
  return geometry;
}

export async function createOvergrownRuin(terrain: TerrainConfig) {
  const assets = await loadLandmarkAssets();
  const root = new Group();
  root.name = 'OvergrownOasisRuin';
  const content = new Group();
  content.name = 'LandmarkModules';
  root.add(content);
  const placement: LandmarkPlacement = {
    ...OVERGROWN_RUIN_CONFIG,
    position: { ...OVERGROWN_RUIN_CONFIG.position },
  };
  const support = new Map<string, Vector3[]>();
  const contact: Record<string, { burial: number; supportCount: number; y: number }> =
    {};
  let disposed = false;
  let reference: Group | null = null;
  let referenceRequest: Promise<Group | null> | null = null;
  let referenceVisible = false;
  const pondGuide = assets.layout.guides.Pond_Blockout!;
  const pond = new Mesh(
    guideGeometry(pondGuide),
    new MeshStandardMaterial({
      color: '#639b9c',
      transparent: true,
      opacity: 0.65,
      roughness: 0.85,
      side: DoubleSide,
      depthWrite: false,
    }),
  );
  pond.name = 'PondInspectionPlane';
  pond.receiveShadow = true;
  content.add(pond);
  let pondHeight = 0;
  const bankVertices = new Map<Mesh, Float32Array>();
  let assetTriangles = 0;
  for (const [name, object] of assets.modules) {
    content.add(object);
    object.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(object);
    const points: Vector3[] = [];
    const unique = new Set<string>();
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      assetTriangles +=
        (child.geometry.index?.count ?? child.geometry.attributes.position!.count) / 3;
      child.castShadow = name !== 'PondEdge_Blockout';
      child.receiveShadow = true;
      // The canopy remains a low-poly blob; exclude it from shadow rendering.
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      if (materials.every((m) => m.name.includes('Canopy'))) child.castShadow = false;
      const vertices = child.geometry.attributes.position!;
      if (name === 'PondEdge_Blockout')
        bankVertices.set(child, Float32Array.from(vertices.array));
      for (let i = 0; i < vertices.count; i++) {
        const point = new Vector3()
          .fromBufferAttribute(vertices, i)
          .applyMatrix4(child.matrixWorld);
        if (point.y > bounds.min.y + 0.35) continue;
        const key = `${point.x.toFixed(3)},${point.z.toFixed(3)}`;
        if (!unique.has(key)) {
          points.push(point);
          unique.add(key);
        }
      }
    });
    support.set(name, points);
  }

  function localGround(x: number, z: number): number {
    const p = landmarkWorldPoint(x, z, placement);
    return (sampleGround(p.x, p.z, terrain) - root.position.y) / placement.scale;
  }
  function place(next: LandmarkPlacement): void {
    if (disposed) return;
    if (
      ![next.position.x, next.position.z, next.rotationY, next.scale].every(
        Number.isFinite,
      ) ||
      next.scale <= 0
    )
      throw new Error('Invalid landmark placement');
    Object.assign(placement, next, { position: { ...next.position } });
    root.position.set(
      next.position.x,
      sampleGround(next.position.x, next.position.z, terrain),
      next.position.z,
    );
    root.rotation.y = next.rotationY;
    root.scale.setScalar(next.scale);
    for (const module of assets.layout.modules) {
      const object = assets.modules.get(module.name)!;
      const offset = LANDMARK_MODULE_OFFSETS[module.name];
      const x = module.position[0]! + (offset?.x ?? 0);
      const z = module.position[2]! + (offset?.z ?? 0);
      const points = support.get(module.name)!;
      // Fit the low support vertices, never the canopy/whole bounding box.
      // The lowest support fit deliberately embeds uphill feet rather than floating downhill feet.
      const fits = points.map(
        (point) => localGround(x + point.x, z + point.z) - point.y,
      );
      const y = Math.min(...fits) - 0.08 / placement.scale;
      object.position.set(x, y, z);
      contact[module.name] = {
        burial: (Math.max(...fits) - y) * placement.scale,
        supportCount: points.length,
        y: root.position.y + y * placement.scale,
      };
    }
    // A level inspection surface in the existing basin; terrain is never edited.
    const shore = pondGuide.positions.slice(1).map((p) => localGround(p[0]!, p[2]!));
    pondHeight = Math.max(...shore) + 0.025 / placement.scale;
    const vertices = pond.geometry.attributes.position!;
    for (let i = 0; i < vertices.count; i++) vertices.setY(i, pondHeight);
    vertices.needsUpdate = true;
    pond.geometry.computeBoundingSphere();
    const bank = assets.modules.get('PondEdge_Blockout')!;
    const bankLayout = assets.layout.modules.find(
      (m) => m.name === 'PondEdge_Blockout',
    )!;
    bank.position.y = 0;
    let maxBankLift = 0;
    for (const [mesh, original] of bankVertices) {
      const attribute = mesh.geometry.attributes.position!;
      for (let i = 0; i < attribute.count; i++) {
        const x = original[i * 3]!,
          z = original[i * 3 + 2]!;
        const ground = localGround(
          x + bankLayout.position[0]!,
          z + bankLayout.position[2]!,
        );
        maxBankLift = Math.max(maxBankLift, (pondHeight - ground) * placement.scale);
        // Only the thin blockout rim conforms; preserve the original shoreline in X/Z.
        const originalHeight = original[i * 3 + 1]!;
        attribute.setY(
          i,
          (originalHeight < 0 ? ground : Math.max(ground, pondHeight)) + originalHeight,
        );
      }
      attribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
      mesh.geometry.computeBoundingBox();
    }
    contact.PondEdge_Blockout = {
      burial: 0,
      supportCount: 144,
      y: root.position.y + pondHeight * placement.scale,
    };
    bank.userData.maxBankLift = maxBankLift;
    root.updateMatrixWorld(true);
  }
  place(placement);

  async function showReference(visible: boolean) {
    referenceVisible = visible;
    if (reference) {
      reference.visible = visible;
      return;
    }
    if (!visible || disposed) return;
    referenceRequest ??= loadLandmarkReference()
      .then((loaded) => {
        if (disposed) {
          disposeLandmarkResources([loaded]);
          return null;
        }
        reference = loaded;
        loaded.name = 'OriginalLayoutReference';
        loaded.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material: MeshStandardMaterial) => {
            material.wireframe = true;
            material.transparent = true;
            material.opacity = 0.35;
            material.depthWrite = false;
            material.color.set('#67dfff');
          });
        });
        loaded.visible = referenceVisible;
        root.add(loaded);
        return loaded;
      })
      .catch((error) => {
        referenceRequest = null;
        throw error;
      });
    await referenceRequest;
  }
  return {
    root,
    content,
    placement,
    assets,
    assetTriangles,
    contact,
    terrain,
    pond,
    localGround,
    place,
    showReference,
    get pondHeight() {
      return root.position.y + pondHeight * placement.scale;
    },
    isolate(name: string) {
      for (const [key, object] of assets.modules)
        object.visible = !name || key === name;
      pond.visible = !name;
    },
    refreshMaterials() {
      content.traverse((object) => {
        if (object instanceof Mesh)
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            material.needsUpdate = true;
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      disposeLandmarkResources([root]);
      root.clear();
    },
  };
}
export type OvergrownRuin = Awaited<ReturnType<typeof createOvergrownRuin>>;
