/** Fixed before evaluation; no automatic test-set tuning. */
export interface ShapeConfig {
  stateWindow: number;
  neighbors: number;
  trainingWindow: number;
  maxOverlap: number;
  metric: 'euclidean' | 'manhattan';
}

export const SHAPE_VERSION = 'shape-core-v1.0.0';
export const DEFAULT_SHAPE_CONFIG: Readonly<ShapeConfig> = Object.freeze({
  stateWindow: 3,
  neighbors: 12,
  trainingWindow: 0,
  maxOverlap: 3,
  metric: 'euclidean',
});

export function resolveShapeConfig(requested: Partial<ShapeConfig> = {}): ShapeConfig {
  const config = { ...DEFAULT_SHAPE_CONFIG, ...requested };
  for (const key of [
    'stateWindow',
    'neighbors',
    'trainingWindow',
    'maxOverlap',
  ] as const) {
    if (!Number.isInteger(config[key]))
      throw new Error(`Shape 설정 ${key}는 정수여야 해요.`);
  }
  if (
    config.stateWindow < 1 ||
    config.stateWindow > 5 ||
    config.neighbors < 1 ||
    config.neighbors > 100 ||
    (config.trainingWindow !== 0 && config.trainingWindow < 60) ||
    config.maxOverlap < 3 ||
    config.maxOverlap > 4 ||
    !['euclidean', 'manhattan'].includes(config.metric)
  ) {
    throw new Error('Shape 설정 범위를 확인해 주세요. 중복 상한은 3 또는 4예요.');
  }
  return config;
}
