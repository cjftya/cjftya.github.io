import type { ModelBuilderId, ObservationLayerId, ObservationPartId } from './types';

export type SurfaceComponentShape = 'club' | 'crown' | 'cone' | 'knob' | 'channel';

export type GenomeOrganization =
  | 'helical-rnp'
  | 'segmented-rnp'
  | 'paired-rna-in-core'
  | 'packed-dna'
  | 'circular-partial-dna'
  | 'icosahedral-rna-core'
  | 'single-rna-core'
  | 'segmented-rna-core'
  | 'single-stranded-dna-core'
  | 'double-stranded-dna-core'
  | 'circular-dna-core'
  | 'segmented-dsrna-core'
  | 'layered-segments'
  | 'helical-rna';

export type CapsidFaceting = 'smooth' | 'moderate' | 'strong';

export type IcosahedralSurfacePattern =
  | 'compact-t3'
  | 'vertex-spiked'
  | 'dimpled'
  | 'channelled'
  | 'pentameric'
  | 'protruding-domain'
  | 'star-feature'
  | 'plant-soft'
  | 'plant-pseudo-t3'
  | 'plant-dense'
  | 'plant-protruding'
  | 'plant-rounded';

export type VertexFeatureKind = 'penton-fiber' | 'spike' | 'turret';

export interface VertexFeatureSignature {
  readonly kind: VertexFeatureKind;
  readonly count: number;
  readonly relativeLength: number;
  readonly opening?: boolean;
}

export interface IcosahedralTopologySignature {
  readonly shell: {
    readonly faceting: CapsidFaceting;
    readonly surfacePattern: IcosahedralSurfacePattern;
  };
  readonly capsomerOrganization:
    't1-like' | 't3-like' | 'pseudo-t3-like' | 'pentamer-dominant' | 'family-fallback';
  readonly vertexFeature?: VertexFeatureSignature;
  readonly surfaceDomainScale?: number;
  readonly asymmetricFeature?: 'maturation-protein';
  readonly genomeSegmentCount?: number;
}

export type LayeredCapsidRole =
  'capsid' | 'outer-capsid' | 'middle-capsid' | 'core-capsid' | 'inner-membrane';

export type LayerSurfacePattern =
  'faceted-units' | 'smooth-protein' | 'porous-protein' | 'membrane' | 'dense-core';

export interface LayeredCapsidLayerSignature {
  readonly role: LayeredCapsidRole;
  readonly radiusScale: number;
  readonly faceting: CapsidFaceting;
  readonly surfacePattern: LayerSurfacePattern;
  readonly opacity: number;
}

export interface LayeredCapsidSignature {
  readonly layers: readonly LayeredCapsidLayerSignature[];
  readonly vertexFeature?: VertexFeatureSignature;
  readonly projectionCount?: number;
  readonly genomeSegmentCount?: number;
}

export type HelicalRigidity = 'rigid' | 'semi-flexible' | 'flexible';
export type CenterlineArchetype = 'straight' | 'gentle-bend' | 'flexible-s';
export type HelicalCoatOrganization = 'helical-units' | 'ring-like' | 'smooth-concept';
export type HelicalCoatUnitShape =
  'capsule-like' | 'wedge-like' | 'short-rod' | 'disc-like';
export type GenomePathKind =
  | 'helical-path'
  | 'central-path'
  | 'looped-path'
  | 'paired-path'
  | 'centerline-following';
export type TerminalStructureKind = 'cap' | 'fiber' | 'tail' | 'protein-cluster';

export interface TerminalStructureSignature {
  readonly end: 'start' | 'end' | 'both';
  readonly kind: TerminalStructureKind;
  readonly count: number;
  readonly relativeLength: number;
}

export interface HelicalSignature {
  readonly rigidity: HelicalRigidity;
  readonly centerline: CenterlineArchetype;
  readonly body: {
    readonly length: number;
    readonly radius: number;
    readonly pitch?: number;
    readonly strandCount?: number;
  };
  readonly coat: {
    readonly organization: HelicalCoatOrganization;
    readonly unitShape: HelicalCoatUnitShape;
    readonly unitScale: number;
  };
  readonly channel?: {
    readonly present: boolean;
    readonly radiusScale: number;
  };
  readonly genomePath: GenomePathKind;
  readonly terminalStructures?: readonly TerminalStructureSignature[];
}

export type SpecialGeometryKind = 'spindle' | 'rod' | 'geminate' | 'brick';

export interface SpecialGeometrySignature {
  readonly kind: SpecialGeometryKind;
  readonly body: {
    readonly length: number;
    readonly radius: number;
    readonly taper?: number;
    readonly lobeSpacing?: number;
    readonly roundness?: number;
  };
  readonly surfaceOrganization:
    | 'fusiform-shell'
    | 'rigid-rod-coat'
    | 'faceted-twin-lobes'
    | 'layered-rounded-brick';
  readonly genomePath: GenomePathKind;
  readonly terminalStructures?: readonly TerminalStructureSignature[];
  readonly internalStructures?: readonly string[];
}

export type PhageHeadShape = 'isometric' | 'prolate' | 'elongated';
export type PhageHeadSurfacePattern =
  'regular-lattice' | 'prolate-lattice' | 'crosslinked-thin';
export type PhageNeckStyle = 'simple' | 'ringed' | 'collar';
export type PhageTailType = 'contractile' | 'long-noncontractile' | 'short' | 'minimal';
export type PhageBaseplateStyle = 'simple-hub' | 'hexagonal' | 'contractile-complex';
export type PhageReceptorKind = 'tail-fiber' | 'tailspike';

export interface PhageReceptorSignature {
  readonly kind: PhageReceptorKind;
  readonly count: number;
  readonly reach: number;
  readonly segmented: boolean;
}

export interface PhageStructuralSignature {
  readonly head: {
    readonly shape: PhageHeadShape;
    readonly radius: number;
    readonly elongation: number;
    readonly surfacePattern: PhageHeadSurfacePattern;
    readonly capsomerCount: number;
  };
  readonly portal?: {
    readonly present: boolean;
    readonly scale: number;
  };
  readonly neck?: {
    readonly style: PhageNeckStyle;
  };
  readonly tail: {
    readonly type: PhageTailType;
    readonly length: number;
    readonly radius: number;
    readonly flexibility: 'rigid' | 'semi-flexible' | 'flexible';
    readonly sheathRings?: number;
    readonly innerTube: boolean;
  };
  readonly distal?: {
    readonly baseplate?: PhageBaseplateStyle;
    readonly receptor?: PhageReceptorSignature;
  };
}

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
  readonly icosahedral?: IcosahedralTopologySignature;
  readonly layeredCapsid?: LayeredCapsidSignature;
  readonly helical?: HelicalSignature;
  readonly specialGeometry?: SpecialGeometrySignature;
  readonly phage?: PhageStructuralSignature;
}
