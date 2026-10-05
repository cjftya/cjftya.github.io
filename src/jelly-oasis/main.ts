import {
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from '../core/renderer/RendererManager';
import {
  createTerrain,
  createTerrainEdge,
  DEFAULT_TERRAIN_CONFIG,
  sampleTerrainHeight,
} from './terrain/createTerrain';
import './styles.css';

function start(canvas: HTMLCanvasElement): void {
  const config = DEFAULT_TERRAIN_CONFIG;
  const scene = new Scene();
  scene.background = new Color('#e9ebe1');
  const manager = new RendererManager(canvas);
  const renderer = manager.renderer;
  // No shadow pass is needed until shadow-casting environment objects exist.
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
  const hemi = new HemisphereLight('#f4f4dc', '#67715c', 1.8);
  const sunlight = new DirectionalLight('#fff0d0', 2.5);
  sunlight.position.set(-120, 150, 40);
  sunlight.shadow.mapSize.set(1024, 1024);
  scene.add(hemi, sunlight);
  const terrain = createTerrain(config);
  const edge = createTerrainEdge(config);
  scene.add(terrain, edge);
  const debug = document.querySelector<HTMLOutputElement>('#terrain-debug')!;
  const debugEnabled =
    import.meta.env.DEV || new URLSearchParams(location.search).has('debug');
  debug.hidden = !debugEnabled;
  let dirty = true;
  let disposed = false;
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
  function keydown(event: KeyboardEvent): void {
    if (
      !debugEnabled ||
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

  function frame(): void {
    if (document.hidden || disposed) return;
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
    if (!dirty) return;
    renderer.render(scene, camera);
    dirty = false;
    if (debugEnabled) {
      debug.value = `Terrain 12,800 tris · total ${renderer.info.render.triangles.toLocaleString()}\nDraw calls ${renderer.info.render.calls} · textures ${renderer.info.memory.textures} · DPR ${renderer.getPixelRatio().toFixed(2)}\nW · wireframe ${terrain.material.wireframe ? 'on' : 'off'}`;
    }
  }
  function visibility(): void {
    renderer.setAnimationLoop(document.hidden ? null : frame);
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
    renderer.setAnimationLoop(null);
  });
  canvas.addEventListener('webglcontextrestored', () => {
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
