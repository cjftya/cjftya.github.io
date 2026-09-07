import type { CandidateAlgorithm } from '../types';
import { generateShapeGames } from './candidates';
import { buildShapeHistory, forecastDistance, forecastShape } from './predictor';
import { resolveShapeConfig, SHAPE_VERSION } from './config';
import { shapeSignature, SHAPE_FEATURE_NAMES } from './signature';
import { runShapeBacktest } from './backtest';

export const shape7x7Algorithm: CandidateAlgorithm = {
  id: 'shape-7x7',
  backtest: runShapeBacktest,
  fit(history, config) {
    const shapeConfig = resolveShapeConfig(config.shape);
    const forecast = forecastShape(
      buildShapeHistory(history, shapeConfig.metric),
      shapeConfig,
    );
    return {
      id: 'shape-7x7',
      diagnostics: {
        features: [],
        selectedFeatureCount: 0,
        partitions: { discovery: forecast.trainingSamples, validation: 0, holdout: 0 },
        winningSamples: forecast.trainingSamples,
        randomSamples: 0,
        experimental: {
          version: SHAPE_VERSION,
          status: 'unvalidated',
          featureCount: SHAPE_FEATURE_NAMES.length,
          forecast,
        },
      },
      scoreCombination(numbers) {
        return Math.exp(
          -0.5 *
            forecastDistance(shapeSignature(numbers, shapeConfig.metric), forecast),
        );
      },
      generateGames(settings, seed) {
        return generateShapeGames(
          forecast,
          settings.sampleSize,
          seed,
          settings.topFraction,
        );
      },
    };
  },
};
