import type { LottoDraw } from '../types';
import { resolveBacktestRoundRange } from './backtest';
import { buildFrozenPhase3CandidateRoundDiagnostic } from './candidatePhase2';
import {
  buildCombinationAnalysis,
  combinationScoreFor,
  type CombinationVector,
} from './combination';
import {
  type Phase3CandidateSource,
  type Phase3Distribution,
  type Phase3PipelineStageSummary,
} from './candidatePhase3';

export type Phase3SourceAwareSource = Exclude<Phase3CandidateSource, 'current'>;
export type Phase3BranchRankPriorId =
  | 'transition-baseline'
  | 'branch-rank-prior-0.05'
  | 'branch-rank-prior-0.10'
  | 'branch-rank-prior-0.20'
  | 'worst-member-protection-0.10';

export interface CandidatePhase3SourceAwareOptions {
  startRound: 1044;
  endRound: 1235;
  poolSize: 20;
  lambdas: readonly [0.05, 0.1, 0.2];
  worstMemberLambda: 0.1;
}

export interface Phase3SourceAwareRound {
  round: number;
  candidateSource: Phase3SourceAwareSource;
  experimentId: Phase3BranchRankPriorId;
  lambda: number;
  candidateRecall: number;
  best4HitRank: number | null;
  best5HitRank: number | null;
  best6HitRank: number | null;
  top100MaxHit: number;
  top10MaxHit: number;
}

export interface Phase3SourceAwareSummary {
  candidateSource: Phase3SourceAwareSource;
  experimentId: Phase3BranchRankPriorId;
  lambda: number;
  candidate: Phase3PipelineStageSummary;
  top100: Phase3PipelineStageSummary;
  top10: Phase3PipelineStageSummary;
  best4HitRank: Phase3Distribution;
  best5HitRank: Phase3Distribution;
  best6HitRank: Phase3Distribution;
  improved4HitRounds: number;
  improved5HitRounds: number;
  improved6HitRounds: number;
  blocks: readonly {
    block: 'A' | 'B' | 'C' | 'D';
    top100FourPlus: number;
    top100FivePlus: number;
    top100Six: number;
  }[];
  gate: {
    specialistPreservation: boolean;
    fourPlusGuardrail: boolean;
    multipleOpportunityRanksImproved: boolean;
  };
  result: 'KEEP' | 'REJECT' | 'BASELINE';
  reason: string;
}

export interface CandidatePhase3SourceAwareResult {
  metricSchemaVersion: 1;
  generatedAt: string;
  tuningAllowed: true;
  options: CandidatePhase3SourceAwareOptions;
  startRound: 1044;
  endRound: 1235;
  evaluatedRounds: 192;
  experiments: readonly Phase3SourceAwareSummary[];
  selected: Phase3SourceAwareSummary | null;
  rounds: readonly Phase3SourceAwareRound[];
}

interface RankedPriorResult {
  best4HitRank: number | null;
  best5HitRank: number | null;
  best6HitRank: number | null;
  top100MaxHit: number;
  top10MaxHit: number;
}

const SOURCES: readonly Phase3SourceAwareSource[] = ['decay', 'grid-transition'];
const EXPERIMENTS: readonly {
  experimentId: Phase3BranchRankPriorId;
  lambda: number;
  prior: 'mean-percentile' | 'worst-percentile';
}[] = [
  {
    experimentId: 'transition-baseline',
    lambda: 0,
    prior: 'mean-percentile',
  },
  {
    experimentId: 'branch-rank-prior-0.05',
    lambda: 0.05,
    prior: 'mean-percentile',
  },
  {
    experimentId: 'branch-rank-prior-0.10',
    lambda: 0.1,
    prior: 'mean-percentile',
  },
  {
    experimentId: 'branch-rank-prior-0.20',
    lambda: 0.2,
    prior: 'mean-percentile',
  },
  {
    experimentId: 'worst-member-protection-0.10',
    lambda: 0.1,
    prior: 'worst-percentile',
  },
];

