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
  controls.maxPolarAngle = ground ? Math.PI * 0.53 : Math.PI * 0.49;
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
  controls.update();
  controls.enableDamping = true;
}
