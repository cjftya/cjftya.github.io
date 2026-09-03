import { useEffect, useState } from 'react';
import type {
  CandidatePrediction,
  ResearchAlgorithmId,
  ResearchConfig,
} from '../analysis/v3/types';
import type { LottoDraw } from '../types';
import type { V3PredictionWorkerReply } from '../workers/v3-prediction.worker';

interface PredictionState {
  prediction: CandidatePrediction | null;
  error: string | null;
}

export function useV3Prediction(
  draws: readonly LottoDraw[],
  historyIndex: number,
  algorithmId: ResearchAlgorithmId,
  config: Partial<ResearchConfig>,
  paused: boolean,
): PredictionState {
  const [state, setState] = useState<PredictionState>({
    prediction: null,
    error: null,
  });
  const {
    seed,
    sampleSize,
    nullSampleSize,
    topFraction,
    coordinateSystem,
    bootstrapIterations,
    permutationIterations,
  } = config;

  useEffect(() => {
    if (paused) {
      setState({ prediction: null, error: null });
      return;
    }
    setState({ prediction: null, error: null });
    let worker: Worker | null = null;
    const timer = window.setTimeout(() => {
      try {
        worker = new Worker(
          new URL('../workers/v3-prediction.worker.ts', import.meta.url),
          { type: 'module' },
        );
        worker.onmessage = (event: MessageEvent<V3PredictionWorkerReply>) => {
          if (event.data.type === 'complete') {
            setState({ prediction: event.data.prediction, error: null });
          } else {
            setState({ prediction: null, error: event.data.message });
          }
          worker?.terminate();
          worker = null;
        };
        worker.onerror = () => {
          setState({
            prediction: null,
            error: 'v3 분석 Worker에서 오류가 발생했어요.',
          });
          worker?.terminate();
          worker = null;
        };
        worker.postMessage({
          draws,
          historyIndex,
          algorithmId,
          config: {
            seed,
            sampleSize,
            nullSampleSize,
            topFraction,
            coordinateSystem,
            bootstrapIterations,
            permutationIterations,
          },
        });
      } catch {
        worker?.terminate();
        worker = null;
        setState({ prediction: null, error: 'v3 분석 Worker를 시작하지 못했어요.' });
      }
    }, 80);
    return () => {
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [
    algorithmId,
    bootstrapIterations,
    coordinateSystem,
    draws,
    historyIndex,
    nullSampleSize,
    paused,
    permutationIterations,
    sampleSize,
    seed,
    topFraction,
  ]);
  return state;
}
