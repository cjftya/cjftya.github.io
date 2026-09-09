import type { PhysicalDimensions } from '../catalog/types';

export interface ViewportRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function layoutComparisonViewports(
  width: number,
  height: number,
  comparisonEnabled: boolean,
): readonly [ViewportRect, ViewportRect?] {
  if (!comparisonEnabled) return [{ x: 0, y: 0, width, height }];
  if (width >= 720) {
    const firstWidth = Math.floor(width / 2);
    return [
      { x: 0, y: 0, width: firstWidth, height },
      { x: firstWidth, y: 0, width: width - firstWidth, height },
    ];
  }
  const firstHeight = Math.floor(height / 2);
  return [
    { x: 0, y: 0, width, height: firstHeight },
    { x: 0, y: firstHeight, width, height: height - firstHeight },
  ];
}

export function normalizedSpecimenScale(
  displayLength: number,
  targetWorldLength = 4.8,
): number {
  return targetWorldLength / Math.max(0.001, displayLength);
}

export function physicalSpecimenScale(
  displayLength: number,
  dimensions: PhysicalDimensions,
  worldUnitsPerNm = 0.02,
): number {
  return (
    (dimensions.representativeNm * worldUnitsPerNm) / Math.max(0.001, displayLength)
  );
}

export function computeNmPerPixel(
  dimensions: readonly (PhysicalDimensions | undefined)[],
  viewports: readonly ViewportRect[],
  fill = 0.58,
): number | null {
  const known = dimensions.filter((value): value is PhysicalDimensions =>
    Boolean(value),
  );
  if (known.length !== dimensions.length || known.length === 0) return null;
  const maximumNm = Math.max(...known.map((value) => value.representativeNm));
  const minimumPixels = Math.max(
    1,
    Math.min(...viewports.map((viewport) => Math.min(viewport.width, viewport.height))),
  );
  return maximumNm / (minimumPixels * fill);
}

export function projectedLengthPixels(
  dimensions: PhysicalDimensions,
  nmPerPixel: number,
): number {
  return dimensions.representativeNm / Math.max(1e-9, nmPerPixel);
}

export function scaleBarForNmPerPixel(
  nmPerPixel: number,
  targetPixels = 76,
): { readonly nanometers: number; readonly pixels: number } | null {
  if (!Number.isFinite(nmPerPixel) || nmPerPixel <= 0) return null;
  const targetNm = nmPerPixel * Math.max(1, targetPixels);
  const exponent = 10 ** Math.floor(Math.log10(targetNm));
  const candidates = [1, 2, 5, 10].map((factor) => factor * exponent);
  const nanometers = candidates.reduce((best, candidate) =>
    Math.abs(candidate - targetNm) < Math.abs(best - targetNm) ? candidate : best,
  );
  return { nanometers, pixels: nanometers / nmPerPixel };
}

export function viewportForPoint(
  viewports: readonly ViewportRect[],
  x: number,
  y: number,
): number {
  const index = viewports.findIndex(
    (viewport) =>
      x >= viewport.x &&
      x <= viewport.x + viewport.width &&
      y >= viewport.y &&
      y <= viewport.y + viewport.height,
  );
  return Math.max(0, index);
}
