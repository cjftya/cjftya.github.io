import {
  filterVirusCatalog,
  getCatalogEntry,
  isVirusId,
  nextDiscovery,
} from '../catalog/registry';
import { getStructureSource } from '../catalog/sources';
import type {
  CatalogTag,
  DecorationState,
  InspectionView,
  ObservationLayerId,
  ObservationPartId,
  ObservationSnapshot,
  SpecimenObservationState,
} from '../observation/types';
import type { WorkspaceSnapshot } from '../workspace/WorkspaceStore';
import { requiredElement } from './layout';
import {
  type CatalogCollection,
  type FontScale,
  loadFavorites,
  loadFontScale,
  loadRecent,
  loadVirusSimPreferences,
  pushRecent,
  saveFavorites,
  saveFontScale,
  saveVirusSimPreferences,
} from './preferences';

export interface RenderMetrics {
  readonly calls: number;
  readonly triangles: number;
  readonly geometries: number;
}

export class VirusSimPanel {
  private favorites: Set<string>;
  private recent: string[];
  private catalogFilter: CatalogTag | 'all' = 'all';
  private collection: CatalogCollection = 'all';

  constructor(
    private readonly root: HTMLElement,
    private readonly storage: Storage,
  ) {
    this.favorites = loadFavorites(storage);
    this.recent = loadRecent(storage);
  }

  getInitialId(): string {
    return this.recent.find(isVirusId) ?? 't4';
  }

  getDisplayPreferences(reducedMotion: boolean) {
    return loadVirusSimPreferences(this.storage, reducedMotion);
  }

  getNextDiscoveryId(currentId: string): string {
    return nextDiscovery(currentId, this.recent).id;
  }

  setCatalogFilter(value: string): void {
    const allowed: readonly string[] = [
      'all',
      'phage',
      'plant',
      'animal',
      'archaea',
      'helical',
      'icosahedral',
      'enveloped',
    ];
    this.catalogFilter = allowed.includes(value)
      ? (value as CatalogTag | 'all')
      : 'all';
    this.updateCatalogFilter();
  }

  setCollection(value: string): void {
    this.collection = value === 'favorites' || value === 'recent' ? value : 'all';
    this.updateCatalogFilter();
  }

  recordRecent(id: string): void {
    this.recent = pushRecent(this.storage, this.recent, id);
    this.updateCatalogFilter();
  }

