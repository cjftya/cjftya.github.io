import './styles.css';
import { PixiExperimentHost } from './core/PixiExperimentHost';
import {
  categoryLabels,
  experimentById,
  experimentCategories,
  experiments,
  type ExperimentCategory,
  type ExperimentDefinition,
} from './data/experiments';

const mountElement = document.querySelector<HTMLElement>('#viola-app');
if (!mountElement) throw new Error('Viola mount element was not found.');
const mount: HTMLElement = mountElement;

let host: PixiExperimentHost | null = null;
let category: ExperimentCategory | 'all' = 'all';
let query = '';

const formatDate = (value: string) => value.replaceAll('-', '.');

function experimentIdFromLocation(): string | null {
  return new URL(window.location.href).searchParams.get('experiment');
}

function setLocation(id: string | null, replace = false): void {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('experiment', id);
  else url.searchParams.delete('experiment');
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
}

function cardTemplate(definition: ExperimentDefinition): string {
  return `
    <button class="experiment-card" type="button" data-experiment="${definition.id}">
      <span class="experiment-card__topline">
        <span class="experiment-card__category">${categoryLabels[definition.category]}</span>
        <time datetime="${definition.recordedAt}">원본 기록 ${formatDate(definition.recordedAt)}</time>
      </span>
      <strong>${definition.title}</strong>
      <span class="experiment-card__summary">${definition.summary}</span>
      <span class="experiment-card__original">${definition.originalName}</span>
      <span class="experiment-card__start">실험 시작 <span aria-hidden="true">↗</span></span>
    </button>`;
}

function filteredExperiments(): ExperimentDefinition[] {
  const normalized = query.trim().toLocaleLowerCase('ko');
  return experiments.filter((definition) => {
    if (category !== 'all' && definition.category !== category) return false;
    if (!normalized) return true;
    return `${definition.title} ${definition.originalName} ${definition.summary}`
      .toLocaleLowerCase('ko')
      .includes(normalized);
  });
}

function renderList(): void {
  host?.destroy();
  host = null;
  const visible = filteredExperiments();
  mount.innerHTML = `
    <div class="archive-shell">
      <header class="archive-hero">
        <a class="archive-home" href="/" aria-label="Jelly Plants로 돌아가기">JELLY PLANTS / ARCHIVE</a>
        <p class="archive-kicker">2013—2020 · 2D PHYSICS NOTES</p>
        <h1>Viola</h1>
        <p class="archive-intro">오래된 물리 실험의 계산법과 손맛은 그대로 두고, 공통 벡터 코어와 PixiJS 렌더링 위에서 다시 실행합니다.</p>
        <div class="archive-stats" aria-label="아카이브 통계">
          <span><b>${experiments.length}</b> experiments</span>
          <span><b>5</b> collections</span>
          <span><b>1</b> physics core</span>
        </div>
      </header>
      <section class="archive-browser" aria-labelledby="experiment-list-title">
        <div class="browser-heading">
          <div><p class="section-index">01 / INDEX</p><h2 id="experiment-list-title">실험 목록</h2></div>
          <label class="search-box"><span class="sr-only">실험 검색</span><input id="experiment-search" type="search" placeholder="이름이나 내용으로 찾기" value="${query.replaceAll('"', '&quot;')}" /></label>
        </div>
        <div class="category-tabs" role="group" aria-label="실험 분류">
          <button type="button" data-category="all" class="${category === 'all' ? 'is-active' : ''}">All <small>${experiments.length}</small></button>
          ${experimentCategories.map((item) => `<button type="button" data-category="${item}" class="${category === item ? 'is-active' : ''}">${categoryLabels[item]} <small>${experiments.filter((experiment) => experiment.category === item).length}</small></button>`).join('')}
        </div>
        <p class="date-note">날짜는 생성일을 확인할 수 없는 경우가 있어, 각 실험 핵심 소스의 마지막 수정 기록을 표시합니다.</p>
        <div class="experiment-grid" aria-live="polite">
          ${visible.length > 0 ? visible.map(cardTemplate).join('') : '<p class="empty-state">조건에 맞는 실험이 없습니다.</p>'}
        </div>
      </section>
      <footer class="archive-footer"><span>VIOLA PHYSICS ARCHIVE</span><span>Rebuilt with PixiJS</span></footer>
    </div>`;

  mount
    .querySelector<HTMLInputElement>('#experiment-search')
    ?.addEventListener('input', (event) => {
      query = (event.currentTarget as HTMLInputElement).value;
      renderList();
      const input = mount.querySelector<HTMLInputElement>('#experiment-search');
      input?.focus();
      input?.setSelectionRange(query.length, query.length);
    });
  mount.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.category;
      if (next === 'all' || experimentCategories.includes(next as ExperimentCategory))
        category = next as ExperimentCategory | 'all';
      renderList();
    });
  });
  mount.querySelectorAll<HTMLButtonElement>('[data-experiment]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.experiment;
      if (!id) return;
      setLocation(id);
      void renderExperiment(id);
    });
  });
}

async function renderExperiment(id: string): Promise<void> {
  const definition = experimentById.get(id);
  if (!definition) {
    setLocation(null, true);
    renderList();
    return;
  }
  host?.destroy();
  mount.innerHTML = `
    <section class="play-shell">
      <header class="play-header">
        <button class="back-button" type="button" aria-label="실험 목록으로 돌아가기"><span aria-hidden="true">←</span> 목록</button>
        <div class="play-title"><p>${categoryLabels[definition.category]} · 원본 기록 ${formatDate(definition.recordedAt)}</p><h1>${definition.title}</h1></div>
        <button class="reset-button" type="button">다시 시작</button>
      </header>
      <div class="canvas-frame">
        <div id="pixi-stage" class="pixi-stage" aria-label="${definition.title} 인터랙티브 캔버스"></div>
        <div class="play-hint"><span>HOW TO PLAY</span><p id="play-hint">${definition.hint}</p></div>
      </div>
      <footer class="play-footer"><p>${definition.summary}</p><span>Original: ${definition.originalName}</span></footer>
    </section>`;
  const stage = mount.querySelector<HTMLElement>('#pixi-stage');
  const hint = mount.querySelector<HTMLElement>('#play-hint');
  if (!stage || !hint) return;
  host = new PixiExperimentHost(stage, (message) => {
    hint.textContent = message;
  });
  await host.start(definition);
  mount
    .querySelector<HTMLButtonElement>('.back-button')
    ?.addEventListener('click', () => {
      setLocation(null);
      renderList();
    });
  mount
    .querySelector<HTMLButtonElement>('.reset-button')
    ?.addEventListener('click', () => void renderExperiment(id));
}

window.addEventListener('popstate', () => {
  const id = experimentIdFromLocation();
  if (id) void renderExperiment(id);
  else renderList();
});

const initialId = experimentIdFromLocation();
if (initialId) void renderExperiment(initialId);
else renderList();
