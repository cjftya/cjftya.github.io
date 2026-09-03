import type {
  CombinationFeatureVector,
  CoordinateSystemId,
  RepresentationId,
} from './types';

export interface CombinationRepresentation {
  readonly id: RepresentationId;
  extract(numbers: readonly number[], coordinateSystem?: CoordinateSystemId): CombinationFeatureVector;
}

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface CoordinateSystem {
  readonly id: CoordinateSystemId;
  point(number: number): CoordinatePoint;
}

export const coordinateSystems: Record<CoordinateSystemId, CoordinateSystem> = {
  circle: {
    id: 'circle',
    point(number) {
      const angle = -Math.PI / 2 + ((number - 1) / 45) * Math.PI * 2;
      return { x: Math.cos(angle), y: Math.sin(angle) };
    },
  },
  board: {
    id: 'board',
    point(number) {
      const index = number - 1;
      return {
        x: ((index % 7) - 3) / 3,
        y: (Math.floor(index / 7) - 3) / 3,
      };
    },
  },
};

export const distanceRepresentation: CombinationRepresentation = {
  id: 'distance',
  extract(source) {
    const numbers = canonicalCombination(source);
    const gaps = numbers.slice(1).map((number, index) => number - numbers[index]!);
    const pairDistances: number[] = [];
    for (let left = 0; left < numbers.length; left += 1) {
      for (let right = left + 1; right < numbers.length; right += 1) {
        pairDistances.push(numbers[right]! - numbers[left]!);
      }
    }
    pairDistances.sort((left, right) => left - right);
    const gapMean = mean(gaps);
    const gapVariance = variance(gaps);
    const distanceMean = mean(pairDistances);
    const distanceVariance = variance(pairDistances);
    const values = [
      ...gaps,
      ...pairDistances,
      numbers.at(-1)! - numbers[0]!,
      distanceMean,
      distanceVariance,
      Math.min(...gaps),
      Math.max(...gaps),
      gapMean,
      gapVariance,
      normalizedEntropy(gaps),
      distanceMean === 0 ? 0 : Math.sqrt(distanceVariance) / distanceMean,
      gapMean === 0 ? 0 : 1 / (1 + Math.sqrt(gapVariance) / gapMean),
    ];
    return vector(
      'distance',
      [
        ...gaps.map((_, index) => `adjacentGap${index + 1}`),
        ...pairDistances.map((_, index) => `pairDistanceRank${index + 1}`),
        'range',
        'meanPairDistance',
        'pairDistanceVariance',
        'minimumGap',
        'maximumGap',
        'meanGap',
        'gapVariance',
        'gapEntropy',
        'distanceConcentration',
        'spacingUniformity',
      ],
      values,
    );
  },
};

export const distributionRepresentation: CombinationRepresentation = {
  id: 'distribution',
  extract(source) {
    const numbers = canonicalCombination(source);
    const average = mean(numbers);
    const valueVariance = variance(numbers);
    const standardDeviation = Math.sqrt(valueVariance);
    const median = (numbers[2]! + numbers[3]!) / 2;
    const zones = Array(5).fill(0) as number[];
    numbers.forEach((number) => {
      const zone = Math.min(Math.floor((number - 1) / 9), 4);
      zones[zone] = zones[zone]! + 1;
    });
    const meanAbsoluteDeviation = mean(
      numbers.map((number) => Math.abs(number - average)),
    );
    const thirdMoment = mean(numbers.map((number) => (number - average) ** 3));
    const skewness = standardDeviation === 0 ? 0 : thirdMoment / standardDeviation ** 3;
    const range = numbers.at(-1)! - numbers[0]!;
    return vector(
      'distribution',
      [
        'mean',
        'median',
        'variance',
        'standardDeviation',
        'skewness',
        ...numbers.map((_, index) => `orderedPositionRatio${index + 1}`),
        ...zones.map((_, index) => `zoneOccupancy${index + 1}`),
        'density',
        'dispersion',
        'centerOfMass',
        'distributionEntropy',
        'oddRatioDescriptor',
        'highRatioDescriptor',
      ],
      [
        average,
        median,
        valueVariance,
        standardDeviation,
        skewness,
        ...numbers.map((number) => number / 45),
        ...zones.map((count) => count / 6),
        range === 0 ? 0 : 6 / range,
        meanAbsoluteDeviation,
        average / 45,
        normalizedEntropy(zones),
        numbers.filter((number) => number % 2 === 1).length / 6,
        numbers.filter((number) => number >= 23).length / 6,
      ],
    );
  },
};

