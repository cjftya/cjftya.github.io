import type { LottoDraw } from '../types';
import { runAlgorithm } from './algorithmRunner';
import type { AlgorithmResult } from './algorithmRunner';
import type { PredictionRequest, PredictionSnapshot } from './predictionTypes';
import { predictionKey } from './predictionTypes';

/** One immutable dataset per Worker session. CSV replacement drops every cache. */
export function createPredictionSession(draws: readonly LottoDraw[]) {
  const results = new Map<string, AlgorithmResult>();
  const frames = new Map<string, PredictionSnapshot>();

  return (request: PredictionRequest): PredictionSnapshot =>
    cached(frames, predictionKey(request), 6, () => {
      const { index, layout, algorithmId } = request;
      if (!Number.isInteger(index) || !draws[index]) {
        throw new Error('분석할 회차가 없어요.');
      }
      const candidateResult = cached(
        results,
        `${index}:${layout}:${algorithmId}`,
        24,
        () => runAlgorithm(algorithmId, draws, index, layout, 100),
      );
      return {
        candidateResult,
        purchaseResearchCandidates: candidateResult.candidates,
      };
    });
}

function cached<T>(
  cache: Map<string, T>,
  key: string,
  limit: number,
  calculate: () => T,
): T {
  if (cache.has(key)) {
    const value = cache.get(key)!;
    cache.delete(key);
    cache.set(key, value);
    return value;
  }
  const value = calculate();
  cache.set(key, value);
  if (cache.size > limit) cache.delete(cache.keys().next().value!);
  return value;
}
