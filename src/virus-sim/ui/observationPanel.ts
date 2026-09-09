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
  const options = [...VIRUS_CATALOG]
    .sort((left, right) => left.name.localeCompare(right.name, 'ko'))
    .map(
      (virus) =>
        `<option value="${virus.id}"${virus.id === 't4' ? ' selected' : ''}>${virus.name}</option>`,
    )
    .join('');
  return `
    <section class="specimen-overview" aria-labelledby="virus-picker-title">
      <label class="virus-picker" for="virus-select">
        <span id="virus-picker-title">바이러스 선택</span>
        <select id="virus-select">${options}</select>
      </label>
      <article class="specimen-summary" id="observation-preset-description" aria-live="polite"></article>
    </section>`;
}

export function observationInfoMarkup(): string {
  const partButtons = Object.values(OBSERVATION_PARTS)
    .map(
      (part) => `
        <button class="part-list-button" data-observation-part="${part.id}" type="button" hidden>
          <span><strong>${part.name}</strong><small>${part.summary}</small></span><b>보기</b>
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
    <section class="primary-controls" aria-labelledby="structure-title">
      <div class="section-heading"><div><p class="eyebrow">STRUCTURE</p><h2 id="structure-title">구조 보기</h2></div><button id="save-image" type="button">이미지 저장</button></div>
      <div class="segmented-view" role="group" aria-label="구조 표현">
        <button class="is-active" data-observation-view="surface" aria-pressed="true" type="button">외관</button>
        <button data-observation-view="transparent" aria-pressed="false" type="button">반투명</button>
        <button data-observation-view="section" aria-pressed="false" type="button">단면</button>
        <button data-observation-view="exploded" aria-pressed="false" type="button">분해</button>
      </div>
      <div class="control-group" data-explosion-control hidden>
        <div class="control-label"><label for="observation-explosion">분해 거리</label><output id="observation-explosion-value">62%</output></div>
        <input id="observation-explosion" type="range" min="0" max="100" value="62" />
      </div>
      <div class="control-group" data-section-control hidden>
        <div class="control-label"><label for="observation-section-offset">절단 위치</label><output id="observation-section-value">0.00</output></div>
        <input id="observation-section-offset" type="range" min="-100" max="100" value="0" />
      </div>
      <label class="switch-control"><input id="observation-genome" type="checkbox" /><span>유전체 표시</span></label>
    </section>

    <details class="detail-section">
      <summary><span><small>EXPLORE</small>부위와 레이어</span></summary>
      <div class="detail-body">
        <section class="selection-card" aria-live="polite"><p class="eyebrow">SELECTED</p><h3 id="selection-title">부위를 선택해보세요</h3><p id="selection-description">3D 장면이나 아래 부위 목록을 누르면 구조 정보를 볼 수 있어요.</p></section>
        <div class="part-list" id="observation-part-list">${partButtons}</div>
        <div class="layer-controls"><strong>표시할 구조 레이어</strong>${layerControls}</div>
      </div>
    </details>

    <details class="detail-section">
      <summary><span><small>SCANNER</small>단층 보기</span></summary>
      <div class="detail-body scanner-panel">
        <label class="switch-control"><input id="scanner-enabled" type="checkbox" /><span>구조 스캐너 켜기</span></label>
        <div id="scanner-controls" hidden>
          <label class="stacked-field" for="scanner-axis"><span>로컬 축</span><select id="scanner-axis"><option value="x">X축</option><option value="y">Y축</option><option value="z" selected>Z축</option></select></label>
          <div class="control-group"><div class="control-label"><label for="scanner-position">위치</label><output id="scanner-position-value">50%</output></div><input id="scanner-position" type="range" min="0" max="100" value="50" /></div>
          <div class="control-group"><div class="control-label"><label for="scanner-thickness">두께</label><output id="scanner-thickness-value">8%</output></div><input id="scanner-thickness" type="range" min="1" max="30" value="8" /></div>
        </div>
        <canvas id="scanner-canvas" class="scanner-canvas" aria-label="바이러스 구조 단층 화면" hidden></canvas>
      </div>
    </details>

    <details class="detail-section history-section">
      <summary><span><small>CONTEXT</small>역사와 실제 영향</span></summary>
      <div class="detail-body" id="history-impact" aria-live="polite"></div>
    </details>

    <details class="detail-section">
      <summary><span><small>SETTINGS</small>화면 설정</span></summary>
      <div class="detail-body settings-grid">
        <label class="stacked-field" for="quality-select"><span>렌더 품질</span><select id="quality-select"><option value="standard" selected>Standard</option><option value="enhanced">Enhanced</option><option value="performance">Performance</option></select></label>
        <label class="stacked-field" for="font-scale"><span>글자 크기</span><select id="font-scale"><option value="100">100%</option><option value="115">115%</option><option value="130">130%</option></select></label>
        <label class="stacked-field" for="decoration-level"><span>배경 입자</span><select id="decoration-level"><option value="off">끄기</option><option value="subtle" selected>켜기</option></select></label>
        <label class="switch-control"><input id="decoration-paused" type="checkbox" /><span>입자 움직임 정지</span></label>
        <small id="render-budget">렌더 정보 측정 대기</small>
      </div>
    </details>

    <details class="detail-section source-section">
      <summary><span><small>SOURCES</small>구조 근거와 표현 한계</span></summary>
      <div class="detail-body"><p id="observation-evidence"></p><div id="observation-simplification"></div><div class="source-links" id="observation-source-links"></div></div>
    </details>`;
}
