import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
const output = process.env.OASIS_QA_OUTPUT ?? 'artifacts/jelly-oasis/map-rescale-v1';
const base = process.env.OASIS_QA_URL ?? 'http://127.0.0.1:5178';
await mkdir(output, { recursive: true });
const server = process.env.OASIS_QA_URL
  ? null
  : spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '5178',
      '--strictPort',
    ]);
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (String(d).includes('Local:')) resolve();
    });
    server.on('exit', (c) => reject(new Error(String(c))));
  });
const b = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER ?? '/tmp/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const result = {
  errors: [],
  assets: [],
  states: {},
  audits: {},
  frameCoverage: {},
  dpr: 1,
  time: 12,
  weather: 'CLEAR',
  limitations: ['Real mobile FPS, heat and long-duration GPU memory NOT_TESTED'],
};
const snap = (p) => p.evaluate(() => window.__oasisLandmark.snapshot());
try {
  for (const size of [320, 224, 192])
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
      [360, 780],
      [844, 390],
    ]) {
      const c = await b.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        isMobile: width < 500 || height < 500,
        hasTouch: width < 500 || height < 500,
      });
      const p = await c.newPage();
      p.on('pageerror', (e) => result.errors.push(String(e)));
      p.on('console', (m) => {
        if (m.type() === 'error') result.errors.push(m.text());
      });
      p.on('response', (r) => {
        if (r.url().endsWith('.glb'))
          result.assets.push({ url: r.url(), status: r.status() });
      });
      const prefix = `${size}-${width}x${height}`;
      await p.goto(`${base}/projects/jelly-oasis/?debug&world=${size}`);
      await p.waitForFunction(() => window.__oasisLandmark?.snapshot().calls > 10);
      await p.evaluate(() => {
        const e = document.getElementById('environment-time');
        e.value = '12';
        e.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelectorAll('details').forEach((e) => (e.open = false));
      });
      const presentation = await snap(p);
      const capture = async (view) => {
        await p.waitForTimeout(100);
        await p.screenshot({
          path: `${output}/${prefix}-${view}.jpg`,
          type: 'jpeg',
          quality: 75,
        });
        result.states[`${prefix}-${view}`] = await snap(p);
      };
      for (const view of ['overview', 'medium', 'ground']) {
        await p.evaluate(
          (v) => document.querySelector(`[data-view="${v}"]`).click(),
          view,
        );
        await capture(view);
      }
      const s = await snap(p);
      assert.equal(s.terrain.size, size);
      assert.equal(s.modules, 16);
      assert.equal(s.assetTriangles, 20894);
      assert.equal(s.waterEffects.solver, 'gpgpu-heightfield');
      assert.equal(s.waterEffects.rockFlowCount, 0);
      assert.deepEqual(s.excavation.channelPath, []);
      for (const bound of Object.values(s.worldBounds)) assert(bound.margin >= 5);
      const placements = await p.evaluate(() => [
        ...window.__oasisLandmark.reviewVegetation(),
        ...window.__oasisLandmark.reviewComposition(),
      ]);
      for (const q of placements)
        assert(
          Math.max(Math.abs(q.world[0]), Math.abs(q.world[2])) + q.radius + 1 <
            size / 2,
        );
      result.audits[prefix] = await p.evaluate(() => window.__oasisLandmark.audit());
      for (const key of ['loop', 'clearing', 'approach', 'passage'])
        assert.equal(result.audits[prefix][key].clear, true);
      // Same translated pond camera in metres, preserving eye/target orientation.
      const dx = s.placement.position.x - 70,
        dz = s.placement.position.z - 58;
      await p.evaluate(
        ([dx, dz]) =>
          window.__oasisLandmark.reviewCamera(
            [70 + dx, -4.6, 79 + dz],
            [70 + dx, -6.3, 66 + dz],
          ),
        [dx, dz],
      );
      await capture('pond-low');
      if (width === 1440)
        for (const view of ['north', 'west']) {
          const ratio = size / 320;
          await p.evaluate(
            ([view, r]) =>
              window.__oasisLandmark.reviewCamera(
                view === 'north' ? [-18 * r, 52, -47 * r] : [-98 * r, 35, 66 * r],
                view === 'north' ? [-13 * r, 28, -80 * r] : [-64 * r, 7, 24 * r],
              ),
            [view, ratio],
          );
          await capture(view);
        }
      await p.click('#reset-view');
      const reset = await snap(p);
      assert(reset.camera.every((v, i) => Math.abs(v - presentation.camera[i]) < 1e-8));
      const memories = [];
      for (let i = 0; i < 3; i++) {
        await p.evaluate(() => window.__oasisLandmark.reviewRebuild());
        await p.waitForTimeout(100);
        const s = await snap(p);
        memories.push({
          textures: s.textures,
          geometries: s.geometries,
          vegetation: s.vegetation.instanceCount,
          composition: s.composition.instanceCount,
        });
      }
      assert.deepEqual(memories[1], memories[2]);
      result.states[`${prefix}-rebuild`] = memories;
      await c.close();
      console.log(prefix, 'PASS');
    }
  const paths = [...new Set(result.assets.map((a) => a.url.split('/assets/')[1]))];
  assert.equal(paths.length, 16);
  assert(result.assets.every((a) => a.status === 200));
  result.assetHashes = await Promise.all(
    paths.map(async (path) => ({
      path,
      sha256: createHash('sha256')
        .update(await readFile('public/assets/' + path))
        .digest('hex'),
    })),
  );
  assert.deepEqual(result.errors, []);
  // NDC spans / 2 are viewport fractions. Terrain is a conservative 26m-height box.
  for (const [name, state] of Object.entries(result.states)) {
    if (!name.endsWith('-overview')) continue;
    const [width, height] = name.split('-')[1].split('x').map(Number);
    const camera = new PerspectiveCamera(42, width / height, 0.5, 1800);
    camera.position.fromArray(state.camera);
    camera.lookAt(new Vector3().fromArray(state.target));
    camera.updateMatrixWorld();
    const project = (bounds) => {
      const points = [];
      for (const x of [bounds.min[0], bounds.max[0]])
        for (const y of [bounds.min[1], bounds.max[1]])
          for (const z of [bounds.min[2], bounds.max[2]])
            points.push(new Vector3(x, y, z).project(camera));
      return {
        widthFraction:
          (Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x))) /
          2,
        heightFraction:
          (Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y))) /
          2,
      };
    };
    const size = state.terrain.size;
    result.frameCoverage[name] = {
      terrain: project({
        min: [-size / 2, -15.6, -size / 2],
        max: [size / 2, 26, size / 2],
      }),
      tree: project(state.worldBounds.Tree_Landmark_Blockout),
    };
  }
  result.status = 'PASS';
} finally {
  await writeFile(
    `${output}/browser-qa.json`,
    JSON.stringify(
      result,
      (k, v) =>
        ['phase2', 'shorelineContacts', 'shorelineContactTypes', 'timings'].includes(k)
          ? undefined
          : v,
      2,
    ),
  );
  await b.close();
  server?.kill();
}
