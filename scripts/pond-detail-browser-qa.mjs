import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:5175';
const v2 = process.env.POND_QA_VERSION === 'v2';
const variants = v2 ? ['detail', 'detail-v2'] : ['blockout', 'detail'];
const output = resolve(
  process.env.POND_QA_OUTPUT ??
    'artifacts/jelly-oasis/pond-edge-detail-' + (v2 ? 'v2' : 'v1'),
);
await mkdir(output, { recursive: true });
const baseline = JSON.parse(
  await readFile(
    resolve('artifacts/jelly-oasis/pond-edge-detail-v1/baseline.json'),
    'utf8',
  ),
);
const cameras = {
  ...baseline.cameras,
  ground: { position: [94, -2.8, 81], target: [72, -5.2, 64] },
  'waterfall-facing': { position: [82, 1, 93], target: [66, -3, 50] },
};
const browser = await chromium.launch({
  executablePath:
    process.env.LANDMARK_QA_BROWSER ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const errors = [],
  responses = [],
  result = { cameras, variants: {}, screenshots: [], errors, responses };
try {
  for (const variant of variants) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('response', (r) => {
      if (r.url().endsWith('.glb'))
        responses.push({ url: r.url(), status: r.status() });
    });
    await page.goto(base + '/projects/jelly-oasis/?debug&pond=' + variant);
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    for (const [name, view, time, weather, mobile] of [
      ['overview', 'overview', 12, 'CLEAR'],
      ['medium', 'medium', 12, 'CLEAR'],
      ['ground', 'ground', 12, 'CLEAR'],
      ['waterfall-facing', 'waterfall-facing', 12, 'CLEAR'],
      ['night', 'waterfall-facing', 0, 'CLEAR'],
      ['rain', 'waterfall-facing', 12, 'RAIN'],
      ['mobile', 'medium', 12, 'CLEAR', true],
    ]) {
      if (mobile) await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(
        ({ camera, time, weather }) => {
          window.__oasisLandmark.reviewCamera(camera.position, camera.target);
          for (const [id, value, type] of [
            ['environment-time', time, 'input'],
            ['environment-weather', weather, 'change'],
          ]) {
            const e = document.getElementById(id);
            e.value = String(value);
            e.dispatchEvent(new Event(type, { bubbles: true }));
          }
          document.querySelectorAll('details').forEach((e) => (e.open = false));
        },
        { camera: cameras[view], time, weather },
      );
      await page.waitForFunction(
        (w) =>
          window.__oasisLandmark.snapshot().weather === w &&
          window.__oasisLandmark.snapshot().weatherBlend === 1,
        weather,
      );
      await page.waitForTimeout(250);
      const filename = (variant === variants[1] ? 'after-' : 'before-') + name + '.png';
      await page.screenshot({ path: resolve(output, filename) });
      result.screenshots.push(filename);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    result.variants[variant] = {
      snapshot: await page.evaluate(() => window.__oasisLandmark.snapshot()),
      audit: await page.evaluate(() => window.__oasisLandmark.audit()),
    };
    assert.equal(result.variants[variant].snapshot.pondVariant, variant);
    assert.equal(
      result.variants[variant].snapshot.assetTriangles,
      variant === 'detail-v2' ? 20786 : variant === 'detail' ? 20842 : 19802,
    );
    for (const k of ['loop', 'clearing', 'approach', 'passage'])
      assert.equal(result.variants[variant].audit[k].clear, true, k);
    await page.evaluate(() => {
      const e = document.querySelector('#environment-shadows');
      e.checked = false;
      e.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    assert.equal(
      (await page.evaluate(() => window.__oasisLandmark.snapshot())).shadows,
      false,
    );
    await page.reload();
    await page.waitForFunction(() => window.__oasisLandmark);
    assert.equal(
      (await page.evaluate(() => window.__oasisLandmark.snapshot())).pondDetail,
      variant === 'detail-v2' ? 'v2' : variant === 'detail',
    );
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
    );
    assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
    await context.close();
  }
  assert.equal(
    result.variants[variants[0]].audit.pondHeight,
    result.variants[variants[1]].audit.pondHeight,
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const p = await context.newPage();
  await p.goto(base + '/projects/jelly-oasis/?debug&pond=' + variants[1]);
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
  result.touch = await p.evaluate(() => window.__oasisLandmark.snapshot());
  assert.equal(result.touch.shadows, false);
  await context.close();
  const p2 = await browser.newPage();
  const productionAssets = [];
  p2.on('response', (r) => {
    if (r.url().endsWith('.glb')) productionAssets.push(r.url());
  });
  await p2.goto(
    (process.env.LANDMARK_QA_PRODUCTION_URL ?? 'http://127.0.0.1:5176') +
      '/projects/jelly-oasis/?pond=' +
      variants[1],
  );
  await p2.locator('#landmark-status').waitFor({ state: 'hidden' });
  assert.equal(await p2.evaluate(() => '__oasisLandmark' in window), false);
  await p2.waitForTimeout(750);
  assert.ok(
    productionAssets.some((u) => u.endsWith('/PondEdge_Blockout_Detail_v2.glb')),
  );
  assert.ok(
    productionAssets.every(
      (u) =>
        !u.endsWith('/PondEdge_Blockout.glb') &&
        !u.endsWith('/PondEdge_Blockout_Detail_v1.glb'),
    ),
  );
  result.productionAssets = [...productionAssets];
  productionAssets.length = 0;
  await p2.goto(
    (process.env.LANDMARK_QA_PRODUCTION_URL ?? 'http://127.0.0.1:5176') +
      '/projects/jelly-oasis/',
  );
  await p2.locator('#landmark-status').waitFor({ state: 'hidden' });
  await p2.waitForTimeout(750);
  assert.equal(await p2.evaluate(() => '__oasisLandmark' in window), false);
  assert.ok(
    productionAssets.some((u) => u.endsWith('/PondEdge_Blockout_Detail_v2.glb')),
  );
  assert.ok(
    productionAssets.every(
      (u) =>
        !u.endsWith('/PondEdge_Blockout.glb') &&
        !u.endsWith('/PondEdge_Blockout_Detail_v1.glb'),
    ),
  );
  result.generalProductionAssets = [...productionAssets];
  await p2.screenshot({ path: resolve(output, 'production-default.png') });
  await p2.close();
  assert.deepEqual(errors, []);
  assert.ok(responses.every((r) => r.status === 200));
  result.limitations =
    'Discrete route samples and headless desktop/narrow touch viewport only; not continuous collisions or physical mobile FPS.';
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      screenshots: result.screenshots.length,
      errors,
      pondHeight: result.variants[variants[1]].audit.pondHeight,
      lift: result.variants[variants[1]].audit.pondBankMaxLift,
      routes: Object.fromEntries(
        ['loop', 'clearing', 'approach', 'passage'].map((k) => [
          k,
          result.variants[variants[1]].audit[k].clear,
        ]),
      ),
    }),
  );
} finally {
  await browser.close();
}
