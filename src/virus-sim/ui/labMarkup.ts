import { VIRUS_CATALOG } from '../catalog/registry';

export function labToolbarMarkup(): string {
  return `
    <div class="lab-run-controls" role="group" aria-label="실험 실행 조작">
      <button class="primary-action" id="lab-play" type="button">실행</button>
      <button id="lab-pause" type="button">정지</button>
      <button id="lab-restart" type="button">현재 조건으로 처음부터</button>
    </div>
    <label class="time-scale-control">속도
      <select id="lab-time-scale" aria-label="실험 시간 배율">
        <option value="0.25">0.25×</option><option value="0.5">0.5×</option>
        <option value="1" selected>1×</option><option value="2">2×</option>
      </select>
    </label>
    <output class="lab-clock" id="lab-clock">0.00 sim-s</output>`;
}

export function labPanelMarkup(): string {
  const options = VIRUS_CATALOG.map(
    (entry) =>
      `<option value="${entry.id}">${entry.shortName} · ${entry.genomeLabel}</option>`,
  ).join('');
  return `
    <section class="lab-section" data-lab-section="specimens">
      <div class="panel-heading catalog-heading">
        <div><p class="eyebrow">MULTI-SPECIMEN</p><h2>실험 표본</h2></div>
        <span><b id="lab-specimen-count">4</b> / 8개</span>
      </div>
      <p class="panel-intro">같은 챔버에 여러 형태를 배치해요. 같은 종도 서로 다른 instance로 추가할 수 있어요.</p>
      <label class="stacked-field">도감 항목<select id="lab-virus-select">${options}</select></label>
      <div class="lab-specimen-actions">
        <button class="primary-action" id="lab-add-specimen" type="button">표본 추가</button>
        <button id="lab-replace-specimen" type="button">선택 표본 교체</button>
        <button id="lab-remove-specimen" type="button">선택 표본 제거</button>
      </div>
      <div class="lab-specimen-list" id="lab-specimen-list" role="radiogroup" aria-label="배치된 실험 표본"></div>
      <article class="selection-card lab-selection-card" aria-live="polite">
        <p class="eyebrow">SELECTED SPECIMEN</p>
        <h2 id="lab-selection-title">표본을 선택해보세요</h2>
        <p id="lab-selection-description">3D 화면이나 목록에서 표본을 선택할 수 있어요.</p>
        <button class="primary-action" id="lab-inspect-structure" type="button">고품질 구조 관찰</button>
      </article>
    </section>

    <section class="lab-section" data-lab-section="environment" hidden>
      <div class="panel-heading"><div><p class="eyebrow">CHAMBER & FLOW</p><h2>환경 조건</h2></div><span id="lab-flow-speed">유속 0.92</span></div>
      <p class="panel-intro">lab-unit 기반 개념 근사예요. 유속은 구동 강도와 상대 점성으로 계산돼요.</p>
      <div class="lab-environment-grid">
        <label class="stacked-field">챔버<select id="lab-chamber"><option value="open">기본 챔버</option><option value="obstacle">Obstacle Chamber</option></select></label>
        <label class="stacked-field">흐름<select id="lab-flow-preset"><option value="linear">직선 흐름</option><option value="shear">전단 흐름</option><option value="vortex">와류</option></select></label>
        <label class="stacked-field">방향<select id="lab-flow-direction"><option value="1">정방향</option><option value="-1">역방향</option></select></label>
      </div>
      <div class="control-group"><div class="control-label"><label for="lab-drive">흐름 세기</label><output id="lab-drive-value">0.80</output></div><input id="lab-drive" type="range" min="0" max="200" value="80" /></div>
      <div class="control-group"><div class="control-label"><label for="lab-viscosity">상대 점성</label><output id="lab-viscosity-value">1.00×</output></div><input id="lab-viscosity" type="range" min="25" max="400" value="100" /></div>
      <div class="control-group" id="lab-shear-row" hidden><div class="control-label"><label for="lab-shear">전단 세기</label><output id="lab-shear-value">0.65</output></div><input id="lab-shear" type="range" min="0" max="150" value="65" /></div>
      <div class="control-group" id="lab-vortex-row" hidden><div class="control-label"><label for="lab-vortex">와류 세기</label><output id="lab-vortex-value">0.90</output></div><input id="lab-vortex" type="range" min="0" max="150" value="90" /></div>
      <div class="control-group" id="lab-gap-row" hidden><div class="control-label"><label for="lab-gap">실제 적용 통로 폭</label><output id="lab-gap-value">2.20</output></div><input id="lab-gap" type="range" min="70" max="420" value="220" /></div>
      <label class="wide-switch"><input id="lab-brownian" type="checkbox" /><span>제한된 브라운 이동</span></label>
      <div class="fact-box"><span>화면 피드백</span><p>흐름 표식과 표본은 같은 velocity field를 사용해요. 장식 파티클만 바뀌는 효과가 아니에요.</p></div>
    </section>

    <section class="lab-section" data-lab-section="results" hidden>
      <div class="panel-heading"><div><p class="eyebrow">RUN RESULTS</p><h2>실험 결과</h2></div><span id="lab-run-status">준비</span></div>
      <p id="lab-result-summary" class="panel-intro">실행하면 sim-time과 실제 물리 위치에서 결과를 기록해요.</p>
      <div class="result-actions">
        <button id="lab-replay" type="button">같은 조건으로 재실험</button>
        <button id="lab-swap-positions" type="button">위치 바꿔 재실험</button>
        <label class="wide-switch"><input id="lab-all-trajectories" type="checkbox" /><span>전체 궤적 표시</span></label>
      </div>
      <div class="lab-result-list" id="lab-result-list"></div>
      <div class="fact-box"><span>결과 해석</span><p>단일 실행은 생물학적 우열을 뜻하지 않아요. 미통과는 제한 시간 안의 관찰 결과이며 영구적 불가능 판정이 아니에요.</p></div>
    </section>

    <section class="lab-section" data-lab-section="settings" hidden>
      <div class="panel-heading"><div><p class="eyebrow">LAB SETTINGS</p><h2>실험 설정</h2></div></div>
      <label class="stacked-field">크기 방식<select id="lab-scale-mode"><option value="representative-length">대표 길이 맞춤</option><option value="physical">실제 크기 비율</option></select></label>
      <p id="lab-scale-note" class="panel-intro">대표 길이 맞춤은 실제 크기·부피·질량 비율이 아니에요.</p>
      <label class="stacked-field">실험 제한 시간<select id="lab-duration"><option value="60">60 sim-s</option><option value="120">120 sim-s</option><option value="300">300 sim-s</option></select></label>
      <div class="lab-persistence-actions"><button id="lab-save-config" type="button">설정 1개 저장</button><button id="lab-load-config" type="button">저장 설정 불러오기</button><button id="lab-save-image" type="button">실험 PNG 저장</button></div>
      <div class="fact-box"><span>Physics Arena의 범위</span><p>정밀 CFD나 실제 감염 능력 예측이 아닌, 형태·방향·통로 접촉을 살펴보는 결정적 개념 실험이에요.</p><p id="lab-engine-info">engine virus-lab-v4.0 · fixed 1/120 sim-s</p></div>
    </section>
    <p class="lab-message" id="lab-message" role="status" hidden></p>`;
}
