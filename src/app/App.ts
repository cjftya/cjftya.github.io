import { Clock } from 'three';
import { CameraController } from '../core/camera/CameraController';
import { PlanetPicker } from '../core/interaction/PlanetPicker';
import { RendererManager } from '../core/renderer/RendererManager';
import { SceneManager } from '../core/scene/SceneManager';
import { JsonProjectRepository } from '../data/JsonProjectRepository';
import type { ProjectRepository } from '../data/ProjectRepository';
import { SolarSystem } from '../solar-system/SolarSystem';
import { UiController } from '../ui/UiController';

const MOBILE_FRAME_INTERVAL_MS = 1000 / 30;

export class App {
  private readonly ui: UiController;
  private readonly sceneManager = new SceneManager();
  private readonly rendererManager: RendererManager;
  private readonly cameraController: CameraController;
  private readonly solarSystem: SolarSystem;
  private readonly clock = new Clock();
  private readonly resizeObserver: ResizeObserver;
  private readonly minimumFrameIntervalMs = window.matchMedia('(pointer: coarse)')
    .matches
    ? MOBILE_FRAME_INTERVAL_MS
    : 0;
  private picker: PlanetPicker | undefined;
  private lastRenderTimeMs = 0;
  private disposed = false;

  constructor(
    root: HTMLElement,
    private readonly projectRepository: ProjectRepository = new JsonProjectRepository(),
  ) {
    this.ui = new UiController(root);
    const { width, height } = this.ui.viewport.getBoundingClientRect();
    const safeHeight = Math.max(height, 1);

    this.rendererManager = new RendererManager(this.ui.canvas);
    this.cameraController = new CameraController(
      this.ui.canvas,
      Math.max(width, 1) / safeHeight,
    );
    this.solarSystem = new SolarSystem(this.sceneManager.scene);
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.ui.viewport);
    this.handleResize();
  }

  async start(): Promise<void> {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.syncRenderLoopWithVisibility();

    try {
      const projects = await this.projectRepository.getProjects();
      await this.solarSystem.load(projects);
      this.picker = new PlanetPicker(
        this.ui.canvas,
        this.cameraController.camera,
        this.solarSystem,
        (project) => {
          this.solarSystem.setSelected(project?.id ?? null);
          this.ui.showSelection(project);
        },
      );
      this.ui.showReady();
    } catch (error) {
      this.ui.showError(error);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.resizeObserver.disconnect();
    this.picker?.dispose();
    this.solarSystem.dispose();
    this.cameraController.dispose();
    this.rendererManager.dispose();
  }

  private readonly animate = (timeMs: number): void => {
    const elapsedMs = timeMs - this.lastRenderTimeMs;

    if (elapsedMs < this.minimumFrameIntervalMs) {
      return;
    }

    this.lastRenderTimeMs =
      this.minimumFrameIntervalMs > 0
        ? timeMs - (elapsedMs % this.minimumFrameIntervalMs)
        : timeMs;
    const deltaSeconds = Math.min(this.clock.getDelta(), 0.1);
    this.solarSystem.update(deltaSeconds);
    this.cameraController.update();
    this.rendererManager.renderer.render(
      this.sceneManager.scene,
      this.cameraController.camera,
    );
  };

  private readonly handleVisibilityChange = (): void => {
    this.syncRenderLoopWithVisibility();
  };

  private syncRenderLoopWithVisibility(): void {
    if (document.hidden) {
      this.rendererManager.renderer.setAnimationLoop(null);
      this.clock.stop();
      return;
    }

    this.lastRenderTimeMs = 0;
    this.clock.start();
    this.rendererManager.renderer.setAnimationLoop(this.animate);
  }

  private readonly handleResize = (): void => {
    const { width, height } = this.ui.viewport.getBoundingClientRect();
    const safeWidth = Math.max(Math.floor(width), 1);
    const safeHeight = Math.max(Math.floor(height), 1);
    this.rendererManager.resize(safeWidth, safeHeight);
    this.cameraController.resize(safeWidth / safeHeight);
  };
}
