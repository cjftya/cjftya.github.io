import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const out = 'artifacts/jelly-oasis/landmark-tree-detail-v1/';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const results = {};
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    for (const detail of [false, true]) {
      await page.goto(
        'http://127.0.0.1:4176/projects/jelly-oasis/?debug&tree=' +
          (detail ? 'detail' : 'blockout'),
      );
      await page.waitForFunction(() => window.__oasisLandmark);
      await page.locator('#landmark-debug').evaluate((e) => (e.open = true));
      await page.locator('[data-view=medium]').click();
      if (mobile)
        await page.evaluate(() => {
          const state = window.__oasisLandmark.snapshot();
          window.__oasisLandmark.reviewCamera(
            state.camera.map((v, i) => state.target[i] + (v - state.target[i]) * 1.55),
            state.target,
          );
        });
      await page.locator('#environment-debug').evaluate((e) => (e.open = true));
      await page.locator('#environment-time').fill('12');
      if (!mobile) {
        await page.evaluate(() => {
          const h = window.__oasisLandmark.snapshot().contact.Tree_Landmark_Blockout.y;
          const w = ([x, y, z]) => [
            70 + x * Math.cos(Math.PI / 6) + z * 0.5,
            h + y,
            58 - x * 0.5 + z * Math.cos(Math.PI / 6),
          ];
          window.__oasisLandmark.reviewCamera(w([-30, 1.8, 6]), w([-12, 13, -18]));
        });
      }
      await page
        .locator('#landmark-debug, #environment-debug')
        .evaluateAll((es) => es.forEach((e) => (e.open = false)));
      await page.waitForTimeout(250);
      let name =
        (detail ? 'after' : 'before') + (mobile ? '-mobile-medium' : '-tree-ground');
      await page.screenshot({ path: out + name + '.png' });
      results[name] = await page.evaluate(() => window.__oasisLandmark.snapshot());
      if (mobile) assert.equal(results[name].shadows, false);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(out + 'supplemental-qa.json', JSON.stringify(results, null, 2));
}
