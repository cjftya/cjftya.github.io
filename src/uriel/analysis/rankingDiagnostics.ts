import {
  combinationFeatureKeys,
  combinationScoreFor,
  scoreContributionFor,
} from './combination';
import type {
  CombinationFeatureVector,
  CombinationScoreContribution,
  CombinationStrategy,
  CombinationVector,
} from './combination';

export interface NumericDistribution {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  standardDeviation: number;
  p5: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface HitGroupRankingDistribution {
  score: NumericDistribution;
  rank: NumericDistribution;
  top10Rate: number;
  top100Rate: number;
  top500Rate: number;
  top1000Rate: number;
}

export type DiagnosticFeatureGroup = 'ordinary' | 'threeHit' | 'fourHit' | 'fiveHit';

export type DerivedFeatureName =
  | 'pair×triple'
  | 'pair×shape'
  | 'pair×transition'
  | 'triple×shape'
  | 'triple×transition'
  | 'shape×transition';

export type DiagnosticFeatureName = keyof CombinationFeatureVector | DerivedFeatureName;

export type ContributionName = keyof CombinationScoreContribution;

export interface FeatureCorrelation {
  left: keyof CombinationFeatureVector;
  right: keyof CombinationFeatureVector;
  correlation: number;
}

export interface OpportunityRankDiagnostic {
  rank: number;
  scorePercentile: number;
  numbers: readonly number[];
  featureContribution: CombinationScoreContribution;
}

export interface StrategyOpportunityDiagnostic {
  bestFourBefore: OpportunityRankDiagnostic | null;
  bestFourAfter: OpportunityRankDiagnostic | null;
  bestFiveBefore: OpportunityRankDiagnostic | null;
  bestFiveAfter: OpportunityRankDiagnostic | null;
}

export interface RankingOpportunityDiagnostic {
  round: number;
  candidateRecall: number;
  strategies: Partial<Record<CombinationStrategy, StrategyOpportunityDiagnostic>>;
}

export interface RankingDiagnostics {
  method: 'baseline';
  analyzedRounds: number;
  ordinarySampleStride: number;
  hitGroupDistributions: Partial<
    Record<CombinationStrategy, Record<string, HitGroupRankingDistribution>>
  >;
  featureDistributions: Partial<
    Record<DiagnosticFeatureGroup, Record<string, NumericDistribution>>
  >;
  featureContributionDistributions: Partial<
    Record<
      CombinationStrategy,
      Partial<Record<DiagnosticFeatureGroup, Record<string, NumericDistribution>>>
    >
  >;
  featureScales: Record<string, NumericDistribution>;
  featureCorrelations: readonly FeatureCorrelation[];
  fourHitOpportunities: readonly RankingOpportunityDiagnostic[];
  fiveHitOpportunities: readonly RankingOpportunityDiagnostic[];
}

const ORDINARY_SAMPLE_STRIDE = 97;
const SCORE_BINS = 1000;
const RANK_BINS = 1000;
const contributionNames: readonly ContributionName[] = [
  'numberScore',
  'pairScore',
  'tripleScore',
  'shapeScore',
  'transitionScore',
  'balanceScore',
  'diversityScore',
  'ensembleScore',
  'finalScore',
];
const derivedFeatureNames: readonly DerivedFeatureName[] = [
  'pair×triple',
  'pair×shape',
  'pair×transition',
  'triple×shape',
  'triple×transition',
  'shape×transition',
];

interface RankCounters {
  total: number;
  top10: number;
  top100: number;
  top500: number;
  top1000: number;
}

interface StrategyHitCollectors {
  scores: DistributionAccumulator;
  ranks: DistributionAccumulator;
  counters: RankCounters;
}

export class RankingDiagnosticsCollector {
  private readonly hitGroups = new Map<string, StrategyHitCollectors>();
  private readonly featureGroups = new Map<string, DistributionAccumulator>();
  private readonly contributionGroups = new Map<string, DistributionAccumulator>();
  private readonly featureScales = new Map<string, DistributionAccumulator>();
  private readonly correlations = new CorrelationAccumulator();
  private readonly opportunities: RankingOpportunityDiagnostic[] = [];
  private analyzedRounds = 0;
  private combinationCount = 1;

  constructor(private readonly strategies: readonly CombinationStrategy[]) {}

