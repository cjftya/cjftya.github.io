import { createOasisCameraRig } from './app/createOasisCameraRig';
import { createInspectionApi } from './app/createInspectionApi';
import { createSanctuaryBloom } from './environment/createSanctuaryBloom';
import { PCFShadowMap, PerspectiveCamera, Scene } from 'three';
import type { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from '../shared/rendering/RendererManager';
import { createTerrainMesh, createTerrainEdgeMesh } from './terrain/createTerrain';
import { prepareTerrain } from './terrain/prepareTerrain';
import { EnvironmentController } from './environment/EnvironmentController';
import { createEnvironmentPanel } from './environment/debugPanel';
import { createTerrainSurface } from './terrain/terrainSurface';
import { createSurfaceDebug } from './terrain/debugSurface';
import { createOvergrownRuin } from './landmark/createOvergrownRuin';
import type { OvergrownRuin } from './landmark/createOvergrownRuin';
import { createLandmarkDebug } from './landmark/landmarkDebug';
import { readStartupOptions } from './startupOptions';
import { createPondPanel } from './landmark/water/gpgpuPondPanel';
import './styles.css';

async function start(canvas: HTMLCanvasElement): Promise<void> {
  const landmarkStatus = document.querySelector<HTMLElement>('#landmark-status')!;
  const options = readStartupOptions(location.search, import.meta.env.DEV);
  const {
    query,
    debugEnabled,
    config,
    cliffDetail,
    ruinDetail,
    treeDetail,
    pondDetail,
    crystalDetail,
    aesthetic,
    vegetation,
    composition,
    scenery,
    meadow,
  } = options;
  const geometry = await prepareTerrain(config);
  const scene = new Scene();
  const manager = new RendererManager(canvas);
  const renderer = manager.renderer;
  // A frame includes pond compute, both captures, shadows and postprocessing.
  // Three's default reset on every renderer.render() only reports OutputPass.
  if (debugEnabled) renderer.info.autoReset = false;
  renderer.shadowMap.type = PCFShadowMap;
  if (debugEnabled)
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Oasis shader compilation failed',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      );
    };
  const camera = new PerspectiveCamera(42, 1, 0.1, 1800);
  const controls = new OrbitControls(camera, canvas);
  const mobile =
    matchMedia('(pointer: coarse)').matches ||
    (navigator.hardwareConcurrency ?? 8) <= 4;
  const bloom = createSanctuaryBloom(renderer, scene, camera, mobile);
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const environment = new EnvironmentController(
    scene,
    mobile,
    motionPreference.matches,
    undefined,
    config.size,
  );
  const surface = createTerrainSurface(config.maxHeight, config.size);
  const terrain = createTerrainMesh(geometry.terrain, surface.material);
  const edge = createTerrainEdgeMesh(geometry.edge);
  scene.add(terrain, edge);
  let dirty = true;
  let disposed = false;
  let contextLost = false;
  let lastTick = 0;
  let lastRender = 0;
  let lastDebug = 0;
  let frameMs = 0;
  let renderCpuMs = 0;
  let frameCpuMs = 0;
  let renderPasses = 0;
  let frameCalls = 0;
  let frameTriangles = 0;
  let landmark: OvergrownRuin | null = null;
  let pondPanel: HTMLElement | undefined;
  let landmarkDebug: ReturnType<typeof createLandmarkDebug> | null = null;
  function setShadows(enabled: boolean): void {
    renderer.shadowMap.enabled = enabled;
    renderer.shadowMap.needsUpdate = true;
    environment.setShadows(enabled);
    terrain.castShadow = enabled;
    terrain.material.needsUpdate = true;
    edge.material.needsUpdate = true;
    environment.clouds.mesh.material.needsUpdate = true;
    landmark?.refreshMaterials();
    landmark?.waterEffects?.invalidate();
    dirty = true;
  }
  setShadows(true);
  const resetButton = document.querySelector<HTMLButtonElement>('#reset-view')!;

  const cameraRig = createOasisCameraRig({
    camera,
    controls,
    terrain,
    edge,
    config,
    landmark: () => landmark,
    invalidate: () => {
      dirty = true;
    },
  });
  function resize(): void {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    manager.resize(width, height);
    bloom.resize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    cameraRig.reframe();
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const resetPresentation = () => cameraRig.reset();
  resetButton.addEventListener('click', resetPresentation);
  const invalidate = (): void => {
    dirty = true;
  };
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', cameraRig.releaseFraming);
  const debugPanel = createEnvironmentPanel(
    environment,
    renderer,
    invalidate,
    setShadows,
    debugEnabled,
    () => {
      const direction = environment.sky.material.uniforms[
        environment.moon.visible ? 'moonDirection' : 'sunDirection'
      ]!.value as Vector3;
      cameraRig.sky(direction);
    },
  );
  const surfaceDebug = debugEnabled
    ? createSurfaceDebug(terrain, surface, invalidate)
    : null;
  landmarkStatus.textContent = '랜드마크 불러오는 중…';
  void createOvergrownRuin(
    config,
    cliffDetail,
    ruinDetail,
    treeDetail,
    pondDetail,
    crystalDetail,
    aesthetic,
    {
      pondOnly: true,
      water: true,
      waterfall: false,
      mobile,
      renderer,
      gpuNeutral: debugEnabled && query.get('material') === 'neutral',
      forceCpu: debugEnabled && query.get('surface') === 'cpu',
    },
    terrain,
    vegetation,
    composition,
    scenery,
    meadow,
  )
    .then((loaded) => {
      if (disposed) {
        loaded.dispose();
        return;
      }
      landmark = loaded;
      scene.add(loaded.root);
      cameraRig.reframeAfterLoad();
      if (debugEnabled && query.has('blockout')) {
        loaded.vegetation.group.visible = false;
        loaded.composition.group.visible = false;
        loaded.meadow.group.visible = false;
      }
      landmarkStatus.hidden = true;
      if (debugEnabled) {
        landmarkDebug = createLandmarkDebug(loaded, invalidate, cameraRig.landmarkView);
        // Opt-in inspection API for repeatable browser QA; no production global.
        Object.assign(window, {
          __oasisLandmark: createInspectionApi({
            loaded,
            environment,
            camera,
            controls,
            renderer,
            options,
            cameraRig,
            metrics: () => ({
              renderCpuMs,
              frameCpuMs,
              renderPasses,
              frameCalls,
              frameTriangles,
            }),
            invalidate,
          }),
        });
      }
      if (
        debugEnabled &&
        ['waterfall', 'pond-low', 'pond-top'].includes(query.get('view') ?? '')
      ) {
        cameraRig.pond(query.get('view'), loaded);
        environment.setTime(12);
      }
      if (
        debugEnabled &&
        query.get('panel') === 'pond' &&
        loaded.waterEffects &&
        'configurePond' in loaded.waterEffects
      ) {
        pondPanel = createPondPanel(
          loaded.waterEffects.configurePond,
          invalidate,
          query.get('material') === 'neutral',
          loaded.waterEffects.snapshot().gpuError,
        );
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
    const frameStart = debugEnabled ? performance.now() : 0;
    const firstPass = renderer.info.render.frame;
    if (debugEnabled) renderer.info.reset();
    if (cameraRig.update()) dirty = true;
    if (
      environment.update(
        seconds,
        camera,
        camera.position.distanceTo(controls.target),
        renderer.getPixelRatio(),
      )
    )
      dirty = true;
    if (landmark?.wind.update(seconds, environment.profile, motionPreference.matches))
      dirty = true;
    if (
      landmark?.waterEffects?.update(
        seconds,
        environment.state.timeOfDay,
        motionPreference.matches,
        `${environment.state.weather}:${environment.state.weatherBlend.toFixed(2)}`,
        environment.profile.rainIntensity,
      )
    )
      dirty = true;
    if (
      landmark?.fantasy?.update(
        seconds,
        environment.state.timeOfDay,
        motionPreference.matches,
        canvas.clientHeight * renderer.getPixelRatio(),
        environment.profile.cloudDarkness,
      )
    )
      dirty = true;
    if (!dirty) return;
    landmark?.worldTree?.updateLighting(landmark?.fantasy?.night ?? 0);
    const renderStart = debugEnabled ? performance.now() : 0;
    bloom.render(landmark?.fantasy?.night ?? 0);
    if (debugEnabled) {
      const end = performance.now();
      renderCpuMs = end - renderStart;
      frameCpuMs = end - frameStart;
      renderPasses = renderer.info.render.frame - firstPass;
      frameCalls = renderer.info.render.calls;
      frameTriangles = renderer.info.render.triangles;
    }
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
    pondPanel?.remove();
    debugPanel?.dispose();
    motionPreference.removeEventListener('change', motionChanged);
    bloom.dispose();
    manager.dispose();
    resetButton.removeEventListener('click', resetPresentation);
    controls.removeEventListener('start', cameraRig.releaseFraming);
    controls.removeEventListener('change', invalidate);
    canvas.removeEventListener('webglcontextlost', contextLostHandler);
    canvas.removeEventListener('webglcontextrestored', contextRestoredHandler);
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
  function contextLostHandler(event: Event): void {
    event.preventDefault();
    contextLost = true;
    renderer.setAnimationLoop(null);
  }
  function contextRestoredHandler(): void {
    contextLost = false;
    environment.invalidate();
    renderer.shadowMap.needsUpdate = true;
    landmark?.refreshMaterials();
    if (landmark?.waterEffects && 'restorePond' in landmark.waterEffects)
      landmark.waterEffects.restorePond();
    landmark?.waterEffects?.invalidate();
    dirty = true;
    visibility();
  }
  canvas.addEventListener('webglcontextlost', contextLostHandler);
  canvas.addEventListener('webglcontextrestored', contextRestoredHandler);
}
async function initialize(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#oasis-canvas');
  if (!canvas) throw new Error('Jelly Oasis canvas not found.');
  await start(canvas);
}

void initialize().catch((error: unknown) => {
  document.querySelector<HTMLElement>('#landmark-status')!.hidden = true;
  document.querySelector<HTMLElement>('#terrain-error')!.hidden = false;
  console.error('Jelly Oasis initialization failed:', error);
});
