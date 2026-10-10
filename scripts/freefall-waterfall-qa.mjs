import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const output = resolve('artifacts/jelly-oasis/waterfall-freefall-v4');
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4187',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((ok, fail) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) ok();
  });
  server.on('exit', (c) => fail(new Error('preview ' + c)));
});
const browser = await chromium.launch({
  executablePath: process.env.LANDMARK_QA_BROWSER,
  args: ['--no-sandbox'],
});
const errors = [],
  states = {};
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') {
        errors.push(m.text());
        console.error(m.text());
      }
    });
    await page.goto(
      'http://127.0.0.1:4187/projects/jelly-oasis/?debug&water=v2&waterfall=v4',
    );
    await page.waitForFunction(
      () => window.__oasisLandmark?.snapshot().waterEffects?.path.length > 8,
    );
    const snap = () => page.evaluate(() => window.__oasisLandmark.snapshot());
    for (const [name, hour, pos, target] of [
      ['front', 12, [82, 1, 93], [66, -3, 50]],
      ['side', 12, [91, 0, 64], [66, -3, 50]],
      ['close', 12, [73, 0, 73], [65, -1, 50]],
      ['night', 0, [82, 1, 93], [66, -3, 50]],
    ]) {
      await page.evaluate(
        ({ hour, pos, target }) => {
          window.__oasisLandmark.reviewCamera(pos, target);
          const el = document.querySelector('#environment-time');
          el.value = hour;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelectorAll('details').forEach((e) => (e.open = false));
        },
        { hour, pos, target },
      );
      await page.waitForTimeout(700);
      const s = await snap();
      assert.equal(s.modules, 16);
      assert.equal(s.waterEffects.version, 4);
      assert.equal(s.waterEffects.reflection.size, mobile ? 256 : 768);
      assert.ok(s.waterEffects.reflection.captures > 0);
      assert.equal(s.waterEffects.droplets, 72);
      assert.equal(s.waterEffects.ripples, 3);
      assert.ok(s.waterEffects.rockClearance > 0.02);
      assert.ok(s.waterEffects.flightDuration > 1);
      const trajectory = s.waterEffects.path.slice(s.waterEffects.flightStartIndex);
      const totalDrop = trajectory[0][1] - trajectory.at(-1)[1];
      for (let i = 0; i < trajectory.length; i++) {
        assert.ok(
          Math.abs(
            trajectory[0][1] -
              totalDrop * (i / (trajectory.length - 1)) ** 2 -
              trajectory[i][1],
          ) < 1e-5,
        );
      }
      assert.ok(s.waterEffects.triangles < 12000);
      assert.ok(s.waterEffects.path.every((p) => p.every(Number.isFinite)));
      assert.ok(
        Math.abs(s.waterEffects.path.at(-1)[1] - (s.pondHeight + 0.035)) < 1e-6,
      );
      assert.ok(
        Math.max(
          ...s.waterEffects.path
            .slice(1)
            .map((p, i) => p[1] - s.waterEffects.path[i][1]),
        ) < 0.15,
      );
      states[(mobile ? 'mobile-' : 'desktop-') + name] = s;
      await page.screenshot({
        path: resolve(output, (mobile ? 'mobile-' : 'desktop-') + name + '.png'),
      });
    }
    const before = await snap();
    await page.waitForTimeout(550);
    assert.ok((await snap()).waterEffects.elapsed > before.waterEffects.elapsed);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const paused = await snap();
    await page.waitForTimeout(500);
    assert.equal((await snap()).waterEffects.elapsed, paused.waterEffects.elapsed);
    const pausedCaptures = (await snap()).waterEffects.reflection.captures;
    await page.waitForTimeout(400);
    assert.equal((await snap()).waterEffects.reflection.captures, pausedCaptures);
    await page.evaluate(() => {
      const el = document.querySelector('#environment-shadows');
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });
    await page.waitForTimeout(300);
    assert.ok((await snap()).waterEffects.reflection.captures > pausedCaptures);
    const shadowCapture = (await snap()).waterEffects.reflection.captures;
    await page.evaluate(() => {
      const el = document.querySelector('#environment-time');
      el.value = 12;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(350);
    assert.ok((await snap()).waterEffects.reflection.captures > shadowCapture);
    const restoredBefore = (await snap()).waterEffects.reflection.captures;
    await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      window.__restoreWaterContext = gl.getExtension('WEBGL_lose_context');
      window.__restoreWaterContext.loseContext();
    });
    await page.waitForFunction(() =>
      document.querySelector('canvas').getContext('webgl2').isContextLost(),
    );
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__restoreWaterContext.restoreContext());
    await page.waitForFunction(
      (n) => window.__oasisLandmark.snapshot().waterEffects.reflection.captures > n,
      restoredBefore,
      { timeout: 60000 },
    );
    assert.equal((await snap()).waterEffects.reflection.captured, true);
    await page.goto('http://127.0.0.1:4187/projects/jelly-oasis/?debug');
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    assert.equal((await snap()).waterEffects, null);
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'qa.json'),
    JSON.stringify({ states, errors }, null, 2),
  );
  console.log(
    'Free-fall waterfall QA PASS: 8 views, desktop/mobile, animation/reduced motion, shared pond outlet, production default preserved',
  );
} finally {
  await browser.close();
  server.kill();
}