  addRound(
    round: number,
    candidateRecall: number,
    generated: readonly CombinationVector[],
    actual: readonly number[],
  ): void {
    if (candidateRecall < 4 || generated.length === 0) return;
    this.combinationCount = generated.length;
    this.analyzedRounds += 1;
    const baselineFeatures = generated.map(({ features }) => features);
    const activeFeatures = baselineFeatures;
    const hits = generated.map(({ numbers }) => matchingCount(numbers, actual));
    const sampleOffset = round % ORDINARY_SAMPLE_STRIDE;

    generated.forEach((vector, index) => {
      const hit = hits[index] ?? 0;
      const ordinarySample =
        hit <= 2 && index % ORDINARY_SAMPLE_STRIDE === sampleOffset;
      const group = featureGroupFor(hit, ordinarySample);
      combinationFeatureKeys.forEach((feature) => {
        this.scaleCollector(feature).add(vector.features[feature]);
      });
      if (group !== null) {
        const values = diagnosticFeatureValues(vector.features);
        Object.entries(values).forEach(([feature, value]) => {
          this.featureCollector(group, feature).add(value);
        });
      }
      if (index % ORDINARY_SAMPLE_STRIDE === sampleOffset) {
        this.correlations.add(vector.features);
      }
    });

    const strategyDiagnostics = Object.fromEntries(
      this.strategies.map((strategy) => {
        const beforeScores = baselineFeatures.map((features) =>
          combinationScoreFor(features, strategy),
        );
        const afterScores = beforeScores;
        const afterOrder = rankedIndices(generated, afterScores);
        const beforeOrder = afterOrder;

        afterOrder.forEach((sourceIndex, rankIndex) => {
          const hit = hits[sourceIndex] ?? 0;
          const collectors = this.hitCollector(strategy, hit);
          collectors.scores.add(afterScores[sourceIndex] ?? 0);
          collectors.ranks.add(rankIndex + 1);
          collectors.counters.total += 1;
          if (rankIndex < 10) collectors.counters.top10 += 1;
          if (rankIndex < 100) collectors.counters.top100 += 1;
          if (rankIndex < 500) collectors.counters.top500 += 1;
          if (rankIndex < 1000) collectors.counters.top1000 += 1;
        });

        generated.forEach((vector, index) => {
          const hit = hits[index] ?? 0;
          const ordinarySample =
            hit <= 2 && index % ORDINARY_SAMPLE_STRIDE === sampleOffset;
          const group = featureGroupFor(hit, ordinarySample);
          if (group === null) return;
          const contribution = scoreContributionFor(
            activeFeatures[index] ?? vector.features,
            strategy,
          );
          contributionNames.forEach((name) => {
            this.contributionCollector(strategy, group, name).add(contribution[name]);
          });
        });

        return [
          strategy,
          {
            bestFourBefore: bestOpportunity(
              generated,
              baselineFeatures,
              beforeOrder,
              hits,
              strategy,
              4,
            ),
            bestFourAfter: bestOpportunity(
              generated,
              activeFeatures,
              afterOrder,
              hits,
              strategy,
              4,
            ),
            bestFiveBefore: bestOpportunity(
              generated,
              baselineFeatures,
              beforeOrder,
              hits,
              strategy,
              5,
            ),
            bestFiveAfter: bestOpportunity(
              generated,
              activeFeatures,
              afterOrder,
              hits,
              strategy,
              5,
            ),
          },
        ];
      }),
    ) as Partial<Record<CombinationStrategy, StrategyOpportunityDiagnostic>>;

    this.opportunities.push({
      round,
      candidateRecall,
      strategies: strategyDiagnostics,
    });
  }

  build(): RankingDiagnostics {
    const hitGroupDistributions = Object.fromEntries(
      this.strategies.map((strategy) => [
        strategy,
        Object.fromEntries(
          Array.from({ length: 7 }, (_, hit) => {
            const collectors = this.hitCollector(strategy, hit);
            const { counters } = collectors;
            return [
              String(hit),
              {
                score: collectors.scores.build(),
                rank: collectors.ranks.build(),
                top10Rate: counters.top10 / Math.max(counters.total, 1),
                top100Rate: counters.top100 / Math.max(counters.total, 1),
                top500Rate: counters.top500 / Math.max(counters.total, 1),
                top1000Rate: counters.top1000 / Math.max(counters.total, 1),
              },
            ];
          }),
        ),
      ]),
    );
    const featureDistributions = Object.fromEntries(
      featureGroups().map((group) => [
        group,
        Object.fromEntries(
          [...combinationFeatureKeys, ...derivedFeatureNames].map((feature) => [
            feature,
            this.featureCollector(group, feature).build(),
          ]),
        ),
      ]),
    );
    const featureContributionDistributions = Object.fromEntries(
      this.strategies.map((strategy) => [
        strategy,
        Object.fromEntries(
          featureGroups().map((group) => [
            group,
            Object.fromEntries(
              contributionNames.map((name) => [
                name,
                this.contributionCollector(strategy, group, name).build(),
              ]),
            ),
          ]),
        ),
      ]),
    );
    return {
      method: 'baseline',
      analyzedRounds: this.analyzedRounds,
      ordinarySampleStride: ORDINARY_SAMPLE_STRIDE,
      hitGroupDistributions,
      featureDistributions,
      featureContributionDistributions,
      featureScales: Object.fromEntries(
        combinationFeatureKeys.map((feature) => [
          feature,
          this.scaleCollector(feature).build(),
        ]),
      ),
      featureCorrelations: this.correlations.build(),
      fourHitOpportunities: this.opportunities,
      fiveHitOpportunities: this.opportunities.filter(
        ({ candidateRecall }) => candidateRecall >= 5,
      ),
    };
  }

