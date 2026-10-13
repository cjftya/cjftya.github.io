import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const output =
  process.env.OASIS_QA_OUTPUT ??
  'artifacts/jelly-oasis/flower-meadow-final-composition-v1';
await mkdir(output, { recursive: true });
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '5181',
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
const result = { errors: [], expectedConsole: [] };
try {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    }),
    p = await context.newPage();
  p.on('pageerror', (e) => result.errors.push(String(e)));
  p.on('console', (m) => {
    if (m.type() === 'error') result.expectedConsole.push(m.text());
  });
  await p.route('**/*.glb', (route) =>
    route.fulfill({ status: 404, body: 'Missing asset test' }),
  );
  await p.goto('http://127.0.0.1:5181/projects/jelly-oasis/');
  await p.waitForFunction(
    () => document.getElementById('landmark-status')?.getAttribute('role') === 'alert',
  );
  result.statusText = await p.locator('#landmark-status').textContent();
  assert(result.statusText.includes('불러오지 못'));
  assert(result.expectedConsole.some((s) => s.includes('landmark load failed')));
  assert.deepEqual(result.errors, []);
  await p.evaluate(() =>
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })),
  );
  await context.close();
  result.status = 'PASS';
} finally {
  await writeFile(`${output}/failure-qa.json`, JSON.stringify(result, null, 2));
  await browser.close();
  server.kill();
}
console.log(result.status);
