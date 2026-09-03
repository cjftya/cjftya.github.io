import { memo, useEffect, useRef, useState } from 'react';
import type { V3BacktestOptions, V3BacktestResult } from '../analysis/v3/backtest';
import { researchAlgorithmDefinition } from '../analysis/v3/catalog';
import type { MonteCarloSampleSize, ResearchAlgorithmId } from '../analysis/v3/types';
import type { LayoutMode, LottoDraw } from '../types';
import type { V3BacktestWorkerReply } from '../workers/v3-backtest.worker';
import { V3BacktestReport } from './V3BacktestReport';

interface Props {
  draws: readonly LottoDraw[];
  algorithmId: ResearchAlgorithmId;
  layout: LayoutMode;
  sampleSize: MonteCarloSampleSize;
  topFraction: number;
  seed: number;
}

type RangeOption = 'recent-96' | 'recent-192' | 'previous-192' | 'custom';

export const V3BacktestPanel = memo(function V3BacktestPanel({
  draws,
  algorithmId,
  layout,
  sampleSize,
  topFraction,
  seed,
}: Props) {
  const method = researchAlgorithmDefinition(algorithmId);
  const latest = draws.at(-1)?.round ?? 0;
  const [range, setRange] = useState<RangeOption>('recent-96');
  const [customStart, setCustomStart] = useState(String(Math.max(latest - 95, 61)));
  const [customEnd, setCustomEnd] = useState(String(latest));
  const [result, setResult] = useState<V3BacktestResult | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
    round: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
    setProgress(null);
    setRunning(false);
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [algorithmId, draws, layout, sampleSize, seed, topFraction]);

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
    setProgress(null);
  };

  const run = () => {
    const startRound = Number(customStart);
    const endRound = Number(customEnd);
    if (
      range === 'custom' &&
      (!Number.isInteger(startRound) || !Number.isInteger(endRound))
    ) {
      setError('시작 회차와 종료 회차를 정수로 입력해 주세요.');
      return;
    }
    cancel();
    try {
      const worker = new Worker(
        new URL('../workers/v3-backtest.worker.ts', import.meta.url),
        { type: 'module' },
      );
      workerRef.current = worker;
      setRunning(true);
      setResult(null);
      setError(null);
      const options: Partial<V3BacktestOptions> = {
        algorithmId,
        rounds: range === 'recent-96' ? 96 : 192,
        rangeMode:
          range === 'previous-192'
            ? 'previous-192'
            : range === 'custom'
              ? 'custom'
              : 'recent',
        startRound: range === 'custom' ? startRound : null,
        endRound: range === 'custom' ? endRound : null,
        config: {
          seed,
          sampleSize,
          nullSampleSize: Math.min(sampleSize, 20_000),
          topFraction,
          coordinateSystem: layout,
        },
        randomBaselineIterations: 10_000,
        resultBootstrapIterations: 1_000,
      };
      worker.onmessage = (event: MessageEvent<V3BacktestWorkerReply>) => {
        if (workerRef.current !== worker) return;
        if (event.data.type === 'progress') {
          setProgress(event.data);
          return;
        }
        setRunning(false);
        if (event.data.type === 'complete') setResult(event.data.result);
        else setError(event.data.message);
        worker.terminate();
        workerRef.current = null;
      };
      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        setRunning(false);
        setError('v3 백테스트 Worker에서 오류가 발생했어요.');
        worker.terminate();
        workerRef.current = null;
      };
      worker.postMessage({ draws, options });
    } catch {
      cancel();
      setError('v3 백테스트 Worker를 시작하지 못했어요.');
    }
  };

  return (
    <section className="analysis-card backtest-card">
      <div className="card-heading">
        <div>
          <span className="card-index">05</span>
          <h2>Candidate Walk-forward</h2>
        </div>
        <span>미래 정보 차단 · {method.label}</span>
      </div>
      <p className="backtest-intro">
        매 회차 직전 기록만 다시 학습하고 Candidate@K를 같은 크기의 Random Baseline과
        비교해요. 큰 표본과 Ensemble은 시간이 오래 걸릴 수 있어요.
      </p>
      <div className="backtest-controls">
        <label>
          검증 회차
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as RangeOption)}
          >
            <option value="recent-96">최근 96회</option>
            <option value="recent-192">최근 192회</option>
            <option value="previous-192">이전 192회</option>
            <option value="custom">사용자 지정</option>
          </select>
        </label>
        {range === 'custom' && (
          <div className="backtest-custom-range">
            <label>
              시작 회차
              <input
                type="number"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label>
              종료 회차
              <input
                type="number"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        )}
        <span className="backtest-range-preview">
          {sampleSize.toLocaleString('ko-KR')} 조합/회차 · seed {seed}
        </span>
        <button type="button" className="backtest-run" disabled={running} onClick={run}>
          {running ? '검증 중…' : '백테스트 실행'}
        </button>
        {running && (
          <button type="button" className="backtest-run" onClick={cancel}>
            계산 취소
          </button>
        )}
      </div>
      {running && (
        <div className="backtest-running" role="status">
          <i />
          <span>
            {method.label}을 순차 검증하고 있어요.
            {progress !== null && (
              <b>
                {progress.completed}/{progress.total} · {progress.round}회 ·{' '}
                {((progress.completed / progress.total) * 100).toFixed(0)}%
              </b>
            )}
          </span>
        </div>
      )}
      {error !== null && <div className="backtest-error">{error}</div>}
      {result !== null && <V3BacktestReport result={result} />}
    </section>
  );
});
