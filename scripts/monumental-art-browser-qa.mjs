import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output =
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/monumental-art-v2/final';
const query = process.env.OASIS_ART_QUERY ?? '&art=a';
const reference = JSON.parse(
  await readFile(
    process.env.OASIS_ART_REFERENCE ??
      'artifacts/jelly-oasis/monumental-art-v2/baseline/browser-qa.json',
    'utf8',
  ),
);
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '5179',
    '--strictPort',
  ],
  { cwd: process.env.OASIS_ART_ROOT ?? process.cwd() },
);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('exit', (c) => reject(new Error(String(c))));
});
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = {
  errors: [],
  states: {},
  conditions: {
    dpr: 1,
    fov: 42,
    time: 12,
    weather: 'CLEAR',
    reducedMotion: true,
    shadows: true,
  },
};
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 780],
    [844, 390],
  ]) {
    if (process.env.OASIS_ART_DESKTOP && width !== 1440) continue;
    const c = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        isMobile: width < 500 || height < 500,
        hasTouch: width < 500 || height < 500,
      }),
      p = await c.newPage();
    p.on('pageerror', (e) => result.errors.push(String(e)));
    p.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    await p.goto(`http://127.0.0.1:5179/projects/jelly-oasis/?debug${query}`);
    await p.waitForFunction(
      () => window.__oasisLandmark?.snapshot().calls > 10,
      undefined,
      { timeout: 120000 },
    );
    await p.evaluate(() => {
      const e = document.querySelector('#environment-time');
      e.value = '12';
      e.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelectorAll('details').forEach((e) => (e.open = false));
    });
    await p.screenshot({
      path: `${output}/${width}x${height}-presentation.jpg`,
      quality: 85,
    });
    result.states[`presentation-${width}x${height}`] = await p.evaluate(() =>
      window.__oasisLandmark.snapshot(),
    );
    const supplemental = {
      'north-wide': { camera: [48, 88, -8], target: [5, 28, -80] },
      'west-wide': { camera: [-143, 73, 94], target: [-48, 16, -7] },
      'east-wide': { camera: [153, 72, 59], target: [60, 18, -27] },
    };
    const views =
      process.env.OASIS_ART_VIEWS?.split(',') ??
      (width === 1440
        ? [
            'overview',
            'medium',
            'ground',
            'pond',
            'north',
            'west',
            'north-wide',
            'west-wide',
            'east-wide',
          ]
        : ['overview', 'medium']);
    for (const view of views) {
      const key = `a-${width}x${height}-${view}`,
        fixed = reference.states[key] ?? supplemental[view];
      await p.evaluate(
        ({ camera, target }) => window.__oasisLandmark.reviewCamera(camera, target),
        fixed,
      );
      await p.waitForTimeout(180);
      await p.screenshot({
        path: `${output}/${width}x${height}-${view}.jpg`,
        quality: 85,
      });
      result.states[key] = await p.evaluate(() => window.__oasisLandmark.snapshot());
      assert(
        result.states[key].camera.every((v, i) => Math.abs(v - fixed.camera[i]) < 1e-8),
      );
      assert(
        result.states[key].target.every((v, i) => Math.abs(v - fixed.target[i]) < 1e-8),
      );
    }
    await c.close();
    console.log(output, width, height);
  }
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/states.json`, JSON.stringify(result));
  await browser.close();
  server.kill();
}
