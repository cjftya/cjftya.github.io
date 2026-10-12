import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const output = process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/map-rescale-v1';
const base = process.env.OASIS_QA_URL ?? 'http://127.0.0.1:5181';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_URL
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '5181',
      '--strictPort',
    ]);
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (String(d).includes('Local:')) resolve();
    });
    server.on('exit', (c) => reject(new Error(String(c))));
  });
const b = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = { errors: [], states: {} };
try {
  for (const fallback of [false, true]) {
    const c = await b.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    if (fallback)
      await c.addInitScript(() => {
        const proto = WebGL2RenderingContext.prototype,
          orig = proto.getExtension;
        proto.getExtension = function (name) {
          return name === 'EXT_color_buffer_float' ? null : orig.call(this, name);
        };
      });
    const p = await c.newPage();
    p.on('pageerror', (e) => result.errors.push(String(e)));
    await p.goto(`${base}/projects/jelly-oasis/?debug`);
    await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    const snap = () => p.evaluate(() => window.__oasisLandmark.snapshot());
    const initial = await snap();
    assert.equal(initial.terrain.size, 224);
    assert.equal(
      initial.waterEffects.solver,
      fallback ? 'cpu-heightfield' : 'gpgpu-heightfield',
    );
    await p.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
    );
    await p.waitForTimeout(100);
    await p.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
    );
    await p.waitForTimeout(200);
    const resumed = await snap();
    assert.equal(resumed.modules, 16);
    assert.equal(resumed.waterEffects.solver, initial.waterEffects.solver);
    result.states[fallback ? 'unsupported-extension' : 'bfcache'] = {
      initial,
      resumed,
    };
    await p.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
    );
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    await c.close();
  }
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 780],
    [844, 390],
  ]) {
    const c = await b.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: width < 500 || height < 500,
      hasTouch: width < 500 || height < 500,
    });
    const p = await c.newPage();
    p.on('pageerror', (e) => result.errors.push(String(e)));
    p.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    await p.goto(
      `${base}/projects/jelly-oasis/?world=192&surface=cpu&vegetation=off&composition=off&waterfall=on`,
    );
    await p.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    await p.evaluate(() => {
      const e = document.getElementById('environment-time');
      e.value = '12';
      e.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelectorAll('details').forEach((e) => (e.open = false));
    });
    await p.click('#reset-view');
    await p.screenshot({
      path: `${output}/production-${width}x${height}.jpg`,
      type: 'jpeg',
      quality: 75,
    });
    await c.close();
  }
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(
    `${output}/lifecycle-qa.json`,
    JSON.stringify(
      result,
      (k, v) =>
        ['phase2', 'shorelineContacts', 'shorelineContactTypes', 'timings'].includes(k)
          ? undefined
          : v,
      2,
    ),
  );
  await b.close();
  server?.kill();
}
console.log('Map rescale fallback, lifecycle and production QA passed');
