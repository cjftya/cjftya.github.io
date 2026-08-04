export type LayoutMode = 'circle' | 'board';
export type HistoryMode = 'independent' | 'cumulative' | 'decay';

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
