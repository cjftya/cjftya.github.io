import { memo } from 'react';
import type { LayoutMode, LottoDraw, ShapeMetrics } from '../types';
import { metricsForDraw } from '../analysis/geometry';

export type MetricKey = 'area' | 'compactness' | 'spread' | 'centroidX' | 'centroidY';

interface MetricDefinition {
  label: string;
  shortLabel: string;
  format: (value: number) => string;
}

export const metricDefinitions: Record<MetricKey, MetricDefinition> = {
  area: { label: '면적', shortLabel: '면적', format: fixed(3) },
  compactness: { label: '조밀도', shortLabel: '조밀도', format: fixed(3) },
  spread: { label: '평균 반경', shortLabel: '반경', format: fixed(3) },
  centroidX: { label: '중심 X', shortLabel: '중심 X', format: signed },
  centroidY: { label: '중심 Y', shortLabel: '중심 Y', format: signed },
};

interface MetricChartProps {
  draws: readonly LottoDraw[];
  index: number;
  layout: LayoutMode;
  metric: MetricKey;
}

export const MetricChart = memo(function MetricChart({
  draws,
  index,
  layout,
  metric,
}: MetricChartProps) {
  const start = Math.max(0, index - 71);
  const windowDraws = draws.slice(start, index + 1);
  const values = windowDraws.map((draw) => metricsForDraw(draw, layout)[metric]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 0.0001);
  const points = values
    .map((value, valueIndex) => {
      const x = values.length === 1 ? 50 : (valueIndex / (values.length - 1)) * 100;
      const y = 34 - ((value - minimum) / range) * 28;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  const current = values.at(-1) ?? 0;

  return (
    <div className="metric-chart-wrap">
      <div className="metric-chart-value">
        <span>{metricDefinitions[metric].label}</span>
        <strong>{metricDefinitions[metric].format(current)}</strong>
      </div>
      <svg
        className="metric-chart"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="metric-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1be71" stopOpacity="0.32" />
            <stop offset="1" stopColor="#f1be71" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="34" x2="100" y2="34" className="chart-axis" />
        <polygon points={`0,38 ${points} 100,38`} fill="url(#metric-area)" />
        <polyline points={points} className="chart-line" />
      </svg>
      <div className="metric-chart-range">
        <span>{windowDraws[0]?.round}회</span>
        <span>최근 {windowDraws.length}개 회차</span>
        <span>{windowDraws.at(-1)?.round}회</span>
      </div>
    </div>
  );
});

export function formatMetric(metrics: ShapeMetrics, key: keyof ShapeMetrics): string {
  return key === 'orientation'
    ? `${metrics[key].toFixed(1)}°`
    : metrics[key].toFixed(3);
}

function fixed(digits: number): (value: number) => string {
  return (value) => value.toFixed(digits);
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}
