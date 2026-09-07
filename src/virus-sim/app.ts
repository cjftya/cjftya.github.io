import { RunRecorder, downloadRun } from './experiments/runHistory';
import {
  DEFAULT_CONFIG,
  FIXED_DT,
  PART_DESCRIPTIONS,
  STRUCTURE_PRESETS,
  type StructurePresetId,
} from './model/presets';
import type {
  BacteriumPhase,
  ReceptorDensity,
  RecognitionCondition,
  RunSummary,
  SimulationConfig,
  SimulationEvent,
  SimulationSnapshot,
  StartPlacement,
} from './model/types';
import { VirusScene, type SelectionDetails } from './rendering/VirusScene';
import { createSimulation } from './simulation';
import { renderAppLayout, requiredElement } from './ui/layout';

const MAX_TICKS_PER_FRAME = 12;
const UI_UPDATE_INTERVAL = 0.12;

interface ChartSample {
  time: number;
  free: number;
  completed: number;
  released: number;
}

export class VirusSimApp {
  private readonly shell: HTMLElement;
  private readonly scene: VirusScene;
  private readonly recorder = new RunRecorder();
  private simulation = createSimulation(DEFAULT_CONFIG, 41327);
  private mode: 'structure' | 'infection' = 'structure';
  private running = false;
  private speed = 1;
  private accumulator = 0;
  private lastFrameTime = performance.now();
  private lastUiTime = 0;
  private animationFrame = 0;
  private previousRun: RunSummary | null = null;
  private chartSamples: ChartSample[] = [];
  private selected: SelectionDetails | null = null;
  private activePreset: StructurePresetId = 'icosahedral';
  private disposed = false;
  private readonly renderInterval = window.matchMedia('(pointer: coarse)').matches
    ? 1000 / 30
    : 0;
  private lastRenderTime = 0;

  constructor(private readonly root: HTMLElement) {
    renderAppLayout(root);
    this.shell = requiredElement(root, '.virus-app');
    const viewport = requiredElement<HTMLElement>(root, '#viewport');
    this.scene = new VirusScene(viewport, (selection) =>
      this.updateSelection(selection),
    );
    this.bindControls();
    this.scene.showStructure(this.activePreset);
    this.updatePresetDescription();
    this.updateSelection({
      title: PART_DESCRIPTIONS.capsid.name,
      description: PART_DESCRIPTIONS.capsid.role,
      kind: 'part',
    });
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.scene.dispose();
    this.root.replaceChildren();
  }

  private bindControls(): void {
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-mode-button]')
      .forEach((button) => {
        button.addEventListener('click', () =>
          this.switchMode(
            button.dataset.modeButton === 'infection' ? 'infection' : 'structure',
          ),
        );
      });

