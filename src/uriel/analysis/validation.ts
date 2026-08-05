import type {
  Candidate,
  LayoutMode,
  LottoDraw,
  NumberPatterns,
  ShapeMetrics,
} from '../types';
import { metricsForDraw } from './geometry';

export const similarityFactors = [
  { key: 'centroidX', label: '중심 X' },
  { key: 'centroidY', label: '중심 Y' },
  { key: 'area', label: '면적' },
  { key: 'perimeter', label: '둘레' },
  { key: 'compactness', label: '조밀도' },
  { key: 'spread', label: '퍼짐' },
  { key: 'orientation', label: '방향' },
] as const satisfies readonly { key: keyof ShapeMetrics; label: string }[];

export type SimilarityFactor = (typeof similarityFactors)[number]['key'];

export interface CandidateEvaluation extends Candidate {
  rank: number;
  matchedNumbers: readonly number[];
  shapeSimilarity: number;
  factorSimilarities: Record<SimilarityFactor, number>;
  patterns: NumberPatterns;
}

export interface MatchDistributionRow {
  label: string;
  observed: number;
  expected: number;
}

export interface CandidateValidation {
  actual: LottoDraw;
  actualPatterns: NumberPatterns;
  evaluations: CandidateEvaluation[];
  bestByNumbers: CandidateEvaluation;
  bestByShape: CandidateEvaluation;
  matchDistribution: MatchDistributionRow[];
}

const factorScales: Record<SimilarityFactor, number> = {
  centroidX: 0.55,
  centroidY: 0.55,
  area: 0.75,
  perimeter: 2.2,
  compactness: 0.28,
  spread: 0.35,
  orientation: 90,
};

const factorWeights: Record<SimilarityFactor, number> = {
  centroidX: 1,
  centroidY: 1,
  area: 1,
  perimeter: 0.7,
  compactness: 1,
  spread: 1,
  orientation: 0.35,
};

export function evaluateCandidates(
  candidates: readonly Candidate[],
  actual: LottoDraw,
  layout: LayoutMode,
): CandidateValidation {
  if (candidates.length === 0) {
    throw new Error('검증할 후보가 없어요.');
  }

  const actualMetrics = metricsForDraw(actual, layout);
  const actualPatterns = patternsForNumbers(actual.numbers);
  const actualNumbers = new Set(actual.numbers);
  const evaluations = candidates.map((candidate, candidateIndex) => {
    const matchedNumbers = candidate.numbers.filter((number) =>
      actualNumbers.has(number),
    );
    return {
      ...candidate,
      rank: candidateIndex + 1,
      matchedNumbers,
      shapeSimilarity: shapeSimilarity(candidate.metrics, actualMetrics),
      factorSimilarities: factorSimilarities(candidate.metrics, actualMetrics),
      patterns: patternsForNumbers(candidate.numbers),
    };
  });

  const bestByNumbers = [...evaluations].sort(
    (left, right) =>
      right.matchedNumbers.length - left.matchedNumbers.length ||
      right.shapeSimilarity - left.shapeSimilarity ||
      left.rank - right.rank,
  )[0]!;
  const bestByShape = [...evaluations].sort(
    (left, right) =>
      right.shapeSimilarity - left.shapeSimilarity || left.rank - right.rank,
  )[0]!;

  return {
    actual,
    actualPatterns,
    evaluations,
    bestByNumbers,
    bestByShape,
    matchDistribution: buildMatchDistribution(evaluations),
  };
}

export function patternsForNumbers(numbers: readonly number[]): NumberPatterns {
  const sorted = [...numbers].sort((left, right) => left - right);
  const gaps = sorted.slice(1).map((number, index) => number - sorted[index]!);
  return {
    oddCount: sorted.filter((number) => number % 2 !== 0).length,
    lowCount: sorted.filter((number) => number <= 22).length,
    sum: sorted.reduce((sum, number) => sum + number, 0),
    consecutivePairs: gaps.filter((gap) => gap === 1).length,
    averageGap: gaps.reduce((sum, gap) => sum + gap, 0) / Math.max(gaps.length, 1),
  };
}

