import { isVirusId } from './catalog/registry';
import { LabSession, createDefaultLabConfig } from './lab/LabSession';
import { loadLabConfigWithStatus, saveLabConfig } from './lab/persistence';
import type { LabCommandProperty } from './lab/types';
import { OBSERVATION_PARTS } from './model/observationPresets';
import { ObservationStore } from './observation/ObservationStore';
import type {
  ObservationPartId,
  ObservationSnapshot,
  SlotId,
} from './observation/types';
import {
  SceneRenderer,
  type SceneFrameSnapshot,
  type SelectionDetails,
} from './rendering/SceneRenderer';
import type { ManualCameraPose } from './rendering/ManualCamera';
import { LabPanel } from './ui/LabPanel';
import { bindVirusSimControls, type VirusSimControlActions } from './ui/bindings';
import { bindLabControls, type LabControlActions } from './ui/labBindings';
import { renderAppLayout, requiredElement } from './ui/layout';
import { VirusSimPanel } from './ui/VirusSimPanel';
import { WorkspaceStore, type WorkspaceMode } from './workspace/WorkspaceStore';

const UI_UPDATE_INTERVAL = 120;

export class VirusSimApp {
  private readonly scene: SceneRenderer;
  private readonly observation: ObservationStore;
  private readonly lab: LabSession;
  private readonly workspace = new WorkspaceStore();
  private readonly panel: VirusSimPanel;
  private readonly labPanel: LabPanel;
  private readonly unbindControls: readonly (() => void)[];
  private inspectionObservation: ObservationSnapshot | null = null;
  private inspectionCameras: Readonly<Record<SlotId, ManualCameraPose>> | null = null;
  private disposed = false;
  private lastUiTime = 0;

