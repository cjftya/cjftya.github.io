import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const output = resolve('artifacts/jelly-oasis/waterfall-v5-pond-v3');
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4189',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((ok, fail) => {
  server.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) ok();
  });
  server.stderr.on('data', (data) => console.error(data.toString()));
  server.on('exit', (code) => fail(new Error(`preview exited: ${code}`)));
});

let browser;
try {
  browser = await chromium.launch({
    ...(process.env.LANDMARK_QA_BROWSER
      ? { executablePath: process.env.LANDMARK_QA_BROWSER }
      : {}),
    args: ['--no-sandbox'],
  });
  const errors = [];
  const states = {};
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const base = 'http://127.0.0.1:4189/projects/jelly-oasis/';
    await page.goto(`${base}?debug&water=v2&waterfall=v5`);
    await page.waitForFunction(
      () => window.__oasisLandmark?.snapshot().waterEffects?.version === 5,
    );
    const cameras = mobile
      ? [['mobile-front', 12, [82, 1, 93], [66, -3, 50]]]
      : [
          ['front', 12, [82, 1, 93], [66, -3, 50]],
          ['side', 12, [91, 0, 64], [66, -3, 50]],
          ['close', 12, [73, 0, 73], [65, -1, 50]],
          ['night', 0, [82, 1, 93], [66, -3, 50]],
        ];
    for (const [name, hour, position, target] of cameras) {
      await page.evaluate(
        ({ hour, position, target }) => {
          window.__oasisLandmark.reviewCamera(position, target);
          const control = document.querySelector('#environment-time');
          control.value = hour;
          control.dispatchEvent(new Event('input', { bubbles: true }));
          document
            .querySelectorAll('details')
            .forEach((element) => (element.open = false));
        },
        { hour, position, target },
      );
      await page.waitForTimeout(700);
      const state = await page.evaluate(() => window.__oasisLandmark.snapshot());
      const water = state.waterEffects;
      assert.equal(state.modules, 16);
      assert.equal(water.version, 5);
      assert.ok(water.flightStartIndex >= 5);
      assert.ok(water.rockClearance > 0.08);
      assert.ok(water.path.length > 50);
      assert.ok(water.path.every((point) => point.every(Number.isFinite)));
      assert.ok(water.impact.every(Number.isFinite));
      assert.deepEqual(water.impact, water.reflection.impact.slice(0, 2));
      assert.equal(water.reflection.impact[2], 0.85);
      assert.equal(water.reflection.size, mobile ? 256 : 768);
      assert.ok(water.reflection.captures > 0);
      assert.equal(water.reflection.passes, 2);
      assert.equal(water.ripples, 0);
      states[name] = state;
      await page.screenshot({ path: resolve(output, `${name}.png`) });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(250);
    const paused = await page.evaluate(
      () => window.__oasisLandmark.snapshot().waterEffects.elapsed,
    );
    await page.waitForTimeout(400);
    assert.equal(
      await page.evaluate(() => window.__oasisLandmark.snapshot().waterEffects.elapsed),
      paused,
    );
    await page.goto(`${base}?debug`);
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().waterEffects === null);
    assert.equal(
      await page.evaluate(() => window.__oasisLandmark.snapshot().waterEffects),
      null,
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'qa.json'),
    JSON.stringify({ states, errors }, null, 2),
  );
  console.log('Waterfall v5 and pond v3 candidate QA PASS');
} finally {
  await browser?.close();
  server.kill();
}
