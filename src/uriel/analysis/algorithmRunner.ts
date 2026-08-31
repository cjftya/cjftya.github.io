import type {
  AlgorithmId,
  Candidate,
  CandidateMethod,
  LayoutMode,
  LottoDraw,
  ShapeMetrics,
} from '../types';
import { findBaselineCandidates } from './candidates';
import { buildTransitionTailCandidates } from './transitionTail';

export interface AlgorithmResult {
  candidates: Candidate[];
  target: ShapeMetrics;
  method: CandidateMethod;
  layout: LayoutMode;
}

export function runAlgorithm(
  id: AlgorithmId,
  draws: readonly LottoDraw[],
  index: number,
  layout: LayoutMode,
  count: number,
): AlgorithmResult {
  switch (id) {
    case 'baseline': {
      return { ...findBaselineCandidates(draws, index, layout, count), layout };
    }
    case 'transition-tail': {
      return {
        ...buildTransitionTailCandidates(draws, index, count),
        layout: 'board',
      };
    }
  }
}
