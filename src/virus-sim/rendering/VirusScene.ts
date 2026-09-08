import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ObservationPartId, ObservationSnapshot } from '../observation/types';
import { CameraRig } from './CameraRig';
import { FluidAmbience } from './environment/FluidAmbience';
import { ObservationView } from './ObservationView';
import { FocusController } from './postfx/FocusController';
import { QUALITY_SETTINGS, type ExperienceQuality } from './quality/quality';

export interface SelectionDetails {
  readonly title: string;
  readonly description: string;
  readonly kind: 'part';
  readonly partId: ObservationPartId;
}

type SelectionHandler = (selection: SelectionDetails | null) => void;

export class VirusScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly cameraRig: CameraRig;
  private readonly ambience: FluidAmbience;
  private readonly focusController: FocusController;
  private readonly root = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly canvas: HTMLCanvasElement;
  private observationView: ObservationView | null = null;
  private snapshot: ObservationSnapshot | null = null;
  private pointerStart: { x: number; y: number; time: number; id: number } | null =
    null;
  private quality: ExperienceQuality = 'standard';
  private startedAt = performance.now();

  constructor(
    private readonly container: HTMLElement,
    private readonly onSelect: SelectionHandler,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'virus-canvas';
    this.canvas.setAttribute('aria-label', '바이러스 3D 구조 관찰 화면');
    container.append(this.canvas);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.localClippingEnabled = true;
    this.setRendererPixelRatio('standard');

    this.scene.background = new THREE.Color(0x06101c);
    this.scene.add(this.root);
    this.addLights();
    this.ambience = new FluidAmbience(this.scene);
    this.camera.position.set(7.4, 4.8, 8.8);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 0.06;
    this.controls.maxDistance = 24;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.cameraRig = new CameraRig(this.camera, this.controls, (token) => {
      this.container.dispatchEvent(
        new CustomEvent('virus-camera-settled', { bubbles: true, detail: token }),
      );
    });
    this.focusController = new FocusController(this.renderer, this.scene, this.camera);
    this.focusController.setQuality(this.quality);

    this.controls.addEventListener('start', this.handleControlsStart);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.resize();
  }

  show(snapshot: ObservationSnapshot): void {
    const rebuild = this.observationView?.presetId !== snapshot.presetId;
    const hadView = this.observationView !== null;
    this.snapshot = snapshot;
    if (rebuild || !this.observationView) {
      const cameraPosition = this.camera.position.clone();
      const cameraTarget = this.controls.target.clone();
      this.clearModel();
      this.observationView = new ObservationView(
        this.root,
        this.controls,
        this.cameraRig,
        snapshot.presetId,
        this.quality,
      );
      if (!rebuild || hadView) {
        this.camera.position.copy(cameraPosition);
        this.controls.target.copy(cameraTarget);
        this.controls.update();
      }
    }
    this.updateExperienceAppearance(snapshot);
    this.observationView.update(snapshot, 1);
    this.renderFrame();
  }

  update(snapshot: ObservationSnapshot, interpolation: number): void {
    if (this.observationView?.presetId !== snapshot.presetId) this.show(snapshot);
    this.snapshot = snapshot;
    this.updateExperienceAppearance(snapshot);
    this.observationView?.update(snapshot, interpolation);
    this.ambience.update((performance.now() - this.startedAt) / 1000);
    this.renderFrame();
  }

  setQuality(quality: ExperienceQuality): void {
    if (this.quality === quality) return;
    this.quality = quality;
    this.setRendererPixelRatio(quality);
    this.ambience.setQuality(quality);
    this.focusController.setQuality(quality);
    this.renderer.shadowMap.enabled = QUALITY_SETTINGS[quality].shadows;
    if (this.snapshot) {
      const snapshot = this.snapshot;
      const cameraPosition = this.camera.position.clone();
      const cameraTarget = this.controls.target.clone();
      this.clearModel();
      this.observationView = new ObservationView(
        this.root,
        this.controls,
        this.cameraRig,
        snapshot.presetId,
        quality,
      );
      this.camera.position.copy(cameraPosition);
      this.controls.target.copy(cameraTarget);
      this.controls.update();
      this.observationView.update(snapshot, 1);
    }
    this.resize();
  }

  resetCamera(): void {
    this.observationView?.frameAll(false);
  }

  cancelCameraAutomation(): void {
    this.cameraRig.cancelAutomation();
  }

  focusSelection(): void {
    this.observationView?.focusSelection();
  }

  selectObservationPart(partId: ObservationPartId): void {
    const selection = this.observationView?.selectPart(partId);
    if (!selection) return;
    this.onSelect({ ...selection, kind: 'part' });
  }

  getRenderMetrics(): { calls: number; triangles: number; geometries: number } {
    return (
      this.observationView?.getRenderMetrics(this.renderer) ?? {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
      }
    );
  }

  savePng(filename: string): Promise<boolean> {
    this.renderFrame();
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        resolve(true);
      }, 'image/png');
    });
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.controls.removeEventListener('start', this.handleControlsStart);
    this.resizeObserver.disconnect();
    this.cameraRig.dispose();
    this.controls.dispose();
    this.clearModel();
    this.ambience.dispose();
    this.focusController.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  private readonly resize = (): void => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.focusController.resize(width, height, this.renderer.getPixelRatio());
  };

  private readonly handleControlsStart = (): void => {
    this.container.dispatchEvent(
      new CustomEvent('virus-observation-interaction', { bubbles: true }),
    );
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      id: event.pointerId,
    };
  };

  private readonly handlePointerCancel = (): void => {
    this.pointerStart = null;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start || start.id !== event.pointerId) return;
    if (
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 ||
      performance.now() - start.time > 520
    )
      return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const selection = this.observationView?.pick(this.raycaster) ?? null;
    this.onSelect(selection ? { ...selection, kind: 'part' } : null);
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.container.dispatchEvent(
      new CustomEvent('virus-context-status', { bubbles: true, detail: 'lost' }),
    );
  };

  private readonly handleContextRestored = (): void => {
    this.container.dispatchEvent(
      new CustomEvent('virus-context-status', { bubbles: true, detail: 'restored' }),
    );
    if (this.snapshot) this.show(this.snapshot);
  };

  private clearModel(): void {
    this.observationView?.dispose();
    this.observationView = null;
    this.root.clear();
  }

  private setRendererPixelRatio(quality: ExperienceQuality): void {
    const configured = QUALITY_SETTINGS[quality].pixelRatio;
    const maximum = window.matchMedia('(pointer: coarse)').matches
      ? Math.min(configured, 1.45)
      : configured;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maximum));
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xb9d8e8, 0x07101a, 1.55));
    const key = new THREE.DirectionalLight(0xd7ffff, 3.7);
    key.position.set(7, 9, 8);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x7099c7, 1.35);
    fill.position.set(-5, 2, 6);
    this.scene.add(fill);
    const rim = new THREE.PointLight(0x8978ff, 28, 24, 2);
    rim.position.set(-7, 1, -6);
    this.scene.add(rim);
    const warm = new THREE.PointLight(0xffc580, 13, 16, 2);
    warm.position.set(4, -3, 3);
    this.scene.add(warm);
  }

  private updateExperienceAppearance(snapshot: ObservationSnapshot): void {
    this.container.dataset.experienceStage = snapshot.experience.stage;
    this.focusController.setStage(snapshot.experience.stage);
    (this.container.parentElement ?? this.container).style.setProperty(
      '--focus-depth',
      snapshot.experience.stage === 'interior'
        ? '0.72'
        : snapshot.experience.stage === 'surface'
          ? '0.48'
          : '0.18',
    );
  }

  private renderFrame(): void {
    this.focusController.render(this.controls.target);
  }
}
