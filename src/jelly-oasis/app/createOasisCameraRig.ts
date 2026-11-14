import { Vector3 } from 'three';
import type { Object3D, PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OvergrownRuin } from '../landmark/createOvergrownRuin';
import type { LandmarkCamera } from '../landmark/landmarkConfig';
import { frameLandmark } from '../landmark/landmarkCamera';
import { frameLandscape, frameWorld } from '../terrain/worldCamera';
import { sampleTerrainHeight } from '../terrain/createTerrain';
import type { readStartupOptions } from '../startupOptions';

/** Owns framing modes and terrain-following. It does not own/dispose OrbitControls. */
export function createOasisCameraRig({
  camera,
  controls,
  terrain,
  edge,
  config,
  landmark: getLandmark,
  invalidate,
}: {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  terrain: Object3D;
  edge: Object3D;
  config: ReturnType<typeof readStartupOptions>['config'];
  landmark: () => OvergrownRuin | null;
  invalidate: () => void;
}) {
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = false;
  controls.minDistance = 1.5;
  controls.maxDistance = Math.max(1050, config.size * 7);
  controls.minPolarAngle = 0.01;
  controls.maxPolarAngle = Math.PI - 0.01;
  controls.maxTargetRadius = Infinity;
  controls.zoomSpeed = 0.8;
  controls.zoomToCursor = true;
  let reviewCamera = false;
  let groundCamera = false;
  let mediumCamera = false;
  let overviewCamera = false;
  let presentationCamera = true;
  const previousTarget = new Vector3();
  function reset(overview = false): void {
    const landmark = getLandmark();
    overviewCamera = overview;
    presentationCamera = !overview;
    mediumCamera = false;
    reviewCamera = groundCamera = false;
    controls.minDistance = 1.5;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.maxTargetRadius = Infinity;
    if (overview)
      frameWorld(
        [terrain, edge, ...(landmark ? [...landmark.assets.modules.values()] : [])],
        camera,
        controls,
      );
    else
      frameLandscape(
        camera,
        controls,
        landmark
          ? [
              ...landmark.assets.modules.values(),
              ...(landmark.worldTree ? [landmark.worldTree.group] : []),
            ]
          : [],
      );
    invalidate();
  }

  function reframe(): void {
    const landmark = getLandmark();
    if (overviewCamera) reset(true);
    else if (presentationCamera) reset();
    else if (mediumCamera && landmark)
      frameLandmark('medium', landmark, camera, controls);
  }
  function reframeAfterLoad(): void {
    if (overviewCamera || presentationCamera) reset(overviewCamera);
  }
  const releaseFraming = (): void => {
    mediumCamera = false;
    overviewCamera = false;
    presentationCamera = false;
  };
  function landmarkView(view: LandmarkCamera): void {
    if (view === 'overview') {
      reset(true);
      return;
    }
    const landmark = getLandmark();
    if (!landmark) return;
    overviewCamera = false;
    presentationCamera = false;
    reviewCamera = true;
    groundCamera = view === 'ground';
    mediumCamera = view === 'medium';
    controls.maxTargetRadius = Infinity;
    frameLandmark(view, landmark, camera, controls);
    invalidate();
  }
  function review(position: number[], target: number[]): void {
    overviewCamera = false;
    presentationCamera = false;
    mediumCamera = false;
    reviewCamera = groundCamera = true;
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = 1;
    controls.maxPolarAngle = Math.PI - 0.01;
    camera.position.fromArray(position);
    controls.target.fromArray(target);
    controls.update();
    controls.enableDamping = true;
  }

  function sky(direction: Vector3): void {
    // A high moon is outside the terrain-facing orbit's field of view.
    // The existing reset button returns this deliberate sky view to the land.
    overviewCamera = false;
    presentationCamera = false;
    reviewCamera = true;
    mediumCamera = false;
    groundCamera = false;
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = 1;
    controls.maxPolarAngle = Math.PI - 0.01;
    controls.maxTargetRadius = Infinity;
    controls.target.copy(camera.position).addScaledVector(direction, 80);
    controls.update();
    controls.enableDamping = true;
    invalidate();
  }
  function pond(view: string | null, landmark: OvergrownRuin): void {
    overviewCamera = false;
    presentationCamera = false;
    mediumCamera = false;
    reviewCamera = groundCamera = true;
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = 1;
    controls.maxPolarAngle = Math.PI - 0.01;
    const pondView = view;
    if (pondView === 'pond-low') {
      camera.position.set(70, -4.6, 79);
      controls.target.set(70, -6.3, 66);
    } else if (pondView === 'pond-top') {
      camera.position.set(70, 24, 65);
      controls.target.set(70, -6.3, 64);
    } else {
      camera.position.set(82, 1, 93);
      controls.target.set(66, -3, 50);
    }
    const offset = new Vector3(
      landmark.placement.position.x - 70,
      landmark.root.position.y - sampleTerrainHeight(70, 58),
      landmark.placement.position.z - 58,
    );
    camera.position.add(offset);
    controls.target.add(offset);
    controls.update();
    controls.enableDamping = true;
  }
  function update(): boolean {
    let changed = false;
    previousTarget.copy(controls.target);
    controls.update();
    // Preserve the orbit's view direction when it touches the ground by lifting
    // both eye and pivot. The elevated pivot lets the same drag look at the sky.
    // Ground-follow only tracks horizontal panning, never pulls a sky pivot down.
    if (!reviewCamera) {
      const radius = config.size * 0.36;
      const horizontal = Math.hypot(controls.target.x, controls.target.z);
      if (horizontal > radius) {
        const x = (controls.target.x * radius) / horizontal;
        const z = (controls.target.z * radius) / horizontal;
        camera.position.x += x - controls.target.x;
        camera.position.z += z - controls.target.z;
        controls.target.x = x;
        controls.target.z = z;
      }
      const groundDelta =
        sampleTerrainHeight(controls.target.x, controls.target.z, config) -
        sampleTerrainHeight(previousTarget.x, previousTarget.z, config);
      controls.target.y += groundDelta;
      camera.position.y += groundDelta;
    }
    const onIsland =
      Math.abs(camera.position.x) <= config.size / 2 &&
      Math.abs(camera.position.z) <= config.size / 2;
    const minimumY = onIsland
      ? sampleTerrainHeight(camera.position.x, camera.position.z, config) +
        (groundCamera ? 1.7 : 6)
      : -30;
    if (camera.position.y < minimumY) {
      const lift = minimumY - camera.position.y;
      camera.position.y += lift;
      controls.target.y += lift;
      changed = true;
    }
    if (!previousTarget.equals(controls.target)) changed = true;
    return changed;
  }
  return {
    reset,
    reframe,
    reframeAfterLoad,
    releaseFraming,
    landmarkView,
    review,
    sky,
    pond,
    update,
    get medium() {
      return mediumCamera;
    },
  };
}
