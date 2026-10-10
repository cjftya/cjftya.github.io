import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const root = resolve('artifacts/jelly-oasis/aesthetic-improvement-v1');
const phase = process.env.AESTHETIC_QA_PHASE ?? 'tree';
const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:4184';
const variants =
  phase === 'tree'
    ? process.env.AESTHETIC_QA_INCLUDE_FLAT
      ? ['baseline', 'flat', 'refined']
      : ['baseline', 'refined']
    : phase === 'pond'
      ? ['baseline', 'shore', 'soft', 'deep']
      : ['baseline', 'refined'];
const files = {
  tree: ['Tree_Landmark_Detail_v1.glb', 'Tree_Landmark_'],
  pond: ['PondEdge_Blockout_Detail_v2.glb', 'PondEdge_'],
  cliff: ['Cliff_Waterfall_A_Detail_v1.glb', 'Cliff_'],
  ruin: ['Ruin_Arch_A_Detail_v1.glb', 'Ruin_Arch_'],
};
const selected = {
  tree: 'Tree_Landmark_Blockout',
  pond: 'PondEdge_Blockout',
  cliff: 'Cliff_Waterfall_A',
};
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const result = { variants: {}, errors: [], responses: [] };
async function env(page, time, weather = 'CLEAR') {
  await page.evaluate(
    ([time, weather]) => {
      for (const [id, value, event] of [
        ['environment-time', time, 'input'],
        ['environment-weather', weather, 'change'],
      ]) {
        const e = document.getElementById(id);
        e.value = String(value);
        e.dispatchEvent(new Event(event, { bubbles: true }));
      }
    },
    [time, weather],
  );
  await page.waitForFunction(
    (w) =>
      window.__oasisLandmark.snapshot().weather === w &&
      window.__oasisLandmark.snapshot().weatherBlend === 1,
    weather,
  );
}
async function camera(page, name) {
  if (['medium', 'ground'].includes(name)) {
    await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
    await page.locator('[data-view=' + name + ']').click();
    return;
  }
  await page.evaluate((name) => {
    const s = window.__oasisLandmark.snapshot(),
      c = Math.cos(Math.PI / 6);
    const specs = {
      'tree-under': [[-30, 1.8, 6], [-12, 13, -18], s.contact.Tree_Landmark_Blockout.y],
      'pond-top': [[0, 35, 7], [0, 0, 7], s.pondHeight],
      'waterfall-facing': [[82, 1, 93], [66, -3, 50], null],
      'cliff-front': [[0, 8, 8], [0, 8, -12], s.contact.Cliff_Waterfall_A.y],
      arch: [[15, 2, 6], [15, 4.4, -7], s.contact.Ruin_Arch_A.y],
      'root-ruin': [[-29, 8, 0], [-12, 4, -8], s.contact.Ruin_Wall_A.y],
    };
    const [p, t, h] = specs[name],
      w = ([x, y, z]) => [70 + x * c + z * 0.5, h + y, 58 - x * 0.5 + z * c];
    window.__oasisLandmark.reviewCamera(h === null ? p : w(p), h === null ? t : w(t));
  }, name);
}
try {
  for (const variant of variants) {
    const output = resolve(root, phase, variant);
    await mkdir(output, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
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
    if (variant !== 'baseline' && !['soft', 'deep'].includes(variant)) {
      await page.route('**/' + files[phase][0], (route) =>
        route.fulfill({
          path:
            selected[phase] && variant !== 'flat'
              ? resolve(
                  'public/assets/jelly-oasis/landmarks/overgrown-ruin/aesthetic-improvement-v1',
                  selected[phase] + '_Refined_v1.glb',
                )
              : resolve(root, files[phase][1] + variant + '_v1.glb'),
          contentType: 'model/gltf-binary',
        }),
      );
      if (phase === 'ruin')
        await page.route('**/Ruin_Wall_A_Detail_v1.glb', (route) =>
          route.fulfill({
            path: resolve(root, 'Ruin_Wall_refined_v1.glb'),
            contentType: 'model/gltf-binary',
          }),
        );
    }
    await page.goto(
      base +
        '/projects/jelly-oasis/?debug&aesthetic=baseline' +
        (['soft', 'deep'].includes(variant) ? '&water=' + variant : ''),
    );
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    const before = await page.evaluate(() => window.__oasisLandmark.snapshot());
    result.variants[variant] = {
      initial: before,
      audit: await page.evaluate(() => window.__oasisLandmark.audit()),
      shots: {},
    };
    const views =
      phase === 'tree'
        ? ['tree-under', 'medium', 'ground']
        : phase === 'pond'
          ? ['pond-top', 'waterfall-facing', 'medium']
          : phase === 'cliff'
            ? ['cliff-front', 'medium', 'ground']
            : ['arch', 'root-ruin', 'medium', 'ground'];
    for (const [time, weather, label] of [
      [12, 'CLEAR', 'noon'],
      [0, 'CLEAR', 'night'],
      ...(phase === 'pond'
        ? [
            [12, 'RAIN', 'rain'],
            [12, 'MIST', 'mist'],
          ]
        : []),
    ]) {
      await env(page, time, weather);
      for (const view of views) {
        await camera(page, view);
        await page
          .locator('details')
          .evaluateAll((es) => es.forEach((e) => (e.open = false)));
        await page.waitForTimeout(350);
        await page.screenshot({ path: resolve(output, view + '-' + label + '.png') });
        result.variants[variant].shots[view + '-' + label] = await page.evaluate(() =>
          window.__oasisLandmark.snapshot(),
        );
      }
    }
    for (const key of ['loop', 'clearing', 'approach', 'passage'])
      assert.equal(result.variants[variant].audit[key].clear, true);
    await context.close();
  }
  for (const variant of variants.slice(1)) {
    assert.deepEqual(
      result.variants[variant].initial.contact,
      result.variants.baseline.initial.contact,
    );
    assert.deepEqual(
      result.variants[variant].initial.placement,
      result.variants.baseline.initial.placement,
    );
    assert.equal(
      result.variants[variant].initial.pondHeight,
      result.variants.baseline.initial.pondHeight,
    );
  }
  assert.deepEqual(result.errors, []);
  assert.ok(result.responses.every((r) => r.status === 200));
} finally {
  await browser.close();
  await writeFile(
    resolve(root, phase, 'browser-qa.json'),
    JSON.stringify(result, null, 2),
  );
}
console.log(phase + ' comparison PASS');
