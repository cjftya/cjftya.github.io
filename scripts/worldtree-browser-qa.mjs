import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output = process.env.OASIS_QA_OUTPUT ?? '/tmp/oasis-worldtree';
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--host',
  '127.0.0.1',
  '--port',
  '5183',
  '--strictPort',
]);
await new Promise((r, j) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) r();
  });
  server.stderr.on('data', (d) => console.error(String(d)));
  server.on('exit', (c) => j(new Error(`Vite exit ${c}`)));
});
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = { errors: [], states: {}, audits: {} };
async function environment(page, time = 12, weather = 'CLEAR') {
  await page.evaluate(
    ({ time, weather }) => {
      const auto = document.querySelector('#environment-auto-weather');
      auto.checked = false;
      auto.dispatchEvent(new Event('change', { bubbles: true }));
      const t = document.querySelector('#environment-time');
      t.value = String(time);
      t.dispatchEvent(new Event('input', { bubbles: true }));
      const w = document.querySelector('#environment-weather');
      w.value = weather;
      w.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelectorAll('details').forEach((e) => (e.open = false));
    },
    { time, weather },
  );
  await page.evaluate(
    ({ time, weather }) => window.__oasisLandmark.reviewEnvironment(time, weather),
    { time, weather },
  );
  await page.waitForFunction((w) => {
    const s = window.__oasisLandmark.snapshot();
    return s.weather === w && s.weatherBlend === 1;
  }, weather);
  await page.waitForTimeout(250);
}
async function capture(page, name, eye, target) {
  if (eye)
    await page.evaluate(
      ({ eye, target }) => window.__oasisLandmark.reviewCamera(eye, target),
      { eye, target },
    );
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${output}/${name}.png` });
}
try {
  for (const width of [1280, 390]) {
    if (process.env.OASIS_QA_DESKTOP && width !== 1280) continue;
    const context = await browser.newContext({
      viewport: { width, height: width === 1280 ? 800 : 844 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: width === 390,
      hasTouch: width === 390,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') result.errors.push(m.text());
    });
    await page.goto('http://127.0.0.1:5183/projects/jelly-oasis/?debug');
    await page.waitForFunction(
      () => window.__oasisLandmark?.snapshot().calls > 10,
      undefined,
      { timeout: 120000 },
    );
    await environment(page);
    await capture(page, `${width}-presentation`);
    const getDistance = () =>
      page.evaluate(() => {
        const s = window.__oasisLandmark.snapshot();
        return {
          distance: Math.hypot(...s.camera.map((v, i) => v - s.target[i])),
          min: s.minDistance,
        };
      });
    assert.equal((await getDistance()).min, 1.5);
    if (width === 1280) {
      await page.mouse.move(620, 410);
      await page.mouse.wheel(0, -12000);
      await page.waitForTimeout(500);
      assert.ok(
        (await getDistance()).distance < 5,
        JSON.stringify(await getDistance()),
      );
      result.states[`${width}-zoom`] = await getDistance();
      await page.click('#reset-view');
      assert.equal((await getDistance()).min, 1.5);
    } else {
      const cdp = await context.newCDPSession(page);
      const touch = (x, y, id) => ({ x, y, id });
      for (let gesture = 0; gesture < 2; gesture++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [touch(180, 410, 1), touch(210, 410, 2)],
        });
        for (let i = 1; i <= 8; i++)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [touch(180 - i * 15, 410, 1), touch(210 + i * 15, 410, 2)],
          });
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
      }
      await page.waitForTimeout(300);
      assert.ok(
        (await getDistance()).distance < 35,
        JSON.stringify(await getDistance()),
      );
      result.states[`${width}-zoom`] = await getDistance();
      await page.click('#reset-view');
      assert.equal((await getDistance()).min, 1.5);
      await cdp.detach();
    }
    if (width === 1280) {
      await capture(page, 'worldtree-front', [87, 65, 115], [-5, 25, 5]);
      await capture(page, 'worldtree-left', [-100, 50, 55], [-5, 25, 5]);
      await capture(page, 'worldtree-rear', [-45, 60, -110], [-5, 25, 5]);
      await capture(page, 'worldtree-roots', [-44, 17, 35], [-10, 2, 2]);
      await capture(page, 'overview-day', [175, 175, 220], [10, 0, 10]);
      await capture(page, 'lake-day', [34, 13, 42], [18, -6, 20]);
      await capture(page, 'sanctuary-day', [102, 32, 87], [66, 10, 27]);
      await page.evaluate(() => window.__oasisLandmark.reviewRebuild());
      await page.waitForTimeout(200);
      result.audits.desktop = await page.evaluate(() => window.__oasisLandmark.audit());
      await environment(page, 0);
      await capture(page, 'medium-night', [106, 65, 121], [32, 5, 19]);
      await environment(page, 12, 'RAIN');
      await capture(page, 'lake-rain', [34, 13, 42], [18, -6, 20]);
    } else {
      await environment(page, 0);
      await capture(page, '390-presentation-night');
    }
    result.states[width] = await page.evaluate(() => window.__oasisLandmark.snapshot());
    await context.close();
  }
  await writeFile(
    `${output}/sacred-lake-browser.json`,
    JSON.stringify(result, null, 2),
  );
  assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
  for (const state of Object.values(result.states).filter((s) => s.modules)) {
    assert.equal(state.modules, 16);
    assert.equal(state.sacredLake.boundarySamples, 57);
    assert.ok(
      state.sacredLake.areaIncrease > 0.15 && state.sacredLake.areaIncrease < 0.25,
    );
    assert.ok(state.excavation.maxWaterDepth > 2.7);
    assert.equal(state.lakeEcology.rocks, 5);
  }
  console.log(
    JSON.stringify({
      errors: result.errors,
      states: Object.fromEntries(
        Object.entries(result.states)
          .filter(([, s]) => s.modules)
          .map(([k, s]) => [
            k,
            {
              lake: s.sacredLake,
              depth: s.excavation.maxWaterDepth,
              sanctuary: s.sanctuary,
              ecology: {
                rocks: s.lakeEcology.rocks,
                pads: s.lakeEcology.pads,
                plantTriangles: s.lakeEcology.plantTriangles,
              },
              solver: s.waterEffects.solver,
            },
          ]),
      ),
    }),
  );
} finally {
  await browser.close();
  server.kill();
}
