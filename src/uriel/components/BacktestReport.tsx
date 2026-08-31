import type { BacktestResult, HitSummary } from '../analysis/backtest';
import { algorithmDefinition } from '../analysis/algorithmCatalog';

export function BacktestReport({ result }: { result: BacktestResult }) {
  const method = algorithmDefinition(result.options.algorithmId);
  return (
    <div className="backtest-report">
      <div className="backtest-verdict">
        <span className={`bottleneck is-${result.bottleneck}`}>기본 진단</span>
        <div>
          <strong>{result.bottleneckMessage}</strong>
          <p>
            {result.startRound.toLocaleString('ko-KR')}–
            {result.endRound.toLocaleString('ko-KR')}회 · {result.evaluatedRounds}회
            검증 · {method.label}
          </p>
        </div>
        <button type="button" onClick={() => downloadResult(result)}>
          JSON 저장
        </button>
      </div>

      <ReportSection
        title="후보 수별 최고 적중"
        copy="선택한 알고리즘의 순위를 고정한 채 후보 수만 늘려 실제 다음 회차와 비교해요."
      >
        <div className="table-scroll">
          <table className="backtest-table">
            <thead>
              <tr>
                <th>후보</th>
                <th>평균 최고</th>
                <th>3+</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              {result.candidates.map((summary) => (
                <SummaryRow key={summary.candidateCount} summary={summary} />
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection
        title="구매 10게임"
        copy="후보 100개를 기존 Coverage·Diversity 방식으로 10게임에 압축한 결과예요."
      >
        <div className="table-scroll">
          <table className="backtest-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>평균 최고</th>
                <th>3+</th>
                <th>4+</th>
                <th>5+</th>
                <th>6</th>
              </tr>
            </thead>
            <tbody>
              <SummaryRow summary={result.purchase} />
            </tbody>
          </table>
        </div>
        <div className="match-distribution">
          <div>
            <h3>최고 적중 분포</h3>
            <p>각 검증 회차에서 10게임 중 가장 많이 맞은 게임의 분포예요.</p>
          </div>
          <div className="distribution-grid">
            {result.purchase.distribution.map((count, hit) => (
              <div key={hit}>
                <span>{hit}개</span>
                <strong>{count}</strong>
                <small>{percent(count / result.evaluatedRounds)}</small>
              </div>
            ))}
          </div>
        </div>
      </ReportSection>

      <ReportSection
        title="최근 회차"
        copy="후보 100개와 구매 10게임의 최고 적중을 회차별로 확인해요."
      >
        <div className="table-scroll">
          <table className="backtest-table">
            <thead>
              <tr>
                <th>회차</th>
                <th>후보 100개</th>
                <th>구매 10게임</th>
                <th>압축 손실</th>
              </tr>
            </thead>
            <tbody>
              {result.rounds
                .slice(-12)
                .reverse()
                .map((round) => (
                  <tr key={round.round}>
                    <th>{round.round.toLocaleString('ko-KR')}</th>
                    <td>{round.candidateMaxHits[100] ?? 0}</td>
                    <td>{round.purchaseMaxHit}</td>
                    <td>
                      {Math.max(
                        (round.candidateMaxHits[100] ?? 0) - round.purchaseMaxHit,
                        0,
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <p className="backtest-disclaimer">
        로또 추첨은 무작위로 간주해요. 이 결과는 과거 Walk-forward 비교이며 미래 당첨을
        보장하지 않아요.
      </p>
    </div>
  );
}

function SummaryRow({ summary }: { summary: HitSummary }) {
  return (
    <tr>
      <th>{summary.label}</th>
      <td>{summary.averageMaxHit.toFixed(2)}</td>
      <td>{percent(summary.threePlusRate)}</td>
      <td>{percent(summary.fourPlusRate)}</td>
      <td className="tail-cell">{percent(summary.fivePlusRate)}</td>
      <td>{percent(summary.sixRate)}</td>
    </tr>
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

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function downloadResult(result: BacktestResult): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `uriel-${result.options.algorithmId}-${result.startRound}-${result.endRound}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
