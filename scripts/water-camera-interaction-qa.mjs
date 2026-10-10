import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const output = resolve('artifacts/jelly-oasis/water-waterfall-v1');
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4188',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((r, j) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) r();
  });
  server.on('exit', j);
});
const browser = await chromium.launch({
  executablePath: process.env.LANDMARK_QA_BROWSER,
  headless: true,
  args: ['--no-sandbox'],
});
const result = { errors: [], zoom: {}, production: {} };
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
const distance = (s) => Math.hypot(...s.camera.map((v, i) => v - s.target[i]));
function monitor(p) {
  p.on('pageerror', (e) => result.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') result.errors.push(m.text());
  });
}
try {
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'no-preference',
  });
  const p = await c.newPage();
  monitor(p);
  await p.goto(
    'http://127.0.0.1:4188/projects/jelly-oasis/?debug&water=v1&waterfall=v1',
  );
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  await p.evaluate(() => {
    for (const id of ['environment-time']) {
      const e = document.getElementById(id);
      e.value = '12';
      e.dispatchEvent(new Event('input'));
    }
    const e = document.querySelector('#environment-auto-weather');
    e.checked = false;
    e.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelectorAll('details').forEach((e) => (e.open = false));
  });
  const before = await snap(p);
  const session = await c.newCDPSession(p);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 135, y: 370 },
      { x: 255, y: 370 },
    ],
  });
  for (let i = 1; i <= 8; i++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: 135 - i * 5, y: 370 },
        { x: 255 + i * 5, y: 370 },
      ],
    });
    await p.waitForTimeout(30);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(500);
  const after = await snap(p);
  assert.ok(distance(after) < distance(before) * 0.8);
  result.zoom.pinch = { before: distance(before), after: distance(after) };
  for (const delta of [-100000, 100000]) {
    await p.mouse.move(195, 370);
    await p.mouse.wheel(0, delta);
    await p.waitForTimeout(800);
    const s = await snap(p);
    const d = distance(s);
    assert.ok(d >= 34.99 && d <= 1050.01);
    result.zoom[delta] = d;
  }
  await p.locator('#reset-view').click();
  await p.evaluate(() => {
    const e = document.querySelector('#landmark-isolate');
    e.value = 'Cliff_Waterfall_A';
    e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(350);
  const hidden = await snap(p);
  await p.waitForTimeout(350);
  assert.equal((await snap(p)).waterEffects.elapsed, hidden.waterEffects.elapsed);
  result.hiddenEffects = hidden.waterEffects.elapsed;
  await p.evaluate(() => {
    const e = document.querySelector('#landmark-isolate');
    e.value = '';
    e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForTimeout(350);
  assert.ok((await snap(p)).waterEffects.elapsed > hidden.waterEffects.elapsed);
  await p.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
  await c.close();
  const pc = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const pp = await pc.newPage();
  monitor(pp);
  for (const [name, query] of [
    ['default', ''],
    ['query', '?water=v1&waterfall=v1'],
  ]) {
    await pp.goto('http://127.0.0.1:4188/projects/jelly-oasis/' + query);
    await pp.waitForFunction(() => document.querySelector('#landmark-status').hidden);
    await pp.waitForTimeout(500);
    assert.equal(await pp.evaluate(() => '__oasisLandmark' in window), false);
    await pp.screenshot({ path: resolve(output, 'production-' + name + '.png') });
  }
  assert.ok(
    (await readFile(resolve(output, 'production-default.png'))).equals(
      await readFile(resolve(output, 'production-query.png')),
    ),
    'Production queries must preserve pixels',
  );
  result.production.ignoredQueries = true;
  await pp.mouse.move(700, 450);
  await pp.mouse.down();
  await pp.mouse.move(700, 180, { steps: 15 });
  await pp.mouse.up();
  await pp.waitForTimeout(600);
  await pp.screenshot({ path: resolve(output, 'production-input.png') });
  assert.ok(
    !(await readFile(resolve(output, 'production-default.png'))).equals(
      await readFile(resolve(output, 'production-input.png')),
    ),
    'Input must change view',
  );
  result.production.inputChangesView = true;
  await pp.locator('#reset-view').click();
  await pp.mouse.move(5, 500);
  await pp.waitForTimeout(600);
  await pp.screenshot({ path: resolve(output, 'production-reset.png') });
  assert.ok(
    (await readFile(resolve(output, 'production-default.png'))).equals(
      await readFile(resolve(output, 'production-reset.png')),
    ),
    'Reset must preserve view pixels',
  );
  result.production.resetPreserved = true;
  await pc.close();
  assert.deepEqual(result.errors, []);
  console.log('Interaction QA PASS');
} finally {
  await writeFile(
    resolve(output, 'interaction-qa.json'),
    JSON.stringify(result, null, 2),
  );
  await browser.close();
  server.kill();
}
