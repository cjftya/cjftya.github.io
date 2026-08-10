import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findShapeCandidates } from './analysis/candidates';
import { buildCombinationAnalysis } from './analysis/combination';
import { metricsForDraw } from './analysis/geometry';
import { buildHistoryFrame } from './analysis/history';
import {
  buildPurchasePortfolio,
  buildTailCoveragePortfolio,
  diagnosePurchasePortfolio,
} from './analysis/purchase';
import type { PurchaseDiagnostics } from './analysis/purchase';
import { forecastBoardShapeTransitions } from './analysis/shapeTransition';
import {
  describePatternComparison,
  evaluateCandidates,
  similarityFactors,
} from './analysis/validation';
import type { CandidateValidation } from './analysis/validation';
import { MetricChart, metricDefinitions } from './components/MetricChart';
import type { MetricKey } from './components/MetricChart';
import { BacktestPanel } from './components/BacktestPanel';
import { ShapeStage } from './components/ShapeStage';
import { loadBundledDraws, parseDrawCsv } from './data';
import type {
  Candidate,
  CandidateHypothesis,
  CandidateModel,
  HistoryMode,
  LayoutMode,
  LottoDraw,
  PurchasePortfolio,
  PurchaseRole,
  PurchaseStrategy,
} from './types';

const PLAY_INTERVALS = [1200, 700, 350] as const;
const CANDIDATE_COUNTS = [6, 12, 24, 50, 100] as const;
const tierLabel = {
  explore: '탐색',
  focus: '집중',
  confidence: '고확신',
} as const;
const purchaseRoleLabel: Record<PurchaseRole, string> = {
  focus: '집중',
  hypothesis: '가설',
  coverage: '분산',
  anchor: '완결',
};
const hypothesisLabel: Record<CandidateHypothesis, string> = {
  baseline: '최근 흐름',
  transition: '유사 전이',
  ridge: 'Ridge',
  consensus: '모델 합의',
};

const historyModeCopy: Record<HistoryMode, { label: string; description: string }> = {
  independent: {
    label: '독립',
    description: '선택한 한 회차의 도형만 분리해서 봐요.',
  },
  cumulative: {
    label: '누적',
    description: '첫 회차부터 현재까지 같은 비중으로 포개요.',
  },
  decay: {
    label: '감쇠',
    description: '최근 도형일수록 크게, 오래된 도형일수록 작게 반영해요.',
  },
};

