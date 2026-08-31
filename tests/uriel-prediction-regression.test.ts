import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { findShapeCandidates } from '../src/uriel/analysis/candidates';
import { buildCombinationAnalysis } from '../src/uriel/analysis/combination';
import {
  buildPurchasePortfolio,
  buildTailCoveragePortfolio,
} from '../src/uriel/analysis/purchase';
import { createPredictionSession } from '../src/uriel/analysis/predictionSession';
import { forecastBoardShapeTransitions } from '../src/uriel/analysis/shapeTransition';
import { parseDrawCsv } from '../src/uriel/data';

const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

it('preserves the pre-cleanup rankings, scores and portfolios in both layouts', async () => {
  // Recorded from master at 280f643 before optimizing. Fix the dataset boundary so
  // weekly CSV updates cannot silently redefine the regression reference.
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
      for (const model of ['baseline', 'hybrid', 'shape-transition'] as const) {
        const key = `${index}:${layout}:${model}`;
        expect(digest(findShapeCandidates(draws, index, layout, 100, model)), key).toBe(
          expected[key],
        );
      }
    }
    const combination = buildCombinationAnalysis(draws, index, 15, false);
    expect(digest(combination)).toBe(expected[`${index}:combination`]);
    expect(
      digest(
        buildTailCoveragePortfolio(combination.researchByStrategy.transition, 'board'),
      ),
    ).toBe(expected[`${index}:tail`]);
    expect(
      digest(
        buildPurchasePortfolio(combination.researchByStrategy['full-hybrid'], 'board'),
      ),
    ).toBe(expected[`${index}:hybridPortfolio`]);

    // The worker computes only the selected strategy and reuses candidate work.
    // Its compact reply must still match the original full analysis exactly.
    for (const purchaseStrategy of [
      'baseline',
      'shape-transition',
      'full-hybrid',
    ] as const) {
      const request = {
        index,
        layout: 'board' as const,
        candidateModel: 'hybrid' as const,
        purchaseStrategy,
      };
      const result = analyze(request);
      expect(digest(result.candidateResult)).toBe(expected[`${index}:board:hybrid`]);
      expect(digest(result.purchaseResearchCandidates)).toBe(
        digest(
          purchaseStrategy === 'baseline'
            ? findShapeCandidates(draws, index, 'board', 100, 'baseline').candidates
            : combination.researchByStrategy[
                purchaseStrategy === 'shape-transition' ? 'transition' : 'full-hybrid'
              ],
        ),
      );
      expect(result.shapeForecast).toEqual(
        purchaseStrategy === 'shape-transition'
          ? forecastBoardShapeTransitions(draws, index)
          : null,
      );
      expect(analyze(request)).toBe(result);
    }
  }

  const request = {
    index: 1234,
    layout: 'circle' as const,
    candidateModel: 'shape-transition' as const,
    purchaseStrategy: 'baseline' as const,
  };
  const current = analyze(request);
  expect(digest(current.candidateResult)).toBe(expected['1234:board:shape-transition']);
  // A historical prediction must not depend on the future rows or a prior dataset's cache.
  expect(createPredictionSession(draws.slice(0, 1235))(request)).toEqual(current);
  expect(() => analyze({ ...request, index: draws.length })).toThrow(
    '분석할 회차가 없어요.',
  );
}, 180000);
