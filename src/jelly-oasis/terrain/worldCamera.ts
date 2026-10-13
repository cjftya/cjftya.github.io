import { Box3, Vector3 } from 'three';
import type { PerspectiveCamera, Object3D } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Fit actual terrain, cut walls and loaded modules at every aspect ratio. */
export function frameWorld(
  objects: Object3D[],
  camera: PerspectiveCamera,
  controls: OrbitControls,
) {
  const bounds = new Box3();
  for (const object of objects) bounds.union(new Box3().setFromObject(object));
  const target = bounds.getCenter(new Vector3());
  const outward = new Vector3(255, 235, 300).normalize();
  const right = new Vector3().crossVectors(camera.up, outward).normalize();
  const up = new Vector3().crossVectors(outward, right).normalize();
  const vertical = Math.tan((camera.fov * Math.PI) / 360);
  const horizontal = vertical * camera.aspect;
  let distance = 35;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const relative = new Vector3(x, y, z).sub(target);
        distance = Math.max(
          distance,
          relative.dot(outward) + Math.abs(relative.dot(right)) / (horizontal * 0.88),
          relative.dot(outward) + Math.abs(relative.dot(up)) / (vertical * 0.82),
        );
      }
  controls.enableDamping = false;
  controls.update();
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(outward, distance);
  controls.update();
  controls.enableDamping = true;
  return bounds;
}

/** Scenic reset; the separate overview button fits the entire stage. */
export function frameLandscape(camera: PerspectiveCamera, controls: OrbitControls) {
  const target = new Vector3(14, 8, 7),
    outward = new Vector3(100, 82, 143).normalize();
  const distance = camera.aspect < 1 ? 195 : 215;
  controls.enableDamping = false;
  controls.update();
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(outward, distance);
  controls.update();
  controls.enableDamping = true;
}
