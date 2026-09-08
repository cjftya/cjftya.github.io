import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { StructurePresetId } from '../model/presets';
import type { PhageSnapshot, SimulationSnapshot } from '../model/types';
import type { ObservationPartId, ObservationSnapshot } from '../observation/types';
import { CameraRig } from './CameraRig';
import { ObservationView } from './ObservationView';

export interface SelectionDetails {
  readonly title: string;
  readonly description: string;
  readonly kind: 'part' | 'phage' | 'bacterium';
  readonly phageId?: number;
  readonly partId?: ObservationPartId;
}

type SelectionHandler = (selection: SelectionDetails | null) => void;

const COLORS = {
  capsid: 0x51e1d3,
  genome: 0xb788ff,
  tail: 0x82b6dc,
  bacterium: 0x83c9ef,
  selected: 0xffc66d,
} as const;

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
  private readonly onSelect: SelectionHandler;
  private readonly canvas: HTMLCanvasElement;
  private selectables: THREE.Object3D[] = [];
  private sectionMaterials: THREE.Material[] = [];
  private infectionObjects = new Map<number, THREE.Group>();
  private bacterium: THREE.Mesh | null = null;
  private internalPhages: THREE.Group[] = [];
  private releasedPhages: THREE.Group[] = [];
  private deliveryLine: THREE.Line | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private selectedMaterialState: {
    material: THREE.MeshStandardMaterial;
    emissive: THREE.Color;
  } | null = null;
  private observationView: ObservationView | null = null;
  private observationSnapshot: ObservationSnapshot | null = null;
  private structureSnapshot: ObservationSnapshot | null = null;
  private pointerStart: { x: number; y: number; time: number; id: number } | null =
    null;
  private quality: 'high' | 'low' = 'high';
  private mode: 'observatory' | 'structure' | 'infection' = 'structure';
  private sectionEnabled = true;
  private genomeEnabled = true;

  constructor(container: HTMLElement, onSelect: SelectionHandler) {
    this.onSelect = onSelect;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'virus-canvas';
    this.canvas.setAttribute('aria-label', '바이러스 3D 관찰 화면');
    container.append(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.localClippingEnabled = true;
    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.8,
      ),
    );

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

  showObservatory(snapshot: ObservationSnapshot): void {
    const needsRebuild =
      this.mode !== 'observatory' ||
      this.observationView?.presetId !== snapshot.presetId;
    this.mode = 'observatory';
    this.observationSnapshot = snapshot;
    if (needsRebuild) {
      this.clearRoot();
      this.observationView = new ObservationView(
        this.root,
        this.controls,
        this.cameraRig,
        snapshot.presetId,
        this.quality,
      );
    }
    this.observationView?.update(snapshot, 1);
  }

  updateObservatory(snapshot: ObservationSnapshot, interpolation: number): void {
    if (
      this.mode !== 'observatory' ||
      this.observationView?.presetId !== snapshot.presetId
    ) {
      this.showObservatory(snapshot);
    }
    this.observationSnapshot = snapshot;
    this.observationView?.update(snapshot, interpolation);
    this.renderer.render(this.scene, this.camera);
  }

  showStructure(preset: StructurePresetId): void {
    this.mode = 'structure';
    this.clearRoot();
    this.structureSnapshot = createStaticObservationSnapshot(
      preset,
      this.sectionEnabled,
      this.genomeEnabled,
    );
    this.observationView = new ObservationView(
      this.root,
      this.controls,
      this.cameraRig,
      preset,
      this.quality,
    );
    this.observationView.update(this.structureSnapshot, 1);
  }

  showInfection(snapshot: SimulationSnapshot): void {
    const needsRebuild =
      this.mode !== 'infection' ||
      this.infectionObjects.size !== snapshot.phages.length;
    this.mode = 'infection';
    if (needsRebuild) {
      this.clearRoot();
      this.buildInfectionWorld(snapshot);
      this.resetCamera();
    }
    this.updateInfection(snapshot, 1);
  }

  update(snapshot: SimulationSnapshot | null, interpolation: number): void {
    if (this.mode === 'infection' && snapshot)
      this.updateInfection(snapshot, interpolation);
    if (this.mode === 'structure' && this.structureSnapshot)
      this.observationView?.update(this.structureSnapshot, 1);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  setExplosion(amount: number): void {
    if (this.mode === 'structure' && this.structureSnapshot) {
      this.structureSnapshot = {
        ...this.structureSnapshot,
        view: amount > 0 ? 'exploded' : this.sectionEnabled ? 'section' : 'surface',
        explosion: amount,
      };
      this.observationView?.update(this.structureSnapshot, 1);
      return;
    }
  }

  setSection(enabled: boolean): void {
    this.sectionEnabled = enabled;
    if (this.mode === 'structure' && this.structureSnapshot) {
      this.structureSnapshot = {
        ...this.structureSnapshot,
        view:
          this.structureSnapshot.explosion > 0
            ? 'exploded'
            : enabled
              ? 'section'
              : 'surface',
      };
      this.observationView?.update(this.structureSnapshot, 1);
      return;
    }
    this.applySection();
  }

  setGenomeVisible(enabled: boolean): void {
    this.genomeEnabled = enabled;
    if (this.mode === 'structure' && this.structureSnapshot) {
      this.structureSnapshot = { ...this.structureSnapshot, genomeVisible: enabled };
      this.observationView?.update(this.structureSnapshot, 1);
      return;
    }
    if (this.deliveryLine)
      this.deliveryLine.visible = enabled && this.deliveryLine.visible;
  }

  setQuality(quality: 'high' | 'low'): void {
    this.quality = quality;
    const maximum =
      quality === 'low'
        ? 1
        : window.matchMedia('(pointer: coarse)').matches
          ? 1.5
          : 1.8;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maximum));
    const stars = this.scene.getObjectByName('decorative-stars');
    if (stars) stars.visible = quality === 'high';
    if (this.mode === 'observatory' && this.observationSnapshot) {
      const snapshot = this.observationSnapshot;
      this.clearRoot();
      this.observationView = new ObservationView(
        this.root,
        this.controls,
        this.cameraRig,
        snapshot.presetId,
        quality,
      );
      this.observationView.update(snapshot, 1);
    } else if (this.mode === 'structure' && this.structureSnapshot) {
      const snapshot = this.structureSnapshot;
      this.clearRoot();
      this.observationView = new ObservationView(
        this.root,
        this.controls,
        this.cameraRig,
        snapshot.presetId,
        quality,
      );
      this.observationView.update(snapshot, 1);
    }
    this.resize();
  }

  resetCamera(): void {
    if (this.observationView) {
      this.observationView.frameAll();
      return;
    }
    if (this.mode === 'infection') this.camera.position.set(8.8, 6.2, 10.4);
    else this.camera.position.set(7.2, 4.4, 8.4);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  focusSelection(): void {
    if (this.observationView) {
      this.observationView.focusSelection();
      return;
    }
    if (!this.selectedObject) return;
    const position = new THREE.Vector3();
    this.selectedObject.getWorldPosition(position);
    this.controls.target.copy(position);
    const direction = this.camera.position
      .clone()
      .sub(this.controls.target)
      .normalize();
    this.camera.position.copy(position).addScaledVector(direction, 3.4);
    this.controls.update();
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.resizeObserver.disconnect();
    this.controls.removeEventListener('start', this.handleControlsStart);
    this.cameraRig.dispose();
    this.controls.dispose();
    this.clearRoot();
    const stars = this.scene.getObjectByName('decorative-stars');
    if (stars instanceof THREE.Points) {
      stars.geometry.dispose();
      if (stars.material instanceof THREE.Material) stars.material.dispose();
    }
    this.renderer.dispose();
    this.canvas.remove();
  }

  selectObservationPart(partId: ObservationPartId): void {
    const selection = this.observationView?.selectPart(partId);
    if (!selection) return;
    this.onSelect({
      title: selection.title,
      description: selection.description,
      kind: 'part',
      partId: selection.partId,
    });
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

  private readonly resize = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

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
    const material = new THREE.PointsMaterial({
      color: 0x89a9d4,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
    });
    const stars = new THREE.Points(geometry, material);
    stars.name = 'decorative-stars';
    this.scene.add(stars);
  }

  private buildInfectionWorld(snapshot: SimulationSnapshot): void {
    this.selectables = [];
    this.infectionObjects.clear();
    this.internalPhages = [];
    this.releasedPhages = [];
    this.sectionMaterials = [];

    const bacteriumMaterial = new THREE.MeshPhysicalMaterial({
      color: COLORS.bacterium,
      emissive: 0x123b51,
      transparent: true,
      opacity: 0.28,
      roughness: 0.28,
      metalness: 0.02,
      side: THREE.DoubleSide,
      depthWrite: false,
      clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.05)],
    });
    const bacterium = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.25, 4.7, 10, 20),
      bacteriumMaterial,
    );
    bacterium.rotation.z = Math.PI / 2;
    bacterium.userData.selection = 'bacterium';
    this.bacterium = bacterium;
    this.root.add(bacterium);
    this.selectables.push(bacterium);
    this.sectionMaterials.push(bacteriumMaterial);

    const membrane = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.CapsuleGeometry(1.27, 4.7, 5, 12)),
      new THREE.LineBasicMaterial({
        color: 0xa7e8ff,
        transparent: true,
        opacity: 0.32,
      }),
    );
    membrane.rotation.z = Math.PI / 2;
    this.root.add(membrane);

    const genome = this.createBacterialGenome();
    genome.name = 'bacterial-genome';
    this.root.add(genome);

    const shared = this.createSharedPhageAssets();
    for (const phage of snapshot.phages) {
      const group = this.createSmallPhage(shared, phage.id);
      this.infectionObjects.set(phage.id, group);
      this.root.add(group);
      group.traverse((object) => {
        object.userData.phageId = phage.id;
        if (object instanceof THREE.Mesh) this.selectables.push(object);
      });
    }

    for (let index = 0; index < 14; index += 1) {
      const mini = this.createSmallPhage(shared, 1000 + index);
      mini.scale.setScalar(0.58);
      mini.visible = false;
      const column = index % 5;
      const row = Math.floor(index / 5);
      mini.position.set(
        -1.75 + column * 0.82,
        -0.48 + row * 0.5,
        ((index % 3) - 1) * 0.36,
      );
      mini.rotation.z = ((index * 31) % 90) * (Math.PI / 180);
      this.internalPhages.push(mini);
      this.root.add(mini);

      const released = this.createSmallPhage(shared, 2000 + index);
      released.scale.setScalar(0.72);
      released.visible = false;
      this.releasedPhages.push(released);
      this.root.add(released);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(6), 3),
    );
    this.deliveryLine = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: COLORS.genome,
        transparent: true,
        opacity: 0.95,
      }),
    );
    this.deliveryLine.visible = false;
    this.root.add(this.deliveryLine);
    shared.headMaterial.dispose();
    shared.tailMaterial.dispose();
    this.applySection();
  }

  private createSharedPhageAssets(): {
    head: THREE.BufferGeometry;
    tail: THREE.BufferGeometry;
    headMaterial: THREE.MeshStandardMaterial;
    tailMaterial: THREE.MeshStandardMaterial;
  } {
    return {
      head: new THREE.IcosahedronGeometry(0.2, 1),
      tail: new THREE.CylinderGeometry(0.028, 0.055, 0.32, 6),
      headMaterial: new THREE.MeshStandardMaterial({
        color: COLORS.capsid,
        emissive: 0x0c3c42,
        roughness: 0.36,
      }),
      tailMaterial: new THREE.MeshStandardMaterial({
        color: COLORS.tail,
        roughness: 0.4,
      }),
    };
  }

  private createSmallPhage(
    shared: ReturnType<VirusScene['createSharedPhageAssets']>,
    id: number,
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData.phageId = id;
    const head = new THREE.Mesh(shared.head, shared.headMaterial.clone());
    head.position.y = 0.2;
    head.userData.role = 'head';
    const tail = new THREE.Mesh(shared.tail, shared.tailMaterial.clone());
    tail.position.y = -0.06;
    tail.userData.role = 'tail';
    group.add(head, tail);
    group.rotation.set(
      ((id * 17) % 80) / 100,
      ((id * 37) % 120) / 100,
      ((id * 11) % 60) / 100,
    );
    return group;
  }

  private updateInfection(snapshot: SimulationSnapshot, interpolation: number): void {
    for (const phage of snapshot.phages) {
      const group = this.infectionObjects.get(phage.id);
      if (!group) continue;
      group.position.set(
        THREE.MathUtils.lerp(phage.previousPosition.x, phage.position.x, interpolation),
        THREE.MathUtils.lerp(phage.previousPosition.y, phage.position.y, interpolation),
        THREE.MathUtils.lerp(phage.previousPosition.z, phage.position.z, interpolation),
      );
      this.updatePhageAppearance(group, phage);
    }

    const completed = snapshot.bacterium.completedPhages;
    this.internalPhages.forEach((group, index) => {
      group.visible = index < completed && snapshot.bacterium.phase !== 'lysed';
    });

    const released = snapshot.bacterium.releasedPhages;
    this.releasedPhages.forEach((group, index) => {
      group.visible = index < released;
      if (!group.visible) return;
      const direction = fibonacciDirection(index, Math.max(1, released));
      const radius = 3.4 + ((index * 7) % 5) * 0.34;
      group.position.copy(direction).multiplyScalar(radius);
      group.rotation.y += 0.002;
    });

    if (this.bacterium) {
      const material = this.bacterium.material;
      if (material instanceof THREE.MeshPhysicalMaterial) {
        if (snapshot.bacterium.phase === 'lysing') {
          this.bacterium.scale.setScalar(
            1 + Math.min(0.12, snapshot.bacterium.phaseElapsed * 0.075),
          );
          material.emissive.setHex(0x63343e);
        } else if (snapshot.bacterium.phase === 'lysed') {
          this.bacterium.scale.setScalar(1.13);
          material.opacity = 0.08;
        } else {
          this.bacterium.scale.setScalar(1);
          material.emissive.setHex(0x123b51);
          material.opacity = this.sectionEnabled ? 0.2 : 0.34;
        }
      }
    }

    const delivering = snapshot.phages.find((phage) => phage.phase === 'delivering');
    this.updateDeliveryLine(delivering ?? null);
    const bacterialGenome = this.root.getObjectByName('bacterial-genome');
    if (bacterialGenome) bacterialGenome.visible = this.genomeEnabled;
  }

  private updatePhageAppearance(group: THREE.Group, phage: PhageSnapshot): void {
    const head = group.children.find((child) => child.userData.role === 'head');
    if (head instanceof THREE.Mesh) {
      head.scale.setScalar(phage.phase === 'spent' ? 0.88 : 1);
    }
    group.visible = true;
    if (phage.contactPoint) {
      const normal = new THREE.Vector3(
        phage.position.x - phage.contactPoint.x,
        phage.position.y - phage.contactPoint.y,
        phage.position.z - phage.contactPoint.z,
      ).normalize();
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    }
    group.scale.setScalar(
      phage.phase === 'contacting' ? 1.16 : phage.phase === 'attached' ? 1.1 : 1,
    );
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material;
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      if (object.userData.role === 'head') {
        material.color.setHex(phage.phase === 'spent' ? 0x7897a6 : COLORS.capsid);
        material.opacity = phage.phase === 'spent' ? 0.42 : 1;
        material.transparent = phage.phase === 'spent';
      }
    });
  }

  private updateDeliveryLine(phage: PhageSnapshot | null): void {
    if (!this.deliveryLine) return;
    this.deliveryLine.visible = Boolean(
      phage && phage.contactPoint && this.genomeEnabled,
    );
    if (!phage?.contactPoint) return;
    const positions = this.deliveryLine.geometry.getAttribute('position');
    const point = phage.contactPoint;
    positions.setXYZ(0, point.x, point.y, point.z);
    positions.setXYZ(
      1,
      THREE.MathUtils.lerp(point.x, 0, phage.deliveryProgress * 0.78),
      THREE.MathUtils.lerp(point.y, 0, phage.deliveryProgress * 0.78),
      THREE.MathUtils.lerp(point.z, 0, phage.deliveryProgress * 0.78),
    );
    positions.needsUpdate = true;
  }

  private createBacterialGenome(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: COLORS.genome,
      transparent: true,
      opacity: 0.46,
    });
    for (let strand = 0; strand < 3; strand += 1) {
      const points: THREE.Vector3[] = [];
      for (let index = 0; index <= 42; index += 1) {
        const t = index / 42;
        points.push(
          new THREE.Vector3(
            (t - 0.5) * 3.9,
            Math.sin(t * Math.PI * (5 + strand)) * (0.32 + strand * 0.1),
            Math.cos(t * Math.PI * (4 + strand)) * 0.28,
          ),
        );
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }
    return group;
  }

  private applySection(): void {
    for (const material of this.sectionMaterials) {
      if ('clippingPlanes' in material) {
        material.clippingPlanes = this.sectionEnabled
          ? [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.04)]
          : [];
        material.needsUpdate = true;
      }
      if ('opacity' in material && this.mode === 'infection') {
        material.opacity = this.sectionEnabled ? 0.2 : 0.34;
      }
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.mode === 'observatory' && this.observationSnapshot?.demo.kind !== 'none') {
      this.canvas.dispatchEvent(
        new CustomEvent('virus-observation-interaction', { bubbles: true }),
      );
    }
    this.pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      id: event.pointerId,
    };
  };

  private readonly handleControlsStart = (): void => {
    if (this.mode !== 'observatory' || this.observationSnapshot?.demo.kind === 'none')
      return;
    this.canvas.dispatchEvent(
      new CustomEvent('virus-observation-interaction', { bubbles: true }),
    );
  };

  private readonly handlePointerCancel = (): void => {
    this.pointerStart = null;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const start = this.pointerStart;
    this.pointerStart = null;
    if (!start || start.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > 7 || performance.now() - start.time > 650) return;

    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.observationView) {
      const selection = this.observationView.pick(this.raycaster);
      this.onSelect(
        selection
          ? {
              title: selection.title,
              description: selection.description,
              kind: 'part',
              partId: selection.partId,
            }
          : null,
      );
      return;
    }
    const hit = this.raycaster.intersectObjects(this.selectables, true)[0];
    this.clearSelectionHighlight();
    if (!hit) {
      this.selectedObject = null;
      this.onSelect(null);
      return;
    }

    const target = findSelectionTarget(hit.object);
    this.selectedObject = target;
    this.highlight(target);
    const phageId = target.userData.phageId as number | undefined;
    if (phageId !== undefined) {
      this.onSelect({
        title: `파지 #${phageId}`,
        description: '계산 코어의 개체 상태와 3D 표현이 같은 ID로 연결되어 있어요.',
        kind: 'phage',
        phageId,
      });
      return;
    }
    if (target.userData.selection === 'bacterium') {
      this.onSelect({
        title: '모형 세균',
        description: '수학적 capsule 표면과 내부 생산 상태를 가진 단일 숙주예요.',
        kind: 'bacterium',
      });
    }
  };

  private highlight(object: THREE.Object3D): void {
    let candidate: THREE.Object3D | null = object;
    while (candidate) {
      if (
        candidate instanceof THREE.Mesh &&
        candidate.material instanceof THREE.MeshStandardMaterial
      ) {
        this.selectedMaterialState = {
          material: candidate.material,
          emissive: candidate.material.emissive.clone(),
        };
        candidate.material.emissive.setHex(COLORS.selected);
        candidate.material.emissiveIntensity = 0.34;
        break;
      }
      candidate = candidate.children[0] ?? null;
    }
  }

  private clearSelectionHighlight(): void {
    if (!this.selectedMaterialState) return;
    this.selectedMaterialState.material.emissive.copy(
      this.selectedMaterialState.emissive,
    );
    this.selectedMaterialState.material.emissiveIntensity = 1;
    this.selectedMaterialState = null;
  }

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.canvas.dispatchEvent(
      new CustomEvent('virus-context-status', { detail: 'lost', bubbles: true }),
    );
  };

  private readonly handleContextRestored = (): void => {
    this.canvas.dispatchEvent(
      new CustomEvent('virus-context-status', { detail: 'restored', bubbles: true }),
    );
  };

  private clearRoot(): void {
    this.observationView?.dispose();
    this.observationView = null;
    this.clearSelectionHighlight();
    this.selectedObject = null;
    this.onSelect(null);
    const disposedGeometries = new Set<THREE.BufferGeometry>();
    const disposedMaterials = new Set<THREE.Material>();
    for (const child of [...this.root.children]) {
      child.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineSegments
        ) {
          if (!disposedGeometries.has(object.geometry)) {
            object.geometry.dispose();
            disposedGeometries.add(object.geometry);
          }
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const material of materials) {
            if (!disposedMaterials.has(material)) {
              material.dispose();
              disposedMaterials.add(material);
            }
          }
        }
      });
      this.root.remove(child);
    }
    this.selectables = [];
    this.sectionMaterials = [];
    this.infectionObjects.clear();
    this.bacterium = null;
    this.internalPhages = [];
    this.releasedPhages = [];
    this.deliveryLine = null;
  }
}

