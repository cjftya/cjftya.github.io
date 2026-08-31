import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { findBaselineCandidates } from '../src/uriel/analysis/candidates';
import { runAlgorithm } from '../src/uriel/analysis/algorithmRunner';
import { createPredictionSession } from '../src/uriel/analysis/predictionSession';
import {
  buildAlgorithmPurchasePortfolio,
  buildPurchasePortfolio,
} from '../src/uriel/analysis/purchase';
import { parseDrawCsv } from '../src/uriel/data';

const digest = (value: unknown) =>
  createHash('sha256')
    .update(
      JSON.stringify(value, (_, item) =>
        typeof item === 'number' ? Number(item.toFixed(10)) : item,
      ),
    )
    .digest('hex');

it('preserves the retained baseline predictions and purchases', async () => {
  const draws = parseDrawCsv(
    await readFile(
      new URL('../public/projects/uriel/data/draws.csv', import.meta.url),
      'utf8',
    ),
  ).slice(0, 1239);
  const expected: Record<string, string> = JSON.parse(
    await readFile(
      new URL('./fixtures/uriel-prediction-baseline.json', import.meta.url),
      'utf8',
    ),
  );
  const analyze = createPredictionSession(draws);

  for (const index of [0, 1234, 1238]) {
    for (const layout of ['circle', 'board'] as const) {
      const result = findBaselineCandidates(draws, index, layout, 100);
      expect(
        digest({ candidates: result.candidates, target: result.target }),
        `${index}:${layout}:prediction`,
      ).toBe(expected[`${index}:${layout}:prediction`]);
      expect(digest(buildPurchasePortfolio(result.candidates, layout))).toBe(
        expected[`${index}:${layout}:purchase`],
      );

      const request = { index, layout, algorithmId: 'baseline' as const };
      const snapshot = analyze(request);
      expect(snapshot.candidateResult).toEqual({ ...result, layout });
      expect(snapshot.purchaseResearchCandidates).toBe(
        snapshot.candidateResult.candidates,
      );
      expect(analyze(request)).toBe(snapshot);
    }
  }

  for (const index of [0, 1234, 1238]) {
    const result = runAlgorithm('transition-tail', draws, index, 'circle', 100);
    const purchase = buildAlgorithmPurchasePortfolio(
      'transition-tail',
      result.candidates,
      result.layout,
    );
    expect(digest(purchase), `${index}:tail`).toBe(expected[`${index}:tail`]);

    const snapshot = analyze({
      index,
      layout: 'circle',
      algorithmId: 'transition-tail',
    });
    expect(snapshot.candidateResult).toEqual(result);
    expect(snapshot.candidateResult.layout).toBe('board');
  }

  const request = {
    index: 1234,
    layout: 'circle' as const,
    algorithmId: 'baseline' as const,
  };
  expect(createPredictionSession(draws.slice(0, 1235))(request)).toEqual(
    analyze(request),
  );
  expect(() => analyze({ ...request, index: draws.length })).toThrow(
    '분석할 회차가 없어요.',
  );
}, 60_000);
