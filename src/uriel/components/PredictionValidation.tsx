import type { PurchasePortfolio } from '../types';
import type { PurchaseDiagnostics } from '../analysis/purchase';
import type { CandidateValidation } from '../analysis/validation';
import { describePatternComparison, similarityFactors } from '../analysis/validation';
import { NumberRow } from './DisplayPrimitives';

export function PurchaseValidationSummary({
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
          {portfolio.userAnchorUsed ? '10번 직접 선택 반영' : '10번 자동 완결'}
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

export function ValidationSummary({ validation }: { validation: CandidateValidation }) {
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
