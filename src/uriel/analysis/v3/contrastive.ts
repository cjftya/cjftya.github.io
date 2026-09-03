import type { LottoDraw } from '../../types';
import { mixSeed, sampleCombinations } from './random';
import type { CombinationRepresentation } from './representations';
import {
  average,
  benjaminiHochberg,
  bootstrapMeanDifferenceInterval,
  effectSize,
  jensenShannonDivergence,
  ksStatistic,
  meanDifferencePValue,
  permutationTestPValue,
  populationVariance,
  wassersteinDistance,
} from './statistics';
import type {
  FeatureDiagnostic,
  ModelDiagnostics,
  ResearchConfig,
  RepresentationId,
} from './types';
import { partitionHistory } from './types';

const MINIMUM_DISCOVERY_EFFECT = 0.12;
const MINIMUM_VALIDATION_EFFECT = 0.05;
const MAXIMUM_ADJUSTED_P_VALUE = 0.05;
const MINIMUM_TEMPORAL_STABILITY = 2 / 3;

export interface FeatureProfile {
  representation: RepresentationId;
  name: string;
  winningMean: number;
  winningStandardDeviation: number;
  weight: number;
}

export interface ContrastiveAnalysis {
  diagnostics: ModelDiagnostics;
  selectedProfiles: readonly FeatureProfile[];
}

interface PendingDiagnostic extends Omit<
  FeatureDiagnostic,
  'adjustedPValue' | 'selected'
> {
  discoveryValues: readonly number[];
  validationValues: readonly number[];
  selectionPValue: number;
}