    this.root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        this.activePreset = button.dataset.preset as StructurePresetId;
        this.root
          .querySelectorAll('[data-preset]')
          .forEach((item) => item.classList.toggle('is-active', item === button));
        this.scene.showStructure(this.activePreset);
        this.scene.setExplosion(Number(this.input('#explode-range').value));
        this.scene.setSection(this.checkbox('#structure-section').checked);
        this.scene.setGenomeVisible(this.checkbox('#structure-genome').checked);
        this.updatePresetDescription();
        this.text(
          '#stage-label',
          `STRUCTURE · ${this.activePreset.replace('-', ' ').toUpperCase()}`,
        );
      });
    });

    this.input('#explode-range').addEventListener('input', (event) => {
      const value = Number((event.target as HTMLInputElement).value);
      this.scene.setExplosion(value);
      this.text('#explode-value', `${value}%`);
    });
    this.checkbox('#structure-section').addEventListener('change', (event) =>
      this.scene.setSection((event.target as HTMLInputElement).checked),
    );
    this.checkbox('#structure-genome').addEventListener('change', (event) =>
      this.scene.setGenomeVisible((event.target as HTMLInputElement).checked),
    );
    this.checkbox('#infection-section').addEventListener('change', (event) =>
      this.scene.setSection((event.target as HTMLInputElement).checked),
    );
    this.checkbox('#infection-genome').addEventListener('change', (event) =>
      this.scene.setGenomeVisible((event.target as HTMLInputElement).checked),
    );

    this.root
      .querySelectorAll<HTMLSelectElement>('[data-quality-select]')
      .forEach((select) => {
        select.addEventListener('change', () => {
          const quality = select.value === 'low' ? 'low' : 'high';
          this.scene.setQuality(quality);
          this.root
            .querySelectorAll<HTMLSelectElement>('[data-quality-select]')
            .forEach((other) => (other.value = quality));
        });
      });
    this.button('#reset-camera').addEventListener('click', () =>
      this.scene.resetCamera(),
    );
    this.button('#focus-selection').addEventListener('click', () =>
      this.scene.focusSelection(),
    );
    this.button('#start-pause').addEventListener('click', () => this.toggleRunning());
    this.button('#single-step').addEventListener('click', () => this.singleStep());
    this.button('#reset-run').addEventListener('click', () => this.resetRun());
    this.button('#new-seed').addEventListener('click', () => {
      const random = new Uint32Array(1);
      crypto.getRandomValues(random);
      this.input('#seed-input').value = String(random[0] || 1);
      this.markPending();
    });
    this.button('#export-run').addEventListener('click', () =>
      downloadRun(this.recorder.createSummary(this.simulation.getSnapshot())),
    );

    for (const selector of [
      '#seed-input',
      '#phage-count',
      '#recognition-select',
      '#density-select',
      '#placement-select',
    ]) {
      requiredElement<HTMLInputElement | HTMLSelectElement>(
        this.root,
        selector,
      ).addEventListener('input', () => {
        this.text('#phage-count-value', this.input('#phage-count').value);
        this.markPending();
      });
    }

    this.root.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => {
      button.addEventListener('click', () => {
        this.speed = Number(button.dataset.speed ?? 1);
        this.root
          .querySelectorAll('[data-speed]')
          .forEach((item) => item.classList.toggle('is-active', item === button));
      });
    });

    const guide = requiredElement<HTMLDialogElement>(this.root, '#model-guide');
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-open-guide]')
      .forEach((button) => button.addEventListener('click', () => guide.showModal()));
    this.root.addEventListener('virus-context-status', (event) => {
      const status = (event as CustomEvent<string>).detail;
      const message = requiredElement<HTMLElement>(this.root, '#context-message');
      message.hidden = status !== 'lost';
    });
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  private switchMode(mode: 'structure' | 'infection'): void {
    if (this.mode === mode) return;
    this.pause();
    this.mode = mode;
    this.shell.dataset.mode = mode;
    this.root.querySelectorAll<HTMLElement>('[data-mode-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
    this.root.querySelectorAll<HTMLElement>('[data-mode-button]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.modeButton === mode);
    });
    requiredElement<HTMLElement>(this.root, '[data-infection-only]').hidden =
      mode !== 'infection';
    if (mode === 'infection') {
      const snapshot = this.simulation.getSnapshot();
      this.scene.showInfection(snapshot);
      this.scene.setSection(this.checkbox('#infection-section').checked);
      this.scene.setGenomeVisible(this.checkbox('#infection-genome').checked);
      this.text('#stage-label', 'INFECTION · PAUSED');
      this.updateUi(snapshot);
    } else {
      this.scene.showStructure(this.activePreset);
      this.scene.setExplosion(Number(this.input('#explode-range').value));
      this.scene.setSection(this.checkbox('#structure-section').checked);
      this.scene.setGenomeVisible(this.checkbox('#structure-genome').checked);
      this.text(
        '#stage-label',
        `STRUCTURE · ${this.activePreset.replace('-', ' ').toUpperCase()}`,
      );
    }
  }

  private toggleRunning(): void {
    const snapshot = this.simulation.getSnapshot();
    if (snapshot.status === 'completed') return;
    if (this.running) this.pause();
    else {
      this.running = true;
      this.simulation.setStatus('running');
      this.accumulator = 0;
      this.lastFrameTime = performance.now();
      this.text('#start-pause', 'Ⅱ 일시정지');
      this.text('#stage-label', 'INFECTION · RUNNING');
    }
  }

  private pause(): void {
    this.running = false;
    if (this.simulation.getSnapshot().status !== 'completed')
      this.simulation.setStatus('paused');
    this.text('#start-pause', '▶ 시작');
    if (this.mode === 'infection') this.text('#stage-label', 'INFECTION · PAUSED');
  }

  private singleStep(): void {
    if (this.simulation.getSnapshot().status === 'completed') return;
    this.pause();
    this.simulation.setStatus('ready');
    this.stepSimulation();
    this.simulation.setStatus('paused');
    const snapshot = this.simulation.getSnapshot();
    this.scene.showInfection(snapshot);
    this.updateUi(snapshot);
  }

  private resetRun(): void {
    const current = this.simulation.getSnapshot();
    if (current.tick > 0) this.previousRun = this.recorder.createSummary(current);
    this.pause();
    this.recorder.reset();
    this.chartSamples = [];
    const config = this.readPendingConfig();
    const seed = sanitizeSeed(Number(this.input('#seed-input').value));
    this.input('#seed-input').value = String(seed);
    this.simulation.reset(config, seed);
    this.button('#start-pause').disabled = false;
    this.text('#start-pause', '▶ 시작');
    requiredElement<HTMLElement>(this.root, '#pending-badge').hidden = true;
    const snapshot = this.simulation.getSnapshot();
    this.scene.showInfection(snapshot);
    this.updateUi(snapshot);
  }

  private readPendingConfig(): SimulationConfig {
    return {
      initialPhageCount: Number(this.input('#phage-count').value),
      recognition: this.select('#recognition-select').value as RecognitionCondition,
      receptorDensity: this.select('#density-select').value as ReceptorDensity,
      placement: this.select('#placement-select').value as StartPlacement,
    };
  }

  private markPending(): void {
    requiredElement<HTMLElement>(this.root, '#pending-badge').hidden = false;
  }

  private readonly frame = (time: number): void => {
    if (this.disposed) return;
    const frameDelta = Math.min(0.1, Math.max(0, (time - this.lastFrameTime) / 1000));
    this.lastFrameTime = time;
    let delayed = false;

    if (this.mode === 'infection' && this.running) {
      this.accumulator += frameDelta * this.speed;
      let ticks = 0;
      while (this.accumulator >= FIXED_DT && ticks < MAX_TICKS_PER_FRAME) {
        this.stepSimulation();
        this.accumulator -= FIXED_DT;
        ticks += 1;
      }
      delayed = this.accumulator >= FIXED_DT;
      if (delayed)
        this.accumulator = Math.min(this.accumulator, FIXED_DT * MAX_TICKS_PER_FRAME);

      const snapshot = this.simulation.getSnapshot();
      if (snapshot.status === 'completed') {
        this.running = false;
        this.text('#start-pause', '실행 완료');
        (this.button('#start-pause') as HTMLButtonElement).disabled = true;
        this.text(
          '#stage-label',
          snapshot.bacterium.phase === 'blocked'
            ? 'INFECTION · BLOCKED'
            : 'INFECTION · RELEASED',
        );
      }
      if (
        time - this.lastUiTime >= UI_UPDATE_INTERVAL * 1000 ||
        snapshot.status === 'completed'
      ) {
        this.updateUi(snapshot);
        this.lastUiTime = time;
      }
      if (this.shouldRender(time)) {
        this.scene.update(snapshot, Math.min(1, this.accumulator / FIXED_DT));
      }
    } else {
      if (this.shouldRender(time)) {
        this.scene.update(
          this.mode === 'infection' ? this.simulation.getSnapshot() : null,
          1,
        );
      }
    }

    this.text('#lag-status', delayed ? '계산 지연' : '');
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private stepSimulation(): void {
    this.simulation.step(FIXED_DT);
    this.recorder.append(this.simulation.drainEvents());
    const snapshot = this.simulation.getSnapshot();
    const last = this.chartSamples.at(-1);
    if (
      !last ||
      snapshot.modelTime - last.time >= 0.45 ||
      snapshot.status === 'completed'
    ) {
      this.chartSamples.push({
        time: snapshot.modelTime,
        free: snapshot.counts.free,
        completed: snapshot.counts.completed,
        released: snapshot.counts.released,
      });
      if (this.chartSamples.length > 100) this.chartSamples.shift();
    }
  }

  private updateUi(snapshot: SimulationSnapshot): void {
    const phase = PHASE_COPY[snapshot.bacterium.phase];
    this.text('#phase-name', phase.name);
    this.text('#phase-description', phase.description);
    this.text('#model-time', `${snapshot.modelTime.toFixed(2)} MT`);
    this.text('#stat-free', snapshot.counts.free);
    this.text('#stat-delivering', snapshot.counts.delivering);
    this.text('#stat-completed', snapshot.counts.completed);
    this.text('#stat-released', snapshot.counts.released);
    this.text('#tick-status', `tick ${snapshot.tick.toLocaleString('ko-KR')}`);
    this.renderEvents(this.recorder.latest());
    this.renderChart();
    this.renderComparison(snapshot);
    if (this.selected?.phageId !== undefined) {
      const phage = snapshot.phages.find((item) => item.id === this.selected?.phageId);
      this.text(
        '#selection-state',
        phage ? `현재 상태 · ${PHAGE_LABELS[phage.phase]}` : '',
      );
    } else if (this.selected?.kind === 'bacterium') {
      this.text('#selection-state', `현재 상태 · ${phase.name}`);
    }
    this.text(
      '#event-count',
      `${this.recorder.createSummary(snapshot).events.length}건`,
    );
  }

  private renderEvents(events: readonly SimulationEvent[]): void {
    const list = requiredElement<HTMLOListElement>(this.root, '#event-list');
    if (events.length === 0) {
      list.innerHTML = '<li class="empty-event">실험을 시작하면 사건이 기록돼요.</li>';
      return;
    }
    list.replaceChildren(
      ...events.map((event) => {
        const item = document.createElement('li');
        const time = document.createElement('time');
        time.textContent = event.modelTime.toFixed(2);
        const copy = document.createElement('span');
        copy.textContent = eventCopy(event);
        item.append(time, copy);
        return item;
      }),
    );
  }

  private renderChart(): void {
    const svg = requiredElement<SVGSVGElement>(this.root, '#history-chart');
    if (this.chartSamples.length < 2) {
      svg.replaceChildren();
      return;
    }
    const maxTime = Math.max(...this.chartSamples.map((sample) => sample.time), 1);
    const maxValue = Math.max(
      ...this.chartSamples.flatMap((sample) => [
        sample.free,
        sample.completed,
        sample.released,
      ]),
      1,
    );
    const path = (
      key: 'free' | 'completed' | 'released',
      className: string,
    ): SVGPathElement => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const data = this.chartSamples
        .map((sample, index) => {
          const x = (sample.time / maxTime) * 280;
          const y = 80 - (sample[key] / maxValue) * 72;
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      element.setAttribute('d', data);
      element.setAttribute('class', className);
      return element;
    };
    svg.replaceChildren(
      path('free', 'chart-free'),
      path('completed', 'chart-completed'),
      path('released', 'chart-released'),
    );
  }

  private renderComparison(snapshot: SimulationSnapshot): void {
    const container = requiredElement<HTMLElement>(this.root, '#comparison');
    if (!this.previousRun) {
      container.className = 'comparison-empty';
      container.textContent = '아직 비교할 이전 실행이 없어요.';
      return;
    }
    const currentDelivery =
      snapshot.firstDeliveryTime === null
        ? '관찰 구간 내 없음'
        : `${snapshot.firstDeliveryTime.toFixed(2)} MT`;
    const previousDelivery =
      this.previousRun.firstDeliveryTime === null
        ? '관찰 구간 내 없음'
        : `${this.previousRun.firstDeliveryTime.toFixed(2)} MT`;
    container.className = 'comparison-grid';
    container.innerHTML = `
      <span></span><strong>현재</strong><strong>직전</strong>
      <span>시드</span><b>${snapshot.seed}</b><b>${this.previousRun.seed}</b>
      <span>최초 전달</span><b>${currentDelivery}</b><b>${previousDelivery}</b>
      <span>방출</span><b>${snapshot.counts.released}</b><b>${this.previousRun.releasedPhages}</b>
      <span>상태</span><b>${runStateLabel(snapshot.status === 'completed' ? 'completed' : 'in-progress')}</b><b>${runStateLabel(this.previousRun.state)}</b>
    `;
  }

  private updatePresetDescription(): void {
    const preset =
      STRUCTURE_PRESETS.find((item) => item.id === this.activePreset) ??
      STRUCTURE_PRESETS[0]!;
    const card = requiredElement<HTMLElement>(this.root, '#preset-description');
    card.innerHTML = `<span>형태 분류</span><h3>${preset.name}</h3><p>${preset.description}</p>${preset.id === 'tailed-phage' ? '<small>이 프리셋만 감염 실험의 일반화된 파지와 연결돼요.</small>' : '<small>이 형태에는 v1 감염 알고리즘을 적용하지 않아요.</small>'}`;
  }

  private updateSelection(selection: SelectionDetails | null): void {
    this.selected = selection;
    if (!selection) {
      this.text('#selection-title', '대상을 선택해보세요');
      this.text(
        '#selection-description',
        '3D 장면의 구조나 개체를 누르면 역할과 상태를 볼 수 있어요.',
      );
      this.text('#selection-state', '');
      return;
    }
    this.text('#selection-title', selection.title);
    this.text('#selection-description', selection.description);
    this.text('#selection-state', '');
    if (this.mode === 'infection') this.updateUi(this.simulation.getSnapshot());
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) this.pause();
    this.accumulator = 0;
    this.lastFrameTime = performance.now();
  };

  private shouldRender(time: number): boolean {
    if (this.renderInterval > 0 && time - this.lastRenderTime < this.renderInterval) {
      return false;
    }
    this.lastRenderTime = time;
    return true;
  }

  private text(selector: string, value: string | number): void {
    requiredElement<HTMLElement>(this.root, selector).textContent = String(value);
  }

  private input(selector: string): HTMLInputElement {
    return requiredElement<HTMLInputElement>(this.root, selector);
  }

  private checkbox(selector: string): HTMLInputElement {
    return requiredElement<HTMLInputElement>(this.root, selector);
  }

  private select(selector: string): HTMLSelectElement {
    return requiredElement<HTMLSelectElement>(this.root, selector);
  }

  private button(selector: string): HTMLButtonElement {
    return requiredElement<HTMLButtonElement>(this.root, selector);
  }
}

