import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const output = resolve('artifacts/jelly-oasis/basin-watercourse-v1');
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4191',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((ok, fail) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) ok();
  });
  server.on('exit', (c) => fail(new Error(`preview ${c}`)));
});
let browser;
const errors = [],
  states = {},
  lifecycle = {};
const views = [
  ['front', 12, 'CLEAR', [82, 1, 93], [66, -3, 50]],
  ['side', 12, 'CLEAR', [91, 0, 64], [66, -3, 50]],
  ['profile', 12, 'CLEAR', [93, 2, 35], [66, -1, 51]],
  ['channel-high', 12, 'CLEAR', [77, 12, 65], [67, -6, 54]],
  ['ground-channel', 12, 'CLEAR', [74, -4.6, 59], [66, -6, 51]],
  ['pond-high', 12, 'CLEAR', [84, 22, 85], [70, -6.5, 59]],
  ['pond-low', 12, 'CLEAR', [82, -5.1, 76], [68, -6.3, 56]],
  ['night', 0, 'CLEAR', [82, 1, 93], [66, -3, 50]],
  ['rain', 12, 'RAIN', [82, 1, 93], [66, -3, 50]],
];
try {
  browser = await chromium.launch({
    executablePath: process.env.LANDMARK_QA_BROWSER,
    args: ['--no-sandbox'],
  });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: 'reduce',
      }),
      page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const base = 'http://127.0.0.1:4191/projects/jelly-oasis/';
    for (const mode of ['v6', 'v7', 'terrain']) {
      await page.goto(
        base +
          (mode === 'terrain'
            ? '?debug&basin=excavated&waterfall=off&view=waterfall'
            : `?debug&waterfall=${mode}&view=waterfall`),
      );
      await page.waitForFunction(
        () => window.__oasisLandmark?.snapshot().modules === 16,
      );
      await page.evaluate(() => {
        const a = document.querySelector('#environment-auto-weather');
        a.checked = false;
        a.dispatchEvent(new Event('change'));
        document.querySelectorAll('details').forEach((e) => (e.open = false));
      });
      for (const [name, hour, weather, position, target] of mobile
        ? views.filter((v) => ['front', 'ground-channel', 'night'].includes(v[0]))
        : views) {
        await page.evaluate(
          ({ hour, weather, position, target }) => {
            window.__oasisLandmark.reviewCamera(position, target);
            const t = document.querySelector('#environment-time');
            t.value = hour;
            t.dispatchEvent(new Event('input', { bubbles: true }));
            const w = document.querySelector('#environment-weather');
            w.value = weather;
            w.dispatchEvent(new Event('change'));
            window.__oasisLandmark.reviewWaterStep(0.5);
          },
          { hour, weather, position, target },
        );
        await page.waitForTimeout(250);
        const s = await page.evaluate(() => window.__oasisLandmark.snapshot());
        assert.equal(s.modules, 16);
        if (mode === 'v7') {
          assert.equal(s.waterEffects.version, 7);
          assert.equal(s.waterEffects.flightDuration, 0);
          assert.equal(s.waterEffects.droplets, 0);
          assert.ok(s.excavation.excavationDepth > 1.7);
          assert.ok(s.excavation.channelPath.length > 30);
          assert.ok(s.excavation.hiddenShoreMeshes > 0);
          assert.ok(Math.max(...s.excavation.shorelineGaps) < 0.00001);
          assert.ok(
            s.excavation.phase2.shoreCrystalZones.every((p) => p.waterDepth === 0),
          );
          assert.ok(
            s.excavation.channelPath.every(
              (p, i) => p[1] - s.excavation.channelFloorHeight[i] > 0.17,
            ),
          );
          assert.equal(s.waterEffects.reflection.passes, 2);
          assert.equal(s.waterEffects.reflection.size, mobile ? 256 : 768);
          assert.ok(s.waterEffects.reflection.captures > 0);
        }
        if (mode === 'terrain') {
          assert.equal(s.waterEffects, null);
          assert.ok(s.excavation.terrainPatchTriangles > 0);
        }
        if (mode === 'v6') {
          assert.equal(s.waterEffects.version, 6);
          assert.equal(s.excavation, null);
        }
        const key = `${mode}-${mobile ? 'mobile' : 'desktop'}-${name}`;
        states[key] = s;
        await page.screenshot({ path: resolve(output, `${key}.png`) });
        console.log(`Captured ${key}`);
      }
      if (mode === 'v7') {
        const before = await page.evaluate(() => window.__oasisLandmark.snapshot());
        await page.waitForTimeout(250);
        assert.equal(
          (await page.evaluate(() => window.__oasisLandmark.snapshot())).waterEffects
            .elapsed,
          before.waterEffects.elapsed,
        );
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
          await page.waitForTimeout(200);
        }
        const after = await page.evaluate(() => window.__oasisLandmark.snapshot());
        assert.ok(after.geometries <= before.geometries + 1);
        assert.equal(after.textures, before.textures);
        assert.equal(
          after.excavation.terrainPatchTriangles,
          before.excavation.terrainPatchTriangles,
        );
        lifecycle[mobile ? 'mobile' : 'desktop'] = {
          before: { geometries: before.geometries, textures: before.textures },
          after: { geometries: after.geometries, textures: after.textures },
        };
        await page.evaluate(() => {
          window.__basinContext = document
            .querySelector('canvas')
            .getContext('webgl2')
            .getExtension('WEBGL_lose_context');
          window.__basinContext.loseContext();
        });
        await page.waitForFunction(() =>
          document.querySelector('canvas').getContext('webgl2').isContextLost(),
        );
        await page.waitForTimeout(150);
        const captures = after.waterEffects.reflection.captures;
        await page.evaluate(() => window.__basinContext.restoreContext());
        await page.waitForFunction(
          (n) => window.__oasisLandmark.snapshot().waterEffects.reflection.captures > n,
          captures,
        );
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const frameTimes = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const samples = [];
              let previous;
              function frame(time) {
                if (previous !== undefined) samples.push(time - previous);
                previous = time;
                if (samples.length < 20) requestAnimationFrame(frame);
                else resolve(samples);
              }
              requestAnimationFrame(frame);
            }),
        );
        const running = await page.evaluate(() => window.__oasisLandmark.snapshot());
        lifecycle[mobile ? 'mobile' : 'desktop'].headlessPerformance = {
          fps: 1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length),
          frameCpuMs: running.frameCpuMs,
          renderCpuMs: running.renderCpuMs,
          calls: running.calls,
          triangles: running.triangles,
          geometries: running.geometries,
          textures: running.textures,
          elapsed: running.waterEffects.elapsed,
        };
        await page.emulateMedia({ reducedMotion: 'reduce' });
        if (!mobile) {
          await page.evaluate(() => {
            window.__oasisLandmark.reviewCamera([74, -4.6, 59], [66, -6, 51]);
            const t = document.querySelector('#environment-time');
            t.value = 12;
            t.dispatchEvent(new Event('input'));
            const w = document.querySelector('#environment-weather');
            w.value = 'CLEAR';
            w.dispatchEvent(new Event('change'));
          });
          const dir = resolve(output, 'sequence');
          await mkdir(dir, { recursive: true });
          for (let frame = 0; frame < 12; frame++) {
            await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(0.5));
            await page.screenshot({
              path: resolve(dir, `${String(frame).padStart(3, '0')}.png`),
            });
          }
        }
      }
    }
    await page.goto(`${base}?debug`);
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    const baseline = await page.evaluate(() => window.__oasisLandmark.snapshot());
    assert.equal(baseline.excavation, null);
    assert.equal(baseline.waterEffects, null);
    states[`default-${mobile ? 'mobile' : 'desktop'}`] = baseline;
    await page.screenshot({
      path: resolve(output, `default-${mobile ? 'mobile' : 'desktop'}.png`),
    });
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'qa.json'),
    JSON.stringify(
      {
        states,
        lifecycle,
        errors,
        mobileHardware: 'headless emulation; physical device unverified',
      },
      null,
      2,
    ),
  );
  await writeFile(
    resolve(output, 'phase2-placement.json'),
    JSON.stringify(states['v7-desktop-front'].excavation.phase2, null, 2),
  );
  console.log(
    `Basin v7 technical QA PASS: ${Object.keys(states).length} states; visual review required`,
  );
} finally {
  await writeFile(
    resolve(output, 'qa-progress.json'),
    JSON.stringify({ states, lifecycle, errors }, null, 2),
  );
  await browser?.close();
  server.kill();
}
