import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const context = await browser.newContext({ reducedMotion: 'reduce' });
const results = {};
const url = 'http://127.0.0.1:4176/projects/jelly-oasis/?debug&tree=detail';
try {
  const fail = await context.newPage();
  await fail.route('**/Tree_Landmark_Detail_v1.glb', (r) =>
    r.fulfill({ status: 404, body: 'Injected missing tree' }),
  );
  await fail.goto(url);
  await fail.locator('#landmark-status[role=alert]').waitFor();
  results.failureText = await fail.locator('#landmark-status').textContent();
  assert.ok(results.failureText.includes('불러오지 못했습니다'));
  await fail.close();
  const ready = await context.newPage();
  await ready.goto(url);
  await ready.waitForFunction(() => window.__oasisLandmark);
  await ready.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  assert.equal(await ready.evaluate(() => Boolean(window.__oasisLandmark)), false);
  assert.equal(await ready.locator('#landmark-status').count(), 0);
  results.disposed = true;
  await ready.close();
  const late = await context.newPage();
  let release, requested;
  const requestedPromise = new Promise((r) => (requested = r));
  const gate = new Promise((r) => (release = r));
  const errors = [];
  late.on('pageerror', (e) => errors.push(String(e)));
  await late.route('**/Tree_Landmark_Detail_v1.glb', async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  await late.goto(url, { waitUntil: 'domcontentloaded' });
  await requestedPromise;
  await late.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  release();
  await late.waitForResponse((r) => r.url().endsWith('Tree_Landmark_Detail_v1.glb'));
  await late.waitForTimeout(1500);
  assert.equal(await late.evaluate(() => Boolean(window.__oasisLandmark)), false);
  assert.equal(await late.locator('#landmark-status').count(), 0);
  assert.deepEqual(errors, []);
  results.lateLoadAfterPagehide = true;
  results.errors = errors;
} finally {
  await browser.close();
  await writeFile(
    'artifacts/jelly-oasis/landmark-tree-detail-v1/lifecycle-qa.json',
    JSON.stringify(results, null, 2),
  );
}
console.log(results);
