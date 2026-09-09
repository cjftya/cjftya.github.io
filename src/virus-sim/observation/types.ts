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
export type SlotId = 'a' | 'b';
export type ComparisonScaleMode = 'normalized' | 'physical';
export type ScannerAxis = 'x' | 'y' | 'z';
export type DecorationLevel = 'off' | 'subtle' | 'rich';
export type StructuralRevealMode =
  'none' | 'peel' | 'cutaway' | 'exploded' | 'reassemble';

export type LayerVisibility = Readonly<Record<ObservationLayerId, boolean>>;

export interface StructuralTransitionState {
  readonly mode: StructuralRevealMode;
  readonly progress: number;
  readonly fromExplosion: number;
}

export interface SpecimenObservationState {
  readonly presetId: ObservationPresetId;
  readonly variantId: string | null;
  readonly view: InspectionView;
  readonly selectedPartId: ObservationPartId | null;
  readonly explosion: number;
  readonly sectionOffset: number;
  readonly genomeVisible: boolean;
  readonly layerVisibility: LayerVisibility;
  readonly transition: StructuralTransitionState;
}

export interface ComparisonState {
  readonly enabled: boolean;
  readonly linked: boolean;
  readonly scaleMode: ComparisonScaleMode;
}

export interface ScannerProbeState {
  readonly axis: ScannerAxis;
  readonly position: number;
  readonly thickness: number;
}

export interface ScannerState {
  readonly enabled: boolean;
  readonly probes: Readonly<Record<SlotId, ScannerProbeState>>;
  readonly linked: boolean;
  readonly restore: Readonly<
    Partial<
      Record<SlotId, { readonly view: InspectionView; readonly explosion: number }>
    >
  >;
}

export interface DecorationState {
  readonly level: DecorationLevel;
  readonly paused: boolean;
}

export interface ObservationState {
  readonly version: 'virus-observation-v3.5';
  readonly slots: {
    readonly a: SpecimenObservationState;
    readonly b: SpecimenObservationState | null;
  };
  readonly activeSlot: SlotId;
  readonly comparison: ComparisonState;
  readonly scanner: ScannerState;
  readonly decoration: DecorationState;
  readonly reducedMotion: boolean;
}

export type ObservationSnapshot = ObservationState;
