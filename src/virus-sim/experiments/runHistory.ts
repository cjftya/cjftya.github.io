import type { RunSummary, SimulationEvent, SimulationSnapshot } from '../model/types';

const MAX_RECORDED_EVENTS = 320;

export class RunRecorder {
  private events: SimulationEvent[] = [];
  private truncated = false;

  reset(): void {
    this.events = [];
    this.truncated = false;
  }

  append(incoming: readonly SimulationEvent[]): void {
    for (const event of incoming) {
      if (this.events.length < MAX_RECORDED_EVENTS) this.events.push(event);
      else this.truncated = true;
    }
  }

  latest(limit = 8): readonly SimulationEvent[] {
    return this.events.slice(-limit).reverse();
  }

  createSummary(snapshot: SimulationSnapshot, state?: RunSummary['state']): RunSummary {
    return {
      schemaVersion: 1,
      modelVersion: snapshot.modelVersion,
      seed: snapshot.seed,
      config: { ...snapshot.config },
      ticks: snapshot.tick,
      modelTime: snapshot.modelTime,
      state:
        state ??
        (snapshot.status === 'completed'
          ? 'completed'
          : snapshot.tick === 0
            ? 'in-progress'
            : 'interrupted'),
      deliveryOccurred: snapshot.firstDeliveryTime !== null,
      firstDeliveryTime: snapshot.firstDeliveryTime,
      releasedPhages: snapshot.counts.released,
      eventLogTruncated: this.truncated,
      events: [...this.events],
    };
  }
}

export function downloadRun(summary: RunSummary): void {
  const blob = new Blob([JSON.stringify(summary, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `virus-sim-seed-${summary.seed}-tick-${summary.ticks}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  queueMicrotask(() => URL.revokeObjectURL(url));
}
