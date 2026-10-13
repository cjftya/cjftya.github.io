import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Save the browser's PNGs directly, without image conversion.
const output = process.env.OASIS_QA_OUTPUT ?? '/tmp/oasis-terrain-color';
const base = process.env.OASIS_QA_BASE ?? 'http://127.0.0.1:5179';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_BASE
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      '5179',
      '--strictPort',
    ]);
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (String(d).includes('Local:')) resolve();
    });
    server.stderr.on('data', (d) => console.error(String(d)));
    server.on('exit', (code) => reject(new Error(`Vite exited: ${code}`)));
  });
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = {
  errors: [],
  states: {},
  conditions: { time: 12, weather: 'CLEAR', dpr: 1, reducedMotion: true },
};
try {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
    [844, 390],
  ]) {
    if (process.env.OASIS_QA_DESKTOP && width !== 1280) continue;
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: width < 500 || height < 500,
      hasTouch: width < 500 || height < 500,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    await page.goto(`${base}/projects/jelly-oasis/?debug`);
    await page.waitForFunction(
      () => window.__oasisLandmark?.snapshot().calls > 10,
      undefined,
      { timeout: 120000 },
    );
    await page.evaluate(() => {
      const auto = document.querySelector('#environment-auto-weather');
      auto.checked = false;
      auto.dispatchEvent(new Event('change', { bubbles: true }));
      const time = document.querySelector('#environment-time');
      time.value = '12';
      time.dispatchEvent(new Event('input', { bubbles: true }));
      const weather = document.querySelector('#environment-weather');
      weather.value = 'CLEAR';
      weather.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelectorAll('details').forEach((e) => {
        e.open = false;
      });
    });
    async function capture(name) {
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${output}/${width}x${height}-${name}.png`,
        timeout: 120000,
      });
      result.states[`${width}x${height}-${name}`] = await page.evaluate(() =>
        window.__oasisLandmark.snapshot(),
      );
      console.log(`Captured ${width}x${height} ${name}`);
    }
    await capture('presentation');
    if (width === 1280) {
      for (const [name, camera, target] of [
        ['overview', [210, 240, 260], [0, 8, 0]],
        ['medium', [90, 66, 110], [14, 4, 14]],
        ['ground', [54, 13, 75], [12, 3, 8]],
        ['ridge', [143, 72, 59], [60, 18, -27]],
      ]) {
        await page.evaluate(
          ({ camera, target }) => window.__oasisLandmark.reviewCamera(camera, target),
          { camera, target },
        );
        await capture(name);
      }
      if (!process.env.OASIS_QA_QUICK) {
        await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
        await capture('rebuilt');
        await page.evaluate(() =>
          window.__oasisLandmark.reviewCamera([113, 89, 149], [14, 8, 7]),
        );
        for (const [name, time, weather] of [
          ['overcast', 12, 'OVERCAST'],
          ['night', 0, 'CLEAR'],
        ]) {
          await page.evaluate(
            ({ time, weather }) => {
              const t = document.querySelector('#environment-time');
              t.value = String(time);
              t.dispatchEvent(new Event('input', { bubbles: true }));
              const w = document.querySelector('#environment-weather');
              w.value = weather;
              w.dispatchEvent(new Event('change', { bubbles: true }));
            },
            { time, weather },
          );
          await page.waitForFunction(
            () => window.__oasisLandmark.snapshot().weatherBlend === 1,
            undefined,
            { timeout: 30000 },
          );
          await capture(name);
        }
      }
    }
    await context.close();
  }
  if (process.env.OASIS_QA_REFERENCE) {
    const reference = JSON.parse(
      await readFile(process.env.OASIS_QA_REFERENCE, 'utf8'),
    );
    for (const [name, before] of Object.entries(reference.states)) {
      const after = result.states[name];
      assert(after, `Missing comparison view: ${name}`);
      for (const key of [
        'camera',
        'target',
        'calls',
        'triangles',
        'textures',
        'geometries',
        'terrain',
        'worldBounds',
        'contact',
        'pondHeight',
      ])
        assert.deepEqual(after[key], before[key], `${name}: ${key} changed`);
    }
    result.regression =
      'Matching cameras, geometry, resources, placement and pond height';
  }
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/states.json`, JSON.stringify(result, null, 2));
  await browser.close();
  server?.kill();
}
