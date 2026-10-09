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
import { createEnvironmentPanel } from './environment/debugPanel';
import { createTerrainSurface } from './terrain/terrainSurface';
import { createSurfaceDebug } from './terrain/debugSurface';
import { createOvergrownRuin } from './landmark/createOvergrownRuin';
import type { OvergrownRuin } from './landmark/createOvergrownRuin';
import { createLandmarkDebug } from './landmark/landmarkDebug';
import { frameLandmark } from './landmark/landmarkCamera';
import type { LandmarkCamera } from './landmark/landmarkConfig';
import { auditLandmark } from './landmark/landmarkAudit';
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
  const surface = createTerrainSurface(config.maxHeight);
  const terrain = createTerrain(config, surface.material);
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
  let landmark: OvergrownRuin | null = null;
  let landmarkDebug: ReturnType<typeof createLandmarkDebug> | null = null;
  let reviewCamera = false;
  let groundCamera = false;
  function setShadows(enabled: boolean): void {
    enabled = enabled && !mobile;
    renderer.shadowMap.enabled = enabled;
    environment.setShadows(enabled);
    terrain.castShadow = enabled;
    terrain.material.needsUpdate = true;
    edge.material.needsUpdate = true;
    environment.clouds.mesh.material.needsUpdate = true;
    landmark?.refreshMaterials();
    dirty = true;
  }
  setShadows(!mobile);
  const previousTarget = new Vector3();
  const resetButton = document.querySelector<HTMLButtonElement>('#reset-view')!;

  function resetView(): void {
    reviewCamera = groundCamera = false;
    controls.minDistance = 35;
    controls.maxPolarAngle = Math.PI * 0.445;
    controls.maxTargetRadius = config.size * 0.36;
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
  const debugPanel = createEnvironmentPanel(
    environment,
    renderer,
    invalidate,
    setShadows,
    debugEnabled,
    () => {
      // A high moon is outside the terrain-facing orbit's field of view.
      // The existing reset button returns this deliberate sky view to the land.
      reviewCamera = true;
      groundCamera = false;
      controls.enableDamping = false;
      controls.update();
      controls.minDistance = 1;
      controls.maxPolarAngle = Math.PI;
      controls.maxTargetRadius = Infinity;
      const uniforms = environment.sky.material.uniforms;
      const direction = uniforms[
        environment.moon.visible ? 'moonDirection' : 'sunDirection'
      ]!.value as Vector3;
      controls.target.copy(camera.position).addScaledVector(direction, 80);
      controls.update();
      controls.enableDamping = true;
      invalidate();
    },
  );
  const surfaceDebug = debugEnabled
    ? createSurfaceDebug(terrain, surface, invalidate)
    : null;
  function landmarkView(view: LandmarkCamera): void {
    if (view === 'overview') {
      resetView();
      return;
    }
    if (!landmark) return;
    reviewCamera = true;
    groundCamera = view === 'ground';
    controls.maxTargetRadius = config.size * 0.36;
    frameLandmark(view, landmark, camera, controls);
    invalidate();
  }
  const landmarkStatus = document.createElement('p');
  landmarkStatus.id = 'landmark-status';
  landmarkStatus.role = 'status';
  landmarkStatus.textContent = '랜드마크 불러오는 중…';
  document.querySelector('.oasis-shell')!.append(landmarkStatus);
  const cliffDetail = !(
    debugEnabled && new URLSearchParams(location.search).get('cliff') === 'blockout'
  );
  const ruinDetail = !(
    debugEnabled && new URLSearchParams(location.search).get('ruin') === 'blockout'
  );
  void createOvergrownRuin(config, cliffDetail, ruinDetail)
    .then((loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      landmark = loaded;
      scene.add(loaded.root);
      landmarkStatus.hidden = true;
      if (debugEnabled) {
        landmarkDebug = createLandmarkDebug(loaded, invalidate, landmarkView);
        // Opt-in inspection API for repeatable browser QA; no production global.
        Object.assign(window, {
          __oasisLandmark: {
            audit: () => auditLandmark(loaded),
            reviewCamera: (position: number[], target: number[]) => {
              reviewCamera = groundCamera = true;
              controls.enableDamping = false;
              controls.update();
              controls.minDistance = 1;
              controls.maxPolarAngle = Math.PI;
              camera.position.fromArray(position);
              controls.target.fromArray(target);
              controls.update();
              controls.enableDamping = true;
              invalidate();
            },
            snapshot: () => ({
              modules: loaded.assets.modules.size,
              cliffDetail,
              ruinDetail,
              autoWeather: {
                enabled: environment.autoWeather.enabled,
                secondsUntilNext: environment.autoWeather.secondsUntilNext,
                seed: environment.autoWeather.seed,
              },
              moon: {
                direction:
                  environment.sky.material.uniforms.moonDirection!.value.toArray(),
                visibility: environment.sky.material.uniforms.moonVisibility!.value,
                intensity: environment.moon.intensity,
                castShadow: environment.moon.castShadow,
                allocated: Boolean(environment.moon.shadow.map),
              },
              sun: {
                intensity: environment.sun.intensity,
                castShadow: environment.sun.castShadow,
              },
              contact: loaded.contact,
              shadow: {
                bias: environment.sun.shadow.bias,
                normalBias: environment.sun.shadow.normalBias,
                mapSize: environment.sun.shadow.mapSize.toArray(),
                allocated: Boolean(environment.sun.shadow.map),
                bounds: [
                  environment.sun.shadow.camera.left,
                  environment.sun.shadow.camera.right,
                  environment.sun.shadow.camera.near,
                  environment.sun.shadow.camera.far,
                ],
              },
              assetTriangles: loaded.assetTriangles,
              loadMs: loaded.assets.loadMs,
              timings: loaded.assets.timings,
              placement: loaded.placement,
              calls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              textures: renderer.info.memory.textures,
              geometries: renderer.info.memory.geometries,
              shadows: renderer.shadowMap.enabled,
              timeOfDay: environment.state.timeOfDay,
              weather: environment.state.weather,
              weatherBlend: environment.state.weatherBlend,
              rainVisible: environment.rain.mesh.visible,
              visible: loaded.root.visible,
              camera: camera.position.toArray(),
              target: controls.target.toArray(),
            }),
          },
        });
      }
      invalidate();
    })
    .catch((error: unknown) => {
      if (disposed) return;
      landmarkStatus.hidden = false;
      landmarkStatus.textContent =
        '랜드마크를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
      landmarkStatus.role = 'alert';
      console.error('Jelly Oasis landmark load failed:', error);
      invalidate();
    });
  function motionChanged(): void {
    if (motionPreference.matches) {
      environment.setPlaying(false);
      environment.setAutoWeather(false);
    }
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
    if (!reviewCamera && Math.abs(delta) > 0.001) {
      controls.target.y = ground;
      camera.position.y += delta;
      dirty = true;
    }
    if (
      Math.abs(camera.position.x) <= config.size / 2 &&
      Math.abs(camera.position.z) <= config.size / 2
    ) {
      const minimumY =
        sampleTerrainHeight(camera.position.x, camera.position.z, config) +
        (groundCamera ? 1.7 : 6);
      if (camera.position.y < minimumY) {
        camera.position.y = minimumY;
        dirty = true;
      }
    }
    if (!previousTarget.equals(controls.target)) dirty = true;
    environment.focusShadow(
      controls.target,
      camera.position.distanceTo(controls.target),
    );
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
    landmarkDebug?.dispose();
    landmark?.dispose();
    landmarkStatus.remove();
    Reflect.deleteProperty(window, '__oasisLandmark');
    observer.disconnect();
    controls.dispose();
    terrain.geometry.dispose();
    surface.material.dispose();
    surfaceDebug?.dispose();
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