  private hitCollector(
    strategy: CombinationStrategy,
    hit: number,
  ): StrategyHitCollectors {
    const key = `${strategy}:${hit}`;
    const existing = this.hitGroups.get(key);
    if (existing !== undefined) return existing;
    const created: StrategyHitCollectors = {
      scores: new DistributionAccumulator(0, 1, SCORE_BINS),
      ranks: new DistributionAccumulator(1, this.combinationCount, RANK_BINS),
      counters: { total: 0, top10: 0, top100: 0, top500: 0, top1000: 0 },
    };
    this.hitGroups.set(key, created);
    return created;
  }

  private featureCollector(
    group: DiagnosticFeatureGroup,
    feature: string,
  ): DistributionAccumulator {
    return collectorFor(this.featureGroups, `${group}:${feature}`);
  }

  private contributionCollector(
    strategy: CombinationStrategy,
    group: DiagnosticFeatureGroup,
    name: ContributionName,
  ): DistributionAccumulator {
    return collectorFor(this.contributionGroups, `${strategy}:${group}:${name}`);
  }

  private scaleCollector(feature: keyof CombinationFeatureVector) {
    return collectorFor(this.featureScales, feature);
  }
}

class DistributionAccumulator {
  private count = 0;
  private sum = 0;
  private sumSquares = 0;
  private minimum = Number.POSITIVE_INFINITY;
  private maximum = Number.NEGATIVE_INFINITY;
  private readonly histogram: number[];

  constructor(
    private readonly lowerBound: number,
    private readonly upperBound: number,
    bins: number,
  ) {
    this.histogram = Array(bins).fill(0) as number[];
  }

  add(value: number): void {
    if (!Number.isFinite(value)) return;
    this.count += 1;
    this.sum += value;
    this.sumSquares += value * value;
    this.minimum = Math.min(this.minimum, value);
    this.maximum = Math.max(this.maximum, value);
    const normalized =
      (value - this.lowerBound) /
      Math.max(this.upperBound - this.lowerBound, Number.EPSILON);
    const bin = Math.min(
      Math.max(Math.floor(normalized * this.histogram.length), 0),
      this.histogram.length - 1,
    );
    this.histogram[bin] = (this.histogram[bin] ?? 0) + 1;
  }

  build(): NumericDistribution {
    if (this.count === 0) return emptyDistribution();
    const mean = this.sum / this.count;
    return {
      count: this.count,
      min: this.minimum,
      max: this.maximum,
      mean,
      median: this.quantile(0.5),
      standardDeviation: Math.sqrt(
        Math.max(this.sumSquares / this.count - mean * mean, 0),
      ),
      p5: this.quantile(0.05),
      p25: this.quantile(0.25),
      p75: this.quantile(0.75),
      p90: this.quantile(0.9),
      p95: this.quantile(0.95),
      p99: this.quantile(0.99),
    };
  }

  private quantile(percentile: number): number {
    const target = Math.max(Math.ceil(this.count * percentile), 1);
    let cumulative = 0;
    for (let index = 0; index < this.histogram.length; index += 1) {
      cumulative += this.histogram[index] ?? 0;
      if (cumulative >= target) {
        return (
          this.lowerBound +
          ((index + 0.5) / this.histogram.length) * (this.upperBound - this.lowerBound)
        );
      }
    }
    return this.maximum;
  }
}

class CorrelationAccumulator {
  private count = 0;
  private readonly sums = new Map<string, number>();
  private readonly products = new Map<string, number>();

  add(features: CombinationFeatureVector): void {
    this.count += 1;
    combinationFeatureKeys.forEach((feature) => {
      addMap(this.sums, feature, features[feature]);
    });
    combinationFeatureKeys.forEach((left, leftIndex) => {
      combinationFeatureKeys.slice(leftIndex).forEach((right) => {
        addMap(this.products, pairKey(left, right), features[left] * features[right]);
      });
    });
  }

