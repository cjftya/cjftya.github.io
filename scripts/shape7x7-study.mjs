import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

// No dependencies added: Vite loads the same TypeScript engine used in Web Workers.
const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const output = resolve(argument('--output', 'docs/research/shape-core-v1-study.json'));
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});
try {
  const { parseDrawCsv } = await server.ssrLoadModule('/src/uriel/data.ts');
  const { runShapeNullStudy, DEFAULT_SHAPE_STUDY } = await server.ssrLoadModule(
    '/src/uriel/analysis/v3/shape7x7/study.ts',
  );
  const source = await readFile('public/projects/uriel/data/draws.csv', 'utf8');
  const draws = parseDrawCsv(source);
  const config = {
    ...DEFAULT_SHAPE_STUDY,
    nullHistories: Number(argument('--histories', DEFAULT_SHAPE_STUDY.nullHistories)),
    rounds: Number(argument('--rounds', DEFAULT_SHAPE_STUDY.rounds)),
    sampleSize: Number(argument('--samples', DEFAULT_SHAPE_STUDY.sampleSize)),
    seed: Number(argument('--seed', DEFAULT_SHAPE_STUDY.seed)),
    nullKind: argument('--null-kind', 'synthetic'),
    shape: {
      ...DEFAULT_SHAPE_STUDY.shape,
      trainingWindow: Number(argument('--training-window', 120)),
    },
  };
  console.log(JSON.stringify({ event: 'study-start', dataAsOf: draws.at(-1), config }));
  const result = runShapeNullStudy(draws, config, (completed, total) => {
    if (completed % 25 === 0 || completed === total)
      console.log(JSON.stringify({ event: 'null-progress', completed, total }));
  });
  result.gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  result.gitDirty =
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length >
    0;
  result.dataSha256 = createHash('sha256').update(source).digest('hex');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      event: 'complete',
      output,
      signal: result.signal,
      endpoints: result.endpoints,
      portfolios: result.portfolios,
    }),
  );
} finally {
  await server.close();
}
