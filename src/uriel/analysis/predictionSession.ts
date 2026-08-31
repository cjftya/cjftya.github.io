import type { LottoDraw } from '../types';
import { findShapeCandidates } from './candidates';
import { buildCombinationAnalysis } from './combination';
import { forecastBoardShapeTransitions } from './shapeTransition';
import type { PredictionRequest, PredictionSnapshot } from './predictionTypes';
import { predictionKey } from './predictionTypes';

/** One immutable dataset per session. Bounded caches are dropped on CSV replacement. */
export function createPredictionSession(draws: readonly LottoDraw[]) {
  const candidates = new Map<string, ReturnType<typeof findShapeCandidates>>();
  const frames = new Map<string, PredictionSnapshot>();
  const findCached: typeof findShapeCandidates = (
    _,
    index,
    layout,
    count = 6,
    model = 'hybrid',
  ) =>
    cached(candidates, `${index}:${layout}:${count}:${model}`, 24, () =>
      findShapeCandidates(draws, index, layout, count, model),
    );

  return (request: PredictionRequest): PredictionSnapshot =>
    cached(frames, predictionKey(request), 6, () => {
      const { index, layout, candidateModel, purchaseStrategy } = request;
      if (!Number.isInteger(index) || !draws[index])
        throw new Error('분석할 회차가 없어요.');
      const combination =
        purchaseStrategy === 'baseline'
          ? null
          : buildCombinationAnalysis(
              draws,
              index,
              15,
              false,
              'current',
              undefined,
              [purchaseStrategy === 'shape-transition' ? 'transition' : 'full-hybrid'],
              findCached,
            );
      const candidateLayout = candidateModel === 'shape-transition' ? 'board' : layout;
      const candidateResult = findCached(
        draws,
        index,
        candidateLayout,
        100,
        candidateModel,
      );
      const purchaseResearchCandidates =
        combination === null
          ? findCached(draws, index, layout, 100, 'baseline').candidates
          : combination.researchByStrategy[
              purchaseStrategy === 'shape-transition' ? 'transition' : 'full-hybrid'
            ];
      return {
        candidateResult,
        shapeForecast:
          candidateModel === 'shape-transition' ||
          purchaseStrategy === 'shape-transition'
            ? forecastBoardShapeTransitions(draws, index)
            : null,
        purchaseResearchCandidates,
        rawCombinationCount: combination?.rawCombinationCount ?? 0,
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
