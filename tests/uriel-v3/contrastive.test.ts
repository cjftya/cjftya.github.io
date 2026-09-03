import { describe, expect, it } from 'vitest';
import { analyzeRepresentation } from '../../src/uriel/analysis/v3/contrastive';
import { distanceRepresentation } from '../../src/uriel/analysis/v3/representations';
import {
  benjaminiHochberg,
  bootstrapMeanDifferenceInterval,
  effectSize,
  jensenShannonDivergence,
  ksStatistic,
  permutationTestPValue,
  wassersteinDistance,
} from '../../src/uriel/analysis/v3/statistics';
import { sanitizeResearchConfig } from '../../src/uriel/analysis/v3/types';
import type { LottoDraw } from '../../src/uriel/types';

const biasedHistory = (holdoutCombination: readonly number[] = [1, 2, 3, 4, 5, 6]) =>
  Array.from({ length: 100 }, (_, index): LottoDraw => ({
    round: index + 1,
    date: '',
    numbers: index < 80 ? [1, 2, 3, 4, 5, 6] : holdoutCombination,
  }));
const quickConfig = sanitizeResearchConfig({
  seed: 77,
  sampleSize: 1_000,
  nullSampleSize: 1_000,
  bootstrapIterations: 30,
  permutationIterations: 99,
});

describe('Uriel v3 statistics', () => {
  it('returns zero distances for identical distributions', () => {
    const values = [1, 2, 3, 4, 5];
    expect(effectSize(values, values)).toBe(0);
    expect(ksStatistic(values, values)).toBe(0);
    expect(wassersteinDistance(values, values)).toBe(0);
    expect(jensenShannonDivergence(values, values)).toBeCloseTo(0);
  });

  it('detects a stable shifted distribution with reproducible resampling', () => {
    const left = Array.from({ length: 40 }, (_, index) => index + 100);
    const right = Array.from({ length: 80 }, (_, index) => index);
    expect(effectSize(left, right)).toBeGreaterThan(2);
    expect(ksStatistic(left, right)).toBeGreaterThan(0.5);
    const pValue = permutationTestPValue(left, right, 199, 1);
    expect(pValue).toBeLessThanOrEqual(0.01);
    expect(permutationTestPValue(left, right, 199, 1)).toBe(pValue);
    const interval = bootstrapMeanDifferenceInterval(left, right, 100, 2);
    expect(interval[0]).toBeGreaterThan(0);
  });

  it('controls multiple comparisons with Benjamini-Hochberg correction', () => {
    const adjusted = benjaminiHochberg([0.001, 0.01, 0.04, 0.5]);
    expect(adjusted[0]).toBeCloseTo(0.004);
    expect(adjusted[1]).toBeCloseTo(0.02);
    expect(adjusted[2]).toBeCloseTo(0.0533333333);
    expect(adjusted[3]).toBe(0.5);
  });
});

describe('Uriel v3 contrastive analysis', () => {
  it('selects only discovery signals that persist in validation', () => {
    const analysis = analyzeRepresentation(
      biasedHistory(),
      distanceRepresentation,
      quickConfig,
    );
    expect(analysis.diagnostics.partitions).toEqual({
      discovery: 60,
      validation: 20,
      holdout: 20,
    });
    expect(analysis.diagnostics.randomSamples).toBe(1_000);
    expect(analysis.diagnostics.selectedFeatureCount).toBeGreaterThan(0);
    expect(analysis.selectedProfiles.every(({ weight }) => weight > 0)).toBe(true);
    expect(
      analysis.diagnostics.features
        .filter(({ selected }) => selected)
        .every(({ adjustedPValue, temporalStability }) =>
          adjustedPValue <= 0.05 && temporalStability >= 2 / 3,
        ),
    ).toBe(true);
  });

  it('never uses final holdout values to select or fit a profile', () => {
    const first = analyzeRepresentation(
      biasedHistory([1, 2, 3, 4, 5, 6]),
      distanceRepresentation,
      quickConfig,
    );
    const changedHoldout = analyzeRepresentation(
      biasedHistory([10, 17, 24, 31, 38, 45]),
      distanceRepresentation,
      quickConfig,
    );
    expect(changedHoldout.selectedProfiles).toEqual(first.selectedProfiles);
    expect(
      changedHoldout.diagnostics.features.map(({ name, selected }) => ({
        name,
        selected,
      })),
    ).toEqual(
      first.diagnostics.features.map(({ name, selected }) => ({ name, selected })),
    );
    expect(
      changedHoldout.diagnostics.features.some(
        (feature, index) =>
          feature.holdoutEffectSize !==
          first.diagnostics.features[index]!.holdoutEffectSize,
      ),
    ).toBe(true);
  });
});
