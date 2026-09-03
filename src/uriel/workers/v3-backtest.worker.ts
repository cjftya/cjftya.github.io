import {
  runV3WalkForwardBacktest,
  type V3BacktestOptions,
  type V3BacktestResult,
} from '../analysis/v3/backtest';
import type { LottoDraw } from '../types';

interface Request {
  draws: readonly LottoDraw[];
  options: Partial<V3BacktestOptions>;
}

export type V3BacktestWorkerReply =
  | { type: 'progress'; completed: number; total: number; round: number }
  | { type: 'complete'; result: V3BacktestResult }
  | { type: 'error'; message: string };

self.onmessage = (event: MessageEvent<Request>) => {
  try {
    const result = runV3WalkForwardBacktest(
      event.data.draws,
      event.data.options,
      (completed, total, round) => {
        const reply: V3BacktestWorkerReply = {
          type: 'progress',
          completed,
          total,
          round,
        };
        self.postMessage(reply);
      },
    );
    const reply: V3BacktestWorkerReply = { type: 'complete', result };
    self.postMessage(reply);
  } catch (reason) {
    const reply: V3BacktestWorkerReply = {
      type: 'error',
      message: reason instanceof Error ? reason.message : 'v3 백테스트에 실패했어요.',
    };
    self.postMessage(reply);
  }
};
