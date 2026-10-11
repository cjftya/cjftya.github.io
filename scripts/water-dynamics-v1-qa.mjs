import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const mode = process.argv[2] ?? 'v8';
const platform = process.argv[3];
const out = resolve(
  'artifacts/jelly-oasis/water-dynamics-v1',
  mode === 'v7' ? 'baseline' : 'candidate',
);
await mkdir(out, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4193',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((ok, fail) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) ok();
  });
  server.on('exit', fail);
});
let browser;
const states = {},
  errors = [];
const views = [
  ['front', [82, 1, 93], [66, -3, 50]],
  ['side', [91, 0, 64], [66, -3, 50]],
  ['foot', [74, -4.6, 59], [66, -6, 51]],
  ['channel', [77, 12, 65], [67, -6, 54]],
  ['seam-front', [70, -5, 61], [69.2, -6.5, 56.55]],
  ['seam-side', [74, -5, 56], [69.2, -6.5, 56.55]],
  ['seam-top', [70, 5, 57], [69.2, -6.5, 56.55]],
  ['pond-low', [82, -5.1, 76], [68, -6.3, 56]],
  ['pond-high', [84, 22, 85], [70, -6.5, 59]],
];
try {
  browser = await chromium.launch({
    executablePath: process.env.LANDMARK_QA_BROWSER ?? undefined,
    args: ['--no-sandbox'],
  });
  for (const mobile of platform === 'mobile'
    ? [true]
    : platform === 'desktop'
      ? [false]
      : [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
      recordVideo: {
        dir: resolve(out, 'video'),
        size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      },
    });
    const videoStarted = Date.now();
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto(
      `http://127.0.0.1:4193/projects/jelly-oasis/?debug&waterfall=${mode}&view=waterfall`,
    );
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().modules === 16);
    if (mode === 'v8') {
      const s = await page.evaluate(() => window.__oasisLandmark.snapshot());
      assert.equal(s.waterEffects.fluid.resolution, mobile ? 64 : 128);
    }
    await page.evaluate(() => {
      const a = document.querySelector('#environment-auto-weather');
      a.checked = false;
      a.dispatchEvent(new Event('change'));
      document.querySelectorAll('details').forEach((e) => (e.open = false));
    });
    for (const [name, position, target] of mobile
      ? views.filter((v) => ['front', 'seam-front'].includes(v[0]))
      : views) {
      await page.evaluate(
        ({ position, target }) => {
          window.__oasisLandmark.reviewCamera(position, target);
          const t = document.querySelector('#environment-time');
          t.value = 12;
          t.dispatchEvent(new Event('input'));
          window.__oasisLandmark.reviewWaterStep(2);
        },
        { position, target },
      );
      await page.waitForTimeout(200);
      states[`${mobile ? 'mobile' : 'desktop'}-${name}`] = await page.evaluate(() =>
        window.__oasisLandmark.snapshot(),
      );
      await page.screenshot({
        path: resolve(out, `${mobile ? 'mobile' : 'desktop'}-${name}.png`),
      });
    }
    for (const [label, hour, weather] of [
      ['night', 0, 'CLEAR'],
      ['rain', 12, 'RAIN'],
    ]) {
      await page.evaluate(
        ({ hour, weather }) => {
          const t = document.querySelector('#environment-time');
          t.value = hour;
          t.dispatchEvent(new Event('input'));
          const w = document.querySelector('#environment-weather');
          w.value = weather;
          w.dispatchEvent(new Event('change'));
        },
        { hour, weather },
      );
      await page.waitForTimeout(200);
      await page.screenshot({
        path: resolve(out, `${mobile ? 'mobile' : 'desktop'}-${label}.png`),
      });
    }
    let after;
    for (const [label, position, target] of [
      ['front', [82, 1, 93], [66, -3, 50]],
      ['seam', [70, -5, 61], [69.2, -6.5, 56.55]],
    ]) {
      await page.evaluate(
        ({ position, target }) => {
          window.__oasisLandmark.reviewCamera(position, target);
          const t = document.querySelector('#environment-time');
          t.value = 12;
          t.dispatchEvent(new Event('input'));
          const w = document.querySelector('#environment-weather');
          w.value = 'CLEAR';
          w.dispatchEvent(new Event('change'));
        },
        { position, target },
      );
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const before = await page.evaluate(() => window.__oasisLandmark.snapshot());
      const animationStartSeconds = (Date.now() - videoStarted) / 1000;
      await page.waitForTimeout(8500);
      after = await page.evaluate(() => window.__oasisLandmark.snapshot());
      states[`${mobile ? 'mobile' : 'desktop'}-animation-${label}`] = {
        before,
        after,
        wallSeconds: 8.5,
        animationStartSeconds,
      };
      assert.ok(after.waterEffects.elapsed > before.waterEffects.elapsed);
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    if (mode === 'v8') {
      for (let i = 0; i < 3; i++)
        await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
      await page.waitForTimeout(300);
      const rebuilt = await page.evaluate(() => window.__oasisLandmark.snapshot());
      states[`${mobile ? 'mobile' : 'desktop'}-rebuilt`] = rebuilt;
      assert.ok(rebuilt.geometries <= after.geometries + 1);
      assert.equal(rebuilt.textures, after.textures);
      assert.equal(rebuilt.waterEffects.seam.heightDifference, 0);
      assert.equal(rebuilt.waterEffects.seam.overlappingFaces, false);
      assert.ok(rebuilt.waterEffects.fluid.cfl < 0.5);
      for (const rate of [0, 1, 2]) {
        await page.evaluate((rate) => {
          window.__oasisLandmark.reviewRebuild();
          window.__oasisLandmark.reviewWaterFlow(rate);
          for (let i = 0; i < 30; i++) window.__oasisLandmark.reviewWaterStep(2);
        }, rate);
        const state = await page.evaluate(() => window.__oasisLandmark.snapshot());
        states[`${mobile ? 'mobile' : 'desktop'}-flow-${rate}`] = state;
        assert.ok(Number.isFinite(state.waterEffects.fluid.maxHeight));
        assert.ok(Math.abs(state.waterEffects.fluid.massError) < 0.0001);
        assert.ok(state.waterEffects.fluid.elapsed > 59.8);
        if (rate === 0) assert.equal(state.waterEffects.fluid.maxSpeed, 0);
        await page.screenshot({
          path: resolve(out, `${mobile ? 'mobile' : 'desktop'}-flow-${rate}.png`),
        });
      }
      await page.evaluate(() => {
        window.__fluidContext = document
          .querySelector('canvas')
          .getContext('webgl2')
          .getExtension('WEBGL_lose_context');
        window.__fluidContext.loseContext();
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => window.__fluidContext.restoreContext());
      await page.waitForFunction(
        () => !document.querySelector('canvas').getContext('webgl2').isContextLost(),
      );
      await page.waitForTimeout(200);
      states[`${mobile ? 'mobile' : 'desktop'}-context-restored`] = await page.evaluate(
        () => window.__oasisLandmark.snapshot(),
      );
    }
    const video = page.video();
    await context.close();
    await video.saveAs(resolve(out, `${mobile ? 'mobile' : 'desktop'}-recording.webm`));
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    resolve(out, platform ? `qa-${platform}.json` : 'qa.json'),
    JSON.stringify({ states, errors, physicalDevice: 'PENDING' }, null, 2),
  );
  await browser?.close();
  server.kill();
}
