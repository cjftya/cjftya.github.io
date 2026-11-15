import { InstancedMesh, Line, Mesh, Points } from 'three';
import type { Camera, Object3D, Scene, WebGLRenderer } from 'three';
import { yieldToBrowser } from './loadingSteps';

/** Prepare color programs off-scene in small batches, using the destination's
 * real lights and fog. Shadow programs and buffer uploads can still cost time
 * on the first draw; this does not claim to remove all GPU stalls.
 */
export async function prepareLandmark(
  root: Object3D,
  camera: Camera,
  renderer: WebGLRenderer,
  scene: Scene,
  cancelled: () => boolean,
): Promise<void> {
  const representatives: Object3D[] = [];
  const keys = new Set<string>();
  root.traverse((object) => {
    if (!(object instanceof Mesh || object instanceof Points || object instanceof Line))
      return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const key = [
      object.type,
      object instanceof InstancedMesh,
      object instanceof InstancedMesh && object.instanceColor !== null,
      object.receiveShadow,
      Object.keys(object.geometry.attributes).sort().join(','),
      Object.keys(object.geometry.morphAttributes).sort().join(','),
      ...materials.map((m) => m.uuid),
    ].join(':');
    if (keys.has(key)) return;
    keys.add(key);
    representatives.push(object);
  });
  for (let i = 0; i < representatives.length; i += 4) {
    if (cancelled()) return;
    await yieldToBrowser();
    if (cancelled()) return;
    // Submit a bounded batch, then give input, rendering and the GPU time.
    // Avoid uncancellable compileAsync polling surviving context loss/disposal.
    for (const object of representatives.slice(i, i + 4))
      renderer.compile(object, camera, scene);
  }
}
