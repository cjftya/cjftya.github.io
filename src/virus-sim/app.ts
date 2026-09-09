import { isVirusId } from './catalog/registry';
import { OBSERVATION_PARTS } from './model/observationPresets';
import { ObservationStore } from './observation/ObservationStore';
import type { ObservationPartId, ObservationSnapshot } from './observation/types';
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
    this.panel.removeLegacyStorage();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observation = new ObservationStore(reducedMotion);
    const preferences = this.panel.getDisplayPreferences(reducedMotion);
    this.observation.setDecorationLevel(preferences.decorationLevel);
    this.observation.setDecorationPaused(preferences.decorationPaused);

    this.scene = new SceneRenderer(
      requiredElement<HTMLElement>(root, '#viewport'),
      requiredElement<HTMLCanvasElement>(root, '#scanner-canvas'),
      (selection) => this.handleSceneSelection(selection),
    );
    this.unbindControls = bindVirusSimControls(
      root,
      this.createObservationActions(),
    );

    this.panel.clearSelection();
    this.refresh(true);
    this.scene.start((delta) => this.advanceFrame(delta));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unbindControls();
    this.scene.dispose();
    this.root.replaceChildren();
  }

  private createObservationActions(): VirusSimControlActions {
    return {
      activateVirus: (id) => this.activateVirus(id),
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
      setScannerEnabled: (enabled) =>
        this.updateObservation(() => this.observation.setScannerEnabled(enabled)),
      setScannerAxis: (axis) =>
        this.updateObservation(() => this.observation.setScannerAxis(axis)),
      setScannerPosition: (position) =>
        this.updateObservation(() => this.observation.setScannerPosition(position)),
      setScannerThickness: (thickness) =>
        this.updateObservation(() => this.observation.setScannerThickness(thickness)),
      setDecorationLevel: (level) => {
        this.observation.setDecorationLevel(level);
        this.panel.persistDecoration(this.observation.getSnapshot().decoration);
        this.refresh();
      },
      setDecorationPaused: (paused) => {
        this.observation.setDecorationPaused(paused);
        this.panel.persistDecoration(this.observation.getSnapshot().decoration);
        this.refresh();
      },
      setQuality: (quality) => this.scene.setQuality(quality),
      setFontScale: (scale) => this.panel.persistFontScale(scale),
    };
  }

  private advanceFrame(delta: number): ObservationSnapshot {
    void delta;
    const snapshot = this.observation.getSnapshot();
    const now = performance.now();
    if (now - this.lastUiTime >= UI_UPDATE_INTERVAL) {
      this.lastUiTime = now;
      this.panel.syncObservationUi(snapshot, this.scene.getRenderMetrics());
    }
    return snapshot;
  }

  private activateVirus(id: string): void {
    if (!isVirusId(id)) return;
    this.observation.setPreset(id);
    this.panel.clearSelection();
    this.refresh(true);
    this.scene.frameAll();
  }

  private selectPart(partId: ObservationPartId): void {
    this.observation.selectPart(partId);
    const part = OBSERVATION_PARTS[partId];
    this.panel.showSelection(part.name, `${part.detail} ${part.summary}`);
    this.refresh();
  }

  private handleSceneSelection(selection: SelectionDetails | null): void {
    if (!selection) {
      this.observation.selectPart(null);
      this.panel.clearSelection();
      this.refresh();
      return;
    }
    this.observation.selectPart(selection.partId);
    const part = OBSERVATION_PARTS[selection.partId];
    this.panel.showSelection(
      selection.title,
      `${selection.description} ${part.summary}`,
    );
    this.refresh(true);
  }

  private saveObservationImage(): Promise<boolean> {
    const id = this.observation.getActiveSpecimen().presetId;
    return this.scene.savePng(
      `virus-sim-${id}-${new Date().toISOString().slice(0, 10)}.png`,
    );
  }

  private updateObservation(action: () => void, full = false): void {
    action();
    this.refresh(full);
  }

  private refresh(full = false): void {
    const snapshot = this.observation.getSnapshot();
    this.scene.show(snapshot);
    if (full) this.panel.syncAll(snapshot, this.scene.getRenderMetrics());
    else this.panel.syncObservationUi(snapshot, this.scene.getRenderMetrics());
  }
}
