import { Mesh, Texture } from 'three';
import type { Object3D, Material, BufferGeometry, Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  LANDMARK_ASSET_PATH,
  LANDMARK_FIRST_IMPORTS,
  LANDMARK_REFERENCE_FILE,
} from './landmarkConfig';
import type { LandmarkLayout } from './landmarkConfig';

// One loader for modules and the optional reference. Each result has one owner.
const loader = new GLTFLoader();
export function disposeLandmarkResources(roots: Iterable<Object3D>): void {
  const geometries = new Set<BufferGeometry>(),
    materials = new Set<Material>(),
    textures = new Set<Texture>();
  for (const root of roots)
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
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
  treeDetail = false,
) {
  const started = performance.now();
  const response = await fetch(`${LANDMARK_ASSET_PATH}layout.json`);
  if (!response.ok) throw new Error(`Landmark layout failed: HTTP ${response.status}`);
  const layout: LandmarkLayout = await response.json();
  if (!Array.isArray(layout.modules) || !layout.guides || layout.modules.length !== 16)
    throw new Error('Invalid landmark layout manifest');
  const modules = new Map<string, Group>();
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
    const file =
      treeDetail && name === 'Tree_Landmark_Blockout'
        ? 'Tree_Landmark_Detail_v1.glb'
        : detailedRuin
          ? `${name}_Detail_v1.glb`
          : cliffDetail && name === 'Cliff_Waterfall_A'
            ? 'Cliff_Waterfall_A_Detail_v1.glb'
            : `${name}.glb`;
    const object = await load(file);
    object.name = name;
    modules.set(name, object);
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
  return { layout, modules, timings, loadMs: performance.now() - started };
}
