import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const root = resolve('artifacts/jelly-oasis/aesthetic-improvement-v1');
const output = resolve(root, 'integrated');
await mkdir(output, { recursive: true });
const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:4184';
const flags = 'tree=refined&pond=refined&cliff=refined&water=soft';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = {
  states: {},
  production: {},
  responses: [],
  errors: [],
  crystalPrimitives: {},
};
const snap = (page) => page.evaluate(() => window.__oasisLandmark.snapshot());
function monitor(page) {
  page.on('pageerror', (e) => results.errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') results.errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.url().endsWith('.glb'))
      results.responses.push({ url: r.url(), status: r.status() });
  });
}
async function env(page, t, w) {
  await page.evaluate(
    ([t, w]) => {
      for (const [id, v, event] of [
        ['environment-time', t, 'input'],
        ['environment-weather', w, 'change'],
      ]) {
        const e = document.getElementById(id);
        e.value = String(v);
        e.dispatchEvent(new Event(event, { bubbles: true }));
      }
    },
    [t, w],
  );
  await page.waitForFunction(
    (w) =>
      window.__oasisLandmark.snapshot().weather === w &&
      window.__oasisLandmark.snapshot().weatherBlend === 1,
    w,
  );
}
async function shot(page, name) {
  await page
    .locator('details')
    .evaluateAll((es) => es.forEach((e) => (e.open = false)));
  await page.waitForTimeout(350);
  await page.screenshot({ path: resolve(output, name + '.png') });
  results.states[name] = await snap(page);
}
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    monitor(page);
    let camera;
    for (const variant of ['baseline', 'refined']) {
      await page.goto(
        base +
          '/projects/jelly-oasis/?debug' +
          (variant === 'refined' ? '&' + flags : '&aesthetic=baseline'),
      );
      await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
      await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
      await page.locator('[data-view=medium]').click();
      const s = await snap(page);
      camera ??= { position: s.camera, target: s.target };
      await page.evaluate(
        ({ position, target }) => window.__oasisLandmark.reviewCamera(position, target),
        camera,
      );
      const name = (mobile ? 'mobile' : 'desktop') + '-' + variant;
      for (const [t, w, label] of mobile
        ? [[12, 'CLEAR', 'noon']]
        : [
            [12, 'CLEAR', 'noon'],
            [0, 'CLEAR', 'night'],
            [12, 'RAIN', 'rain'],
            [12, 'MIST', 'mist'],
          ]) {
        await env(page, t, w);
        await shot(page, name + '-' + label);
      }
      const a = await page.evaluate(() => window.__oasisLandmark.audit());
      for (const k of ['loop', 'clearing', 'approach', 'passage'])
        assert.equal(a[k].clear, true);
      results.states[name + '-audit'] = a;
      assert.equal(s.modules, 16);
      assert.equal(s.assetTriangles, 20786);
      assert.equal(s.crystalDetail, false);
      if (mobile) assert.equal(s.shadows, true);
      else {
        await env(page, 12, 'CLEAR');
        await page.locator('#environment-debug').evaluate((e) => (e.open = true));
        await page.locator('#environment-shadows').uncheck();
        await shot(page, name + '-shadow-off');
      }
    }
    const before = results.states[(mobile ? 'mobile' : 'desktop') + '-baseline-noon'],
      after = results.states[(mobile ? 'mobile' : 'desktop') + '-refined-noon'];
    assert.deepEqual(after.contact, before.contact);
    assert.deepEqual(after.placement, before.placement);
    assert.equal(after.pondHeight, before.pondHeight);
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  for (const query of ['', '?' + flags + '&crystal=detail']) {
    const page = await context.newPage(),
      assets = [];
    monitor(page);
    page.on('response', (r) => {
      if (r.url().endsWith('.glb')) assets.push(r.url());
    });
    await page.goto(base + '/projects/jelly-oasis/' + query);
    await page.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
    assert.equal(assets.length, 16);
    assert.equal(
      assets.filter((s) => s.includes('aesthetic-improvement-v1')).length,
      3,
    );
    assert.ok(assets.every((s) => !s.includes('crystal-accent-detail-v1')));
    results.production[query || 'default'] = assets;
    await page.close();
  }
  const failure = await context.newPage();
  await failure.route('**/Tree_Landmark_Blockout_Refined_v1.glb', (r) =>
    r.fulfill({ status: 404, body: 'injected QA failure' }),
  );
  await failure.goto(base + '/projects/jelly-oasis/?debug&tree=refined');
  await failure.waitForFunction(() =>
    document
      .getElementById('landmark-status')
      .textContent.includes('불러오지 못했습니다'),
  );
  assert.equal(await failure.evaluate(() => '__oasisLandmark' in window), false);
  results.failure404 = await failure.locator('#landmark-status').textContent();
  await failure.screenshot({ path: resolve(output, 'candidate-404.png') });
  await failure.close();
  const lifecycle = await context.newPage();
  await lifecycle.goto(base + '/projects/jelly-oasis/?debug&' + flags);
  await lifecycle.waitForFunction(() => window.__oasisLandmark);
  await lifecycle.reload();
  await lifecycle.waitForFunction(() => window.__oasisLandmark);
  assert.equal((await snap(lifecycle)).aesthetic.tree, true);
  await lifecycle.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  assert.equal(await lifecycle.evaluate(() => '__oasisLandmark' in window), false);
  results.lifecycle = 'PASS';
  await context.close();
  for (const label of ['A', 'B', 'C']) {
    const file = await readFile(
      'public/assets/jelly-oasis/landmarks/overgrown-ruin/crystal-accent-detail-v1/Crystal_Blockout_' +
        label +
        '_Detail_v1.glb',
    );
    const g = JSON.parse(file.toString('utf8', 20, 20 + file.readUInt32LE(12)));
    results.crystalPrimitives[label] = {
      primitives: g.meshes.flatMap((m) => m.primitives).length,
      materials: g.materials.length,
      triangles: g.meshes
        .flatMap((m) => m.primitives)
        .reduce((n, p) => n + g.accessors[p.indices].count / 3, 0),
    };
  }
  assert.deepEqual(results.errors, []);
  assert.ok(results.responses.every((r) => r.status === 200));
} finally {
  await browser.close();
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
}
console.log('Integrated aesthetic candidates PASS');
