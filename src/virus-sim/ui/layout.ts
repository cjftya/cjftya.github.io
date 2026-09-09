import { observationControlsMarkup, observationInfoMarkup } from './observationPanel';

export function renderAppLayout(root: HTMLElement): void {
  root.innerHTML = `
    <div class="virus-app">
      <header class="app-header">
        <a class="home-link" href="/" aria-label="Jelly Garden 홈으로">← Garden</a>
        <div class="brand-block"><span class="eyebrow">v4.4</span><h1>Virus Sim</h1></div>
        <button class="guide-button" id="open-guide" type="button">안내</button>
      </header>

      <section class="stage" aria-label="Virus Sim 3D 구조 관찰 화면">
        <div id="viewport" class="viewport"></div>
        <div class="microscope-depth" aria-hidden="true"></div>
        <div class="stage-overlay"><span class="live-dot"></span><span id="stage-label">T4 PHAGE</span></div>
        <div class="gesture-hint">드래그 회전 · 핀치 확대</div>
        <div class="context-message" id="context-message" role="status" hidden>3D 화면 연결이 중단됐어요. 복구되면 자동으로 다시 표시해요.</div>
      </section>

      <main class="content-shell">
        ${observationControlsMarkup()}
        ${observationInfoMarkup()}
      </main>

      <footer class="app-footer">Virus Sim · 3D Virus Structure Viewer</footer>
    </div>

    <dialog id="model-guide" class="model-guide">
      <form method="dialog"><button class="dialog-close" aria-label="닫기">×</button></form>
      <p class="eyebrow">QUICK GUIDE</p>
      <h2>바이러스 구조 관찰</h2>
      <p>화면을 드래그해 회전하고, 휠이나 핀치로 확대해요. 우클릭 또는 Shift+드래그로 위치를 옮길 수 있어요.</p>
      <p>모델은 PDB·EMDB·ICTV 자료를 바탕으로 구조 관계를 단순화한 절차 기하예요. 원자 수준의 완전한 구조를 뜻하지 않아요.</p>
      <div class="source-links"><a href="https://www.rcsb.org/" target="_blank" rel="noreferrer">RCSB PDB ↗</a><a href="https://www.ebi.ac.uk/emdb/" target="_blank" rel="noreferrer">EMDB ↗</a><a href="https://ictv.global/report" target="_blank" rel="noreferrer">ICTV Report ↗</a></div>
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
