import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const output = resolve(process.env.OASIS_QA_OUTPUT ?? '/tmp/oasis-enchanted-final');
await mkdir(output, { recursive: true });
const server = await preview({
  preview: { host: '127.0.0.1', port: 4176, strictPort: true },
});
const errors = [],
  views = [];
try {
  for (const mobile of [false, true]) {
    const browser = await chromium.launch({
      executablePath: process.env.OASIS_QA_BROWSER,
      headless: true,
      args: process.env.OASIS_QA_SOFTWARE
        ? [
            '--no-sandbox',
            '--no-zygote',
            '--single-process',
            '--in-process-gpu',
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
          ]
        : [],
    });
    try {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1000, height: 700 },
        deviceScaleFactor: 1,
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: 'reduce',
      });
      page.setDefaultTimeout(120000);
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.goto('http://127.0.0.1:4176/projects/jelly-oasis/');
      await page.locator('#landmark-status').waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => Boolean(window.__oasisLandmark)), false);
      for (const [name, hour] of mobile
        ? [['night', 0]]
        : [
            ['day', 12],
            ['night', 0],
          ]) {
        await page.locator('#environment-time').evaluate((e, h) => {
          e.value = String(h);
          e.dispatchEvent(new Event('input', { bubbles: true }));
        }, hour);
        await page.evaluate(
          () =>
            new Promise((done) =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            ),
        );
        const file = `${mobile ? 'mobile' : 'desktop'}-${name}.png`;
        await page.screenshot({ path: resolve(output, file) });
        views.push(file);
        console.log('Captured', file);
      }
    } finally {
      await browser.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    resolve(output, 'results.json'),
    JSON.stringify(
      {
        build: 'production',
        views,
        errors,
        note: 'Software WebGL; mobile viewport emulation, not physical-device performance.',
      },
      null,
      2,
    ),
  );
  await new Promise((done) => server.httpServer.close(done));
}
