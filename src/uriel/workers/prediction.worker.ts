import { createPredictionSession } from '../analysis/predictionSession';
import type {
  PredictionWorkerRequest,
  PredictionWorkerReply,
} from './predictionProtocol';

let analyze: ReturnType<typeof createPredictionSession> | null = null;
self.onmessage = (event: MessageEvent<PredictionWorkerRequest>) => {
  const message = event.data;
  if (message.type === 'init') {
    analyze = createPredictionSession(message.draws);
    return;
  }
  let reply: PredictionWorkerReply;
  try {
    if (!analyze) throw new Error('회차 데이터를 먼저 불러와 주세요.');
    reply = { type: 'complete', id: message.id, snapshot: analyze(message.request) };
  } catch (reason) {
    reply = {
      type: 'error',
      id: message.id,
      message: reason instanceof Error ? reason.message : '후보 분석에 실패했어요.',
    };
  }
  self.postMessage(reply);
};
