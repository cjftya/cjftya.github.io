import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

// Frozen animation clocks make baseline/candidate pixel comparisons meaningful.
const output = resolve(
  process.env.OASIS_PERF_VISUAL_OUTPUT ?? '/tmp/oasis-performance-visual',
);
await mkdir(output, { recursive: true });
const results = [];
const viewports = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];
for (const [label, dist] of [
  ['before', process.env.OASIS_PERF_BASELINE ?? '../oasis-baseline-dist'],
  ['after', 'dist'],
]) {
  const server = await preview({
    build: { outDir: dist },
    preview: { host: '127.0.0.1', port: 5181, strictPort: true },
  });
  try {
    for (const [index, viewport] of viewports.entries()) {
      const mobile = index >= 2;
      const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.OASIS_QA_BROWSER,
        args: [
          '--no-sandbox',
          ...(process.env.OASIS_QA_SOFTWARE === '1'
            ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
            : []),
        ],
      });
      try {
        const page = await browser.newPage({
          viewport,
          deviceScaleFactor: 1,
          hasTouch: mobile,
          isMobile: mobile,
          reducedMotion: 'reduce',
        });
        page.setDefaultTimeout(180000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await page.addInitScript(() => {
          window.__qaTick = 1000;
          const raf = window.requestAnimationFrame;
          window.requestAnimationFrame = (callback) =>
            raf.call(window, () => callback(window.__qaTick));
        });
        await page.goto('http://127.0.0.1:5181/projects/jelly-oasis/?debug');
        await page.waitForFunction(() => window.__oasisLandmark);
        const step = () =>
          page.evaluate(
            () =>
              new Promise((done) => {
                window.__qaTick += 100;
                requestAnimationFrame(() => requestAnimationFrame(done));
              }),
          );
        await page.evaluate(() => {
          const api = window.__oasisLandmark;
          api.configureWind(false);
          api.reviewPond({ reset: true, paused: true });
          api.reviewEnvironment(10, 'CLEAR');
          document.querySelectorAll('details').forEach((e) => {
            e.open = false;
          });
        });
        await step();
        const record = { label, viewport, mobile, errors, shots: [] };
        for (const [name, hour, weather] of [
          ['day', 10, 'CLEAR'],
          ['sunset', 18, 'CLEAR'],
          ['night', 0, 'CLEAR'],
          ['rain', 10, 'RAIN'],
          ['mist', 10, 'MIST'],
        ]) {
          await page.evaluate(
            ([h, w]) => window.__oasisLandmark.reviewEnvironment(h, w),
            [hour, weather],
          );
          await step();
          const filename = `${label}-${viewport.width}x${viewport.height}-${name}.png`;
          await page
            .locator('canvas#oasis-canvas')
            .screenshot({ path: resolve(output, filename), animations: 'disabled' });
          record.shots.push(filename);
          console.log('captured', filename);
        }
        if (index === 0 || index === 2) {
          for (const view of ['pond', 'tree']) {
            await page.evaluate((view) => {
              const api = window.__oasisLandmark;
              const name =
                view === 'pond' ? 'PondEdge_Blockout' : 'Tree_Landmark_Blockout';
              const bounds = api.snapshot().worldBounds[name];
              const center = bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
              api.reviewEnvironment(0, 'CLEAR');
              api.reviewCamera(
                center.map((v, i) => v + [60, 24, 75][i]),
                center,
              );
            }, view);
            await step();
            const filename = `${label}-${viewport.width}x${viewport.height}-${view}.png`;
            await page
              .locator('canvas#oasis-canvas')
              .screenshot({ path: resolve(output, filename) });
            record.shots.push(filename);
          }
        }
        const base = await page.evaluate(() => window.__oasisLandmark.snapshot());
        // Repeated placement/context recreation must return to a stable allocation.
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
          await step();
        }
        const rebuilt = await page.evaluate(() => window.__oasisLandmark.snapshot());
        assert.equal(rebuilt.geometries, base.geometries);
        assert.equal(rebuilt.textures, base.textures);
        record.resources = {
          base: [base.textures, base.geometries],
          rebuilt: [rebuilt.textures, rebuilt.geometries],
        };
        if (label === 'after' && (index === 0 || index === 2)) {
          await page.evaluate(() => {
            window.dispatchEvent(
              new PageTransitionEvent('pagehide', { persisted: true }),
            );
            window.dispatchEvent(
              new PageTransitionEvent('pageshow', { persisted: true }),
            );
          });
          await step();
          record.pageRestore = await page.evaluate(
            () => window.__oasisLandmark.snapshot().calls > 10,
          );
          assert.ok(record.pageRestore);
          await page.evaluate(
            () =>
              new Promise((done, reject) => {
                const canvas = document.querySelector('#oasis-canvas');
                const gl = canvas.getContext('webgl2');
                const extension = gl.getExtension('WEBGL_lose_context');
                if (!extension) {
                  reject(new Error('Context-loss extension unavailable'));
                  return;
                }
                const timeout = setTimeout(
                  () => reject(new Error('Context restore timeout')),
                  60000,
                );
                canvas.addEventListener(
                  'webglcontextrestored',
                  () => {
                    clearTimeout(timeout);
                    done();
                  },
                  { once: true },
                );
                extension.loseContext();
                setTimeout(() => extension.restoreContext(), 200);
              }),
          );
          await step();
          const restored = await page.evaluate(() => window.__oasisLandmark.snapshot());
          assert.ok(restored.calls > 10 && restored.waterEffects.reflection.captured);
          record.contextRestore = {
            textures: restored.textures,
            geometries: restored.geometries,
          };
          console.log('lifecycle passed', label, viewport);
        }
        assert.deepEqual(errors, []);
        results.push(record);
        await writeFile(
          resolve(output, 'results.json'),
          JSON.stringify(results, null, 2),
        );
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise((done) => server.httpServer.close(done));
  }
}
