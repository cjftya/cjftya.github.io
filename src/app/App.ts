import { Clock, Vector3 } from 'three';
import { CameraController } from '../core/camera/CameraController';
import { PlanetPicker } from '../core/interaction/PlanetPicker';
import { RendererManager } from '../core/renderer/RendererManager';
import { SceneManager } from '../core/scene/SceneManager';
import { JsonProjectRepository } from '../data/JsonProjectRepository';
import type { Project } from '../data/Project';
import type { ProjectRepository } from '../data/ProjectRepository';
import { SolarSystem } from '../solar-system/SolarSystem';
import { UiController } from '../ui/UiController';

const MOBILE_FRAME_INTERVAL_MS = 1000 / 30;
const HISTORY_PROJECT_KEY = 'jellyPlantsProjectId';

export class App {
  private readonly ui: UiController;
  private readonly sceneManager = new SceneManager();
  private readonly rendererManager: RendererManager;
  private readonly cameraController: CameraController;
  private readonly solarSystem: SolarSystem;
  private readonly clock = new Clock();
  private readonly resizeObserver: ResizeObserver;
  private readonly projectById = new Map<string, Project>();
  private readonly projectedLabelPosition = new Vector3();
  private readonly minimumFrameIntervalMs = window.matchMedia('(pointer: coarse)')
    .matches
    ? MOBILE_FRAME_INTERVAL_MS
    : 0;
  private picker: PlanetPicker | undefined;
  private selectedProjectId: string | null = null;
  private hoveredProjectId: string | null = null;
  private lastRenderTimeMs = 0;
  private viewportWidth = 1;
  private viewportHeight = 1;
  private disposed = false;

  constructor(
    root: HTMLElement,
    private readonly projectRepository: ProjectRepository = new JsonProjectRepository(),
  ) {
    this.ui = new UiController(root, {
      onCloseSelection: this.requestClearSelection,
      onSelectProject: this.handleLabelSelection,
      onHoverProject: this.handleLabelHover,
    });
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
    window.addEventListener('popstate', this.handlePopState);
    this.syncRenderLoopWithVisibility();

    try {
      const projects = await this.projectRepository.getProjects();
      projects.forEach((project) => this.projectById.set(project.id, project));
      await this.solarSystem.load(projects);
      this.ui.showProjects(projects);
      this.picker = new PlanetPicker(
        this.ui.canvas,
        this.cameraController.camera,
        this.solarSystem,
        this.handlePickedProject,
        this.handleHoveredProject,
      );
      this.initializeHistoryState();
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
    window.removeEventListener('popstate', this.handlePopState);
    this.resizeObserver.disconnect();
    this.picker?.dispose();
    this.ui.dispose();
    this.solarSystem.dispose();
    this.sceneManager.dispose();
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
    this.sceneManager.update(deltaSeconds);
    this.solarSystem.update(deltaSeconds);
    this.cameraController.update(deltaSeconds);
    this.updatePlanetLabels();
    this.rendererManager.renderer.render(
      this.sceneManager.scene,
      this.cameraController.camera,
    );
  };

  private readonly handleVisibilityChange = (): void => {
    this.syncRenderLoopWithVisibility();
  };

  private readonly handlePickedProject = (project: Project | null): void => {
    if (project === null) {
      this.requestClearSelection();
      return;
    }

    const historyState = {
      ...this.getCurrentHistoryState(),
      [HISTORY_PROJECT_KEY]: project.id,
    };

    if (this.selectedProjectId === null) {
      window.history.pushState(historyState, '');
    } else {
      window.history.replaceState(historyState, '');
    }

    this.applySelection(project);
  };

  private readonly handleHoveredProject = (project: Project | null): void => {
    this.applyHover(project?.id ?? null);
  };

  private readonly handleLabelSelection = (projectId: string): void => {
    const project = this.projectById.get(projectId);

    if (project !== undefined) {
      this.handlePickedProject(project);
    }
  };

  private readonly handleLabelHover = (projectId: string | null): void => {
    this.applyHover(projectId);
  };

  private readonly requestClearSelection = (): void => {
    if (this.selectedProjectId !== null) {
      window.history.back();
    }
  };

  private readonly handlePopState = (event: PopStateEvent): void => {
    const state = this.readProjectIdFromHistory(event.state);
    const project = state === null ? null : (this.projectById.get(state) ?? null);
    this.applySelection(project);
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
    this.viewportWidth = safeWidth;
    this.viewportHeight = safeHeight;
    this.rendererManager.resize(safeWidth, safeHeight);
    this.cameraController.resize(safeWidth / safeHeight);
  };

  private initializeHistoryState(): void {
    window.history.replaceState(
      {
        ...this.getCurrentHistoryState(),
        [HISTORY_PROJECT_KEY]: null,
      },
      '',
    );
  }

  private applySelection(project: Project | null): void {
    this.selectedProjectId = project?.id ?? null;
    this.solarSystem.setSelected(this.selectedProjectId);
    this.ui.showSelection(project);

    if (project === null) {
      this.cameraController.resetFocus();
      return;
    }

    const worldPosition = this.solarSystem.getProjectWorldPosition(project.id);

    if (worldPosition !== null) {
      this.cameraController.focusOn(worldPosition, project.planet.shape.radius);
    }
  }

  private applyHover(projectId: string | null): void {
    if (projectId === this.hoveredProjectId) {
      return;
    }

    this.hoveredProjectId = projectId;
    this.solarSystem.setHovered(projectId);
    this.ui.setHoveredProject(projectId);
  }

  private updatePlanetLabels(): void {
    for (const anchor of this.solarSystem.getLabelAnchors()) {
      this.projectedLabelPosition
        .copy(anchor.position)
        .addScaledVector(this.cameraController.camera.up, anchor.radius * 1.55)
        .project(this.cameraController.camera);

      const { x, y, z } = this.projectedLabelPosition;
      const visible = z >= -1 && z <= 1 && Math.abs(x) <= 1.08 && Math.abs(y) <= 1.08;

      this.ui.updatePlanetLabel(
        anchor.id,
        (x * 0.5 + 0.5) * this.viewportWidth,
        (-y * 0.5 + 0.5) * this.viewportHeight,
        visible,
      );
    }
  }

  private getCurrentHistoryState(): Record<string, unknown> {
    const state: unknown = window.history.state;
    return typeof state === 'object' && state !== null
      ? (state as Record<string, unknown>)
      : {};
  }

  private readProjectIdFromHistory(state: unknown): string | null {
    if (typeof state !== 'object' || state === null) {
      return null;
    }

    const projectId = (state as Record<string, unknown>)[HISTORY_PROJECT_KEY];
    return typeof projectId === 'string' ? projectId : null;
  }
}
