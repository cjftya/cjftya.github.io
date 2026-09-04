import { memo } from 'react';
import {
  researchAlgorithmDefinition,
  researchAlgorithmDefinitions,
} from '../analysis/v3/catalog';
import type {
  GameCount,
  MonteCarloSampleSize,
  ResearchAlgorithmId,
} from '../analysis/v3/types';
import { GAME_COUNTS, SAMPLE_SIZES } from '../analysis/v3/types';
import { useV3Prediction } from '../hooks/useV3Prediction';
import type { LayoutMode, LottoDraw } from '../types';

interface CandidateResearchPanelsProps {
  draws: readonly LottoDraw[];
  index: number;
  layout: LayoutMode;
  algorithmId: ResearchAlgorithmId;
  gameCount: GameCount;
  sampleSize: MonteCarloSampleSize;
  topFraction: number;
  seed: number;
  isPlaying: boolean;
  onAlgorithmChange: (id: ResearchAlgorithmId) => void;
  onGameCountChange: (count: GameCount) => void;
  onSampleSizeChange: (size: MonteCarloSampleSize) => void;
  onTopFractionChange: (fraction: number) => void;
  onSeedChange: (seed: number) => void;
}

export const CandidateResearchPanels = memo(function CandidateResearchPanels({
  draws,
  index,
  layout,
  algorithmId,
  gameCount,
  sampleSize,
  topFraction,
  seed,
  isPlaying,
  onAlgorithmChange,
  onGameCountChange,
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
  const selectedGameSet = prediction?.gameSets.find(
    (candidate) => candidate.count === gameCount,
  );
  const topDiagnostics = prediction?.diagnostics.features.slice(0, 12) ?? [];

  return (
    <>
      <section className="analysis-card v3-candidate-card">
        <div className="card-heading">
          <div>
            <span className="card-index">03</span>
            <h2>다음 회차 추천 게임</h2>
          </div>
          <span>6 Numbers × Games</span>
        </div>
        <div className="v3-primary-controls">
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
            게임 수
            <select
              value={gameCount}
              onChange={(event) =>
                onGameCountChange(Number(event.target.value) as GameCount)
              }
            >
              {GAME_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}게임
                </option>
              ))}
            </select>
          </label>
        </div>
        <details className="v3-advanced-controls">
          <summary>연구 설정</summary>
          <div className="v3-controls">
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
        </details>
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
                {prediction.diagnostics.selectedFeatureCount === 0
                  ? `균등 무작위 ${prediction.gameSets.at(-1)?.games.length ?? 0}게임 · seed ${prediction.metadata.randomSeed}`
                  : `${prediction.metadata.sampleSize.toLocaleString('ko-KR')}개 생성 · ${prediction.metadata.retainedCombinations.toLocaleString('ko-KR')}개 유지 · seed ${prediction.metadata.randomSeed}`}
              </span>
            </div>
            <div className="candidate-game-heading">
              <strong>
                {method.label} · {gameCount}게임
              </strong>
              <span>각 행이 로또 한 게임이에요.</span>
            </div>
            <div className="candidate-game-list">
              {selectedGameSet?.games.map((game, gameIndex) => {
                const matched =
                  actual === undefined
                    ? []
                    : game.numbers.filter((number) => actual.numbers.includes(number));
                return (
                  <div key={game.numbers.join('-')} className="candidate-game-row">
                    <span>GAME {String(gameIndex + 1).padStart(2, '0')}</span>
                    <div className="candidate-number-grid">
                      {game.numbers.map((number) => (
                        <i
                          key={number}
                          className={matched.includes(number) ? 'is-hit' : undefined}
                        >
                          {number}
                        </i>
                      ))}
                    </div>
                    <small>
                      {actual !== undefined
                        ? `${matched.length}/6 적중`
                        : prediction.diagnostics.selectedFeatureCount === 0
                          ? '무신호 · Random 동률'
                          : `구조 유사도 ${game.structuralScore.toFixed(3)}`}
                    </small>
                  </div>
                );
              })}
            </div>
            <p className="v3-score-warning">
              각 행은 실제 6번호 조합이에요. 구조 유사도는 당첨확률이 아니며, 검증된
              신호가 없으면 결과는 재현 가능한 무작위 후보와 동등해요.
            </p>
          </>
        )}
      </section>

      <details className="analysis-card v3-diagnostics-card">
        <summary className="card-heading">
          <div>
            <span className="card-index">04</span>
            <h2>Contrastive 진단</h2>
          </div>
          <span>Winning vs Synthetic Random</span>
        </summary>
        <div className="v3-diagnostics-body">
          {prediction === null ? (
            <p className="candidate-intro">
              후보 계산이 끝나면 feature 반증 결과를 표시해요.
            </p>
          ) : (
            <>
              <div className="diagnostic-sample-summary">
                <span>실제 {prediction.diagnostics.winningSamples}회</span>
                <span>
                  랜덤 {prediction.diagnostics.randomSamples.toLocaleString('ko-KR')}개
                </span>
                <span>
                  D/V/H {prediction.diagnostics.partitions.discovery}/
                  {prediction.diagnostics.partitions.validation}/
                  {prediction.diagnostics.partitions.holdout}
                </span>
              </div>
              {topDiagnostics.length === 0 ? (
                <p className="candidate-intro">
                  Random Baseline은 feature를 선택하지 않아요. 다른 구조 모델의 게임
                  적중 성능을 비교하는 기준으로 유지돼요.
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
        </div>
      </details>
    </>
  );
});

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}
