export type VirusId = string;
export type ObservationPresetId = VirusId;

export type SourceScope =
  'whole-particle' | 'protein' | 'domain' | 'family-description';
export type EvidenceLevel = 'observed' | 'conceptual' | 'unavailable';

export type ModelBuilderId =
  | 't4'
  | 'lambda'
  | 't7'
  | 'phage-family'
  | 'ms2'
  | 'tmv'
  | 'm13'
  | 'adenovirus'
  | 'rotavirus'
  | 'hsv'
  | 'influenza'
  | 'vsv'
  | 'vaccinia'
  | 'filovirus'
  | 'lentivirus'
  | 'coronavirus'
  | 'hbv'
  | 'alphavirus'
  | 'cystovirus'
  | 'icosahedral-capsid'
  | 'layered-capsid'
  | 'plant-filament'
  | 'archaeal-rod'
  | 'spindle-virus'
  | 'geminate-capsid'
  | 'human-rnp';

export type GeometryFamily =
  | 'icosahedral'
  | 'phage'
  | 'filament'
  | 'enveloped'
  | 'layered'
  | 'geminate'
  | 'spindle'
  | 'rod';

export type ObservationPartId =
  | 'capsid'
  | 'capsomer'
  | 'genome'
  | 'neck'
  | 'sheath'
  | 'inner-tube'
  | 'baseplate'
  | 'tail-fiber'
  | 'tailspike'
  | 'flexible-tail'
  | 'portal'
  | 'maturation-protein'
  | 'channel'
  | 'coat-protein'
  | 'terminal-protein'
  | 'penton'
  | 'fiber'
  | 'outer-capsid'
  | 'middle-capsid'
  | 'core-capsid'
  | 'inner-membrane'
  | 'envelope'
  | 'spike'
  | 'turret'
  | 'surface-domain'
  | 'geminate-bridge'
  | 'tegument'
  | 'matrix'
  | 'rnp'
  | 'nucleocapsid'
  | 'core-wall'
  | 'lateral-body'
  | 'terminal-tail';

export type ObservationLayerId =
  | 'envelope'
  | 'surface-protein'
  | 'tegument'
  | 'capsid'
  | 'tail'
  | 'outer-capsid'
  | 'middle-capsid'
  | 'core-capsid'
  | 'inner-membrane'
  | 'matrix'
  | 'nucleocapsid'
  | 'membrane'
  | 'core-wall'
  | 'lateral-body'
  | 'genome';

export interface ObservationPartDefinition {
  readonly id: ObservationPartId;
  readonly name: string;
  readonly summary: string;
  readonly detail: string;
}

export interface LayerDefinition {
  readonly id: ObservationLayerId;
  readonly name: string;
  readonly note?: string;
}

export type CatalogTag =
  | 'phage'
  | 'helical'
  | 'icosahedral'
  | 'enveloped'
  | 'complex'
  | 'plant'
  | 'animal'
  | 'archaea';

export interface ObservationDefinition {
  readonly id: ObservationPresetId;
  readonly identityKey: string;
  readonly name: string;
  readonly shortName: string;
  readonly nameEn: string;
  readonly taxonomyName?: string;
  readonly aliases: readonly string[];
  readonly particleState: string;
  readonly category: string;
  readonly genomeLabel: string;
  readonly description: string;
  readonly feature: string;
  readonly morphologyTags: readonly CatalogTag[];
  readonly silhouette:
    | 'polyhedron'
    | 'phage'
    | 'filament'
    | 'envelope'
    | 'bullet'
    | 'brick'
    | 'geminate'
    | 'spindle'
    | 'rod';
  readonly parts: readonly ObservationPartId[];
  readonly layers: readonly LayerDefinition[];
  readonly sourceIds: readonly string[];
  readonly modelBuilder: ModelBuilderId;
  readonly geometryProfileId: string;
  readonly evidenceStatus: EvidenceLevel;
  readonly representation: 'source-informed-procedural' | 'family-concept-procedural';
  readonly simplifications: readonly string[];
  readonly displayLength: number;
  readonly sectionRadius: number;
}

export interface PhysicalDimensions {
  readonly metric: 'diameter' | 'axial-length' | 'contour-length' | 'width';
  readonly representativeNm: number;
  readonly rangeNm?: readonly [number, number];
  readonly particleState: string;
  readonly includesProjections: boolean;
  readonly sourceIds: readonly string[];
  readonly note?: string;
}
