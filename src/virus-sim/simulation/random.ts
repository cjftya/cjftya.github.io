export class SeededRandom {
  private state: number;
  private spareGaussian: number | null = null;

  constructor(seed: number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  gaussian(): number {
    if (this.spareGaussian !== null) {
      const spare = this.spareGaussian;
      this.spareGaussian = null;
      return spare;
    }

    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const magnitude = Math.sqrt(-2 * Math.log(u));
    const angle = 2 * Math.PI * v;
    this.spareGaussian = magnitude * Math.sin(angle);
    return magnitude * Math.cos(angle);
  }
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}
