import type { VirusHistoryImpact, VirusImpactEvent } from './types';

const verifiedAt = '2026-09-12';

export interface HistorySeed {
  readonly virusId: string;
  readonly discovery?: {
    readonly year?: number;
    readonly dateLabel?: string;
    readonly place?: string;
    readonly context: string;
  };
  readonly reservoir?: string;
  readonly primaryHosts?: readonly string[];
  readonly hostNote?: string;
  readonly impactSummary: string;
  readonly currentStatus?: string;
  readonly uncertainty?: readonly string[];
  readonly sourceIds: readonly string[];
  readonly events?: readonly Omit<VirusImpactEvent, 'sourceIds'>[];
}

export function defineHistory(seed: HistorySeed): VirusHistoryImpact {
  return {
    virusId: seed.virusId,
    discovery: seed.discovery
      ? { ...seed.discovery, sourceIds: seed.sourceIds }
      : undefined,
    hostContext:
      seed.reservoir || seed.primaryHosts || seed.hostNote
        ? {
            reservoir: seed.reservoir,
            primaryHosts: seed.primaryHosts,
            note: seed.hostNote,
            sourceIds: seed.sourceIds,
          }
        : undefined,
    events: (seed.events ?? []).map((event) => ({
      ...event,
      sourceIds: seed.sourceIds,
    })),
    impactSummary: seed.impactSummary,
    currentStatus: seed.currentStatus,
    uncertainty: seed.uncertainty,
    sourceIds: seed.sourceIds,
    verifiedAt,
  };
}
