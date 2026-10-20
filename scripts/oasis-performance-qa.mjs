import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

// Run after npm run build. Keep raw measurements outside the repository.
// Optional: OASIS_PERF_DIST, OASIS_QA_BROWSER, OASIS_PERF_SECONDS, OASIS_PERF_RUNS.
const output = resolve(process.env.OASIS_PERF_OUTPUT ?? '/tmp/oasis-performance');
await mkdir(output, { recursive: true });
const server = await preview({
  build: { outDir: process.env.OASIS_PERF_DIST ?? 'dist' },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true },
});
const seconds = Number(process.env.OASIS_PERF_SECONDS ?? 30);
const runs = Number(process.env.OASIS_PERF_RUNS ?? 3);
const results = {
  note: 'Browser measurements; emulation is not physical-device performance.',
  devices: [],
};
try {
  const devices = process.env.OASIS_PERF_MOBILE_ONLY
    ? [true]
    : process.env.OASIS_PERF_DESKTOP_ONLY
      ? [false]
      : [false, true];
  for (const mobile of devices) {
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
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
      page.setDefaultTimeout(180000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.addInitScript(() => {
        const state = (window.__oasisPerf = {
          samples: [],
          active: false,
          draws: 0,
          triangles: 0,
          targets: 0,
          gpu: null,
        });
        const p = WebGL2RenderingContext.prototype;
        for (const name of [
          'drawArrays',
          'drawElements',
          'drawArraysInstanced',
          'drawElementsInstanced',
        ]) {
          const original = p[name];
          p[name] = function (...a) {
            state.draws++;
            const count = name.startsWith('drawArrays') ? a[2] : a[1];
            const instances = name.endsWith('Instanced')
              ? a[4 - Number(name.startsWith('drawArrays'))]
              : 1;
            if (a[0] === this.TRIANGLES) state.triangles += (count / 3) * instances;
            return original.apply(this, a);
          };
        }
        const bind = p.bindFramebuffer;
        p.bindFramebuffer = function (...a) {
          if (a[0] === this.FRAMEBUFFER || a[0] === this.DRAW_FRAMEBUFFER)
            state.targets++;
          return bind.apply(this, a);
        };
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...a) {
          const gl = getContext.apply(this, a);
          if (a[0] === 'webgl2' && gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            state.gpu = {
              renderer: ext
                ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
                : gl.getParameter(gl.RENDERER),
              timerQuerySupported: Boolean(
                gl.getExtension('EXT_disjoint_timer_query_webgl2'),
              ),
              timing: 'Not collected; CPU submission times are not GPU times.',
            };
          }
          return gl;
        };
        const raf = window.requestAnimationFrame;
        let last = 0;
        window.requestAnimationFrame = (callback) =>
          raf.call(window, (now) => {
            state.draws = state.triangles = state.targets = 0;
            const start = performance.now();
            callback(now);
            const cpuMs = performance.now() - start;
            if (state.draws > 10) {
              if (state.active && last && state.samples.length < 10000)
                state.samples.push({
                  intervalMs: now - last,
                  cpuMs,
                  draws: state.draws,
                  triangles: state.triangles,
                  targets: state.targets,
                });
              last = now;
            }
          });
      });
      const loaded = performance.now();
      await page.goto('http://127.0.0.1:5180/projects/jelly-oasis/?debug');
      await page.waitForFunction(
        () => window.__oasisLandmark?.snapshot().waterEffects?.reflection?.captures > 2,
      );
      const loadMs = performance.now() - loaded;
      await page.evaluate(() => window.__oasisLandmark.reviewEnvironment(10, 'CLEAR'));
      await page.waitForTimeout(3000);
      const device = {
        mobile,
        viewport: page.viewportSize(),
        loadMs,
        gpu: await page.evaluate(() => window.__oasisPerf.gpu),
        runs: [],
        errors,
      };
      for (let i = 0; i < runs; i++) {
        const before = await page.evaluate(() => {
          window.__oasisPerf.samples = [];
          window.__oasisPerf.active = true;
          return window.__oasisLandmark.snapshot();
        });
        const start = performance.now();
        await page.waitForTimeout(seconds * 1000);
        const { samples, after } = await page.evaluate(() => {
          window.__oasisPerf.active = false;
          return {
            samples: window.__oasisPerf.samples,
            after: window.__oasisLandmark.snapshot(),
          };
        });
        const duration = (performance.now() - start) / 1000;
        console.log(
          'sample count',
          samples.length,
          'duration',
          duration,
          'captures',
          before.waterEffects.reflection.captures,
          after.waterEffects.reflection.captures,
        );
        assert.ok(samples.length > 2, 'Need rendered frames, not empty rAF callbacks');
        const summary = {};
        for (const key of ['intervalMs', 'cpuMs', 'draws', 'triangles', 'targets']) {
          const values = samples.map((s) => s[key]).sort((a, b) => a - b);
          summary[key] = {
            p50: values[Math.floor(values.length * 0.5)],
            p95: values[Math.floor(values.length * 0.95)],
            mean: values.reduce((a, b) => a + b, 0) / values.length,
          };
        }
        const rate = (f) => (f(after) - f(before)) / duration;
        device.runs.push({
          duration,
          frames: samples.length,
          summary,
          capturePairsPerSecond: rate((s) => s.waterEffects.reflection.captures),
          computeStepsPerSecond: rate((s) => s.waterEffects.gpuPond?.steps ?? 0),
          resources: { textures: after.textures, geometries: after.geometries },
          reportedLastRenderCalls: after.calls,
        });
        console.log(JSON.stringify({ mobile, run: i + 1, ...device.runs.at(-1) }));
        await writeFile(
          resolve(output, 'results.json'),
          JSON.stringify({ ...results, current: device }, null, 2),
        );
      }
      results.devices.push(device);
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  await new Promise((done) => server.httpServer.close(done));
}