export function analyzeRepresentation(
  history: readonly LottoDraw[],
  representation: CombinationRepresentation,
  config: ResearchConfig,
): ContrastiveAnalysis {
  const partitions = partitionHistory(history);
  const randomSeed = mixSeed(config.seed, representationSeed(representation.id));
  const randomCombinations = sampleCombinations(config.nullSampleSize, randomSeed);
  const discoveryMatrix = featureMatrix(
    partitions.discovery.map(({ numbers }) => numbers),
    representation,
    config,
  );
  const validationMatrix = featureMatrix(
    partitions.validation.map(({ numbers }) => numbers),
    representation,
    config,
  );
  const holdoutMatrix = featureMatrix(
    partitions.holdout.map(({ numbers }) => numbers),
    representation,
    config,
  );
  const randomMatrix = featureMatrix(randomCombinations, representation, config);
  const allDiscoverySegments = temporalSegments(discoveryMatrix.values);

  const pending: PendingDiagnostic[] = discoveryMatrix.names.map((name, index) => {
    const discoveryValues = column(discoveryMatrix.values, index);
    const validationValues = column(validationMatrix.values, index);
    const holdoutValues = column(holdoutMatrix.values, index);
    const randomValues = column(randomMatrix.values, index);
    const discoveryEffect = effectSize(discoveryValues, randomValues);
    const validationEffect = effectSize(validationValues, randomValues);
    const holdoutEffect = effectSize(holdoutValues, randomValues);
    const temporalEffects = allDiscoverySegments.map((segment) =>
      effectSize(column(segment, index), randomValues),
    );
    const temporalStability = signAgreement(temporalEffects, discoveryEffect);
    return {
      representation: representation.id,
      name,
      winningMean: average(discoveryValues),
      randomMean: average(randomValues),
      effectSize: discoveryEffect,
      validationEffectSize: validationEffect,
      holdoutEffectSize: holdoutEffect,
      ksStatistic: ksStatistic(discoveryValues, randomValues),
      wassersteinDistance: wassersteinDistance(discoveryValues, randomValues),
      jensenShannonDivergence: jensenShannonDivergence(discoveryValues, randomValues),
      permutationPValue: permutationTestPValue(
        discoveryValues,
        randomValues,
        config.permutationIterations,
        mixSeed(randomSeed, index, 1),
      ),
      selectionPValue: meanDifferencePValue(discoveryValues, randomValues),
      confidenceInterval: bootstrapMeanDifferenceInterval(
        discoveryValues,
        randomValues,
        config.bootstrapIterations,
        mixSeed(randomSeed, index, 2),
      ),
      temporalEffects,
      temporalStability,
      holdoutConfirmed:
        sameDirection(discoveryEffect, holdoutEffect) &&
        Math.abs(holdoutEffect) >= MINIMUM_VALIDATION_EFFECT,
      discoveryValues,
      validationValues,
    };
  });
  const adjusted = benjaminiHochberg(
    pending.map(({ selectionPValue }) => selectionPValue),
  );
  const features = pending.map((item, index): FeatureDiagnostic => {
    const selected =
      Math.abs(item.effectSize) >= MINIMUM_DISCOVERY_EFFECT &&
      Math.abs(item.validationEffectSize) >= MINIMUM_VALIDATION_EFFECT &&
      sameDirection(item.effectSize, item.validationEffectSize) &&
      item.temporalStability >= MINIMUM_TEMPORAL_STABILITY &&
      adjusted[index]! <= MAXIMUM_ADJUSTED_P_VALUE;
    return {
      representation: item.representation,
      name: item.name,
      winningMean: item.winningMean,
      randomMean: item.randomMean,
      effectSize: item.effectSize,
      validationEffectSize: item.validationEffectSize,
      holdoutEffectSize: item.holdoutEffectSize,
      ksStatistic: item.ksStatistic,
      wassersteinDistance: item.wassersteinDistance,
      jensenShannonDivergence: item.jensenShannonDivergence,
      permutationPValue: item.permutationPValue,
      adjustedPValue: adjusted[index]!,
      confidenceInterval: item.confidenceInterval,
      temporalEffects: item.temporalEffects,
      temporalStability: item.temporalStability,
      selected,
      holdoutConfirmed: item.holdoutConfirmed,
    };
  });
  const selectedProfiles = features
    .map((feature, index): FeatureProfile | null => {
      if (!feature.selected) return null;
      const training = [
        ...pending[index]!.discoveryValues,
        ...pending[index]!.validationValues,
      ];
      return {
        representation: representation.id,
        name: feature.name,
        winningMean: average(training),
        winningStandardDeviation: Math.max(
          Math.sqrt(populationVariance(training)),
          1e-9,
        ),
        weight: Math.abs(feature.effectSize) * feature.temporalStability,
      };
    })
    .filter((profile): profile is FeatureProfile => profile !== null);
  return {
    diagnostics: {
      features: features.sort(
        (left, right) => Math.abs(right.effectSize) - Math.abs(left.effectSize),
      ),
      selectedFeatureCount: selectedProfiles.length,
      partitions: {
        discovery: partitions.discovery.length,
        validation: partitions.validation.length,
        holdout: partitions.holdout.length,
      },
      winningSamples: history.length,
      randomSamples: randomCombinations.length,
    },
    selectedProfiles,
  };
}

interface FeatureMatrix {
  names: readonly string[];
  values: readonly (readonly number[])[];
}

function featureMatrix(
  combinations: readonly (readonly number[])[],
  representation: CombinationRepresentation,
  config: ResearchConfig,
): FeatureMatrix {
  let names: readonly string[] = [];
  const values = combinations.map((numbers) => {
    const vector = representation.extract(numbers, config.coordinateSystem);
    if (names.length === 0) names = vector.names;
    return vector.values;
  });
  return { names, values };
}

function column(matrix: readonly (readonly number[])[], index: number): number[] {
  return matrix.map((row) => row[index]!);
}

function temporalSegments(
  matrix: readonly (readonly number[])[],
): readonly (readonly (readonly number[])[])[] {
  const firstEnd = Math.max(1, Math.floor(matrix.length / 3));
  const secondEnd = Math.max(firstEnd + 1, Math.floor((matrix.length * 2) / 3));
  return [
    matrix.slice(0, firstEnd),
    matrix.slice(firstEnd, secondEnd),
    matrix.slice(secondEnd),
  ];
}

function signAgreement(values: readonly number[], reference: number): number {
  if (reference === 0) return 0;
  return (
    values.filter((value) => sameDirection(value, reference)).length / values.length
  );
}

function sameDirection(left: number, right: number): boolean {
  return left !== 0 && right !== 0 && Math.sign(left) === Math.sign(right);
}

function representationSeed(id: RepresentationId): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
