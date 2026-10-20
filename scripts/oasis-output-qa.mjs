import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

const server = await createServer({
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'three',
      'three/addons/postprocessing/ShaderPass.js',
      'three/addons/postprocessing/OutputPass.js',
    ],
  },
  server: { host: '127.0.0.1', port: 5182, strictPort: true, hmr: false },
});
server.middlewares.use('/__output_qa', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><title>Output shader QA</title>');
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.OASIS_QA_BROWSER,
  headless: true,
  args: [
    '--no-sandbox',
    ...(process.env.OASIS_QA_SOFTWARE === '1'
      ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : []),
  ],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('http://127.0.0.1:5182/__output_qa');
  await page.evaluate(async () => {
    const { verifyOutput } = await import('/scripts/oasis-output-harness.js');
    await verifyOutput(32, 32);
  });
  const results = [];
  for (const size of [
    [1440, 900],
    [390, 844],
  ]) {
    const result = await page.evaluate(async ([w, h]) => {
      const { verifyOutput } = await import('/scripts/oasis-output-harness.js');
      return verifyOutput(w, h);
    }, size);
    for (const comparison of result.comparisons) {
      assert.ok(comparison.maxChannelDelta <= 2);
      assert.ok(comparison.meanChannelDelta < 0.1);
    }
    results.push(result);
    console.log(JSON.stringify(result));
  }
  assert.deepEqual(errors, []);
  await writeFile(
    process.env.OASIS_OUTPUT_QA_RESULT ?? '/tmp/oasis-output-qa.json',
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
  await server.close();
}
