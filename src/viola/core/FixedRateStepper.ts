export class FixedRateStepper {
  private accumulator = 0;

  public constructor(
    private readonly stepSeconds: number,
    private readonly maximumFrameSeconds = 0.1,
    private readonly maximumStepsPerFrame = 12,
  ) {
    if (stepSeconds <= 0) throw new Error('stepSeconds must be positive.');
  }

  public consume(elapsedSeconds: number, step: () => void): number {
    this.accumulator += Math.min(Math.max(elapsedSeconds, 0), this.maximumFrameSeconds);
    let count = 0;
    while (
      this.accumulator + Number.EPSILON >= this.stepSeconds &&
      count < this.maximumStepsPerFrame
    ) {
      step();
      this.accumulator -= this.stepSeconds;
      count += 1;
    }
    if (count === this.maximumStepsPerFrame) this.accumulator = 0;
    return count;
  }

  public reset(): void {
    this.accumulator = 0;
  }
}
