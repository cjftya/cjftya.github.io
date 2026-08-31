import { memo, useMemo, useState } from 'react';
import {
  algorithmDefinition,
  algorithmDefinitions,
} from '../analysis/algorithmCatalog';
import {
  buildPurchasePortfolio,
  diagnosePurchasePortfolio,
} from '../analysis/purchase';
import { evaluateCandidates } from '../analysis/validation';
import { usePrediction } from '../hooks/usePrediction';
import type {
  AlgorithmId,
  Candidate,
  LayoutMode,
  LottoDraw,
  PurchaseRole,
} from '../types';
import { NumberRow } from './DisplayPrimitives';
import { PurchaseValidationSummary, ValidationSummary } from './PredictionValidation';

const CANDIDATE_COUNTS = [6, 12, 24, 50, 100] as const;
const purchaseRoleLabel: Record<PurchaseRole, string> = {
  focus: '집중',
  hypothesis: '가설',
  coverage: '분산',
  anchor: '완결',
};

interface PredictionPanelsProps {
  draws: readonly LottoDraw[];
  index: number;
  layout: LayoutMode;
  algorithmId: AlgorithmId;
  isPlaying: boolean;
  onAlgorithmChange: (algorithmId: AlgorithmId) => void;
  onMove: (index: number) => void;
}

export const PredictionPanels = memo(function PredictionPanels({
  draws,
  index,
  layout,
  algorithmId,
  isPlaying,
  onAlgorithmChange,
  onMove: moveTo,
}: PredictionPanelsProps) {
  const [candidateCount, setCandidateCount] = useState<number>(6);
  const [purchaseAnchor, setPurchaseAnchor] = useState<{
    draws: readonly LottoDraw[];
    index: number;
    layout: LayoutMode;
    algorithmId: AlgorithmId;
    candidate: Candidate;
  } | null>(null);
  const method = algorithmDefinition(algorithmId);
  const { snapshot, error, retry } = usePrediction(
    draws,
    { index, layout, algorithmId },
    isPlaying,
  );
  const candidateResult = snapshot?.candidateResult ?? null;
  const purchaseResearchCandidates = snapshot?.purchaseResearchCandidates ?? null;
  const candidates = useMemo(
    () => candidateResult?.candidates.slice(0, candidateCount) ?? [],
    [candidateResult, candidateCount],
  );
  const validation = useMemo(() => {
    const actual = draws[index + 1];
    return actual && candidates.length
      ? evaluateCandidates(candidates, actual, layout)
      : null;
  }, [draws, index, candidates, layout]);
  const activePurchaseAnchor =
    purchaseAnchor?.draws === draws &&
    purchaseAnchor.index === index &&
    purchaseAnchor.layout === layout &&
    purchaseAnchor.algorithmId === algorithmId
      ? purchaseAnchor.candidate
      : null;
  const purchasePortfolio = useMemo(
    () =>
      purchaseResearchCandidates === null
        ? null
        : buildPurchasePortfolio(
            purchaseResearchCandidates,
            layout,
            activePurchaseAnchor,
          ),
    [activePurchaseAnchor, layout, purchaseResearchCandidates],
  );
  const purchaseValidation = useMemo(() => {
    const actual = draws[index + 1];
    if (actual === undefined || purchasePortfolio === null) return null;
    return evaluateCandidates(purchasePortfolio.games, actual, layout);
  }, [index, draws, layout, purchasePortfolio]);
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
          <span>알고리즘</span>
          <label className="algorithm-select">
            <select
              aria-label="알고리즘"
              value={algorithmId}
              onChange={(event) => onAlgorithmChange(event.target.value as AlgorithmId)}
            >
              {algorithmDefinitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {status}
        <p className="purchase-intro">
          {method.description} 연구 후보 100개를 점수·번호 Coverage·조합 간 Diversity로
          압축해 10게임을 만들어요.
        </p>
        {purchasePortfolio?.userAnchorUsed === true && (
          <button
            type="button"
            className="purchase-reset"
            onClick={() => setPurchaseAnchor(null)}
          >
            10번을 자동 완결로 복원
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
              <small>금색 8개는 기본 방식의 공통 지지가 높은 핵심 번호예요.</small>
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
                          ? '기본 포트폴리오'
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
              {candidateResult === null
                ? '분석 준비 중'
                : `고정 ${candidateResult.method.searchSpace.toLocaleString('ko-KR')} 조합`}
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
          <span>선택 알고리즘</span>
          <strong>{method.label}</strong>
        </div>
        {status}
        {snapshot !== null && (
          <>
            <p className="candidate-intro">
              {draws[index]?.round}회까지의 8·24·72회 흐름과 과거 유사 상태{' '}
              {candidateResult?.method.transitionNeighbors ?? 0}개의 다음 이동만 결합한
              기본 방식이에요.{' '}
              {layout === 'board'
                ? `7×7 전용 ${candidateResult?.method.featureCount ?? 35}개 특징을 사용해요.`
                : '원형 특징을 사용해요.'}{' '}
              실제 다음 결과는 후보 순서에 영향을 주지 않고 별도로 비교해요.
            </p>
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
                      <small>예측 Δ {candidate.score.toFixed(3)}</small>
                      <button
                        type="button"
                        className={isPurchaseAnchor ? 'is-selected' : undefined}
                        onClick={() =>
                          setPurchaseAnchor({
                            draws,
                            index,
                            layout,
                            algorithmId,
                            candidate,
                          })
                        }
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
