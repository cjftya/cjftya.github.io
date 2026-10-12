import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const output =
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/tree-grove-rock-expansion-v1';
const base = process.env.OASIS_QA_URL ?? 'http://127.0.0.1:5180';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_URL
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '5180',
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
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = { errors: [], states: {} };
try {
  for (const scenario of ['pending-restore', 'pending-dispose', 'cpu-fallback']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      isMobile: true,
      hasTouch: true,
    });
    if (scenario === 'cpu-fallback')
      await context.addInitScript(() => {
        const proto = WebGL2RenderingContext.prototype,
          original = proto.getExtension;
        proto.getExtension = function (name) {
          return name === 'EXT_color_buffer_float' ? null : original.call(this, name);
        };
      });
    let release;
    const barrier = new Promise((resolve) => {
      release = resolve;
    });
    if (scenario.startsWith('pending'))
      await context.route('**/*.glb', async (route) => {
        await barrier;
        await route.continue();
      });
    const page = await context.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    await page.goto(`${base}/projects/jelly-oasis/?debug`);
    await page.waitForFunction(
      () => !!document.querySelector('canvas')?.getContext('webgl2'),
    );
    if (scenario === 'pending-dispose') {
      assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
      );
      release();
      await page.waitForTimeout(700);
      assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
      result.states[scenario] = 'PASS';
    } else {
      if (scenario === 'pending-restore') {
        assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
        await page.evaluate(() => {
          window.__sceneryContext = document
            .querySelector('canvas')
            .getContext('webgl2')
            .getExtension('WEBGL_lose_context');
          window.__sceneryContext.loseContext();
        });
        await page.waitForTimeout(150);
        await page.evaluate(() => window.__sceneryContext.restoreContext());
        await page.waitForTimeout(300);
        release();
      }
      await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
      const initial = await page.evaluate(() => window.__oasisLandmark.snapshot());
      assert.equal(initial.scenery.variant, 'a');
      assert(initial.scenery.instanceCount > 30);
      assert.equal(initial.modules, 16);
      assert.equal(
        initial.waterEffects.solver,
        scenario === 'cpu-fallback' ? 'cpu-heightfield' : 'gpgpu-heightfield',
      );
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
      );
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
      );
      await page.waitForTimeout(200);
      const resumed = await page.evaluate(() => window.__oasisLandmark.snapshot());
      assert.deepEqual(resumed.scenery, initial.scenery);
      result.states[scenario] = { initial, resumed };
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
      );
      assert.equal(await page.evaluate(() => '__oasisLandmark' in window), false);
    }
    await context.close();
  }
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/lifecycle-qa.json`, JSON.stringify(result, null, 2));
  await browser.close();
  server?.kill();
}
console.log(result.status);