function findSelectionTarget(object: THREE.Object3D): THREE.Object3D {
  let candidate: THREE.Object3D | null = object;
  while (candidate) {
    if (
      candidate.userData.partId ||
      candidate.userData.phageId !== undefined ||
      candidate.userData.selection
    ) {
      return candidate;
    }
    candidate = candidate.parent;
  }
  return object;
}

function fibonacciDirection(index: number, total: number): THREE.Vector3 {
  const safeTotal = Math.max(1, total);
  const y = 1 - ((index + 0.5) / safeTotal) * 2;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = Math.PI * (3 - Math.sqrt(5)) * index;
  return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
}

function createStaticObservationSnapshot(
  presetId: StructurePresetId,
  sectionEnabled: boolean,
  genomeVisible: boolean,
): ObservationSnapshot {
  const position = { x: 0, y: 0, z: 0 } as const;
  const quaternion = { x: 0, y: 0, z: 0, w: 1 } as const;
  return {
    presetId,
    view: sectionEnabled ? 'section' : 'surface',
    selectedPartId: null,
    running: false,
    speed: 1,
    translationEnabled: false,
    rotationEnabled: false,
    followTarget: true,
    explosion: 0,
    sectionOffset: 0,
    genomeVisible,
    layerVisibility: { envelope: true, capsid: true, genome: true },
    demo: { kind: 'none', progress: 0, playing: false },
    motion: {
      position,
      previousPosition: position,
      quaternion,
      previousQuaternion: quaternion,
      seed: 1,
      tick: 0,
    },
    tick: 0,
    seed: 1,
  };
}