  constructor(private readonly root: HTMLElement) {
    renderAppLayout(root);
    this.panel = new VirusSimPanel(root, window.localStorage);
    this.labPanel = new LabPanel(root);
    this.panel.applySavedFontScale();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialId = this.panel.getInitialId();
    this.observation = new ObservationStore(reducedMotion, initialId);
    const preferences = this.panel.getDisplayPreferences(reducedMotion);
    this.observation.setDecorationLevel(preferences.decorationLevel);
    this.observation.setDecorationPaused(preferences.decorationPaused);
    const storedLabConfig = loadLabConfigWithStatus(window.localStorage);
    this.lab = new LabSession(storedLabConfig.config ?? createDefaultLabConfig());
    if (storedLabConfig.error) this.lab.setMessage(storedLabConfig.error);

    this.scene = new SceneRenderer(
      requiredElement<HTMLElement>(root, '#viewport'),
      requiredElement<HTMLCanvasElement>(root, '#scanner-canvas'),
      (selection) => this.handleSceneSelection(selection),
      (slot) => this.activateSlot(slot),
      (instanceId) => this.handleLabSelection(instanceId),
    );
    this.unbindControls = [
      bindVirusSimControls(root, this.createObservationActions()),
      bindLabControls(root, this.createLabActions()),
    ];

    this.panel.recordRecent(initialId);
    this.panel.clearSelection();
    this.refreshWorkspace(true);
    this.scene.start((delta) => this.advanceFrame(delta));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unbind of this.unbindControls) unbind();
    this.scene.dispose();
    this.root.replaceChildren();
  }

  private createObservationActions(): VirusSimControlActions {
    return {
      catalogSearch: () => this.panel.updateCatalogFilter(),
      catalogFilter: (value) => this.panel.setCatalogFilter(value),
      catalogCollection: (value) => this.panel.setCollection(value),
      activateVirus: (id) => this.activateVirus(id),
      toggleFavorite: () =>
        this.panel.toggleFavorite(this.observation.getActiveSpecimen().presetId),
      nextDiscovery: () => {
        const current = this.observation.getActiveSpecimen().presetId;
        this.activateVirus(this.panel.getNextDiscoveryId(current));
      },
      saveImage: () => this.saveObservationImage(),
      setView: (view) => this.updateObservation(() => this.observation.setView(view)),
      setExplosion: (value) =>
        this.updateObservation(() => this.observation.setExplosion(value)),
      setSectionOffset: (value) =>
        this.updateObservation(() => this.observation.setSectionOffset(value)),
      setGenomeVisible: (visible) =>
        this.updateObservation(() => this.observation.setGenomeVisible(visible)),
      setLayerVisible: (layer, visible) =>
        this.updateObservation(() => this.observation.setLayerVisible(layer, visible)),
      selectPart: (part) => this.selectPart(part),
      structuralReveal: (mode) =>
        this.updateObservation(() => this.observation.startStructuralReveal(mode)),
      reassemble: () => this.updateObservation(() => this.observation.reassemble()),
      addComparison: (id) => {
        if (!isVirusId(id)) return;
        this.updateObservation(() => this.observation.addComparison(id), true);
      },
      swapComparison: () =>
        this.updateObservation(() => this.observation.swapComparison(), true),
      closeComparison: () => {
        this.observation.closeComparison();
        this.showStoredSelection();
        this.refreshWorkspace(true);
      },
      setComparisonLinked: (linked) =>
        this.updateObservation(() => this.observation.setComparisonLinked(linked)),
      setComparisonScale: (mode) =>
        this.updateObservation(() => this.observation.setComparisonScaleMode(mode)),
      setScannerEnabled: (enabled) =>
        this.updateObservation(() => this.observation.setScannerEnabled(enabled)),
      setScannerAxis: (axis) =>
        this.updateObservation(() => this.observation.setScannerAxis(axis)),
      setScannerPosition: (position) =>
        this.updateObservation(() => this.observation.setScannerPosition(position)),
      setScannerThickness: (thickness) =>
        this.updateObservation(() => this.observation.setScannerThickness(thickness)),
      setScannerLinked: (linked) =>
        this.updateObservation(() => this.observation.setScannerLinked(linked)),
      setVariant: (slot, id) =>
        this.updateObservation(() => this.observation.setVariant(id, slot)),
      selectChangePart: (part) => this.selectChangePart(part),
      setDecorationLevel: (level) => {
        this.observation.setDecorationLevel(level);
        this.panel.persistDecoration(this.observation.getSnapshot().decoration);
        this.refreshWorkspace();
      },
      setDecorationPaused: (paused) => {
        this.observation.setDecorationPaused(paused);
        this.panel.persistDecoration(this.observation.getSnapshot().decoration);
        this.refreshWorkspace();
      },
      setQuality: (quality) => this.scene.setQuality(quality),
      setFontScale: (scale) => this.panel.persistFontScale(scale),
      resetCamera: () => this.scene.frameAll(),
      cameraStep: (step) => this.scene.applyCameraStep(step),
    };
  }

  private createLabActions(): LabControlActions {
    const environment = (property: LabCommandProperty, value: number | boolean) => {
      this.lab.setEnvironment(property, value);
      this.refreshLab();
    };
    return {
      setMode: (mode) => this.setMode(mode),
      setTab: (tab) => {
        this.workspace.setTab(tab);
        this.panel.syncWorkspace(this.workspace.getSnapshot());
      },
      play: () => {
        this.lab.play();
        this.refreshLab();
      },
      pause: () => {
        this.lab.pause();
        this.refreshLab();
      },
      restart: () => {
        this.lab.restartCurrent();
        this.refreshLab();
      },
      replay: () => {
        this.lab.replayLastRun();
        this.refreshLab();
      },
      setTimeScale: (value) => {
        this.lab.setTimeScale(value);
        this.refreshLab();
      },
      setEnvironment: environment,
      setFlowPreset: (value) => {
        this.lab.setFlowPreset(value);
        this.refreshLab();
      },
      setChamber: (value) => {
        this.lab.setChamber(value);
        this.refreshLab();
      },
      setScaleMode: (value) => {
        this.lab.setScaleMode(value);
        this.refreshLab();
      },
      setDuration: (value) => {
        this.lab.setDuration(value);
        this.refreshLab();
      },
      selectInstance: (id) => this.handleLabSelection(id),
      addSpecimen: (id) => {
        this.lab.addSpecimen(id);
        this.refreshLab();
      },
      replaceSpecimen: (id) => {
        this.lab.replaceSelected(id);
        this.refreshLab();
      },
      removeSpecimen: () => {
        this.lab.removeSelected();
        this.refreshLab();
      },
      swapPositions: () => {
        this.lab.swapStartingPositions();
        this.refreshLab();
      },
      setAllTrajectories: (value) => {
        this.lab.setShowAllTrajectories(value);
        this.refreshLab();
      },
      inspectStructure: () => this.inspectLabSpecimen(),
      returnToLab: () => this.returnToLab(),
      saveConfig: () => {
        try {
          saveLabConfig(window.localStorage, this.lab.getConfig());
          this.lab.setMessage('현재 실험 설정을 브라우저의 단일 슬롯에 저장했어요.');
        } catch {
          this.lab.setMessage(
            '브라우저 저장소에 접근할 수 없어 설정을 저장하지 못했어요.',
          );
        }
        this.refreshLab();
      },
      loadConfig: () => {
        const stored = loadLabConfigWithStatus(window.localStorage);
        if (stored.config) {
          try {
            this.lab.replaceConfig(stored.config);
            this.lab.setMessage('저장한 실험 설정을 불러왔어요.');
          } catch (error) {
            this.lab.setMessage(
              error instanceof Error
                ? `저장 설정을 적용할 수 없어요: ${error.message}`
                : '저장 설정을 적용할 수 없어요.',
            );
          }
        } else
          this.lab.setMessage(stored.error ?? '불러올 수 있는 저장 설정이 없어요.');
        this.refreshLab();
      },
      saveImage: () => this.saveLabImage(),
      contextLost: () => {
        this.lab.pause('화면 또는 3D 컨텍스트가 중단되어 실험을 정지했어요.');
        this.refreshLab();
      },
    };
  }

  private advanceFrame(delta: number): SceneFrameSnapshot {
    const workspace = this.workspace.getSnapshot();
    const now = performance.now();
    if (workspace.mode === 'lab') {
      this.lab.advance(delta);
      const snapshot = this.lab.getSnapshot();
      if (now - this.lastUiTime >= UI_UPDATE_INTERVAL) {
        this.lastUiTime = now;
        this.labPanel.sync(snapshot);
      }
      return { mode: 'lab', snapshot };
    }
    this.observation.step(delta);
    const snapshot = this.observation.getSnapshot();
    if (now - this.lastUiTime >= UI_UPDATE_INTERVAL) {
      this.lastUiTime = now;
      this.syncObservationUi(snapshot);
    }
    return { mode: 'observation', snapshot };
  }

  private setMode(mode: WorkspaceMode): void {
    const workspace = this.workspace.getSnapshot();
    if (workspace.inspectingLabSpecimen) {
      if (mode === 'lab') this.returnToLab();
      return;
    }
    if (mode === 'observation') this.lab.pause();
    this.workspace.setMode(mode);
    this.refreshWorkspace(true);
  }

  private inspectLabSpecimen(): void {
    const virusId = this.lab.getSelectedVirusId();
    if (!virusId) return;
    this.inspectionObservation = this.observation.getSnapshot();
    this.inspectionCameras = this.scene.getObservationCameraPoses();
    this.lab.enterInspection();
    this.workspace.enterLabInspection();
    this.workspace.setTab('structure');
    if (this.observation.getSnapshot().scanner.enabled)
      this.observation.setScannerEnabled(false);
    this.observation.closeComparison();
    this.observation.setPreset(virusId, 'a');
    this.observation.setView('surface');
    this.panel.recordRecent(virusId);
    this.panel.clearSelection();
    this.refreshWorkspace(true);
    this.scene.frameAll();
  }

  private returnToLab(): void {
    if (this.inspectionObservation)
      this.observation.replaceSnapshot(this.inspectionObservation);
    this.lab.leaveInspection();
    this.workspace.leaveLabInspection();
    this.refreshWorkspace(true);
    if (this.inspectionCameras)
      this.scene.setObservationCameraPoses(this.inspectionCameras);
    this.inspectionObservation = null;
    this.inspectionCameras = null;
  }

  private activateVirus(id: string): void {
    if (!isVirusId(id)) return;
    this.observation.setPreset(id);
    this.panel.recordRecent(id);
    this.showStoredSelection();
    this.refreshWorkspace(true);
  }

  private activateSlot(slot: SlotId): void {
    if (this.workspace.getSnapshot().mode !== 'observation') return;
    this.observation.setActiveSlot(slot);
    this.showStoredSelection();
    this.refreshWorkspace(true);
  }

  private handleLabSelection(instanceId: string | null): void {
    this.lab.selectInstance(instanceId);
    this.refreshLab();
  }

  private selectPart(partId: ObservationPartId): void {
    this.observation.selectPart(partId);
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(part.name, `${part.detail} ${part.summary}`);
    this.refreshWorkspace();
  }

  private selectChangePart(partId: ObservationPartId): void {
    this.observation.selectPart(partId, 'a');
    if (this.observation.getSnapshot().slots.b)
      this.observation.selectPart(partId, 'b');
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(
      `A/B · ${part.name}`,
      `${part.detail} 비교 표본의 근거 연결 영역이며 카메라는 이동하지 않아요.`,
    );
    this.refreshWorkspace();
  }

  private handleSceneSelection(selection: SelectionDetails | null): void {
    if (this.workspace.getSnapshot().mode !== 'observation') return;
    if (!selection) {
      this.observation.selectPart(null);
      this.panel.clearSelection();
      this.refreshWorkspace();
      return;
    }
    this.observation.setActiveSlot(selection.slot);
    this.observation.selectPart(selection.partId, selection.slot);
    const part = OBSERVATION_PARTS[selection.partId];
    this.panel.showSelection(
      `${selection.slot.toUpperCase()} · ${selection.title}`,
      `${selection.description} ${part.summary}`,
    );
    this.refreshWorkspace(true);
  }

  private showStoredSelection(): void {
    const specimen = this.observation.getActiveSpecimen();
    const partId = specimen.selectedPartId;
    if (!partId) {
      this.panel.clearSelection();
      return;
    }
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(part.name, `${part.detail} ${part.summary}`);
  }

  private saveObservationImage(): Promise<boolean> {
    const id = this.observation.getActiveSpecimen().presetId;
    return this.scene.savePng(
      `virus-sim-${id}-${new Date().toISOString().slice(0, 10)}.png`,
    );
  }

  private saveLabImage(): Promise<boolean> {
    return this.scene.savePng(
      `virus-sim-arena-${new Date().toISOString().slice(0, 10)}.png`,
    );
  }

  private updateObservation(action: () => void, full = false): void {
    action();
    this.refreshWorkspace(full);
  }

  private refreshLab(): void {
    if (this.workspace.getSnapshot().mode !== 'lab') return;
    const snapshot = this.lab.getSnapshot();
    this.scene.showLab(snapshot);
    this.labPanel.sync(snapshot);
    this.panel.syncWorkspace(this.workspace.getSnapshot());
  }

  private refreshWorkspace(full = false): void {
    const workspace = this.workspace.getSnapshot();
    if (workspace.mode === 'lab') {
      const lab = this.lab.getSnapshot();
      this.scene.showLab(lab);
      this.labPanel.sync(lab);
    } else {
      const observation = this.observation.getSnapshot();
      this.scene.show(observation);
      if (full) this.syncAll(observation);
      else this.syncObservationUi(observation);
    }
    this.panel.syncWorkspace(workspace);
  }

  private syncAll(snapshot: ObservationSnapshot): void {
    this.panel.syncAll(
      snapshot,
      this.scene.getComparisonScaleStatus(),
      this.scene.getRenderMetrics(),
    );
  }

  private syncObservationUi(snapshot: ObservationSnapshot): void {
    this.panel.syncObservationUi(
      snapshot,
      this.scene.getComparisonScaleStatus(),
      this.scene.getRenderMetrics(),
    );
  }
}
