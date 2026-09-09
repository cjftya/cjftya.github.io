import { labPanelMarkup, labToolbarMarkup } from './labMarkup';
import {
  observationControlsMarkup,
  observationFooterMarkup,
  observationInfoMarkup,
} from './observationPanel';

export function renderAppLayout(root: HTMLElement): void {
  root.innerHTML = `
    <div class="virus-app" data-workspace-mode="observation" data-observation-tab="catalog" data-lab-tab="specimens">
      <header class="app-header">
        <div class="brand-block">
          <a class="home-link" href="/" aria-label="Jelly Garden 홈으로">← Garden</a>
          <div><p class="eyebrow">MICRO LAB · v4</p><h1>Virus Sim</h1></div>
        </div>
        <div class="mode-switch" role="tablist" aria-label="작업 공간">
          <button class="is-active" data-workspace-mode-button="observation" role="tab" aria-selected="true" type="button">구조 관찰</button>
          <button data-workspace-mode-button="lab" role="tab" aria-selected="false" type="button">Physics Arena</button>
        </div>
        <div class="header-actions">
          <label>글자<select id="font-scale"><option value="100">100%</option><option value="115">115%</option><option value="130">130%</option></select></label>
          <label>품질<select id="quality-select"><option value="standard" selected>Standard</option><option value="enhanced">Enhanced</option><option value="performance">Performance</option></select></label>
          <button id="open-guide" type="button">안내</button>
        </div>
      </header>

      <section class="stage" aria-label="Virus Sim 3D 화면">
        <div id="viewport" class="viewport"></div>
        <div class="microscope-depth" aria-hidden="true"></div>
        <div class="stage-overlay top-left"><span class="live-dot"></span><span id="stage-label">OBSERVATORY · T4</span></div>
        <div class="stage-overlay top-right lab-stage-state" id="lab-stage-state" hidden>READY</div>
        <div class="slot-label slot-a" id="slot-label-a"><b>A</b><span id="slot-name-a">T4</span></div>
        <div class="slot-label slot-b" id="slot-label-b" hidden><b>B</b><span id="slot-name-b"></span></div>
        <div class="scale-legend" id="scale-legend"><span id="scale-bar"></span><b id="scale-legend-copy">같은 크기로 맞춤 · 실제 비율 아님</b></div>
        <div class="context-message" id="context-message" hidden>3D 컨텍스트가 중단됐어요. 실험은 정지됐으며 복구 후 직접 재개할 수 있어요.</div>
      </section>

      <section class="workspace-controls" aria-label="공통 조작">
        <button class="inspection-return" id="return-to-lab" type="button" hidden>← 실험으로 돌아가기</button>
        <div data-mode-toolbar="observation">${observationFooterMarkup()}</div>
        <div data-mode-toolbar="lab" hidden>${labToolbarMarkup()}</div>
      </section>

      <nav class="tool-tabs" aria-label="작업 도구">
        <div data-mode-tabs="observation" role="tablist">
          <button class="is-active" data-workspace-tab="catalog" role="tab" aria-selected="true" type="button">도감</button>
          <button data-workspace-tab="structure" role="tab" aria-selected="false" type="button">구조</button>
          <button data-workspace-tab="comparison" role="tab" aria-selected="false" type="button">비교</button>
          <button data-workspace-tab="settings" role="tab" aria-selected="false" type="button">설정</button>
        </div>
        <div data-mode-tabs="lab" role="tablist" hidden>
          <button class="is-active" data-workspace-tab="specimens" role="tab" aria-selected="true" type="button">표본</button>
          <button data-workspace-tab="environment" role="tab" aria-selected="false" type="button">환경</button>
          <button data-workspace-tab="results" role="tab" aria-selected="false" type="button">결과</button>
          <button data-workspace-tab="settings" role="tab" aria-selected="false" type="button">설정</button>
        </div>
      </nav>

      <main class="tool-panel panel-scroll" id="tool-panel">
        <section class="workspace-panel catalog-panel" data-workspace-panel="observation-catalog" aria-label="바이러스 도감">${observationControlsMarkup()}</section>
        <section class="workspace-panel observation-panel" data-workspace-panel="observation-tools" aria-label="구조 탐색과 출처" hidden>
          <section class="selection-card" aria-live="polite" data-observation-section="structure"><p class="eyebrow">SELECTED</p><h2 id="selection-title">부위를 선택해보세요</h2><p id="selection-description">3D 장면이나 부위 목록을 누르면 역할과 표현 한계를 볼 수 있어요.</p></section>
          ${observationInfoMarkup()}
        </section>
        <section class="workspace-panel lab-panel" data-workspace-panel="lab" aria-label="Physics Arena 도구" hidden>${labPanelMarkup()}</section>
      </main>
    </div>

    <dialog id="model-guide" class="model-guide">
      <form method="dialog"><button class="dialog-close" aria-label="닫기">×</button></form>
      <p class="eyebrow">MODEL BOUNDARY</p><h2>어디까지 근거가 있나요?</h2>
      <div class="guide-grid">
        <article><span class="grade evidence">구조 관찰</span><h3>고품질 표본</h3><p>PDB·EMDB·ICTV 자료 범위와 절차 재구성의 한계를 항목별로 표시해요.</p></article>
        <article><span class="grade simplified">Physics Arena</span><h3>형태 surrogate</h3><p>정밀 CFD가 아닌 형태·방향·접촉을 확인하는 lab-unit 기반 개념 근사예요.</p></article>
        <article><span class="grade assumed">수동 카메라</span><h3>직접 관찰</h3><p>자동 추적·투어 없이 회전·이동·확대를 직접 조작해요.</p></article>
      </div>
      <div class="guide-copy"><p>실험의 흐름 표식과 표본은 같은 velocity field를 사용하며, 장식 파티클은 물리 결과와 분리돼요.</p><p>대표 길이 맞춤은 실제 크기·부피·질량 비율이 아니며 실제 크기 모드는 별도 대표 치수를 사용해요.</p></div>
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
