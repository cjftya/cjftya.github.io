import type { Candidate, CandidateModel, LayoutMode, PurchaseStrategy } from '../types';
import type { findShapeCandidates } from './candidates';
import type { ShapeTransitionForecast } from './shapeTransition';

export interface PredictionRequest {
  index: number;
  layout: LayoutMode;
  candidateModel: CandidateModel;
  purchaseStrategy: PurchaseStrategy;
}

export interface PredictionSnapshot {
  candidateResult: ReturnType<typeof findShapeCandidates>;
  shapeForecast: ShapeTransitionForecast | null;
  purchaseResearchCandidates: readonly Candidate[];
  rawCombinationCount: number;
}

export function predictionKey(request: PredictionRequest): string {
  return [
    request.index,
    request.layout,
    request.candidateModel,
    request.purchaseStrategy,
  ].join(':');
}
