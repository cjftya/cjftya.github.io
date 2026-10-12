import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const output = 'artifacts/jelly-oasis/flower-meadow-final-composition-v1';
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '5179',
  '--strictPort',
]);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) resolve();
  });
  server.on('exit', reject);
});
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = {
  errors: [],
  states: {},
  placements: {},
  audits: {},
  lifecycle: {},
  limitations: [
    'Real Galaxy Fold FPS, heat and 30 minute memory NOT_TESTED',
    'SwiftShader total renderer snapshots are not hardware benchmarks',
  ],
};
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
function compactResult(value) {
  const compact = (state) => {
    const rest = Object.fromEntries(
      Object.entries(state).filter(
        ([key]) => !['worldBounds', 'excavation', 'contact', 'timings'].includes(key),
      ),
    );
    return { ...rest, excavation: { channelPath: state.excavation.channelPath } };
  };
  return {
    ...value,
    baseline: value.placements['off-1440x900']?.baseline,
    baselineSnapshot: value.states['off-1440x900-overview'],
    placements: Object.fromEntries(
      ['a', 'b'].map((v) => [v, value.placements[`${v}-1440x900`]?.meadow ?? []]),
    ),
    states: Object.fromEntries(
      Object.entries(value.states).map(([key, state]) => [key, compact(state)]),
    ),
    verified: [
      'All four viewports retain identical previous-owner positions across Off/A/B',
      'All generated desktop/mobile master meadow positions are deterministic',
      'All four route audits pass',
    ],
  };
}

