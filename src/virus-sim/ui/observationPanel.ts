import { VIRUS_CATALOG } from '../catalog/registry';
import { OBSERVATION_PARTS } from '../model/observationPresets';
import type { ObservationLayerId } from '../observation/types';

const LAYER_LABELS: Readonly<Record<ObservationLayerId, string>> = {
  envelope: '지질 외피',
  'surface-protein': '표면 단백질',
  tegument: 'Tegument',
  capsid: '캡시드',
  tail: '꼬리 장치',
  'outer-capsid': '바깥 캡시드',
  'middle-capsid': '중간 캡시드',
  'core-capsid': '코어 캡시드',
  'inner-membrane': '내부막',
  matrix: 'Matrix',
  nucleocapsid: '뉴클레오캡시드',
  membrane: '입자 막',
  'core-wall': '코어 벽',
  'lateral-body': '측면체',
  genome: '유전체',
};

export function observationControlsMarkup(): string {
  const viruses = VIRUS_CATALOG.map(
    (virus, index) => `
      <button class="observation-preset-card${index === 0 ? ' is-active' : ''}" data-observation-preset="${virus.id}" data-catalog-tags="${virus.morphologyTags.join(' ')}" data-catalog-search="${escapeAttribute([virus.name, virus.shortName, virus.nameEn, ...virus.aliases, virus.genomeLabel].join(' ').toLocaleLowerCase('ko-KR'))}" type="button">
        <span class="preset-silhouette" data-silhouette="${virus.silhouette}" aria-hidden="true"></span>
        <span class="catalog-card-copy"><strong>${virus.shortName}</strong><small>${virus.genomeLabel}</small></span>
        <span class="favorite-mark" aria-hidden="true">★</span>
      </button>`,
  ).join('');

  return `
    <section class="observatory-controls">
      <div class="panel-heading catalog-heading">
        <div><p class="eyebrow">VERIFIED CATALOG</p><h2>실제 바이러스 도감</h2></div>
        <span><b id="catalog-filter-count">${VIRUS_CATALOG.length}</b> / ${VIRUS_CATALOG.length}종</span>
      </div>
      <label class="catalog-search"><span class="sr-only">이름 검색</span><input id="catalog-search" type="search" placeholder="한글·영문·유전체 검색" autocomplete="off" /></label>
      <div class="catalog-collections" role="group" aria-label="저장 목록">
        <button class="is-active" data-catalog-collection="all" type="button">전체</button>
        <button data-catalog-collection="favorites" type="button">즐겨찾기</button>
        <button data-catalog-collection="recent" type="button">최근 관찰</button>
      </div>
      <div class="catalog-filters" role="group" aria-label="구조 분류">
        <button class="is-active" data-catalog-filter="all" type="button">전체</button>
        <button data-catalog-filter="phage" type="button">파지</button>
        <button data-catalog-filter="plant" type="button">식물</button>
        <button data-catalog-filter="animal" type="button">동물</button>
        <button data-catalog-filter="archaea" type="button">고세균</button>
        <button data-catalog-filter="helical" type="button">나선형</button>
        <button data-catalog-filter="icosahedral" type="button">다면체</button>
        <button data-catalog-filter="enveloped" type="button">외피형</button>
      </div>
      <div class="observation-preset-list" role="radiogroup" aria-label="검증된 실제 바이러스 ${VIRUS_CATALOG.length}종">${viruses}</div>
      <p class="catalog-empty" id="catalog-empty" hidden>조건에 맞는 항목이 없어요.</p>
      <article class="model-card observatory-preset-description" id="observation-preset-description"></article>
    </section>`;
}

