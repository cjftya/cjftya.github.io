export type RenderQuality = 'performance' | 'standard' | 'enhanced';

export interface QualitySettings {
  readonly modelQuality: 'low' | 'high';
  readonly pixelRatio: number;
  readonly particleCount: number;
  readonly haze: number;
  readonly shadows: boolean;
}

export const QUALITY_SETTINGS: Readonly<Record<RenderQuality, QualitySettings>> = {
  performance: {
    modelQuality: 'low',
    pixelRatio: 1,
    particleCount: 150,
    haze: 0.014,
    shadows: false,
  },
  standard: {
    modelQuality: 'high',
    pixelRatio: 1.5,
    particleCount: 320,
    haze: 0.017,
    shadows: false,
  },
  enhanced: {
    modelQuality: 'high',
    pixelRatio: 1.9,
    particleCount: 520,
    haze: 0.02,
    shadows: true,
  },
};
