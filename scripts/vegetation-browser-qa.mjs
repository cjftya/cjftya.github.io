import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const output =
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/vegetation-detail-v1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.OASIS_QA_BROWSER ??
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
  '5176',
]);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('error', reject);
});
const results = [];
async function setup(query = '?debug', viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce',
    isMobile: viewport.width < 500 || viewport.height < 500,
    hasTouch: viewport.width < 500 || viewport.height < 500,
  });
  const page = await context.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`http://127.0.0.1:5176/projects/jelly-oasis/${query}`);
  await page.waitForFunction(() => window.__oasisLandmark?.snapshot().vegetation);
  return { page, context, errors };
}
const snap = (page) => page.evaluate(() => window.__oasisLandmark.snapshot());
async function weather(page, w = 'CLEAR', h = 12) {
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
    (w) =>
      window.__oasisLandmark.snapshot().weather === w &&
      window.__oasisLandmark.snapshot().weatherBlend === 1,
    w,
  );
}
async function capture(page, name, view) {
  if (view)
    await page.evaluate(
      (v) => document.querySelector(`[data-view="${v}"]`).click(),
      view,
    );
  await page.evaluate(() =>
    document.querySelectorAll('details').forEach((e) => (e.open = false)),
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${output}/${name}.jpg`, type: 'jpeg', quality: 70 });
}
try {
  for (const density of ['off', 'density-a', 'density-b']) {
    const { page, context, errors } = await setup(`?debug&vegetation=${density}`);
    await weather(page);
    await capture(page, `${density}-medium`, 'medium');
    const medium = await snap(page);
    await capture(page, `${density}-ground`, 'ground');
    const ground = await snap(page);
    assert.equal(medium.modules, 16);
    assert.equal(medium.waterEffects.rockFlowCount, 0);
    assert.deepEqual(medium.excavation.channelPath, []);
    assert(medium.vegetation.triangles < 10000);
    if (density === 'off') assert.equal(medium.vegetation.instanceCount, 0);
    else assert(medium.vegetation.instanceCount > 90);
    results.push({ name: density, medium, ground, errors });
    assert.deepEqual(errors, []);
    await context.close();
  }
  const { page, context, errors } = await setup();
  await weather(page);
  await capture(page, 'noon', 'medium');
  const vegetation = (await snap(page)).vegetation;
  for (const [name, w, h] of [
    ['night', 'CLEAR', 0],
    ['rain', 'RAIN', 12],
    ['mist', 'MIST', 12],
  ]) {
    await weather(page, w, h);
    await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(2));
    await capture(page, name, 'ground');
    const s = await snap(page);
    assert.deepEqual(s.vegetation.placed, vegetation.placed);
    if (w === 'RAIN') assert(s.waterEffects.impulses.rain > 0);
    results.push({ name, snapshot: s });
  }
  await weather(page);
  for (const kind of ['grass', 'shrub', 'flower']) {
    await page.evaluate((kind) => {
      const p = window.__oasisLandmark.reviewVegetation().find((p) => p.kind === kind);
      const [x, y, z] = p.world;
      window.__oasisLandmark.reviewCamera(
        [x + 1.8, y + 2.0, z + 1.8],
        [x, y + 0.25, z],
      );
    }, kind);
    await capture(page, `prototype-${kind}`);
  }
  await capture(page, 'lifecycle-before', 'medium');
  const memories = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
    await page.waitForTimeout(100);
    const s = await snap(page);
    memories.push({
      textures: s.textures,
      geometries: s.geometries,
      vegetation: s.vegetation,
    });
  }
  assert.deepEqual(memories[1], memories[2]);
  await page.selectOption('#landmark-isolate', 'Rock_Large_A', { force: true });
  assert.equal((await snap(page)).vegetation.visible, false);
  await page.selectOption('#landmark-isolate', '', { force: true });
  assert.equal((await snap(page)).vegetation.visible, true);
  await page.click('#reset-view');
  await capture(page, 'reset');
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const c = document.querySelector('canvas'),
          gl = c.getContext('webgl2'),
          ext = gl.getExtension('WEBGL_lose_context');
        const timeout = setTimeout(
          () => reject(new Error('context restore timeout')),
          15000,
        );
        c.addEventListener(
          'webglcontextrestored',
          () => {
            clearTimeout(timeout);
            resolve(true);
          },
          { once: true },
        );
        ext.loseContext();
        setTimeout(() => ext.restoreContext(), 200);
      }),
  );
  await page.waitForTimeout(300);
  assert.deepEqual((await snap(page)).vegetation.placed, vegetation.placed);
  await capture(page, 'restored', 'medium');
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
  );
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await page.waitForTimeout(200);
  assert.deepEqual((await snap(page)).vegetation.placed, vegetation.placed);
  for (const site of ['west', 'north', 'basin']) {
    await page.selectOption('#landmark-site', site, { force: true });
    const s = await snap(page);
    assert(s.vegetation.instanceCount > 90);
    results.push({ name: `rebuild-${site}`, snapshot: s });
  }
  assert.deepEqual(errors, []);
  results.push({ name: 'lifecycle', memories, final: await snap(page), errors });
  await context.close();
  for (const [name, viewport] of [
    ['mobile390', { width: 390, height: 844 }],
    ['mobile360', { width: 360, height: 780 }],
    ['landscape', { width: 844, height: 390 }],
  ]) {
    const { page, context, errors } = await setup('?debug', viewport);
    await weather(page);
    await capture(page, name, 'medium');
    const s = await snap(page);
    assert(s.vegetation.mobile);
    assert(s.vegetation.instanceCount >= 100 && s.vegetation.instanceCount <= 135);
    assert.equal(s.modules, 16);
    assert.deepEqual(errors, []);
    results.push({ name, snapshot: s, errors });
    await context.close();
  }
  const cpu = await setup('?debug&surface=cpu');
  await weather(cpu.page, 'RAIN');
  await cpu.page.evaluate(() => window.__oasisLandmark.reviewWaterStep(2));
  const cs = await snap(cpu.page);
  assert.equal(cs.waterEffects.solver, 'cpu-heightfield');
  assert(cs.waterEffects.impulses.rain > 0);
  assert.deepEqual(cpu.errors, []);
  results.push({ name: 'cpu', snapshot: cs });
  await cpu.context.close();
  const production = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    }),
    p = await production.newPage(),
    pe = [];
  p.on('pageerror', (e) => pe.push(String(e)));
  await p.goto('http://127.0.0.1:5176/projects/jelly-oasis/?vegetation=off');
  await p.waitForFunction(() => document.querySelector('#landmark-status')?.hidden);
  assert.equal(await p.evaluate(() => !!window.__oasisLandmark), false);
  await capture(p, 'production');
  await p.click('#reset-view');
  assert.deepEqual(pe, []);
  results.push({ name: 'production-ignores-debug-query', errors: pe });
  await production.close();
  const failed = await browser.newContext(),
    f = await failed.newPage();
  await f.route('**/Tree_*.glb', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await f.goto('http://127.0.0.1:5176/projects/jelly-oasis/');
  await f.waitForFunction(
    () => document.querySelector('#landmark-status')?.getAttribute('role') === 'alert',
  );
  results.push({
    name: '404-load-failure',
    alert: await f.locator('#landmark-status').textContent(),
  });
  await failed.close();
  console.log('Vegetation browser QA passed');
} finally {
  await writeFile(
    `${output}/browser-qa.json`,
    JSON.stringify(
      results,
      (key, value) =>
        ['phase2', 'shorelineContacts', 'shorelineContactTypes', 'timings'].includes(
          key,
        )
          ? undefined
          : value,
      2,
    ),
  );
  await browser.close();
  server.kill();
}