const PHASE_COPY: Record<BacteriumPhase, { name: string; description: string }> = {
  susceptible: {
    name: '감염 전',
    description:
      '파지가 표면과 접촉할 수 있지만 아직 감염 주기를 소유한 개체는 없어요.',
  },
  receiving: {
    name: '유전체 전달',
    description: '안정 부착한 파지의 유전체가 꼬리 통로를 따라 숙주 안으로 이동해요.',
  },
  producing: {
    name: '내부 생산',
    description: '숙주의 추상 자원을 소비해 유전체와 구조 부품 묶음을 축적해요.',
  },
  assembling: {
    name: '입자 조립',
    description: '유전체 하나와 부품 묶음 하나를 소비해 완성 입자 하나를 조립해요.',
  },
  lysing: {
    name: '용균 진행',
    description: '생산과 조립을 멈추고 세균 외곽이 무너질 준비를 해요.',
  },
  lysed: {
    name: '방출 완료',
    description: '용균 시작 시 존재하던 완성 입자만 바깥으로 방출했어요.',
  },
  blocked: {
    name: '전달 차단',
    description: '내부 검증용 추상 방어 분기에서 감염 주기가 종료됐어요.',
  },
};

const PHAGE_LABELS = {
  free: '자유 확산',
  contacting: '표면 접촉',
  attached: '가역 부착',
  delivering: '유전체 전달',
  spent: '빈 외부 입자',
} as const;

