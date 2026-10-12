import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { DataUtils } from 'three';
const output = process.env.POND_QA_OUTPUT ?? 'artifacts/jelly-oasis/pond-only-v1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.POND_QA_BROWSER ??
    (existsSync('/tmp/chromium') ? '/tmp/chromium' : undefined),
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  headless: true,
});
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '5175',
]);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('error', reject);
});
const results = [];
async function setup(
  query = '',
  viewport = { width: 1100, height: 780 },
  reducedMotion = 'reduce',
) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    isMobile: viewport.width < 500 || viewport.height < 500,
    hasTouch: viewport.width < 500 || viewport.height < 500,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(
    (process.env.POND_QA_URL ?? 'http://127.0.0.1:5175') +
      '/projects/jelly-oasis/' +
      query,
  );
  await page.waitForFunction(() => window.__oasisLandmark?.snapshot().waterEffects, {
    timeout: 30000,
  });
  return { context, page, errors };
}
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
async function weather(page, w, h = 12) {
  await page.evaluate(
    ({ w, h }) => {
      const time = document.getElementById('environment-time');
      time.value = String(h);
      time.dispatchEvent(new Event('input', { bubbles: true }));
      const e = document.getElementById('environment-weather');
      e.value = w;
      e.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { w, h },
  );
  await page.waitForFunction(
    (w) => {
      const s = window.__oasisLandmark.snapshot();
      return s.weather === w && s.weatherBlend === 1;
    },
    w,
    { timeout: 30000 },
  );
}
try {
  const { context, page, errors } = await setup('?debug&view=pond-low');
  const initial = await snap(page);
  console.log('initial', initial.waterEffects.solver, initial.waterEffects.gpuError);
  assert.equal(initial.modules, 16);
  assert.equal(initial.waterEffects.rockFlowCount, 0);
  assert.deepEqual(initial.excavation.channelPath, []);
  assert.equal(initial.waterEffects.solver, 'gpgpu-heightfield');
  await weather(page, 'CLEAR');
  await page.evaluate(() => {
    window.__oasisLandmark.reviewPond({ reset: true, impulse: true });
    window.__oasisLandmark.reviewWaterStep(1 / 60);
  });
  const propagation = [];
  const domain = (await snap(page)).waterEffects.gpuPond;
  for (const seconds of [0, 1, 2, 4]) {
    if (seconds)
      await page.evaluate(
        (s) => window.__oasisLandmark.reviewWaterStep(s === 4 ? 2 : 1),
        seconds,
      );
    await page.evaluate(() =>
      document.querySelectorAll('details').forEach((e) => (e.open = false)),
    );
    await page.screenshot({ path: `${output}/clear-${seconds}s.png` });
    const readback = await page.evaluate(() =>
      window.__oasisLandmark.reviewPondHeights(),
    );
    let active = 0,
      far = 0,
      maxDistance = 0;
    for (let y = 0; y < readback.n; y++)
      for (let x = 0; x < readback.n; x++) {
        const raw = readback.values[(y * readback.n + x) * 4];
        const height = readback.halfFloat ? DataUtils.fromHalfFloat(raw) : raw;
        assert(Number.isFinite(height));
        if (Math.abs(height) <= 1e-5) continue;
        active++;
        const wx = domain.bounds[0] + ((x + 0.5) / readback.n) * domain.bounds[2];
        const wz = domain.bounds[1] + ((y + 0.5) / readback.n) * domain.bounds[3];
        const distance = Math.hypot(
          wx - domain.diagnosticPoint[0],
          wz - domain.diagnosticPoint[1],
        );
        if (distance > 1.5) far++;
        maxDistance = Math.max(maxDistance, distance);
      }
    propagation.push({ seconds, active, far, maxDistance });
  }
  assert(
    propagation[1].far > propagation[0].far,
    'wave must reach cells outside the impulse footprint',
  );
  assert(
    propagation[1].maxDistance > propagation[0].maxDistance + 0.5,
    'wave must spread beyond its initial support',
  );
  results.push({ name: 'numeric-propagation', propagation });
  const heights = await page.evaluate(() => window.__oasisLandmark.reviewPondHeights());
  assert(heights.values.some((x) => x !== 0));
  const before = await snap(page);
  await weather(page, 'RAIN');
  await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(2));
  const rain = await snap(page);
  assert(rain.waterEffects.impulses.rain > before.waterEffects.impulses.rain);
  await page.screenshot({ path: `${output}/rain.png` });
  for (const w of ['MIST', 'OVERCAST', 'PARTLY_CLOUDY', 'CLEAR']) {
    await weather(page, w);
    const a = await snap(page);
    await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(2));
    const b = await snap(page);
    assert.equal(a.waterEffects.impulses.rain, b.waterEffects.impulses.rain);
    if (w === 'MIST') await page.screenshot({ path: `${output}/mist.png` });
  }
  await weather(page, 'CLEAR', 23);
  await page.screenshot({ path: `${output}/night.png` });
  const memories = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
    await page.waitForTimeout(100);
    const s = await snap(page);
    memories.push({ textures: s.textures, geometries: s.geometries });
    assert.equal(s.waterEffects.solver, 'gpgpu-heightfield');
  }
  assert.deepEqual(memories[1], memories[2]);
  const lost = page.evaluate(
    () =>
      new Promise((resolve) => {
        const c = document.querySelector('canvas'),
          gl = c.getContext('webgl2'),
          ext = gl.getExtension('WEBGL_lose_context');
        c.addEventListener('webglcontextrestored', () => resolve(true), { once: true });
        ext.loseContext();
        setTimeout(() => ext.restoreContext(), 300);
      }),
  );
  await lost;
  await page.waitForTimeout(200);
  assert.equal((await snap(page)).waterEffects.solver, 'gpgpu-heightfield');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const paused = (await snap(page)).waterEffects.impulses;
  await page.waitForTimeout(500);
  assert.deepEqual((await snap(page)).waterEffects.impulses, paused);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  results.push({
    name: 'desktop',
    initial,
    rain,
    final: await snap(page),
    memories,
    errors,
  });
  assert.deepEqual(errors, []);
  await context.close();
  for (const [name, query, viewport] of [
    [
      'legacy',
      '?debug&waterfall=v8&flow=fall-v1&surface=gpgpu-proto&view=pond-top',
      { width: 1100, height: 780 },
    ],
    ['cpu', '?debug&surface=cpu&view=pond-top', { width: 1100, height: 780 }],
    ['mobile390', '?debug&view=pond-low', { width: 390, height: 844 }],
    ['mobile360', '?debug&view=pond-low', { width: 360, height: 780 }],
    ['landscape', '?debug&view=pond-low', { width: 844, height: 390 }],
  ]) {
    const { context, page, errors } = await setup(query, viewport);
    await weather(page, 'RAIN');
    await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(2));
    const s = await snap(page);
    assert.equal(s.waterEffects.rockFlowCount, 0);
    assert.equal(s.modules, 16);
    assert(s.waterEffects.impulses.rain > 0);
    if (name === 'cpu') assert.equal(s.waterEffects.solver, 'cpu-heightfield');
    if (name.startsWith('mobile')) assert.equal(s.waterEffects.gpuPond.n, 64);
    await page.screenshot({ path: `${output}/${name}.png` });
    results.push({ name, snapshot: s, errors });
    assert.deepEqual(errors, []);
    await context.close();
  }
  // Production smoke test deliberately has no debug globals/query parameters.
  const context2 = await browser.newContext({ viewport: { width: 1100, height: 780 } });
  const p2 = await context2.newPage();
  const errors2 = [];
  p2.on('pageerror', (e) => errors2.push(String(e)));
  p2.on('console', (m) => {
    if (m.type() === 'error') errors2.push(m.text());
  });
  await p2.goto('http://127.0.0.1:5175/projects/jelly-oasis/');
  await p2.waitForTimeout(3000);
  assert.equal(await p2.evaluate(() => !!window.__oasisLandmark), false);
  assert.deepEqual(errors2, []);
  await p2.screenshot({ path: `${output}/production.png` });
  results.push({ name: 'production', errors: errors2 });
  await context2.close();
} finally {
  await writeFile(`${output}/browser-qa.json`, JSON.stringify(results, null, 2));
  await browser.close();
  server.kill();
}
console.log('Pond-only browser QA passed');
