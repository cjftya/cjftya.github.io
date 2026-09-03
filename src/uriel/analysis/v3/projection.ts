import { createRandom, sampleCombination } from './random';
import type {
  CandidateSet,
  FittedCombinationModel,
  NumberCandidateScore,
  ResearchConfig,
} from './types';
import { CANDIDATE_SIZES } from './types';

const SCORE_BINS = 2_048;

export interface ProjectionResult {
  candidateSets: readonly CandidateSet[];
  numberScores: readonly NumberCandidateScore[];
  retainedCombinations: number;
}

export function projectCandidateScores(
  model: FittedCombinationModel,
  config: ResearchConfig,
  projectionSeed: number,
): ProjectionResult {
  const target = Math.max(1, Math.floor(config.sampleSize * config.topFraction));
  const histogram = Array(SCORE_BINS).fill(0) as number[];
  visitSamples(config.sampleSize, projectionSeed, model, (_numbers, score) => {
    const bin = scoreBin(score);
    histogram[bin] = histogram[bin]! + 1;
  });
  const { thresholdBin, acceptedInThreshold } = thresholdForTopCount(histogram, target);
  const weightedInclusion = Array(46).fill(0) as number[];
  const inclusionCount = Array(46).fill(0) as number[];
  let totalWeight = 0;
  let retained = 0;
  let acceptedAtThreshold = 0;
  visitSamples(config.sampleSize, projectionSeed, model, (numbers, score) => {
    const bin = scoreBin(score);
    const include =
      bin > thresholdBin ||
      (bin === thresholdBin && acceptedAtThreshold < acceptedInThreshold);
    if (!include) return;
    if (bin === thresholdBin) acceptedAtThreshold += 1;
    const weight = Math.max(score, 0) + 1e-6;
    retained += 1;
    totalWeight += weight;
    numbers.forEach((number) => {
      weightedInclusion[number] = weightedInclusion[number]! + weight;
      inclusionCount[number] = inclusionCount[number]! + 1;
    });
  });
  const rawScores = Array.from({ length: 45 }, (_, index) =>
    totalWeight === 0 ? 0 : weightedInclusion[index + 1]! / totalWeight,
  );
  const minimum = Math.min(...rawScores);
  const maximum = Math.max(...rawScores);
  const spread = maximum - minimum;
  const numberScores = rawScores.map((rawScore, index): NumberCandidateScore => ({
    number: index + 1,
    rawScore,
    normalizedScore: spread < 1e-12 ? 50 : ((rawScore - minimum) / spread) * 100,
    inclusionRate: inclusionCount[index + 1]! / Math.max(retained, 1),
  }));
  const ranking = [...numberScores].sort(
    (left, right) => right.rawScore - left.rawScore || left.number - right.number,
  );
  const candidateSets = CANDIDATE_SIZES.map((size): CandidateSet => ({
    size,
    numbers: ranking
      .slice(0, size)
      .map(({ number }) => number)
      .sort((left, right) => left - right),
  }));
  return { candidateSets, numberScores, retainedCombinations: retained };
}

function visitSamples(
  sampleSize: number,
  seed: number,
  model: FittedCombinationModel,
  visit: (numbers: readonly number[], score: number) => void,
): void {
  const random = createRandom(seed);
  for (let index = 0; index < sampleSize; index += 1) {
    const numbers = sampleCombination(random);
    const score = Math.min(Math.max(model.scoreCombination(numbers), 0), 1);
    visit(numbers, score);
  }
}

function scoreBin(score: number): number {
  return Math.min(Math.floor(score * SCORE_BINS), SCORE_BINS - 1);
}

function thresholdForTopCount(
  histogram: readonly number[],
  target: number,
): { thresholdBin: number; acceptedInThreshold: number } {
  let above = 0;
  for (let bin = histogram.length - 1; bin >= 0; bin -= 1) {
    const count = histogram[bin]!;
    if (above + count >= target) {
      return { thresholdBin: bin, acceptedInThreshold: target - above };
    }
    above += count;
  }
  return { thresholdBin: 0, acceptedInThreshold: histogram[0] ?? 0 };
}
