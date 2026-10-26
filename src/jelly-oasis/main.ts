import { createSanctuaryBloom } from './environment/createSanctuaryBloom';
import { frameWorld, frameLandscape } from './terrain/worldCamera';
import { Box3, PCFShadowMap, PerspectiveCamera, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RendererManager } from '../core/renderer/RendererManager';
import {
  createTerrain,
  createTerrainEdge,
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
import { readStartupOptions } from './startupOptions';
import { auditLandmark } from './landmark/landmarkAudit';
import type { PondControls } from './landmark/water/gpgpuPondSurface';
import type { WeatherPreset } from './environment/weather';
import { createPondPanel } from './landmark/water/gpgpuPondPanel';
import './styles.css';

function start(canvas: HTMLCanvasElement): void {
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
  } = readStartupOptions(location.search, import.meta.env.DEV);
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
  const terrain = createTerrain(config, surface.material);
  const edge = createTerrainEdge(config, terrain.geometry);
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
  let reviewCamera = false;
  let groundCamera = false;
  let mediumCamera = false;
  let overviewCamera = false;
  let presentationCamera = true;
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
  const previousTarget = new Vector3();
  const resetButton = document.querySelector<HTMLButtonElement>('#reset-view')!;

  function resetView(overview = false): void {
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
    dirty = true;
  }
  function resize(): void {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    manager.resize(width, height);
    bloom.resize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (overviewCamera) resetView(true);
    else if (presentationCamera) resetView();
    else if (mediumCamera && landmark)
      frameLandmark('medium', landmark, camera, controls);
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const resetPresentation = () => resetView();
  resetButton.addEventListener('click', resetPresentation);
  const invalidate = (): void => {
    dirty = true;
  };
  controls.addEventListener('change', invalidate);
  const releaseFramingCamera = (): void => {
    mediumCamera = false;
    overviewCamera = false;
    presentationCamera = false;
  };
  controls.addEventListener('start', releaseFramingCamera);
  const debugPanel = createEnvironmentPanel(
    environment,
    renderer,
    invalidate,
    setShadows,
    debugEnabled,
    () => {
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
      resetView(true);
      return;
    }
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
  const landmarkStatus = document.createElement('p');
  landmarkStatus.id = 'landmark-status';
  landmarkStatus.role = 'status';
  landmarkStatus.textContent = '랜드마크 불러오는 중…';
  document.querySelector('.oasis-shell')!.append(landmarkStatus);
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
      if (overviewCamera || presentationCamera) resetView(overviewCamera);
      if (debugEnabled && query.has('blockout')) {
        loaded.vegetation.group.visible = false;
        loaded.composition.group.visible = false;
        loaded.meadow.group.visible = false;
      }
      landmarkStatus.hidden = true;
      if (debugEnabled) {
        landmarkDebug = createLandmarkDebug(loaded, invalidate, landmarkView);
        // Opt-in inspection API for repeatable browser QA; no production global.
        Object.assign(window, {
          __oasisLandmark: {
            audit: () => auditLandmark(loaded),
            wind: () => loaded.wind.snapshot(),
            configureWind: (enabled: boolean, paused = false) => {
              loaded.wind.enabled = enabled;
              loaded.wind.paused = paused;
              invalidate();
            },
            reviewWindStep: (seconds = 1) => {
              const duration = Number.isFinite(seconds)
                ? Math.min(30, Math.max(0, seconds))
                : 0;
              loaded.wind.paused = false;
              for (let remaining = duration; remaining > 0.0001; remaining -= 1 / 60)
                loaded.wind.update(
                  Math.min(1 / 60, remaining),
                  environment.profile,
                  false,
                );
              loaded.wind.paused = true;
              invalidate();
            },
            reviewEnvironment: (hour: number, weather: WeatherPreset = 'CLEAR') => {
              environment.setAutoWeather(false);
              environment.setPlaying(false);
              environment.setTime(hour);
              environment.setWeather(weather);
              for (let i = 0; i < 60; i++)
                environment.update(
                  0.1,
                  camera,
                  camera.position.distanceTo(controls.target),
                  renderer.getPixelRatio(),
                );
              loaded.waterEffects?.invalidate();
              invalidate();
            },
            reviewCamera: (position: number[], target: number[]) => {
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
              invalidate();
            },
            reviewVegetation: () =>
              loaded.vegetation.instances().map((p) => ({
                ...p,
                world: loaded.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
              })),
            reviewComposition: () =>
              loaded.composition.instances().map((p) => ({
                ...p,
                world: loaded.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
              })),
            reviewMeadow: () =>
              loaded.meadow.instances().map((p) => ({
                ...p,
                world: loaded.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
              })),
            reviewScenery: () =>
              loaded.scenery.instances().map((p) => ({
                ...p,
                world: loaded.root.localToWorld(new Vector3(p.x, p.y, p.z)).toArray(),
              })),
            reviewSceneryShape: (kind: string) => {
              loaded.isolate(kind ? 'scenery-prototype' : '');
              loaded.scenery.group.visible = true;
              for (const mesh of loaded.scenery.group.children)
                mesh.visible = !kind || mesh.name.startsWith(`Scenery_${kind}`);
              invalidate();
            },
            reviewIsolate: (name: string) => {
              loaded.isolate(name);
              invalidate();
            },
            reviewRebuild: () => {
              loaded.place({
                ...loaded.placement,
                position: { ...loaded.placement.position },
              });
              invalidate();
            },
            reviewWaterFlow: (rate = 1) => {
              const effects = loaded.waterEffects;
              if (effects && 'setFlowRate' in effects) effects.setFlowRate(rate);
              invalidate();
            },
            reviewPond: (settings: PondControls) => {
              const effects = loaded.waterEffects;
              if (effects && 'configurePond' in effects)
                effects.configurePond(settings);
              invalidate();
            },
            reviewPondHeights: () => {
              const effects = loaded.waterEffects;
              return effects && 'readPondHeights' in effects
                ? effects.readPondHeights()
                : null;
            },
            reviewWaterStep: (seconds = 0.5) => {
              const duration = Math.max(
                0,
                Math.min(2, Number.isFinite(seconds) ? seconds : 0),
              );
              for (let remaining = duration; remaining > 0.0001; remaining -= 1 / 60)
                loaded.waterEffects?.update(
                  Math.min(1 / 60, remaining),
                  environment.state.timeOfDay,
                  false,
                  undefined,
                  environment.profile.rainIntensity,
                );
              invalidate();
            },
            snapshot: () => ({
              terrain: { ...config },
              worldBounds: Object.fromEntries(
                [...loaded.assets.modules].map(([name, object]) => {
                  const b = new Box3().setFromObject(object);
                  return [
                    name,
                    {
                      min: b.min.toArray(),
                      max: b.max.toArray(),
                      margin:
                        config.size / 2 -
                        Math.max(
                          Math.abs(b.min.x),
                          Math.abs(b.max.x),
                          Math.abs(b.min.z),
                          Math.abs(b.max.z),
                        ),
                    },
                  ];
                }),
              ),
              modules: loaded.assets.modules.size,
              sacredLake: loaded.sacredLakeSnapshot(),
              sanctuary: null,
              lakeEcology: loaded.lakeEcology?.snapshot() ?? null,
              fantasy: loaded.fantasy?.snapshot() ?? null,
              vegetation: loaded.vegetation.snapshot(),
              composition: loaded.composition.snapshot(),
              scenery: loaded.scenery.snapshot(),
              meadow: loaded.meadow.snapshot(),
              cliffDetail,
              ruinDetail,
              treeDetail,
              pondDetail,
              crystalDetail,
              aesthetic,
              mediumCamera,
              excavation: loaded.excavationSnapshot(),
              waterEffects: loaded.waterEffects?.snapshot() ?? null,
              orbit: {
                polar: controls.getPolarAngle(),
                azimuth: controls.getAzimuthalAngle(),
                minPolar: controls.minPolarAngle,
                maxPolar: controls.maxPolarAngle,
              },
              pondVariant:
                pondDetail === 'v2' ? 'detail-v2' : pondDetail ? 'detail' : 'blockout',
              pondHeight: loaded.pondHeight,
              pondBankMaxLift:
                loaded.assets.modules.get('PondEdge_Blockout')!.userData.maxBankLift,
              pondBankMaxDisplacement:
                loaded.assets.modules.get('PondEdge_Blockout')!.userData
                  .maxBankDisplacement,
              wind: loaded.wind.snapshot(),
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
                direction:
                  environment.sky.material.uniforms.sunDirection!.value.toArray(),
                allocated: Boolean(environment.sun.shadow.map),
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
              renderCpuMs,
              frameCpuMs,
              calls: frameCalls,
              triangles: frameTriangles,
              renderCountersScope: 'whole-frame',
              renderPasses,
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
              minDistance: controls.minDistance,
            }),
          },
        });
      }
      if (
        debugEnabled &&
        ['waterfall', 'pond-low', 'pond-top'].includes(query.get('view') ?? '')
      ) {
        overviewCamera = false;
        presentationCamera = false;
        mediumCamera = false;
        reviewCamera = groundCamera = true;
        controls.enableDamping = false;
        controls.update();
        controls.minDistance = 1;
        controls.maxPolarAngle = Math.PI - 0.01;
        const pondView = query.get('view');
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
          loaded.placement.position.x - 70,
          loaded.root.position.y - sampleTerrainHeight(70, 58),
          loaded.placement.position.z - 58,
        );
        camera.position.add(offset);
        controls.target.add(offset);
        controls.update();
        controls.enableDamping = true;
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
      dirty = true;
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
    controls.removeEventListener('start', releaseFramingCamera);
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
try {
  const canvas = document.querySelector<HTMLCanvasElement>('#oasis-canvas');
  if (!canvas) throw new Error('Jelly Oasis canvas not found.');
  start(canvas);
} catch (error) {
  document.querySelector<HTMLElement>('#terrain-error')!.hidden = false;
  console.error('Jelly Oasis initialization failed:', error);
}