export function App() {
  const [draws, setDraws] = useState<LottoDraw[]>([]);
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<LayoutMode>('circle');
  const [historyMode, setHistoryMode] = useState<HistoryMode>('independent');
  const [halfLife, setHalfLife] = useState(18);
  const [metric, setMetric] = useState<MetricKey>('area');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [candidateCount, setCandidateCount] = useState<number>(6);
  const [candidateModel, setCandidateModel] = useState<CandidateModel>('baseline');
  const [purchaseStrategy, setPurchaseStrategy] =
    useState<PurchaseStrategy>('shape-transition');
  const [purchaseAnchor, setPurchaseAnchor] = useState<{
    index: number;
    layout: LayoutMode;
    candidate: Candidate;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState('기본 데이터');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void loadBundledDraws()
      .then((loadedDraws) => {
        if (!active) return;
        setDraws(loadedDraws);
        setIndex(loadedDraws.length - 1);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : '데이터를 불러오지 못했어요.',
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || draws.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= draws.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, PLAY_INTERVALS[speedIndex]);
    return () => window.clearInterval(timer);
  }, [draws.length, isPlaying, speedIndex]);

  const moveTo = useCallback(
    (nextIndex: number) => {
      setIsPlaying(false);
      setIndex(Math.min(Math.max(nextIndex, 0), Math.max(draws.length - 1, 0)));
    },
    [draws.length],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, button, select, textarea')) return;
      if (event.key === 'ArrowLeft') moveTo(index - 1);
      if (event.key === 'ArrowRight') moveTo(index + 1);
      if (event.key === ' ') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, moveTo]);

  const deferredIndex = useDeferredValue(index);
  const draw = draws[index];
  const metrics = useMemo(
    () => (draw === undefined ? null : metricsForDraw(draw, layout)),
    [draw, layout],
  );
  const historyFrame = useMemo(
    () => buildHistoryFrame(draws, index, historyMode, halfLife, layout),
    [draws, halfLife, historyMode, index, layout],
  );
  const hybridCandidateResult = useMemo(
    () =>
      draws.length === 0 || candidateModel !== 'hybrid'
        ? null
        : findShapeCandidates(draws, deferredIndex, layout, 100, 'hybrid'),
    [candidateModel, deferredIndex, draws, layout],
  );
  const baselineCandidateResult = useMemo(
    () =>
      draws.length === 0
        ? null
        : findShapeCandidates(draws, deferredIndex, layout, 100, 'baseline'),
    [deferredIndex, draws, layout],
  );
  const shapeTransitionResult = useMemo(
    () =>
      draws.length === 0 ||
      (candidateModel !== 'shape-transition' && purchaseStrategy !== 'shape-transition')
        ? null
        : findShapeCandidates(draws, deferredIndex, 'board', 100, 'shape-transition'),
    [candidateModel, deferredIndex, draws, purchaseStrategy],
  );
  const shapeForecast = useMemo(
    () =>
      draws.length === 0 ||
      (candidateModel !== 'shape-transition' && purchaseStrategy !== 'shape-transition')
        ? null
        : forecastBoardShapeTransitions(draws, deferredIndex),
    [candidateModel, deferredIndex, draws, purchaseStrategy],
  );
  const candidateResult = useMemo(() => {
    if (candidateModel === 'baseline') return baselineCandidateResult;
    if (candidateModel === 'shape-transition') return shapeTransitionResult;
    return hybridCandidateResult;
  }, [
    baselineCandidateResult,
    candidateModel,
    hybridCandidateResult,
    shapeTransitionResult,
  ]);
  const candidates = useMemo(
    () => candidateResult?.candidates.slice(0, candidateCount) ?? [],
    [candidateCount, candidateResult],
  );
  const candidateLayout: LayoutMode =
    candidateModel === 'shape-transition' ? 'board' : layout;
  const validation = useMemo(() => {
    const actual = draws[deferredIndex + 1];
    if (actual === undefined || candidates.length === 0) return null;
    return evaluateCandidates(candidates, actual, candidateLayout);
  }, [candidateLayout, candidates, deferredIndex, draws]);
  const purchaseResearchResult =
    purchaseStrategy === 'shape-transition'
      ? shapeTransitionResult
      : purchaseStrategy === 'full-hybrid'
        ? null
        : baselineCandidateResult;
  const combinationAnalysis = useMemo(
    () =>
      draws.length === 0 || purchaseStrategy === 'baseline'
        ? null
        : buildCombinationAnalysis(draws, deferredIndex, 15, false),
    [deferredIndex, draws, purchaseStrategy],
  );
  const purchaseResearchCandidates =
    purchaseStrategy === 'full-hybrid'
      ? (combinationAnalysis?.researchByStrategy['full-hybrid'] ?? null)
      : purchaseStrategy === 'shape-transition'
        ? (combinationAnalysis?.researchByStrategy.transition ?? null)
        : (purchaseResearchResult?.candidates ?? null);
  const purchaseLayout: LayoutMode =
    purchaseStrategy === 'shape-transition' || purchaseStrategy === 'full-hybrid'
      ? 'board'
      : layout;
  const activePurchaseAnchor =
    purchaseAnchor?.index === deferredIndex && purchaseAnchor.layout === purchaseLayout
      ? purchaseAnchor.candidate
      : null;
  const purchasePortfolio = useMemo(
    () =>
      purchaseResearchCandidates === null
        ? null
        : purchaseStrategy === 'shape-transition'
          ? buildTailCoveragePortfolio(
              purchaseResearchCandidates,
              purchaseLayout,
              activePurchaseAnchor,
            )
          : buildPurchasePortfolio(
              purchaseResearchCandidates,
              purchaseLayout,
              activePurchaseAnchor,
            ),
    [
      activePurchaseAnchor,
      purchaseLayout,
      purchaseResearchCandidates,
      purchaseStrategy,
    ],
  );
  const purchaseValidation = useMemo(() => {
    const actual = draws[deferredIndex + 1];
    if (actual === undefined || purchasePortfolio === null) return null;
    return evaluateCandidates(purchasePortfolio.games, actual, purchaseLayout);
  }, [deferredIndex, draws, purchaseLayout, purchasePortfolio]);
  const purchaseDiagnostics = useMemo(() => {
    const actual = draws[deferredIndex + 1];
    if (
      actual === undefined ||
      purchasePortfolio === null ||
      purchaseResearchCandidates === null
    ) {
      return null;
    }
    return diagnosePurchasePortfolio(
      purchasePortfolio,
      purchaseResearchCandidates,
      actual.numbers,
    );
  }, [deferredIndex, draws, purchasePortfolio, purchaseResearchCandidates]);

  const handleFile = async (file: File | undefined) => {
    if (file === undefined) return;
    try {
      const nextDraws = parseDrawCsv(await file.text());
      setDraws(nextDraws);
      setIndex(nextDraws.length - 1);
      setSourceLabel(file.name);
      setError(null);
      setIsPlaying(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'CSV를 읽지 못했어요.');
    }
  };

  if (draw === undefined || metrics === null) {
    return (
      <main className="uriel-loading">
        <div className="loading-orbit" />
        <p>{error ?? '회차 데이터를 불러오고 있어요…'}</p>
      </main>
    );
  }

  return (
    <main className="uriel-shell">
      <header className="uriel-header">
        <a className="back-link" href="/" aria-label="Jelly Plants로 돌아가기">
          <span aria-hidden="true">←</span>
          <span>Jelly Plants</span>
        </a>
        <div className="title-lockup">
          <p className="eyebrow">GEOMETRIC LOTTERY LAB</p>
          <h1>Uriel</h1>
          <p>숫자를 도형으로 바꾸고, 시간에 따라 움직이는 형태를 관찰해요.</p>
        </div>
        <div className="dataset-control">
          <span>{sourceLabel}</span>
          <strong>{draws.length.toLocaleString('ko-KR')}개 회차</strong>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            CSV 교체
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            hidden
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      </header>

      {error !== null && (
        <div className="error-banner" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="오류 메시지 닫기"
          >
            ×
          </button>
        </div>
      )}

      <section className="mode-bar" aria-label="시각화 설정">
        <div className="mode-group">
          <span className="control-label">공간</span>
          <div className="segmented-control">
            <ToggleButton
              active={layout === 'circle'}
              onClick={() => setLayout('circle')}
            >
              원형
            </ToggleButton>
            <ToggleButton
              active={layout === 'board'}
              onClick={() => setLayout('board')}
            >
              7 × 7 번호표
            </ToggleButton>
          </div>
        </div>
        <div className="mode-group history-mode-group">
          <span className="control-label">시간 모델</span>
          <div className="segmented-control">
            {(Object.keys(historyModeCopy) as HistoryMode[]).map((mode) => (
              <ToggleButton
                key={mode}
                active={historyMode === mode}
                onClick={() => setHistoryMode(mode)}
              >
                {historyModeCopy[mode].label}
              </ToggleButton>
            ))}
          </div>
          <p>{historyModeCopy[historyMode].description}</p>
        </div>
        {historyMode === 'decay' && (
          <label className="half-life-control">
            <span>반감기</span>
            <input
              type="range"
              min="2"
              max="80"
              value={halfLife}
              onChange={(event) => setHalfLife(Number(event.target.value))}
            />
            <strong>{halfLife}회</strong>
          </label>
        )}
      </section>

      <div className="workspace-grid">
        <section className="visual-panel">
          <div className="round-heading">
            <div>
              <span className="round-kicker">SELECTED DRAW</span>
              <h2>{draw.round.toLocaleString('ko-KR')}회</h2>
              <time>{draw.date}</time>
            </div>
            <NumberRow numbers={draw.numbers} />
          </div>

          <div className="stage-wrap">
            <ShapeStage
              draw={draw}
              frame={historyFrame}
              historyMode={historyMode}
              layout={layout}
            />
            <div className="stage-legend">
              <span>
                <i className="legend-current" />
                선택 회차
              </span>
              {historyMode !== 'independent' && (
                <span>
                  <i className="legend-history" />
                  시간 흔적
                </span>
              )}
              {historyMode !== 'independent' && (
                <span>
                  <i className="legend-center" />
                  가중 중심
                </span>
              )}
            </div>
          </div>

          <Timeline
            draws={draws}
            index={index}
            isPlaying={isPlaying}
            speedIndex={speedIndex}
            onMove={moveTo}
            onTogglePlay={() => {
              if (!isPlaying && index >= draws.length - 1) setIndex(0);
              setIsPlaying((playing) => !playing);
            }}
            onSpeedChange={() =>
              setSpeedIndex((current) => (current + 1) % PLAY_INTERVALS.length)
            }
          />
        </section>

        <aside className="analysis-column">
          <section className="analysis-card metric-card">
            <div className="card-heading">
              <div>
                <span className="card-index">01</span>
                <h2>도형 벡터</h2>
              </div>
              <span>{layout === 'circle' ? '원형 좌표' : '번호표 좌표'}</span>
            </div>
            <div className="metric-grid">
              <Metric label="중심 X" value={signed(metrics.centroidX)} />
              <Metric label="중심 Y" value={signed(metrics.centroidY)} />
              <Metric label="면적" value={metrics.area.toFixed(3)} />
              <Metric label="둘레" value={metrics.perimeter.toFixed(3)} />
              <Metric label="조밀도" value={metrics.compactness.toFixed(3)} />
              <Metric label="방향" value={`${metrics.orientation.toFixed(1)}°`} />
            </div>
          </section>

          <section className="analysis-card trend-card">
            <div className="card-heading">
              <div>
                <span className="card-index">02</span>
                <h2>시간 변화</h2>
              </div>
            </div>
            <div className="metric-tabs" role="tablist" aria-label="변화 지표">
              {(Object.keys(metricDefinitions) as MetricKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={metric === key}
                  className={metric === key ? 'is-active' : undefined}
                  onClick={() => setMetric(key)}
                >
                  {metricDefinitions[key].shortLabel}
                </button>
              ))}
            </div>
            <MetricChart draws={draws} index={index} layout={layout} metric={metric} />
          </section>

          <section className="analysis-card purchase-card">
            <div className="card-heading">
              <div>
                <span className="card-index">03</span>
                <h2>구매용 10게임</h2>
              </div>
              <span>실제 구매 상한 고정</span>
            </div>
            <div className="candidate-model-control purchase-strategy-control">
              <span>선정 방식</span>
              <div className="segmented-control">
                <ToggleButton
                  active={purchaseStrategy === 'full-hybrid'}
                  onClick={() => setPurchaseStrategy('full-hybrid')}
                >
                  조합 Hybrid
                </ToggleButton>
                <ToggleButton
                  active={purchaseStrategy === 'shape-transition'}
                  onClick={() => setPurchaseStrategy('shape-transition')}
                >
                  7×7 형태 전이
                </ToggleButton>
                <ToggleButton
                  active={purchaseStrategy === 'baseline'}
                  onClick={() => setPurchaseStrategy('baseline')}
                >
                  기존 수치 비교
                </ToggleButton>
              </div>
            </div>
            <p className="purchase-intro">
              {purchaseStrategy === 'full-hybrid'
                ? '후보 번호 Top 15와 조합 평가를 분리해요. Number·Pair·Triple·원형·7×7·형태 전이·모델 합의를 조합 단위로 평가한 뒤, 점수와 Coverage·Diversity를 함께 최적화해 10게임을 만들어요.'
                : purchaseStrategy === 'shape-transition'
                  ? '최근 96회 순차 검증에서 가장 나았던 7×7 형태 전이 상위 10게임을 사용해요. 최근 3회 경로와 닮은 과거 흐름의 다음 형태를 세 시나리오로 나눠요.'
                  : '기존 수치 모델의 연구 순위를 유지하면서 Coverage·Diversity로 10게임을 구성해요.'}
            </p>
            {purchasePortfolio?.userAnchorUsed === true && (
              <button
                type="button"
                className="purchase-reset"
                onClick={() => setPurchaseAnchor(null)}
              >
                10번을 자동 고확신으로 복원
              </button>
            )}
            {purchasePortfolio !== null && (
              <>
                <div className="number-pool-summary">
                  <span>우선 번호 18</span>
                  <div>
                    {purchasePortfolio.priorityNumbers.map((number) => (
                      <i
                        key={number}
                        className={
                          purchasePortfolio.coreNumbers.includes(number)
                            ? 'is-core'
                            : undefined
                        }
                      >
                        {number}
                      </i>
                    ))}
                  </div>
                  <small>금색 8개는 모델 공통 지지가 높은 핵심 번호예요.</small>
                  {purchaseStrategy === 'full-hybrid' &&
                    combinationAnalysis !== null && (
                      <small>
                        Candidate Pool 15 · 원시 조합{' '}
                        {combinationAnalysis.rawCombinationCount.toLocaleString(
                          'ko-KR',
                        )}
                        개 · Research Top 100 → Portfolio Top 10
                      </small>
                    )}
                  {purchaseStrategy === 'shape-transition' &&
                    shapeForecast !== null && (
                      <small>
                        과거 유사 경로 {shapeForecast.neighbors}개 · 형태 시나리오{' '}
                        {shapeForecast.scenarios.length}개 · 경로 분리 신뢰{' '}
                        {(shapeForecast.confidence * 100).toFixed(0)}%
                      </small>
                    )}
                </div>
                {purchaseValidation !== null && purchaseDiagnostics !== null && (
                  <PurchaseValidationSummary
                    portfolio={purchasePortfolio}
                    validation={purchaseValidation}
                    diagnostics={purchaseDiagnostics}
                  />
                )}
                {purchaseValidation === null && (
                  <div className="purchase-pending">
                    최신 회차는 결과 전이에요. 10게임은 현재까지 알려진 기록만
                    사용했어요.
                  </div>
                )}
                <ol className="purchase-list">
                  {purchasePortfolio.games.map((candidate, candidateIndex) => {
                    const evaluation = purchaseValidation?.evaluations[candidateIndex];
                    return (
                      <li
                        key={`${candidate.purchaseRole}-${candidate.numbers.join('-')}`}
                        className={
                          candidate.isUserAnchor === true ? 'is-user-anchor' : undefined
                        }
                      >
                        <span className={`purchase-role is-${candidate.purchaseRole}`}>
                          {purchaseRoleLabel[candidate.purchaseRole]}
                        </span>
                        <span className="candidate-rank">
                          {String(candidateIndex + 1).padStart(2, '0')}
                        </span>
                        <NumberRow numbers={candidate.numbers} compact />
                        <span className="purchase-game-detail">
                          <b>
                            {evaluation === undefined
                              ? candidate.hypothesis === undefined
                                ? '도형 포트폴리오'
                                : hypothesisLabel[candidate.hypothesis]
                              : `${evaluation.matchedNumbers.length}/6 일치`}
                          </b>
                          <small>{candidate.reason}</small>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </section>

          <section className="analysis-card candidate-card">
            <div className="card-heading">
              <div>
                <span className="card-index">04</span>
                <h2>연구용 형태 후보</h2>
              </div>
              <div className="candidate-controls">
                <span>
                  고정 {candidateResult?.method.searchSpace.toLocaleString('ko-KR')}{' '}
                  조합
                </span>
                <label>
                  후보 수
                  <select
                    value={candidateCount}
                    onChange={(event) => setCandidateCount(Number(event.target.value))}
                  >
                    {CANDIDATE_COUNTS.map((count) => (
                      <option key={count} value={count}>
                        {count}개
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="candidate-model-control">
              <span>후보 모델</span>
              <div className="segmented-control">
                <ToggleButton
                  active={candidateModel === 'baseline'}
                  onClick={() => setCandidateModel('baseline')}
                >
                  기존 수치
                </ToggleButton>
                <ToggleButton
                  active={candidateModel === 'hybrid'}
                  onClick={() => setCandidateModel('hybrid')}
                >
                  하이브리드
                </ToggleButton>
                <ToggleButton
                  active={candidateModel === 'shape-transition'}
                  onClick={() => {
                    setLayout('board');
                    setCandidateModel('shape-transition');
                  }}
                >
                  7×7 형태 전이
                </ToggleButton>
              </div>
            </div>
            <p className="candidate-intro">
              {candidateModel === 'shape-transition' ? (
                <>
                  최근 3회 형태의 위치·크기·방향·볼록껍질·거리·인접성·행열 엔트로피
                  흐름과 닮은 과거 경로{' '}
                  {candidateResult?.method.shapeSequenceNeighbors ?? 0}개를 찾아, 다음
                  형태를 {candidateResult?.method.shapeScenarioCount ?? 0}개 시나리오로
                  분리해요.
                </>
              ) : candidateModel === 'hybrid' ? (
                <>
                  기존 수치·유사 상태 전이·Ridge 도형 전이를 함께 사용해요. Ridge는 현재
                  시점 이전{' '}
                  {candidateResult?.method.ridgeTrainingSamples.toLocaleString(
                    'ko-KR',
                  ) ?? 0}
                  개 전이만 학습하고, 후보는 탐색·집중·고확신 계층으로 나눠요.
                </>
              ) : (
                <>
                  {draws[deferredIndex]?.round}회까지의 8·24·72회 흐름과 과거 유사 상태{' '}
                  {candidateResult?.method.transitionNeighbors ?? 0}개의 다음 이동만
                  결합한 기준 모델이에요.
                </>
              )}{' '}
              {layout === 'board' && candidateModel !== 'shape-transition'
                ? `7×7 전용 ${candidateResult?.method.featureCount ?? 35}개 특징을 사용해요.`
                : candidateModel === 'shape-transition'
                  ? ' 번호 점수와 섞지 않은 독립 형태 실험이에요.'
                  : '원형 특징을 사용해요.'}
              실제 다음 결과는 후보 순서에 영향을 주지 않고 별도로 비교해요.
            </p>
            {candidateModel === 'shape-transition' && shapeForecast !== null && (
              <div className="shape-scenario-summary">
                {shapeForecast.scenarios.map((scenario, scenarioIndex) => (
                  <div key={`${scenario.label}-${scenarioIndex}`}>
                    <span>예상 {scenarioIndex + 1}</span>
                    <strong>{scenario.label}</strong>
                    <small>
                      가중 {(scenario.probability * 100).toFixed(1)}% · 과거{' '}
                      {scenario.support}건
                    </small>
                  </div>
                ))}
              </div>
            )}
            {validation === null ? (
              <div className="validation-pending">
                <div>
                  <strong>검증 대기 중</strong>
                  <p>최신 회차 다음 결과가 아직 없어 후보만 표시해요.</p>
                </div>
                {index > 0 && (
                  <button type="button" onClick={() => moveTo(index - 1)}>
                    직전 회차 검증 보기
                  </button>
                )}
              </div>
            ) : (
              <ValidationSummary validation={validation} />
            )}
            <ol className="candidate-list">
              {candidates.map((candidate, candidateIndex) => {
                const evaluation = validation?.evaluations[candidateIndex];
                const isPurchaseAnchor =
                  activePurchaseAnchor?.numbers.join('-') ===
                  candidate.numbers.join('-');
                return (
                  <li
                    key={candidate.numbers.join('-')}
                    className={
                      evaluation === validation?.bestByNumbers ||
                      evaluation === validation?.bestByShape
                        ? 'is-result-highlight'
                        : undefined
                    }
                  >
                    <span className="candidate-rank">
                      {String(candidateIndex + 1).padStart(2, '0')}
                    </span>
                    <NumberRow numbers={candidate.numbers} compact />
                    <div className="candidate-result-stats">
                      {evaluation !== undefined && (
                        <span>
                          <b>{evaluation.matchedNumbers.length}/6 일치</b>
                          <b>도형 {evaluation.shapeSimilarity.toFixed(1)}</b>
                        </span>
                      )}
                      <small>
                        {candidate.tier !== undefined
                          ? `${tierLabel[candidate.tier]} · `
                          : ''}
                        예측 Δ {candidate.score.toFixed(3)}
                      </small>
                      <button
                        type="button"
                        className={isPurchaseAnchor ? 'is-selected' : undefined}
                        onClick={() => {
                          setPurchaseStrategy(
                            candidateModel === 'shape-transition'
                              ? 'shape-transition'
                              : 'baseline',
                          );
                          setPurchaseAnchor({
                            index: deferredIndex,
                            layout:
                              candidateModel === 'shape-transition' ? 'board' : layout,
                            candidate,
                          });
                        }}
                      >
                        {isPurchaseAnchor ? '10번 선택됨' : '10번으로 선택'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>

      <BacktestPanel draws={draws} />

      <section className="method-note">
        <span className="card-index">METHOD</span>
        <div>
          <h2>예측기가 아니라 가설을 시험하는 관측 장치예요.</h2>
          <p>
            보너스 번호와 당첨금은 사용하지 않아요. 예측 Δ는 중심·면적·둘레·조밀도·
            퍼짐·방향을 포함하고, 7×7에서는 행·열 분포, 경계, 거리, 볼록껍질, 인접성,
            최소 신장 트리와 대칭성을 함께 비교해요. 조합 공간에 고정된 40,000개를
            탐색해요. 하이브리드는 현재 시점 이전 기록으로만 규제된 도형 전이를
            학습하고, 7×7 형태 전이는 최근 3회 경로와 닮은 과거 경로 뒤의 형태만
            독립적으로 군집화해요. 비교용으로는 기존 수치 상위 10개를 비교 기준으로
            남겨요. 실사용 기본값은 최근 96회 순차 검증에서 기본형과 무작위보다 높았던
            7×7 형태 전이 상위 10개예요. 최근 3회 형태 경로와 닮은 과거 경로 24개의 다음
            형태를 세 시나리오로 군집화하고, 4만 개 고정 조합에서 가까운 형태를 찾아요.
            조합 Hybrid는 후보 번호와 최종 조합 평가를 분리하고 Pair·Triple·원형·7×7·
            형태 전이·모델 합의를 별도 Feature로 유지해요. 상위 10·12·15·18·20 번호군의
            Candidate Recall, Oracle, Research Top-100, Purchase Top-10을 따로 기록하며,
            Top-10은 연구 순위와 Coverage·Diversity를 함께 최적화해요. 전략별
            Walk-forward, Ablation, seed 고정 Random Monte Carlo 결과는 아래 진단에서
            비교할 수 있어요. 실제 결과는 순위를 다시 정하는 데 쓰지 않으며, 독립 무작위
            추첨의 당첨 확률을 높였다고 확정하는 기능은 아니에요.
          </p>
        </div>
      </section>
    </main>
  );
}

function PurchaseValidationSummary({
  portfolio,
  validation,
  diagnostics,
}: {
  portfolio: PurchasePortfolio;
  validation: CandidateValidation;
  diagnostics: PurchaseDiagnostics;
}) {
  return (
    <section className="purchase-validation" aria-label="구매용 10게임 검증 결과">
      <div>
        <span>10게임 최고</span>
        <strong>{diagnostics.purchaseBestMatch}/6</strong>
        <small>예측 {validation.bestByNumbers.rank}번 게임</small>
      </div>
      <div>
        <span>우선 번호 포착</span>
        <strong>{diagnostics.priorityMatches.length}/6</strong>
        <small>
          {diagnostics.priorityMatches.length > 0
            ? diagnostics.priorityMatches.join(', ')
            : '일치 번호 없음'}
        </small>
      </div>
      <div>
        <span>연구 100개 최고</span>
        <strong>{diagnostics.researchBestMatch}/6</strong>
        <small>
          {portfolio.userAnchorUsed ? '10번 직접 선택 반영' : '10번 자동 고확신'}
        </small>
      </div>
      <div className="capture-ceiling">
        <span>번호군 도달 상한</span>
        <div>
          {diagnostics.poolCaptures.map((capture) => (
            <i key={capture.size}>
              <small>상위 {capture.size}</small>
              <b>{capture.matches.length}/6</b>
            </i>
          ))}
        </div>
        <small>
          연구 달성 {(diagnostics.researchEfficiency * 100).toFixed(0)}% · 10게임 보존{' '}
          {(diagnostics.compressionEfficiency * 100).toFixed(0)}%
        </small>
      </div>
      <p className={`is-${diagnostics.bottleneck}`}>{diagnostics.message}</p>
    </section>
  );
}

function ValidationSummary({ validation }: { validation: CandidateValidation }) {
  const numberBest = validation.bestByNumbers;
  const shapeBest = validation.bestByShape;
  return (
    <section className="validation-summary" aria-label="실제 다음 회차 검증 결과">
      <div className="actual-result">
        <div>
          <span>ACTUAL NEXT DRAW</span>
          <strong>{validation.actual.round}회 실제 당첨번호</strong>
        </div>
        <NumberRow numbers={validation.actual.numbers} compact />
      </div>

      <div className="validation-highlights">
        <div>
          <span>최고 번호 일치</span>
          <strong>{numberBest.matchedNumbers.length}/6</strong>
          <small>
            예측 {numberBest.rank}위
            {numberBest.matchedNumbers.length > 0
              ? ` · ${numberBest.matchedNumbers.join(', ')} 일치`
              : ' · 일치 번호 없음'}
          </small>
        </div>
        <div>
          <span>최고 도형 유사도</span>
          <strong>{shapeBest.shapeSimilarity.toFixed(1)}</strong>
          <small>예측 {shapeBest.rank}위 · 순위는 사후 변경하지 않음</small>
        </div>
      </div>

      <div className="validation-detail-grid">
        <div className="factor-panel">
          <h3>실제 도형과 가장 가까운 후보</h3>
          <div className="factor-list">
            {similarityFactors.map((factor) => (
              <div key={factor.key}>
                <span>{factor.label}</span>
                <i>
                  <b
                    style={{
                      width: `${shapeBest.factorSimilarities[factor.key].toFixed(1)}%`,
                    }}
                  />
                </i>
                <strong>{shapeBest.factorSimilarities[factor.key].toFixed(0)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="pattern-panel">
          <h3>번호 패턴 비교 · 예측 {numberBest.rank}위</h3>
          <div className="pattern-table">
            <span />
            <b>후보</b>
            <b>실제</b>
            <span>홀짝</span>
            <strong>
              {numberBest.patterns.oddCount}:{6 - numberBest.patterns.oddCount}
            </strong>
            <strong>
              {validation.actualPatterns.oddCount}:
              {6 - validation.actualPatterns.oddCount}
            </strong>
            <span>저·고</span>
            <strong>
              {numberBest.patterns.lowCount}:{6 - numberBest.patterns.lowCount}
            </strong>
            <strong>
              {validation.actualPatterns.lowCount}:
              {6 - validation.actualPatterns.lowCount}
            </strong>
            <span>합계</span>
            <strong>{numberBest.patterns.sum}</strong>
            <strong>{validation.actualPatterns.sum}</strong>
            <span>연속쌍</span>
            <strong>{numberBest.patterns.consecutivePairs}</strong>
            <strong>{validation.actualPatterns.consecutivePairs}</strong>
            <span>평균 간격</span>
            <strong>{numberBest.patterns.averageGap.toFixed(1)}</strong>
            <strong>{validation.actualPatterns.averageGap.toFixed(1)}</strong>
          </div>
          <p>
            {describePatternComparison(numberBest.patterns, validation.actualPatterns)}
          </p>
        </div>
      </div>

      <div className="match-distribution">
        <div>
          <h3>번호 일치 분포</h3>
          <p>무작위 기대는 같은 수의 고정 후보가 균등 추첨과 만난 평균값이에요.</p>
        </div>
        <div className="distribution-grid">
          {validation.matchDistribution.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <strong>{row.observed}</strong>
              <small>무작위 {row.expected.toFixed(1)}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : undefined}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberRow({
  numbers,
  compact = false,
}: {
  numbers: readonly number[];
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? 'number-row is-compact' : 'number-row'}
      aria-label={numbers.join(', ')}
    >
      {numbers.map((number) => (
        <span key={number} data-band={Math.min(Math.floor((number - 1) / 10), 4)}>
          {number}
        </span>
      ))}
    </div>
  );
}

function Timeline({
  draws,
  index,
  isPlaying,
  speedIndex,
  onMove,
  onTogglePlay,
  onSpeedChange,
}: {
  draws: readonly LottoDraw[];
  index: number;
  isPlaying: boolean;
  speedIndex: number;
  onMove: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: () => void;
}) {
  return (
    <div className="timeline-panel">
      <div className="playback-controls">
        <button type="button" onClick={() => onMove(0)} aria-label="첫 회차">
          ⇤
        </button>
        <button type="button" onClick={() => onMove(index - 1)} aria-label="이전 회차">
          ←
        </button>
        <button
          type="button"
          className="play-button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? '재생 멈춤' : '시간 변화 재생'}
        >
          {isPlaying ? 'Ⅱ' : '▶'}
        </button>
        <button type="button" onClick={() => onMove(index + 1)} aria-label="다음 회차">
          →
        </button>
        <button
          type="button"
          onClick={() => onMove(draws.length - 1)}
          aria-label="마지막 회차"
        >
          ⇥
        </button>
      </div>
      <div className="timeline-track">
        <div className="timeline-labels">
          <span>{draws[0]?.round}회</span>
          <strong>{draws[index]?.round}회</strong>
          <span>{draws.at(-1)?.round}회</span>
        </div>
        <input
          type="range"
          min="0"
          max={draws.length - 1}
          value={index}
          aria-label="회차 타임라인"
          onChange={(event) => onMove(Number(event.target.value))}
        />
      </div>
      <button
        type="button"
        className="speed-button"
        onClick={onSpeedChange}
        aria-label="재생 속도 변경"
      >
        {speedIndex + 1}×
      </button>
    </div>
  );
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}
