import { memo, useMemo } from 'react';
import {
  researchAlgorithmDefinition,
  researchAlgorithmDefinitions,
} from '../analysis/v3/catalog';
import type {
  MonteCarloSampleSize,
  ResearchAlgorithmId,
} from '../analysis/v3/types';
import { SAMPLE_SIZES } from '../analysis/v3/types';
import { useV3Prediction } from '../hooks/useV3Prediction';
import type { LayoutMode, LottoDraw } from '../types';

interface CandidateResearchPanelsProps {
  draws: readonly LottoDraw[];
  index: number;
  layout: LayoutMode;
  algorithmId: ResearchAlgorithmId;
  sampleSize: MonteCarloSampleSize;
  topFraction: number;
  seed: number;
  isPlaying: boolean;
  onAlgorithmChange: (id: ResearchAlgorithmId) => void;
  onSampleSizeChange: (size: MonteCarloSampleSize) => void;
  onTopFractionChange: (fraction: number) => void;
  onSeedChange: (seed: number) => void;
}

export const CandidateResearchPanels = memo(function CandidateResearchPanels({
  draws,
  index,
  layout,
  algorithmId,
  sampleSize,
  topFraction,
  seed,
  isPlaying,
  onAlgorithmChange,
  onSampleSizeChange,
  onTopFractionChange,
  onSeedChange,
}: CandidateResearchPanelsProps) {
  const method = researchAlgorithmDefinition(algorithmId);
  const { prediction, error } = useV3Prediction(
    draws,
    index,
    algorithmId,
    {
      seed,
      sampleSize,
      nullSampleSize: Math.min(sampleSize, 20_000),
      topFraction,
      coordinateSystem: layout,
      bootstrapIterations: 200,
      permutationIterations: 200,
    },
    isPlaying,
  );
  const actual = draws[index + 1];
  const scoreRanking = useMemo(
    () =>
      [...(prediction?.numberScores ?? [])].sort(
        (left, right) => right.rawScore - left.rawScore || left.number - right.number,
      ),
    [prediction],
  );
  const topDiagnostics = prediction?.diagnostics.features.slice(0, 12) ?? [];

  return (
    <>
      <section className="analysis-card v3-candidate-card">
        <div className="card-heading">
          <div>
            <span className="card-index">03</span>
            <h2>다음 회차 후보군</h2>
          </div>
          <span>Combination → Projection</span>
        </div>
        <div className="v3-controls">
          <label>
            알고리즘
            <select
              value={algorithmId}
              onChange={(event) =>
                onAlgorithmChange(event.target.value as ResearchAlgorithmId)
              }
            >
              {researchAlgorithmDefinitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            조합 표본
            <select
              value={sampleSize}
              onChange={(event) =>
                onSampleSizeChange(Number(event.target.value) as MonteCarloSampleSize)
              }
            >
              {SAMPLE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size >= 1_000_000 ? `${size / 1_000_000}M` : `${size / 1_000}K`}
                </option>
              ))}
            </select>
          </label>
          <label>
            구조 필터
            <select
              value={topFraction}
              onChange={(event) => onTopFractionChange(Number(event.target.value))}
            >
              <option value={0.1}>Top 10%</option>
              <option value={0.05}>Top 5%</option>
              <option value={0.01}>Top 1%</option>
            </select>
          </label>
          <label>
            Seed
            <input
              type="number"
              value={seed}
              onChange={(event) => onSeedChange(Number(event.target.value))}
            />
          </label>
        </div>
        <p className="candidate-intro">{method.description}</p>
        {prediction === null && error === null && (
          <div className="analysis-progress" role="status">
            <span>
              {isPlaying
                ? '재생 중에는 후보 계산을 멈춰요.'
                : `${draws[index]?.round}회까지의 기록과 합성 null model을 대조하고 있어요.`}
            </span>
          </div>
        )}
        {error !== null && <div className="backtest-error">{error}</div>}
        {prediction !== null && (
          <>
            <div className="v3-signal-summary">
              <strong>
                {prediction.diagnostics.selectedFeatureCount === 0
                  ? '검증을 통과한 구조 신호 없음'
                  : `${prediction.diagnostics.selectedFeatureCount}개 구조 신호 사용`}
              </strong>
              <span>
                {prediction.metadata.sampleSize.toLocaleString('ko-KR')}개 생성 ·{' '}
                {prediction.metadata.retainedCombinations.toLocaleString('ko-KR')}개 유지 ·
                seed {prediction.metadata.randomSeed}
              </span>
            </div>
            <div className="candidate-set-list">
              {prediction.candidateSets.map((candidateSet) => {
                const matched =
                  actual === undefined
                    ? []
                    : candidateSet.numbers.filter((number) =>
                        actual.numbers.includes(number),
                      );
                return (
                  <div key={candidateSet.size} className="candidate-set-row">
                    <div>
                      <strong>Candidate@{candidateSet.size}</strong>
                      <small>
                        {actual === undefined
                          ? '다음 회차 결과 전'
                          : `Hit@${candidateSet.size} = ${matched.length}`}
                      </small>
                    </div>
                    <div className="candidate-number-grid">
                      {candidateSet.numbers.map((number) => (
                        <i
                          key={number}
                          className={matched.includes(number) ? 'is-hit' : undefined}
                        >
                          {number}
                        </i>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="number-score-panel">
              <div>
                <h3>번호별 Candidate Score</h3>
                <p>상위 구조 조합에 포함된 가중 비율을 0–100으로 정규화했어요.</p>
              </div>
              <div className="number-score-grid">
                {scoreRanking.map((score, rank) => (
                  <div key={score.number} title={`포함률 ${(score.inclusionRate * 100).toFixed(2)}%`}>
                    <span>{rank + 1}</span>
                    <b>{score.number}</b>
                    <i style={{ width: `${score.normalizedScore}%` }} />
                    <small>{score.normalizedScore.toFixed(1)}</small>
                  </div>
                ))}
              </div>
            </div>
            <p className="v3-score-warning">
              Candidate Score는 과거 당첨 확률이나 번호별 출현 빈도가 아니라, 살아남은
              조합 공간의 투영값이에요.
            </p>
          </>
        )}
      </section>

      <section className="analysis-card v3-diagnostics-card">
        <div className="card-heading">
          <div>
            <span className="card-index">04</span>
            <h2>Contrastive 진단</h2>
          </div>
          <span>Winning vs Synthetic Random</span>
        </div>
        {prediction === null ? (
          <p className="candidate-intro">후보 계산이 끝나면 feature 반증 결과를 표시해요.</p>
        ) : (
          <>
            <div className="diagnostic-sample-summary">
              <span>실제 {prediction.diagnostics.winningSamples}회</span>
              <span>랜덤 {prediction.diagnostics.randomSamples.toLocaleString('ko-KR')}개</span>
              <span>
                D/V/H {prediction.diagnostics.partitions.discovery}/
                {prediction.diagnostics.partitions.validation}/
                {prediction.diagnostics.partitions.holdout}
              </span>
            </div>
            {topDiagnostics.length === 0 ? (
              <p className="candidate-intro">
                Random Baseline은 feature를 선택하지 않아요. 다른 구조 모델과 같은 Hit@K
                평가의 기준으로 유지됩니다.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="backtest-table diagnostic-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Discovery d</th>
                      <th>Validation d</th>
                      <th>Holdout d</th>
                      <th>안정성</th>
                      <th>판정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDiagnostics.map((feature) => (
                      <tr key={`${feature.representation}-${feature.name}`}>
                        <th>
                          <small>{feature.representation}</small>
                          {feature.name}
                        </th>
                        <td>{signed(feature.effectSize)}</td>
                        <td>{signed(feature.validationEffectSize)}</td>
                        <td>{signed(feature.holdoutEffectSize)}</td>
                        <td>{(feature.temporalStability * 100).toFixed(0)}%</td>
                        <td>{feature.selected ? '채택' : '기각'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
});

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}