export function runCandidatePhase3SourceAwareExperiments(
  draws: readonly LottoDraw[],
  onProgress?: (
    completed: number,
    total: number,
    round: number,
    source: Phase3SourceAwareSource,
  ) => void,
): CandidatePhase3SourceAwareResult {
  const options: CandidatePhase3SourceAwareOptions = {
    startRound: 1044,
    endRound: 1235,
    poolSize: 20,
    lambdas: [0.05, 0.1, 0.2],
    worstMemberLambda: 0.1,
  };
  const range = resolveBacktestRoundRange(draws, {
    rangeMode: 'custom',
    startRound: options.startRound,
    endRound: options.endRound,
    poolSize: options.poolSize,
  });
  const rounds: Phase3SourceAwareRound[] = [];
  let completed = 0;
  const total = range.evaluatedRounds * SOURCES.length;

  for (
    let historyIndex = range.startHistoryIndex;
    historyIndex <= range.endHistoryIndex;
    historyIndex += 1
  ) {
    const actual = draws[historyIndex + 1]!;
    const candidateRound = buildFrozenPhase3CandidateRoundDiagnostic(
      draws,
      historyIndex,
      actual,
    );
    for (const source of SOURCES) {
      const ranking = candidateRound.rankings[source]!;
      if (ranking.recall >= 4) {
        const analysis = buildCombinationAnalysis(
          draws,
          historyIndex,
          20,
          false,
          'full-enumeration',
          ranking.top20,
          [],
        );
        const winning = new Set(actual.numbers);
        const hits = Uint8Array.from(
          analysis.generatedCombinations.map(({ numbers }) =>
            numbers.reduce((count, number) => count + Number(winning.has(number)), 0),
          ),
        );
        const sourceRanks = Object.fromEntries(
          candidateRound.numbers.map(({ number, ranks }) => [
            number,
            ranks[source] ?? 45,
          ]),
        ) as Record<number, number>;
        EXPERIMENTS.forEach(({ experimentId, lambda, prior }) => {
          const ranked = rankWithBranchPrior(
            analysis.generatedCombinations,
            hits,
            sourceRanks,
            lambda,
            prior,
          );
          rounds.push({
            round: actual.round,
            candidateSource: source,
            experimentId,
            lambda,
            candidateRecall: ranking.recall,
            ...ranked,
          });
        });
      } else {
        EXPERIMENTS.forEach(({ experimentId, lambda }) => {
          rounds.push({
            round: actual.round,
            candidateSource: source,
            experimentId,
            lambda,
            candidateRecall: ranking.recall,
            best4HitRank: null,
            best5HitRank: null,
            best6HitRank: null,
            top100MaxHit: 0,
            top10MaxHit: 0,
          });
        });
      }
      completed += 1;
      onProgress?.(completed, total, actual.round, source);
    }
  }

  const experiments = SOURCES.flatMap((source) =>
    EXPERIMENTS.map(({ experimentId, lambda }) =>
      summarizeExperiment(source, experimentId, lambda, rounds),
    ),
  );
  const selected = selectExperiment(experiments);
  return {
    metricSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    tuningAllowed: true,
    options,
    startRound: 1044,
    endRound: 1235,
    evaluatedRounds: 192,
    experiments,
    selected,
    rounds,
  };
}

function rankWithBranchPrior(
  vectors: readonly CombinationVector[],
  hits: Uint8Array,
  sourceRanks: Record<number, number>,
  lambda: number,
  priorMode: 'mean-percentile' | 'worst-percentile',
): RankedPriorResult {
  const scores = Float64Array.from(vectors, ({ numbers, features }) => {
    const percentiles = numbers.map((number) =>
      rankPercentile(sourceRanks[number] ?? 45),
    );
    const prior =
      priorMode === 'worst-percentile' ? Math.min(...percentiles) : mean(percentiles);
    return combinationScoreFor(features, 'transition') + lambda * prior;
  });
  const order = Array.from({ length: vectors.length }, (_, index) => index).sort(
    (left, right) => scores[right]! - scores[left]! || left - right,
  );
  let best4HitRank: number | null = null;
  let best5HitRank: number | null = null;
  let best6HitRank: number | null = null;
  let top100MaxHit = 0;
  let top10MaxHit = 0;
  order.forEach((vectorIndex, offset) => {
    const rank = offset + 1;
    const hit = hits[vectorIndex]!;
    if (rank <= 100) top100MaxHit = Math.max(top100MaxHit, hit);
    if (rank <= 10) top10MaxHit = Math.max(top10MaxHit, hit);
    if (hit >= 4) best4HitRank ??= rank;
    if (hit >= 5) best5HitRank ??= rank;
    if (hit >= 6) best6HitRank ??= rank;
  });
  return {
    best4HitRank,
    best5HitRank,
    best6HitRank,
    top100MaxHit,
    top10MaxHit,
  };
}

