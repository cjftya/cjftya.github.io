import type { LottoDraw } from '../../types';
import { analyzeRepresentation } from './contrastive';
import type { CombinationRepresentation } from './representations';
import { representations } from './representations';
import type {
  CandidateAlgorithm,
  FittedCombinationModel,
  ResearchAlgorithmId,
  ResearchConfig,
  RepresentationId,
} from './types';

type RepresentationAlgorithmId = Exclude<
  ResearchAlgorithmId,
  'random-baseline' | 'contrastive-ensemble'
>;

export function createRepresentationAlgorithm(
  id: RepresentationAlgorithmId,
): CandidateAlgorithm {
  const representation = representations[id];
  return {
    id,
    fit(history, config) {
      return fitRepresentationModel(id, history, representation, config);
    },
  };
}

export const representationAlgorithms: Record<
  RepresentationAlgorithmId,
  CandidateAlgorithm
> = {
  distance: createRepresentationAlgorithm('distance'),
  distribution: createRepresentationAlgorithm('distribution'),
  geometry: createRepresentationAlgorithm('geometry'),
};

export const contrastiveEnsembleAlgorithm: CandidateAlgorithm = {
  id: 'contrastive-ensemble',
  fit(history, config) {
    const models = Object.values(representationAlgorithms).map((algorithm) =>
      algorithm.fit(history, config),
    );
    return {
      id: 'contrastive-ensemble',
      diagnostics: {
        features: models
          .flatMap(({ diagnostics }) => diagnostics.features)
          .sort((left, right) => Math.abs(right.effectSize) - Math.abs(left.effectSize)),
        selectedFeatureCount: models.reduce(
          (total, { diagnostics }) => total + diagnostics.selectedFeatureCount,
          0,
        ),
        partitions: models[0]!.diagnostics.partitions,
        winningSamples: history.length,
        randomSamples: config.nullSampleSize,
      },
      scoreCombination(numbers) {
        return (
          models.reduce(
            (total, model) => total + model.scoreCombination(numbers),
            0,
          ) / models.length
        );
      },
    };
  },
};

export function fitRepresentationModel(
  id: RepresentationAlgorithmId,
  history: readonly LottoDraw[],
  representation: CombinationRepresentation,
  config: ResearchConfig,
): FittedCombinationModel {
  const analysis = analyzeRepresentation(history, representation, config);
  const nameToIndex = new Map<string, number>();
  if (analysis.selectedProfiles.length > 0) {
    representation
      .extract(history[0]!.numbers, config.coordinateSystem)
      .names.forEach((name, index) => nameToIndex.set(name, index));
  }
  return {
    id,
    diagnostics: analysis.diagnostics,
    scoreCombination(numbers) {
      if (analysis.selectedProfiles.length === 0) return 0.5;
      const vector = representation.extract(numbers, config.coordinateSystem);
      let weightedScore = 0;
      let totalWeight = 0;
      analysis.selectedProfiles.forEach((profile) => {
        const index = nameToIndex.get(profile.name);
        if (index === undefined) return;
        const zScore = Math.min(
          Math.abs(
            (vector.values[index]! - profile.winningMean) /
              profile.winningStandardDeviation,
          ),
          8,
        );
        const similarity = Math.exp(-0.5 * zScore ** 2);
        weightedScore += similarity * profile.weight;
        totalWeight += profile.weight;
      });
      return totalWeight === 0 ? 0.5 : weightedScore / totalWeight;
    },
  };
}

export function representationIdForAlgorithm(
  id: RepresentationAlgorithmId,
): RepresentationId {
  return id;
}
