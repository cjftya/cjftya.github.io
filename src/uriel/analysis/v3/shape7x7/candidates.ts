import { createRandom, sampleCombination } from '../random';
import { GAME_COUNTS, type CandidateGame, type CandidateGameSet } from '../types';
import { forecastDistance, type ShapeForecast } from './predictor';
import { shapeSignature } from './signature';

export interface ShapeSample {
  numbers: readonly number[];
  signature: readonly number[];
}

export function* sampleShapeSpace(
  count: number,
  seed: number,
  metric: ShapeForecast['config']['metric'],
): Generator<ShapeSample> {
  const random = createRandom(seed);
  for (let i = 0; i < count; i++) {
    const numbers = sampleCombination(random);
    yield { numbers, signature: shapeSignature(numbers, metric) };
  }
}

export function overlap(a: readonly number[], b: readonly number[]): number {
  let count = 0;
  for (const n of a) if (b.includes(n)) count++;
  return count;
}

/** Strict cap: never relax to five matching numbers to fill a portfolio. */
export function diverseGames(
  ranked: readonly CandidateGame[],
  count: number,
  maxOverlap: number,
): CandidateGame[] {
  if (![3, 4].includes(maxOverlap)) throw new Error('중복 상한은 3 또는 4예요.');
  const selected: CandidateGame[] = [];
  for (const game of ranked) {
    if (
      selected.every(
        (previous) => overlap(previous.numbers, game.numbers) <= maxOverlap,
      )
    )
      selected.push(game);
    if (selected.length === count) break;
  }
  if (selected.length !== count)
    throw new Error(
      '다양성 조건을 만족하는 조합이 부족해요. 표본 수 또는 Top 비율을 늘려 주세요.',
    );
  return selected;
}

export function randomShapeGames(
  count: number,
  seed: number,
  maxOverlap: number,
): CandidateGame[] {
  if (![3, 4].includes(maxOverlap)) throw new Error('중복 상한은 3 또는 4예요.');
  const random = createRandom(seed),
    games: CandidateGame[] = [];
  for (let attempt = 0; attempt < count * 1_000 && games.length < count; attempt++) {
    const numbers = sampleCombination(random);
    if (games.every((game) => overlap(game.numbers, numbers) <= maxOverlap))
      games.push({ numbers, structuralScore: 0.5 });
  }
  if (games.length !== count) throw new Error('랜덤 다양성 표본 생성에 실패했어요.');
  return games;
}

export function gameSets(games: readonly CandidateGame[]): CandidateGameSet[] {
  return GAME_COUNTS.map((count) => ({ count, games: games.slice(0, count) }));
}

/** One-pass bounded min-heap; candidate count does not dictate resident memory. */
export function generateShapeGames(
  forecast: ShapeForecast,
  sampleSize: number,
  seed: number,
  topFraction: number,
  samples?: Iterable<ShapeSample>,
  unconditional = false,
): { gameSets: CandidateGameSet[]; retainedCombinations: number } {
  const limit = Math.min(3_000, Math.max(30, Math.floor(sampleSize * topFraction)));
  const heap: CandidateGame[] = [];
  for (const sample of samples ??
    sampleShapeSpace(sampleSize, seed, forecast.config.metric)) {
    const score = Math.exp(
      -0.5 * forecastDistance(sample.signature, forecast, unconditional),
    );
    const game = { numbers: sample.numbers, structuralScore: score };
    if (heap.length < limit) {
      heap.push(game);
      let i = heap.length - 1;
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (heap[parent]!.structuralScore <= score) break;
        heap[i] = heap[parent]!;
        i = parent;
      }
      heap[i] = game;
    } else if (score > heap[0]!.structuralScore) {
      let i = 0;
      while (2 * i + 1 < heap.length) {
        let child = 2 * i + 1;
        if (
          child + 1 < heap.length &&
          heap[child + 1]!.structuralScore < heap[child]!.structuralScore
        )
          child++;
        if (heap[child]!.structuralScore >= score) break;
        heap[i] = heap[child]!;
        i = child;
      }
      heap[i] = game;
    }
  }
  heap.sort(
    (a, b) =>
      b.structuralScore - a.structuralScore || compareNumbers(a.numbers, b.numbers),
  );
  return {
    gameSets: gameSets(diverseGames(heap, 30, forecast.config.maxOverlap)),
    retainedCombinations: heap.length,
  };
}

function compareNumbers(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < 6; i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
  return 0;
}
