import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const output = 'artifacts/jelly-oasis/monumental-art-v2/final';
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '5182',
  '--strictPort',
]);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('exit', (c) => reject(new Error(String(c))));
});
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = { errors: [], states: {} },
  pose = (s) => ({ camera: s.camera, target: s.target }),
  close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 0.01);
try {
  const p = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  p.on('pageerror', (e) => result.errors.push(String(e)));
  await p.goto('http://127.0.0.1:5182/projects/jelly-oasis/?debug');
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  const snap = () => p.evaluate(() => window.__oasisLandmark.snapshot()),
    initial = pose(await snap());
  result.states.initial = initial;
  await p.evaluate(() => document.querySelector('[data-view="overview"]').click());
  result.states.overview = pose(await snap());
  assert.notDeepEqual(result.states.overview, initial);
  await p.evaluate(() => document.getElementById('reset-view').click());
  assert.deepEqual(pose(await snap()), initial);
  await p.mouse.move(700, 480);
  await p.mouse.down();
  await p.mouse.move(780, 520, { steps: 12 });
  await p.mouse.up();
  const start = Date.now();
  await p.waitForFunction(
    () => {
      const current = window.__oasisLandmark.snapshot().camera,
        previous = window.__lastArtCamera;
      window.__lastArtCamera = current;
      const stable =
        previous && current.every((v, i) => Math.abs(v - previous[i]) < 0.00001);
      window.__artStableFrames = stable ? (window.__artStableFrames ?? 0) + 1 : 0;
      return window.__artStableFrames >= 6;
    },
    undefined,
    { timeout: 120000 },
  );
  result.orbitSettleMs = Date.now() - start;
  const moved = pose(await snap());
  assert(!close(moved.camera, initial.camera));
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(300);
  const resized = pose(await snap());
  assert(close(moved.camera, resized.camera));
  assert(close(moved.target, resized.target));
  result.states.manualResize = resized;
  await p.evaluate(() => document.getElementById('reset-view').click());
  const portrait = pose(await snap());
  result.states.portraitReset = portrait;
  await p.reload();
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  assert.deepEqual(pose(await snap()), portrait);
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/camera-qa.json`, JSON.stringify(result, null, 2));
  await browser.close();
  server.kill();
}
console.log('Camera QA PASS');
