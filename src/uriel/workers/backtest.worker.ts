/// <reference lib="webworker" />

import { runWalkForwardBacktest } from '../analysis/backtest';
import type { BacktestOptions } from '../analysis/backtest';
import type { LottoDraw } from '../types';

interface BacktestRequest {
  draws: LottoDraw[];
  options: Partial<BacktestOptions>;
}

self.onmessage = (event: MessageEvent<BacktestRequest>) => {
  try {
    const result = runWalkForwardBacktest(
      event.data.draws,
      event.data.options,
      (completed, total, round) => {
        self.postMessage({ type: 'progress', completed, total, round });
      },
    );
    self.postMessage({ type: 'complete', result });
  } catch (reason) {
    self.postMessage({
      type: 'error',
      message:
        reason instanceof Error ? reason.message : '백테스트를 완료하지 못했어요.',
    });
  }
};

export {};