function eventCopy(event: SimulationEvent): string {
  const phage = event.phageId === undefined ? '' : `파지 #${event.phageId} · `;
  const labels: Record<SimulationEvent['type'], string> = {
    contact: '세균 표면과 접촉',
    'contact-rejected':
      event.reason === 'recognition-mismatch'
        ? '인식 불일치로 이탈'
        : event.reason === 'host-occupied'
          ? '이미 진행 중인 숙주에서 이탈'
          : '부착 시간 안에 안정화되지 않음',
    attached: '표면에 가역 부착',
    detached: '전달 전 부착 해제',
    'delivery-started': '유전체 전달 시작',
    'delivery-completed': '유전체 전달 완료',
    'infection-blocked': '추상 방어 판정으로 차단',
    'production-started': '내부 생산 시작',
    'assembly-started': '구조 조립 시작',
    'phage-assembled': `완성 입자 조립 · 누적 ${event.count ?? 0}`,
    'lysis-started': `용균 시작 · 완성 ${event.count ?? 0}`,
    released: `새 입자 ${event.count ?? 0}개 방출`,
  };
  return phage + labels[event.type];
}

function sanitizeSeed(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(4294967295, Math.trunc(value)));
}

function runStateLabel(state: RunSummary['state']): string {
  if (state === 'completed') return '완료';
  if (state === 'interrupted') return '중단';
  return '진행 중';
}
