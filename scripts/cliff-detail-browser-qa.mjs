import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.CLIFF_QA_URL ?? 'http://127.0.0.1:4175';
const output = resolve(
  process.env.CLIFF_QA_OUTPUT ?? 'artifacts/jelly-oasis/cliff-detail-v1',
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.EDGE_PATH ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const errors = [];
const results = { base, environments: {}, errors };
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
function monitor(p) {
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
}
monitor(page);
const snapshot = () => page.evaluate(() => window.__oasisLandmark.snapshot());
async function panels(open) {
  for (const id of ['environment-debug', 'landmark-debug'])
    await page.locator(`#${id}`).evaluate((element, value) => {
      element.open = value;
    }, open);
}
async function capture(name) {
  await panels(false);
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(output, `${name}.png`) });
  await panels(true);
}
async function environment(time, weather) {
  await page.locator('#environment-time').fill(String(time));
  await page.locator('#environment-weather').selectOption(weather);
  await page.waitForFunction((expected) => {
    const s = window.__oasisLandmark.snapshot();
    return s.weather === expected && s.weatherBlend === 1;
  }, weather);
  await page.waitForTimeout(350);
}
async function load(detail) {
  await page.goto(
    `${base}/projects/jelly-oasis/?debug&ruin=blockout${detail ? '' : '&cliff=blockout'}`,
  );
  await page.waitForFunction(() => window.__oasisLandmark);
  assert.equal(await page.locator('#environment-debug').evaluate((e) => e.open), false);
  await panels(true);
  await environment(12, 'CLEAR');
}
try {
  // Unchanged blockout isolates the shadow change from the mesh change.
  await load(false);
  await page.locator('[data-view=medium]').click();
  await capture('shadow-after-medium-noon');
  results.blockout = await snapshot();
  assert.equal(results.blockout.assetTriangles, 8002);
  await page.locator('[data-view=ground]').click();
  await capture('shadow-after-ground-noon');
  await page.locator('[data-view=medium]').click();
  await environment(18, 'PARTLY_CLOUDY');
  await capture('shadow-after-medium-sunset');
  await load(true);
  assert.equal((await snapshot()).cliffDetail, true);
  for (const view of ['overview', 'medium', 'ground']) {
    await page.locator(`[data-view=${view}]`).click();
    await capture(`after-${view}-noon`);
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
    await capture(`after-medium-${name}`);
    results.environments[name] = await snapshot();
  }
  await environment(12, 'CLEAR');
  results.audit = await page.evaluate(() => window.__oasisLandmark.audit());
  for (const route of ['loop', 'clearing', 'approach', 'passage'])
    assert.equal(results.audit[route].clear, true, route);
  results.withShadows = await snapshot();
  assert.equal(results.withShadows.assetTriangles, 9044);
  assert.deepEqual(results.withShadows.placement, results.blockout.placement);
  assert.equal(
    results.withShadows.contact.Cliff_Waterfall_A.y,
    results.blockout.contact.Cliff_Waterfall_A.y,
  );
  for (const id of ['landmark-route', 'landmark-pond'])
    await page.locator(`#${id}`).check();
  await capture('movement-guides');
  for (const id of ['landmark-route', 'landmark-pond'])
    await page.locator(`#${id}`).uncheck();
  await page.locator('#environment-shadows').uncheck();
  await page.waitForTimeout(350);
  results.withoutShadows = await snapshot();
  await capture('after-shadow-off');
  await page.locator('#environment-shadows').check();

  // Production without debug: disclosure, controls, no inspection API.
  const normal = await context.newPage();
  monitor(normal);
  const files = [];
  normal.on('response', (r) => {
    if (r.url().endsWith('.glb')) files.push({ url: r.url(), status: r.status() });
  });
  await normal.goto(`${base}/projects/jelly-oasis/`);
  await normal.locator('#landmark-status').waitFor({ state: 'hidden' });
  const panel = normal.locator('#environment-debug');
  assert.equal(await panel.evaluate((e) => e.open), false);
  assert.equal(await normal.evaluate(() => '__oasisLandmark' in window), false);
  assert.equal(await normal.locator('#landmark-debug').count(), 0);
  assert.ok(files.some((f) => f.url.endsWith('/Cliff_Waterfall_A_Detail_v1.glb')));
  assert.ok(!files.some((f) => f.url.endsWith('/Cliff_Waterfall_A.glb')));
  assert.ok(files.every((f) => f.status === 200));
  await normal.screenshot({ path: resolve(output, 'panel-desktop-collapsed.png') });
  await panel.locator('summary').focus();
  await normal.keyboard.press('Enter');
  await normal.waitForFunction(() => {
    const panel = document.querySelector('#environment-debug');
    return (
      panel.open &&
      panel.querySelector('summary').getAttribute('aria-expanded') === 'true'
    );
  });
  assert.equal(await panel.locator('summary').getAttribute('aria-expanded'), 'true');
  assert.equal(await normal.locator('#environment-stats').isVisible(), false);
  assert.equal(await normal.locator('#environment-shadows').isVisible(), false);
  assert.equal(await normal.locator('#terrain-surface').count(), 0);
  await normal.locator('#environment-time').fill('18');
  await normal.waitForFunction(
    () => document.querySelector('#environment-time-label').value === '18:00',
  );
  await normal.locator('#environment-speed').selectOption('4');
  await normal.locator('#environment-weather').selectOption('RAIN');
  await normal.waitForTimeout(5000);
  await normal.screenshot({ path: resolve(output, 'panel-desktop-expanded.png') });
  await normal.locator('#environment-play').click();
  await normal.waitForFunction(
    () => document.querySelector('#environment-play').textContent === '일시정지',
  );
  await normal.waitForFunction(
    () => Number(document.querySelector('#environment-time').value) > 18,
  );
  await normal.locator('#environment-play').click();
  await panel.locator('summary').click();
  await normal.locator('#environment-time').evaluate((e) => e.focus());
  assert.notEqual(
    await normal.evaluate(() => document.activeElement.id),
    'environment-time',
  );
  await normal.reload();
  assert.equal(await panel.evaluate((e) => e.open), false);
  results.publicPanel =
    'Keyboard toggle, hidden-control focus, time, play/pause, speed, weather, reload reset passed; no production inspector/API; Detail v1 is the default GLB.';

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const touch = await mobile.newPage();
  monitor(touch);
  await touch.goto(`${base}/projects/jelly-oasis/`);
  await touch.locator('#landmark-status').waitFor({ state: 'hidden' });
  await touch.screenshot({ path: resolve(output, 'panel-mobile-collapsed.png') });
  await touch.locator('#environment-debug > summary').click();
  const box = await touch.locator('#environment-debug').boundingBox();
  assert.ok(
    box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844,
  );
  await touch.locator('#environment-time').fill('12');
  await touch.locator('#environment-weather').selectOption('MIST');
  await touch.waitForTimeout(5000);
  await touch.screenshot({ path: resolve(output, 'panel-mobile-expanded.png') });
  await touch.setViewportSize({ width: 844, height: 390 });
  await touch.screenshot({ path: resolve(output, 'panel-mobile-landscape.png') });
  const landscape = await touch.locator('#environment-debug').boundingBox();
  assert.ok(landscape.y >= 0 && landscape.y + landscape.height <= 390);
  await touch.setViewportSize({ width: 390, height: 844 });
  await touch.goto(`${base}/projects/jelly-oasis/?debug&cliff=detail-v1`);
  await touch.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  results.mobile = await touch.evaluate(() => window.__oasisLandmark.snapshot());
  assert.equal(results.mobile.shadows, false);
  assert.equal(results.mobile.shadow.allocated, false);
  await touch.locator('#landmark-debug > summary').click();
  await touch.locator('[data-view=medium]').click();
  await touch.locator('#environment-debug > summary').click();
  await touch.waitForFunction(() => !document.querySelector('#landmark-debug').open);
  await touch.screenshot({ path: resolve(output, 'mobile-debug-layout.png') });
  const boxes = await Promise.all(
    ['environment-debug', 'landmark-debug'].map((id) =>
      touch.locator(`#${id}`).boundingBox(),
    ),
  );
  assert.ok(
    boxes[0].y >= boxes[1].y + boxes[1].height ||
      boxes[1].y >= boxes[0].y + boxes[0].height,
  );
  await mobile.close();

  const glb = await readFile(
    resolve(
      'public/assets/jelly-oasis/landmarks/overgrown-ruin/Cliff_Waterfall_A_Detail_v1.glb',
    ),
  );
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  assert.equal(gltf.images?.length ?? 0, 0);
  assert.equal(gltf.nodes[0].name, 'Cliff_Waterfall_A_Detail_v1');
  assert.ok(gltf.nodes.every((n) => !n.translation && !n.rotation && !n.scale));
  results.glb = {
    bytes: glb.length,
    nodes: gltf.nodes,
    materials: gltf.materials.map((m) => m.name),
    images: 0,
  };
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  assert.equal(await page.locator('#environment-debug').count(), 0);
  assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      {
        publicPanel: results.publicPanel,
        withShadows: results.withShadows,
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
