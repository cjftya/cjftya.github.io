import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

// Test the built production entry, without ?debug or manual simulation stepping.
const output = resolve(process.env.OASIS_SKY_QA_OUTPUT ?? '/tmp/oasis-fantasy-sky');
await mkdir(output, { recursive: true });
const server = await preview({
  preview: { host: '127.0.0.1', port: 5178, strictPort: true },
});
const results = {
  note: 'Production build; software WebGL and mobile emulation, not physical-device FPS.',
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
        viewport: mobile ? { width: 390, height: 844 } : { width: 1000, height: 700 },
        deviceScaleFactor: 1,
        hasTouch: mobile,
        isMobile: mobile,
      });
      page.setDefaultTimeout(120000);
      await page.addInitScript(() => {
        const names = new WeakMap();
        const p = WebGL2RenderingContext.prototype;
        const get = p.getUniformLocation,
          set = p.uniform1f;
        window.__skyQA = { values: {}, windUploads: 0 };
        p.getUniformLocation = function (program, name) {
          const loc = get.call(this, program, name);
          if (loc) names.set(loc, name);
          return loc;
        };
        p.uniform1f = function (loc, value) {
          const name = names.get(loc);
          if (name) {
            window.__skyQA.values[name] = value;
            if (name === 'oasisWindTime') window.__skyQA.windUploads++;
          }
          return set.call(this, loc, value);
        };
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, options) {
          return getContext.call(
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
      await page.goto('http://127.0.0.1:5178/projects/jelly-oasis/', {
        timeout: 120000,
      });
      await page.waitForFunction(() => window.__skyQA.windUploads > 20);
      assert.equal(await page.evaluate(() => Boolean(window.__oasisLandmark)), false);
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
        assert.ok(url.length > 10000);
        await writeFile(
          resolve(output, `${mobile ? 'mobile' : 'desktop'}-${name}.png`),
          Buffer.from(url.split(',')[1], 'base64'),
        );
        console.log('captured', mobile, name);
      };
      const time = async (hour) => {
        await page.locator('#environment-time').evaluate((e, h) => {
          e.value = String(h);
          e.dispatchEvent(new Event('input', { bubbles: true }));
        }, hour);
        await frame();
      };
      await page.locator('#environment-auto-weather').evaluate((e) => {
        e.checked = false;
        e.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await time(10);
      await capture('day');
      await page.evaluate(() => {
        const src = document.querySelector('canvas');
        const copy = document.createElement('canvas');
        copy.width = src.width;
        copy.height = src.height;
        const ctx = copy.getContext('2d');
        ctx.drawImage(src, 0, 0);
        window.__skyQaPixels = ctx.getImageData(0, 0, src.width, src.height).data;
      });
      const start = await page.evaluate(() => structuredClone(window.__skyQA));
      await page.waitForFunction(
        (t) => window.__skyQA.values.oasisWindTime > t + 2,
        start.values.oasisWindTime,
      );
      await capture('wind-later');
      const motion = await page.evaluate(() => {
        const src = document.querySelector('canvas');
        const copy = document.createElement('canvas');
        copy.width = src.width;
        copy.height = src.height;
        const ctx = copy.getContext('2d');
        ctx.drawImage(src, 0, 0);
        const data = ctx.getImageData(0, 0, src.width, src.height).data;
        let changed = 0,
          total = 0;
        // Crown area; exclude the animated lake at the foot of the tree.
        for (let y = Math.floor(src.height * 0.12); y < src.height * 0.5; y++)
          for (let x = Math.floor(src.width * 0.25); x < src.width * 0.7; x++) {
            const i = (y * src.width + x) * 4;
            const delta = Math.max(
              ...[0, 1, 2].map((c) =>
                Math.abs(data[i + c] - window.__skyQaPixels[i + c]),
              ),
            );
            changed += Number(delta > 8);
            total++;
          }
        delete window.__skyQaPixels;
        return { changed, total, fraction: changed / total };
      });
      assert.ok(
        motion.fraction > 0.01,
        'Crown must visibly sway during ordinary production playback',
      );
      console.log('visible crown movement', mobile, motion);
      const end = await page.evaluate(() => structuredClone(window.__skyQA));
      assert.ok(end.values.oasisWindStrength > 0.3);
      await time(18);
      await capture('sunset');
      await time(0);
      await capture('night');
      const clear = await page.evaluate(() => window.__skyQA.values.moonVisibility);
      await page.locator('#environment-sky').evaluate((e) => e.click());
      await capture('sky-night');
      await page.locator('#reset-view').evaluate((e) => e.click());
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reducedStart = await page.evaluate(
        () => window.__skyQA.values.oasisWindTime,
      );
      await page.waitForFunction(
        (t) => window.__skyQA.values.oasisWindTime > t + 2,
        reducedStart,
      );
      const reduced = await page.evaluate(() => structuredClone(window.__skyQA));
      assert.ok(reduced.values.oasisWindStrength > 0.1);
      await page.locator('#environment-weather').evaluate((e) => {
        e.value = 'RAIN';
        e.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForFunction(() => window.__skyQA.values.cloudDarkness > 0.8);
      await capture('rain');
      const rain = await page.evaluate(() => structuredClone(window.__skyQA));
      assert.ok(rain.values.moonVisibility < clear);
      assert.deepEqual(errors, []);
      results.devices.push({ mobile, start, end, reduced, rain, motion, errors });
      console.log('PASS', mobile ? 'mobile' : 'desktop');
    } finally {
      await browser.close();
    }
  }
} finally {
  await writeFile(
    resolve(output, 'production-qa.json'),
    JSON.stringify(results, null, 2),
  );
  await new Promise((resolve) => server.httpServer.close(resolve));
}
