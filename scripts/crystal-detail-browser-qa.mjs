import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:4183';
const output = resolve(
  process.env.CRYSTAL_QA_OUTPUT ?? 'artifacts/jelly-oasis/crystal-accent-detail-v1',
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = {
  variants: {},
  mobile: {},
  production: {},
  errors: [],
  responses: [],
  screenshots: [],
};
const names = ['Crystal_Blockout_A', 'Crystal_Blockout_B', 'Crystal_Blockout_C'];
const anchors = [
  [15, 19],
  [-15, 12],
  [9, -20],
];
function monitor(page) {
  page.on('pageerror', (error) => results.errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') results.errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().endsWith('.glb'))
      results.responses.push({ url: response.url(), status: response.status() });
  });
}
const snap = (page) => page.evaluate(() => window.__oasisLandmark.snapshot());
async function environment(page, time) {
  await page.evaluate((time) => {
    for (const [id, value, event] of [
      ['environment-time', time, 'input'],
      ['environment-weather', 'CLEAR', 'change'],
    ]) {
      const e = document.getElementById(id);
      e.value = String(value);
      e.dispatchEvent(new Event(event, { bubbles: true }));
    }
  }, time);
  await page.waitForFunction(
    () =>
      window.__oasisLandmark.snapshot().weather === 'CLEAR' &&
      window.__oasisLandmark.snapshot().weatherBlend === 1,
  );
}
async function capture(page, name) {
  await page.evaluate(() =>
    document.querySelectorAll('details').forEach((e) => {
      e.open = false;
    }),
  );
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(output, name + '.png') });
  results.screenshots.push(name + '.png');
  return snap(page);
}
async function medium(page) {
  await page.locator('#landmark-debug').evaluate((e) => {
    e.open = true;
  });
  await page.locator('[data-view=medium]').click();
}
function world([x, y, z], height) {
  return [
    70 + x * Math.cos(Math.PI / 6) + z * 0.5,
    height + y,
    58 - x * 0.5 + z * Math.cos(Math.PI / 6),
  ];
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  monitor(page);
  for (const variant of ['blockout', 'detail']) {
    await page.goto(`${base}/projects/jelly-oasis/?debug&crystal=${variant}`);
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    await environment(page, 12);
    await medium(page);
    const initial = await snap(page);
    assert.equal(initial.crystalDetail, variant === 'detail');
    assert.equal(initial.assetTriangles, variant === 'detail' ? 20894 : 20786);
    assert.equal(initial.pondVariant, 'detail-v2');
    results.variants[variant] = {
      initial,
      audit: await page.evaluate(() => window.__oasisLandmark.audit()),
      noon: await capture(page, variant + '-medium-noon'),
      crystals: {},
    };
    for (const [i, name] of names.entries()) {
      await page.locator('#landmark-debug').evaluate((e) => {
        e.open = true;
      });
      await page.locator('#landmark-isolate').selectOption(name);
      const [x, z] = anchors[i],
        h = initial.contact[name].y;
      await page.evaluate(
        ([p, t]) => window.__oasisLandmark.reviewCamera(p, t),
        [world([x + 4.5, 2.9, z + 8], h), world([x + 0.1, 1.5, z + 0.2], h)],
      );
      results.variants[variant].crystals[name] = await capture(
        page,
        variant + '-' + name,
      );
    }
    await page.locator('#landmark-debug').evaluate((e) => {
      e.open = true;
    });
    await page.locator('#landmark-isolate').selectOption('');
    await medium(page);
    await environment(page, 0);
    results.variants[variant].night = await capture(page, variant + '-medium-night');
    assert.equal(results.variants[variant].night.moon.castShadow, true);
    assert.equal(results.variants[variant].night.moon.allocated, true);
    for (const k of ['loop', 'clearing', 'approach', 'passage'])
      assert.equal(results.variants[variant].audit[k].clear, true);
    await page.reload();
    await page.waitForFunction(() => window.__oasisLandmark);
    assert.equal((await snap(page)).crystalDetail, variant === 'detail');
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
    );
    assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
  }
  const before = results.variants.blockout,
    after = results.variants.detail;
  assert.deepEqual(after.initial.placement, before.initial.placement);
  assert.deepEqual(after.initial.contact, before.initial.contact);
  assert.equal(after.initial.pondHeight, before.initial.pondHeight);
  assert.equal(
    after.initial.pondBankMaxDisplacement,
    before.initial.pondBankMaxDisplacement,
  );
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const touch = await mobile.newPage();
  monitor(touch);
  for (const variant of ['blockout', 'detail']) {
    await touch.goto(`${base}/projects/jelly-oasis/?debug&crystal=${variant}`);
    await touch.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    await environment(touch, 12);
    await medium(touch);
    results.mobile[variant] = await capture(touch, variant + '-mobile');
    assert.equal(results.mobile[variant].shadows, false);
  }
  await mobile.close();
  // Production query without debug must never opt into candidates.
  for (const query of ['', '?crystal=detail']) {
    const p = await context.newPage(),
      assets = [];
    monitor(p);
    p.on('response', (r) => {
      if (r.url().endsWith('.glb')) assets.push({ url: r.url(), status: r.status() });
    });
    await p.goto(`${base}/projects/jelly-oasis/${query}`);
    await p.locator('#landmark-status').waitFor({ state: 'hidden' });
    await p.waitForTimeout(500);
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    assert.equal(assets.length, 16);
    for (const name of names) {
      assert.ok(assets.some((r) => r.url.endsWith('/' + name + '.glb')));
      assert.ok(!assets.some((r) => r.url.endsWith('/' + name + '_Detail_v1.glb')));
    }
    results.production[query || 'default'] = assets;
    await p.close();
  }
  // Separate injected failure: expected 404 stays out of the clean-run errors array.
  const failure = await context.newPage();
  const expectedErrors = [];
  failure.on('console', (message) => {
    if (message.type() === 'error') expectedErrors.push(message.text());
  });
  await failure.route('**/Crystal_Blockout_B_Detail_v1.glb', (route) =>
    route.fulfill({ status: 404, body: 'Injected QA failure' }),
  );
  await failure.goto(`${base}/projects/jelly-oasis/?debug&crystal=detail`);
  await failure.locator('#landmark-status[role=alert]').waitFor();
  results.failureMessage = await failure.locator('#landmark-status').textContent();
  assert.match(results.failureMessage, /랜드마크를 불러오지 못했습니다/);
  assert.ok(
    expectedErrors.some((message) =>
      message.includes('Crystal_Blockout_B_Detail_v1.glb'),
    ),
  );
  results.expectedFailureErrors = expectedErrors;
  assert.equal(await failure.locator('#terrain-error').isVisible(), false);
  await failure.close();
  assert.deepEqual(results.errors, []);
  assert.ok(results.responses.every((r) => r.status === 200));
  results.limitations =
    'Headless Edge and touch viewport; sampled clearance, not NavMesh/collisions or physical mobile FPS. Mobile review camera is 1.55x farther, unchanged product camera.';
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify({
      screenshots: results.screenshots.length,
      triangles: [before.initial.assetTriangles, after.initial.assetTriangles],
      calls: [before.noon.calls, after.noon.calls],
      errors: results.errors,
    }),
  );
} finally {
  await browser.close();
}
