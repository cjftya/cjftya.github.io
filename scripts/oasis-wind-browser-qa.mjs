import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = resolve(
  process.env.OASIS_WIND_QA_OUTPUT ?? 'artifacts/jelly-oasis/natural-animation-v2',
);
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 5177, strictPort: true },
});
await server.listen();
const results = {
  note: 'Device emulation with software WebGL is not physical mobile performance. Canvas capture uses test-only preserveDrawingBuffer.',
  devices: [],
};
try {
  for (const mobile of [false, true]) {
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.OASIS_QA_BROWSER
        ? { executablePath: process.env.OASIS_QA_BROWSER }
        : {}),
      ...(process.env.OASIS_QA_SOFTWARE
        ? {
            args: [
              '--no-sandbox',
              '--no-zygote',
              '--single-process',
              '--in-process-gpu',
              '--use-gl=angle',
              '--use-angle=swiftshader',
              '--enable-unsafe-swiftshader',
            ],
          }
        : {}),
    });
    try {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 960, height: 640 },
        deviceScaleFactor: 1,
        hasTouch: mobile,
        isMobile: mobile,
      });
      page.setDefaultTimeout(60000);
      // Keep canvas pixels readable without depending on a headless compositor screenshot.
      await page.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, options) {
          return get.call(
            this,
            type,
            type === 'webgl2' ? { ...options, preserveDrawingBuffer: true } : options,
          );
        };
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.goto('http://127.0.0.1:5177/projects/jelly-oasis/?debug', {
        timeout: 120000,
      });
      await page.waitForFunction(() => window.__oasisLandmark, {}, { timeout: 120000 });
      const api = (action, args = []) =>
        page.evaluate(({ action, args }) => window.__oasisLandmark[action](...args), {
          action,
          args,
        });
      const frame = () =>
        page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
      const capture = async (name) => {
        await frame();
        const url = await page.evaluate(() =>
          document.querySelector('canvas').toDataURL('image/png'),
        );
        assert.ok(url.length > 10000, 'Canvas must contain the rendered landscape');
        await writeFile(
          resolve(output, `${mobile ? 'mobile' : 'desktop'}-${name}.png`),
          Buffer.from(url.split(',')[1], 'base64'),
        );
        console.log('captured', mobile, name);
      };
      await api('reviewEnvironment', [12, 'CLEAR']);
      await api('configureWind', [false]);
      await frame();
      const rest = await api('snapshot');
      console.log('loaded', mobile, rest.wind.meshes.length, errors);
      assert.equal(rest.vegetation.mobile, mobile);
      for (const name of [
        'WorldTreeCanopy',
        'WorldTreeVines',
        'PrecinctPlants',
        'AquaticColonies',
      ])
        assert.ok(rest.wind.meshes.includes(name), name);
      assert.ok(!rest.wind.meshes.includes('WorldTreeRuins'));
      await api('configureWind', [true]);
      await api('reviewWindStep', [8]);
      await frame();
      const animated = await api('snapshot');
      assert.ok(animated.wind.strength > 0.2);
      assert.equal(animated.geometries, rest.geometries);
      assert.equal(animated.textures, rest.textures);
      for (const kind of ['vegetation', 'composition', 'scenery', 'meadow'])
        assert.equal(animated[kind].draws, rest[kind].draws);
      await capture('day');
      await api('reviewIsolate', ['WorldTreePrecinct']);
      await api('reviewCamera', [
        [0, 65, 80],
        [-12, 42, -18],
      ]);
      await api('reviewWindStep', [2]);
      await capture('tree-phase-a');
      await api('reviewWindStep', [4]);
      await capture('tree-phase-b');
      await api('reviewIsolate', ['']);
      await api('reviewEnvironment', [0, 'RAIN']);
      await api('reviewWindStep', [8]);
      await frame();
      const rain = await api('snapshot');
      assert.ok(rain.wind.strength > animated.wind.strength);
      assert.ok(rain.moon.castShadow);
      await capture('rain-night');
      await api('configureWind', [true, false]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => window.__oasisLandmark.wind().strength === 0);
      const reduced = await api('wind');
      await frame();
      assert.equal((await api('wind')).time, reduced.time);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(
        (t) => window.__oasisLandmark.wind().time > t,
        reduced.time,
      );
      const previous = await api('wind');
      await api('reviewRebuild');
      await frame();
      const rebuilt = await api('wind');
      assert.deepEqual(rebuilt.meshes, previous.meshes);
      assert.equal(rebuilt.materials, previous.materials);
      assert.deepEqual(errors, []);
      results.devices.push({ mobile, rest, animated, rain, reduced, rebuilt, errors });
      console.log('PASS', mobile ? 'mobile' : 'desktop');
    } finally {
      await browser.close();
    }
  }
} finally {
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
  await server.close();
}
