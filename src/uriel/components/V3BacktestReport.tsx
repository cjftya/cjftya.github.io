import type { GameHitSummary, V3BacktestResult } from '../analysis/v3/backtest';
import { researchAlgorithmDefinition } from '../analysis/v3/catalog';

export function V3BacktestReport({ result }: { result: V3BacktestResult }) {
  const method = researchAlgorithmDefinition(result.options.algorithmId);
  return (
    <div className="backtest-report">
      <div className="backtest-verdict">
        <span className={`bottleneck is-${result.verdict}`}>
          {result.verdict === 'indistinguishable' ? '구분 불가' : result.verdict}
        </span>
        <div>
          <strong>{result.verdictMessage}</strong>
          <p>
            {result.startRound.toLocaleString('ko-KR')}–
            {result.endRound.toLocaleString('ko-KR')}회 · {result.evaluatedRounds}회 ·{' '}
            구조 신호 {result.signalRounds}회 · {method.label}
          </p>
        </div>
        <button type="button" onClick={() => downloadResult(result)}>
          JSON 저장
        </button>
      </div>
      <section className="backtest-section">
        <div>
          <h3>추천 게임 Walk-forward</h3>
          <p>
            각 회차의 추천 게임 중 가장 많이 맞힌 한 게임을 동일 게임 수의 무작위 기준과
            비교해요.
          </p>
        </div>
        <div className="table-scroll">
          <table className="backtest-table v3-backtest-table">
            <thead>
              <tr>
                <th>게임 수</th>
                <th>평균 최고 적중</th>
                <th>Random</th>
                <th>Lift</th>
                <th>백분위</th>
                <th>95% CI</th>
                <th>3+</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              {result.summaries.map((summary) => (
                <SummaryRow key={summary.gameCount} summary={summary} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {result.shape && (
        <section className="backtest-section">
          <h3>Shape 후보 합집합 검증</h3>
          <p>
            Recall은 게임 묶음의 번호 포함률이에요. 합집합이 45개면 항상 100%이므로,
            보정 적중(관측 포함 수 − 6 × 합집합 크기 / 45)도 함께 봐요.
          </p>
          <div className="table-scroll">
            <table className="backtest-table">
              <thead>
                <tr>
                  <th>게임 수</th>
                  <th>Recall</th>
                  <th>Random Recall</th>
                  <th>합집합 U / R</th>
                  <th>보정 적중</th>
                  <th>보정 95% CI</th>
                  <th>평균 게임 적중</th>
                  <th>평균 중복</th>
                </tr>
              </thead>
              <tbody>
                {result.shape.portfolios.map((p) => (
                  <tr key={p.gameCount}>
                    <th>{p.gameCount}</th>
                    <td>{percent(p.recall)}</td>
                    <td>{percent(p.randomRecall)}</td>
                    <td>
                      {p.meanUnionSize.toFixed(1)} / {p.randomUnionSize.toFixed(1)}
                    </td>
                    <td>{p.coverageAdjustedHits.toFixed(3)}</td>
                    <td>{p.adjustedInterval.map((v) => v.toFixed(3)).join(' – ')}</td>
                    <td>{p.meanGameHit.toFixed(3)}</td>
                    <td>{p.meanOverlap.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Shape 거리: {result.shape.shapeDistance.toFixed(3)} · 무조건부 과거 평균:{' '}
            {result.shape.unconditionalShapeDistance.toFixed(3)} (낮을수록 좋음)
          </p>
          <p>{result.shape.note}</p>
        </section>
      )}
      <p className="backtest-disclaimer">
        여러 게임 수와 장기 구간에서 신뢰구간이 함께 유지되지 않으면 성공으로 판정하지
        않아요. 구조 점수는 당첨확률이 아니에요.
      </p>
    </div>
  );
}

function SummaryRow({ summary }: { summary: GameHitSummary }) {
  return (
    <tr>
      <th>{summary.gameCount}게임</th>
      <td>{summary.meanHit.toFixed(3)}</td>
      <td>{summary.randomMeanHit.toFixed(3)}</td>
      <td>{summary.lift.toFixed(3)}×</td>
      <td>{percent(summary.randomPercentile)}</td>
      <td>
        U {summary.confidenceInterval[0].toFixed(2)}–
        {summary.confidenceInterval[1].toFixed(2)}
        <small>
          R {summary.randomConfidenceInterval[0].toFixed(2)}–
          {summary.randomConfidenceInterval[1].toFixed(2)}
        </small>
      </td>
      <td>{percent(summary.hitAtLeast3Rate)}</td>
      <td>{percent(summary.hitAtLeast4Rate)}</td>
      <td>{percent(summary.hitAtLeast5Rate)}</td>
      <td>{percent(summary.hit6Rate)}</td>
    </tr>
  );
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function downloadResult(result: V3BacktestResult): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `uriel-v3-${result.options.algorithmId}-${result.startRound}-${result.endRound}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
