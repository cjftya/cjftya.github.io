import type { WebGLRenderer } from 'three';
import type { EnvironmentController } from './EnvironmentController';
import { WEATHER_LABELS, WEATHER_PRESETS } from './weather';
import type { WeatherPreset } from './weather';

export function createEnvironmentDebug(
  environment: EnvironmentController,
  renderer: WebGLRenderer,
  invalidate: () => void,
  setShadows: (value: boolean) => void,
) {
  const panel = document.createElement('details');
  panel.id = 'environment-debug';
  panel.open = true;
  panel.innerHTML = `<summary>환경 검수</summary>
    <label>시간 <output id="environment-time-label"></output><input id="environment-time" aria-label="시간" type="range" min="0" max="23.99" step="0.01"></label>
    <div class="debug-row"><button type="button" id="environment-play"></button><label>속도 <select id="environment-speed" aria-label="시간 속도"><option value="0.25">0.25×</option><option value="1" selected>1×</option><option value="4">4×</option><option value="12">12×</option></select></label></div>
    <label>날씨 <select id="environment-weather" aria-label="날씨">${WEATHER_PRESETS.map((p) => `<option value="${p}">${WEATHER_LABELS[p]}</option>`).join('')}</select></label>
    <div class="debug-row"><label><input id="environment-clouds" type="checkbox" checked> 구름</label><label><input id="environment-fog" type="checkbox" checked> 안개</label><label><input id="environment-shadows" type="checkbox"> 그림자</label></div>
    <output id="environment-stats"></output>`;
  document.querySelector('.oasis-shell')!.append(panel);
  const time = panel.querySelector<HTMLInputElement>('#environment-time')!;
  const timeLabel = panel.querySelector<HTMLOutputElement>('#environment-time-label')!;
  const play = panel.querySelector<HTMLButtonElement>('#environment-play')!;
  const stats = panel.querySelector<HTMLOutputElement>('#environment-stats')!;
  const shadows = panel.querySelector<HTMLInputElement>('#environment-shadows')!;
  shadows.checked = renderer.shadowMap.enabled;
  const events = new AbortController();
  const options = { signal: events.signal };
  time.addEventListener(
    'input',
    () => {
      environment.setTime(Number(time.value));
      environment.setPlaying(false);
      invalidate();
    },
    options,
  );
  play.addEventListener(
    'click',
    () => {
      environment.setPlaying(!environment.state.playing);
      invalidate();
    },
    options,
  );
  panel.querySelector('#environment-speed')!.addEventListener(
    'change',
    (event) => {
      environment.setSpeed(Number((event.target as HTMLSelectElement).value));
      invalidate();
    },
    options,
  );
  panel.querySelector('#environment-weather')!.addEventListener(
    'change',
    (event) => {
      environment.setWeather(
        (event.target as HTMLSelectElement).value as WeatherPreset,
      );
      invalidate();
    },
    options,
  );
  panel.querySelector('#environment-clouds')!.addEventListener(
    'change',
    (event) => {
      environment.cloudsEnabled = (event.target as HTMLInputElement).checked;
      environment.invalidate();
      invalidate();
    },
    options,
  );
  panel.querySelector('#environment-fog')!.addEventListener(
    'change',
    (event) => {
      environment.fogEnabled = (event.target as HTMLInputElement).checked;
      environment.invalidate();
      invalidate();
    },
    options,
  );
  shadows.addEventListener(
    'change',
    () => {
      setShadows(shadows.checked);
      invalidate();
    },
    options,
  );
  function refresh(frameMs: number): void {
    const hour = environment.state.timeOfDay;
    if (document.activeElement !== time) time.value = String(hour);
    timeLabel.value = `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor((hour % 1) * 60)).padStart(2, '0')}`;
    play.textContent = environment.state.playing ? '일시정지' : '재생';
    const info = renderer.info;
    stats.value = `${frameMs.toFixed(1)} ms / rendered frame\nDraw calls ${info.render.calls} · triangles ${info.render.triangles.toLocaleString()}\nTextures ${info.memory.textures} · DPR ${renderer.getPixelRatio().toFixed(2)}\nCloud puffs ${environment.cloudsEnabled ? environment.clouds.count : 0} · rain ${environment.rain.mesh.visible ? environment.rain.count : 0}\nWeather blend ${(environment.state.weatherBlend * 100).toFixed(0)}% · W: wireframe`;
  }
  refresh(0);
  return {
    refresh,
    dispose() {
      events.abort();
      panel.remove();
    },
  };
}
