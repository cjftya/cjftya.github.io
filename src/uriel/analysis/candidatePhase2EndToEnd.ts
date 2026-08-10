import type { Candidate, LottoDraw } from '../types';
import type { CandidatePhase2Result, CandidateRankingId } from './candidatePhase2';
import { buildCombinationAnalysis } from './combination';
import { buildTailCoverageGames } from './purchase';

export interface CandidatePipelineStageSummary {
  fourPlus: number;
  fivePlus: number;
  six: number;
}

export interface CandidatePipelineConversion {
  candidateToGeneration5: number;
  generationToTop1005: number;
  top100ToTop10_5: number;
  candidateToGeneration6: number;
  generationToTop1006: number;
  top100ToTop10_6: number;
}

export interface CandidateSixHitTrace {
  round: number;
  candidateTop20: readonly number[];
  winningRanks: readonly number[];
  generation6: boolean;
  best6HitRank: number | null;
  top100Reached: boolean;
  top10Reached: boolean;
}

export interface CandidateEndToEndRound {
  round: number;
  candidateRecall: number;
  generationMaxHit: number;
  top100MaxHit: number;
  top10MaxHit: number;
}

export interface CandidateEndToEndResult {
  generatedAt: string;
  rankingId: CandidateRankingId;
  startRound: number;
  endRound: number;
  evaluatedRounds: number;
  stages: {
    candidate: CandidatePipelineStageSummary;
    generation: CandidatePipelineStageSummary;
    top100: CandidatePipelineStageSummary;
    top10: CandidatePipelineStageSummary;
  };
  conversion: CandidatePipelineConversion;
  sixHitTraces: readonly CandidateSixHitTrace[];
  rounds: readonly CandidateEndToEndRound[];
}

export function runCandidateEndToEndEvaluation(
  draws: readonly LottoDraw[],
  candidateResult: CandidatePhase2Result,
  rankingId: CandidateRankingId,
  onProgress?: (completed: number, total: number, round: number) => void,
): CandidateEndToEndResult {
  if (!candidateResult.tuningAllowed) {
    throw new Error('End-to-end Candidate 선택은 Development 결과에서만 실행해요.');
  }
  const rounds: CandidateEndToEndRound[] = [];
  const sixHitTraces: CandidateSixHitTrace[] = [];

  candidateResult.rounds.forEach((candidateRound, roundIndex) => {
    const ranking = candidateRound.rankings[rankingId];
    if (ranking === undefined) {
      throw new Error(`Development result does not include ${rankingId}.`);
    }
    const actualIndex = draws.findIndex(({ round }) => round === candidateRound.round);
    if (actualIndex <= 0) {
      throw new Error(`Round ${candidateRound.round} is missing required history.`);
    }
    const actual = draws[actualIndex]!;
    const analysis = buildCombinationAnalysis(
      draws,
      actualIndex - 1,
      20,
      false,
      'full-enumeration',
      ranking.top20,
      ['transition'],
    );
    const generationMaxHit = maximumCombinationMatch(
      analysis.generatedCombinations,
      actual.numbers,
    );
    const research = analysis.researchByStrategy.transition;
    const top100MaxHit = maximumCandidateMatch(research, actual.numbers);
    const top10 = buildTailCoverageGames(research, 'board');
    const top10MaxHit = maximumCandidateMatch(top10, actual.numbers);
    rounds.push({
      round: actual.round,
      candidateRecall: ranking.recall,
      generationMaxHit,
      top100MaxHit,
      top10MaxHit,
    });
    if (ranking.recall === 6) {
      const best6HitRank = research.findIndex(
        ({ numbers }) => countMatches(numbers, actual.numbers) === 6,
      );
      sixHitTraces.push({
        round: actual.round,
        candidateTop20: ranking.top20,
        winningRanks: ranking.winningRanks,
        generation6: generationMaxHit === 6,
        best6HitRank: best6HitRank < 0 ? null : best6HitRank + 1,
        top100Reached: top100MaxHit === 6,
        top10Reached: top10MaxHit === 6,
      });
    }
    onProgress?.(roundIndex + 1, candidateResult.rounds.length, actual.round);
  });

  const stages = {
    candidate: stageSummary(rounds.map(({ candidateRecall }) => candidateRecall)),
    generation: stageSummary(rounds.map(({ generationMaxHit }) => generationMaxHit)),
    top100: stageSummary(rounds.map(({ top100MaxHit }) => top100MaxHit)),
    top10: stageSummary(rounds.map(({ top10MaxHit }) => top10MaxHit)),
  };
  return {
    generatedAt: new Date().toISOString(),
    rankingId,
    startRound: rounds[0]?.round ?? 0,
    endRound: rounds.at(-1)?.round ?? 0,
    evaluatedRounds: rounds.length,
    stages,
    conversion: {
      candidateToGeneration5: conversion(
        stages.candidate.fivePlus,
        stages.generation.fivePlus,
      ),
      generationToTop1005: conversion(
        stages.generation.fivePlus,
        stages.top100.fivePlus,
      ),
      top100ToTop10_5: conversion(stages.top100.fivePlus, stages.top10.fivePlus),
      candidateToGeneration6: conversion(stages.candidate.six, stages.generation.six),
      generationToTop1006: conversion(stages.generation.six, stages.top100.six),
      top100ToTop10_6: conversion(stages.top100.six, stages.top10.six),
    },
    sixHitTraces,
    rounds,
  };
}

function stageSummary(values: readonly number[]): CandidatePipelineStageSummary {
  return {
    fourPlus: values.filter((value) => value >= 4).length,
    fivePlus: values.filter((value) => value >= 5).length,
    six: values.filter((value) => value >= 6).length,
  };
}

function maximumCombinationMatch(
  combinations: readonly { numbers: readonly number[] }[],
  actual: readonly number[],
): number {
  return combinations.reduce(
    (maximum, candidate) => Math.max(maximum, countMatches(candidate.numbers, actual)),
    0,
  );
}

function maximumCandidateMatch(
  candidates: readonly Candidate[],
  actual: readonly number[],
): number {
  return candidates.reduce(
    (maximum, candidate) => Math.max(maximum, countMatches(candidate.numbers, actual)),
    0,
  );
}

function countMatches(left: readonly number[], right: readonly number[]): number {
  return left.filter((number) => right.includes(number)).length;
}

function conversion(eligible: number, successes: number): number {
  return eligible === 0 ? 0 : successes / eligible;
}
