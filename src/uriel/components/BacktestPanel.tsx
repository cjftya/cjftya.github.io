import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react';
import { algorithmDefinition } from '../analysis/algorithmCatalog';
import type { BacktestOptions, BacktestResult } from '../analysis/backtest';
import type { AlgorithmId, LayoutMode, LottoDraw } from '../types';

interface BacktestPanelProps {
  draws: readonly LottoDraw[];
  algorithmId: AlgorithmId;
  layout: LayoutMode;
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

const BacktestReport = lazy(() =>
  import('./BacktestReport').then((module) => ({ default: module.BacktestReport })),
);

export const BacktestPanel = memo(function BacktestPanel({
  draws,
  algorithmId,
  layout,
}: BacktestPanelProps) {
  const method = algorithmDefinition(algorithmId);
  const dataAsOfRound = draws.at(-1)?.round ?? 0;
  const previousEndRound = dataAsOfRound - 192;
  const previousStartRound = previousEndRound - 191;
  const [roundRange, setRoundRange] = useState<RoundRangeOption>('recent-96');
  const [customStartRound, setCustomStartRound] = useState(String(previousStartRound));
  const [customEndRound, setCustomEndRound] = useState(String(previousEndRound));
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
  }, [draws, algorithmId, layout]);

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

    cancel();
    let worker: Worker;
    try {
      worker = new Worker(new URL('../workers/backtest.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      setError('백테스트 Worker를 시작하지 못했어요. 다시 시도해 주세요.');
      return;
    }
    workerRef.current = worker;
    setIsRunning(true);
    setProgress(null);
    setError(null);
    setResult(null);
    const options: Partial<BacktestOptions> = {
      algorithmId,
      layout,
      rounds:
        roundRange === 'recent-96'
          ? 96
          : roundRange === 'custom'
            ? Math.max(endRound - startRound + 1, 1)
            : 192,
      rangeMode:
        roundRange === 'previous-192'
          ? 'previous-192'
          : roundRange === 'custom'
            ? 'custom'
            : 'recent',
      startRound: roundRange === 'custom' ? startRound : null,
      endRound: roundRange === 'custom' ? endRound : null,
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
          <h2>알고리즘 진단</h2>
        </div>
        <span>미래 정보 차단 · {method.label}</span>
      </div>
      <p className="backtest-intro">
        목록에서 선택한 알고리즘 하나만 Walk-forward로 검증해요. 후보 수별 최고 적중과
        구매 10게임으로 압축할 때의 손실을 같은 화면에서 확인해요.
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
        <span className="backtest-range-preview">
          {layout === 'circle' ? '원형 좌표' : '7 × 7 번호표'}
        </span>
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
            {method.label} 후보 100개와 구매 10게임을 순차 검증하고 있어요.
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
