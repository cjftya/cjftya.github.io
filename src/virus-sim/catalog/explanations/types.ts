import type {
  ModelBuilderId,
  ObservationLayerId,
  ObservationPartId,
  VirusId,
} from '../types';

export type StructureExplanationEvidence =
  'observed' | 'family-supported' | 'conceptual';

export type StructureExplanationTarget =
  | { readonly kind: 'part'; readonly id: ObservationPartId }
  | { readonly kind: 'layer'; readonly id: ObservationLayerId };

export interface StructureExplanationContent {
  readonly genericSummary: string;
  readonly actualName: string;
  readonly role: string;
  readonly location?: string;
  readonly relationships?: readonly string[];
  readonly modelRepresentation: string;
  readonly simplification?: string;
  readonly evidence: StructureExplanationEvidence;
  readonly sourceIds: readonly string[];
}

export interface StructureExplanation extends StructureExplanationContent {
  readonly scope: 'entry' | 'family' | 'generic';
}

export interface EntryExplanationRegistration {
  readonly virusId: VirusId;
  readonly targets: readonly StructureExplanationTarget[];
  readonly explanation: StructureExplanationContent;
}

export interface FamilyExplanationRegistration {
  readonly modelBuilder: ModelBuilderId;
  readonly targets: readonly StructureExplanationTarget[];
  readonly explanation: StructureExplanationContent;
}

export const partTarget = (id: ObservationPartId): StructureExplanationTarget => ({
  kind: 'part',
  id,
});

export const layerTarget = (id: ObservationLayerId): StructureExplanationTarget => ({
  kind: 'layer',
  id,
});
