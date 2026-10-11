import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const output = resolve('artifacts/jelly-oasis/real-water-rebuild-v1');
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4190',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
await new Promise((ok, fail) => {
  server.stdout.on('data', (data) => {
    if (data.toString().includes('Local:')) ok();
  });
  server.stderr.on('data', (data) => console.error(data.toString()));
  server.on('exit', (code) => fail(new Error(`preview exited: ${code}`)));
});
let browser;
const errors = [],
  states = {},
  sequences = {};
const versions = process.env.WATER_QA_VERSION === '6' ? [6] : [5, 6];
if (versions.length === 1) {
  const previous = JSON.parse(await readFile(resolve(output, 'qa.json'), 'utf8'));
  Object.assign(
    states,
    Object.fromEntries(
      Object.entries(previous.states).filter(([key]) => key.startsWith('v5-')),
    ),
  );
  sequences[5] = previous.sequences[5];
}
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
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.on('pageerror', (error) => {
      errors.push(String(error));
      console.error(error);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
        console.error(message.text());
      }
    });
    const base = 'http://127.0.0.1:4190/projects/jelly-oasis/';
    for (const version of versions) {
      await page.goto(`${base}?debug&waterfall=v${version}&view=waterfall`);
      await page.waitForFunction(
        (v) => window.__oasisLandmark?.snapshot().waterEffects?.version === v,
        version,
      );
      await page.evaluate(() => {
        const automatic = document.querySelector('#environment-auto-weather');
        automatic.checked = false;
        automatic.dispatchEvent(new Event('change'));
        document.querySelectorAll('details').forEach((el) => (el.open = false));
      });
      const views = mobile
        ? [
            ['front', 12, 'CLEAR', [82, 1, 93], [66, -3, 50]],
            ['impact', 12, 'CLEAR', [74, -2.5, 66], [69.4, -5.3, 56.8]],
            ['night', 0, 'CLEAR', [82, 1, 93], [66, -3, 50]],
          ]
        : [
            ['front', 12, 'CLEAR', [82, 1, 93], [66, -3, 50]],
            ['side', 12, 'CLEAR', [91, 0, 64], [66, -3, 50]],
            ['profile', 12, 'CLEAR', [93, 2, 35], [66, -1, 51]],
            ['crest', 12, 'CLEAR', [68, 9, 51], [62, 7, 45]],
            ['close', 12, 'CLEAR', [73, 0, 73], [65, -1, 50]],
            ['impact', 12, 'CLEAR', [74, -2.5, 66], [69.4, -5.3, 56.8]],
            ['pond-low', 12, 'CLEAR', [82, -4.4, 76], [68, -5.2, 56]],
            ['pond-high', 12, 'CLEAR', [84, 22, 85], [70, -5, 59]],
            ['night', 0, 'CLEAR', [82, 1, 93], [66, -3, 50]],
            ['rain', 12, 'RAIN', [82, 1, 93], [66, -3, 50]],
            ['mist', 12, 'MIST', [82, 1, 93], [66, -3, 50]],
          ];
      for (const [name, hour, weather, position, target] of views) {
        await page.evaluate(
          ({ hour, weather, position, target }) => {
            window.__oasisLandmark.reviewCamera(position, target);
            const time = document.querySelector('#environment-time');
            time.value = hour;
            time.dispatchEvent(new Event('input', { bubbles: true }));
            const selector = document.querySelector('#environment-weather');
            selector.value = weather;
            selector.dispatchEvent(new Event('change'));
            window.__oasisLandmark.reviewWaterStep(0.5);
          },
          { hour, weather, position, target },
        );
        await page.waitForTimeout(300);
        const s = await page.evaluate(() => window.__oasisLandmark.snapshot());
        const water = s.waterEffects;
        assert.equal(s.modules, 16);
        assert.equal(water.version, version);
        assert.ok(water.path.length > 50);
        assert.ok(water.path.every((p) => p.every(Number.isFinite)));
        assert.deepEqual(water.impact, water.reflection.impact.slice(0, 2));
        assert.equal(water.reflection.size, mobile ? 256 : 768);
        assert.equal(water.reflection.passes, 2);
        assert.ok(water.reflection.captures > 0);
        assert.equal(water.ripples, 0);
        if (version === 6) {
          assert.equal(water.rockFlowCount, 7);
          assert.ok(water.rockLength > 4);
          assert.ok(water.rockClearance > 0.19);
          assert.equal(water.pondVersion, 4);
        }
        const key = `v${version}-${mobile ? 'mobile' : 'desktop'}-${name}`;
        states[key] = s;
        await page.screenshot({ path: resolve(output, `${key}.png`) });
        console.log(`Captured ${key}`);
      }
      const before = await page.evaluate(() => window.__oasisLandmark.snapshot());
      await page.waitForTimeout(300);
      assert.equal(
        (await page.evaluate(() => window.__oasisLandmark.snapshot())).waterEffects
          .elapsed,
        before.waterEffects.elapsed,
      );
      if (!mobile) {
        await page.evaluate(() => {
          window.__oasisLandmark.reviewCamera([74, -2.5, 66], [69.4, -5.3, 56.8]);
          const time = document.querySelector('#environment-time');
          time.value = 12;
          time.dispatchEvent(new Event('input', { bubbles: true }));
          const weather = document.querySelector('#environment-weather');
          weather.value = 'CLEAR';
          weather.dispatchEvent(new Event('change'));
        });
        const directory = resolve(output, `v${version}-sequence`);
        await mkdir(directory, { recursive: true });
        sequences[version] = [];
        for (let frame = 0; frame < 20; frame++) {
          await page.evaluate(() => window.__oasisLandmark.reviewWaterStep(0.5));
          await page.waitForTimeout(80);
          sequences[version].push(
            (await page.evaluate(() => window.__oasisLandmark.snapshot())).waterEffects
              .elapsed,
          );
          await page.screenshot({
            path: resolve(directory, `${String(frame).padStart(3, '0')}.png`),
          });
        }
        assert.ok(sequences[version].at(-1) - sequences[version][0] >= 9.49);
      }
      // Shader/render targets must recover after context loss at a paused surface.
      if (version === 6) {
        const previous = (await page.evaluate(() => window.__oasisLandmark.snapshot()))
          .waterEffects.reflection.captures;
        await page.evaluate(() => {
          window.__waterContext = document
            .querySelector('canvas')
            .getContext('webgl2')
            .getExtension('WEBGL_lose_context');
          window.__waterContext.loseContext();
        });
        await page.waitForFunction(() =>
          document.querySelector('canvas').getContext('webgl2').isContextLost(),
        );
        await page.waitForTimeout(200);
        await page.evaluate(() => window.__waterContext.restoreContext());
        await page.waitForFunction(
          (n) => window.__oasisLandmark.snapshot().waterEffects.reflection.captures > n,
          previous,
        );
        assert.equal(
          (await page.evaluate(() => window.__oasisLandmark.snapshot())).waterEffects
            .reflection.captured,
          true,
        );
      }
    }
    await page.goto(`${base}?debug&water=v4`);
    await page.waitForFunction(
      () => window.__oasisLandmark?.snapshot().waterEffects?.version === 6,
    );
    const ambient = await page.evaluate(
      () => window.__oasisLandmark.snapshot().waterEffects,
    );
    assert.equal(ambient.impact, null);
    assert.equal(ambient.rockFlowCount, 0);
    assert.equal(ambient.reflection.impact[2], 0);
    await page.goto(`${base}?debug`);
    await page.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
    assert.equal(
      (await page.evaluate(() => window.__oasisLandmark.snapshot())).waterEffects,
      null,
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, 'qa.json'),
    JSON.stringify({ states, sequences, errors }, null, 2),
  );
  console.log(
    `Real water v6 technical QA PASS: ${Object.keys(states).length} view states, two 10-second simulation sequences, desktop/mobile, reduced motion, context recovery, waterfall-off, default preserved; visual verdict requires inspection`,
  );
} finally {
  await writeFile(
    resolve(output, 'qa-progress.json'),
    JSON.stringify({ states, sequences, errors }, null, 2),
  );
  await browser?.close();
  server.kill();
}
