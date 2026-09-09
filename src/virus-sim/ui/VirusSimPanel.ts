import { getPhysicalDimensions } from '../catalog/dimensions';
import {
  VIRUS_CATALOG,
  filterVirusCatalog,
  getCatalogEntry,
  isVirusId,
  nextDiscovery,
} from '../catalog/registry';
import { getStructureSource } from '../catalog/sources';
import { scaleBarForNmPerPixel } from '../comparison/scaling';
import {
  getChangesForVariants,
  getVariantsForVirus,
} from '../catalog/variants/registry';
import { OBSERVATION_PARTS } from '../model/observationPresets';
import type {
  CatalogTag,
  DecorationState,
  InspectionView,
  ObservationLayerId,
  ObservationPartId,
  ObservationSnapshot,
  SpecimenObservationState,
} from '../observation/types';
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

export interface ComparisonScaleStatus {
  readonly physicalAvailable: boolean;
  readonly nmPerPixel: number | null;
}

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

  syncAll(
    snapshot: ObservationSnapshot,
    scaleStatus: ComparisonScaleStatus,
    metrics: RenderMetrics,
  ): void {
    this.updatePresetUi(snapshot);
    this.syncObservationUi(snapshot, scaleStatus, metrics);
    this.updateCatalogFilter();
  }

  syncObservationUi(
    snapshot: ObservationSnapshot,
    scaleStatus: ComparisonScaleStatus,
    metrics: RenderMetrics,
  ): void {
    const specimen = activeSpecimen(snapshot);
    const viewLabels: Record<InspectionView, string> = {
      surface: '외관',
      transparent: '반투명',
      section: '단면',
      exploded: '분해',
    };
    this.text('#active-slot-badge', snapshot.activeSlot.toUpperCase());
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

    const comparison = snapshot.comparison.enabled && Boolean(snapshot.slots.b);
    this.text('#comparison-state', comparison ? 'A/B' : '꺼짐');
    this.button('#comparison-add').hidden = comparison;
    this.button('#comparison-swap').hidden = !comparison;
    this.button('#comparison-close').hidden = !comparison;
    this.element<HTMLElement>('#comparison-link-row').hidden = !comparison;
    this.element<HTMLElement>('#comparison-scale-controls').hidden = !comparison;
    this.checkbox('#comparison-linked').checked = snapshot.comparison.linked;
    this.root
      .querySelectorAll<HTMLElement>('[data-comparison-scale]')
      .forEach((button) => {
        button.classList.toggle(
          'is-active',
          button.dataset.comparisonScale === snapshot.comparison.scaleMode,
        );
      });
    this.updateComparisonUi(snapshot, scaleStatus);
    this.updateVariantUi(snapshot);

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
    const scannerProbe = snapshot.scanner.probes[snapshot.activeSlot];
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
    this.element<HTMLElement>('#scanner-link-row').hidden = !comparison;
    this.checkbox('#scanner-linked').checked = snapshot.scanner.linked;

    this.select('#decoration-level').value = snapshot.decoration.level;
    this.checkbox('#decoration-paused').checked = snapshot.decoration.paused;

    const a = getCatalogEntry(snapshot.slots.a.presetId);
    this.text('#slot-name-a', a.shortName);
    this.element<HTMLElement>('#slot-label-a').classList.toggle(
      'is-active',
      snapshot.activeSlot === 'a',
    );
    const b = snapshot.slots.b ? getCatalogEntry(snapshot.slots.b.presetId) : null;
    this.element<HTMLElement>('#slot-label-b').hidden = !comparison;
    this.element<HTMLElement>('#slot-label-b').classList.toggle(
      'is-active',
      snapshot.activeSlot === 'b',
    );
    this.text('#slot-name-b', b?.shortName ?? '');
    const physicalScaleBar =
      snapshot.comparison.scaleMode === 'physical' &&
      comparison &&
      scaleStatus.nmPerPixel
        ? scaleBarForNmPerPixel(scaleStatus.nmPerPixel)
        : null;
    const scaleBar = this.element<HTMLElement>('#scale-bar');
    scaleBar.style.width = `${physicalScaleBar?.pixels ?? 54}px`;
    this.text(
      '#scale-legend-copy',
      physicalScaleBar
        ? `${formatNumber(physicalScaleBar.nanometers)} nm · 실제 크기 비율`
        : '같은 크기로 맞춤 · 실제 비율 아님',
    );
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
    const compare = this.select('#compare-virus');
    if (compare.value === definition.id) {
      compare.value =
        VIRUS_CATALOG.find((item) => item.id !== definition.id)?.id ?? definition.id;
    }
  }

  private updateComparisonUi(
    snapshot: ObservationSnapshot,
    scaleStatus: ComparisonScaleStatus,
  ): void {
    const b = snapshot.slots.b;
    if (!snapshot.comparison.enabled || !b) {
      this.element<HTMLElement>('#comparison-dimensions').replaceChildren();
      this.text(
        '#comparison-scale-note',
        '같은 화면 길이로 맞춰 구조를 비교해요. 실제 비율이 아니에요.',
      );
      return;
    }
    const aDimension = getPhysicalDimensions(snapshot.slots.a.presetId);
    const bDimension = getPhysicalDimensions(b.presetId);
    this.text(
      '#comparison-scale-note',
      snapshot.comparison.scaleMode === 'physical'
        ? scaleStatus.physicalAvailable
          ? `양쪽에 같은 환산을 적용해요${scaleStatus.nmPerPixel ? ` · ${formatNumber(scaleStatus.nmPerPixel)} nm/px` : ''}. 분해 거리는 관찰용이에요.`
          : '치수 자료가 없어 실제 비율을 표시할 수 없어요.'
        : '정해진 대표 길이를 같은 화면 길이로 맞춰요. 실제 비율이 아니에요.',
    );
    this.element<HTMLElement>('#comparison-dimensions').innerHTML =
      `${dimensionMarkup('A', snapshot.slots.a.presetId, aDimension)}${dimensionMarkup('B', b.presetId, bDimension)}`;
  }

  private updateVariantUi(snapshot: ObservationSnapshot): void {
    this.populateVariantSelect('#variant-a', snapshot.slots.a);
    const b = snapshot.slots.b;
    this.element<HTMLElement>('#variant-b-row').hidden = !b;
    if (b) this.populateVariantSelect('#variant-b', b);
    const total =
      getVariantsForVirus(snapshot.slots.a.presetId).length +
      (b ? getVariantsForVirus(b.presetId).length : 0);
    this.text('#variant-count', `${total}개`);
    const changes = getChangesForVariants(
      snapshot.slots.a.variantId,
      b?.variantId ?? null,
    );
    const container = this.element<HTMLElement>('#variant-changes');
    if (changes.length === 0) {
      const selected = Boolean(snapshot.slots.a.variantId || b?.variantId);
      container.innerHTML = `<p>${selected ? '이 표본 조합의 대응 구조 차이 자료가 부족해요. 같은 모델이 외형 동일성의 증거는 아니에요.' : 'A/B 표본을 선택하면 근거가 있는 영역 수준 차이를 표시해요.'}</p>`;
      return;
    }
    container.innerHTML = changes
      .map(
        (change) => `
      <button type="button" data-change-part="${change.partId}">
        <strong>${escapeHtml(change.regionId ?? OBSERVATION_PARTS[change.partId].name)}</strong>
        <span>영역 수준 표시 · 카메라 이동 없음</span><small>${escapeHtml(change.note)}</small>
      </button>`,
      )
      .join('');
  }

  private populateVariantSelect(
    selector: string,
    specimen: SpecimenObservationState,
  ): void {
    const select = this.select(selector);
    if (select.dataset.parent !== specimen.presetId) {
      const variants = getVariantsForVirus(specimen.presetId);
      select.innerHTML = `<option value="">기본 표본</option>${variants.map((variant) => `<option value="${variant.id}">${escapeHtml(variant.label)} · ${escapeHtml(variant.referenceLabel)}</option>`).join('')}`;
      select.dataset.parent = specimen.presetId;
    }
    select.value = specimen.variantId ?? '';
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
  return snapshot.slots[snapshot.activeSlot] ?? snapshot.slots.a;
}

function dimensionMarkup(
  slot: string,
  virusId: string,
  dimensions: ReturnType<typeof getPhysicalDimensions>,
): string {
  const virus = getCatalogEntry(virusId);
  if (!dimensions) {
    return `<article><b>${slot} · ${escapeHtml(virus.shortName)}</b><span>치수 자료 없음</span></article>`;
  }
  const range = dimensions.rangeNm
    ? ` (${formatNumber(dimensions.rangeNm[0])}–${formatNumber(dimensions.rangeNm[1])} nm)`
    : '';
  return `<article><b>${slot} · ${escapeHtml(virus.shortName)}</b><span>${formatNumber(dimensions.representativeNm)} nm${range}</span><small>${escapeHtml(dimensions.metric)} · ${escapeHtml(dimensions.particleState)}</small></article>`;
}

function formatNumber(value: number): string {
  return value >= 100
    ? Math.round(value).toLocaleString('ko-KR')
    : value.toFixed(value < 1 ? 2 : 1).replace(/\.0$/, '');
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
