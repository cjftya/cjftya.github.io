import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
const output =
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/tree-grove-rock-expansion-v1';
const base = process.env.OASIS_QA_URL ?? 'http://127.0.0.1:5179';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_URL
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
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
    server.on('exit', (c) => reject(new Error(String(c))));
  });
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = {
  errors: [],
  assets: [],
  states: {},
  placements: {},
  audits: {},
  lifecycle: {},
  prototypes: {},
  limitations: [
    'Galaxy Fold FPS, heat, long-duration GPU memory NOT_TESTED',
    'SwiftShader renderer snapshots are not real-device performance',
  ],
};
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
const capture = async (p, key) => {
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${output}/${key}.jpg`, type: 'jpeg', quality: 82 });
  result.states[key] = await snap(p);
};
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 780],
    [844, 390],
  ]) {
    for (const variant of ['off', 'a', 'b']) {
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
      page.on('response', (r) => {
        if (r.url().endsWith('.glb'))
          result.assets.push({ url: r.url(), status: r.status() });
      });
      const prefix = `${variant}-${width}x${height}`;
      console.log(prefix);
      await page.goto(`${base}/projects/jelly-oasis/?debug&scenery=${variant}`);
      await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
      await page.evaluate(() => {
        const e = document.getElementById('environment-time');
        e.value = '12';
        e.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelectorAll('details').forEach((e) => (e.open = false));
      });
      for (const view of ['overview', 'medium', 'ground']) {
        await page.evaluate(
          (v) => document.querySelector(`[data-view="${v}"]`).click(),
          view,
        );
        await capture(page, `${prefix}-${view}`);
      }
      const initial = await snap(page);
      assert.equal(initial.terrain.size, 224);
      assert.equal(initial.modules, 16);
      assert.equal(initial.assetTriangles, 20894);
      assert.equal(initial.scenery.variant, variant);
      assert(initial.scenery.draws <= 6);
      assert.equal(initial.waterEffects.solver, 'gpgpu-heightfield');
      assert.equal(initial.waterEffects.rockFlowCount, 0);
      assert.deepEqual(initial.excavation.channelPath, []);
      result.placements[prefix] = await page.evaluate(() => ({
        scenery: window.__oasisLandmark.reviewScenery(),
        vegetation: window.__oasisLandmark.reviewVegetation(),
        composition: window.__oasisLandmark.reviewComposition(),
      }));
      for (const p of result.placements[prefix].scenery)
        assert(
          Math.max(Math.abs(p.world[0]), Math.abs(p.world[2])) + p.radius + 1 < 112,
        );
      result.audits[prefix] = await page.evaluate(() => window.__oasisLandmark.audit());
      for (const key of ['loop', 'clearing', 'approach', 'passage'])
        assert.equal(result.audits[prefix][key].clear, true);
      await page.evaluate(() =>
        window.__oasisLandmark.reviewCamera([14, -4.6, 35], [14, -6.3, 22]),
      );
      await capture(page, `${prefix}-pond`);
      if (width === 1440) {
        for (const [view, position, target] of [
          ['west', [-92, 24, 60], [-47, 4, 6]],
          ['north', [30, 48, -38], [0, 18, -88]],
        ]) {
          await page.evaluate(
            ([position, target]) =>
              window.__oasisLandmark.reviewCamera(position, target),
            [position, target],
          );
          await capture(page, `${prefix}-${view}`);
        }
        if (variant === 'a') {
          // Four close views of each of the six actual placed source shapes.
          const placements = result.placements[prefix].scenery;
          for (const kind of [
            'broad',
            'spire',
            'young',
            'pebble',
            'boulder',
            'ridge',
          ]) {
            const p = placements.find((p) => p.kind === kind);
            assert(p, kind);
            result.prototypes[kind] = p;
            await page.evaluate(
              (kind) => window.__oasisLandmark.reviewSceneryShape(kind),
              kind,
            );
            for (let angle = 0; angle < 4; angle++) {
              const a = (angle * Math.PI) / 2,
                d = Math.max(5, p.height * 1.8, p.radius * 3);
              const target = [p.world[0], p.world[1] + p.height * 0.5, p.world[2]];
              const position = [
                target[0] + Math.cos(a) * d,
                target[1] + d * 0.2,
                target[2] + Math.sin(a) * d,
              ];
              await page.evaluate(
                ([position, target]) =>
                  window.__oasisLandmark.reviewCamera(position, target),
                [position, target],
              );
              await capture(page, `prototype-${kind}-${angle}`);
            }
            if (['broad', 'spire', 'young'].includes(kind))
              for (const hour of [18, 0]) {
                await page.evaluate((hour) => {
                  const e = document.getElementById('environment-time');
                  e.value = String(hour);
                  e.dispatchEvent(new Event('input', { bubbles: true }));
                }, hour);
                await capture(page, `prototype-${kind}-hour${hour}`);
              }
            await page.evaluate(() => {
              const e = document.getElementById('environment-time');
              e.value = '12';
              e.dispatchEvent(new Event('input', { bubbles: true }));
            });
          }
          await page.evaluate(() => {
            window.__oasisLandmark.reviewSceneryShape('');
            document.querySelector('[data-view="medium"]').click();
          });
          for (const hour of [18, 0]) {
            await page.evaluate((hour) => {
              const e = document.getElementById('environment-time');
              e.value = String(hour);
              e.dispatchEvent(new Event('input', { bubbles: true }));
            }, hour);
            await capture(page, `${prefix}-hour${hour}`);
          }
          await page.evaluate(() => {
            const e = document.getElementById('environment-time');
            e.value = '12';
            e.dispatchEvent(new Event('input', { bubbles: true }));
          });
          for (const weather of ['RAIN', 'MIST']) {
            await page.selectOption('#environment-weather', weather, { force: true });
            await page.waitForTimeout(500);
            await capture(page, `${prefix}-${weather.toLowerCase()}`);
          }
          await page.selectOption('#environment-weather', 'CLEAR', { force: true });
          await page.evaluate(() => {
            const e = document.getElementById('environment-shadows');
            e.checked = false;
            e.dispatchEvent(new Event('change', { bubbles: true }));
          });
          await capture(page, `${prefix}-shadows-off`);
          const memories = [];
          for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
            await page.waitForTimeout(100);
            assert.deepEqual(
              await page.evaluate(() => window.__oasisLandmark.reviewScenery()),
              placements,
            );
            const s = await snap(page);
            memories.push({
              geometries: s.geometries,
              textures: s.textures,
              instances: s.scenery.instanceCount,
            });
          }
          assert(
            memories.every((m) => JSON.stringify(m) === JSON.stringify(memories[0])),
          );
          await page.evaluate(() =>
            window.__oasisLandmark.reviewIsolate('Ruin_Arch_A'),
          );
          assert.equal((await snap(page)).scenery.visible, false);
          await page.evaluate(() => window.__oasisLandmark.reviewIsolate(''));
          assert.equal((await snap(page)).scenery.visible, true);
          await page.evaluate(() => {
            const canvas = document.querySelector('canvas'),
              gl = canvas.getContext('webgl2'),
              ext = gl.getExtension('WEBGL_lose_context');
            window.__sceneryContext = ext;
            ext.loseContext();
          });
          await page.waitForTimeout(100);
          await page.evaluate(() => window.__sceneryContext.restoreContext());
          await page.waitForTimeout(700);
          assert.deepEqual(
            await page.evaluate(() => window.__oasisLandmark.reviewScenery()),
            placements,
          );
          const restored = await snap(page);
          assert.equal(restored.waterEffects.solver, 'gpgpu-heightfield');
          result.lifecycle = { memories, restored };
        }
      }
      await context.close();
    }
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e)));
    await page.goto(`${base}/projects/jelly-oasis/?scenery=off`);
    await page.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
    await page.screenshot({
      path: `${output}/production-${width}x${height}.jpg`,
      type: 'jpeg',
      quality: 82,
    });
    await context.close();
  }
  for (const asset of result.assets) assert.equal(asset.status, 200);
  result.sourceHashes = {};
  for (const asset of new Set(result.assets.map((a) => new URL(a.url).pathname)))
    result.sourceHashes[asset] = createHash('sha256')
      .update(await readFile(`public${asset}`))
      .digest('hex');
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/browser-qa.json`, JSON.stringify(result, null, 2));
  await browser.close();
  server?.kill();
}
console.log(
  JSON.stringify({
    status: result.status,
    errors: result.errors,
    screenshots: Object.keys(result.states).length,
  }),
);
