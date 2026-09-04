import { createRandom, mixSeed, sampleCombination } from './random';
import type {
  CandidateGame,
  CandidateGameSet,
  FittedCombinationModel,
  ResearchConfig,
} from './types';
import { GAME_COUNTS } from './types';

const SCORE_BINS = 2_048;
const MAX_GAME_COUNT = GAME_COUNTS.at(-1)!;
const SELECTION_POOL_SIZE = MAX_GAME_COUNT * 100;

interface ScoredCombination extends CandidateGame {
  tieBreaker: number;
}

export interface ProjectionResult {
  gameSets: readonly CandidateGameSet[];
  retainedCombinations: number;
}

export function selectCandidateGames(
  model: FittedCombinationModel,
  config: ResearchConfig,
  projectionSeed: number,
): ProjectionResult {
  if (model.diagnostics.selectedFeatureCount === 0) {
    return {
      gameSets: buildGameSets(
        sampleDiverseRandomGames(MAX_GAME_COUNT, createRandom(projectionSeed)),
      ),
      retainedCombinations: 0,
    };
  }
  const target = Math.min(
    config.sampleSize,
    Math.max(MAX_GAME_COUNT, Math.floor(config.sampleSize * config.topFraction)),
  );
  const histogram = Array(SCORE_BINS).fill(0) as number[];
  visitSamples(config.sampleSize, projectionSeed, model, (_numbers, score) => {
    const bin = scoreBin(score);
    histogram[bin] = histogram[bin]! + 1;
  });
  const { thresholdBin, acceptedInThreshold } = thresholdForTopCount(histogram, target);
  const pool: ScoredCombination[] = [];
  const reservoirRandom = createRandom(mixSeed(projectionSeed, 0x6a09e667));
  let retained = 0;
  let acceptedAtThreshold = 0;
  visitSamples(config.sampleSize, projectionSeed, model, (numbers, score) => {
    const bin = scoreBin(score);
    const include =
      bin > thresholdBin ||
      (bin === thresholdBin && acceptedAtThreshold < acceptedInThreshold);
    if (!include) return;
    if (bin === thresholdBin) acceptedAtThreshold += 1;
    retained += 1;
    const candidate: ScoredCombination = {
      numbers: [...numbers],
      structuralScore: score,
      tieBreaker: reservoirRandom.next(),
    };
    if (pool.length < Math.min(target, SELECTION_POOL_SIZE)) {
      pool.push(candidate);
      return;
    }
    const replacement = reservoirRandom.integer(retained);
    if (replacement < pool.length) pool[replacement] = candidate;
  });
  const ranked = pool.sort(
    (left, right) =>
      right.structuralScore - left.structuralScore ||
      left.tieBreaker - right.tieBreaker,
  );
  const selected = selectDiverseGames(ranked, MAX_GAME_COUNT);
  const gameSets = buildGameSets(selected);
  return { gameSets, retainedCombinations: retained };
}

function buildGameSets(games: readonly CandidateGame[]): CandidateGameSet[] {
  return GAME_COUNTS.map((count): CandidateGameSet => ({
    count,
    games: games.slice(0, count).map(({ numbers, structuralScore }) => ({
      numbers,
      structuralScore,
    })),
  }));
}

export function sampleDiverseRandomGames(
  count: number,
  random: ReturnType<typeof createRandom>,
): CandidateGame[] {
  const requested = Math.max(0, Math.trunc(count));
  const games: CandidateGame[] = [];
  const keys = new Set<string>();
  for (const overlapLimit of [2, 3, 4, 5, 6]) {
    let attempts = 0;
    const attemptLimit = Math.max(requested * 80, 100);
    while (games.length < requested && attempts < attemptLimit) {
      attempts += 1;
      const numbers = sampleCombination(random);
      const key = numbers.join('-');
      if (keys.has(key)) continue;
      if (
        games.some((game) => intersectionSize(game.numbers, numbers) > overlapLimit)
      ) {
        continue;
      }
      keys.add(key);
      games.push({ numbers, structuralScore: 0.5 });
    }
    if (games.length >= requested) break;
  }
  return games;
}

function selectDiverseGames(
  ranked: readonly ScoredCombination[],
  count: number,
): ScoredCombination[] {
  const selected: ScoredCombination[] = [];
  const selectedKeys = new Set<string>();
  for (const overlapLimit of [2, 3, 4, 5, 6]) {
    for (const candidate of ranked) {
      if (selected.length >= count) return selected;
      const key = candidate.numbers.join('-');
      if (selectedKeys.has(key)) continue;
      if (
        selected.some(
          (game) => intersectionSize(game.numbers, candidate.numbers) > overlapLimit,
        )
      ) {
        continue;
      }
      selectedKeys.add(key);
      selected.push(candidate);
    }
  }
  return selected;
}

function intersectionSize(left: readonly number[], right: readonly number[]): number {
  const rightSet = new Set(right);
  return left.filter((number) => rightSet.has(number)).length;
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
