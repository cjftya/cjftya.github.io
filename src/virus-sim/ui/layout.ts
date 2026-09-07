export function renderAppLayout(root: HTMLElement): void {
  root.innerHTML = `
    <div class="virus-app" data-mode="structure">
      <header class="app-header">
        <div class="brand-block">
          <a class="home-link" href="/" aria-label="Jelly Garden 홈으로">← Garden</a>
          <div>
            <p class="eyebrow">INTERACTIVE BIOLOGY MODEL</p>
            <h1>Virus Sim</h1>
          </div>
        </div>
        <nav class="mode-tabs" aria-label="관찰 모드">
          <button class="mode-tab is-active" type="button" data-mode-button="structure">구조 관찰</button>
          <button class="mode-tab" type="button" data-mode-button="infection">감염 실험</button>
        </nav>
        <div class="header-actions">
          <label class="quality-control">품질
            <select id="quality-select" data-quality-select>
              <option value="high">선명하게</option>
              <option value="low">가볍게</option>
            </select>
          </label>
          <button class="icon-button" id="open-guide" data-open-guide type="button">모델 안내</button>
        </div>
      </header>

      <main class="workspace">
        <aside class="control-panel panel-scroll" aria-label="실험 설정">
          <div class="mobile-tools">
            <label>렌더 품질
              <select data-quality-select><option value="high">선명하게</option><option value="low">가볍게</option></select>
            </label>
            <button data-open-guide type="button">모델 안내</button>
          </div>
          <section class="mode-panel" data-mode-panel="structure">
            <div class="panel-heading">
              <p class="eyebrow">STRUCTURE</p>
              <h2>형태 프리셋</h2>
            </div>
            <div class="preset-list" role="radiogroup" aria-label="바이러스 형태">
              <button class="preset-card is-active" data-preset="icosahedral" type="button">
                <span class="preset-index">01</span><span><strong>정이십면체형</strong><small>대칭 캡시드</small></span>
              </button>
              <button class="preset-card" data-preset="tailed-phage" type="button">
                <span class="preset-index">02</span><span><strong>꼬리형 파지</strong><small>머리 · 꼬리 · 인식 섬유</small></span>
              </button>
              <button class="preset-card" data-preset="filamentous" type="button">
                <span class="preset-index">03</span><span><strong>필라멘트형</strong><small>나선 배열 입자</small></span>
              </button>
            </div>
            <div class="control-group">
              <div class="control-label"><label for="explode-range">구조 분해</label><output id="explode-value">0%</output></div>
              <input id="explode-range" type="range" min="0" max="100" value="0" />
              <p class="field-note">배치된 설명용 부품을 바깥으로 옮겨 내부 관계를 보여줘요.</p>
            </div>
            <div class="switch-row">
              <label><input id="structure-section" type="checkbox" checked /><span>머리 단면</span></label>
              <label><input id="structure-genome" type="checkbox" checked /><span>유전체</span></label>
            </div>
            <article class="model-card" id="preset-description"></article>
          </section>

          <section class="mode-panel" data-mode-panel="infection" hidden>
            <div class="panel-heading with-badge">
              <div><p class="eyebrow">EXPERIMENT</p><h2>초기 조건</h2></div>
              <span class="pending-badge" id="pending-badge" hidden>다음 실행</span>
            </div>
            <label class="field-row">시드
              <span class="input-action"><input id="seed-input" type="number" min="1" max="4294967295" value="41327" /><button id="new-seed" type="button">새 시드</button></span>
            </label>
            <label class="field-row">초기 파지 수 <output id="phage-count-value">24</output>
              <input id="phage-count" type="range" min="1" max="64" value="24" />
            </label>
            <label class="field-row">표면 인식 조건
              <select id="recognition-select"><option value="match">일치</option><option value="mismatch">불일치</option></select>
            </label>
            <label class="field-row">인식 부위 분포
              <select id="density-select"><option value="sparse">적음</option><option value="default" selected>기본</option><option value="dense">많음</option></select>
            </label>
            <label class="field-row">시작 배치
              <select id="placement-select"><option value="guided">가이드 배치</option><option value="random">무작위 배치</option></select>
            </label>
            <p class="assumption-note"><span>가상 조건</span> 농도·감염률이 아닌 비교용 모형 설정이에요.</p>
          </section>

          <section class="selection-card" aria-live="polite">
            <p class="eyebrow">SELECTED</p>
            <h2 id="selection-title">캡시드 (capsid)</h2>
            <p id="selection-description">유전체를 감싸는 단백질 껍질이에요. 지질 외피와는 구별해요.</p>
            <p class="selection-state" id="selection-state"></p>
          </section>
        </aside>

        <section class="stage" aria-label="3D 시뮬레이션">
          <div id="viewport" class="viewport"></div>
          <div class="stage-overlay top-left">
            <span class="live-dot"></span><span id="stage-label">STRUCTURE · ICOSAHEDRAL</span>
          </div>
          <div class="stage-overlay top-right viewport-actions">
            <button id="reset-camera" type="button">전체 보기</button>
            <button id="focus-selection" type="button">선택 대상 보기</button>
          </div>
          <div class="scale-legend"><span></span>정규화된 기준 길이</div>
          <div class="context-message" id="context-message" hidden>3D 컨텍스트가 중단됐어요. 브라우저가 복구하는 동안 잠시 기다려주세요.</div>
        </section>

        <aside class="observation-panel panel-scroll" aria-label="관찰 결과">
          <section class="mode-panel" data-mode-panel="structure">
            <div class="panel-heading"><p class="eyebrow">HOW TO OBSERVE</p><h2>관찰 방법</h2></div>
            <ol class="observation-steps">
              <li><span>1</span><p><strong>회전과 확대</strong>드래그하고 휠이나 두 손가락으로 확대해요.</p></li>
              <li><span>2</span><p><strong>부품 선택</strong>껍질·유전체·꼬리를 눌러 역할을 확인해요.</p></li>
              <li><span>3</span><p><strong>분해와 단면</strong>설명용 연출로 내부 배치를 비교해요.</p></li>
            </ol>
            <div class="fact-box"><span>구조 경계</span><p>DNA는 완성된 3D 좌표를 직접 저장하지 않아요. 유전정보의 발현과 조립 과정이 구조 형성에 관여해요.</p></div>
          </section>

          <section class="mode-panel" data-mode-panel="infection" hidden>
            <div class="phase-header"><div><p class="eyebrow">CURRENT PHASE</p><h2 id="phase-name">감염 전</h2></div><span id="model-time">0.00 MT</span></div>
            <p class="phase-description" id="phase-description">파지들이 점성 환경을 단순화한 무작위 이동을 시작하기 전이에요.</p>
            <div class="stat-grid">
              <div><span>자유 입자</span><strong id="stat-free">24</strong></div>
              <div><span>전달 중</span><strong id="stat-delivering">0</strong></div>
              <div><span>내부 완성</span><strong id="stat-completed">0</strong></div>
              <div><span>누적 방출</span><strong id="stat-released">0</strong></div>
            </div>
            <div class="mini-chart"><div class="chart-legend"><span class="free">자유</span><span class="inside">내부 완성</span><span class="released">방출</span></div><svg id="history-chart" viewBox="0 0 280 86" preserveAspectRatio="none" aria-label="개수 추이"></svg></div>
            <div class="event-section"><div class="section-title"><h3>주요 사건</h3><span id="event-count">0건</span></div><ol class="event-list" id="event-list"><li class="empty-event">실험을 시작하면 사건이 기록돼요.</li></ol></div>
            <div class="compare-section"><div class="section-title"><h3>직전 실행 비교</h3></div><div id="comparison" class="comparison-empty">아직 비교할 이전 실행이 없어요.</div></div>
          </section>
        </aside>
      </main>

      <footer class="experiment-bar" data-infection-only hidden>
        <div class="run-controls">
          <button class="primary-action" id="start-pause" type="button">▶ 시작</button>
          <button id="single-step" type="button">한 단계</button>
          <button id="reset-run" type="button">초기화</button>
        </div>
        <div class="speed-controls" role="group" aria-label="계산 배속">
          <span>배속</span>
          <button data-speed="0.25" type="button">0.25×</button>
          <button class="is-active" data-speed="1" type="button">1×</button>
          <button data-speed="2" type="button">2×</button>
          <button data-speed="4" type="button">4×</button>
        </div>
        <div class="view-toggles">
          <label><input id="infection-section" type="checkbox" checked />세균 단면</label>
          <label><input id="infection-genome" type="checkbox" checked />유전체</label>
        </div>
        <div class="run-meta"><span id="tick-status">tick 0</span><span id="lag-status"></span><button id="export-run" type="button">JSON 내보내기</button></div>
      </footer>
    </div>

    <dialog id="model-guide" class="model-guide">
      <form method="dialog"><button class="dialog-close" aria-label="닫기">×</button></form>
      <p class="eyebrow">MODEL BOUNDARY</p><h2>무엇을 계산하고, 무엇을 설명하나요?</h2>
      <div class="guide-grid">
        <article><span class="grade evidence">관찰 근거</span><h3>구조와 역할</h3><p>캡시드·꼬리·표면 인식 부품, 유전체 전달의 관계는 생물학 문헌을 출발점으로 해요.</p></article>
        <article><span class="grade simplified">단순화 모델</span><h3>확산·생산·조립</h3><p>복잡한 분자 과정은 브라우저에서 비교할 수 있는 상태와 개수로 줄였어요.</p></article>
        <article><span class="grade assumed">가상 조건</span><h3>모형 시간과 계수</h3><p>시간·확률·입자 수는 시연값이며 실제 감염률, 치료 효과, 농도를 예측하지 않아요.</p></article>
      </div>
      <div class="guide-copy">
        <p>v1은 일반화한 꼬리 달린 DNA 파지의 용균 과정을 다뤄요. 파지 몸체 전체가 세균 안으로 들어가는 것이 아니라 유전체가 전달되고, 외부에는 빈 입자가 남도록 표현해요.</p>
        <p>모든 바이러스나 파지가 같은 방식으로 용균하지 않아요. 용원성·만성 방출과 실제 치료 효과 예측은 현재 계산 범위 밖이에요.</p>
      </div>
      <div class="source-links"><a href="https://ictv.global/report/information/virus-properties" target="_blank" rel="noreferrer">ICTV Virus Properties ↗</a><a href="https://www.nature.com/articles/s41467-024-52752-1" target="_blank" rel="noreferrer">파지 구조 연구 ↗</a><a href="https://github.com/cjftya/cjftya.github.io/blob/master/docs/virus-sim.md" target="_blank" rel="noreferrer">전체 모델 문서 ↗</a></div>
    </dialog>
  `;
}

export function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Virus Sim element: ${selector}`);
  return element;
}
