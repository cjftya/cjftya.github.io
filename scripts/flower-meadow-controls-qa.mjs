import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const output =
  process.env.OASIS_QA_OUTPUT ??
  'artifacts/jelly-oasis/flower-meadow-final-composition-v1';
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '5179',
  '--strictPort',
]);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('error', reject);
  server.on('exit', (code) => reject(new Error(`preview exited ${code}`)));
});
let browser;
const result = { errors: [], states: {} };
try {
  browser = await chromium.launch({
    executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const p = await context.newPage();
  p.setDefaultTimeout(90000);
  p.on('pageerror', (e) => result.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') result.errors.push(m.text());
  });
  await p.goto('http://127.0.0.1:5179/projects/jelly-oasis/?debug');
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  const snap = () => p.evaluate(() => window.__oasisLandmark.snapshot());
  const change = async (id, checked) =>
    p.evaluate(
      ([id, checked]) => {
        const e = document.getElementById(id);
        e.checked = checked;
        e.dispatchEvent(new Event('change', { bubbles: true }));
      },
      [id, checked],
    );
  await change('environment-shadows', false);
  assert.equal((await snap()).shadows, false);
  await change('environment-shadows', true);
  assert.equal((await snap()).shadows, true);
  await change('environment-auto-weather', true);
  assert.equal((await snap()).autoWeather.enabled, true);
  await p.evaluate(() => {
    const e = document.getElementById('environment-weather');
    e.value = 'MIST';
    e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForFunction(() => window.__oasisLandmark.snapshot().weatherBlend === 1);
  assert.equal((await snap()).autoWeather.enabled, false);
  assert.equal((await snap()).weather, 'MIST');
  await p.evaluate(() => document.getElementById('environment-play').click());
  await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('environment-play').click());
  const paused = await snap();
  await p.waitForTimeout(200);
  assert.equal((await snap()).timeOfDay, paused.timeOfDay);
  const beforeSky = await snap();
  await p.evaluate(() => document.getElementById('environment-sky').click());
  await p.waitForTimeout(300);
  assert.notDeepEqual((await snap()).target, beforeSky.target);
  await p.click('#reset-view');
  await p.evaluate(() => document.querySelector('[data-view="medium"]').click());
  result.states.landscape = await snap();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForFunction(
    (previous) =>
      window.__oasisLandmark
        .snapshot()
        .camera.some((v, i) => Math.abs(v - previous[i]) > 1e-6),
    result.states.landscape.camera,
    { timeout: 15000 },
  );
  await p.waitForTimeout(200);
  result.states.portrait = await snap();
  assert.notDeepEqual(result.states.portrait.camera, result.states.landscape.camera);
  assert.deepEqual(result.states.portrait.target, result.states.landscape.target);
  await p.mouse.move(190, 370);
  await p.mouse.down();
  await p.mouse.move(245, 405, { steps: 12 });
  await p.mouse.up();
  await p.mouse.wheel(0, -140);
  await p.waitForFunction(
    () => {
      const current = window.__oasisLandmark.snapshot().camera;
      const previous = window.__polishLastCamera;
      window.__polishLastCamera = current;
      const stable =
        previous && current.every((v, i) => Math.abs(v - previous[i]) < 0.00001);
      window.__polishStableFrames = stable ? (window.__polishStableFrames ?? 0) + 1 : 0;
      return window.__polishStableFrames >= 6;
    },
    undefined,
    { polling: 'raf' },
  );
  const moved = await snap();
  result.states.beforeOrbitResize = moved;
  assert.equal(moved.mediumCamera, false);
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(200);
  result.states.afterOrbitResize = await snap();
  assert(
    result.states.afterOrbitResize.camera.every(
      (v, i) => Math.abs(v - moved.camera[i]) < 0.01,
    ),
  );
  await p.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(200);
  await p.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(200);
  const resumed = await snap();
  assert.equal(resumed.modules, 16);
  assert.equal(resumed.waterEffects.solver, 'gpgpu-heightfield');
  result.states.resumed = resumed;
  await p.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  await p.goto('http://127.0.0.1:5179/projects/jelly-oasis/?debug');
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  assert.equal((await snap()).modules, 16);
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
  await context.close();
} finally {
  await writeFile(
    `${output}/controls-qa.json`,
    JSON.stringify(
      result,
      (k, v) =>
        ['phase2', 'shorelineContacts', 'shorelineContactTypes', 'timings'].includes(k)
          ? undefined
          : v,
      2,
    ),
  );
  await browser?.close();
  server.kill();
}
console.log('Environment controls QA passed');
