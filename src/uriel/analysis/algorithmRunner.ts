import type { AlgorithmId, LayoutMode, LottoDraw } from '../types';
import { findBaselineCandidates } from './candidates';

export type AlgorithmResult = ReturnType<typeof findBaselineCandidates>;

export function runAlgorithm(
  id: AlgorithmId,
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count: number,
): AlgorithmResult {
  switch (id) {
    case 'baseline':
      return findBaselineCandidates(draws, index, layout, count);
  }
}
