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
      <button class="observation-preset-card${index === 0 ? ' is-active' : ''}" data-observation-preset="${virus.id}" data-catalog-tags="${virus.morphologyTags.join(' ')}" type="button">
        <span class="preset-silhouette" data-silhouette="${virus.silhouette}" aria-hidden="true"></span>
        <span class="catalog-card-copy"><strong>${virus.shortName}</strong><small>${virus.genomeLabel}</small></span>
        <span class="favorite-mark" aria-hidden="true">★</span>
      </button>`,
  ).join('');

  return `
    <section class="observatory-controls">
      <div class="panel-heading catalog-heading">
        <div><p class="eyebrow">STRUCTURE CATALOG</p><h2>바이러스 도감</h2></div>
        <span><b id="catalog-filter-count">${VIRUS_CATALOG.length}</b> / ${VIRUS_CATALOG.length}종</span>
      </div>
      <p class="catalog-count-note">기본 항목 ${VIRUS_CATALOG.length} · 변이 표본은 별도 집계</p>
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
      <div class="observation-preset-list" role="radiogroup" aria-label="바이러스 기본 항목 ${VIRUS_CATALOG.length}종">${viruses}</div>
      <p class="catalog-empty" id="catalog-empty" hidden>조건에 맞는 항목이 없어요.</p>
      <article class="model-card observatory-preset-description" id="observation-preset-description"></article>
    </section>`;
}

export function observationInfoMarkup(): string {
  const partButtons = Object.values(OBSERVATION_PARTS)
    .map(
      (part) => `
        <button class="part-list-button" data-observation-part="${part.id}" type="button" hidden>
          <span><strong>${part.name}</strong><small>${part.summary}</small></span><b>선택</b>
        </button>`,
    )
    .join('');
  const layerControls = Object.entries(LAYER_LABELS)
    .map(
      ([id, label]) =>
        `<label data-observation-layer-row="${id}" hidden><input data-observation-layer="${id}" type="checkbox" checked /><span>${label}</span></label>`,
    )
    .join('');
  const compareOptions = VIRUS_CATALOG.map(
    (virus) =>
      `<option value="${virus.id}">${virus.shortName} · ${virus.genomeLabel}</option>`,
  ).join('');

  return `
    <section class="observatory-info">
      <div class="current-actions" data-observation-section="structure">
        <button id="toggle-favorite" type="button" aria-pressed="false">☆ 즐겨찾기</button>
        <button id="next-discovery" type="button">다음 발견</button>
        <button id="save-image" type="button">이미지 저장</button>
      </div>

      <section class="manual-observation-card" aria-label="수동 구조 관찰" data-observation-section="structure">
        <div class="panel-heading"><div><p class="eyebrow">MANUAL INSPECTION</p><h2>직접 구조 관찰</h2></div><span id="active-slot-badge">A</span></div>
        <p>카메라와 표본은 스스로 움직이지 않아요. 선택·종 변경 뒤에도 현재 구도를 유지해요.</p>
        <div class="structural-actions">
          <button data-structural-reveal="peel" type="button">겉층 벗기기</button>
          <button data-structural-reveal="cutaway" type="button">점진 단면</button>
          <button data-structural-reveal="exploded" type="button">공간 분해</button>
          <button id="structure-reassemble" type="button">재조립</button>
        </div>
      </section>

      <div class="control-group view-control-group" data-observation-section="structure">
        <div class="control-label"><span>구조 보기</span><output id="observation-view-label">외관</output></div>
        <div class="segmented-view" role="group" aria-label="구조 표현">
          <button class="is-active" data-observation-view="surface" type="button">외관</button>
          <button data-observation-view="transparent" type="button">반투명</button>
          <button data-observation-view="section" type="button">단면</button>
          <button data-observation-view="exploded" type="button">분해</button>
        </div>
      </div>
      <div class="control-group" data-explosion-control data-observation-section="structure" hidden>
        <div class="control-label"><label for="observation-explosion">분해 거리</label><output id="observation-explosion-value">62%</output></div>
        <input id="observation-explosion" type="range" min="0" max="100" value="62" />
      </div>
      <div class="control-group" data-section-control data-observation-section="structure" hidden>
        <div class="control-label"><label for="observation-section-offset">절단 위치</label><output id="observation-section-value">0.00</output></div>
        <input id="observation-section-offset" type="range" min="-100" max="100" value="0" />
      </div>
      <div class="switch-row observation-switches" data-observation-section="structure">
        <label><input id="observation-genome" type="checkbox" /><span>유전체 표시</span></label>
      </div>
      <div class="layer-controls" data-observation-layers data-observation-section="structure">
        <span>현재 항목의 구조 레이어</span>${layerControls}
      </div>

      <details class="observatory-details" data-observation-section="structure" open>
        <summary><span><small>PART EXPLORER</small>부위별로 살펴보기</span></summary>
        <div class="part-list" id="observation-part-list">${partButtons}</div>
      </details>

      <section class="comparison-panel feature-panel" data-observation-section="comparison">
        <div class="panel-heading"><div><p class="eyebrow">A / B COMPARE</p><h2>두 표본 비교</h2></div><span id="comparison-state">꺼짐</span></div>
        <label class="stacked-field">B 표본<select id="compare-virus">${compareOptions}</select></label>
        <div class="comparison-actions"><button class="primary-action" id="comparison-add" type="button">비교에 추가</button><button id="comparison-swap" type="button" hidden>서로 바꾸기</button><button id="comparison-close" type="button" hidden>비교 종료</button></div>
        <label class="wide-switch" id="comparison-link-row" hidden><input id="comparison-linked" type="checkbox" checked /><span>조작 연결</span></label>
        <div id="comparison-scale-controls" hidden>
          <div class="segmented-view" role="group" aria-label="크기 비교 방식">
            <button class="is-active" data-comparison-scale="normalized" type="button">같은 크기로</button>
            <button data-comparison-scale="physical" type="button">실제 크기 비율</button>
          </div>
          <p class="comparison-note" id="comparison-scale-note">같은 화면 길이로 맞춰 구조를 비교해요. 실제 비율이 아니에요.</p>
          <div class="dimension-grid" id="comparison-dimensions"></div>
        </div>
      </section>

      <section class="variant-panel feature-panel" data-observation-section="comparison">
        <div class="panel-heading"><div><p class="eyebrow">SPECIMENS</p><h2>표본·변이 차이</h2></div><span id="variant-count">0</span></div>
        <label class="stacked-field">A 표본<select id="variant-a"><option value="">기본 표본</option></select></label>
        <label class="stacked-field" id="variant-b-row" hidden>B 표본<select id="variant-b"><option value="">기본 표본</option></select></label>
        <div id="variant-changes" class="variant-changes"><p>등록된 비교 표본을 선택하면 근거가 있는 영역 차이를 표시해요.</p></div>
      </section>

      <section class="scanner-panel feature-panel" data-observation-section="structure">
        <div class="panel-heading"><div><p class="eyebrow">STRUCTURE SCANNER</p><h2>얇은 단층 보기</h2></div><label class="compact-switch"><input id="scanner-enabled" type="checkbox" /><span>켜기</span></label></div>
        <p>같은 실제 기하의 얇은 slab를 조립 상태에서 렌더링해요. 종료하면 이전 분해량을 복원해요.</p>
        <div id="scanner-controls" hidden>
          <label class="stacked-field">로컬 축<select id="scanner-axis"><option value="x">X축</option><option value="y">Y축</option><option value="z" selected>Z축</option></select></label>
          <div class="control-group"><div class="control-label"><label for="scanner-position">위치</label><output id="scanner-position-value">50%</output></div><input id="scanner-position" type="range" min="0" max="100" value="50" /></div>
          <div class="control-group"><div class="control-label"><label for="scanner-thickness">단층 두께</label><output id="scanner-thickness-value">8%</output></div><input id="scanner-thickness" type="range" min="1" max="30" value="8" /></div>
          <label class="wide-switch" id="scanner-link-row" hidden><input id="scanner-linked" type="checkbox" checked /><span>A/B 정규화 위치 연결</span></label>
          <small>같은 50%가 두 표본의 같은 해부학적 부위라는 뜻은 아니에요.</small>
        </div>
        <canvas id="scanner-canvas" class="scanner-canvas" aria-label="구조 스캐너 단층 화면"></canvas>
      </section>

      <section class="decoration-panel feature-panel" data-observation-section="settings">
        <div class="panel-heading"><div><p class="eyebrow">AMBIENCE</p><h2>장식 효과</h2></div></div>
        <label class="stacked-field">강도<select id="decoration-level"><option value="off">끄기</option><option value="subtle" selected>은은하게</option><option value="rich">풍부하게</option></select></label>
        <label class="wide-switch"><input id="decoration-paused" type="checkbox" /><span>파티클 정지</span></label>
        <p>공간감을 위한 장식이며 감염력·변이·물리 농도를 나타내지 않아요.</p>
      </section>

      <div class="fact-box source-fact" data-observation-section="settings">
        <span>구조 근거와 표현 한계</span>
        <p id="observation-evidence"></p>
        <p id="observation-simplification"></p>
        <div class="source-links compact" id="observation-source-links"></div>
      </div>
      <details class="developer-metrics" data-observation-section="settings"><summary>개발용 렌더 정보</summary><small id="render-budget">렌더 예산 측정 대기</small></details>
    </section>`;
}

export function observationFooterMarkup(): string {
  return `
    <div class="observation-bar manual-bar">
      <div class="manual-help"><strong>수동 조작</strong><span>드래그 회전 · 우클릭/Shift+드래그 이동 · 휠 확대 · 터치 회전/핀치</span></div>
      <button id="reset-camera" type="button">전체 보기</button>
      <div class="camera-step-controls" role="group" aria-label="접근 가능한 카메라 조작">
        <button data-camera-step="left" type="button" aria-label="왼쪽으로 회전">↶</button>
        <button data-camera-step="right" type="button" aria-label="오른쪽으로 회전">↷</button>
        <button data-camera-step="up" type="button" aria-label="위로 회전">↑</button>
        <button data-camera-step="down" type="button" aria-label="아래로 회전">↓</button>
        <button data-camera-step="pan-left" type="button" aria-label="왼쪽으로 이동">⇤</button>
        <button data-camera-step="pan-right" type="button" aria-label="오른쪽으로 이동">⇥</button>
        <button data-camera-step="zoom-in" type="button">확대 +</button>
        <button data-camera-step="zoom-out" type="button">축소 −</button>
      </div>
    </div>`;
}
