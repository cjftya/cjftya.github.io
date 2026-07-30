import { describe, expect, it } from 'vitest';
import { calculateRenderPixelRatio } from '../src/core/renderer/RendererManager';

describe('calculateRenderPixelRatio', () => {
  it('keeps the requested ratio when the viewport is within the pixel budget', () => {
    expect(calculateRenderPixelRatio(1920, 1080, 1.5, 1.5)).toBe(1.5);
  });

  it('reduces the ratio for a high-resolution desktop viewport', () => {
    const ratio = calculateRenderPixelRatio(3840, 2160, 2, 1.5);

    expect(ratio).toBeCloseTo(Math.sqrt(5_000_000 / (3840 * 2160)));
  });

  it('does not reduce the ratio below the visual quality floor', () => {
    expect(calculateRenderPixelRatio(7680, 4320, 2, 1.5)).toBe(0.75);
  });

  it('respects the hardware-specific maximum ratio', () => {
    expect(calculateRenderPixelRatio(1280, 720, 2, 1.2)).toBe(1.2);
  });
});
