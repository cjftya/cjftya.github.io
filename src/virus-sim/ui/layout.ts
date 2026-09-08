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
          <div><p class="eyebrow">INTERACTIVE BIOLOGY MODEL · v2.5</p><h1>Virus Sim</h1></div>
        </div>
        <div class="observatory-title"><span class="live-dot"></span><strong>구조 관찰실</strong><small>검증된 실제 바이러스 56종</small></div>
        <div class="header-actions">
          <label>글자 크기<select id="font-scale"><option value="100">100%</option><option value="115">115%</option><option value="130">130%</option></select></label>
          <label>품질<select id="quality-select"><option value="high">선명하게</option><option value="low">가볍게</option></select></label>
          <button id="open-guide" type="button">모델 안내</button>
        </div>
      </header>

      <main class="workspace">
        <aside class="control-panel panel-scroll" aria-label="바이러스 도감">${observationControlsMarkup()}</aside>
        <section class="stage" aria-label="3D 바이러스 구조 관찰 화면">
          <div id="viewport" class="viewport"></div>
          <div class="stage-overlay top-left"><span class="live-dot"></span><span id="stage-label">OBSERVATORY · T4</span></div>
          <div class="stage-overlay top-right viewport-actions"><button id="reset-camera" type="button">전체 보기</button><button id="focus-selection" type="button">선택 대상 보기</button></div>
          <div class="scale-legend"><span></span>종별 정규화 표시</div>
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
        <article><span class="grade evidence">확인한 근거</span><h3>입자 상태와 형태</h3><p>PDB·EMDB·ICTV 자료로 종 정체성, 입자 상태, 주요 윤곽과 층 관계를 확인했어요.</p></article>
        <article><span class="grade simplified">절차 재구성</span><h3>브라우저용 모델</h3><p>원자 좌표를 복제하지 않고 반복 수와 표면 세부를 줄인 경량 기하로 다시 만들었어요.</p></article>
        <article><span class="grade assumed">관찰 연출</span><h3>움직임과 색</h3><p>움직임, 분해 거리와 색은 구조를 이해하기 위한 화면 연출이며 자연 상태 측정값이 아니에요.</p></article>
      </div>
      <div class="guide-copy"><p>각 종은 따로 확대되므로 화면상의 크기로 실제 상대 크기를 비교할 수 없어요.</p><p>VLP·빈 capsid·부분 구조를 사용한 항목은 현재 종 설명과 출처 범위에 따로 표시해요.</p><p>현재 화면은 실제 바이러스의 구조 관찰과 근거 확인에 집중해요.</p></div>
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
