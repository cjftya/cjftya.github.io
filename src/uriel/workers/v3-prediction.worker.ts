import { predictNextCandidates } from '../analysis/v3/prediction';
import type {
  CandidatePrediction,
  ResearchAlgorithmId,
  ResearchConfig,
} from '../analysis/v3/types';
import type { LottoDraw } from '../types';

export interface V3PredictionWorkerRequest {
  draws: readonly LottoDraw[];
  historyIndex: number;
  algorithmId: ResearchAlgorithmId;
  config: Partial<ResearchConfig>;
}

export type V3PredictionWorkerReply =
  | { type: 'complete'; prediction: CandidatePrediction }
  | { type: 'error'; message: string };

self.onmessage = (event: MessageEvent<V3PredictionWorkerRequest>) => {
  let reply: V3PredictionWorkerReply;
  try {
    reply = {
      type: 'complete',
      prediction: predictNextCandidates(
        event.data.draws,
        event.data.historyIndex,
        event.data.algorithmId,
        event.data.config,
      ),
    };
  } catch (reason) {
    reply = {
      type: 'error',
      message: reason instanceof Error ? reason.message : 'v3 후보 분석에 실패했어요.',
    };
  }
  self.postMessage(reply);
};
