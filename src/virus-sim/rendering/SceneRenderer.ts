import * as THREE from 'three';
import { getPhysicalDimensions } from '../catalog/dimensions';
import { getCatalogEntry } from '../catalog/registry';
import {
  computeNmPerPixel,
  layoutComparisonViewports,
  normalizedSpecimenScale,
  physicalSpecimenScale,
  scaleBarForNmPerPixel,
  viewportForPoint,
  type ViewportRect,
} from '../comparison/scaling';
import type {
  ObservationSnapshot,
  SlotId,
  SpecimenObservationState,
} from '../observation/types';
import type { LabSnapshot } from '../lab/types';
import { DecorativeParticles } from './effects/DecorativeParticles';
import { ManualCamera, type ManualCameraPose } from './ManualCamera';
import { LabScene } from './lab/LabScene';
import { QUALITY_SETTINGS, type RenderQuality } from './quality/quality';
import { ScannerRenderer } from './scanner/ScannerRenderer';
import { SpecimenView, type SpecimenPick } from './SpecimenView';

const WORLD_UNITS_PER_NM = 0.02;

export interface SelectionDetails extends SpecimenPick {
  readonly kind: 'part';
  readonly slot: SlotId;
}

interface SlotScene {
  readonly scene: THREE.Scene;
  readonly camera: ManualCamera;
  readonly particles: DecorativeParticles;
  view: SpecimenView | null;
}

interface PointerGesture {
  readonly id: number;
  readonly slot: SlotId;
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  mode: 'orbit' | 'pan';
}

export type SceneFrameSnapshot =
  | { readonly mode: 'observation'; readonly snapshot: ObservationSnapshot }
  | { readonly mode: 'lab'; readonly snapshot: LabSnapshot };

type SnapshotSource = (deltaSeconds: number) => SceneFrameSnapshot;

