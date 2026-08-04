export class FixedStepClock {
  private accumulator = 0;

  public constructor(
    private readonly fixedSeconds = 1 / 60,
    private readonly maximumFrameSeconds = 0.1,
  ) {}

  public consume(elapsedSeconds: number, update: (stepScale: number) => void): void {
    this.accumulator += Math.min(Math.max(elapsedSeconds, 0), this.maximumFrameSeconds);
    while (this.accumulator >= this.fixedSeconds) {
      update(this.fixedSeconds * 60);
      this.accumulator -= this.fixedSeconds;
    }
  }

  public reset(): void {
    this.accumulator = 0;
  }
}
