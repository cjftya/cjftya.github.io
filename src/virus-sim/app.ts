import { isVirusId } from './catalog/registry';
import { OBSERVATION_PARTS } from './model/observationPresets';
import { ObservationStore } from './observation/ObservationStore';
import type {
  ObservationPartId,
  ObservationSnapshot,
  SlotId,
} from './observation/types';
import { SceneRenderer, type SelectionDetails } from './rendering/SceneRenderer';
import { bindVirusSimControls, type VirusSimControlActions } from './ui/bindings';
import { renderAppLayout, requiredElement } from './ui/layout';
import { VirusSimPanel } from './ui/VirusSimPanel';

const UI_UPDATE_INTERVAL = 120;

export class VirusSimApp {
  private readonly scene: SceneRenderer;
  private readonly observation: ObservationStore;
  private readonly panel: VirusSimPanel;
  private readonly unbindControls: () => void;
  private disposed = false;
  private lastUiTime = 0;

  constructor(private readonly root: HTMLElement) {
    renderAppLayout(root);
    this.panel = new VirusSimPanel(root, window.localStorage);
    this.panel.applySavedFontScale();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initialId = this.panel.getInitialId();
    this.observation = new ObservationStore(reducedMotion, initialId);
    const preferences = this.panel.getDisplayPreferences(reducedMotion);
    this.observation.setDecorationLevel(preferences.decorationLevel);
    this.observation.setDecorationPaused(preferences.decorationPaused);

    this.scene = new SceneRenderer(
      requiredElement<HTMLElement>(root, '#viewport'),
      requiredElement<HTMLCanvasElement>(root, '#scanner-canvas'),
      (selection) => this.handleSceneSelection(selection),
      (slot) => this.activateSlot(slot),
    );
    this.unbindControls = bindVirusSimControls(root, this.createControlActions());

    this.panel.recordRecent(initialId);
    const snapshot = this.observation.getSnapshot();
    this.scene.show(snapshot);
    this.syncAll(snapshot);
    this.panel.clearSelection();
    this.scene.start((delta) => this.advanceFrame(delta));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unbindControls();
    this.scene.dispose();
    this.root.replaceChildren();
  }

  private createControlActions(): VirusSimControlActions {
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
      saveImage: () => this.saveImage(),
      setView: (view) => this.update(() => this.observation.setView(view)),
      setExplosion: (value) => this.update(() => this.observation.setExplosion(value)),
      setSectionOffset: (value) =>
        this.update(() => this.observation.setSectionOffset(value)),
      setGenomeVisible: (visible) =>
        this.update(() => this.observation.setGenomeVisible(visible)),
      setLayerVisible: (layer, visible) =>
        this.update(() => this.observation.setLayerVisible(layer, visible)),
      selectPart: (part) => this.selectPart(part),
      structuralReveal: (mode) =>
        this.update(() => this.observation.startStructuralReveal(mode)),
      reassemble: () => this.update(() => this.observation.reassemble()),
      addComparison: (id) => {
        if (!isVirusId(id)) return;
        this.update(() => this.observation.addComparison(id), true);
      },
      swapComparison: () => this.update(() => this.observation.swapComparison(), true),
      closeComparison: () => {
        this.observation.closeComparison();
        this.showStoredSelection();
        this.refresh(true);
      },
      setComparisonLinked: (linked) =>
        this.update(() => this.observation.setComparisonLinked(linked)),
      setComparisonScale: (mode) =>
        this.update(() => this.observation.setComparisonScaleMode(mode)),
      setScannerEnabled: (enabled) =>
        this.update(() => this.observation.setScannerEnabled(enabled)),
      setScannerAxis: (axis) =>
        this.update(() => this.observation.setScannerAxis(axis)),
      setScannerPosition: (position) =>
        this.update(() => this.observation.setScannerPosition(position)),
      setScannerThickness: (thickness) =>
        this.update(() => this.observation.setScannerThickness(thickness)),
      setScannerLinked: (linked) =>
        this.update(() => this.observation.setScannerLinked(linked)),
      setVariant: (slot, id) =>
        this.update(() => this.observation.setVariant(id, slot)),
      selectChangePart: (part) => this.selectChangePart(part),
      setDecorationLevel: (level) => {
        this.observation.setDecorationLevel(level);
        this.persistDecorationAndRefresh();
      },
      setDecorationPaused: (paused) => {
        this.observation.setDecorationPaused(paused);
        this.persistDecorationAndRefresh();
      },
      setQuality: (quality) => this.scene.setQuality(quality),
      setFontScale: (scale) => this.panel.persistFontScale(scale),
      resetCamera: () => this.scene.frameAll(),
      cameraStep: (step) => this.scene.applyCameraStep(step),
    };
  }

  private advanceFrame(delta: number): ObservationSnapshot {
    this.observation.step(delta);
    const snapshot = this.observation.getSnapshot();
    const now = performance.now();
    if (now - this.lastUiTime >= UI_UPDATE_INTERVAL) {
      this.lastUiTime = now;
      this.syncObservationUi(snapshot);
    }
    return snapshot;
  }

  private activateVirus(id: string): void {
    if (!isVirusId(id)) return;
    this.observation.setPreset(id);
    this.panel.recordRecent(id);
    this.showStoredSelection();
    this.refresh(true);
  }

  private activateSlot(slot: SlotId): void {
    this.observation.setActiveSlot(slot);
    this.showStoredSelection();
    this.refresh(true);
  }

  private selectPart(partId: ObservationPartId): void {
    this.observation.selectPart(partId);
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(part.name, `${part.detail} ${part.summary}`);
    this.refresh();
  }

  private selectChangePart(partId: ObservationPartId): void {
    this.observation.selectPart(partId, 'a');
    if (this.observation.getSnapshot().slots.b) {
      this.observation.selectPart(partId, 'b');
    }
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(
      `A/B · ${part.name}`,
      `${part.detail} 비교 표본의 근거 연결 영역이며 카메라는 이동하지 않아요.`,
    );
    this.refresh();
  }

  private handleSceneSelection(selection: SelectionDetails | null): void {
    if (!selection) {
      this.observation.selectPart(null);
      this.panel.clearSelection();
      this.refresh();
      return;
    }
    this.observation.setActiveSlot(selection.slot);
    this.observation.selectPart(selection.partId, selection.slot);
    const part = OBSERVATION_PARTS[selection.partId];
    this.panel.showSelection(
      `${selection.slot.toUpperCase()} · ${selection.title}`,
      `${selection.description} ${part.summary}`,
    );
    this.refresh(true);
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

  private persistDecorationAndRefresh(): void {
    this.panel.persistDecoration(this.observation.getSnapshot().decoration);
    this.refresh();
  }

  private saveImage(): Promise<boolean> {
    const id = this.observation.getActiveSpecimen().presetId;
    return this.scene.savePng(
      `virus-sim-${id}-${new Date().toISOString().slice(0, 10)}.png`,
    );
  }

  private update(action: () => void, full = false): void {
    action();
    this.refresh(full);
  }

  private refresh(full = false): void {
    const snapshot = this.observation.getSnapshot();
    this.scene.show(snapshot);
    if (full) this.syncAll(snapshot);
    else this.syncObservationUi(snapshot);
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