  build(): FeatureCorrelation[] {
    if (this.count === 0) return [];
    const result: FeatureCorrelation[] = [];
    combinationFeatureKeys.forEach((left, leftIndex) => {
      combinationFeatureKeys.slice(leftIndex + 1).forEach((right) => {
        const leftMean = (this.sums.get(left) ?? 0) / this.count;
        const rightMean = (this.sums.get(right) ?? 0) / this.count;
        const covariance =
          (this.products.get(pairKey(left, right)) ?? 0) / this.count -
          leftMean * rightMean;
        const leftVariance =
          (this.products.get(pairKey(left, left)) ?? 0) / this.count -
          leftMean * leftMean;
        const rightVariance =
          (this.products.get(pairKey(right, right)) ?? 0) / this.count -
          rightMean * rightMean;
        result.push({
          left,
          right,
          correlation:
            covariance /
            Math.max(Math.sqrt(leftVariance * rightVariance), Number.EPSILON),
        });
      });
    });
    return result.sort(
      (left, right) =>
        Math.abs(right.correlation) - Math.abs(left.correlation) ||
        pairKey(left.left, left.right).localeCompare(pairKey(right.left, right.right)),
    );
  }
}

function bestOpportunity(
  generated: readonly CombinationVector[],
  rankingFeatures: readonly CombinationFeatureVector[],
  order: readonly number[],
  hits: readonly number[],
  strategy: CombinationStrategy,
  targetHit: number,
): OpportunityRankDiagnostic | null {
  const rankIndex = order.findIndex((sourceIndex) => hits[sourceIndex] === targetHit);
  if (rankIndex < 0) return null;
  const sourceIndex = order[rankIndex]!;
  return {
    rank: rankIndex + 1,
    scorePercentile: (order.length - rankIndex) / order.length,
    numbers: generated[sourceIndex]?.numbers ?? [],
    featureContribution: scoreContributionFor(
      rankingFeatures[sourceIndex] ?? generated[sourceIndex]!.features,
      strategy,
    ),
  };
}

function rankedIndices(
  generated: readonly CombinationVector[],
  scores: readonly number[],
): number[] {
  return generated
    .map((_, index) => index)
    .sort(
      (left, right) =>
        (scores[right] ?? 0) - (scores[left] ?? 0) ||
        combinationKey(generated[left]?.numbers ?? []).localeCompare(
          combinationKey(generated[right]?.numbers ?? []),
        ),
    );
}

function diagnosticFeatureValues(
  features: CombinationFeatureVector,
): Record<DiagnosticFeatureName, number> {
  const shape = (features.circleShapeScore + features.gridShapeScore) / 2;
  return {
    ...features,
    'pair×triple': features.pairScore * features.tripleScore,
    'pair×shape': features.pairScore * shape,
    'pair×transition': features.pairScore * features.shapeTransitionScore,
    'triple×shape': features.tripleScore * shape,
    'triple×transition': features.tripleScore * features.shapeTransitionScore,
    'shape×transition': shape * features.shapeTransitionScore,
  };
}

function featureGroupFor(
  hit: number,
  ordinarySample: boolean,
): DiagnosticFeatureGroup | null {
  if (hit >= 5) return 'fiveHit';
  if (hit === 4) return 'fourHit';
  if (hit === 3) return 'threeHit';
  return ordinarySample ? 'ordinary' : null;
}

function featureGroups(): readonly DiagnosticFeatureGroup[] {
  return ['ordinary', 'threeHit', 'fourHit', 'fiveHit'];
}

function collectorFor(
  target: Map<string, DistributionAccumulator>,
  key: string,
): DistributionAccumulator {
  const existing = target.get(key);
  if (existing !== undefined) return existing;
  const created = new DistributionAccumulator(0, 1, SCORE_BINS);
  target.set(key, created);
  return created;
}

function matchingCount(numbers: readonly number[], actual: readonly number[]): number {
  return numbers.filter((number) => actual.includes(number)).length;
}

function pairKey(left: string, right: string): string {
  return `${left}:${right}`;
}

function combinationKey(numbers: readonly number[]): string {
  return numbers.join('-');
}

function addMap(target: Map<string, number>, key: string, value: number): void {
  target.set(key, (target.get(key) ?? 0) + value);
}

function emptyDistribution(): NumericDistribution {
  return {
    count: 0,
    min: 0,
    max: 0,
    mean: 0,
    median: 0,
    standardDeviation: 0,
    p5: 0,
    p25: 0,
    p75: 0,
    p90: 0,
    p95: 0,
    p99: 0,
  };
}
