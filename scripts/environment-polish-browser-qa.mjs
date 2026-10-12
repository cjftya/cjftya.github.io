import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const output =
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/environment-polish-v1';
const base = process.env.OASIS_QA_URL ?? 'http://127.0.0.1:5178';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_URL
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '5178',
      '--strictPort',
    ]);
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (String(d).includes('Local:')) resolve();
    });
    server.on('error', reject);
    server.on('exit', (code) => reject(new Error(`preview exited ${code}`)));
  });
let browser;
const result = {
  base,
  dpr: 1,
  reducedMotion: 'reduce',
  errors: [],
  assets: [],
  states: {},
  audits: {},
  screenshots: [],
  limitations: ['Android hardware FPS/heat and long-duration GPU memory NOT_TESTED'],
};
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
function monitor(p) {
  p.on('pageerror', (e) => result.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') result.errors.push(m.text());
  });
  p.on('response', (r) => {
    if (r.url().endsWith('.glb'))
      result.assets.push({ url: r.url(), status: r.status() });
  });
}
async function env(p, h, w = 'CLEAR') {
  await p.evaluate(
    ([h, w]) => {
      for (const [id, v, event] of [
        ['environment-time', h, 'input'],
        ['environment-weather', w, 'change'],
      ]) {
        const e = document.getElementById(id);
        e.value = String(v);
        e.dispatchEvent(new Event(event, { bubbles: true }));
      }
    },
    [h, w],
  );
  await p.waitForFunction((w) => {
    const s = window.__oasisLandmark.snapshot();
    return s.weather === w && s.weatherBlend === 1;
  }, w);
}
async function capture(p, name, debug = true) {
  await p.evaluate(() =>
    document.querySelectorAll('details').forEach((e) => (e.open = false)),
  );
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${output}/${name}.jpg`, type: 'jpeg', quality: 75 });
  result.screenshots.push(`${name}.jpg`);
  if (debug) result.states[name] = await snap(p);
}
function world([x, y, z], s) {
  const { position, rotationY: a, scale } = s.placement,
    c = Math.cos(a),
    n = Math.sin(a);
  return [
    position.x + (x * c + z * n) * scale,
    s.contact.Ruin_Wall_A.y + y * scale,
    position.z + (-x * n + z * c) * scale,
  ];
}
try {
  browser = await chromium.launch({
    executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
    headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 780],
    [844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: width < 500 || height < 500,
      hasTouch: width < 500 || height < 500,
    });
    const p = await context.newPage();
    monitor(p);
    const prefix = `${width}x${height}`;
    await p.goto(
      `${base}/projects/jelly-oasis/?composition=off&vegetation=off&surface=cpu&waterfall=on`,
    );
    await p.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    await capture(p, `${prefix}-production-entry`, false);
    await p.click('#reset-view');
    await capture(p, `${prefix}-production-reset`, false);
    await p.goto(`${base}/projects/jelly-oasis/?debug`);
    await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    await env(p, 12);
    for (const view of ['overview', 'medium', 'ground']) {
      await p.evaluate(
        (v) => document.querySelector(`[data-view="${v}"]`).click(),
        view,
      );
      await capture(p, `${prefix}-${view}-noon`);
    }
    const s = await snap(p);
    assert.equal(s.modules, 16);
    assert.equal(s.assetTriangles, 20894);
    assert.equal(s.waterEffects.rockFlowCount, 0);
    assert.deepEqual(s.excavation.channelPath, []);
    assert.equal(s.vegetation.instanceCount, width < 500 || height < 500 ? 120 : 180);
    assert.equal(s.composition.instanceCount, width < 500 || height < 500 ? 55 : 80);
    result.audits[prefix] = await p.evaluate(() => window.__oasisLandmark.audit());
    for (const k of ['loop', 'clearing', 'approach', 'passage'])
      assert.equal(result.audits[prefix][k].clear, true, k);
    if (width === 1440) {
      result.vegetation = await p.evaluate(() =>
        window.__oasisLandmark.reviewVegetation(),
      );
      result.composition = await p.evaluate(() =>
        window.__oasisLandmark.reviewComposition(),
      );
      const views = {
        'tree-under': [
          [-12, 2, -12],
          [-12, 23, -18],
        ],
        'tree-right': [
          [22, 20, -2],
          [-12, 15, -18],
        ],
        'cliff-front': [
          [0, 16, 35],
          [0, 10, -16],
        ],
        'cliff-side': [
          [33, 18, 5],
          [0, 12, -16],
        ],
        'ruin-front': [
          [15, 7, 27],
          [16, 4, -6],
        ],
        'ruin-side': [
          [38, 11, 15],
          [18, 4, -6],
        ],
      };
      for (const [label, h, w] of [
        ['noon', 12, 'CLEAR'],
        ['sunset', 18, 'CLEAR'],
        ['night', 0, 'CLEAR'],
        ['rain', 12, 'RAIN'],
        ['mist', 12, 'MIST'],
      ]) {
        await env(p, h, w);
        await p.evaluate(() =>
          document.querySelector('[data-view="overview"]').click(),
        );
        await capture(p, `overview-${label}`);
        for (const [v, [pos, target]] of Object.entries(views)) {
          await p.evaluate(
            ([pos, target]) => window.__oasisLandmark.reviewCamera(pos, target),
            [world(pos, s), world(target, s)],
          );
          await capture(p, `${v}-${label}`);
        }
        for (const v of ['pond-top', 'pond-low']) {
          await p.goto(`${base}/projects/jelly-oasis/?debug&view=${v}`);
          await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
          await env(p, h, w);
          await capture(p, `${v}-${label}`);
        }
        await p.evaluate(() =>
          window.__oasisLandmark.reviewCamera([-18, 52, -47], [-13, 28, -80]),
        );
        await capture(p, `north-${label}`);
      }
      await env(p, 12);
      await p.evaluate(() => {
        const option = new Option('PondEdge_Blockout', 'PondEdge_Blockout');
        document.querySelector('#landmark-isolate').append(option);
      });
      await p.selectOption('#landmark-isolate', 'PondEdge_Blockout', { force: true });
      await p.evaluate(() =>
        window.__oasisLandmark.reviewCamera([82, 12, 93], [76, 7, 64]),
      );
      await capture(p, 'shore-isolated');
    }
    await context.close();
  }
  assert.deepEqual(result.errors, []);
  assert(result.assets.length > 0 && result.assets.every((a) => a.status === 200));
  const productionAssets = [
    ...new Set(result.assets.map((a) => a.url.split('/assets/')[1])),
  ];
  assert.equal(productionAssets.length, 16);
  result.assetHashes = await Promise.all(
    productionAssets.map(async (path) => ({
      path,
      sha256: createHash('sha256')
        .update(await readFile(`public/assets/${path}`))
        .digest('hex'),
    })),
  );
  result.status = 'PASS';
} finally {
  await writeFile(
    `${output}/browser-qa.json`,
    JSON.stringify(
      result,
      (k, v) =>
        ['phase2', 'shorelineContacts', 'shorelineContactTypes', 'timings'].includes(k)
          ? undefined
          : v,
      2,
    ),
  );
  await browser?.close();
  server?.kill();
}
console.log('Environment polish browser QA passed');
