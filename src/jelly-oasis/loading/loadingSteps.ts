/** Same deterministic calculation, with either synchronous or cooperative execution. */
export type LoadingSteps<T> = Generator<string, T, void>;
export interface LoadingMetrics {
  cpuMs: number;
  elapsedMs: number;
  maxSliceMs: number;
  maxStepMs: number;
  yields: number;
  phases: Record<string, number>;
  maxStepByPhase: Record<string, number>;
}
export function createLoadingMetrics(): LoadingMetrics {
  return {
    cpuMs: 0,
    elapsedMs: 0,
    maxSliceMs: 0,
    maxStepMs: 0,
    yields: 0,
    phases: {},
    maxStepByPhase: {},
  };
}
export function finishSteps<T>(steps: LoadingSteps<T>): T {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** A real task boundary, never Promise.resolve(): input and rendering can run.
 * Timers also resume in hidden tabs; requestAnimationFrame alone could hang loading.
 */
export async function yieldToBrowser(): Promise<void> {
  const scheduler = (
    globalThis as typeof globalThis & {
      scheduler?: { yield: () => Promise<void> };
    }
  ).scheduler;
  if (scheduler?.yield) await scheduler.yield();
  else await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
export async function runLoadingSteps<T>(
  steps: LoadingSteps<T>,
  metrics = createLoadingMetrics(),
  options: {
    budgetMs?: number;
    now?: () => number;
    yieldTask?: () => Promise<void>;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const now = options.now ?? (() => performance.now());
  const yieldTask =
    options.yieldTask ?? (typeof window !== 'undefined' ? yieldToBrowser : undefined);
  const budget = options.budgetMs ?? 6;
  const started = now();
  let slice = 0;
  try {
    for (;;) {
      options.signal?.throwIfAborted();
      const before = now();
      const step = steps.next();
      const cpu = now() - before;
      slice += cpu;
      metrics.maxStepMs = Math.max(metrics.maxStepMs, cpu);
      metrics.cpuMs += cpu;
      metrics.maxSliceMs = Math.max(metrics.maxSliceMs, slice);
      const phase = step.done ? 'finalize' : step.value;
      metrics.maxStepByPhase[phase] = Math.max(metrics.maxStepByPhase[phase] ?? 0, cpu);
      metrics.phases[phase] = (metrics.phases[phase] ?? 0) + cpu;
      if (step.done) return step.value;
      if (yieldTask && slice >= budget) {
        metrics.yields++;
        await yieldTask();
        slice = 0;
      }
    }
  } finally {
    metrics.elapsedMs = now() - started;
    steps.return(undefined as T);
  }
}
