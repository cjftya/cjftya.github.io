import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const output = resolve(
  process.env.WATER_QA_OUTPUT ?? 'artifacts/jelly-oasis/water-waterfall-v1',
);
await mkdir(output, { recursive: true });
const base = process.env.LANDMARK_QA_URL ?? 'http://127.0.0.1:4186';
let server;
if (!process.env.LANDMARK_QA_URL) {
  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4186',
      '--strictPort',
    ],
    { stdio: 'pipe' },
  );
  await new Promise((ok, fail) => {
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) ok();
    });
    server.stderr.on('data', (d) => console.error(d.toString()));
    server.on('exit', (code) => fail(new Error('Preview exited: ' + code)));
  });
}
const browser = await chromium.launch({
  ...(process.env.LANDMARK_QA_BROWSER
    ? { executablePath: process.env.LANDMARK_QA_BROWSER }
    : {}),
  headless: true,
  args: ['--no-sandbox'],
});
browser.on('disconnected', () => console.log('browser closed'));
const result = {
  states: {},
  errors: [],
  responses: [],
  camera: {},
  production: {},
  timings: {},
};
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
function monitor(p) {
  p.on('pageerror', (e) => result.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') result.errors.push(m.text());
  });
  p.on('response', (r) => {
    if (r.url().endsWith('.glb'))
      result.responses.push({ url: r.url(), status: r.status() });
  });
}
async function environment(p, time, weather = 'CLEAR') {
  await p.evaluate(
    ([t, w]) => {
      for (const [id, v, type] of [
        ['environment-time', t, 'input'],
        ['environment-weather', w, 'change'],
      ]) {
        const e = document.getElementById(id);
        e.value = String(v);
        e.dispatchEvent(new Event(type, { bubbles: true }));
      }
      document.querySelectorAll('details').forEach((e) => (e.open = false));
    },
    [time, weather],
  );
  await p.waitForTimeout(150);
  await p.waitForFunction(
    (w) =>
      window.__oasisLandmark?.snapshot().weatherBlend === 1 &&
      window.__oasisLandmark.snapshot().weather === w,
    weather,
    { timeout: 120000 },
  );
}
async function capture(p, name) {
  await p.waitForTimeout(400);
  await p.screenshot({ path: resolve(output, name + '.png') });
  result.states[name] = await snap(p);
  return result.states[name];
}
async function load(p, flags = '?debug') {
  await p.goto(base + '/projects/jelly-oasis/' + flags);
  await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
}
async function shadows(p, value) {
  await p.evaluate((value) => {
    const e = document.querySelector('#environment-shadows');
    e.checked = value;
    e.dispatchEvent(new Event('change'));
  }, value);
  await p.waitForTimeout(200);
}
async function drag(p, mobile, dx, dy) {
  const size = p.viewportSize();
  const x = size.width * 0.5,
    y = size.height * 0.45;
  if (mobile) {
    const session = await p.context().newCDPSession(p);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 12; i++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / 12, y: y + (dy * i) / 12 }],
      });
      await p.waitForTimeout(15);
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await session.detach();
  } else {
    await p.mouse.move(x, y);
    await p.mouse.down();
    await p.mouse.move(x + dx, y + dy, { steps: 12 });
    await p.mouse.up();
  }
  await p.waitForTimeout(550);
}
async function skyByInput(p, mobile, light) {
  // Use state solely to compute pointer movement; never set camera or target.
  for (let i = 0; i < 14; i++) {
    const s = await snap(p);
    const d = s[light].direction;
    const desiredPolar = Math.acos(-d[1]);
    const desiredAzimuth = Math.atan2(-d[0], -d[2]);
    const polarError = desiredPolar - s.orbit.polar;
    const azimuthError = Math.atan2(
      Math.sin(desiredAzimuth - s.orbit.azimuth),
      Math.cos(desiredAzimuth - s.orbit.azimuth),
    );
    if (Math.abs(polarError) < 0.006 && Math.abs(azimuthError) < 0.006) break;
    const h = p.viewportSize().height;
    const limit = mobile ? 110 : 280;
    await drag(
      p,
      mobile,
      Math.max(-limit, Math.min(limit, (-azimuthError * h) / (2 * Math.PI))),
      Math.max(-limit, Math.min(limit, (-polarError * h) / (2 * Math.PI))),
    );
  }
  const s = await snap(p);
  const d = s[light].direction;
  const direction = s.target.map((v, i) => v - s.camera[i]);
  const length = Math.hypot(...direction);
  const dot = direction.reduce((a, v, i) => a + (v / length) * d[i], 0);
  assert.ok(dot > 0.997, light + ' reached by input: ' + dot);
  return { dot, state: s };
}
try {
  for (const mobile of [false, true]) {
    const prefix = mobile ? 'mobile' : 'desktop';
    console.log('QA start', prefix);
    const c = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: 'reduce',
    });
    const p = await c.newPage();
    p.setDefaultTimeout(120000);
    monitor(p);
    for (const candidate of [false, true]) {
      await load(p, '?debug' + (candidate ? '&water=v1&waterfall=v1' : ''));
      for (const [label, time, weather, position, target] of [
        ['medium', 12, 'CLEAR', [125, 41.7633, 136], [70, 0.7633, 58]],
        ['waterfall', 12, 'CLEAR', [82, 1, 93], [66, -3, 50]],
        ['night', 0, 'CLEAR', [82, 1, 93], [66, -3, 50]],
        ['pond-top', 12, 'CLEAR', [70, 35, 65], [70, -5.39, 65]],
        ['ground', 12, 'CLEAR', [94, -2.8, 81], [72, -5.2, 64]],
        ['rain', 12, 'RAIN', [82, 1, 93], [66, -3, 50]],
      ]) {
        await p.evaluate(
          ({ position, target }) =>
            window.__oasisLandmark.reviewCamera(position, target),
          { position, target },
        );
        await environment(p, time, weather);
        console.log('capture', prefix, candidate, label);
        const s = await capture(p, `${prefix}-${candidate ? 'v1' : 'soft'}-${label}`);
        assert.equal(s.modules, 16);
        assert.equal(s.assetTriangles, 20786);
        assert.equal(s.shadows, true);
        assert.deepEqual(s.shadow.mapSize, mobile ? [512, 512] : [1024, 1024]);
        assert.equal(time === 0 ? s.moon.castShadow : s.sun.castShadow, true);
        assert.equal(time === 0 ? s.moon.allocated : s.sun.allocated, true);
        if (candidate) {
          assert.equal(s.waterEffects.water, true);
          assert.equal(s.waterEffects.waterfall, true);
          assert.ok(s.waterEffects.triangles < 2000);
        } else assert.equal(s.waterEffects, null);
      }
      const audit = await p.evaluate(() => window.__oasisLandmark.audit());
      for (const k of ['loop', 'clearing', 'approach', 'passage'])
        assert.equal(audit[k].clear, true, k);
      result.states[`${prefix}-${candidate ? 'v1' : 'soft'}-audit`] = audit;
    }
    // Water effect channels remain independent.
    for (const flags of ['&water=v1', '&waterfall=v1']) {
      await load(p, '?debug' + flags);
      const s = await snap(p);
      assert.equal(s.waterEffects.water, flags.includes('water=v1'));
      assert.equal(s.waterEffects.waterfall, flags.includes('waterfall=v1'));
    }
    await load(p, '?debug&water=v1&waterfall=v1');
    await environment(p, 12);
    await shadows(p, false);
    let s = await snap(p);
    assert.equal(s.sun.allocated || s.moon.allocated, false);
    assert.equal(s.sun.castShadow || s.moon.castShadow, false);
    await capture(p, prefix + '-shadow-off');
    await shadows(p, true);
    await environment(p, 0);
    s = await snap(p);
    assert.equal(s.moon.castShadow, true);
    assert.equal(s.moon.allocated, true);
    assert.equal(s.sun.allocated, false);
    await capture(p, prefix + '-moon-shadow');
    await p.evaluate(() => {
      const canvas = document.querySelector('#oasis-canvas');
      const gl = canvas.getContext('webgl2');
      const ext = gl.getExtension('WEBGL_lose_context');
      ext.loseContext();
      setTimeout(() => ext.restoreContext(), 100);
    });
    await p.waitForTimeout(700);
    s = await snap(p);
    assert.equal(s.moon.allocated, true);
    result.states[prefix + '-restored'] = s;
    console.log('input QA', prefix);
    await load(p);
    await environment(p, 12);
    await p.locator('#reset-view').click();
    result.camera[prefix] = {
      start: await snap(p),
      sun: await skyByInput(p, mobile, 'sun'),
    };
    await capture(p, prefix + '-sun-input');
    await p.locator('#reset-view').click();
    await environment(p, 0);
    result.camera[prefix].moon = await skyByInput(p, mobile, 'moon');
    await capture(p, prefix + '-moon-input');
    await p.locator('#reset-view').click();
    const reset = await snap(p);
    assert.ok(reset.orbit.maxPolar > 3.1);
    // One full horizontal revolution, tracking changes through actual inputs.
    let angle = 0;
    let last = reset.orbit.azimuth;
    const dx = mobile ? 100 : 250;
    for (let i = 0; i < Math.ceil(p.viewportSize().height / dx) + 3; i++) {
      await drag(p, mobile, dx, 0);
      const next = (await snap(p)).orbit.azimuth;
      angle += Math.atan2(Math.sin(next - last), Math.cos(next - last));
      last = next;
    }
    assert.ok(Math.abs(angle) > Math.PI * 2);
    result.camera[prefix].revolution = angle;
    for (const direction of [-1, 1]) {
      for (let i = 0; i < 6; i++)
        await drag(p, mobile, 0, direction * (mobile ? 140 : 250));
      const s = await snap(p);
      assert.ok(Number.isFinite(s.camera[1]));
      result.camera[prefix]['pole' + direction] = s;
    }
    if (mobile) {
      for (const viewport of [
        { width: 360, height: 780 },
        { width: 844, height: 390 },
      ]) {
        await p.setViewportSize(viewport);
        await p.locator('#reset-view').click();
        await environment(p, 12);
        const s = await capture(p, prefix + `-${viewport.width}x${viewport.height}`);
        assert.equal(s.sun.allocated, true);
        assert.ok(s.orbit.maxPolar > 3.1);
      }
    }
    await c.close();
  }
  const animated = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  const ap = await animated.newPage();
  ap.setDefaultTimeout(120000);
  monitor(ap);
  for (const candidate of [false, true]) {
    await load(ap, '?debug' + (candidate ? '&water=v1&waterfall=v1' : ''));
    await environment(ap, 12);
    await ap.evaluate(() =>
      window.__oasisLandmark.reviewCamera([82, 1, 93], [66, -3, 50]),
    );
    for (const enabled of [false, true]) {
      await shadows(ap, enabled);
      const samples = [];
      // Force renders via benign view changes when the baseline is idle.
      for (let i = 0; i < 12; i++) {
        await ap.evaluate(
          (i) =>
            window.__oasisLandmark.reviewCamera([82 + i * 0.001, 1, 93], [66, -3, 50]),
          i,
        );
        await ap.waitForTimeout(65);
        const s = await snap(ap);
        samples.push({
          renderCpuMs: s.renderCpuMs,
          frameCpuMs: s.frameCpuMs,
          calls: s.calls,
          triangles: s.triangles,
          textures: s.textures,
          geometries: s.geometries,
        });
      }
      result.timings[(candidate ? 'v1' : 'soft') + (enabled ? '-on' : '-off')] =
        samples;
    }
    if (candidate) {
      const before = await snap(ap);
      assert.ok(before.waterEffects.elapsed > 0);
      await ap.screenshot({ path: resolve(output, 'animated-before.png') });
      await ap.waitForTimeout(800);
      const after = await snap(ap);
      await ap.screenshot({ path: resolve(output, 'animated-after.png') });
      assert.ok(after.waterEffects.elapsed > before.waterEffects.elapsed);
      assert.equal(after.timeOfDay, before.timeOfDay);
      result.states.animation = { before, after };
      const path = after.waterEffects.path;
      assert.ok(path.every((p) => p.every(Number.isFinite)));
      assert.ok(Math.abs(path.at(-1)[1] - (after.pondHeight + 0.035)) < 1e-6);
      assert.ok(
        Math.max(...path.slice(1).map((p, i) => p[1] - path[i][1])) < 0.15,
        'No uphill waterfall',
      );
      await ap.emulateMedia({ reducedMotion: 'reduce' });
      await ap.waitForTimeout(200);
      const paused = await snap(ap);
      await ap.waitForTimeout(500);
      assert.equal((await snap(ap)).waterEffects.elapsed, paused.waterEffects.elapsed);
    }
  }
  await animated.close();
  // Production queries cannot turn on water candidates or expose debug API.
  const productionContext = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await productionContext.newPage();
  monitor(p);
  for (const query of ['', '?water=v1&waterfall=v1']) {
    await p.goto(base + '/projects/jelly-oasis/' + query);
    await p.waitForFunction(() => document.querySelector('#landmark-status')?.hidden);
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    await p.waitForTimeout(400);
    result.production[query || 'default'] = {
      panel: await p.locator('#environment-stats').isVisible(),
    };
    await p.screenshot({
      path: resolve(output, query ? 'production-query.png' : 'production-default.png'),
    });
  }
  assert.deepEqual(
    await readFile(resolve(output, 'production-default.png')),
    await readFile(resolve(output, 'production-query.png')),
  );
  await productionContext.close();
  assert.ok(result.responses.every((r) => r.status === 200));
  assert.deepEqual(result.errors, []);
  const baseline = JSON.parse(
    await readFile(resolve(output, 'baseline/baseline.json'), 'utf8'),
  );
  for (const name of ['desktop', 'mobile'])
    for (const view of ['medium', 'waterfall', 'night', 'pond-top']) {
      assert.equal(
        result.states[`${name}-v1-${view}`].pondHeight,
        baseline[`${name}-${view}`].snapshot.pondHeight,
      );
      assert.deepEqual(
        result.states[`${name}-v1-${view}`].contact,
        baseline[`${name}-${view}`].snapshot.contact,
      );
    }
  console.log('Water/camera/browser QA PASS');
} finally {
  await writeFile(resolve(output, 'browser-qa.json'), JSON.stringify(result, null, 2));
  await browser.close();
  server?.kill();
}
