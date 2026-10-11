import type { PondControls } from './gpgpuPondSurface';
/** Small, removable prototype controls. Created only for the explicit URL opt-in. */
export function createPondPanel(
  configure: (settings: PondControls) => void,
  invalidate: () => void,
  neutral: boolean,
  error: string | null = null,
) {
  const panel = document.createElement('details');
  panel.id = 'gpu-pond-debug';
  panel.open = true;
  panel.style.cssText =
    'position:fixed;bottom:12px;left:12px;z-index:30;padding:10px;background:#14212bea;color:white;border-radius:8px;font:13px sans-serif;max-width:230px';
  panel.innerHTML = '<summary>GPU 수면 프로토타입</summary>';
  const apply = (settings: PondControls) => {
    configure(settings);
    invalidate();
  };
  for (const [key, label, checked] of [
    ['neutral', '중립 재질', neutral],
    ['wireframe', '와이어프레임', false],
    ['paused', '수면 일시정지', false],
  ] as const) {
    const row = document.createElement('label'),
      input = document.createElement('input');
    row.style.display = 'block';
    input.type = 'checkbox';
    input.checked = checked;
    input.onchange = () => apply({ [key]: input.checked });
    row.append(input, label);
    panel.append(row);
  }
  for (const [key, label, min, max, step, value] of [
    ['amplitude', '높이', 0.25, 2, 0.05, 1],
    ['damping', '감쇠 유지율', 0.98, 0.999, 0.001, 0.995],
    ['waveSpeed', '전파 속도', 1, 5, 0.1, 3.5],
  ] as const) {
    const row = document.createElement('label'),
      input = document.createElement('input');
    row.style.display = 'block';
    row.textContent = label;
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.oninput = () => apply({ [key]: Number(input.value) });
    row.append(input);
    panel.append(row);
  }
  for (const [key, label] of [
    ['impulse', '파동 충격'],
    ['reset', '수면 초기화'],
  ] as const) {
    const button = document.createElement('button');
    button.textContent = label;
    button.onclick = () => apply({ [key]: true });
    panel.append(button);
  }
  const flow = document.createElement('select');
  for (const [label, rate] of [
    ['유입 OFF', 0],
    ['유입 NORMAL', 1],
    ['유입 HIGH', 3],
  ] as const) {
    const option = document.createElement('option');
    option.textContent = label;
    option.value = String(rate);
    flow.append(option);
  }
  flow.value = '1';
  // The main debug API already clamps and forwards the same flow setting.
  flow.onchange = () => {
    (
      window as unknown as { __oasisLandmark: { reviewWaterFlow(rate: number): void } }
    ).__oasisLandmark.reviewWaterFlow(Number(flow.value));
  };
  if (error) {
    const status = document.createElement('p');
    status.textContent = 'GPU 수면을 사용할 수 없어 기존 v8로 표시해요.';
    panel.append(status);
    panel
      .querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')
      .forEach((input) => (input.disabled = true));
  }
  panel.append(flow);
  document.body.append(panel);
  return panel;
}
