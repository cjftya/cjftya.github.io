import { normalizeSeed } from '../../common/random';

export class LabRandom {
  private state: number;
  private spareNormal: number | null = null;

  constructor(seed: number) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = normalizeSeed(value);
    return this.state / 0x1_0000_0000;
  }

  normal(): number {
    if (this.spareNormal !== null) {
      const value = this.spareNormal;
      this.spareNormal = null;
      return value;
    }
    const first = Math.max(Number.EPSILON, this.next());
    const second = this.next();
    const radius = Math.sqrt(-2 * Math.log(first));
    const angle = Math.PI * 2 * second;
    this.spareNormal = radius * Math.sin(angle);
    return radius * Math.cos(angle);
  }

  getState(): number {
    return this.state;
  }
}
