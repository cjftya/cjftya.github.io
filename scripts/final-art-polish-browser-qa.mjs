import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = resolve(
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/final-art-polish-v1',
);
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 4175, strictPort: true, hmr: false },
});
await server.listen();
const results = { errors: [], views: {}, interactions: {} };
try {
  for (const mobile of [false, true]) {
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
      for (const [name, hour] of [
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
        };
      }
      // Inspect a modest orbit change through the actual camera input.
      if (!mobile) {
        await page.mouse.move(980, 480);
        await page.mouse.down();
        await page.mouse.move(1090, 485, { steps: 12 });
        await page.mouse.up();
        await page.evaluate(() => window.__oasisLandmark.reviewEnvironment(12));
        await page.waitForFunction(
          () => window.__oasisLandmark.snapshot().fantasy.night === 0,
        );
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              let remaining = 30;
              const frame = () =>
                --remaining ? requestAnimationFrame(frame) : resolve();
              requestAnimationFrame(frame);
            }),
        );
        await page.screenshot({ path: resolve(output, 'desktop-orbit-day.png') });
        results.interactions.orbit = await page.evaluate(() => {
          const state = window.__oasisLandmark.snapshot();
          return { camera: state.camera, orbit: state.orbit };
        });
        const colonies = results.views['desktop-day'].scenery.zoneCounts;
        assert.ok(colonies['east-shelf-understory'] > 0);
        assert.ok(colonies['west-shelf-understory'] > 0);
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
  `Verified ${Object.keys(results.views).length} day/dusk/night views and orbit composition; ${results.errors.length} browser errors.`,
);
