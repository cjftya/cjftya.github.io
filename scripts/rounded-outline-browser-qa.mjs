import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Save the browser's PNGs directly, without image conversion.
const output = process.env.OASIS_QA_OUTPUT ?? '/tmp/oasis-rounded';
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

    await page.waitForTimeout(400);
    await page.screenshot({ path: `${output}/${width}-presentation.png` });
    if (width === 1280) {
      await page.evaluate(() =>
        window.__oasisLandmark.reviewCamera([210, 240, 260], [0, 8, 0]),
      );
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${output}/overview.png` });
      await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${output}/rebuilt.png` });
    }
    const state = await page.evaluate(() => {
      const s = window.__oasisLandmark.snapshot();
      return {
        calls: s.calls,
        triangles: s.triangles,
        excavationDepth: s.excavation?.excavationDepth,
      };
    });
    console.log(JSON.stringify({ width, ...state }));
    await context.close();
  }
  console.log(JSON.stringify({ errors: result.errors }));
  assert.equal(result.errors.length, 0);
} finally {
  await browser.close();
  server?.kill();
}
