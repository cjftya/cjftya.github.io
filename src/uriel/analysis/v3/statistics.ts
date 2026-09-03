import { createRandom } from './random';

export function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1);
}

export function populationVariance(values: readonly number[]): number {
  const center = average(values);
  return average(values.map((value) => (value - center) ** 2));
}

export function effectSize(
  winning: readonly number[],
  random: readonly number[],
): number {
  const difference = average(winning) - average(random);
  const denominator = Math.sqrt(
    (populationVariance(winning) + populationVariance(random)) / 2,
  );
  if (denominator < 1e-12) return difference === 0 ? 0 : Math.sign(difference) * 1e6;
  return difference / denominator;
}

export function ksStatistic(
  winning: readonly number[],
  random: readonly number[],
): number {
  const left = [...winning].sort((a, b) => a - b);
  const right = [...random].sort((a, b) => a - b);
  let leftIndex = 0;
  let rightIndex = 0;
  let maximum = 0;
  while (leftIndex < left.length || rightIndex < right.length) {
    const threshold = Math.min(
      left[leftIndex] ?? Number.POSITIVE_INFINITY,
      right[rightIndex] ?? Number.POSITIVE_INFINITY,
    );
    while (left[leftIndex] !== undefined && left[leftIndex]! <= threshold)
      leftIndex += 1;
    while (right[rightIndex] !== undefined && right[rightIndex]! <= threshold)
      rightIndex += 1;
    maximum = Math.max(
      maximum,
      Math.abs(leftIndex / left.length - rightIndex / right.length),
    );
  }
  return maximum;
}

export function wassersteinDistance(
  winning: readonly number[],
  random: readonly number[],
): number {
  const left = [...winning].sort((a, b) => a - b);
  const right = [...random].sort((a, b) => a - b);
  const points = Math.max(Math.min(Math.max(left.length, right.length), 512), 2);
  let distance = 0;
  for (let index = 0; index < points; index += 1) {
    const probability = (index + 0.5) / points;
    distance += Math.abs(quantile(left, probability) - quantile(right, probability));
  }
  return distance / points;
}

export function jensenShannonDivergence(
  winning: readonly number[],
  random: readonly number[],
  binCount = 16,
): number {
  const minimum = Math.min(...winning, ...random);
  const maximum = Math.max(...winning, ...random);
  if (maximum - minimum < 1e-12) return 0;
  const left = histogram(winning, minimum, maximum, binCount);
  const right = histogram(random, minimum, maximum, binCount);
  const middle = left.map((value, index) => (value + right[index]!) / 2);
  return (klDivergence(left, middle) + klDivergence(right, middle)) / 2;
}

export function bootstrapMeanDifferenceInterval(
  winning: readonly number[],
  random: readonly number[],
  iterations: number,
  seed: number,
): [number, number] {
  const randomMean = average(random);
  if (iterations <= 0) {
    const difference = average(winning) - randomMean;
    const standardError = Math.sqrt(
      populationVariance(winning) / Math.max(winning.length, 1) +
        populationVariance(random) / Math.max(random.length, 1),
    );
    return [difference - 1.96 * standardError, difference + 1.96 * standardError];
  }
  const source = createRandom(seed);
  const differences = Array.from({ length: iterations }, () => {
    let total = 0;
    for (let index = 0; index < winning.length; index += 1) {
      total += winning[source.integer(winning.length)]!;
    }
    return total / winning.length - randomMean;
  }).sort((left, right) => left - right);
  return [quantile(differences, 0.025), quantile(differences, 0.975)];
}

export function permutationTestPValue(
  winning: readonly number[],
  random: readonly number[],
  iterations: number,
  seed: number,
): number {
  if (iterations <= 0) return meanDifferencePValue(winning, random);
  const maximumReference = Math.max(winning.length * 4, winning.length);
  const reference =
    random.length <= maximumReference
      ? [...random]
      : evenlySpacedSample(random, maximumReference);
  const pool = [...winning, ...reference];
  const observed = Math.abs(average(winning) - average(reference));
  const source = createRandom(seed);
  let extreme = 0;
  const indices = Array.from({ length: pool.length }, (_, index) => index);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let index = 0; index < winning.length; index += 1) {
      const selected = index + source.integer(indices.length - index);
      [indices[index], indices[selected]] = [indices[selected]!, indices[index]!];
    }
    let leftTotal = 0;
    let rightTotal = 0;
    for (let index = 0; index < indices.length; index += 1) {
      if (index < winning.length) leftTotal += pool[indices[index]!]!;
      else rightTotal += pool[indices[index]!]!;
    }
    const difference = Math.abs(
      leftTotal / winning.length - rightTotal / reference.length,
    );
    if (difference >= observed - 1e-12) extreme += 1;
  }
  return (extreme + 1) / (iterations + 1);
}

export function meanDifferencePValue(
  left: readonly number[],
  right: readonly number[],
): number {
  const standardError = Math.sqrt(
    populationVariance(left) / Math.max(left.length, 1) +
      populationVariance(right) / Math.max(right.length, 1),
  );
  if (standardError < 1e-12) return average(left) === average(right) ? 1 : 0;
  const z = Math.abs(average(left) - average(right)) / standardError;
  return Math.min(1, 2 * (1 - normalCdf(z)));
}

export function benjaminiHochberg(pValues: readonly number[]): number[] {
  const sorted = pValues
    .map((value, index) => ({ value: Math.min(Math.max(value, 0), 1), index }))
    .sort((left, right) => left.value - right.value);
  const adjusted = Array(pValues.length).fill(1) as number[];
  let running = 1;
  for (let rank = sorted.length; rank >= 1; rank -= 1) {
    const item = sorted[rank - 1]!;
    running = Math.min(running, (item.value * sorted.length) / rank);
    adjusted[item.index] = running;
  }
  return adjusted;
}

export function quantile(sortedValues: readonly number[], probability: number): number {
  if (sortedValues.length === 0) return 0;
  const position = Math.min(Math.max(probability, 0), 1) * (sortedValues.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;
  return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
    t;
  const erf = sign * (1 - polynomial * Math.exp(-x * x));
  return (1 + erf) / 2;
}

function histogram(
  values: readonly number[],
  minimum: number,
  maximum: number,
  binCount: number,
): number[] {
  const counts = Array(binCount).fill(1e-12) as number[];
  values.forEach((value) => {
    const index = Math.min(
      Math.floor(((value - minimum) / (maximum - minimum)) * binCount),
      binCount - 1,
    );
    counts[index] = counts[index]! + 1;
  });
  const total = counts.reduce((sum, count) => sum + count, 0);
  return counts.map((count) => count / total);
}

function klDivergence(left: readonly number[], right: readonly number[]): number {
  return left.reduce(
    (total, value, index) => total + value * Math.log(value / right[index]!),
    0,
  );
}

function evenlySpacedSample(values: readonly number[], count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => values[Math.floor((index / count) * values.length)]!,
  );
}
