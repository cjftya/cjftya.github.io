import type { ModelBuilderId, ObservationLayerId, ObservationPartId } from './types';

export type SurfaceComponentShape = 'club' | 'crown' | 'cone' | 'knob' | 'channel';

export type GenomeOrganization =
  | 'helical-rnp'
  | 'segmented-rnp'
  | 'paired-rna-in-core'
  | 'packed-dna'
  | 'circular-partial-dna'
  | 'icosahedral-rna-core'
  | 'segmented-dsrna-core'
  | 'layered-segments'
  | 'helical-rna';

export interface SurfaceComponentSignature {
  readonly id: string;
  readonly label: string;
  readonly shape: SurfaceComponentShape;
  readonly relativeAbundance: 'dominant' | 'minor' | 'sparse';
  readonly partId: ObservationPartId;
  readonly layerId: ObservationLayerId;
}

export interface StructuralComponentEvidence {
  readonly componentId: string;
  readonly level: 'observed' | 'family-supported' | 'conceptual';
  readonly sourceIds: readonly string[];
}

export interface StructuralSignature {
  readonly id: string;
  readonly virusId: string;
  readonly profileId?: string;
  readonly builder: ModelBuilderId;
  readonly envelopeShape?:
    | 'spherical'
    | 'pleomorphic'
    | 'filamentous'
    | 'bullet'
    | 'compact'
    | 'brick'
    | 'irregular';
  readonly surfaceComponents: readonly SurfaceComponentSignature[];
  readonly layers: readonly string[];
  readonly genomeOrganization: GenomeOrganization;
  readonly specialStructures: readonly string[];
  readonly evidence: readonly StructuralComponentEvidence[];
}
