import { getCatalogEntry } from '../catalog/registry';
import { getStructureSource } from '../catalog/sources';
import type {
  DecorationState,
  ObservationLayerId,
  ObservationPartId,
  ObservationSnapshot,
} from '../observation/types';
import { requiredElement } from './layout';
import {
  type FontScale,
  loadFontScale,
  loadVirusSimPreferences,
  removeLegacyVirusSimStorage,
  saveFontScale,
  saveVirusSimPreferences,
} from './preferences';

export interface RenderMetrics {
  readonly calls: number;
  readonly triangles: number;
  readonly geometries: number;
}

export class VirusSimPanel {
  constructor(
    private readonly root: HTMLElement,
    private readonly storage: Storage,
  ) {}

  getDisplayPreferences(reducedMotion: boolean) {
    return loadVirusSimPreferences(this.storage, reducedMotion);
  }

  applyFontScale(value: FontScale): void {
    document.documentElement.dataset.virusTextScale = value;
    const select = this.root.querySelector<HTMLSelectElement>('#font-scale');
    if (select) select.value = value;
  }

  applySavedFontScale(): void {
    this.applyFontScale(loadFontScale(this.storage));
  }

  persistFontScale(value: FontScale): void {
    this.applyFontScale(value);
    saveFontScale(this.storage, value);
  }

  persistDecoration(decoration: DecorationState): void {
    saveVirusSimPreferences(this.storage, {
      version: 1,
      decorationLevel: decoration.level,
      decorationPaused: decoration.paused,
    });
  }

  removeLegacyStorage(): void {
    removeLegacyVirusSimStorage(this.storage);
  }

  showSelection(title: string, description: string): void {
    this.text('#selection-title', title);
    this.text('#selection-description', description);
  }

  clearSelection(): void {
    this.showSelection(
      '부위를 선택해보세요',
      '3D 장면이나 아래 부위 목록을 누르면 구조 정보를 볼 수 있어요.',
    );
  }

  syncAll(snapshot: ObservationSnapshot, metrics: RenderMetrics): void {
    this.updatePresetUi(snapshot);
    this.syncObservationUi(snapshot, metrics);
  }

  syncObservationUi(snapshot: ObservationSnapshot, metrics: RenderMetrics): void {
    const specimen = snapshot.specimen;
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-view]')
      .forEach((button) => {
        const active = button.dataset.observationView === specimen.view;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        button.disabled =
          snapshot.scanner.enabled && button.dataset.observationView === 'exploded';
      });
    this.element<HTMLElement>('[data-explosion-control]').hidden =
      specimen.view !== 'exploded';
    this.element<HTMLElement>('[data-section-control]').hidden =
      specimen.view !== 'section';
    this.input('#observation-explosion').value = String(specimen.explosion);
    this.text('#observation-explosion-value', `${Math.round(specimen.explosion)}%`);
    this.input('#observation-section-offset').value = String(
      Math.round(specimen.sectionOffset * 100),
    );
    this.text('#observation-section-value', specimen.sectionOffset.toFixed(2));
    this.checkbox('#observation-genome').checked = specimen.genomeVisible;
    this.root
      .querySelectorAll<HTMLInputElement>('[data-observation-layer]')
      .forEach((input) => {
        input.checked =
          specimen.layerVisibility[
            input.dataset.observationLayer as ObservationLayerId
          ];
      });
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-part]')
      .forEach((button) => {
        const active = button.dataset.observationPart === specimen.selectedPartId;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

    this.checkbox('#scanner-enabled').checked = snapshot.scanner.enabled;
    this.element<HTMLElement>('#scanner-controls').hidden = !snapshot.scanner.enabled;
    this.element<HTMLCanvasElement>('#scanner-canvas').hidden =
      !snapshot.scanner.enabled;
    const scannerProbe = snapshot.scanner.probe;
    this.select('#scanner-axis').value = scannerProbe.axis;
    this.input('#scanner-position').value = String(
      Math.round(scannerProbe.position * 100),
    );
    this.text('#scanner-position-value', `${Math.round(scannerProbe.position * 100)}%`);
    this.input('#scanner-thickness').value = String(
      Math.round(scannerProbe.thickness * 100),
    );
    this.text(
      '#scanner-thickness-value',
      `${Math.round(scannerProbe.thickness * 100)}%`,
    );
    this.select('#decoration-level').value = snapshot.decoration.level;
    this.checkbox('#decoration-paused').checked = snapshot.decoration.paused;
    this.text(
      '#render-budget',
      `draw ${metrics.calls} · triangle ${metrics.triangles.toLocaleString('ko-KR')} · geometry ${metrics.geometries}`,
    );
  }

  private updatePresetUi(snapshot: ObservationSnapshot): void {
    const specimen = snapshot.specimen;
    const definition = getCatalogEntry(specimen.presetId);
    this.select('#virus-select').value = definition.id;
    const evidenceLabel = evidenceStatusLabel(definition.evidenceStatus);
    this.element<HTMLElement>('#observation-preset-description').innerHTML = `
      <p class="eyebrow">${escapeHtml(definition.category)}</p>
      <h2>${escapeHtml(definition.name)}</h2>
      <p>${escapeHtml(definition.description)}</p>
      <dl><div><dt>형태</dt><dd>${escapeHtml(definition.feature)}</dd></div><div><dt>유전체</dt><dd>${escapeHtml(definition.genomeLabel)}</dd></div><div><dt>근거</dt><dd>${evidenceLabel}</dd></div></dl>`;
    this.text('#stage-label', definition.shortName.toUpperCase());
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-part]')
      .forEach((button) => {
        button.hidden = !definition.parts.includes(
          button.dataset.observationPart as ObservationPartId,
        );
      });
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-layer-row]')
      .forEach((row) => {
        row.hidden = !definition.layers.some(
          (layer) => layer.id === row.dataset.observationLayerRow,
        );
      });
    this.text(
      '#observation-evidence',
      `${evidenceLabel} · ${definition.particleState}`,
    );
    this.element<HTMLElement>('#observation-simplification').innerHTML =
      definition.simplifications
        .map((item) => `<span>${escapeHtml(item)}</span>`)
        .join('');
    this.element<HTMLElement>('#observation-source-links').innerHTML =
      definition.sourceIds
        .map(getStructureSource)
        .filter((source) => source !== undefined)
        .map(
          (source) =>
            `<a href="${source.url}" target="_blank" rel="noreferrer" title="${escapeAttribute(source.scope)}">${escapeHtml(source.label)} ↗</a>`,
        )
        .join('');
  }

  private text(selector: string, value: string): void {
    this.element<HTMLElement>(selector).textContent = value;
  }

  private element<T extends Element>(selector: string): T {
    return requiredElement<T>(this.root, selector);
  }

  private input(selector: string): HTMLInputElement {
    return this.element<HTMLInputElement>(selector);
  }

  private checkbox(selector: string): HTMLInputElement {
    return this.element<HTMLInputElement>(selector);
  }

  private select(selector: string): HTMLSelectElement {
    return this.element<HTMLSelectElement>(selector);
  }
}

function evidenceStatusLabel(status: 'observed' | 'conceptual' | 'unavailable'): string {
  if (status === 'observed') return '관찰 자료 기반';
  if (status === 'conceptual') return '계열 공통 개념 표현';
  return '구조 정보 부족';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
