import { OBSERVATION_PARTS, OBSERVATION_PRESETS } from '../model/observationPresets';

export function observationControlsMarkup(): string {
  const presets = OBSERVATION_PRESETS.map(
    (preset, index) => `
      <button class="observation-preset-card${index === 0 ? ' is-active' : ''}" data-observation-preset="${preset.id}" type="button">
        <span class="preset-silhouette" data-silhouette="${preset.silhouette}" aria-hidden="true"></span>
        <span><strong>${preset.shortName}</strong><small>${preset.genomeLabel}</small></span>
      </button>`,
  ).join('');

  return `
    <section class="mode-panel observatory-controls" data-mode-panel="observatory">
      <div class="panel-heading">
        <p class="eyebrow">SINGLE PARTICLE OBSERVATORY</p>
        <h2>관찰할 바이러스</h2>
      </div>
      <div class="observation-preset-list" role="radiogroup" aria-label="관찰 바이러스 형태">${presets}</div>
      <article class="model-card observatory-preset-description" id="observation-preset-description"></article>

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
      <div class="layer-controls" data-envelope-layers hidden>
        <span>외피형 레이어</span>
        <label><input data-observation-layer="envelope" type="checkbox" checked />외피·돌기</label>
        <label><input data-observation-layer="capsid" type="checkbox" checked />내부 캡시드</label>
        <label><input data-observation-layer="genome" type="checkbox" checked />유전체 층</label>
      </div>
      <p class="field-note observatory-hint">드래그로 회전하고 휠이나 핀치로 확대해요. 짧게 누르면 부위를 선택해요.</p>
    </section>`;
}

export function observationInfoMarkup(): string {
  const partButtons = Object.values(OBSERVATION_PARTS)
    .map(
      (part) => `
        <button class="part-list-button" data-observation-part="${part.id}" type="button">
          <span><strong>${part.name}</strong><small>${part.summary}</small></span><b>보기</b>
        </button>`,
    )
    .join('');

  return `
    <section class="mode-panel observatory-info" data-mode-panel="observatory">
      <details class="observatory-details" open>
        <summary><span><small>PART EXPLORER</small>부위별로 살펴보기</span></summary>
        <div class="part-list" id="observation-part-list">${partButtons}</div>
      </details>

      <div class="demo-section">
        <div class="panel-heading">
          <p class="eyebrow">GUIDED VIEW</p>
          <h2>안내 재생</h2>
        </div>
        <button class="demo-card" id="start-structure-tour" type="button">
          <span>약 20초</span><strong>구조 둘러보기</strong><small>표면 → 단면 → 분해 → 전체</small>
        </button>
        <button class="demo-card phage-demo" id="start-phage-demo" data-phage-demo-only type="button">
          <span>동작 설명</span><strong>파지 유전체 전달</strong><small>부착 · 꼬리집 수축 · 전달 경로</small>
        </button>
        <div class="demo-timeline" id="demo-timeline" hidden>
          <div class="control-label"><span id="demo-kind-label">구조 둘러보기</span><output id="demo-progress-value">0%</output></div>
          <input id="demo-progress" type="range" min="0" max="1000" value="0" />
          <div class="demo-actions">
            <button id="demo-toggle" type="button">Ⅱ 일시정지</button>
            <button id="demo-rewind" type="button">처음으로</button>
            <button id="demo-exit" type="button">수동 관찰</button>
          </div>
          <p id="demo-status-copy">안내를 재생하고 있어요.</p>
        </div>
      </div>

      <div class="fact-box observatory-fact">
        <span>단순화 모델</span>
        <p>움직임과 전달 시간은 자세히 보기 위한 가상 계수예요. 실제 온도·점성·감염 속도를 뜻하지 않아요.</p>
        <small id="render-budget">렌더 예산 측정 대기</small>
      </div>
    </section>`;
}

export function observationFooterMarkup(): string {
  return `
    <footer class="observation-bar" data-observatory-only>
      <div class="run-controls">
        <button class="primary-action" id="observation-play-pause" type="button">Ⅱ 정지</button>
        <button id="observation-restart" type="button">다시 시작</button>
        <button id="observation-return" type="button">대상으로 돌아가기</button>
      </div>
      <div class="speed-controls observation-speed" role="group" aria-label="관찰 배속">
        <span>배속</span>
        <button data-observation-speed="0.25" type="button">0.25×</button>
        <button data-observation-speed="0.5" type="button">0.5×</button>
        <button class="is-active" data-observation-speed="1" type="button">1×</button>
        <button data-observation-speed="2" type="button">2×</button>
      </div>
      <div class="view-toggles motion-toggles">
        <label><input id="observation-translation" type="checkbox" checked />이동</label>
        <label><input id="observation-rotation" type="checkbox" checked />회전</label>
      </div>
      <div class="run-meta"><span id="observation-tick">tick 0</span><span id="observation-status">추적 중</span></div>
    </footer>`;
}
