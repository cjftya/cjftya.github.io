import type {
  CandidateHitSummary,
  V3BacktestResult,
} from '../analysis/v3/backtest';
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
            {method.label}
          </p>
        </div>
        <button type="button" onClick={() => downloadResult(result)}>
          JSON 저장
        </button>
      </div>
      <section className="backtest-section">
        <div>
          <h3>Candidate@K Walk-forward</h3>
          <p>동일 크기의 무작위 번호 집합 10,000회와 평균 적중을 직접 비교해요.</p>
        </div>
        <div className="table-scroll">
          <table className="backtest-table v3-backtest-table">
            <thead>
              <tr>
                <th>후보</th>
                <th>Mean Hit</th>
                <th>Random</th>
                <th>Lift</th>
                <th>백분위</th>
                <th>95% CI</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              {result.summaries.map((summary) => (
                <SummaryRow key={summary.candidateSize} summary={summary} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="backtest-section">
        <div>
          <h3>Recall / Precision</h3>
          <p>Recall은 실제 6개 중 포착 비율, Precision은 후보군 중 실제 번호 비율이에요.</p>
        </div>
        <div className="table-scroll">
          <table className="backtest-table">
            <thead>
              <tr>
                <th>후보</th>
                <th>Median Hit</th>
                <th>Recall</th>
                <th>Precision</th>
                <th>Absolute Lift</th>
              </tr>
            </thead>
            <tbody>
              {result.summaries.map((summary) => (
                <tr key={summary.candidateSize}>
                  <th>Candidate@{summary.candidateSize}</th>
                  <td>{summary.medianHit.toFixed(2)}</td>
                  <td>{percent(summary.candidateRecall)}</td>
                  <td>{percent(summary.candidatePrecision)}</td>
                  <td>{signed(summary.absoluteLift)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="backtest-disclaimer">
        여러 K·장기 구간·신뢰구간이 함께 유지되지 않으면 성공으로 판정하지 않아요.
        Candidate Score는 당첨확률이 아니에요.
      </p>
    </div>
  );
}

function SummaryRow({ summary }: { summary: CandidateHitSummary }) {
  return (
    <tr>
      <th>Candidate@{summary.candidateSize}</th>
      <td>{summary.meanHit.toFixed(3)}</td>
      <td>{summary.randomMeanHit.toFixed(3)}</td>
      <td>{summary.lift.toFixed(3)}×</td>
      <td>{percent(summary.randomPercentile)}</td>
      <td>
        {summary.confidenceInterval[0].toFixed(2)}–
        {summary.confidenceInterval[1].toFixed(2)}
      </td>
      <td>{percent(summary.hitAtLeast4Rate)}</td>
      <td>{percent(summary.hitAtLeast5Rate)}</td>
      <td>{percent(summary.hit6Rate)}</td>
    </tr>
  );
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
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
