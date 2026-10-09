import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const output = resolve('artifacts/jelly-oasis/ruin-root-night-v1');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.EDGE_PATH ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
const results = { errors: [], assets: [], views: {}, environments: {} };
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
function monitor(p) {
  p.on('pageerror', (e) => results.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') results.errors.push(m.text());
  });
  p.on('response', (r) => {
    if (r.url().endsWith('.glb'))
      results.assets.push({ url: r.url(), status: r.status() });
  });
}
monitor(page);
const snapshot = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
async function panels(p, open) {
  await p.locator('#environment-debug, #landmark-debug').evaluateAll(
    (elements, value) =>
      elements.forEach((e) => {
        e.open = value && (innerWidth > 720 || e.id === 'environment-debug');
      }),
    open,
  );
}
async function capture(p, name, hide = true) {
  if (hide) await panels(p, false);
  await p.waitForTimeout(180);
  await p.screenshot({ path: resolve(output, `${name}.png`) });
  if (hide) await panels(p, true);
}
async function environment(p, time, weather = 'CLEAR') {
  await panels(p, true);
  await p.locator('#environment-time').scrollIntoViewIfNeeded();
  await p.locator('#environment-time').fill(String(time));
  await p.locator('#environment-weather').scrollIntoViewIfNeeded();
  await p.locator('#environment-weather').selectOption(weather);
  await p.waitForFunction((expected) => {
    const s = window.__oasisLandmark.snapshot();
    return s.weather === expected && s.weatherBlend === 1;
  }, weather);
}
const base = process.env.RUIN_QA_URL ?? 'http://127.0.0.1:4175';
async function load(p, detail = true) {
  await p.goto(
    `${base}/projects/jelly-oasis/?debug&ruin=${detail ? 'detail' : 'blockout'}`,
  );
  await p.waitForFunction(() => window.__oasisLandmark);
  assert.equal(await p.locator('#environment-debug').evaluate((e) => e.open), false);
  await environment(p, 12);
}
function world([x, y, z], height) {
  const c = Math.cos(Math.PI / 6),
    s = Math.sin(Math.PI / 6);
  return [70 + x * c + z * s, height + y, 58 - x * s + z * c];
}
async function view(p, pos, target, height) {
  await p.evaluate(
    ([position, target]) => window.__oasisLandmark.reviewCamera(position, target),
    [world(pos, height), world(target, height)],
  );
}
try {
  for (const detail of [false, true]) {
    await load(page, detail);
    const variant = detail ? 'after' : 'before';
    results[variant] = await snapshot(page);
    const height = results[variant].contact.Ruin_Wall_A.y;
    const views = {
      'arch-front': [
        [15, 7, 27],
        [16, 4, -6],
      ],
      'arch-left': [
        [-3, 10, 15],
        [16, 4, -6],
      ],
      'arch-right': [
        [38, 11, 15],
        [18, 4, -6],
      ],
      'arch-ground': [
        [15, 2, 6],
        [15, 4.4, -7],
      ],
      'root-front': [
        [-13, 8, 17],
        [-13, 3, -4],
      ],
      'root-left': [
        [-30, 10, 8],
        [-13, 3, -6],
      ],
      'root-right': [
        [0, 9, 9],
        [-13, 3, -6],
      ],
      'root-ground': [
        [-9, 1.8, 2],
        [-14, 3, -2],
      ],
    };
    for (const [name, [pos, target]] of Object.entries(views)) {
      await view(page, pos, target, height);
      await capture(page, `${variant}-${name}`);
      results.views[`${variant}-${name}`] = await snapshot(page);
    }
    for (const v of ['overview', 'medium', 'ground']) {
      await page.locator(`[data-view=${v}]`).click();
      await capture(page, `${variant}-${v}-noon`);
    }
  }
  results.audit = await page.evaluate(() => window.__oasisLandmark.audit());
  for (const route of ['loop', 'clearing', 'approach', 'passage'])
    assert.equal(results.audit[route].clear, true, route);
  assert.ok(results.audit.passage.measuredJambWidth >= 4);
  assert.deepEqual(results.after.placement, results.before.placement);
  assert.equal(
    results.after.contact.Cliff_Waterfall_A.y,
    results.before.contact.Cliff_Waterfall_A.y,
  );
  await page.locator('[data-view=medium]').click();
  for (const [name, time, weather] of [
    ['noon', 12, 'CLEAR'],
    ['sunset', 18.5, 'PARTLY_CLOUDY'],
    ['night', 0, 'CLEAR'],
    ['night-three', 3, 'CLEAR'],
    ['overcast', 0, 'OVERCAST'],
    ['rain', 0, 'RAIN'],
    ['mist', 0, 'MIST'],
  ]) {
    await environment(page, time, weather);
    await capture(page, `environment-${name}`);
    results.environments[name] = await snapshot(page);
    assert.ok(
      !(
        results.environments[name].sun.castShadow &&
        results.environments[name].moon.castShadow
      ),
    );
  }
  assert.equal(results.environments.noon.moon.allocated, false);
  assert.equal(results.environments.night.moon.castShadow, true);
  assert.equal(results.environments.night.shadow.allocated, false);
  results.dusk = [];
  for (const hour of [18.5, 19, 19.25, 19.5, 20, 20.5]) {
    await environment(page, hour);
    results.dusk.push(await snapshot(page));
    await capture(page, `dusk-${hour}`);
  }
  await environment(page, 0);
  results.shadowOn = await snapshot(page);
  await page.locator('#environment-shadows').uncheck();
  await capture(page, 'night-shadows-off');
  results.shadowOff = await snapshot(page);
  assert.equal(results.shadowOff.moon.allocated, false);
  assert.equal(results.shadowOff.shadow.allocated, false);
  await page.locator('#environment-shadows').check();
  // Aim at the same moon direction used by the light; noon/00:00/03:00 capture.
  for (const time of [0, 3, 12]) {
    await environment(page, time);
    const state = await snapshot(page),
      eye = state.camera;
    const target = eye.map((v, i) => v + state.moon.direction[i] * 100);
    await page.evaluate(
      ([position, target]) => window.__oasisLandmark.reviewCamera(position, target),
      [eye, target],
    );
    await capture(page, `moon-sky-${time}`);
  }
  await page.locator('[data-view=medium]').click();
  await environment(page, 0);
  await page.locator('#environment-auto-weather').check();
  const wait = (await snapshot(page)).autoWeather.secondsUntilNext;
  await page.waitForTimeout(500);
  const paused = await snapshot(page);
  assert.equal(paused.timeOfDay, 0);
  assert.ok(paused.autoWeather.secondsUntilNext < wait);
  await capture(page, 'panel-auto-on', false);
  await page.locator('#environment-weather').selectOption('MIST');
  await page.waitForTimeout(200);
  assert.equal((await snapshot(page)).autoWeather.enabled, false);
  await capture(page, 'panel-manual', false);
  await page.locator('#environment-auto-weather').check();
  assert.equal((await snapshot(page)).weather, 'MIST');
  assert.ok((await snapshot(page)).autoWeather.secondsUntilNext > 119);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
  );
  const hiddenWait = (await snapshot(page)).autoWeather.secondsUntilNext;
  await page.waitForTimeout(600);
  assert.equal((await snapshot(page)).autoWeather.secondsUntilNext, hiddenWait);
  await page.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
  );
  await page.waitForTimeout(200);
  assert.ok((await snapshot(page)).autoWeather.secondsUntilNext < hiddenWait);
  // WebGL restoration must retain the chosen hour and caster.
  await environment(page, 0, 'CLEAR');
  await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const extension = gl.getExtension('WEBGL_lose_context');
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 250);
  });
  await page.waitForTimeout(1200);
  results.restored = await snapshot(page);
  assert.equal(results.restored.moon.castShadow, true);
  await capture(page, 'night-restored');
  const normal = await context.newPage();
  monitor(normal);
  const defaultFiles = [];
  normal.on('response', (r) => {
    if (r.url().endsWith('.glb')) defaultFiles.push(r.url());
  });
  await normal.emulateMedia({ reducedMotion: 'no-preference' });
  await normal.goto(`${base}/projects/jelly-oasis/`);
  await normal.waitForFunction(() => document.querySelector('#landmark-status').hidden);
  results.defaultFiles = defaultFiles;
  for (const name of [
    'Ruin_Arch_A',
    'Ruin_Wall_A',
    'Ruin_BrokenWall_A',
    'Root_Large_A',
    'Root_Tree_Base_Blockout',
  ])
    assert.ok(
      defaultFiles.some((url) => url.endsWith(`${name}_Detail_v1.glb`)),
      name,
    );
  assert.equal(await normal.evaluate(() => Boolean(window.__oasisLandmark)), false);
  assert.equal(
    await normal.locator('#environment-debug').evaluate((e) => e.open),
    false,
  );
  await normal.locator('#environment-debug summary').click();
  assert.equal(await normal.locator('#environment-auto-weather').isChecked(), true);
  await capture(normal, 'production-panel', false);
  await normal.locator('#environment-time').fill('0');
  await normal.locator('#environment-weather').selectOption('CLEAR');
  await normal.locator('#environment-sky').click();
  await capture(normal, 'production-moon-sky');
  await normal.locator('#reset-view').click();
  await capture(normal, 'production-reset');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const mobile = await mobileContext.newPage();
  monitor(mobile);
  await load(mobile);
  await environment(mobile, 0);
  results.mobile = await snapshot(mobile);
  assert.equal(results.mobile.moon.allocated, false);
  assert.equal(results.mobile.shadow.allocated, false);
  assert.equal(results.mobile.shadows, false);
  assert.ok(results.mobile.moon.visibility > 0);
  await capture(mobile, 'mobile-night');
  await mobile.locator('#environment-sky').scrollIntoViewIfNeeded();
  await mobile.locator('#environment-sky').click();
  await capture(mobile, 'mobile-moon-sky');
  await mobile.locator('#reset-view').click();
  await capture(mobile, 'mobile-panel', false);
  await mobile.setViewportSize({ width: 844, height: 390 });
  await capture(mobile, 'mobile-landscape-panel', false);
  const rectangles = await mobile
    .locator('#environment-debug, #landmark-debug')
    .evaluateAll((elements) =>
      elements.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }),
    );
  results.mobilePanels = rectangles;
  const [a, b] = rectangles;
  assert.ok(
    a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y,
    'panels overlap',
  );
  assert.ok(results.assets.every((a) => a.status === 200));
  assert.deepEqual(results.errors, []);
} finally {
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      errors: results.errors,
      audit: results.audit,
      day: results.environments.noon,
      night: results.environments.night,
      mobile: results.mobile,
    },
    null,
    2,
  ),
);