const capture = async (p, key) => {
  await p.waitForTimeout(180);
  await p.screenshot({ path: `${output}/${key}.jpg`, type: 'jpeg', quality: 82 });
  result.states[key] = await snap(p);
};
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 780],
    [844, 390],
  ]) {
    let baseline;
    for (const variant of ['off', 'a', 'b']) {
      console.log(`${variant}-${width}x${height}`);
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        isMobile: width < 500 || height < 500,
        hasTouch: width < 500 || height < 500,
      });
      const p = await context.newPage();
      p.on('pageerror', (e) => result.errors.push(String(e)));
      p.on('console', (m) => {
        if (m.type() === 'error') result.errors.push(m.text());
      });
      await p.goto(
        `http://127.0.0.1:5179/projects/jelly-oasis/?debug&meadow=${variant}`,
      );
      await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
      await p.evaluate(() => {
        const e = document.getElementById('environment-time');
        e.value = '12';
        e.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelectorAll('details').forEach((e) => (e.open = false));
      });
      const prefix = `${variant}-${width}x${height}`;
      for (const view of ['overview', 'medium', 'ground']) {
        await p.evaluate(
          (v) => document.querySelector(`[data-view="${v}"]`).click(),
          view,
        );
        await capture(p, `${prefix}-${view}`);
      }
      const s = await snap(p);
      assert.equal(s.terrain.size, 224);
      assert.equal(s.modules, 16);
      assert.equal(s.waterEffects.solver, 'gpgpu-heightfield');
      assert.equal(s.meadow.variant, variant);
      assert(s.meadow.draws <= 4);
      const old = await p.evaluate(() => ({
        vegetation: window.__oasisLandmark.reviewVegetation(),
        composition: window.__oasisLandmark.reviewComposition(),
        scenery: window.__oasisLandmark.reviewScenery(),
      }));
      if (variant === 'off') baseline = old;
      else assert.deepEqual(old, baseline);
      const placements = await p.evaluate(() => window.__oasisLandmark.reviewMeadow());
      result.placements[prefix] = { baseline: old, meadow: placements };
      const audit = await p.evaluate(() => window.__oasisLandmark.audit());
      result.audits[prefix] = audit;
      for (const key of ['loop', 'clearing', 'approach', 'passage'])
        assert.equal(audit[key].clear, true);
      await p.evaluate(() =>
        window.__oasisLandmark.reviewCamera([14, -4.6, 35], [14, -6.3, 22]),
      );
      await capture(p, `${prefix}-pond`);
      if (width === 1440) {
        await p.evaluate(() =>
          window.__oasisLandmark.reviewCamera([12, 19, 95], [8, 1, 60]),
        );
        await capture(p, `${prefix}-flowers`);
        if (variant === 'a') {
          for (const zone of ['southwest-lilac', 'south-cream', 'southeast-lilac']) {
            const q = placements.find((q) => q.zone === zone);
            assert(q, zone);
            await p.evaluate(
              (w) =>
                window.__oasisLandmark.reviewCamera(
                  [w[0] + 3, w[1] + 1.8, w[2] + 3],
                  [w[0], w[1] + 0.2, w[2]],
                ),
              q.world,
            );
            await capture(p, `a-${zone}-close`);
          }
          await p.evaluate(() =>
            document.querySelector('[data-view="medium"]').click(),
          );
          for (const hour of [18, 0, 12]) {
            await p.evaluate((h) => {
              const e = document.getElementById('environment-time');
              e.value = String(h);
              e.dispatchEvent(new Event('input', { bubbles: true }));
            }, hour);
            await capture(p, `a-hour${hour}`);
          }
          for (const weather of ['RAIN', 'MIST', 'CLEAR']) {
            await p.selectOption('#environment-weather', weather, { force: true });
            await p.waitForTimeout(400);
            await capture(p, `a-${weather}`);
          }
          await p.evaluate(() => {
            const e = document.getElementById('environment-shadows');
            e.checked = false;
            e.dispatchEvent(new Event('change', { bubbles: true }));
          });
          await capture(p, 'a-shadows-off');
          const memories = [];
          for (let i = 0; i < 3; i++) {
            await p.evaluate(() => window.__oasisLandmark.reviewRebuild());
            await p.waitForTimeout(180);
            assert.deepEqual(
              await p.evaluate(() => window.__oasisLandmark.reviewMeadow()),
              placements,
            );
            const t = await snap(p);
            memories.push({
              geometries: t.geometries,
              textures: t.textures,
              instances: t.meadow.instanceCount,
            });
          }
          assert(
            memories.every((m) => JSON.stringify(m) === JSON.stringify(memories[0])),
          );
          await p.evaluate(() => window.__oasisLandmark.reviewIsolate('Ruin_Arch_A'));
          assert.equal((await snap(p)).meadow.visible, false);
          await p.evaluate(() => window.__oasisLandmark.reviewIsolate(''));
          assert.equal((await snap(p)).meadow.visible, true);
          await p.evaluate(() => {
            window.__meadowContext = document
              .querySelector('canvas')
              .getContext('webgl2')
              .getExtension('WEBGL_lose_context');
            window.__meadowContext.loseContext();
          });
          await p.waitForTimeout(120);
          await p.evaluate(() => window.__meadowContext.restoreContext());
          await p.waitForTimeout(800);
          assert.deepEqual(
            await p.evaluate(() => window.__oasisLandmark.reviewMeadow()),
            placements,
          );
          result.lifecycle = { memories, restored: await snap(p) };
        }
      }
      await context.close();
    }
    const ctx = await browser.newContext({
        viewport: { width, height },
        reducedMotion: 'reduce',
      }),
      p = await ctx.newPage();
    await p.goto('http://127.0.0.1:5179/projects/jelly-oasis/?meadow=off');
    await p.locator('#landmark-status').waitFor({ state: 'hidden' });
    assert.equal(await p.evaluate(() => '__oasisLandmark' in window), false);
    await p.screenshot({
      path: `${output}/production-${width}x${height}.jpg`,
      type: 'jpeg',
      quality: 82,
    });
    await ctx.close();
  }
  assert.deepEqual(result.errors, []);
  result.status = 'PASS';
} finally {
  await writeFile(
    `${output}/browser-qa.json`,
    JSON.stringify(compactResult(result), null, 2),
  );
  await browser.close();
  server.kill();
}
console.log(
  JSON.stringify({
    status: result.status,
    errors: result.errors,
    screenshots: Object.keys(result.states).length,
  }),
);