export function observationInfoMarkup(): string {
  const partButtons = Object.values(OBSERVATION_PARTS)
    .map(
      (part) => `
        <button class="part-list-button" data-observation-part="${part.id}" type="button" hidden>
          <span><strong>${part.name}</strong><small>${part.summary}</small></span><b>집중</b>
        </button>`,
    )
    .join('');
  const layerControls = Object.entries(LAYER_LABELS)
    .map(
      ([id, label]) =>
        `<label data-observation-layer-row="${id}" hidden><input data-observation-layer="${id}" type="checkbox" checked /><span>${label}</span></label>`,
    )
    .join('');

  return `
    <section class="observatory-info">
      <div class="current-actions">
        <button id="toggle-favorite" type="button" aria-pressed="false">☆ 즐겨찾기</button>
        <button id="next-discovery" type="button">다음 발견</button>
        <button id="save-image" type="button">이미지 저장</button>
      </div>

      <details class="observatory-details" open>
        <summary><span><small>PART EXPLORER</small>부위별로 살펴보기</span></summary>
        <div class="part-list" id="observation-part-list">${partButtons}</div>
      </details>

      <div class="control-group view-control-group">
        <div class="control-label"><span>껍질 보기</span><output id="observation-view-label">외관</output></div>
        <div class="segmented-view" role="group" aria-label="껍질 표현">
          <button class="is-active" data-observation-view="surface" type="button">외관</button>
          <button data-observation-view="transparent" type="button">반투명</button>
          <button data-observation-view="section" type="button">단면</button>
          <button data-observation-view="exploded" type="button">분해</button>
        </div>
      </div>
      <div class="control-group" data-explosion-control hidden>
        <div class="control-label"><label for="observation-explosion">분해 거리</label><output id="observation-explosion-value">62%</output></div>
        <input id="observation-explosion" type="range" min="0" max="100" value="62" />
      </div>
      <div class="control-group" data-section-control hidden>
        <div class="control-label"><label for="observation-section-offset">절단 위치</label><output id="observation-section-value">0.00</output></div>
        <input id="observation-section-offset" type="range" min="-100" max="100" value="0" />
      </div>
      <div class="switch-row observation-switches">
        <label><input id="observation-genome" type="checkbox" /><span>유전체 표시</span></label>
        <label><input id="observation-follow" type="checkbox" checked /><span>개체 중심 추적</span></label>
      </div>
      <div class="layer-controls" data-observation-layers>
        <span>이 항목의 구조 레이어</span>${layerControls}
      </div>

      <div class="demo-section">
        <div class="panel-heading"><p class="eyebrow">SPECIES TOUR</p><h2>종별 구조 투어</h2></div>
        <button class="demo-card" id="start-structure-tour" type="button"><span>약 24초</span><strong>현재 종 둘러보기</strong><small>표면 → 반투명 → 단면 → 분해</small></button>
        <div class="demo-timeline" id="demo-timeline" hidden>
          <div class="control-label"><span id="demo-kind-label">종별 구조 투어</span><output id="demo-progress-value">0%</output></div>
          <input id="demo-progress" type="range" min="0" max="1000" value="0" />
          <div class="demo-actions"><button id="demo-toggle" type="button">Ⅱ 일시정지</button><button id="demo-rewind" type="button">처음으로</button><button id="demo-exit" type="button">수동 관찰</button></div>
          <p id="demo-status-copy">표면 구조를 살펴보고 있어요.</p>
        </div>
      </div>

      <div class="fact-box source-fact">
        <span>구조 근거와 표현 한계</span>
        <p id="observation-simplification">공개 구조 자료를 브라우저용 절차 기하로 단순화했어요.</p>
        <div class="source-links compact" id="observation-source-links"></div>
      </div>
      <div class="fact-box observatory-fact">
        <span>화면용 확대</span><p>각 구조는 보기 좋게 따로 확대해요. 화면 크기는 실제 종 사이의 상대 크기가 아니에요.</p>
        <small id="render-budget">렌더 예산 측정 대기</small>
      </div>
    </section>`;
}

export function observationFooterMarkup(): string {
  return `
    <footer class="observation-bar">
      <div class="run-controls"><button class="primary-action" id="observation-play-pause" type="button">Ⅱ 정지</button><button id="observation-restart" type="button">처음 자세</button><button id="observation-return" type="button">대상으로 돌아가기</button></div>
      <label class="motion-select">움직임<select id="observation-motion-mode"><option value="active" selected>활동적 관찰</option><option value="calm">차분한 관찰</option><option value="brownian">확산 모형(고급)</option><option value="static">정지</option></select></label>
      <div class="speed-controls observation-speed" role="group" aria-label="관찰 배속"><span>배속</span><button data-observation-speed="0.5" type="button">0.5×</button><button class="is-active" data-observation-speed="1" type="button">1×</button><button data-observation-speed="2" type="button">2×</button></div>
      <div class="view-toggles motion-toggles"><label><input id="observation-translation" type="checkbox" checked />이동</label><label><input id="observation-rotation" type="checkbox" checked />회전</label></div>
      <div class="run-meta"><span id="observation-tick">tick 0</span><span id="observation-status">활동적 관찰</span></div>
    </footer>`;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}