export class SceneRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly scanner: ScannerRenderer;
  private readonly labScene: LabScene;
  private readonly resizeObserver: ResizeObserver;
  private readonly slots: Record<SlotId, SlotScene>;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly activePointers = new Map<number, PointerGesture>();
  private snapshot: ObservationSnapshot | null = null;
  private labSnapshot: LabSnapshot | null = null;
  private activeMode: SceneFrameSnapshot['mode'] = 'observation';
  private quality: RenderQuality = 'standard';
  private viewports: readonly [ViewportRect, ViewportRect?] = [
    { x: 0, y: 0, width: 1, height: 1 },
  ];
  private animationFrame = 0;
  private resizeAnimationFrame = 0;
  private frameSource: SnapshotSource | null = null;
  private lastFrameTime = performance.now();
  private startedAt = performance.now();
  private disposed = false;
  private initialized = false;
  private lastTouchDistance = 0;
  private lastTouchCenter: { x: number; y: number } | null = null;
  private comparisonWasEnabled = false;
  private comparisonWasLinked = true;

  constructor(
    private readonly container: HTMLElement,
    scannerCanvas: HTMLCanvasElement,
    private readonly onSelect: (selection: SelectionDetails | null) => void,
    private readonly onActiveSlot: (slot: SlotId) => void,
    private readonly onLabSelect: (instanceId: string | null) => void = () => undefined,
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
    this.slots = {
      a: this.createSlotScene(),
      b: this.createSlotScene(),
    };
    this.scanner = new ScannerRenderer(this.renderer, scannerCanvas);
    this.labScene = new LabScene(this.quality);
    this.scanner.clear();

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.resize();
  }

  start(source: SnapshotSource): void {
    this.frameSource = source;
    if (this.animationFrame) return;
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  show(snapshot: ObservationSnapshot): void {
    this.activeMode = 'observation';
    this.snapshot = snapshot;
    this.ensureViews(snapshot);
    if (snapshot.comparison.enabled && !this.comparisonWasEnabled && snapshot.slots.b) {
      this.slots.b.camera.setPose(this.slots.a.camera.getPose());
    } else if (
      snapshot.comparison.enabled &&
      snapshot.comparison.linked &&
      !this.comparisonWasLinked &&
      snapshot.slots.b
    ) {
      const source = snapshot.activeSlot;
      const target: SlotId = source === 'a' ? 'b' : 'a';
      this.slots[target].camera.setPose(this.slots[source].camera.getPose());
    }
    this.comparisonWasEnabled = snapshot.comparison.enabled;
    this.comparisonWasLinked = snapshot.comparison.linked;
    this.applySnapshot(snapshot);
    if (!this.initialized && this.slots.a.view) {
      this.slots.a.camera.frameObject(this.slots.a.view.getRenderRoot());
      this.initialized = true;
    }
    this.renderFrame();
  }

  showLab(snapshot: LabSnapshot): void {
    this.activeMode = 'lab';
    this.labSnapshot = snapshot;
    this.scanner.clear();
    this.renderFrame();
  }

  setQuality(quality: RenderQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.setRendererPixelRatio(quality);
    for (const slot of Object.values(this.slots)) {
      slot.particles.setQuality(quality);
      slot.view?.dispose();
      slot.view = null;
    }
    this.scanner.invalidate();
    this.labScene.setQuality(quality);
    if (this.activeMode === 'lab' && this.labSnapshot) this.showLab(this.labSnapshot);
    else if (this.snapshot) this.show(this.snapshot);
    this.resize();
  }

  frameAll(): void {
    if (this.activeMode === 'lab') {
      this.labScene.frameAll();
      this.renderFrame();
      return;
    }
    if (!this.snapshot) return;
    for (const slotId of this.visibleSlots(this.snapshot)) {
      const slot = this.slots[slotId];
      if (slot.view) slot.camera.frameObject(slot.view.getRenderRoot());
    }
    this.renderFrame();
  }

  applyCameraStep(
    action:
      | 'left'
      | 'right'
      | 'up'
      | 'down'
      | 'pan-left'
      | 'pan-right'
      | 'zoom-in'
      | 'zoom-out',
  ): void {
    if (this.activeMode === 'lab') {
      switch (action) {
        case 'left':
          this.labScene.orbit(-18, 0);
          break;
        case 'right':
          this.labScene.orbit(18, 0);
          break;
        case 'up':
          this.labScene.orbit(0, -18);
          break;
        case 'down':
          this.labScene.orbit(0, 18);
          break;
        case 'pan-left':
          this.labScene.pan(-18, 0);
          break;
        case 'pan-right':
          this.labScene.pan(18, 0);
          break;
        case 'zoom-in':
          this.labScene.dolly(-110);
          break;
        case 'zoom-out':
          this.labScene.dolly(110);
          break;
      }
      this.renderFrame();
      return;
    }
    const snapshot = this.snapshot;
    if (!snapshot) return;
    const slotId = snapshot.activeSlot;
    const camera = this.slots[slotId].camera;
    const physical =
      snapshot.comparison.enabled && snapshot.comparison.scaleMode === 'physical';
    switch (action) {
      case 'left':
        camera.orbit(-18, 0);
        break;
      case 'right':
        camera.orbit(18, 0);
        break;
      case 'up':
        camera.orbit(0, -18);
        break;
      case 'down':
        camera.orbit(0, 18);
        break;
      case 'pan-left':
        camera.pan(-18, 0, physical);
        break;
      case 'pan-right':
        camera.pan(18, 0, physical);
        break;
      case 'zoom-in':
        camera.dolly(-110, physical);
        break;
      case 'zoom-out':
        camera.dolly(110, physical);
        break;
    }
    this.syncLinkedCamera(slotId);
    this.renderFrame();
  }

  getRenderMetrics(): { calls: number; triangles: number; geometries: number } {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
    };
  }

  getComparisonScaleStatus(): {
    readonly physicalAvailable: boolean;
    readonly nmPerPixel: number | null;
  } {
    if (this.activeMode === 'lab')
      return { physicalAvailable: false, nmPerPixel: null };
    const snapshot = this.snapshot;
    if (!snapshot?.comparison.enabled || !snapshot.slots.b) {
      return { physicalAvailable: false, nmPerPixel: null };
    }
    const value = computeNmPerPixel(
      [
        getPhysicalDimensions(snapshot.slots.a.presetId),
        getPhysicalDimensions(snapshot.slots.b.presetId),
      ],
      this.viewports.filter((viewport): viewport is ViewportRect => Boolean(viewport)),
    );
    return { physicalAvailable: value !== null, nmPerPixel: value };
  }

  savePng(filename: string): Promise<boolean> {
    this.renderFrame();
    const snapshot = this.snapshot;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const context = exportCanvas.getContext('2d');
    if ((!snapshot && !this.labSnapshot) || !context) return Promise.resolve(false);
    context.drawImage(this.canvas, 0, 0);
    const scaleX = exportCanvas.width / Math.max(1, this.container.clientWidth);
    const scaleY = exportCanvas.height / Math.max(1, this.container.clientHeight);
    if (this.activeMode === 'lab' && this.labSnapshot)
      this.drawLabExportOverlay(context, this.labSnapshot, scaleX, scaleY);
    else if (snapshot) this.drawExportOverlay(context, snapshot, scaleX, scaleY);
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

  getLabCameraPose(): ManualCameraPose {
    return this.labScene.getCameraPose();
  }

  setLabCameraPose(pose: ManualCameraPose): void {
    this.labScene.setCameraPose(pose);
    this.renderFrame();
  }

  getObservationCameraPoses(): Readonly<Record<SlotId, ManualCameraPose>> {
    return {
      a: this.slots.a.camera.getPose(),
      b: this.slots.b.camera.getPose(),
    };
  }

  setObservationCameraPoses(poses: Readonly<Record<SlotId, ManualCameraPose>>): void {
    this.slots.a.camera.setPose(poses.a);
    this.slots.b.camera.setPose(poses.b);
    this.renderFrame();
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
    const visible = this.visibleSlots(snapshot);
    const viewports = this.viewports.filter((value): value is ViewportRect =>
      Boolean(value),
    );
    visible.forEach((slotId, index) => {
      const viewport = viewports[index]!;
      const specimen = snapshot.slots[slotId]!;
      const dimensions = getPhysicalDimensions(specimen.presetId);
      const physical =
        snapshot.comparison.enabled && snapshot.comparison.scaleMode === 'physical';
      const name = `${slotId.toUpperCase()} · ${getCatalogEntry(specimen.presetId).shortName}${physical && dimensions ? ` · ${formatNm(dimensions.representativeNm)} nm` : ''}`;
      const width = context.measureText(name).width + 24;
      const x = viewport.x + 14;
      const y = viewport.y + 14;
      context.fillStyle = 'rgba(5, 11, 23, 0.82)';
      context.fillRect(x, y, width, 34);
      context.strokeStyle = slotId === snapshot.activeSlot ? '#63eee0' : '#637b91';
      context.strokeRect(x, y, width, 34);
      context.fillStyle = '#f2f7ff';
      context.fillText(name, x + 12, y + 7);
    });
    const physical =
      snapshot.comparison.enabled && snapshot.comparison.scaleMode === 'physical';
    const nmPerPixel = physical
      ? computeNmPerPixel(
          visible.map((slotId) =>
            getPhysicalDimensions(snapshot.slots[slotId]!.presetId),
          ),
          viewports,
        )
      : null;
    const scaleBar = nmPerPixel ? scaleBarForNmPerPixel(nmPerPixel) : null;
    const legend = scaleBar
      ? `${formatNm(scaleBar.nanometers)} nm · 실제 크기 비율`
      : '같은 크기로 맞춤 · 실제 비율 아님';
    context.font = '600 15px system-ui, sans-serif';
    const lineWidth = scaleBar?.pixels ?? 42;
    const legendWidth = context.measureText(legend).width + lineWidth + 36;
    const legendY = this.container.clientHeight - 48;
    context.fillStyle = 'rgba(5, 11, 23, 0.82)';
    context.fillRect(14, legendY, legendWidth, 34);
    context.strokeStyle = '#f2f7ff';
    context.beginPath();
    context.moveTo(26, legendY + 17);
    context.lineTo(26 + lineWidth, legendY + 17);
    context.stroke();
    context.fillStyle = '#b8c7da';
    context.fillText(legend, 34 + lineWidth, legendY + 8);
    context.restore();
  }

  private drawLabExportOverlay(
    context: CanvasRenderingContext2D,
    snapshot: LabSnapshot,
    scaleX: number,
    scaleY: number,
  ): void {
    context.save();
    context.scale(scaleX, scaleY);
    const width = Math.max(240, this.container.clientWidth - 28);
    context.fillStyle = 'rgba(5, 11, 23, 0.84)';
    context.fillRect(14, 14, width, 82);
    context.fillStyle = '#f2f7ff';
    context.font = '700 17px system-ui, sans-serif';
    context.fillText('MICRO LAB · PHYSICS ARENA', 26, 24);
    context.fillStyle = '#b8c7da';
    context.font = '600 14px system-ui, sans-serif';
    const scaleLabel =
      snapshot.config.scaleMode === 'physical'
        ? '실제 대표 nm 비율'
        : '대표 길이 맞춤 · 실제 비율 아님';
    context.fillText(
      `${scaleLabel} · ${snapshot.config.environment.flowPreset} · ${snapshot.simTime.toFixed(2)} sim-s · ${snapshot.status}`,
      26,
      48,
    );
    const names = snapshot.bodies
      .map((body) => getCatalogEntry(body.virusId).shortName)
      .join(' · ');
    context.fillText(fitCanvasText(context, `표본 ${names}`, width - 24), 26, 70);
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
    for (const slot of Object.values(this.slots)) {
      slot.view?.dispose();
      slot.particles.dispose();
    }
    this.labScene.dispose();
    this.scanner.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  private createSlotScene(): SlotScene {
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

  private ensureViews(snapshot: ObservationSnapshot): void {
    this.ensureView('a', snapshot.slots.a);
    if (snapshot.comparison.enabled && snapshot.slots.b)
      this.ensureView('b', snapshot.slots.b);
    else if (this.slots.b.view) {
      this.slots.b.view.dispose();
      this.slots.b.view = null;
    }
  }

  private ensureView(slotId: SlotId, state: SpecimenObservationState): void {
    const slot = this.slots[slotId];
    if (slot.view?.presetId === state.presetId) return;
    slot.view?.dispose();
    slot.view = new SpecimenView(slot.scene, state.presetId, this.quality);
    this.scanner.invalidate();
  }

  private applySnapshot(snapshot: ObservationSnapshot): void {
    const visible = this.visibleSlots(snapshot);
    this.viewports = layoutComparisonViewports(
      Math.max(1, this.container.clientWidth),
      Math.max(1, this.container.clientHeight),
      snapshot.comparison.enabled && Boolean(snapshot.slots.b),
    );
    const viewportList = this.viewports.filter((value): value is ViewportRect =>
      Boolean(value),
    );
    const dimensions = visible.map((slotId) =>
      getPhysicalDimensions(snapshot.slots[slotId]!.presetId),
    );
    const nmPerPixel =
      snapshot.comparison.scaleMode === 'physical'
        ? computeNmPerPixel(dimensions, viewportList)
        : null;
    visible.forEach((slotId, index) => {
      const slot = this.slots[slotId];
      const state = snapshot.slots[slotId]!;
      const viewport = viewportList[index]!;
      slot.camera.setViewport(viewport.width, viewport.height);
      const definition = getCatalogEntry(state.presetId);
      const dimension = getPhysicalDimensions(state.presetId);
      const physical =
        snapshot.comparison.enabled &&
        snapshot.comparison.scaleMode === 'physical' &&
        dimension &&
        nmPerPixel;
      slot.view?.setScale(
        physical
          ? physicalSpecimenScale(
              definition.displayLength,
              dimension,
              WORLD_UNITS_PER_NM,
            )
          : normalizedSpecimenScale(definition.displayLength),
      );
      if (physical)
        slot.camera.setOrthographicWorldPerPixel(nmPerPixel * WORLD_UNITS_PER_NM);
      slot.view?.update(state);
      slot.particles.setState(snapshot.decoration.level, snapshot.decoration.paused);
    });
  }

  private renderFrame(): void {
    if (this.activeMode === 'lab') {
      if (!this.labSnapshot) return;
      this.labScene.show(this.labSnapshot);
      this.labScene.render(
        this.renderer,
        Math.max(1, this.container.clientWidth),
        Math.max(1, this.container.clientHeight),
      );
      return;
    }
    const snapshot = this.snapshot;
    if (!snapshot) return;
    this.ensureViews(snapshot);
    this.applySnapshot(snapshot);
    const visible = this.visibleSlots(snapshot);
    const viewports = this.viewports.filter((value): value is ViewportRect =>
      Boolean(value),
    );
    this.renderer.setRenderTarget(null);
    this.renderer.setScissorTest(true);
    visible.forEach((slotId, index) => {
      const viewport = viewports[index]!;
      const slot = this.slots[slotId];
      const bottom = this.container.clientHeight - viewport.y - viewport.height;
      this.renderer.setViewport(viewport.x, bottom, viewport.width, viewport.height);
      this.renderer.setScissor(viewport.x, bottom, viewport.width, viewport.height);
      this.renderer.setClearColor(
        slotId === snapshot.activeSlot ? 0x081927 : 0x06101c,
        1,
      );
      this.renderer.clear(true, true, true);
      const camera =
        snapshot.comparison.enabled && snapshot.comparison.scaleMode === 'physical'
          ? slot.camera.orthographic
          : slot.camera.perspective;
      this.renderer.render(slot.scene, camera);
    });
    this.renderer.setScissorTest(false);
    this.renderScanner(snapshot);
  }

  private renderScanner(snapshot: ObservationSnapshot): void {
    if (!snapshot.scanner.enabled) {
      this.scanner.clear();
      return;
    }
    const slotId = snapshot.activeSlot;
    const slot = this.slots[slotId];
    const state = snapshot.slots[slotId];
    if (!slot.view || !state) return;
    const probe = snapshot.scanner.probes[slotId];
    const signature = [
      slotId,
      state.presetId,
      state.view,
      state.genomeVisible,
      Object.values(state.layerVisibility).join(''),
      probe.axis,
      probe.position.toFixed(4),
      probe.thickness.toFixed(4),
      slot.view.getRenderRoot().scale.x.toFixed(5),
    ].join(':');
    this.scanner.render(
      slot.scene,
      slot.view,
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
    const wasTransitioning =
      this.snapshot && this.activeMode === 'observation'
        ? this.hasActiveTransition(this.snapshot)
        : false;
    const previousLabTime = this.labSnapshot?.simTime ?? -1;
    if (this.frameSource) {
      const frame = this.frameSource(delta);
      if (frame.mode === 'lab') {
        this.activeMode = 'lab';
        this.labSnapshot = frame.snapshot;
      } else {
        this.activeMode = 'observation';
        this.snapshot = frame.snapshot;
      }
    }
    if (
      this.activeMode === 'lab' &&
      this.labSnapshot &&
      (this.labSnapshot.status === 'running' ||
        this.labSnapshot.simTime !== previousLabTime)
    ) {
      this.renderFrame();
    } else if (this.snapshot) {
      const elapsed = (time - this.startedAt) / 1000;
      const particlesAnimating =
        this.snapshot.decoration.level !== 'off' && !this.snapshot.decoration.paused;
      if (particlesAnimating) {
        for (const slotId of this.visibleSlots(this.snapshot)) {
          this.slots[slotId].particles.update(elapsed);
        }
      }
      if (
        particlesAnimating ||
        wasTransitioning ||
        this.hasActiveTransition(this.snapshot)
      ) {
        this.renderFrame();
      }
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
    this.renderer.setSize(width, height, false);
    if (this.activeMode === 'observation' && this.snapshot)
      this.applySnapshot(this.snapshot);
    this.scanner.invalidate();
    this.renderFrame();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.activeMode === 'lab') {
      this.canvas.setPointerCapture(event.pointerId);
      this.activePointers.set(event.pointerId, {
        id: event.pointerId,
        slot: 'a',
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
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const index = viewportForPoint(
      this.viewports.filter((value): value is ViewportRect => Boolean(value)),
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    const slot: SlotId = index === 1 ? 'b' : 'a';
    if (slot === 'b' && !this.snapshot?.slots.b) return;
    this.onActiveSlot(slot);
    this.canvas.setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, {
      id: event.pointerId,
      slot,
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
        if (this.activeMode === 'lab') {
          this.labScene.pan(
            center.x - this.lastTouchCenter.x,
            center.y - this.lastTouchCenter.y,
          );
          this.labScene.dolly((this.lastTouchDistance - distance) * 3);
        } else {
          const camera = this.slots[gesture.slot].camera;
          camera.pan(
            center.x - this.lastTouchCenter.x,
            center.y - this.lastTouchCenter.y,
            this.isPhysicalComparison(),
          );
          camera.dolly(
            (this.lastTouchDistance - distance) * 3,
            this.isPhysicalComparison(),
          );
          this.syncLinkedCamera(gesture.slot);
        }
      }
      this.lastTouchCenter = center;
      this.lastTouchDistance = distance;
    } else {
      if (this.activeMode === 'lab') {
        if (gesture.mode === 'pan') this.labScene.pan(deltaX, deltaY);
        else this.labScene.orbit(deltaX, deltaY);
      } else {
        const camera = this.slots[gesture.slot].camera;
        if (gesture.mode === 'pan')
          camera.pan(deltaX, deltaY, this.isPhysicalComparison());
        else camera.orbit(deltaX, deltaY);
        this.syncLinkedCamera(gesture.slot);
      }
    }
    this.renderFrame();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const gesture = this.activePointers.get(event.pointerId);
    this.activePointers.delete(event.pointerId);
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
    if (!gesture) return;
    if (!gesture.moved && performance.now() - gesture.startedAt < 560) {
      if (this.activeMode === 'lab')
        this.onLabSelect(
          this.labScene.pick(
            event.clientX,
            event.clientY,
            this.canvas.getBoundingClientRect(),
          ),
        );
      else this.pick(event, gesture.slot);
    }
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
    this.lastTouchDistance = 0;
    this.lastTouchCenter = null;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (this.activeMode === 'lab') {
      this.labScene.dolly(event.deltaY);
      this.renderFrame();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const index = viewportForPoint(
      this.viewports.filter((value): value is ViewportRect => Boolean(value)),
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    const slot: SlotId = index === 1 ? 'b' : 'a';
    if (slot === 'b' && !this.snapshot?.slots.b) return;
    this.onActiveSlot(slot);
    this.slots[slot].camera.dolly(event.deltaY, this.isPhysicalComparison());
    this.syncLinkedCamera(slot);
    this.renderFrame();
  };

  private pick(event: PointerEvent, slotId: SlotId): void {
    const snapshot = this.snapshot;
    const state = snapshot?.slots[slotId];
    const view = this.slots[slotId].view;
    if (!snapshot || !state || !view) return this.onSelect(null);
    const rect = this.canvas.getBoundingClientRect();
    const index = slotId === 'b' ? 1 : 0;
    const viewport = this.viewports[index];
    if (!viewport) return;
    const x = event.clientX - rect.left - viewport.x;
    const y = event.clientY - rect.top - viewport.y;
    this.pointer.set((x / viewport.width) * 2 - 1, -(y / viewport.height) * 2 + 1);
    const camera = this.isPhysicalComparison()
      ? this.slots[slotId].camera.orthographic
      : this.slots[slotId].camera.perspective;
    this.raycaster.setFromCamera(this.pointer, camera);
    const selection = view.pick(
      this.raycaster,
      state.sectionOffset,
      state.view === 'section',
    );
    this.onSelect(selection ? { ...selection, kind: 'part', slot: slotId } : null);
  }

  private syncLinkedCamera(source: SlotId): void {
    const snapshot = this.snapshot;
    if (
      !snapshot?.comparison.enabled ||
      !snapshot.comparison.linked ||
      !snapshot.slots.b
    )
      return;
    const target: SlotId = source === 'a' ? 'b' : 'a';
    this.slots[target].camera.setPose(this.slots[source].camera.getPose());
  }

  private visibleSlots(snapshot: ObservationSnapshot): readonly SlotId[] {
    return snapshot.comparison.enabled && snapshot.slots.b ? ['a', 'b'] : ['a'];
  }

  private isPhysicalComparison(): boolean {
    return Boolean(
      this.snapshot?.comparison.enabled &&
      this.snapshot.comparison.scaleMode === 'physical',
    );
  }

  private hasActiveTransition(snapshot: ObservationSnapshot): boolean {
    return this.visibleSlots(snapshot).some(
      (slotId) => snapshot.slots[slotId]?.transition.mode !== 'none',
    );
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
    if (this.activeMode === 'lab' && this.labSnapshot) this.showLab(this.labSnapshot);
    else if (this.snapshot) this.show(this.snapshot);
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

function formatNm(value: number): string {
  return value >= 100
    ? Math.round(value).toLocaleString('ko-KR')
    : value.toFixed(value < 1 ? 2 : 1).replace(/\.0$/, '');
}

function fitCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  maximumWidth: number,
): string {
  if (context.measureText(value).width <= maximumWidth) return value;
  let result = value;
  while (result.length > 1 && context.measureText(`${result}…`).width > maximumWidth)
    result = result.slice(0, -1);
  return `${result}…`;
}
