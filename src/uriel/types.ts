export type LayoutMode = 'circle' | 'board';
export type HistoryMode = 'independent' | 'cumulative' | 'decay';
export type AlgorithmId = 'baseline';
export type PurchaseRole = 'focus' | 'hypothesis' | 'coverage' | 'anchor';

export interface LottoDraw {
  round: number;
  date: string;
  numbers: readonly number[];
}

export interface NumberPoint {
  number: number;
  x: number;
  y: number;
}

export interface ShapeMetrics {
  centroidX: number;
  centroidY: number;
  area: number;
  perimeter: number;
  compactness: number;
  spread: number;
  orientation: number;
}

export interface WeightedDraw {
  draw: LottoDraw;
  weight: number;
}

export interface HistoryFrame {
  draws: WeightedDraw[];
  trails: WeightedDraw[];
  numberWeights: readonly number[];
  weightedCentroid: { x: number; y: number };
}

export interface Candidate {
  numbers: readonly number[];
  metrics: ShapeMetrics;
  score: number;
}

export interface PurchaseCandidate extends Candidate {
  purchaseRole: PurchaseRole;
  reason: string;
  researchRank?: number;
  isUserAnchor?: boolean;
}

export interface PurchasePortfolio {
  games: PurchaseCandidate[];
  priorityNumbers: readonly number[];
  coreNumbers: readonly number[];
  userAnchorUsed: boolean;
  researchPoolSize: number;
  optimizedScenarioCount: number;
  topTenRetained: number;
}

export interface CandidateMethod {
  algorithmId: AlgorithmId;
  searchSpace: number;
  featureCount: number;
  transitionNeighbors: number;
  diversified: boolean;
}

export interface NumberPatterns {
  oddCount: number;
  lowCount: number;
  sum: number;
  consecutivePairs: number;
  averageGap: number;
}
