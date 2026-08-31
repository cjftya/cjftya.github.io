import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react';
import type { BacktestOptions, BacktestResult } from '../analysis/backtest';
import type { LottoDraw } from '../types';

interface BacktestPanelProps {
  draws: readonly LottoDraw[];
}

interface WorkerCompleteMessage {
  type: 'complete';
  result: BacktestResult;
}

interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

interface WorkerProgressMessage {
  type: 'progress';
  completed: number;
  total: number;
  round: number;
}

type WorkerMessage = WorkerCompleteMessage | WorkerErrorMessage | WorkerProgressMessage;

type RoundRangeOption = 'recent-96' | 'recent-192' | 'previous-192' | 'custom';

const POOL_OPTIONS = [10, 12, 15, 18, 20] as const;
const BacktestReport = lazy(() =>
  import('./BacktestReport').then((module) => ({ default: module.BacktestReport })),
);

export const BacktestPanel = memo(function BacktestPanel({
  draws,
}: BacktestPanelProps) {
  const dataAsOfRound = draws.at(-1)?.round ?? 0;
  const previousEndRound = dataAsOfRound - 192;
  const previousStartRound = previousEndRound - 191;
  const [roundRange, setRoundRange] = useState<RoundRangeOption>('recent-96');
  const [customStartRound, setCustomStartRound] = useState(String(previousStartRound));
  const [customEndRound, setCustomEndRound] = useState(String(previousEndRound));
  const [poolSize, setPoolSize] = useState<number>(15);
  const [includeAblation, setIncludeAblation] = useState(true);
  const [generationMode, setGenerationMode] =
    useState<BacktestOptions['generationMode']>('full-enumeration');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<WorkerProgressMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setResult(null);
    setIsRunning(false);
    setProgress(null);
    setError(null);
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [draws]);

  const cancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsRunning(false);
    setProgress(null);
  };

  const run = () => {
    const startRound = Number(customStartRound);
    const endRound = Number(customEndRound);
    if (
      roundRange === 'custom' &&
      (customStartRound.trim() === '' ||
        customEndRound.trim() === '' ||
        !Number.isInteger(startRound) ||
        !Number.isInteger(endRound))
    ) {
      setError('사용자 지정 구간의 시작 회차와 종료 회차를 입력해 주세요.');
      return;
    }

    workerRef.current?.terminate();
    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/backtest.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      workerRef.current = null;
      setIsRunning(false);
      setError('백테스트 Worker를 시작하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    workerRef.current = worker;
    setIsRunning(true);
    setProgress(null);
    setError(null);
    setResult(null);
    const options: Partial<BacktestOptions> = {
      rounds:
        roundRange === 'recent-96'
          ? 96
          : roundRange === 'custom'
            ? Math.max(endRound - startRound + 1, 24)
            : 192,
      rangeMode:
        roundRange === 'previous-192'
          ? 'previous-192'
          : roundRange === 'custom'
            ? 'custom'
            : 'recent',
      startRound: roundRange === 'custom' ? startRound : null,
      endRound: roundRange === 'custom' ? endRound : null,
      poolSize,
      includeAblation,
      generationMode,
      seed: 20260807,
      monteCarloRuns: 32,
    };
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (workerRef.current !== worker) return;
      if (event.data.type === 'progress') {
        setProgress(event.data);
        return;
      }
      setIsRunning(false);
      if (event.data.type === 'complete') setResult(event.data.result);
      else setError(event.data.message);
      worker.terminate();
      workerRef.current = null;
    };
    worker.onerror = () => {
      if (workerRef.current !== worker) return;
      setIsRunning(false);
      setError('백테스트 Worker에서 오류가 발생했어요.');
      worker.terminate();
      workerRef.current = null;
    };
    try {
      worker.postMessage({ draws, options });
    } catch {
      cancel();
      setError('백테스트 요청을 전달하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <section className="analysis-card backtest-card">
      <div className="card-heading">
        <div>
          <span className="card-index">05</span>
          <h2>Walk-forward 진단</h2>
        </div>
        <span>미래 정보 차단 · seed 20260807</span>
      </div>
      <p className="backtest-intro">
        Candidate → Generation → Top-100 → Top-10 손실을 분리하고, 실제 구매 상한인
        Top-10의 5+ tail을 우선 비교해요. 계산은 별도 Worker에서 실행돼 화면을 멈추지
        않아요.
      </p>
      <div className="backtest-controls">
        <label>
          검증 회차
          <select
            value={roundRange}
            onChange={(event) => setRoundRange(event.target.value as RoundRangeOption)}
          >
            <option value="recent-96">최근 96회</option>
            <option value="recent-192">최근 192회</option>
            <option value="previous-192">이전 192회</option>
            <option value="custom">사용자 지정 구간</option>
          </select>
        </label>
        {roundRange === 'previous-192' && (
          <span className="backtest-range-preview">
            자동 {previousStartRound.toLocaleString('ko-KR')}–
            {previousEndRound.toLocaleString('ko-KR')}회
          </span>
        )}
        {roundRange === 'custom' && (
          <div className="backtest-custom-range">
            <label>
              시작 회차
              <input
                type="number"
                min={1}
                max={dataAsOfRound}
                value={customStartRound}
                onChange={(event) => setCustomStartRound(event.target.value)}
                inputMode="numeric"
              />
            </label>
            <label>
              종료 회차
              <input
                type="number"
                min={1}
                max={dataAsOfRound}
                value={customEndRound}
                onChange={(event) => setCustomEndRound(event.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>
        )}
        <label>
          조합 생성
          <select
            value={generationMode}
            onChange={(event) =>
              setGenerationMode(event.target.value as BacktestOptions['generationMode'])
            }
          >
            <option value="current">현재 방식</option>
            <option value="full-enumeration">전수조합 진단</option>
          </select>
        </label>
        <label>
          조합 Pool
          <select
            value={poolSize}
            onChange={(event) => setPoolSize(Number(event.target.value))}
          >
            {POOL_OPTIONS.map((value) => (
              <option key={value} value={value}>
                Top {value}
              </option>
            ))}
          </select>
        </label>
        <label className="backtest-checkbox">
          <input
            type="checkbox"
            checked={includeAblation}
            onChange={(event) => setIncludeAblation(event.target.checked)}
          />
          Ablation 포함
        </label>
        <button
          type="button"
          className="backtest-run"
          disabled={isRunning}
          onClick={run}
        >
          {isRunning ? '계산 중…' : '백테스트 실행'}
        </button>
        {isRunning && (
          <button type="button" className="backtest-run" onClick={cancel}>
            계산 취소
          </button>
        )}
      </div>
      {isRunning && (
        <div className="backtest-running" role="status">
          <i />
          <span>
            Candidate Engine → Combination Engine → Top-10 Portfolio를 순차 검증하고
            있어요.
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
      {result !== null && (
        <Suspense fallback={<p role="status">진단 결과를 표시하고 있어요…</p>}>
          <BacktestReport result={result} />
        </Suspense>
      )}
    </section>
  );
});
