import { memo, useMemo, useState } from 'react';
import {
  buildPurchasePortfolio,
  buildTailCoveragePortfolio,
  diagnosePurchasePortfolio,
} from '../analysis/purchase';
import { evaluateCandidates } from '../analysis/validation';
import { usePrediction } from '../hooks/usePrediction';
import type {
  Candidate,
  CandidateHypothesis,
  CandidateModel,
  LayoutMode,
  LottoDraw,
  PurchaseRole,
  PurchaseStrategy,
} from '../types';
import { NumberRow, ToggleButton } from './DisplayPrimitives';
import { PurchaseValidationSummary, ValidationSummary } from './PredictionValidation';

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

interface PredictionPanelsProps {
  draws: readonly LottoDraw[];
  index: number;
  layout: LayoutMode;
  isPlaying: boolean;
  onLayoutChange: (layout: LayoutMode) => void;
  onMove: (index: number) => void;
}

export const PredictionPanels = memo(function PredictionPanels({
  draws,
  index,
  layout,
  isPlaying,
  onLayoutChange: setLayout,
  onMove: moveTo,
}: PredictionPanelsProps) {
  const [candidateCount, setCandidateCount] = useState<number>(6);
  const [candidateModel, setCandidateModel] = useState<CandidateModel>('baseline');
  const [purchaseStrategy, setPurchaseStrategy] =
    useState<PurchaseStrategy>('shape-transition');
  const [purchaseAnchor, setPurchaseAnchor] = useState<{
    draws: readonly LottoDraw[];
    index: number;
    layout: LayoutMode;
    candidate: Candidate;
  } | null>(null);

  const { snapshot, error, retry } = usePrediction(
    draws,
    { index, layout, candidateModel, purchaseStrategy },
    isPlaying,
  );
  const candidateResult = snapshot?.candidateResult ?? null;
  const shapeForecast = snapshot?.shapeForecast ?? null;
  const purchaseResearchCandidates = snapshot?.purchaseResearchCandidates ?? null;
  const candidates = useMemo(
    () => candidateResult?.candidates.slice(0, candidateCount) ?? [],
    [candidateResult, candidateCount],
  );
  const candidateLayout = candidateModel === 'shape-transition' ? 'board' : layout;
  const validation = useMemo(() => {
    const actual = draws[index + 1];
    return actual && candidates.length
      ? evaluateCandidates(candidates, actual, candidateLayout)
      : null;
  }, [draws, index, candidates, candidateLayout]);
  const purchaseLayout: LayoutMode =
    purchaseStrategy === 'shape-transition' || purchaseStrategy === 'full-hybrid'
      ? 'board'
      : layout;
  const activePurchaseAnchor =
    purchaseAnchor?.draws === draws &&
    purchaseAnchor.index === index &&
    purchaseAnchor.layout === purchaseLayout
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
    const actual = draws[index + 1];
    if (actual === undefined || purchasePortfolio === null) return null;
    return evaluateCandidates(purchasePortfolio.games, actual, purchaseLayout);
  }, [index, draws, purchaseLayout, purchasePortfolio]);
  const purchaseDiagnostics = useMemo(() => {
    const actual = draws[index + 1];
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
  }, [index, draws, purchasePortfolio, purchaseResearchCandidates]);

  const status =
    snapshot === null ? (
      <div className="analysis-progress" role={error ? 'alert' : 'status'}>
        <span>
          {error ??
            (isPlaying
              ? '재생 중에는 도형만 표시해요. 멈추면 선택 회차의 후보를 계산해요.'
              : `${draws[index]?.round}회 기준 후보를 계산하고 있어요. 회차 이동은 계속할 수 있어요.`)}
        </span>
        {error && (
          <button type="button" onClick={retry}>
            분석 다시 시도
          </button>
        )}
      </div>
    ) : null;
  return (
    <>
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
        {status}
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
              {purchaseStrategy === 'full-hybrid' && snapshot !== null && (
                <small>
                  Candidate Pool 15 · 원시 조합{' '}
                  {snapshot.rawCombinationCount.toLocaleString('ko-KR')}개 · Research
                  Top 100 → Portfolio Top 10
                </small>
              )}
              {purchaseStrategy === 'shape-transition' && shapeForecast !== null && (
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
                최신 회차는 결과 전이에요. 10게임은 현재까지 알려진 기록만 사용했어요.
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
              고정 {candidateResult?.method.searchSpace.toLocaleString('ko-KR')} 조합
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
        {status}
        {snapshot !== null && (
          <>
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
                  {draws[index]?.round}회까지의 8·24·72회 흐름과 과거 유사 상태{' '}
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
                            draws,
                            index: index,
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
          </>
        )}
      </section>
    </>
  );
});
