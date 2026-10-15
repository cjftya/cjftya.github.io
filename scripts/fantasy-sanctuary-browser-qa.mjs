import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = resolve(
  process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/fantasy-sanctuary-v1',
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
          camera: state.orbit,
        };
      }
      // Exercise animated and reduced-motion modes, resize and weather changes.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(
        () => window.__oasisLandmark.snapshot().fantasy.elapsed > 0.2,
      );
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => window.__oasisLandmark.reviewEnvironment(0, 'RAIN'));
      await page.setViewportSize(
        mobile ? { width: 915, height: 412 } : { width: 1100, height: 800 },
      );
      await page.screenshot({
        path: resolve(output, `${mobile ? 'mobile' : 'desktop'}-rain-resize.png`),
      });
      results.interactions[mobile ? 'mobile' : 'desktop'] = await page.evaluate(() => {
        const s = window.__oasisLandmark.snapshot();
        return { fantasy: s.fantasy, weather: s.weather };
      });
      assert.equal(results.interactions[mobile ? 'mobile' : 'desktop'].weather, 'RAIN');
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
  `Verified ${Object.keys(results.views).length} day/dusk/night views, animation, rain and resize; ${results.errors.length} browser errors.`,
);
