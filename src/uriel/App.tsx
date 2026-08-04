import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { findShapeCandidates } from './analysis/candidates';
import { metricsForDraw } from './analysis/geometry';
import { buildHistoryFrame } from './analysis/history';
import { MetricChart, metricDefinitions } from './components/MetricChart';
import type { MetricKey } from './components/MetricChart';
import { ShapeStage } from './components/ShapeStage';
import { loadBundledDraws, parseDrawCsv } from './data';
import type { HistoryMode, LayoutMode, LottoDraw } from './types';

const PLAY_INTERVALS = [1200, 700, 350] as const;

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
  const candidateResult = useMemo(
    () =>
      draws.length === 0 ? null : findShapeCandidates(draws, deferredIndex, layout),
    [deferredIndex, draws, layout],
  );

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

          <section className="analysis-card candidate-card">
            <div className="card-heading">
              <div>
                <span className="card-index">03</span>
                <h2>다음 형태 후보</h2>
              </div>
              <span>12,000 조합 탐색</span>
            </div>
            <p className="candidate-intro">
              최근 24개 도형 벡터의 가중 평균과 짧은 변화량에 가까운 조합이에요.
            </p>
            <ol className="candidate-list">
              {candidateResult?.candidates.map((candidate, candidateIndex) => (
                <li key={candidate.numbers.join('-')}>
                  <span className="candidate-rank">
                    {String(candidateIndex + 1).padStart(2, '0')}
                  </span>
                  <NumberRow numbers={candidate.numbers} compact />
                  <span className="candidate-score">
                    Δ {candidate.score.toFixed(3)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <section className="method-note">
        <span className="card-index">METHOD</span>
        <div>
          <h2>예측기가 아니라 가설을 시험하는 관측 장치예요.</h2>
          <p>
            보너스 번호와 당첨금은 사용하지 않아요. 여섯 번호를 좌표로 바꾼 뒤 중심,
            면적, 둘레, 조밀도, 방향을 계산해요. 후보는 이 도형 특징에 가까운 조합일
            뿐이며, 독립 무작위 추첨에서 당첨 확률을 높인다는 뜻은 아니에요.
          </p>
        </div>
      </section>
    </main>
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