  toggleFavorite(id: string): void {
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
    saveFavorites(this.storage, this.favorites);
    this.updateFavoriteUi(id);
    this.updateCatalogFilter();
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

  syncWorkspace(snapshot: WorkspaceSnapshot): void {
    const app = this.element<HTMLElement>('.virus-app');
    const activeTab =
      snapshot.mode === 'observation' ? snapshot.observationTab : snapshot.labTab;
    app.dataset.workspaceMode = snapshot.mode;
    app.dataset.observationTab = snapshot.observationTab;
    app.dataset.labTab = snapshot.labTab;
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-workspace-mode-button]')
      .forEach((button) => {
        const active = button.dataset.workspaceModeButton === snapshot.mode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
      });
    this.root.querySelectorAll<HTMLElement>('[data-mode-toolbar]').forEach((item) => {
      item.hidden = item.dataset.modeToolbar !== snapshot.mode;
    });
    this.root.querySelectorAll<HTMLElement>('[data-mode-tabs]').forEach((item) => {
      item.hidden = item.dataset.modeTabs !== snapshot.mode;
    });
    this.root
      .querySelectorAll<HTMLButtonElement>(
        `[data-mode-tabs="${snapshot.mode}"] [data-workspace-tab]`,
      )
      .forEach((button) => {
        const active = button.dataset.workspaceTab === activeTab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
      });
    const catalog = this.element<HTMLElement>(
      '[data-workspace-panel="observation-catalog"]',
    );
    const observation = this.element<HTMLElement>(
      '[data-workspace-panel="observation-tools"]',
    );
    const lab = this.element<HTMLElement>('[data-workspace-panel="lab"]');
    catalog.hidden = snapshot.mode !== 'observation' || activeTab !== 'catalog';
    observation.hidden = snapshot.mode !== 'observation' || activeTab === 'catalog';
    lab.hidden = snapshot.mode !== 'lab';
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-section]')
      .forEach((item) => {
        item.classList.toggle(
          'workspace-section-hidden',
          snapshot.mode !== 'observation' ||
            item.dataset.observationSection !== snapshot.observationTab,
        );
      });
    this.root.querySelectorAll<HTMLElement>('[data-lab-section]').forEach((item) => {
      item.hidden =
        snapshot.mode !== 'lab' || item.dataset.labSection !== snapshot.labTab;
    });
    this.button('#return-to-lab').hidden = !snapshot.inspectingLabSpecimen;
    this.element<HTMLElement>('#lab-stage-state').hidden = snapshot.mode !== 'lab';
  }

  showSelection(title: string, description: string): void {
    this.text('#selection-title', title);
    this.text('#selection-description', description);
  }

  clearSelection(): void {
    this.showSelection(
      '부위를 선택해보세요',
      '3D 장면이나 부위 목록을 누르면 역할과 표현 한계를 볼 수 있어요. 카메라는 이동하지 않아요.',
    );
  }

  syncAll(snapshot: ObservationSnapshot, metrics: RenderMetrics): void {
    this.updatePresetUi(snapshot);
    this.syncObservationUi(snapshot, metrics);
    this.updateCatalogFilter();
  }

  syncObservationUi(snapshot: ObservationSnapshot, metrics: RenderMetrics): void {
    const specimen = activeSpecimen(snapshot);
    const viewLabels: Record<InspectionView, string> = {
      surface: '외관',
      transparent: '반투명',
      section: '단면',
      exploded: '분해',
    };
    this.text('#active-slot-badge', '현재');
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-view]')
      .forEach((button) => {
        button.classList.toggle(
          'is-active',
          button.dataset.observationView === specimen.view,
        );
      });
    this.text('#observation-view-label', viewLabels[specimen.view]);
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

    this.checkbox('#scanner-enabled').checked = snapshot.scanner.enabled;
    this.element<HTMLElement>('#scanner-controls').hidden = !snapshot.scanner.enabled;
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-structural-reveal]')
      .forEach((button) => {
        button.disabled = snapshot.scanner.enabled;
      });
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-view]')
      .forEach((button) => {
        button.disabled =
          snapshot.scanner.enabled && button.dataset.observationView === 'exploded';
      });
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

  updateCatalogFilter(): void {
    const query = this.input('#catalog-search').value;
    const ids =
      this.collection === 'favorites'
        ? this.favorites
        : this.collection === 'recent'
          ? new Set(this.recent)
          : undefined;
    const visible = new Set(
      filterVirusCatalog(query, this.catalogFilter, ids).map((entry) => entry.id),
    );
    let count = 0;
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-preset]')
      .forEach((button) => {
        const id = button.dataset.observationPreset ?? '';
        button.hidden = !visible.has(id);
        button.classList.toggle('is-favorite', this.favorites.has(id));
        if (!button.hidden) count += 1;
      });
    this.text('#catalog-filter-count', String(count));
    this.element<HTMLElement>('#catalog-empty').hidden = count > 0;
  }

  private updatePresetUi(snapshot: ObservationSnapshot): void {
    const specimen = activeSpecimen(snapshot);
    const definition = getCatalogEntry(specimen.presetId);
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-preset]')
      .forEach((card) => {
        card.classList.toggle(
          'is-active',
          card.dataset.observationPreset === definition.id,
        );
      });
    const evidenceLabel =
      definition.evidenceStatus === 'observed'
        ? '관찰 자료 기반'
        : definition.evidenceStatus === 'conceptual'
          ? '계열 공통 개념 표현'
          : '구조 정보 부족';
    this.element<HTMLElement>('#observation-preset-description').innerHTML = `
      <p class="eyebrow">${escapeHtml(definition.category)}</p><h3>${escapeHtml(definition.name)}</h3>
      <p>${escapeHtml(definition.description)}</p>
      <dl><div><dt>입자 상태</dt><dd>${escapeHtml(definition.particleState)}</dd></div><div><dt>핵심 형태</dt><dd>${escapeHtml(definition.feature)}</dd></div><div><dt>유전체</dt><dd>${escapeHtml(definition.genomeLabel)}</dd></div><div><dt>근거 수준</dt><dd>${evidenceLabel}</dd></div></dl>`;
    this.text('#stage-label', `MANUAL · ${definition.shortName.toUpperCase()}`);
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
    this.updateFavoriteUi(definition.id);
  }

  private updateFavoriteUi(id: string): void {
    const active = this.favorites.has(id);
    const button = this.button('#toggle-favorite');
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
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

  private button(selector: string): HTMLButtonElement {
    return this.element<HTMLButtonElement>(selector);
  }
}

function activeSpecimen(snapshot: ObservationSnapshot): SpecimenObservationState {
  return snapshot.specimen;
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
