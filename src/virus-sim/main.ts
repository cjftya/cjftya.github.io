import './styles.css';
import { VirusSimApp } from './app';

const root = document.querySelector<HTMLElement>('#virus-sim-app');
if (!root) throw new Error('Virus Sim root element was not found.');

let app: VirusSimApp | null = null;

try {
  app = new VirusSimApp(root);
} catch (error) {
  console.error(error);
  const viewport = root.querySelector<HTMLElement>('#viewport');
  if (viewport) {
    viewport.replaceChildren();
    viewport.innerHTML = `
      <section class="webgl-fallback" role="status">
        <p class="eyebrow">3D CONTEXT UNAVAILABLE</p>
        <h2>이 브라우저에서는 3D 미시세계를 열 수 없어요.</h2>
        <p>하드웨어 가속과 WebGL2를 사용할 수 있는 최신 브라우저에서 다시 열어주세요.</p>
        <button type="button" onclick="location.reload()">다시 시도</button>
      </section>`;
    root
      .querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(
        'button, input, select',
      )
      .forEach((control) => {
        if (!control.closest('.webgl-fallback')) control.disabled = true;
      });
  } else {
    root.innerHTML = `
      <main class="startup-error">
        <p>3D 관찰실을 시작하지 못했어요.</p>
        <h1>WebGL2를 사용할 수 있는 최신 브라우저에서 다시 열어주세요.</h1>
        <button type="button" onclick="location.reload()">다시 시도</button>
        <a href="/">Garden으로 돌아가기</a>
      </main>`;
  }
}

window.addEventListener(
  'pagehide',
  () => {
    app?.dispose();
    app = null;
  },
  { once: true },
);
