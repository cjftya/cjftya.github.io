import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:5173';
const output = resolve('artifacts/jelly-oasis/landmark-integration');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [],
  responses = [],
  results = {
    base,
    screenshots: [],
    candidates: {},
    rotations: {},
    environments: {},
    errors,
  };
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
  if (response.url().endsWith('.glb'))
    responses.push({ url: response.url(), status: response.status() });
});
const pause = () => page.waitForTimeout(350);
const snapshot = () => page.evaluate(() => window.__oasisLandmark.snapshot());
const audit = () => page.evaluate(() => window.__oasisLandmark.audit());
async function panels(open) {
  for (const id of ['environment-debug', 'landmark-debug']) {
    if ((await page.locator(`#${id}`).evaluate((element) => element.open)) !== open)
      await page.locator(`#${id} > summary`).click();
  }
}
async function capture(name) {
  await panels(false);
  await pause();
  await page.screenshot({ path: resolve(output, `${name}.png`) });
  results.screenshots.push(`${name}.png`);
  await panels(true);
}
async function environment(time, weather) {
  await page.locator('#environment-time').fill(String(time));
  await page.locator('#environment-weather').selectOption(weather);
  await page.waitForFunction((expected) => {
    const state = window.__oasisLandmark.snapshot();
    return state.weather === expected && state.weatherBlend === 1;
  }, weather);
  await pause();
}

try {
  await page.goto(`${base}/projects/jelly-oasis/?debug`);
  await page.waitForFunction(() => window.__oasisLandmark);
  await panels(true);
  await environment(12, 'CLEAR');
  results.initial = await snapshot();
  assert.equal(results.initial.modules, 16);
  assert.equal(results.initial.assetTriangles, 9044);
  for (const name of ['Rock_Large_A', 'Ruin_Arch_A', 'Cliff_Waterfall_A']) {
    await page.locator('#landmark-isolate').selectOption(name);
    await capture(`asset-${name}`);
  }
  await page.locator('#landmark-isolate').selectOption('');
  for (const site of ['west', 'north', 'basin']) {
    await page.locator('#landmark-site').selectOption(site);
    results.candidates[site] = await audit();
    await capture(`candidate-${site}`);
  }
  for (const yaw of [-30, 0, 60, 30]) {
    await page.locator('#landmark-yaw').fill(String(yaw));
    results.rotations[yaw] = await audit();
    await capture(`yaw-${yaw}`);
  }
  results.audit = await audit();
  for (const name of ['loop', 'clearing', 'approach', 'passage'])
    assert.equal(results.audit[name].clear, true, name);
  assert.ok(results.audit.passage.measuredJambWidth >= 4);
  assert.ok(results.audit.clearing.diameter >= 12);
  for (const view of ['overview', 'medium', 'ground']) {
    await page.locator(`[data-view=${view}]`).click();
    await capture(view);
    results[view] = await snapshot();
  }
  await page.locator('[data-view=medium]').click();
  for (const [name, time, weather] of [
    ['noon', 12, 'CLEAR'],
    ['sunset', 18, 'PARTLY_CLOUDY'],
    ['night', 0, 'CLEAR'],
    ['overcast', 12, 'OVERCAST'],
    ['rain', 12, 'RAIN'],
    ['mist', 12, 'MIST'],
  ]) {
    await environment(time, weather);
    results.environments[name] = await snapshot();
    await capture(name);
  }
  await environment(12, 'CLEAR');
  for (const id of ['landmark-route', 'landmark-pond', 'landmark-bounds'])
    await page.locator(`#${id}`).check();
  await capture('movement-guides');
  await page.locator('#landmark-audit').click();
  assert.match(
    await page.locator('#landmark-audit-result').textContent(),
    /Loop PASS.*clearing PASS/,
  );
  for (const id of ['landmark-route', 'landmark-pond', 'landmark-bounds'])
    await page.locator(`#${id}`).uncheck();
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('Overgrown_Oasis_Ruin_Blockout_v1.glb'),
    ),
    page.locator('#landmark-reference').check(),
  ]);
  await capture('layout-reference');
  await page.locator('#landmark-reference').uncheck();
  await page.locator('#landmark-visible').uncheck();
  await pause();
  results.baseline = await snapshot();
  await page.locator('#landmark-visible').check();
  await pause();
  results.withLandmark = await snapshot();
  await page.locator('#environment-shadows').uncheck();
  await pause();
  results.withoutShadows = await snapshot();
  await page.locator('#environment-shadows').check();
  await page.locator('[data-view=overview]').click();
  assert.deepEqual(errors, []);
  assert.ok(responses.every((response) => response.status === 200));
  results.assetResponses = responses;

  // A real narrow touch viewport uses the existing shadows-off policy.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const touch = await mobile.newPage();
  await touch.goto(`${base}/projects/jelly-oasis/?debug`);
  await touch.waitForFunction(() => window.__oasisLandmark);
  // The loading promise can settle before the first frame containing the GLBs.
  await touch.waitForFunction(() => window.__oasisLandmark.snapshot().calls > 10);
  results.mobile = await touch.evaluate(() => window.__oasisLandmark.snapshot());
  assert.equal(results.mobile.shadows, false);
  for (const id of ['environment-debug', 'landmark-debug']) {
    if (await touch.locator(`#${id}`).evaluate((element) => element.open))
      await touch.locator(`#${id} > summary`).click();
  }
  await touch.screenshot({ path: resolve(output, 'mobile.png') });
  await mobile.close();

  // Negative-path QA: the world stays available and reports a failed GLB visibly.
  const failure = await context.newPage();
  await failure.route('**/Rock_Large_A.glb', (route) =>
    route.fulfill({ status: 404, body: 'Injected QA failure' }),
  );
  await failure.goto(`${base}/projects/jelly-oasis/?debug`);
  await failure.locator('#landmark-status[role=alert]').waitFor();
  assert.equal(await failure.locator('#terrain-error').isVisible(), false);
  results.failureMessage = await failure.locator('#landmark-status').textContent();
  await failure.close();
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
  results.disposal = 'pagehide removed debug API and panels without page errors';
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      {
        screenshots: results.screenshots.length,
        audit: results.audit,
        baseline: results.baseline,
        withLandmark: results.withLandmark,
        withoutShadows: results.withoutShadows,
        mobile: results.mobile,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
