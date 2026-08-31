import type { LottoDraw } from '../types';
import type {
  PredictionRequest,
  PredictionSnapshot,
} from '../analysis/predictionTypes';

export type PredictionWorkerRequest =
  | { type: 'init'; draws: readonly LottoDraw[] }
  | { type: 'analyze'; id: number; request: PredictionRequest };

export type PredictionWorkerReply =
  | { type: 'complete'; id: number; snapshot: PredictionSnapshot }
  | { type: 'error'; id: number; message: string };
