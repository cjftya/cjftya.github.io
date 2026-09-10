import type {
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
} from '../catalog/types';

export type {
  CatalogTag,
  EvidenceLevel,
  GeometryFamily,
  LayerDefinition,
  ModelBuilderId,
  ObservationDefinition,
  ObservationLayerId,
  ObservationPartDefinition,
  ObservationPartId,
  ObservationPresetId,
  PhysicalDimensions,
  SourceScope,
  SpecimenVariant,
  StructureChange,
  VariantKind,
  VirusId,
} from '../catalog/types';

export type InspectionView = 'surface' | 'transparent' | 'section' | 'exploded';
export type ScannerAxis = 'x' | 'y' | 'z';
export type DecorationLevel = 'off' | 'subtle';

export type LayerVisibility = Readonly<Record<ObservationLayerId, boolean>>;

export interface SpecimenObservationState {
  readonly presetId: ObservationPresetId;
  readonly view: InspectionView;
  readonly selectedPartId: ObservationPartId | null;
  readonly explosion: number;
  readonly sectionOffset: number;
  readonly genomeVisible: boolean;
  readonly layerVisibility: LayerVisibility;
}

export interface ScannerProbeState {
  readonly axis: ScannerAxis;
  readonly position: number;
  readonly thickness: number;
}

export interface ScannerState {
  readonly enabled: boolean;
  readonly probe: ScannerProbeState;
  readonly restore: {
    readonly view: InspectionView;
    readonly explosion: number;
  } | null;
}

export interface DecorationState {
  readonly level: DecorationLevel;
  readonly paused: boolean;
}

export interface ObservationState {
  readonly version: 'virus-observation-v4.6';
  readonly specimen: SpecimenObservationState;
  readonly scanner: ScannerState;
  readonly decoration: DecorationState;
  readonly reducedMotion: boolean;
}

export type ObservationSnapshot = ObservationState;
