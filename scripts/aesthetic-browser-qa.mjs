import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:4184';
const stage = process.env.AESTHETIC_QA_STAGE ?? 'baseline';
const output = resolve('artifacts/jelly-oasis/aesthetic-improvement-v1', stage);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const result = { screenshots: [], states: {}, errors: [], responses: [] };
const sizes = [
  [1440, 900],
  [390, 844],
  [360, 780],
  [844, 390],
];
async function capture(page, name, debug) {
  await page
    .locator('details')
    .evaluateAll((es) => es.forEach((e) => (e.open = false)));
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(output, name + '.png') });
  result.screenshots.push(name + '.png');
  if (debug)
    result.states[name] = await page.evaluate(() => window.__oasisLandmark.snapshot());
}
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 900,
      hasTouch: width < 900,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    page.on('response', (r) => {
      if (r.url().endsWith('.glb'))
        result.responses.push({ url: r.url(), status: r.status() });
    });
    const prefix = width + 'x' + height;
    await page.goto(base + '/projects/jelly-oasis/');
    await page.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
    await capture(page, prefix + '-production-entry', false);
    await page.locator('#reset-view').click();
    await capture(page, prefix + '-production-reset', false);
    await page.goto(base + '/projects/jelly-oasis/?debug');
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    await page.locator('#environment-debug').evaluate((e) => (e.open = true));
    await page.locator('#environment-time').fill('12');
    await page.locator('#environment-weather').selectOption('CLEAR');
    await page.waitForFunction(
      () => window.__oasisLandmark.snapshot().weatherBlend === 1,
    );
    for (const view of ['overview', 'medium', 'ground']) {
      await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
      await page.locator('[data-view=' + view + ']').click();
      await capture(page, prefix + '-debug-' + view, true);
    }
    const state = result.states[prefix + '-debug-medium'];
    assert.equal(state.modules, 16);
    assert.equal(state.assetTriangles, 20786);
    assert.equal(state.crystalDetail, false);
    if (width < 900) assert.equal(state.shadows, true);
    result.states[prefix + '-audit'] = await page.evaluate(() =>
      window.__oasisLandmark.audit(),
    );
    await context.close();
  }
  if (stage !== 'baseline') {
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(base + '/projects/jelly-oasis/?debug');
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
    await page.locator('[data-view=medium]').click();
    const landscape = await page.evaluate(() => window.__oasisLandmark.snapshot());
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, 'rotation-portrait-preset', true);
    const portrait = result.states['rotation-portrait-preset'];
    assert.notDeepEqual(portrait.camera, landscape.camera);
    assert.ok(
      portrait.target.every((v, i) => Math.abs(v - landscape.target[i]) < 1e-8),
    );
    await page.mouse.move(190, 370);
    await page.mouse.down();
    await page.mouse.move(245, 405, { steps: 12 });
    await page.mouse.up();
    await page.mouse.wheel(0, -140);
    await page.waitForFunction(
      () => {
        const current = window.__oasisLandmark.snapshot().camera;
        const previous = window.__qaLastCamera;
        window.__qaLastCamera = current;
        return previous && current.every((v, i) => Math.abs(v - previous[i]) < 0.00001);
      },
      undefined,
      { polling: 100 },
    );
    const moved = await page.evaluate(() => window.__oasisLandmark.snapshot());
    result.states['orbit-before-resize'] = moved;
    assert.equal(moved.mediumCamera, false);
    assert.notDeepEqual(moved.camera, portrait.camera);
    await page.setViewportSize({ width: 844, height: 390 });
    await capture(page, 'rotation-landscape-after-orbit', true);
    const resized = result.states['rotation-landscape-after-orbit'];
    assert.ok(resized.camera.every((v, i) => Math.abs(v - moved.camera[i]) < 0.01));
    assert.ok(resized.target.every((v, i) => Math.abs(v - moved.target[i]) < 0.01));
    await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
    await page.locator('[data-view=ground]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, 'rotation-ground', true);
    await page.locator('#reset-view').click();
    await capture(page, 'rotation-reset', true);
    await context.close();
  }
  assert.deepEqual(result.errors, []);
  assert.ok(result.responses.every((r) => r.status === 200));
} finally {
  await browser.close();
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(result, null, 2));
}
console.log(
  'Aesthetic ' +
    stage +
    ': ' +
    result.screenshots.length +
    ' captures, errors=' +
    result.errors.length,
);
