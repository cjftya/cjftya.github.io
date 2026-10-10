import { Box3, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OvergrownRuin } from './createOvergrownRuin';
import type { LandmarkCamera } from './landmarkConfig';
import { landmarkWorldPoint, sampleGround } from './landmarkPlacement';

export function frameLandmark(
  view: Exclude<LandmarkCamera, 'overview'>,
  landmark: OvergrownRuin,
  camera: PerspectiveCamera,
  controls: OrbitControls,
) {
  const ground = view === 'ground';
  const visible = [...landmark.assets.modules.values()].filter((o) => o.visible);
  const isolated = visible.length === 1 ? visible[0] : undefined;
  const targetX = ground ? 15 : (isolated?.position.x ?? 0);
  const targetZ = ground ? -6 : (isolated?.position.z ?? 0);
  const target = landmarkWorldPoint(targetX, targetZ, landmark.placement);
  const eye = ground
    ? landmarkWorldPoint(15, 18, landmark.placement)
    : { x: target.x + (isolated ? 24 : 55), z: target.z + (isolated ? 34 : 78) };
  controls.enableDamping = false;
  controls.update();
  controls.minDistance = ground ? 1 : 15;
  controls.maxPolarAngle = Math.PI - 0.01;
  controls.target.set(
    target.x,
    sampleGround(target.x, target.z, landmark.terrain) + (ground ? 1.7 : 7),
    target.z,
  );
  camera.position.set(
    eye.x,
    ground
      ? sampleGround(eye.x, eye.z, landmark.terrain) + 1.7
      : landmark.root.position.y + (isolated ? 23 : 48),
    eye.z,
  );
  if (!ground && camera.aspect < 1) {
    // Keep the desktop view direction, then fit the actual module bounds to
    // the narrower horizontal field of view rather than using a device multiplier.
    landmark.root.updateMatrixWorld(true);
    const outward = camera.position.clone().sub(controls.target).normalize();
    const right = new Vector3().crossVectors(camera.up, outward).normalize();
    const up = new Vector3().crossVectors(outward, right).normalize();
    const verticalTangent = Math.tan((camera.fov * Math.PI) / 360);
    const horizontalTangent = verticalTangent * camera.aspect;
    let distance = camera.position.distanceTo(controls.target);
    for (const object of visible) {
      const bounds = new Box3().setFromObject(object);
      if (bounds.isEmpty()) continue;
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            const relative = new Vector3(x, y, z).sub(controls.target);
            distance = Math.max(
              distance,
              relative.dot(outward) +
                Math.abs(relative.dot(right)) / (horizontalTangent * 0.9),
              relative.dot(outward) +
                Math.abs(relative.dot(up)) / (verticalTangent * 0.8),
            );
          }
    }
    camera.position.copy(controls.target).addScaledVector(outward, distance);
  }
  controls.update();
  controls.enableDamping = true;
}
