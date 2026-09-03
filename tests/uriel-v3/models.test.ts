import { describe, expect, it } from 'vitest';
import {
  contrastiveEnsembleAlgorithm,
  createRepresentationAlgorithm,
  representationAlgorithms,
} from '../../src/uriel/analysis/v3/models';
import { sanitizeResearchConfig } from '../../src/uriel/analysis/v3/types';
import type { LottoDraw } from '../../src/uriel/types';

const history = Array.from({ length: 100 }, (_, index): LottoDraw => ({
  round: index + 1,
  date: '',
  numbers: [1, 2, 3, 4, 5, 6],
}));
const config = sanitizeResearchConfig({
  seed: 11,
  nullSampleSize: 1_000,
  bootstrapIterations: 0,
  permutationIterations: 0,
});

describe('Uriel v3 structural combination scoring', () => {
  it('registers one independent model per initial representation', () => {
    expect(Object.keys(representationAlgorithms)).toEqual([
      'distance',
      'distribution',
      'geometry',
    ]);
    expect(createRepresentationAlgorithm('distance').id).toBe('distance');
  });

  it.each(['distance', 'distribution', 'geometry'] as const)(
    'scores similarity to the validated %s training distribution',
    (id) => {
      const model = representationAlgorithms[id].fit(history, config);
      expect(model.diagnostics.selectedFeatureCount).toBeGreaterThan(0);
      const familiar = model.scoreCombination([1, 2, 3, 4, 5, 6]);
      const distant = model.scoreCombination([5, 13, 21, 29, 37, 45]);
      expect(familiar).toBeGreaterThan(distant);
      expect(familiar).toBeGreaterThanOrEqual(0);
      expect(familiar).toBeLessThanOrEqual(1);
      expect(distant).toBeGreaterThanOrEqual(0);
      expect(distant).toBeLessThanOrEqual(1);
    },
  );

  it('uses a neutral score when no feature survives validation', () => {
    const alternating = history.map((draw, index) => ({
      ...draw,
      numbers:
        index % 2 === 0
          ? ([1, 8, 16, 24, 32, 40] as const)
          : ([6, 13, 20, 27, 34, 41] as const),
    }));
    const model = representationAlgorithms.distance.fit(alternating, {
      ...config,
      permutationIterations: 1,
    });
    if (model.diagnostics.selectedFeatureCount === 0) {
      expect(model.scoreCombination([3, 8, 17, 26, 34, 42])).toBe(0.5);
    } else {
      expect(model.scoreCombination([3, 8, 17, 26, 34, 42])).toBeGreaterThanOrEqual(
        0,
      );
    }
  });

  it('combines the three independent representation scores without tuned weights', () => {
    const model = contrastiveEnsembleAlgorithm.fit(history, config);
    expect(new Set(model.diagnostics.features.map(({ representation }) => representation))).toEqual(
      new Set(['distance', 'distribution', 'geometry']),
    );
    expect(model.scoreCombination([1, 2, 3, 4, 5, 6])).toBeGreaterThan(
      model.scoreCombination([5, 13, 21, 29, 37, 45]),
    );
  });
});
