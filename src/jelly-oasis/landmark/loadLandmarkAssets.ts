import { InstancedMesh, Mesh, Texture } from 'three';
import type { Object3D, Material, BufferGeometry, Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  LANDMARK_ASSET_PATH,
  LANDMARK_FIRST_IMPORTS,
  LANDMARK_REFERENCE_FILE,
} from './landmarkConfig';
import type { LandmarkLayout, LayoutGuide } from './landmarkConfig';

// One loader for modules and the optional reference. Each result has one owner.
const loader = new GLTFLoader();
export interface AestheticVariants {
  tree?: boolean;
  pond?: boolean;
  cliff?: boolean;
  water?: 'deep' | 'soft';
}
export function disposeLandmarkResources(roots: Iterable<Object3D>): void {
  const geometries = new Set<BufferGeometry>(),
    materials = new Set<Material>(),
    textures = new Set<Texture>();
  for (const root of roots)
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      if (object instanceof InstancedMesh) object.dispose();
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof Texture) textures.add(value);
      }
    });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

async function load(file: string): Promise<Group> {
  try {
    return (await loader.loadAsync(`${LANDMARK_ASSET_PATH}${file}`)).scene;
  } catch (cause) {
    throw new Error(`Landmark asset failed: ${file}`, { cause });
  }
}
export const loadLandmarkReference = () => load(LANDMARK_REFERENCE_FILE);

export async function loadLandmarkAssets(
  cliffDetail = true,
  ruinDetail = true,
  treeDetail = true,
  pondDetail: boolean | 'v2' = false,
  crystalDetail = false,
  aesthetic: AestheticVariants = {},
) {
  const started = performance.now();
  const response = await fetch(`${LANDMARK_ASSET_PATH}layout.json`);
  if (!response.ok) throw new Error(`Landmark layout failed: HTTP ${response.status}`);
  const layout: LandmarkLayout = await response.json();
  if (!Array.isArray(layout.modules) || !layout.guides || layout.modules.length !== 16)
    throw new Error('Invalid landmark layout manifest');
  const modules = new Map<string, Group>();
  let pondGuide: LayoutGuide | undefined;
  const timings: Record<string, number> = {};
  async function importModule(name: string) {
    const before = performance.now();
    const detailedRuin =
      ruinDetail &&
      [
        'Ruin_Arch_A',
        'Ruin_Wall_A',
        'Ruin_BrokenWall_A',
        'Root_Large_A',
        'Root_Tree_Base_Blockout',
      ].includes(name);
    const refined =
      (aesthetic.tree && treeDetail && name === 'Tree_Landmark_Blockout') ||
      (aesthetic.pond && pondDetail === 'v2' && name === 'PondEdge_Blockout') ||
      (aesthetic.cliff && cliffDetail && name === 'Cliff_Waterfall_A');
    const file = refined
      ? `aesthetic-improvement-v1/${name}_Refined_v1.glb`
      : crystalDetail && /^Crystal_Blockout_[ABC]$/.test(name)
        ? `crystal-accent-detail-v1/${name}_Detail_v1.glb`
        : pondDetail && name === 'PondEdge_Blockout'
          ? pondDetail === 'v2'
            ? 'PondEdge_Blockout_Detail_v2.glb'
            : 'PondEdge_Blockout_Detail_v1.glb'
          : treeDetail && name === 'Tree_Landmark_Blockout'
            ? 'Tree_Landmark_Detail_v1.glb'
            : detailedRuin
              ? `${name}_Detail_v1.glb`
              : cliffDetail && name === 'Cliff_Waterfall_A'
                ? 'Cliff_Waterfall_A_Detail_v1.glb'
                : `${name}.glb`;
    const object = await load(file);
    object.name = name;
    modules.set(name, object);
    if (pondDetail === 'v2' && name === 'PondEdge_Blockout') {
      object.traverse((child) => {
        if (typeof child.userData.pond_guide_v2 === 'string')
          pondGuide = JSON.parse(child.userData.pond_guide_v2);
      });
      if (
        !pondGuide ||
        pondGuide.positions.length < 3 ||
        !pondGuide.positions.every((p) => p.length === 3 && p.every(Number.isFinite)) ||
        !pondGuide.indices.length ||
        !pondGuide.indices.every(
          (face) =>
            face.length === 3 &&
            face.every(
              (i) => Number.isInteger(i) && i >= 0 && i < pondGuide!.positions.length,
            ),
        )
      )
        throw new Error('Invalid shared v2 pond boundary');
    }
    timings[name] = performance.now() - before;
  }
  try {
    for (const name of LANDMARK_FIRST_IMPORTS) await importModule(name);
    // Settle all requests before cleanup, including late successes after a failure.
    const rest = await Promise.allSettled(
      layout.modules
        .filter(({ name }) => !modules.has(name))
        .map(({ name }) => importModule(name)),
    );
    const failure = rest.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  } catch (error) {
    disposeLandmarkResources(modules.values());
    throw error;
  }
  return { layout, pondGuide, modules, timings, loadMs: performance.now() - started };
}
