import { Box3, Vector3 } from 'three';
import type { PerspectiveCamera, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EnvironmentController } from '../environment/EnvironmentController';
import type { OvergrownRuin } from '../landmark/createOvergrownRuin';
import { auditLandmark } from '../landmark/landmarkAudit';
import type { PondControls } from '../landmark/water/gpgpuPondSurface';
import type { WeatherPreset } from '../environment/weather';
import type { readStartupOptions } from '../startupOptions';
import type { createOasisCameraRig } from './createOasisCameraRig';

export interface FrameMetrics {
  renderCpuMs: number;
  frameCpuMs: number;
  renderPasses: number;
  frameCalls: number;
  frameTriangles: number;
}

/** Debug-only browser QA contract. Callbacks read the latest camera/frame state. */
export function createInspectionApi({
  loaded,
  environment,
  camera,
  controls,
  renderer,
  options,
  cameraRig,
  metrics,
  invalidate,
}: {
  loaded: OvergrownRuin;
  environment: EnvironmentController;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  renderer: WebGLRenderer;
  options: ReturnType<typeof readStartupOptions>;
  cameraRig: ReturnType<typeof createOasisCameraRig>;
  metrics: () => FrameMetrics;
  invalidate: () => void;
}) {
  const {
    config,
    cliffDetail,
    ruinDetail,
    treeDetail,
    pondDetail,
    crystalDetail,
    aesthetic,
  } = options;
  return {
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
        loaded.wind.update(Math.min(1 / 60, remaining), environment.profile, false);
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
      cameraRig.review(position, target);
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
      if (effects && 'configurePond' in effects) effects.configurePond(settings);
      invalidate();
    },
    reviewPondHeights: () => {
      const effects = loaded.waterEffects;
      return effects && 'readPondHeights' in effects ? effects.readPondHeights() : null;
    },
    reviewWaterStep: (seconds = 0.5) => {
      const duration = Math.max(0, Math.min(2, Number.isFinite(seconds) ? seconds : 0));
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
      mediumCamera: cameraRig.medium,
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
        loaded.assets.modules.get('PondEdge_Blockout')!.userData.maxBankDisplacement,
      wind: loaded.wind.snapshot(),
      autoWeather: {
        enabled: environment.autoWeather.enabled,
        secondsUntilNext: environment.autoWeather.secondsUntilNext,
        seed: environment.autoWeather.seed,
      },
      moon: {
        direction: environment.sky.material.uniforms.moonDirection!.value.toArray(),
        visibility: environment.sky.material.uniforms.moonVisibility!.value,
        intensity: environment.moon.intensity,
        castShadow: environment.moon.castShadow,
        allocated: Boolean(environment.moon.shadow.map),
      },
      sun: {
        direction: environment.sky.material.uniforms.sunDirection!.value.toArray(),
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
      renderCpuMs: metrics().renderCpuMs,
      frameCpuMs: metrics().frameCpuMs,
      calls: metrics().frameCalls,
      triangles: metrics().frameTriangles,
      renderCountersScope: 'whole-frame',
      renderPasses: metrics().renderPasses,
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
  };
}
