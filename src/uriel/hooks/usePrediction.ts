import { useEffect, useRef, useState } from 'react';
import type { LottoDraw } from '../types';
import type {
  PredictionRequest,
  PredictionSnapshot,
} from '../analysis/predictionTypes';
import { predictionKey } from '../analysis/predictionTypes';
import { PredictionClient } from '../workers/PredictionClient';

interface PredictionState {
  draws: readonly LottoDraw[];
  key: string | null;
  snapshot: PredictionSnapshot | null;
  error: string | null;
}

export function usePrediction(
  draws: readonly LottoDraw[],
  request: PredictionRequest,
  paused: boolean,
) {
  const clientRef = useRef<PredictionClient | null>(null);
  const [state, setState] = useState<PredictionState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { index, layout, candidateModel, purchaseStrategy } = request;
  const key = predictionKey(request);

  useEffect(() => {
    let worker: Worker | undefined;
    try {
      worker = new Worker(new URL('../workers/prediction.worker.ts', import.meta.url), {
        type: 'module',
      });
      const client = new PredictionClient(worker, draws, (request, reply) => {
        setState({
          draws,
          key: predictionKey(request),
          snapshot: reply.type === 'complete' ? reply.snapshot : null,
          error: reply.type === 'error' ? reply.message : null,
        });
      });
      clientRef.current = client;
      return () => {
        client.dispose();
        clientRef.current = null;
      };
    } catch {
      worker?.terminate();
      setState({
        draws,
        key: null,
        snapshot: null,
        error: '분석 Worker를 시작하지 못했어요. 다시 시도해 주세요.',
      });
    }
  }, [draws, attempt]);

  useEffect(() => {
    if (paused) clientRef.current?.pause();
    else
      clientRef.current?.request({ index, layout, candidateModel, purchaseStrategy });
  }, [draws, attempt, index, layout, candidateModel, purchaseStrategy, paused]);

  const current =
    !paused && state?.draws === draws && (state.key === key || state.key === null)
      ? state
      : null;
  return {
    snapshot: current?.snapshot ?? null,
    error: current?.error ?? null,
    retry: () => {
      setState(null);
      setAttempt((value) => value + 1);
    },
  };
}
