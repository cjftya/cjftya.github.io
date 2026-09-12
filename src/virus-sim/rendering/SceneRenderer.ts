import * as THREE from 'three';
import { getCatalogEntry } from '../catalog/registry';
import type { ObservationSnapshot } from '../observation/types';
import { DecorativeParticles } from './effects/DecorativeParticles';
import { ManualCamera } from './ManualCamera';
import { QUALITY_SETTINGS, type RenderQuality } from './quality/quality';
import { ScannerRenderer } from './scanner/ScannerRenderer';
import { SpecimenView, type SpecimenPick } from './SpecimenView';

export interface SelectionDetails extends SpecimenPick {
  readonly kind: 'part';
}

interface ObservationScene {
  readonly scene: THREE.Scene;
  readonly camera: ManualCamera;
  readonly particles: DecorativeParticles;
  view: SpecimenView | null;
}

interface PointerGesture {
  readonly id: number;
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  mode: 'orbit' | 'pan';
}

type SnapshotSource = (deltaSeconds: number) => ObservationSnapshot;

export class SceneRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly scanner: ScannerRenderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly observationScene: ObservationScene;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly activePointers = new Map<number, PointerGesture>();
  private snapshot: ObservationSnapshot | null = null;
  private quality: RenderQuality = 'standard';
  private animationFrame = 0;
  private resizeAnimationFrame = 0;
  private frameSource: SnapshotSource | null = null;
  private lastFrameTime = performance.now();
  private startedAt = performance.now();
  private disposed = false;
  private pendingRefit = true;
  private viewportOrientation = window.innerWidth < window.innerHeight;
  private lastTouchDistance = 0;
  private lastTouchCenter: { x: number; y: number } | null = null;

  constructor(
    private readonly container: HTMLElement,
    scannerCanvas: HTMLCanvasElement,
    private readonly onSelect: (selection: SelectionDetails | null) => void,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'virus-canvas';
    this.canvas.setAttribute('aria-label', '바이러스 3D 구조 수동 관찰 화면');
    this.canvas.style.touchAction = 'none';
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
    this.renderer.autoClear = false;
    this.setRendererPixelRatio(this.quality);
    this.observationScene = this.createObservationScene();
    this.scanner = new ScannerRenderer(this.renderer, scannerCanvas);
    this.scanner.clear();

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.commitResize();
  }

  start(source: SnapshotSource): void {
    this.frameSource = source;
    if (this.animationFrame) return;
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  show(snapshot: ObservationSnapshot): void {
    this.snapshot = snapshot;
    const changed = this.ensureView(snapshot);
    this.applySnapshot(snapshot);
    if ((changed || this.pendingRefit) && this.observationScene.view) this.frameAll();
    this.renderFrame();
  }

  setQuality(quality: RenderQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.setRendererPixelRatio(quality);
    this.observationScene.particles.setQuality(quality);
    this.observationScene.view?.dispose();
    this.observationScene.view = null;
    this.scanner.invalidate();
    this.pendingRefit = true;
    if (this.snapshot) this.show(this.snapshot);
    this.commitResize();
  }

  frameAll(): void {
    if (!this.snapshot || !this.observationScene.view) return;
    this.observationScene.camera.frameObject(
      this.observationScene.view.getRenderRoot(),
    );
    this.pendingRefit = false;
    this.renderFrame();
  }

  getRenderMetrics(): { calls: number; triangles: number; geometries: number } {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
    };
  }

  savePng(filename: string): Promise<boolean> {
    this.renderFrame();
    const snapshot = this.snapshot;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const context = exportCanvas.getContext('2d');
    if (!snapshot || !context) return Promise.resolve(false);
    context.drawImage(this.canvas, 0, 0);
    const scaleX = exportCanvas.width / Math.max(1, this.container.clientWidth);
    const scaleY = exportCanvas.height / Math.max(1, this.container.clientHeight);
    this.drawExportOverlay(context, snapshot, scaleX, scaleY);
    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        if (!blob) return resolve(false);
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

  private drawExportOverlay(
    context: CanvasRenderingContext2D,
    snapshot: ObservationSnapshot,
    scaleX: number,
    scaleY: number,
  ): void {
    context.save();
    context.scale(scaleX, scaleY);
    context.textBaseline = 'top';
    context.font = '700 17px system-ui, sans-serif';
    const name = getCatalogEntry(snapshot.specimen.presetId).shortName;
    const width = context.measureText(name).width + 24;
    context.fillStyle = 'rgba(5, 11, 23, 0.82)';
    context.fillRect(14, 14, width, 34);
    context.strokeStyle = '#63eee0';
    context.strokeRect(14, 14, width, 34);
    context.fillStyle = '#f2f7ff';
    context.fillText(name, 26, 21);
    context.restore();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    cancelAnimationFrame(this.resizeAnimationFrame);
    this.animationFrame = 0;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    this.observationScene.view?.dispose();
    this.observationScene.particles.dispose();
    this.scanner.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  private createObservationScene(): ObservationScene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06101c);
    addLights(scene);
    return {
      scene,
      camera: new ManualCamera(),
      particles: new DecorativeParticles(scene, this.quality),
      view: null,
    };
  }

  private ensureView(snapshot: ObservationSnapshot): boolean {
    const state = snapshot.specimen;
    if (this.observationScene.view?.presetId === state.presetId) return false;
    this.observationScene.view?.dispose();
    this.observationScene.view = new SpecimenView(
      this.observationScene.scene,
      state.presetId,
      this.quality,
    );
    this.scanner.invalidate();
    return true;
  }

  private applySnapshot(snapshot: ObservationSnapshot): void {
    const { camera, particles, view } = this.observationScene;
    camera.setViewport(
      Math.max(1, this.container.clientWidth),
      Math.max(1, this.container.clientHeight),
    );
    const definition = getCatalogEntry(snapshot.specimen.presetId);
    view?.setScale(4.8 / Math.max(0.001, definition.displayLength));
    view?.update(snapshot.specimen);
    particles.setState(snapshot.decoration.level, snapshot.decoration.paused);
  }

  private renderFrame(): void {
    const snapshot = this.snapshot;
    if (!snapshot) return;
    this.ensureView(snapshot);
    this.applySnapshot(snapshot);
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setRenderTarget(null);
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.setScissorTest(false);
    this.renderer.setClearColor(0x081927, 1);
    this.renderer.clear(true, true, true);
    this.renderer.render(
      this.observationScene.scene,
      this.observationScene.camera.perspective,
    );
    this.renderScanner(snapshot);
  }

  private renderScanner(snapshot: ObservationSnapshot): void {
    if (!snapshot.scanner.enabled) {
      this.scanner.clear();
      return;
    }
    const state = snapshot.specimen;
    const { scene, view } = this.observationScene;
    if (!view) return;
    const probe = snapshot.scanner.probe;
    const signature = [
      state.presetId,
      state.view,
      state.genomeVisible,
      Object.values(state.layerVisibility).join(''),
      probe.axis,
      probe.position.toFixed(4),
      probe.thickness.toFixed(4),
      view.getRenderRoot().scale.x.toFixed(5),
    ].join(':');
    this.scanner.render(
      scene,
      view,
      probe.axis,
      probe.position,
      probe.thickness,
      signature,
    );
  }

  private readonly frame = (time: number): void => {
    if (this.disposed) return;
    const delta = Math.min(0.1, Math.max(0, (time - this.lastFrameTime) / 1000));
    this.lastFrameTime = time;
    if (this.frameSource) this.snapshot = this.frameSource(delta);
    if (this.snapshot) {
      const elapsed = (time - this.startedAt) / 1000;
      const particlesAnimating =
        this.snapshot.decoration.level !== 'off' && !this.snapshot.decoration.paused;
      if (particlesAnimating) this.observationScene.particles.update(elapsed);
      if (particlesAnimating) this.renderFrame();
    }
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private readonly resize = (): void => {
    if (this.resizeAnimationFrame) return;
    this.resizeAnimationFrame = requestAnimationFrame(() => {
      this.resizeAnimationFrame = 0;
      this.commitResize();
    });
  };

  private commitResize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const orientation = window.innerWidth < window.innerHeight;
    if (orientation !== this.viewportOrientation) {
      this.viewportOrientation = orientation;
      this.pendingRefit = true;
    }
    this.renderer.setSize(width, height, false);
    if (this.snapshot) this.applySnapshot(this.snapshot);
    this.scanner.invalidate();
    if (this.pendingRefit && this.observationScene.view) this.frameAll();
    this.renderFrame();
  }

  private readonly handleOrientationChange = (): void => {
    this.pendingRefit = true;
    this.resize();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.canvas.setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      mode:
        event.button === 1 || event.button === 2 || event.shiftKey ? 'pan' : 'orbit',
    });
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const gesture = this.activePointers.get(event.pointerId);
    if (!gesture) return;
    const deltaX = event.clientX - gesture.lastX;
    const deltaY = event.clientY - gesture.lastY;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 6)
      gesture.moved = true;
    if (event.pointerType === 'touch' && this.activePointers.size >= 2) {
      const [first, second] = [...this.activePointers.values()];
      if (!first || !second) return;
      const center = {
        x: (first.lastX + second.lastX) / 2,
        y: (first.lastY + second.lastY) / 2,
      };
      const distance = Math.hypot(
        first.lastX - second.lastX,
        first.lastY - second.lastY,
      );
      if (this.lastTouchCenter && this.lastTouchDistance > 0) {
        const camera = this.observationScene.camera;
        camera.pan(
          center.x - this.lastTouchCenter.x,
          center.y - this.lastTouchCenter.y,
        );
        camera.dolly((this.lastTouchDistance - distance) * 3);
      }
      this.lastTouchCenter = center;
      this.lastTouchDistance = distance;
    } else {
      const camera = this.observationScene.camera;
      if (gesture.mode === 'pan') camera.pan(deltaX, deltaY);
      else camera.orbit(deltaX, deltaY);
    }
    this.renderFrame();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const gesture = this.activePointers.get(event.pointerId);
    this.activePointers.delete(event.pointerId);
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
    if (!gesture) return;
    if (!gesture.moved && performance.now() - gesture.startedAt < 560) this.pick(event);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.observationScene.camera.dolly(event.deltaY);
    this.renderFrame();
  };

  private pick(event: PointerEvent): void {
    const snapshot = this.snapshot;
    const state = snapshot?.specimen;
    const view = this.observationScene.view;
    if (!snapshot || !state || !view) return this.onSelect(null);
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.pointer.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(
      this.pointer,
      this.observationScene.camera.perspective,
    );
    const selection = view.pick(
      this.raycaster,
      state.sectionOffset,
      state.view === 'section',
    );
    this.onSelect(selection ? { ...selection, kind: 'part' } : null);
  }

  private setRendererPixelRatio(quality: RenderQuality): void {
    const configured = QUALITY_SETTINGS[quality].pixelRatio;
    const maximum = window.matchMedia('(pointer: coarse)').matches
      ? Math.min(configured, 1.45)
      : configured;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maximum));
  }

  private readonly handleContextMenu = (event: Event): void => event.preventDefault();

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
}

function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xb9d8e8, 0x07101a, 1.5));
  const key = new THREE.DirectionalLight(0xd7ffff, 3.7);
  key.position.set(7, 9, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x7099c7, 1.35);
  fill.position.set(-5, 2, 6);
  scene.add(fill);
  const rim = new THREE.PointLight(0x8978ff, 25, 24, 2);
  rim.position.set(-7, 1, -6);
  scene.add(rim);
  const warm = new THREE.PointLight(0xffc580, 12, 16, 2);
  warm.position.set(4, -3, 3);
  scene.add(warm);
}
