import type { BacktestStrategy } from './backtest';

export const strategyLabels: Record<BacktestStrategy, string> = {
  legacy: '기존 Uriel',
  'legacy-portfolio': '기존 + Diversity',
  number: 'Number 중심',
  pair: 'Pair 중심',
  'pair-triple': 'Pair + Triple',
  shape: 'Shape 중심',
  transition: 'Shape Transition',
  hybrid: 'Number + Pair + Shape',
  'full-hybrid': 'Full Hybrid',
  'full-no-pair': 'Full − Pair',
  'full-no-triple': 'Full − Triple',
  'full-no-shape': 'Full − Shape',
  'full-no-transition': 'Full − Transition',
  'full-no-diversity': 'Full − Diversity',
  random: 'Random Monte Carlo',
};
