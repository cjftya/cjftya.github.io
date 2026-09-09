import type { VirusId } from '../types';

export type HistorySourceKind =
  | 'history'
  | 'public-health'
  | 'animal-health'
  | 'agriculture'
  | 'taxonomy'
  | 'research';

export interface HistorySource {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly kind: HistorySourceKind;
  readonly scope: string;
  readonly checkedOn: string;
}

export interface VirusImpactEvent {
  readonly period: string;
  readonly place?: string;
  readonly title: string;
  readonly summary: string;
  readonly impactType:
    'human-health' | 'animal-health' | 'agriculture' | 'ecology' | 'research' | 'other';
  readonly quantitative?: string;
  readonly sourceIds: readonly string[];
}

export interface VirusHistoryImpact {
  readonly virusId: VirusId;
  readonly discovery?: {
    readonly year?: number;
    readonly dateLabel?: string;
    readonly place?: string;
    readonly context: string;
    readonly sourceIds: readonly string[];
  };
  readonly hostContext?: {
    readonly reservoir?: string;
    readonly primaryHosts?: readonly string[];
    readonly note?: string;
    readonly sourceIds: readonly string[];
  };
  readonly events: readonly VirusImpactEvent[];
  readonly impactSummary: string;
  readonly currentStatus?: string;
  readonly uncertainty?: readonly string[];
  readonly sourceIds: readonly string[];
  readonly verifiedAt: string;
}
