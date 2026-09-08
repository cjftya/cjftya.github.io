import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ObservationPartId, ObservationSnapshot } from '../observation/types';
import { CameraRig } from './CameraRig';
import { ObservationView } from './ObservationView';

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
  private readonly root = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly canvas: HTMLCanvasElement;
  private observationView: ObservationView | null = null;
  private snapshot: ObservationSnapshot | null = null;
  private pointerStart: { x: number; y: number; time: number; id: number } | null =
    null;
  private quality: 'high' | 'low' = 'high';

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
    this.setRendererPixelRatio('high');

    this.scene.background = new THREE.Color(0x050b17);
    this.scene.add(this.root);
    this.addLights();
    this.addStars();
    this.camera.position.set(7.4, 4.8, 8.8);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 24;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.cameraRig = new CameraRig(this.camera, this.controls);

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
      if (!rebuild) {
        this.camera.position.copy(cameraPosition);
        this.controls.target.copy(cameraTarget);
      }
    }
    this.observationView.update(snapshot, 1);
    this.renderer.render(this.scene, this.camera);
  }

  update(snapshot: ObservationSnapshot, interpolation: number): void {
    if (this.observationView?.presetId !== snapshot.presetId) this.show(snapshot);
    this.snapshot = snapshot;
    this.observationView?.update(snapshot, interpolation);
    this.renderer.render(this.scene, this.camera);
  }

  setQuality(quality: 'high' | 'low'): void {
    if (this.quality === quality) return;
    this.quality = quality;
    this.setRendererPixelRatio(quality);
    const stars = this.scene.getObjectByName('decorative-stars');
    if (stars) stars.visible = quality === 'high';
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
      this.observationView.update(snapshot, 1);
      this.camera.position.copy(cameraPosition);
      this.controls.target.copy(cameraTarget);
      this.controls.update();
    }
    this.resize();
  }

  resetCamera(): void {
    this.observationView?.frameAll();
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
    this.renderer.render(this.scene, this.camera);
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
    const stars = this.scene.getObjectByName('decorative-stars');
    if (stars instanceof THREE.Points) {
      stars.geometry.dispose();
      if (stars.material instanceof THREE.Material) stars.material.dispose();
    }
    this.renderer.dispose();
    this.canvas.remove();
  }

  private readonly resize = (): void => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
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

  private setRendererPixelRatio(quality: 'high' | 'low'): void {
    const maximum =
      quality === 'low'
        ? 1
        : window.matchMedia('(pointer: coarse)').matches
          ? 1.5
          : 1.8;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maximum));
  }

  private addLights(): void {
    this.scene.add(new THREE.HemisphereLight(0x9fc9ff, 0x07101d, 1.25));
    const key = new THREE.DirectionalLight(0xbff9ff, 4.2);
    key.position.set(6, 8, 7);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x806dff, 25, 20, 2);
    rim.position.set(-6, -2, -5);
    this.scene.add(rim);
    const warm = new THREE.PointLight(0xffbc74, 16, 14, 2);
    warm.position.set(4, -3, 3);
    this.scene.add(warm);
  }

  private addStars(): void {
    const positions = new Float32Array(420 * 3);
    let state = 971;
    const next = (): number => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    };
    for (let index = 0; index < positions.length; index += 3) {
      const radius = 18 + next() * 14;
      const theta = next() * Math.PI * 2;
      const phi = Math.acos(2 * next() - 1);
      positions[index] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index + 1] = radius * Math.cos(phi);
      positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0x89a9d4,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
      }),
    );
    stars.name = 'decorative-stars';
    this.scene.add(stars);
  }
}
