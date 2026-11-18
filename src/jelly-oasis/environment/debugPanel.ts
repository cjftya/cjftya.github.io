import type { WebGLRenderer } from 'three';
import type { RealitySync } from './RealitySync';
import type { EnvironmentController } from './EnvironmentController';
import { WEATHER_LABELS, WEATHER_PRESETS } from './weather';
import type { WeatherPreset } from './weather';

export function createEnvironmentPanel(
  environment: EnvironmentController,
  renderer: WebGLRenderer,
  invalidate: () => void,
  setShadows: (value: boolean) => void,
  debugEnabled = false,
  viewSky?: () => void,
  reality?: RealitySync,
) {
  const panel = document.createElement('details');
  panel.id = 'environment-debug';
  panel.open = false;
  panel.innerHTML = `<summary aria-expanded="false">Environment · 환경</summary>
    <div ${reality ? '' : 'hidden'}>
      <label><input id="environment-real-time" type="checkbox" checked> 서울 현재 시간</label>
      <label><input id="environment-real-weather" type="checkbox" checked> 서울 현재 날씨</label>
      <p id="environment-sync-status" role="status"></p>
      <small><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo</a> · 기상 모델 기반</small>
    </div>
    <label>시간 <output id="environment-time-label"></output><input id="environment-time" aria-label="시간" type="range" min="0" max="23.99" step="0.01"></label>
    <div class="debug-row"><button type="button" id="environment-play"></button><label>속도 <select id="environment-speed" aria-label="시간 속도"><option value="0.25">0.25×</option><option value="1" selected>1× (16분/일)</option><option value="4">4×</option><option value="12">12×</option></select></label></div>
    <label>날씨 <select id="environment-weather" aria-label="날씨">${WEATHER_PRESETS.map((p) => `<option value="${p}">${WEATHER_LABELS[p]}</option>`).join('')}</select></label>
    <label><input id="environment-auto-weather" type="checkbox"> 랜덤 날씨 · 실제 날씨 연동 해제</label>
    <button type="button" id="environment-sky" ${viewSky ? '' : 'hidden'}>하늘 보기</button>
    <div class="debug-row" ${debugEnabled ? '' : 'hidden'}><label><input id="environment-clouds" type="checkbox"> 구름</label><label><input id="environment-fog" type="checkbox" checked> 안개</label><label><input id="environment-shadows" type="checkbox"> 그림자</label></div>
    <output id="environment-stats" ${debugEnabled ? '' : 'hidden'}></output>`;
  document.querySelector('.oasis-shell')!.append(panel);
  const time = panel.querySelector<HTMLInputElement>('#environment-time')!;
  const timeLabel = panel.querySelector<HTMLOutputElement>('#environment-time-label')!;
  const play = panel.querySelector<HTMLButtonElement>('#environment-play')!;
  const stats = panel.querySelector<HTMLOutputElement>('#environment-stats')!;
  const shadows = panel.querySelector<HTMLInputElement>('#environment-shadows')!;
  shadows.checked = renderer.shadowMap.enabled;
  const autoWeather = panel.querySelector<HTMLInputElement>(
    '#environment-auto-weather',
  )!;
  const weather = panel.querySelector<HTMLSelectElement>('#environment-weather')!;
  const realTime = panel.querySelector<HTMLInputElement>('#environment-real-time')!;
  const realWeather = panel.querySelector<HTMLInputElement>(
    '#environment-real-weather',
  )!;
  const syncStatus = panel.querySelector<HTMLElement>('#environment-sync-status')!;
  const events = new AbortController();
  const options = { signal: events.signal };
  realTime.addEventListener(
    'change',
    () => {
      environment.setRealtimeTime(realTime.checked);
      invalidate();
    },
    options,
  );
  realWeather.addEventListener(
    'change',
    () => {
      environment.liveWeather = realWeather.checked;
      environment.setAutoWeather(false);
      if (!realWeather.checked) environment.clearLiveConditions();
      invalidate();
    },
    options,
  );
  panel
    .querySelector('#environment-sky')!
    .addEventListener('click', () => viewSky?.(), options);
  autoWeather.addEventListener(
    'change',
    () => {
      environment.setAutoWeather(autoWeather.checked);
      invalidate();
    },
    options,
  );
  panel.addEventListener(
    'toggle',
    () => {
      panel.querySelector('summary')!.setAttribute('aria-expanded', String(panel.open));
      refresh(0);
    },
    options,
  );
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
    realTime.checked = environment.realtimeTime;
    realWeather.checked = environment.liveWeather;
    syncStatus.textContent = environment.liveWeather
      ? (reality?.status ?? '')
      : '수동 날씨';
    play.disabled = environment.realtimeTime;
    const speed = panel.querySelector<HTMLSelectElement>('#environment-speed')!;
    speed.disabled = environment.realtimeTime;
    panel.querySelector('summary')!.textContent =
      `환경 · ${timeLabel.value} · ${WEATHER_LABELS[environment.state.weather]}`;
    play.textContent = environment.state.playing ? '일시정지' : '재생';
    autoWeather.checked = environment.autoWeather.enabled;
    weather.value = environment.state.weather;
    shadows.checked = renderer.shadowMap.enabled;
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
