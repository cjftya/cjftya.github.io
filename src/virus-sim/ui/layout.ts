import {
  observationControlsMarkup,
  observationFooterMarkup,
  observationInfoMarkup,
} from './observationPanel';

export function renderAppLayout(root: HTMLElement): void {
  root.innerHTML = `
    <div class="virus-app">
      <header class="app-header">
        <div class="brand-block">
          <a class="home-link" href="/" aria-label="Jelly Garden 홈으로">← Garden</a>
          <div><p class="eyebrow">MANUAL STRUCTURE LAB · v3.5</p><h1>Virus Sim</h1></div>
        </div>
        <div class="observatory-title"><span class="live-dot"></span><strong>수동 구조 관찰실</strong><small>기본 항목 71종 · 비교 표본 별도</small></div>
        <div class="header-actions">
          <label>글자 크기<select id="font-scale"><option value="100">100%</option><option value="115">115%</option><option value="130">130%</option></select></label>
          <label>품질<select id="quality-select"><option value="standard" selected>Standard</option><option value="enhanced">Enhanced</option><option value="performance">Performance</option></select></label>
          <button id="open-guide" type="button">모델 안내</button>
        </div>
      </header>

      <main class="workspace">
        <aside class="control-panel panel-scroll" aria-label="바이러스 도감">${observationControlsMarkup()}</aside>
        <section class="stage" aria-label="3D 바이러스 구조 관찰 화면">
          <div id="viewport" class="viewport"></div>
          <div class="microscope-depth" aria-hidden="true"></div>
          <div class="stage-overlay top-left"><span class="live-dot"></span><span id="stage-label">OBSERVATORY · T4</span></div>
          <div class="stage-overlay top-right viewport-actions"><button id="reset-camera" type="button">전체 보기</button></div>
          <div class="slot-label slot-a" id="slot-label-a"><b>A</b><span id="slot-name-a">T4</span></div>
          <div class="slot-label slot-b" id="slot-label-b" hidden><b>B</b><span id="slot-name-b"></span></div>
          <div class="scale-legend" id="scale-legend"><span id="scale-bar"></span><b id="scale-legend-copy">같은 크기로 맞춤 · 실제 비율 아님</b></div>
          <div class="context-message" id="context-message" hidden>3D 컨텍스트가 중단됐어요. 브라우저가 복구하는 동안 잠시 기다려주세요.</div>
        </section>
        <aside class="observation-panel panel-scroll" aria-label="구조 탐색과 출처">
          <section class="selection-card" aria-live="polite"><p class="eyebrow">SELECTED</p><h2 id="selection-title">부위를 선택해보세요</h2><p id="selection-description">3D 장면이나 부위 목록을 누르면 역할과 표현 한계를 볼 수 있어요.</p></section>
          ${observationInfoMarkup()}
        </aside>
      </main>

      ${observationFooterMarkup()}
    </div>

    <dialog id="model-guide" class="model-guide">
      <form method="dialog"><button class="dialog-close" aria-label="닫기">×</button></form>
      <p class="eyebrow">MODEL BOUNDARY</p><h2>어디까지 구조 근거인가요?</h2>
      <div class="guide-grid">
        <article><span class="grade evidence">관찰 자료 기반</span><h3>입자 상태와 형태</h3><p>PDB·EMDB·ICTV 자료로 확인된 범위를 항목별로 표시해요.</p></article>
        <article><span class="grade simplified">절차 재구성</span><h3>브라우저용 모델</h3><p>원자 좌표를 복제하지 않고 반복 수와 표면 세부를 줄인 경량 기하로 다시 만들었어요.</p></article>
        <article><span class="grade assumed">계열 개념 표현</span><h3>자료 한계</h3><p>직접 구조가 부족한 세부는 계열 공통 개념 또는 정보 부족으로 분명히 구분해요.</p></article>
      </div>
      <div class="guide-copy"><p>같은 크기 비교는 실제 비율이 아니며, 실제 크기 모드는 별도 대표 치수와 공통 눈금을 사용해요.</p><p>VLP·빈 capsid·부분 구조를 사용한 항목은 현재 종 설명과 출처 범위에 따로 표시해요.</p><p>회전·이동·확대는 모두 직접 조작하며 종 변경이나 부위 선택이 카메라를 움직이지 않아요.</p></div>
      <div class="source-links"><a href="https://www.rcsb.org/" target="_blank" rel="noreferrer">RCSB PDB ↗</a><a href="https://www.ebi.ac.uk/emdb/" target="_blank" rel="noreferrer">EMDB ↗</a><a href="https://ictv.global/report" target="_blank" rel="noreferrer">ICTV Report ↗</a><a href="https://github.com/cjftya/cjftya.github.io/blob/master/docs/virus-sim.md" target="_blank" rel="noreferrer">모델 문서 ↗</a></div>
    </dialog>`;
}

export function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Virus Sim element: ${selector}`);
  return element;
}