export const geometryRepresentation: CombinationRepresentation = {
  id: 'geometry',
  extract(source, coordinateSystemId = 'circle') {
    const numbers = canonicalCombination(source);
    const system = coordinateSystems[coordinateSystemId];
    const points = numbers.map((number) => system.point(number));
    const centroid = {
      x: mean(points.map(({ x }) => x)),
      y: mean(points.map(({ y }) => y)),
    };
    const ordered = [...points].sort(
      (left, right) =>
        Math.atan2(left.y - centroid.y, left.x - centroid.x) -
        Math.atan2(right.y - centroid.y, right.x - centroid.x),
    );
    const radii = ordered.map((point) => distance(point, centroid));
    const radiusMean = mean(radii);
    const radiusVariance = variance(radii);
    const edges = ordered.map((point, index) =>
      distance(point, ordered[(index + 1) % ordered.length]!),
    );
    const perimeter = sum(edges);
    const area = polygonArea(ordered);
    const angularGaps = cyclicAngularGaps(ordered, centroid);
    const pairDistances: number[] = [];
    for (let left = 0; left < points.length; left += 1) {
      for (let right = left + 1; right < points.length; right += 1) {
        pairDistances.push(distance(points[left]!, points[right]!));
      }
    }
    const radialBins = Array(4).fill(0) as number[];
    const maximumRadius = Math.max(...radii, Number.EPSILON);
    radii.forEach((radius) => {
      const bin = Math.min(Math.floor((radius / maximumRadius) * 4), 3);
      radialBins[bin] = radialBins[bin]! + 1;
    });
    const reflectedMismatch = mean(
      ordered.map((point) => {
        const reflected = {
          x: centroid.x * 2 - point.x,
          y: centroid.y * 2 - point.y,
        };
        return Math.min(...ordered.map((candidate) => distance(reflected, candidate)));
      }),
    );
    return vector(
      'geometry',
      [
        'centroidX',
        'centroidY',
        'radiusMean',
        'radiusVariance',
        'compactness',
        'polygonArea',
        'perimeter',
        'edgeMean',
        'edgeVariance',
        'edgeMinimum',
        'edgeMaximum',
        'angularEntropy',
        'angularUniformity',
        'symmetry',
        'shapeIrregularity',
        'spatialDispersion',
        'geometricEntropy',
      ],
      [
        centroid.x,
        centroid.y,
        radiusMean,
        radiusVariance,
        perimeter === 0 ? 0 : (4 * Math.PI * area) / perimeter ** 2,
        area,
        perimeter,
        mean(edges),
        variance(edges),
        Math.min(...edges),
        Math.max(...edges),
        normalizedEntropy(angularGaps),
        1 / (1 + Math.sqrt(variance(angularGaps)) * angularGaps.length),
        1 / (1 + reflectedMismatch),
        radiusMean === 0 ? 0 : Math.sqrt(radiusVariance) / radiusMean,
        mean(pairDistances),
        normalizedEntropy(radialBins),
      ],
    );
  },
};

export const representations: Record<RepresentationId, CombinationRepresentation> = {
  distance: distanceRepresentation,
  distribution: distributionRepresentation,
  geometry: geometryRepresentation,
};

export function canonicalCombination(source: readonly number[]): number[] {
  if (
    source.length !== 6 ||
    source.some((number) => !Number.isInteger(number) || number < 1 || number > 45) ||
    new Set(source).size !== 6
  ) {
    throw new Error('조합은 1~45의 서로 다른 정수 6개여야 해요.');
  }
  return [...source].sort((left, right) => left - right);
}

function vector(
  representation: RepresentationId,
  names: readonly string[],
  values: readonly number[],
): CombinationFeatureVector {
  if (names.length !== values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${representation} feature를 계산하지 못했어요.`);
  }
  return { representation, names, values };
}

function mean(values: readonly number[]): number {
  return sum(values) / Math.max(values.length, 1);
}

function variance(values: readonly number[]): number {
  const average = mean(values);
  return mean(values.map((value) => (value - average) ** 2));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function normalizedEntropy(values: readonly number[]): number {
  const total = sum(values);
  const nonZero = values.filter((value) => value > 0);
  if (total <= 0 || nonZero.length <= 1) return 0;
  return (
    -sum(nonZero.map((value) => (value / total) * Math.log(value / total))) /
    Math.log(values.length)
  );
}

function distance(left: CoordinatePoint, right: CoordinatePoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function polygonArea(points: readonly CoordinatePoint[]): number {
  return (
    Math.abs(
      sum(
        points.map((point, index) => {
          const next = points[(index + 1) % points.length]!;
          return point.x * next.y - next.x * point.y;
        }),
      ),
    ) / 2
  );
}

function cyclicAngularGaps(
  points: readonly CoordinatePoint[],
  centroid: CoordinatePoint,
): number[] {
  const angles = points
    .map((point) => Math.atan2(point.y - centroid.y, point.x - centroid.x))
    .sort((left, right) => left - right);
  return angles.map((angle, index) => {
    const next = angles[(index + 1) % angles.length]!;
    const gap = index === angles.length - 1 ? next + Math.PI * 2 - angle : next - angle;
    return gap / (Math.PI * 2);
  });
}
