import type { CandidateGame } from '../types';
import { average, quantile } from '../statistics';
import { createRandom } from '../random';
import { overlap } from './candidates';

export interface PortfolioMetrics {
  bestHit: number;
  meanGameHit: number;
  unionSize: number;
  unionHits: number;
  recall: number;
  /** Removes the mechanical advantage of covering more numbers. */
  coverageAdjustedHits: number;
  meanOverlap: number;
  diversity: number;
}

export function measurePortfolio(
  games: readonly CandidateGame[],
  actual: readonly number[],
): PortfolioMetrics {
  const hits = games.map((game) => overlap(game.numbers, actual));
  const union = [...new Set(games.flatMap((game) => [...game.numbers]))];
  const unionHits = overlap(union, actual);
  const overlaps: number[] = [];
  games.forEach((a, i) =>
    games.slice(i + 1).forEach((b) => overlaps.push(overlap(a.numbers, b.numbers))),
  );
  const meanOverlap = average(overlaps);
  return {
    bestHit: Math.max(0, ...hits),
    meanGameHit: average(hits),
    unionSize: union.length,
    unionHits,
    recall: unionHits / 6,
    coverageAdjustedHits: unionHits - (6 * union.length) / 45,
    meanOverlap,
    diversity: 1 - meanOverlap / 6,
  };
}

/** Circular moving-block bootstrap, preserving short-run dependence between folds. */
export function blockMeanInterval(
  values: readonly number[],
  iterations: number,
  seed: number,
): [number, number] {
  if (!values.length) return [0, 0];
  const random = createRandom(seed),
    block = Math.min(5, values.length);
  const means = Array.from({ length: iterations }, () => {
    let total = 0,
      used = 0;
    while (used < values.length) {
      const start = random.integer(values.length);
      for (let j = 0; j < block && used < values.length; j++, used++)
        total += values[(start + j) % values.length]!;
    }
    return total / values.length;
  }).sort((a, b) => a - b);
  return [quantile(means, 0.025), quantile(means, 0.975)];
}

/** Holm family-wise correction; conservative ties and Monte Carlo +1 correction. */
export function holmCorrection(pValues: readonly number[]): number[] {
  const ranked = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
  const adjusted = Array<number>(pValues.length);
  let previous = 0;
  ranked.forEach(({ p, index }, rank) => {
    previous = Math.max(previous, Math.min(1, p * (pValues.length - rank)));
    adjusted[index] = previous;
  });
  return adjusted;
}

export function upperTailPValue(observed: number, samples: readonly number[]): number {
  return (
    (1 + samples.filter((value) => value >= observed).length) / (samples.length + 1)
  );
}

export function temporalMeans(values: readonly number[]): number[] {
  return [0, 1, 2].map((segment) =>
    average(
      values.slice(
        Math.floor((values.length * segment) / 3),
        Math.floor((values.length * (segment + 1)) / 3),
      ),
    ),
  );
}
