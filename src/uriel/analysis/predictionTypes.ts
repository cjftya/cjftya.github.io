import type { AlgorithmId, Candidate, LayoutMode } from '../types';
import type { AlgorithmResult } from './algorithmRunner';

export interface PredictionRequest {
  index: number;
  layout: LayoutMode;
  algorithmId: AlgorithmId;
}

export interface PredictionSnapshot {
  candidateResult: AlgorithmResult;
  purchaseResearchCandidates: readonly Candidate[];
}

export function predictionKey(request: PredictionRequest): string {
  return [request.index, request.layout, request.algorithmId].join(':');
}
