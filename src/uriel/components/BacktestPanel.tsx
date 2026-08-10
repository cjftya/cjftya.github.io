import { useEffect, useRef, useState } from 'react';
import type {
  BacktestOptions,
  BacktestResult,
  BacktestStrategy,
  FailureCase,
  StrategySummary,
} from '../analysis/backtest';
import { strategyLabels } from '../analysis/backtest';
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
const ABLATION_KEYS = new Set<BacktestStrategy>([
  'full-no-pair',
  'full-no-triple',
  'full-no-shape',
  'full-no-transition',
  'full-no-diversity',
]);

export function BacktestPanel({ draws }: BacktestPanelProps) {
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

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

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
    const worker = new Worker(
      new URL('../workers/backtest.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    workerRef.current = worker;
    setIsRunning(true);
    setProgress(null);
    setError(null);
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
      setIsRunning(false);
      setError('백테스트 Worker에서 오류가 발생했어요.');
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage({ draws, options });
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
      {result !== null && <BacktestReport result={result} />}
    </section>
  );
}

function BacktestReport({ result }: { result: BacktestResult }) {
  const main = result.strategies.filter(({ strategy }) => !ABLATION_KEYS.has(strategy));
  const ablation = result.strategies.filter(({ strategy }) =>
    ABLATION_KEYS.has(strategy),
  );
  const bestCombination = result.strategies.find(
    ({ strategy }) => strategy === result.bestCombinationStrategy,
  );
  const transition = result.strategies.find(
    ({ strategy }) => strategy === 'transition',
  );
  const best =
    bestCombination ??
    result.strategies.find(({ strategy }) => strategy === result.bestStrategy)!;

  return (
    <div className="backtest-report">
      <div className="backtest-verdict">
        <span className={`bottleneck is-${result.bottleneck}`}>
          {result.bottleneck === 'candidate-engine'
            ? 'Candidate 병목'
            : result.bottleneck === 'combination-engine'
              ? 'Combination 병목'
              : '혼합 병목'}
        </span>
        <div>
          <strong>{result.bottleneckMessage}</strong>
          <p>
            {result.startRound.toLocaleString('ko-KR')}–
            {result.endRound.toLocaleString('ko-KR')}회 · {result.evaluatedRounds}회
            검증 · 최고 전략 {strategyLabels[result.bestStrategy]}
          </p>
        </div>
        <button type="button" onClick={() => downloadResult(result)}>
          JSON 저장
        </button>
      </div>

      <ReportSection
        title="Candidate Pool Recall"
        copy="최종 조합 전에 실제 6개가 Pool에 얼마나 들어왔는지 봐요."
      >
        <div className="table-scroll">
          <table className="backtest-table recall-table">
            <thead>
              <tr>
                <th>Pool</th>
                {[0, 1, 2, 3, 4, 5, 6].map((hit) => (
                  <th key={hit}>{hit}개</th>
                ))}
                <th>평균</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              {result.recall.map((row) => (
                <tr
                  key={row.poolSize}
                  className={
                    row.poolSize === result.options.poolSize ? 'is-active' : undefined
                  }
                >
                  <th>Top {row.poolSize}</th>
                  {row.distribution.map((count, hit) => (
                    <td key={hit}>{cell(count, result.evaluatedRounds)}</td>
                  ))}
                  <td>{row.average.toFixed(2)}</td>
                  <td className="tail-cell">{percent(row.atLeastFourRate)}</td>
                  <td className="tail-cell">{percent(row.atLeastFiveRate)}</td>
                  <td className="tail-cell">{percent(row.allSixRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {transition?.pipeline !== undefined && (
        <ReportSection
          title="Candidate → Transition Pipeline"
          copy="현재 Shape Transition의 Candidate → Generation → Top-100 → Final Top-10 단계별 4+/5+/6 보존 횟수예요."
        >
          <div className="table-scroll">
            <table className="backtest-table pipeline-table">
              <thead>
                <tr>
                  <th>기준</th>
                  <th>Candidate</th>
                  <th>Generation</th>
                  <th>Top-100</th>
                  <th>Top-10</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['4+', transition.pipeline.fourPlus],
                    ['5+', transition.pipeline.fivePlus],
                    ['6', transition.pipeline.six],
                  ] as const
                ).map(([label, pipeline]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{pipeline.candidateOpportunities}</td>
                    <td>{pipeline.generationSuccesses}</td>
                    <td>{pipeline.top100Successes}</td>
                    <td className="tail-cell">{pipeline.top10Successes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      <ReportSection
        title="Transition Tail Coverage"
        copy="상위 7게임을 보존하고 31–80위에서 번호 중복이 낮은 3게임을 추가한 Before / After예요."
      >
        <div className="table-scroll">
          <table className="backtest-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>평균 Max</th>
                <th>3+</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Before', result.portfolioExperiment.before],
                  ['After', result.portfolioExperiment.after],
                ] as const
              ).map(([label, summary]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{summary.averageMaxHit.toFixed(3)}</td>
                  <td>{percent(summary.threePlusRate)}</td>
                  <td>{percent(summary.fourPlusRate)}</td>
                  <td className="tail-cell">{percent(summary.fivePlusRate)}</td>
                  <td>{percent(summary.sixRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          개선 {result.portfolioExperiment.improvedRounds}회 · 유지{' '}
          {result.portfolioExperiment.unchangedRounds}회 · 악화{' '}
          {result.portfolioExperiment.worsenedRounds}회
        </p>
      </ReportSection>

      {result.options.generationMode === 'full-enumeration' &&
        result.fiveHitOpportunities.length > 0 && (
          <ReportSection
            title={`5-hit Opportunity ${result.fiveHitOpportunities.length}회`}
            copy="Candidate Recall 5+ 회차의 전략별 Best 5-hit Rank를 전수조합에서 확인해요."
          >
            <div className="opportunity-list">
              {result.fiveHitOpportunities.map((opportunity) => (
                <details key={opportunity.round}>
                  <summary>
                    <b>{opportunity.round}회</b>
                    <span>
                      Candidate {opportunity.candidateRecall} → Generation{' '}
                      {opportunity.generationMaxHit} → Transition Top-100{' '}
                      {opportunity.strategies.transition?.top100MaxHit ?? '—'} → Top-10{' '}
                      {opportunity.strategies.transition?.top10MaxHitBefore ?? '—'} /{' '}
                      {opportunity.strategies.transition?.top10MaxHit ?? '—'}
                    </span>
                  </summary>
                  <div className="table-scroll">
                    <table className="backtest-table">
                      <thead>
                        <tr>
                          <th>Strategy</th>
                          <th>Best 5 Rank</th>
                          <th>Score</th>
                          <th>Top-100</th>
                          <th>Top-10 Before</th>
                          <th>Top-10 After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(opportunity.strategies).map(
                          ([strategy, diagnostic]) => (
                            <tr key={strategy}>
                              <th>{strategyLabels[strategy as BacktestStrategy]}</th>
                              <td>
                                {diagnostic?.rankOfBest5HitCombination?.toLocaleString(
                                  'ko-KR',
                                ) ?? '—'}
                              </td>
                              <td>
                                {diagnostic?.scoreOfBest5HitCombination?.toFixed(4) ??
                                  '—'}
                              </td>
                              <td>{diagnostic?.top100MaxHit ?? '—'}</td>
                              <td>{diagnostic?.top10MaxHitBefore ?? '—'}</td>
                              <td>{diagnostic?.top10MaxHit ?? '—'}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </ReportSection>
        )}

      <ReportSection
        title="Top-10 Hit Distribution"
        copy="평균보다 4+·5+·6 tail을 우선해 전략을 정렬해요."
      >
        <StrategyTable
          rows={main}
          total={result.evaluatedRounds}
          best={result.bestStrategy}
        />
      </ReportSection>

      <ReportSection
        title="Oracle → Top-10 Conversion"
        copy={`${best.label}이 후보 Pool 안의 번호를 실제 10게임에 얼마나 살렸는지 보여줘요.`}
      >
        <div className="conversion-grid">
          <Conversion label="Oracle 4 → 4+" value={best.conversion.oracle4To4} />
          <Conversion label="Oracle 5 → 4+" value={best.conversion.oracle5To4} />
          <Conversion label="Oracle 5 → 5" value={best.conversion.oracle5To5} />
          <Conversion label="Oracle 6 → 4+" value={best.conversion.oracle6To4} />
          <Conversion label="Oracle 6 → 5+" value={best.conversion.oracle6To5} />
          <Conversion label="Oracle 6 → 6" value={best.conversion.oracle6To6} />
          <div className="conversion-stat is-loss">
            <span>평균 Conversion Loss</span>
            <strong>{best.conversion.averageLoss.toFixed(2)}</strong>
            <small>Oracle − Top-10 Max</small>
          </div>
        </div>
      </ReportSection>

      {ablation.length > 0 && (
        <ReportSection
          title="Ablation"
          copy="Feature나 Diversity를 뺐을 때 4+가 좋아지면 제거 후보예요."
        >
          <StrategyTable
            rows={[best, ...ablation]}
            total={result.evaluatedRounds}
            best={result.bestCombinationStrategy}
            compact
          />
        </ReportSection>
      )}

      <ReportSection
        title="실패 사례"
        copy="후보 실패, 조합 전환 실패, 4+ 성공을 분리해 최근 사례를 추출해요."
      >
        <div className="failure-grid">
          <FailureList
            title="A · Strategy Oracle ≥ 5 / Top-10 ≤ 3"
            rows={result.failures.combinationLoss}
          />
          <FailureList
            title="B · Candidate Recall ≤ 3"
            rows={result.failures.candidateFailure}
          />
          <FailureList title="C · Top-10 ≥ 4" rows={result.failures.success} />
        </div>
      </ReportSection>

      <ReportSection
        title="회차별 파이프라인"
        copy="Candidate → Generation → Research Top-100 → Purchase Top-10 손실을 단계별로 확인해요."
      >
        <div className="table-scroll">
          <table className="backtest-table round-table">
            <thead>
              <tr>
                <th>회차</th>
                <th>Recall {result.options.poolSize}</th>
                <th>Generation</th>
                <th>Legacy Oracle</th>
                <th>Top-100</th>
                <th>Top-10</th>
                <th>G / R / C Loss</th>
              </tr>
            </thead>
            <tbody>
              {result.rounds
                .slice(-24)
                .reverse()
                .map((round) => {
                  const row = round.strategies[result.bestCombinationStrategy]!;
                  return (
                    <tr key={round.round}>
                      <th>{round.round.toLocaleString('ko-KR')}</th>
                      <td
                        title={formatMatches(
                          round.candidateMatches[result.options.poolSize],
                        )}
                      >
                        {round.candidateRecall[result.options.poolSize]}
                      </td>
                      <td title={formatMatches(round.combinationGenerationMatches)}>
                        {round.combinationGenerationMaxHit}
                      </td>
                      <td title={formatMatches(round.legacyOracleMatches)}>
                        {round.legacyOracleMax}
                      </td>
                      <td>{row.top100Max}</td>
                      <td className={row.top10Max >= 4 ? 'tail-cell' : undefined}>
                        {row.top10Max}
                      </td>
                      <td>
                        {round.generationLoss} / {row.rankingLoss ?? '—'} /{' '}
                        {row.finalCompressionLoss}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </ReportSection>
      <p className="backtest-caveat">
        로또 추첨은 무작위로 간주해요. 이 결과는 과거 Walk-forward 비교이며 미래 당첨을
        보장하지 않아요. 희귀한 4–6개 적중은 표본 변동이 커 Random ×{' '}
        {result.options.monteCarloRuns} 반복과 함께 해석해야 해요.
      </p>
    </div>
  );
}

function StrategyTable({
  rows,
  total,
  best,
  compact = false,
}: {
  rows: readonly StrategySummary[];
  total: number;
  best: BacktestStrategy;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className={`backtest-table strategy-table${compact ? ' is-compact' : ''}`}>
        <thead>
          <tr>
            <th>Strategy</th>
            {!compact && [0, 1, 2, 3, 4, 5, 6].map((hit) => <th key={hit}>{hit}</th>)}
            <th>평균 Max</th>
            <th>3+</th>
            <th>4+</th>
            <th>5+</th>
            <th>6</th>
            <th>Optimizer ↑</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.strategy}
              className={row.strategy === best ? 'is-best' : undefined}
            >
              <th>{row.label}</th>
              {!compact &&
                row.hitDistribution.map((count, hit) => (
                  <td key={hit}>{cell(count, total)}</td>
                ))}
              <td>{row.averageMaxHit.toFixed(2)}</td>
              <td>{percent(row.threePlusRate)}</td>
              <td className="tail-cell">{percent(row.fourPlusRate)}</td>
              <td className="tail-cell">{percent(row.fivePlusRate)}</td>
              <td className="tail-cell">{percent(row.sixRate)}</td>
              <td>{row.portfolioImprovementRounds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSection({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="backtest-section">
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      {children}
    </section>
  );
}

function Conversion({
  label,
  value,
}: {
  label: string;
  value: { eligible: number; successes: number; rate: number };
}) {
  return (
    <div className="conversion-stat">
      <span>{label}</span>
      <strong>{value.eligible === 0 ? '—' : percent(value.rate)}</strong>
      <small>
        {value.successes} / {value.eligible}회
      </small>
    </div>
  );
}

function FailureList({ title, rows }: { title: string; rows: readonly FailureCase[] }) {
  return (
    <div className="failure-list">
      <h4>{title}</h4>
      {rows.length === 0 ? (
        <p>해당 사례 없음</p>
      ) : (
        <ul>
          {rows
            .slice(-8)
            .reverse()
            .map((row) => (
              <li key={row.round}>
                <b>{row.round}회</b>
                <span>
                  R {row.candidateRecall} · G {row.generationMaxHit} · 100{' '}
                  {row.top100Max} · 10 {row.top10Max}
                </span>
                <small>
                  Loss {row.generationLoss} / {row.rankingLoss ?? '—'} /{' '}
                  {row.finalCompressionLoss} · Candidate [
                  {formatMatches(row.candidateMatches)}]
                </small>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function downloadResult(result: BacktestResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `uriel-backtest-${result.startRound}-${result.endRound}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function cell(count: number, total: number): string {
  const rounded = Number.isInteger(count) ? String(count) : count.toFixed(1);
  return `${rounded} (${((count / Math.max(total, 1)) * 100).toFixed(1)}%)`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMatches(numbers: readonly number[] | undefined): string {
  return numbers?.join(', ') || '없음';
}
