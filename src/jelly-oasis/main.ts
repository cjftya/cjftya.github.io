import { PerspectiveCamera, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from '../core/renderer/RendererManager';
import {
  createTerrain,
  createTerrainEdge,
  DEFAULT_TERRAIN_CONFIG,
  sampleTerrainHeight,
} from './terrain/createTerrain';
import { EnvironmentController } from './environment/EnvironmentController';
import { createEnvironmentDebug } from './environment/debugPanel';
import './styles.css';

function start(canvas: HTMLCanvasElement): void {
  const config = DEFAULT_TERRAIN_CONFIG;
  const scene = new Scene();
  const manager = new RendererManager(canvas);
  const renderer = manager.renderer;
  const camera = new PerspectiveCamera(42, 1, 0.5, 1800);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = false;
  controls.minDistance = 35;
  controls.maxDistance = 1050;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.445;
  controls.maxTargetRadius = config.size * 0.36;
  controls.zoomSpeed = 0.8;
  const mobile =
    matchMedia('(pointer: coarse)').matches ||
    (navigator.hardwareConcurrency ?? 8) <= 4;
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const environment = new EnvironmentController(
    scene,
    mobile,
    motionPreference.matches,
  );
  const terrain = createTerrain(config);
  const edge = createTerrainEdge(config);
  scene.add(terrain, edge);
  const debugEnabled =
    import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
  let dirty = true;
  let disposed = false;
  let contextLost = false;
  let lastTick = 0;
  let lastRender = 0;
  let lastDebug = 0;
  let frameMs = 0;
  function setShadows(enabled: boolean): void {
    renderer.shadowMap.enabled = enabled;
    environment.sun.castShadow = enabled;
    terrain.castShadow = enabled;
    terrain.material.needsUpdate = true;
    edge.material.needsUpdate = true;
    environment.clouds.mesh.material.needsUpdate = true;
    dirty = true;
  }
  setShadows(!mobile);
  const previousTarget = new Vector3();
  const resetButton = document.querySelector<HTMLButtonElement>('#reset-view')!;

  function resetView(): void {
    // Flush residual damping so reset also works during an active gesture.
    controls.enableDamping = false;
    controls.update();
    controls.target.set(0, 0, 0);
    const distanceScale = Math.max(1, 0.95 / camera.aspect);
    camera.position.set(255, 235, 300).multiplyScalar(Math.min(distanceScale, 2.1));
    controls.update();
    controls.enableDamping = true;
    dirty = true;
  }
  function resize(): void {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    manager.resize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  resetView();
  resetButton.addEventListener('click', resetView);
  const invalidate = (): void => {
    dirty = true;
  };
  controls.addEventListener('change', invalidate);
  const debugPanel = debugEnabled
    ? createEnvironmentDebug(environment, renderer, invalidate, setShadows)
    : null;
  function motionChanged(): void {
    if (motionPreference.matches) environment.setPlaying(false);
    dirty = true;
  }
  motionPreference.addEventListener('change', motionChanged);
  function keydown(event: KeyboardEvent): void {
    if (
      !debugEnabled ||
      (event.target instanceof HTMLElement &&
        /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) ||
      event.code !== 'KeyW' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    terrain.material.wireframe = !terrain.material.wireframe;
    dirty = true;
  }
  window.addEventListener('keydown', keydown);

  function frame(now: number): void {
    if (document.hidden || disposed || contextLost) return;
    const budget = mobile || motionPreference.matches ? 1000 / 30 : 1000 / 60;
    if (lastTick && now - lastTick < budget - 1) return;
    const seconds = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0;
    lastTick = now;
    previousTarget.copy(controls.target);
    controls.update();
    // Follow the terrain while panning; preserve camera offset above the target.
    const ground = sampleTerrainHeight(controls.target.x, controls.target.z, config);
    const delta = ground - controls.target.y;
    if (Math.abs(delta) > 0.001) {
      controls.target.y = ground;
      camera.position.y += delta;
      dirty = true;
    }
    if (
      Math.abs(camera.position.x) <= config.size / 2 &&
      Math.abs(camera.position.z) <= config.size / 2
    ) {
      const minimumY =
        sampleTerrainHeight(camera.position.x, camera.position.z, config) + 6;
      if (camera.position.y < minimumY) {
        camera.position.y = minimumY;
        dirty = true;
      }
    }
    if (!previousTarget.equals(controls.target)) dirty = true;
    if (
      environment.update(
        seconds,
        camera,
        camera.position.distanceTo(controls.target),
        renderer.getPixelRatio(),
      )
    )
      dirty = true;
    if (!dirty) return;
    renderer.render(scene, camera);
    if (lastRender) frameMs = frameMs * 0.85 + (now - lastRender) * 0.15;
    lastRender = now;
    dirty = false;
    if (debugPanel && (now - lastDebug > 250 || !environment.animated)) {
      debugPanel.refresh(frameMs);
      lastDebug = now;
    }
    document.documentElement.classList.toggle(
      'oasis-night',
      environment.state.timeOfDay >= 19.5 || environment.state.timeOfDay < 6,
    );
  }

  function visibility(): void {
    lastTick = 0;
    lastRender = 0;
    renderer.setAnimationLoop(
      document.hidden || contextLost || disposed ? null : frame,
    );
    dirty = true;
  }
  document.addEventListener('visibilitychange', visibility);
  renderer.setAnimationLoop(frame);
  function pagehide(event: PageTransitionEvent): void {
    renderer.setAnimationLoop(null);
    if (event.persisted) return;
    disposed = true;
    observer.disconnect();
    controls.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
    edge.geometry.dispose();
    edge.material.dispose();
    environment.dispose();
    debugPanel?.dispose();
    motionPreference.removeEventListener('change', motionChanged);
    manager.dispose();
    resetButton.removeEventListener('click', resetView);
    window.removeEventListener('keydown', keydown);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
  }
  function pageshow(): void {
    if (!disposed) {
      resize();
      visibility();
    }
  }
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    renderer.setAnimationLoop(null);
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    environment.invalidate();
    dirty = true;
    visibility();
  });
}
try {
  const canvas = document.querySelector<HTMLCanvasElement>('#oasis-canvas');
  if (!canvas) throw new Error('Jelly Oasis canvas not found.');
  start(canvas);
} catch (error) {
  document.querySelector<HTMLElement>('#terrain-error')!.hidden = false;
  console.error('Jelly Oasis initialization failed:', error);
}