export function describePatternComparison(
  candidate: NumberPatterns,
  actual: NumberPatterns,
): string {
  const same: string[] = [];
  if (candidate.oddCount === actual.oddCount) same.push('홀짝 구성');
  if (candidate.lowCount === actual.lowCount) same.push('저·고 구간');
  if (candidate.consecutivePairs === actual.consecutivePairs) same.push('연속쌍 수');

  const prefix = same.length > 0 ? `${same.join('·')}이 같고, ` : '';
  return `${prefix}합계는 ${Math.abs(candidate.sum - actual.sum)} 차이, 평균 간격은 ${Math.abs(candidate.averageGap - actual.averageGap).toFixed(1)} 차이예요.`;
}

export function shapeSimilarity(candidate: ShapeMetrics, actual: ShapeMetrics): number {
  const differences = normalizedDifferences(candidate, actual);
  const weightTotal = similarityFactors.reduce(
    (sum, factor) => sum + factorWeights[factor.key],
    0,
  );
  const squaredDistance = similarityFactors.reduce((sum, factor) => {
    const difference = differences[factor.key];
    return sum + difference ** 2 * factorWeights[factor.key];
  }, 0);
  return 100 * Math.exp(-0.5 * (squaredDistance / weightTotal));
}

function factorSimilarities(
  candidate: ShapeMetrics,
  actual: ShapeMetrics,
): Record<SimilarityFactor, number> {
  const differences = normalizedDifferences(candidate, actual);
  return Object.fromEntries(
    similarityFactors.map((factor) => [
      factor.key,
      100 * Math.exp(-0.5 * differences[factor.key] ** 2),
    ]),
  ) as Record<SimilarityFactor, number>;
}

function normalizedDifferences(
  candidate: ShapeMetrics,
  actual: ShapeMetrics,
): Record<SimilarityFactor, number> {
  return {
    centroidX:
      Math.abs(candidate.centroidX - actual.centroidX) / factorScales.centroidX,
    centroidY:
      Math.abs(candidate.centroidY - actual.centroidY) / factorScales.centroidY,
    area: Math.abs(candidate.area - actual.area) / factorScales.area,
    perimeter:
      Math.abs(candidate.perimeter - actual.perimeter) / factorScales.perimeter,
    compactness:
      Math.abs(candidate.compactness - actual.compactness) / factorScales.compactness,
    spread: Math.abs(candidate.spread - actual.spread) / factorScales.spread,
    orientation:
      Math.abs(shortestAngle(candidate.orientation - actual.orientation)) /
      factorScales.orientation,
  };
}

function buildMatchDistribution(
  evaluations: readonly CandidateEvaluation[],
): MatchDistributionRow[] {
  const groups = [
    { label: '0개', minimum: 0, maximum: 0 },
    { label: '1개', minimum: 1, maximum: 1 },
    { label: '2개', minimum: 2, maximum: 2 },
    { label: '3개+', minimum: 3, maximum: 6 },
  ];

  return groups.map((group) => ({
    label: group.label,
    observed: evaluations.filter(({ matchedNumbers }) => {
      const count = matchedNumbers.length;
      return count >= group.minimum && count <= group.maximum;
    }).length,
    expected:
      evaluations.length *
      range(group.minimum, group.maximum).reduce(
        (sum, matchCount) => sum + randomMatchProbability(matchCount),
        0,
      ),
  }));
}

function randomMatchProbability(matchCount: number): number {
  return (
    (combination(6, matchCount) * combination(39, 6 - matchCount)) / combination(45, 6)
  );
}

function combination(total: number, selected: number): number {
  if (selected < 0 || selected > total) return 0;
  const count = Math.min(selected, total - selected);
  let value = 1;
  for (let index = 1; index <= count; index += 1) {
    value = (value * (total - count + index)) / index;
  }
  return value;
}

function range(minimum: number, maximum: number): number[] {
  return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
}

function shortestAngle(angle: number): number {
  let value = angle;
  while (value > 90) value -= 180;
  while (value < -90) value += 180;
  return value;
}
