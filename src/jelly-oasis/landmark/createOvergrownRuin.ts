import {
  Box3,
  Color,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  MathUtils,
  Vector3,
} from 'three';
import type { TerrainConfig } from '../terrain/heightfield';
import { smoothstep } from '../terrain/heightfield';
import { createTerrainSurface } from '../terrain/terrainSurface';
import type { Matrix4, Object3D } from 'three';
import { OVERGROWN_RUIN_CONFIG, LANDMARK_MODULE_OFFSETS } from './landmarkConfig';
import type { LandmarkPlacement, LayoutGuide } from './landmarkConfig';
import { landmarkWorldPoint, sampleGround } from './landmarkPlacement';
import {
  disposeLandmarkResources,
  loadLandmarkAssets,
  loadLandmarkReference,
} from './loadLandmarkAssets';
import type { AestheticVariants } from './loadLandmarkAssets';

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

export async function createOvergrownRuin(
  terrain: TerrainConfig,
  cliffDetail = true,
  ruinDetail = true,
  treeDetail = true,
  pondDetail: boolean | 'v2' = false,
  crystalDetail = false,
  aesthetic: AestheticVariants = {},
) {
  const assets = await loadLandmarkAssets(
    cliffDetail,
    ruinDetail,
    treeDetail,
    pondDetail,
    crystalDetail,
    aesthetic,
  );
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
  const heightGuide = assets.layout.guides.Pond_Blockout!;
  const pondGuide = assets.pondGuide ?? heightGuide;
  const pond = new Mesh(
    guideGeometry(pondGuide),
    new MeshStandardMaterial({
      color:
        aesthetic.water === 'deep'
          ? '#477f89'
          : aesthetic.water === 'soft'
            ? '#568f96'
            : '#639b9c',
      transparent: true,
      opacity:
        aesthetic.water === 'deep' ? 0.83 : aesthetic.water === 'soft' ? 0.76 : 0.65,
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
  const detailBankVertices = new Map<
    Mesh,
    {
      role: string;
      owner: Object3D;
      points: Vector3[];
      toMesh: Matrix4;
      weights: number[];
    }
  >();
  const rigidBankParts = new Map<Object3D, Vector3[]>();
  const rootVertices = new Map<
    Mesh,
    { name: string; points: Vector3[]; toMesh: Matrix4 }
  >();
  const terrainBanks = new Set<Mesh>();
  let bankSurface: MeshStandardMaterial | undefined;
  const replacedMaterials = new Set<MeshStandardMaterial>();
  const meadow = new Color('#89a875'),
    highland = new Color('#b5b68a'),
    basin = new Color('#688f80'),
    bankColor = new Color();
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
      // Keep foliage out of shadow passes for both blockout and detail variants.
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      if (materials.every((m) => m.name.includes('Canopy'))) child.castShadow = false;
      const vertices = child.geometry.attributes.position!;
      if (
        ruinDetail &&
        (name === 'Root_Large_A' || name === 'Root_Tree_Base_Blockout')
      ) {
        rootVertices.set(child, {
          name,
          points: Array.from({ length: vertices.count }, (_, i) =>
            new Vector3()
              .fromBufferAttribute(vertices, i)
              .applyMatrix4(child.matrixWorld),
          ),
          toMesh: child.matrixWorld.clone().invert(),
        });
      }
      if (name === 'PondEdge_Blockout') {
        if (!pondDetail) bankVertices.set(child, Float32Array.from(vertices.array));
        else {
          let owner: Object3D = child;
          while (!owner.userData.pond_role && owner.parent && owner !== object)
            owner = owner.parent;
          const role = owner.userData.pond_role;
          if (
            pondDetail === 'v2' &&
            role === 'shore' &&
            materials.every((m) => m.name.includes('Canopy'))
          ) {
            bankSurface ??= createTerrainSurface(terrain.maxHeight).material;
            materials.forEach((m) => replacedMaterials.add(m as MeshStandardMaterial));
            child.material = bankSurface;
            child.geometry.setAttribute(
              'color',
              new Float32BufferAttribute(new Float32Array(vertices.count * 3), 3),
            );
            terrainBanks.add(child);
          }
          if (!['shore', 'bank', 'rock'].includes(role))
            throw new Error('Missing pond grounding role');
          const points = Array.from({ length: vertices.count }, (_, i) =>
            new Vector3()
              .fromBufferAttribute(vertices, i)
              .applyMatrix4(child.matrixWorld),
          );
          if (role !== 'shore')
            rigidBankParts.set(owner, [
              ...(rigidBankParts.get(owner) ?? []),
              ...points,
            ]);
          const uv = child.geometry.attributes.uv;
          if (role === 'shore' && !uv) throw new Error('Missing shore support weights');
          // glTF splits material primitives; each has its own immutable source.
          detailBankVertices.set(child, {
            role,
            owner,
            points,
            toMesh: child.matrixWorld.clone().invert(),
            weights: points.map((_, i) => (uv ? uv.getX(i) : 0)),
          });
        }
      }
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

  replacedMaterials.forEach((m) => m.dispose());

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
    // Preserve each original module anchor. Only the root surface bends between
    // the tree foundation, shared connector, wall coping and grounded root tip.
    // Recompute from immutable vertices, so moving the landmark never accumulates drift.
    const treeY = assets.modules.get('Tree_Landmark_Blockout')!.position.y;
    const wallY = assets.modules.get('Ruin_Wall_A')!.position.y;
    const connectorY = localGround(-12, -10) - 0.4;
    const tipY = assets.modules.get('Root_Large_A')!.position.y - 1.3;
    for (const [mesh, data] of rootVertices) {
      const object = assets.modules.get(data.name)!;
      const large = data.name === 'Root_Large_A';
      const attribute = mesh.geometry.attributes.position!;
      const point = new Vector3();
      data.points.forEach((original, i) => {
        const z = object.position.z + original.z;
        let foundation = large
          ? MathUtils.lerp(connectorY, wallY, MathUtils.smoothstep(z, -10, -4))
          : MathUtils.lerp(treeY, connectorY, MathUtils.smoothstep(z, -16, -10));
        if (large)
          foundation = MathUtils.lerp(
            foundation,
            tipY,
            MathUtils.smoothstep(z, -0.4, 1.4),
          );
        point.copy(original);
        point.y += (large ? 1.3 : 0) + foundation - object.position.y;
        point.applyMatrix4(data.toMesh);
        attribute.setXYZ(i, point.x, point.y, point.z);
      });
      attribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
    // A level inspection surface in the existing basin; terrain is never edited.
    const shore = heightGuide.positions.slice(1).map((p) => localGround(p[0]!, p[2]!));
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
    let maxBankDisplacement = 0;
    let rigidSupportCount = 0;
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
        const foundation = originalHeight < 0 ? ground : Math.max(ground, pondHeight);
        maxBankDisplacement = Math.max(
          maxBankDisplacement,
          Math.abs(foundation) * placement.scale,
        );
        attribute.setY(i, foundation + originalHeight);
      }
      attribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
      mesh.geometry.computeBoundingBox();
    }
    const shifts = new Map<Object3D, number>();
    for (const [owner, points] of rigidBankParts) {
      const low = Math.min(...points.map((p) => p.y));
      const high = Math.max(...points.map((p) => p.y));
      const feet = points.filter((p) => p.y <= low + (high - low) * 0.45);
      rigidSupportCount += feet.length;
      shifts.set(
        owner,
        Math.min(
          ...feet.map(
            (p) => localGround(bank.position.x + p.x, bank.position.z + p.z) - p.y,
          ),
        ) -
          0.14 / placement.scale,
      );
    }
    const point = new Vector3();
    for (const [mesh, data] of detailBankVertices) {
      const attribute = mesh.geometry.attributes.position!;
      // Whole bank/rock parts translate rigidly. No vertex stretching.
      const shift = shifts.get(data.owner) ?? 0;
      data.points.forEach((original, i) => {
        point.copy(original);
        const ground = localGround(
          bank.position.x + point.x,
          bank.position.z + point.z,
        );
        if (data.role === 'shore')
          point.y += MathUtils.lerp(pondHeight, ground, data.weights[i]!);
        else point.y += shift;
        maxBankLift = Math.max(maxBankLift, (pondHeight - ground) * placement.scale);
        maxBankDisplacement = Math.max(
          maxBankDisplacement,
          Math.abs(point.y - original.y) * placement.scale,
        );
        if (terrainBanks.has(mesh)) {
          const height = root.position.y + ground * placement.scale;
          bankColor
            .copy(meadow)
            .lerp(highland, smoothstep(3, terrain.maxHeight, height));
          bankColor.lerp(basin, smoothstep(0, terrain.maxHeight * 0.2, -height));
          mesh.geometry.attributes.color!.setXYZ(
            i,
            bankColor.r,
            bankColor.g,
            bankColor.b,
          );
        }
        point.applyMatrix4(data.toMesh);
        attribute.setXYZ(i, point.x, point.y, point.z);
      });
      attribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
      mesh.geometry.computeBoundingBox();
    }
    for (const mesh of terrainBanks) mesh.geometry.attributes.color!.needsUpdate = true;
    contact.PondEdge_Blockout = {
      burial: 0,
      supportCount: pondDetail
        ? [...detailBankVertices.values()].reduce(
            (sum, d) =>
              sum +
              (d.role === 'shore'
                ? d.weights.filter((w) => w === 0 || w === 1).length
                : 0),
            0,
          ) + rigidSupportCount
        : 144,
      y: root.position.y + pondHeight * placement.scale,
    };
    bank.userData.maxBankLift = maxBankLift;
    bank.userData.maxBankDisplacement = maxBankDisplacement;
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
