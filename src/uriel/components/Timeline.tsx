import type { LottoDraw } from '../types';

export function Timeline({
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
