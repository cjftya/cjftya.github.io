import { useId } from 'react';
import { pointForNumber, pointsForNumbers } from '../analysis/geometry';
import type { HistoryFrame, HistoryMode, LayoutMode, LottoDraw } from '../types';

const SIZE = 600;
const CENTER = SIZE / 2;
const SCALE = 270;

interface ShapeStageProps {
  draw: LottoDraw;
  frame: HistoryFrame;
  historyMode: HistoryMode;
  layout: LayoutMode;
}

export function ShapeStage({ draw, frame, historyMode, layout }: ShapeStageProps) {
  const glowId = useId().replace(/:/g, '');
  const selected = new Set(draw.numbers);
  const currentPoints = pointsForNumbers(draw.numbers, layout);
  const polygon = toPolygon(currentPoints);
  const maximumTrailWeight = Math.max(...frame.trails.map(({ weight }) => weight), 1);
  const centroid = screenPoint(frame.weightedCentroid);

  return (
    <svg
      className="shape-stage"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`${draw.round}회 당첨번호의 ${layout === 'circle' ? '원형' : '7열 번호표'} 도형`}
    >
      <defs>
        <radialGradient id={`${glowId}-field`}>
          <stop offset="0" stopColor="#f4c67a" stopOpacity="0.16" />
          <stop offset="0.65" stopColor="#6c5fd2" stopOpacity="0.05" />
          <stop offset="1" stopColor="#080b13" stopOpacity="0" />
        </radialGradient>
        <filter id={`${glowId}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={CENTER} cy={CENTER} r="292" fill={`url(#${glowId}-field)`} />
      {layout === 'circle' ? <CircleGuide /> : <BoardGuide />}

      {historyMode !== 'independent' &&
        frame.trails.map(({ draw: trailDraw, weight }, index) => (
          <polygon
            // Several historical rounds can legitimately share the same geometry.
            key={`${trailDraw.round}-${index}`}
            points={toPolygon(pointsForNumbers(trailDraw.numbers, layout))}
            className="history-polygon"
            style={{
              opacity: 0.025 + (weight / maximumTrailWeight) * 0.105,
            }}
          />
        ))}

      {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => {
        const point = screenPoint(pointForNumber(number, layout));
        const weight = frame.numberWeights[number] ?? 0;
        const isSelected = selected.has(number);
        const radius = isSelected ? 17 : 8 + weight * 7;
        return (
          <g key={number} transform={`translate(${point.x} ${point.y})`}>
            {weight > 0.02 && (
              <circle
                r={radius + 8 + weight * 8}
                fill={numberColor(number)}
                opacity={0.035 + weight * 0.13}
                filter={`url(#${glowId}-glow)`}
              />
            )}
            <circle
              r={radius}
              className={isSelected ? 'number-node is-selected' : 'number-node'}
              fill={isSelected ? numberColor(number) : undefined}
              style={{ '--heat': weight } as React.CSSProperties}
            />
            <text
              className={isSelected ? 'number-label is-selected' : 'number-label'}
              y="0.35em"
            >
              {number}
            </text>
          </g>
        );
      })}

      <polygon points={polygon} className="current-polygon-fill" />
      <polygon points={polygon} className="current-polygon-line" />
      {currentPoints.map((point) => {
        const screen = screenPoint(point);
        return (
          <circle
            key={point.number}
            cx={screen.x}
            cy={screen.y}
            r="3.2"
            className="shape-vertex"
          />
        );
      })}

      {historyMode !== 'independent' && (
        <g
          className="weighted-centroid"
          transform={`translate(${centroid.x} ${centroid.y})`}
        >
          <circle r="11" />
          <path d="M -16 0 H 16 M 0 -16 V 16" />
        </g>
      )}
    </svg>
  );
}

function CircleGuide() {
  return (
    <g className="stage-guide">
      <circle cx={CENTER} cy={CENTER} r={SCALE * 0.88} />
      <circle cx={CENTER} cy={CENTER} r={SCALE * 0.57} strokeDasharray="3 12" />
      <line x1={CENTER} y1="45" x2={CENTER} y2="555" />
      <line x1="45" y1={CENTER} x2="555" y2={CENTER} />
    </g>
  );
}

function BoardGuide() {
  const start = screenPoint(pointForNumber(1, 'board'));
  const end = screenPoint({ x: 0.86, y: 0.86 });
  const step = (end.x - start.x) / 6;
  return (
    <g className="stage-guide board-guide">
      <rect
        x={start.x - step / 2}
        y={start.y - step / 2}
        width={step * 7}
        height={step * 7}
        rx="18"
      />
      {Array.from({ length: 6 }, (_, index) => {
        const offset = start.x + step / 2 + index * step;
        return (
          <g key={index}>
            <line
              x1={offset}
              y1={start.y - step / 2}
              x2={offset}
              y2={end.y + step / 2}
            />
            <line
              x1={start.x - step / 2}
              y1={offset}
              x2={end.x + step / 2}
              y2={offset}
            />
          </g>
        );
      })}
    </g>
  );
}

function screenPoint(point: { x: number; y: number }): { x: number; y: number } {
  return { x: CENTER + point.x * SCALE, y: CENTER + point.y * SCALE };
}

function toPolygon(points: readonly { x: number; y: number }[]): string {
  return points
    .map((point) => screenPoint(point))
    .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
}

function numberColor(number: number): string {
  if (number <= 10) return '#f2c85d';
  if (number <= 20) return '#65b6e8';
  if (number <= 30) return '#ee7c7a';
  if (number <= 40) return '#a8adb7';
  return '#72c99b';
}
