import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = resolve(
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/shadow-detail-v1',
);
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 4175, strictPort: true, hmr: false },
});
await server.listen();
const motionOnly = Boolean(process.env.OASIS_QA_MOTION_ONLY);
const results = motionOnly
  ? JSON.parse(await readFile(resolve(output, 'results.json'), 'utf8'))
  : { errors: [], views: {}, interactions: {} };
const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
function singleCaster(state) {
  assert.ok(Number(state.sun.castShadow) + Number(state.moon.castShadow) <= 1);
  assert.ok(Number(state.sun.allocated) + Number(state.moon.allocated) <= 1);
}
try {
  for (const mobile of process.env.OASIS_QA_BASELINE || motionOnly
    ? [false]
    : [false, true]) {
    // A fresh browser also supports single-process software renderers in CI.
    const browser = await chromium.launch({
      executablePath: process.env.OASIS_QA_BROWSER,
      args: process.env.OASIS_QA_SOFTWARE
        ? [
            '--no-sandbox',
            '--no-zygote',
            '--single-process',
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
          ]
        : [],
      headless: true,
    });
    try {
      const page = await browser.newPage({
        viewport: mobile ? { width: 412, height: 915 } : { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        hasTouch: mobile,
        isMobile: mobile,
        reducedMotion: 'reduce',
      });
      page.setDefaultTimeout(120000);
      page.on('pageerror', (e) => results.errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') results.errors.push(m.text());
      });
      await page.goto('http://127.0.0.1:4175/projects/jelly-oasis/?debug');
      await page.waitForFunction(() => window.__oasisLandmark);
      if (process.env.OASIS_QA_FONT_CSS) {
        await page.addStyleTag({
          content: await readFile(process.env.OASIS_QA_FONT_CSS, 'utf8'),
        });
        await page.evaluate(() => document.fonts.ready);
      }
      for (const [name, hour] of motionOnly
        ? []
        : [
            ['day', 12],
            ['dusk', 19],
            ['night', 0],
          ]) {
        await page.evaluate((h) => window.__oasisLandmark.reviewEnvironment(h), hour);
        await page.waitForFunction((h) => {
          const night = window.__oasisLandmark.snapshot().fantasy.night;
          return h === 0
            ? night === 1
            : h === 12
              ? night === 0
              : night > 0 && night < 1;
        }, hour);
        await page
          .locator('details')
          .evaluateAll((es) => es.forEach((e) => (e.open = false)));
        await page.screenshot({
          path: resolve(output, `${mobile ? 'mobile' : 'desktop'}-${name}.png`),
        });
        const state = await page.evaluate(() => window.__oasisLandmark.snapshot());
        singleCaster(state);
        assert.equal(state.waterEffects.gpuError, null);
        assert.equal(state.fantasy.shards, 40);
        assert.equal(state.fantasy.particles, mobile ? 72 : 144);
        assert.equal(state.fantasy.elapsed, 0);
        results.views[`${mobile ? 'mobile' : 'desktop'}-${name}`] = {
          fantasy: state.fantasy,
          water: state.waterEffects,
          camera: state.camera,
          target: state.target,
          scenery: state.scenery,
          textures: state.textures,
          shadow: state.shadow,
          sun: state.sun,
          moon: state.moon,
        };
      }
      if (!mobile && !motionOnly) {
        for (const [name, position, target, hour] of [
          ['contact-day', [51, 38, 69], [0, 5, 8], 12],
          ['contact-night', [51, 38, 69], [0, 5, 8], 0],
          ['grove-day', [108, 65, 92], [25, 20, -16], 12],
          ['wide-dawn', [190, 150, 240], [0, 15, 0], 6],
        ]) {
          await page.evaluate(
            ({ position, target, hour }) => {
              window.__oasisLandmark.reviewCamera(position, target);
              window.__oasisLandmark.reviewEnvironment(hour);
            },
            { position, target, hour },
          );
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              ),
          );
          await page.screenshot({ path: resolve(output, `desktop-${name}.png`) });
          const s = await page.evaluate(() => window.__oasisLandmark.snapshot());
          results.interactions[name] = {
            camera: s.camera,
            target: s.target,
            shadow: s.shadow,
            sun: s.sun,
            moon: s.moon,
          };
        }
      }
      if (!mobile && !process.env.OASIS_QA_BASELINE) {
        await page.evaluate(() => window.__oasisLandmark.reviewEnvironment(12));
        await settle(page);
        const before = await page.evaluate(() => window.__oasisLandmark.snapshot());
        await page.mouse.move(980, 480);
        await page.mouse.down();
        await page.mouse.move(1070, 500, { steps: 6 });
        await page.mouse.up();
        await settle(page);
        const orbit = await page.evaluate(() => window.__oasisLandmark.snapshot());
        assert.notDeepEqual(orbit.camera, before.camera);
        await page.mouse.wheel(0, -300);
        await settle(page);
        const zoom = await page.evaluate(() => window.__oasisLandmark.snapshot());
        const distance = (s) => Math.hypot(...s.camera.map((v, i) => v - s.target[i]));
        assert.ok(Math.abs(distance(zoom) - distance(orbit)) > 0.1);
        for (const s of [orbit, zoom]) {
          assert.deepEqual(s.shadow.bounds, before.shadow.bounds);
          assert.deepEqual(s.shadow.mapSize, [2048, 2048]);
          singleCaster(s);
        }
        results.interactions.input = {
          orbitCamera: orbit.camera,
          zoomCamera: zoom.camera,
          distances: [distance(orbit), distance(zoom)],
          shadow: zoom.shadow,
        };
        results.interactions.casterTransitions = [];
        for (const hour of [5.5, 6.5, 18, 19, 20, 0, 12]) {
          await page.evaluate((h) => window.__oasisLandmark.reviewEnvironment(h), hour);
          await settle(page);
          const s = await page.evaluate(() => window.__oasisLandmark.snapshot());
          singleCaster(s);
          assert.deepEqual(s.shadow.bounds, before.shadow.bounds);
          if (hour === 0) assert.equal(s.moon.castShadow, true);
          if (hour === 12) assert.equal(s.sun.castShadow, true);
          results.interactions.casterTransitions.push({
            hour,
            sun: s.sun,
            moon: s.moon,
            textures: s.textures,
          });
        }
      }
    } finally {
      await browser.close();
    }
  }
  assert.deepEqual(results.errors, []);
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  await server.close();
}
console.log(
  `Verified ${Object.keys(results.views).length} day/dusk/night views and four detail/zoom views; ${results.errors.length} browser errors.`,
);
