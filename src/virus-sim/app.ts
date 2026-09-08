import {
  filterVirusCatalog,
  getCatalogEntry,
  isVirusId,
  nextDiscovery,
} from './catalog/registry';
import { getStructureSource } from './catalog/sources';
import { OBSERVATION_PARTS } from './model/observationPresets';
import { ObservationController } from './observation/ObservationController';
import { OBSERVATION_FIXED_DT } from './observation/motion';
import { evaluateSpeciesTour } from './observation/tours';
import type {
  CatalogTag,
  InspectionView,
  MotionMode,
  ObservationLayerId,
  ObservationPartId,
  ObservationSnapshot,
} from './observation/types';
import { VirusScene, type SelectionDetails } from './rendering/VirusScene';
import { renderAppLayout, requiredElement } from './ui/layout';
import {
  type CatalogCollection,
  type FontScale,
  loadFavorites,
  loadFontScale,
  loadRecent,
  pushRecent,
  saveFavorites,
  saveFontScale,
} from './ui/preferences';

const MAX_TICKS_PER_FRAME = 12;
const UI_UPDATE_INTERVAL = 0.12;

export class VirusSimApp {
  private readonly scene: VirusScene;
  private readonly observation = new ObservationController(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  private readonly storage = window.localStorage;
  private favorites = loadFavorites(this.storage);
  private recent = loadRecent(this.storage);
  private catalogFilter: CatalogTag | 'all' = 'all';
  private collection: CatalogCollection = 'all';
  private accumulator = 0;
  private lastFrameTime = performance.now();
  private lastUiTime = 0;
  private animationFrame = 0;
  private disposed = false;

  constructor(private readonly root: HTMLElement) {
    renderAppLayout(root);
    this.applyFontScale(loadFontScale(this.storage));
    this.scene = new VirusScene(this.element<HTMLElement>('#viewport'), (selection) =>
      this.updateSelection(selection),
    );
    this.bindControls();
    const initialId = this.recent.find(isVirusId) ?? 't4';
    if (initialId !== 't4') this.observation.setPreset(initialId);
    this.recordRecent(initialId);
    const snapshot = this.observation.getSnapshot();
    this.scene.show(snapshot);
    this.updatePresetUi(snapshot);
    this.syncUi(snapshot);
    this.updateSelection(null);
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.scene.dispose();
    this.root.replaceChildren();
  }

  private bindControls(): void {
    this.input('#catalog-search').addEventListener('input', () =>
      this.updateCatalogFilter(),
    );
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-catalog-filter]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const value = button.dataset.catalogFilter ?? 'all';
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
          this.setActiveGroup('[data-catalog-filter]', button);
          this.updateCatalogFilter();
        });
      });
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-catalog-collection]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const value = button.dataset.catalogCollection;
          this.collection = value === 'favorites' || value === 'recent' ? value : 'all';
          this.setActiveGroup('[data-catalog-collection]', button);
          this.updateCatalogFilter();
        });
      });
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-preset]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const id = button.dataset.observationPreset;
          if (id && isVirusId(id)) this.activateVirus(id);
        });
      });

    this.button('#toggle-favorite').addEventListener('click', () =>
      this.toggleFavorite(),
    );
    this.button('#next-discovery').addEventListener('click', () => {
      const entry = nextDiscovery(this.observation.getSnapshot().presetId, this.recent);
      this.activateVirus(entry.id);
    });
    this.button('#save-image').addEventListener('click', async () => {
      const button = this.button('#save-image');
      const original = button.textContent;
      button.disabled = true;
      button.textContent = '저장 중…';
      const id = this.observation.getSnapshot().presetId;
      const ok = await this.scene.savePng(
        `virus-sim-${id}-${new Date().toISOString().slice(0, 10)}.png`,
      );
      button.textContent = ok ? '저장 완료' : '저장 실패';
      window.setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 1400);
    });

    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-view]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.observation.setView(button.dataset.observationView as InspectionView);
          this.syncUi(this.observation.getSnapshot());
        });
      });
    this.input('#observation-explosion').addEventListener('input', (event) => {
      this.observation.setExplosion(Number((event.target as HTMLInputElement).value));
      this.syncUi(this.observation.getSnapshot());
    });
    this.input('#observation-section-offset').addEventListener('input', (event) => {
      this.observation.setSectionOffset(
        Number((event.target as HTMLInputElement).value) / 100,
      );
      this.syncUi(this.observation.getSnapshot());
    });
    this.checkbox('#observation-genome').addEventListener('change', (event) => {
      this.observation.setGenomeVisible((event.target as HTMLInputElement).checked);
      this.syncUi(this.observation.getSnapshot());
    });
    this.checkbox('#observation-follow').addEventListener('change', (event) => {
      this.observation.setFollowTarget((event.target as HTMLInputElement).checked);
      this.syncUi(this.observation.getSnapshot());
    });
    this.select('#observation-motion-mode').addEventListener('change', (event) => {
      this.observation.setMotionMode(
        (event.target as HTMLSelectElement).value as MotionMode,
      );
      this.accumulator = 0;
      this.syncUi(this.observation.getSnapshot());
    });
    this.root
      .querySelectorAll<HTMLInputElement>('[data-observation-layer]')
      .forEach((input) => {
        input.addEventListener('change', () => {
          this.observation.setLayerVisible(
            input.dataset.observationLayer as ObservationLayerId,
            input.checked,
          );
          this.syncUi(this.observation.getSnapshot());
        });
      });
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-part]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const partId = button.dataset.observationPart as ObservationPartId;
          this.observation.freeze(1);
          this.observation.selectPart(partId);
          this.scene.selectObservationPart(partId);
          this.syncUi(this.observation.getSnapshot());
        });
      });

    this.button('#start-structure-tour').addEventListener('click', () => {
      this.observation.startDemo('structure-tour');
      this.syncUi(this.observation.getSnapshot());
    });
    this.button('#demo-toggle').addEventListener('click', () => {
      this.observation.toggleDemoPlayback();
      this.syncUi(this.observation.getSnapshot());
    });
    this.button('#demo-rewind').addEventListener('click', () => {
      this.observation.rewindDemo();
      this.syncUi(this.observation.getSnapshot());
    });
    this.button('#demo-exit').addEventListener('click', () => {
      this.observation.stopDemo();
      this.syncUi(this.observation.getSnapshot());
    });
    this.input('#demo-progress').addEventListener('input', (event) => {
      this.observation.setDemoProgress(
        Number((event.target as HTMLInputElement).value) / 1000,
      );
      this.syncUi(this.observation.getSnapshot());
    });

    this.button('#observation-play-pause').addEventListener('click', () => {
      const snapshot = this.observation.getSnapshot();
      this.observation.setRunning(!snapshot.running, 1);
      this.syncUi(this.observation.getSnapshot());
    });
    this.button('#observation-restart').addEventListener('click', () => {
      this.observation.resetMotion();
      this.accumulator = 0;
      this.syncUi(this.observation.getSnapshot());
    });
    this.button('#observation-return').addEventListener('click', () =>
      this.scene.resetCamera(),
    );
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-observation-speed]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.observation.setSpeed(Number(button.dataset.observationSpeed ?? 1));
          this.setActiveGroup('[data-observation-speed]', button);
        });
      });
    this.checkbox('#observation-translation').addEventListener('change', (event) => {
      this.observation.setTranslationEnabled(
        (event.target as HTMLInputElement).checked,
      );
      this.syncUi(this.observation.getSnapshot());
    });
    this.checkbox('#observation-rotation').addEventListener('change', (event) => {
      this.observation.setRotationEnabled((event.target as HTMLInputElement).checked);
      this.syncUi(this.observation.getSnapshot());
    });

    this.select('#quality-select').addEventListener('change', (event) => {
      this.scene.setQuality(
        (event.target as HTMLSelectElement).value === 'low' ? 'low' : 'high',
      );
    });
    this.select('#font-scale').addEventListener('change', (event) => {
      const value = (event.target as HTMLSelectElement).value as FontScale;
      this.applyFontScale(value);
      saveFontScale(this.storage, value);
    });
    this.button('#reset-camera').addEventListener('click', () =>
      this.scene.resetCamera(),
    );
    this.button('#focus-selection').addEventListener('click', () => {
      this.observation.freeze(1);
      this.scene.focusSelection();
      this.syncUi(this.observation.getSnapshot());
    });
    const guide = this.element<HTMLDialogElement>('#model-guide');
    this.button('#open-guide').addEventListener('click', () => guide.showModal());

    this.root.addEventListener('virus-observation-interaction', () => {
      if (this.observation.getSnapshot().demo.kind === 'none') return;
      this.observation.stopDemo();
      this.syncUi(this.observation.getSnapshot());
    });
    this.root.addEventListener('virus-context-status', (event) => {
      const lost = (event as CustomEvent<string>).detail === 'lost';
      this.element<HTMLElement>('#context-message').hidden = !lost;
      if (lost) this.observation.setRunning(false);
    });
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  private activateVirus(id: string): void {
    this.observation.setPreset(id);
    this.accumulator = 0;
    this.recordRecent(id);
    const snapshot = this.observation.getSnapshot();
    this.scene.show(snapshot);
    this.updatePresetUi(snapshot);
    this.syncUi(snapshot);
    this.updateSelection(null);
  }

  private recordRecent(id: string): void {
    this.recent = pushRecent(this.storage, this.recent, id);
    this.updateCatalogFilter();
  }

  private toggleFavorite(): void {
    const id = this.observation.getSnapshot().presetId;
    if (this.favorites.has(id)) this.favorites.delete(id);
    else this.favorites.add(id);
    saveFavorites(this.storage, this.favorites);
    this.updateFavoriteUi(id);
    this.updateCatalogFilter();
  }

  private updateCatalogFilter(): void {
    const query = this.input('#catalog-search').value;
    const collectionIds =
      this.collection === 'favorites'
        ? this.favorites
        : this.collection === 'recent'
          ? new Set(this.recent)
          : undefined;
    const visible = new Set(
      filterVirusCatalog(query, this.catalogFilter, collectionIds).map(
        (entry) => entry.id,
      ),
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
    const definition = getCatalogEntry(snapshot.presetId);
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-preset]')
      .forEach((card) => {
        card.classList.toggle(
          'is-active',
          card.dataset.observationPreset === definition.id,
        );
      });
    this.element<HTMLElement>('#observation-preset-description').innerHTML = `
      <p class="eyebrow">${definition.category}</p><h3>${definition.name}</h3>
      <p>${definition.description}</p>
      <dl><div><dt>입자 상태</dt><dd>${definition.particleState}</dd></div><div><dt>핵심 형태</dt><dd>${definition.feature}</dd></div><div><dt>유전체</dt><dd>${definition.genomeLabel}</dd></div></dl>`;
    this.text('#stage-label', `OBSERVATORY · ${definition.shortName.toUpperCase()}`);
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
    this.element<HTMLElement>('#observation-simplification').innerHTML =
      definition.simplifications.map((item) => `<span>${item}</span>`).join('');
    const links = definition.sourceIds
      .map(getStructureSource)
      .filter((source) => source !== undefined)
      .map(
        (source) =>
          `<a href="${source.url}" target="_blank" rel="noreferrer" title="${source.scope}">${source.label} ↗</a>`,
      )
      .join('');
    this.element<HTMLElement>('#observation-source-links').innerHTML = links;
    this.updateFavoriteUi(definition.id);
    window.setTimeout(() => this.updateRenderBudget(), 100);
  }

  private updateFavoriteUi(id: string): void {
    const active = this.favorites.has(id);
    const button = this.button('#toggle-favorite');
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '★ 즐겨찾기됨' : '☆ 즐겨찾기';
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-preset]')
      .forEach((card) => {
        card.classList.toggle(
          'is-favorite',
          this.favorites.has(card.dataset.observationPreset ?? ''),
        );
      });
  }

  private updateRenderBudget(): void {
    const metrics = this.scene.getRenderMetrics();
    this.text(
      '#render-budget',
      `현재 장면: draw ${metrics.calls} · triangle ${metrics.triangles.toLocaleString('ko-KR')} · geometry ${metrics.geometries}`,
    );
  }

  private syncUi(snapshot: ObservationSnapshot): void {
    const viewLabels: Record<InspectionView, string> = {
      surface: '외관',
      transparent: '반투명',
      section: '단면',
      exploded: '분해',
    };
    this.root
      .querySelectorAll<HTMLElement>('[data-observation-view]')
      .forEach((button) => {
        button.classList.toggle(
          'is-active',
          button.dataset.observationView === snapshot.view,
        );
      });
    this.text('#observation-view-label', viewLabels[snapshot.view]);
    this.element<HTMLElement>('[data-explosion-control]').hidden =
      snapshot.view !== 'exploded';
    this.element<HTMLElement>('[data-section-control]').hidden =
      snapshot.view !== 'section';
    this.input('#observation-explosion').value = String(snapshot.explosion);
    this.text('#observation-explosion-value', `${Math.round(snapshot.explosion)}%`);
    this.input('#observation-section-offset').value = String(
      Math.round(snapshot.sectionOffset * 100),
    );
    this.text('#observation-section-value', snapshot.sectionOffset.toFixed(2));
    this.checkbox('#observation-genome').checked = snapshot.genomeVisible;
    this.checkbox('#observation-follow').checked = snapshot.followTarget;
    this.checkbox('#observation-translation').checked = snapshot.translationEnabled;
    this.checkbox('#observation-rotation').checked = snapshot.rotationEnabled;
    this.select('#observation-motion-mode').value = snapshot.motion.mode;
    this.root
      .querySelectorAll<HTMLInputElement>('[data-observation-layer]')
      .forEach((input) => {
        input.checked =
          snapshot.layerVisibility[
            input.dataset.observationLayer as ObservationLayerId
          ];
      });
    this.button('#observation-play-pause').textContent = snapshot.running
      ? 'Ⅱ 정지'
      : '▶ 계속';
    this.text('#observation-tick', `tick ${snapshot.tick}`);
    const motionLabel: Record<MotionMode, string> = {
      active: '활동적 관찰',
      calm: '차분한 관찰',
      brownian: '확산 모형',
      static: '정지',
    };
    this.text(
      '#observation-status',
      snapshot.demo.kind === 'structure-tour'
        ? '종별 구조 투어'
        : motionLabel[snapshot.motion.mode],
    );
    const timeline = this.element<HTMLElement>('#demo-timeline');
    timeline.hidden = snapshot.demo.kind === 'none';
    if (snapshot.demo.kind !== 'none') {
      this.input('#demo-progress').value = String(
        Math.round(snapshot.demo.progress * 1000),
      );
      this.text('#demo-progress-value', `${Math.round(snapshot.demo.progress * 100)}%`);
      this.button('#demo-toggle').textContent = snapshot.demo.playing
        ? 'Ⅱ 일시정지'
        : '▶ 계속';
      const pose = evaluateSpeciesTour(
        getCatalogEntry(snapshot.presetId),
        snapshot.demo.progress,
      );
      this.text('#demo-status-copy', pose.label);
    }
  }

  private updateSelection(selection: SelectionDetails | null): void {
    if (!selection) {
      this.observation.selectPart(null);
      this.text('#selection-title', '부위를 선택해보세요');
      this.text(
        '#selection-description',
        '3D 장면이나 부위 목록을 누르면 역할과 표현 한계를 볼 수 있어요.',
      );
      return;
    }
    this.observation.freeze(1);
    this.observation.selectPart(selection.partId);
    const part = OBSERVATION_PARTS[selection.partId];
    this.text('#selection-title', selection.title);
    this.text('#selection-description', `${selection.description} ${part.summary}`);
    this.syncUi(this.observation.getSnapshot());
  }

  private applyFontScale(value: FontScale): void {
    document.documentElement.dataset.virusTextScale = value;
    const select = this.root.querySelector<HTMLSelectElement>('#font-scale');
    if (select) select.value = value;
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) {
      this.observation.freeze(1);
      this.accumulator = 0;
    }
    this.lastFrameTime = performance.now();
  };

  private readonly frame = (time: number): void => {
    if (this.disposed) return;
    const delta = Math.min(0.1, Math.max(0, (time - this.lastFrameTime) / 1000));
    this.lastFrameTime = time;
    const snapshotBefore = this.observation.getSnapshot();
    if (snapshotBefore.running) {
      this.accumulator += delta * snapshotBefore.speed;
      let ticks = 0;
      while (this.accumulator >= OBSERVATION_FIXED_DT && ticks < MAX_TICKS_PER_FRAME) {
        this.observation.step(OBSERVATION_FIXED_DT);
        this.accumulator -= OBSERVATION_FIXED_DT;
        ticks += 1;
      }
      if (ticks === MAX_TICKS_PER_FRAME) this.accumulator = 0;
    }
    const snapshot = this.observation.getSnapshot();
    this.scene.update(snapshot, this.accumulator / OBSERVATION_FIXED_DT);
    if (time - this.lastUiTime >= UI_UPDATE_INTERVAL * 1000) {
      this.lastUiTime = time;
      this.syncUi(snapshot);
    }
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private setActiveGroup(selector: string, active: HTMLElement): void {
    this.root
      .querySelectorAll(selector)
      .forEach((item) => item.classList.toggle('is-active', item === active));
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