function summarizeExperiment(
  source: Phase3SourceAwareSource,
  experimentId: Phase3BranchRankPriorId,
  lambda: number,
  allRounds: readonly Phase3SourceAwareRound[],
): Phase3SourceAwareSummary {
  const rounds = allRounds.filter(
    (round) => round.candidateSource === source && round.experimentId === experimentId,
  );
  const baselineByRound = new Map(
    allRounds
      .filter(
        (round) =>
          round.candidateSource === source &&
          round.experimentId === 'transition-baseline',
      )
      .map((round) => [round.round, round]),
  );
  const candidate = stageSummary(rounds.map(({ candidateRecall }) => candidateRecall));
  const top100 = stageSummary(rounds.map(({ top100MaxHit }) => top100MaxHit));
  const top10 = stageSummary(rounds.map(({ top10MaxHit }) => top10MaxHit));
  const improved = (key: 'best4HitRank' | 'best5HitRank' | 'best6HitRank') =>
    rounds.filter((round) => {
      const baseline = baselineByRound.get(round.round);
      return (
        round[key] !== null &&
        baseline?.[key] !== null &&
        baseline?.[key] !== undefined &&
        round[key]! < baseline[key]!
      );
    }).length;
  const baselineSummary =
    experimentId === 'transition-baseline'
      ? null
      : summarizeExperiment(source, 'transition-baseline', 0, allRounds);
  const specialistPreservation =
    source === 'decay' ? top100.fivePlus > 0 : top100.six > 0;
  const fourPlusGuardrail =
    baselineSummary === null ||
    top100.fourPlus >= Math.max(0, baselineSummary.top100.fourPlus - 1);
  const improvedTarget =
    source === 'decay' ? improved('best5HitRank') : improved('best6HitRank');
  const multipleOpportunityRanksImproved = improvedTarget >= 2;
  const keep =
    experimentId !== 'transition-baseline' &&
    specialistPreservation &&
    fourPlusGuardrail &&
    multipleOpportunityRanksImproved;
  return {
    candidateSource: source,
    experimentId,
    lambda,
    candidate,
    top100,
    top10,
    best4HitRank: distribution(nonNull(rounds.map(({ best4HitRank }) => best4HitRank))),
    best5HitRank: distribution(nonNull(rounds.map(({ best5HitRank }) => best5HitRank))),
    best6HitRank: distribution(nonNull(rounds.map(({ best6HitRank }) => best6HitRank))),
    improved4HitRounds: improved('best4HitRank'),
    improved5HitRounds: improved('best5HitRank'),
    improved6HitRounds: improved('best6HitRank'),
    blocks: blockSummaries(rounds),
    gate: {
      specialistPreservation,
      fourPlusGuardrail,
      multipleOpportunityRanksImproved,
    },
    result:
      experimentId === 'transition-baseline' ? 'BASELINE' : keep ? 'KEEP' : 'REJECT',
    reason:
      experimentId === 'transition-baseline'
        ? 'Frozen Transition baseline'
        : keep
          ? 'Specialist preservation, 4+ guardrail, multiple rank improvement passed'
          : `Gate ${[
              specialistPreservation ? null : 'Specialist',
              fourPlusGuardrail ? null : '4+',
              multipleOpportunityRanksImproved ? null : 'Multi-rank',
            ]
              .filter(Boolean)
              .join('/')} failed`,
  };
}

function selectExperiment(
  summaries: readonly Phase3SourceAwareSummary[],
): Phase3SourceAwareSummary | null {
  return (
    [...summaries]
      .filter(({ result }) => result === 'KEEP')
      .sort(
        (left, right) =>
          right.top100.six - left.top100.six ||
          right.top100.fivePlus - left.top100.fivePlus ||
          right.top100.fourPlus - left.top100.fourPlus ||
          left.lambda - right.lambda,
      )[0] ?? null
  );
}

function blockSummaries(rounds: readonly Phase3SourceAwareRound[]) {
  const labels = ['A', 'B', 'C', 'D'] as const;
  return labels.map((block, blockIndex) => {
    const start = 1044 + blockIndex * 48;
    const selected = rounds.filter(({ round }) => round >= start && round < start + 48);
    const summary = stageSummary(selected.map(({ top100MaxHit }) => top100MaxHit));
    return {
      block,
      top100FourPlus: summary.fourPlus,
      top100FivePlus: summary.fivePlus,
      top100Six: summary.six,
    };
  });
}

function stageSummary(values: readonly number[]): Phase3PipelineStageSummary {
  return {
    fourPlus: values.filter((value) => value >= 4).length,
    fivePlus: values.filter((value) => value >= 5).length,
    six: values.filter((value) => value >= 6).length,
  };
}

function distribution(values: readonly number[]): Phase3Distribution {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      min: 0,
      p5: 0,
      p25: 0,
      p75: 0,
      p95: 0,
      max: 0,
    };
  }
  const average = mean(values);
  return {
    count: values.length,
    mean: average,
    median: quantile(values, 0.5),
    standardDeviation: Math.sqrt(mean(values.map((value) => (value - average) ** 2))),
    min: Math.min(...values),
    p5: quantile(values, 0.05),
    p25: quantile(values, 0.25),
    p75: quantile(values, 0.75),
    p95: quantile(values, 0.95),
    max: Math.max(...values),
  };
}

function quantile(values: readonly number[], percentile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower] ?? 0;
  const fraction = position - lower;
  return sorted[lower]! * (1 - fraction) + sorted[upper]! * fraction;
}

function mean(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);
}

function rankPercentile(rank: number): number {
  return 1 - (rank - 1) / 44;
}

function nonNull(values: readonly (number | null)[]): number[] {
  return values.filter((value): value is number => value !== null);
}
