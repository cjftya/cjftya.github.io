export interface RandomSource {
  next(): number;
  integer(maximumExclusive: number): number;
}

/** Small deterministic generator suitable for reproducible Monte Carlo experiments. */
export function createRandom(seed: number): RandomSource {
  let state = (Math.trunc(seed) >>> 0) || 0x6d2b79f5;
  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
  return {
    next,
    integer: (maximumExclusive) => Math.floor(next() * maximumExclusive),
  };
}

export function sampleCombination(random: RandomSource): number[] {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = 0; index < 6; index += 1) {
    const selected = index + random.integer(45 - index);
    [pool[index], pool[selected]] = [pool[selected]!, pool[index]!];
  }
  return pool.slice(0, 6).sort((left, right) => left - right);
}

export function sampleCombinations(count: number, seed: number): number[][] {
  const random = createRandom(seed);
  return Array.from({ length: Math.max(0, Math.trunc(count)) }, () =>
    sampleCombination(random),
  );
}

export function mixSeed(...values: readonly number[]): number {
  let hash = 0x811c9dc5;
  values.forEach((value) => {
    hash ^= Math.trunc(value) >>> 0;
    hash = Math.imul(hash, 0x01000193);
    hash ^= hash >>> 16;
  });
  return hash >>> 0;
}
