import { getCatalogEntry } from '../catalog/registry';
import type {
  DecorationLevel,
  InspectionView,
  LayerVisibility,
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
  ObservationState,
  ScannerAxis,
  SpecimenObservationState,
} from './types';

const ALL_LAYER_IDS: readonly ObservationLayerId[] = [
  'envelope',
  'surface-protein',
  'tegument',
  'capsid',
  'tail',
  'outer-capsid',
  'middle-capsid',
  'core-capsid',
  'inner-membrane',
  'matrix',
  'nucleocapsid',
  'membrane',
  'core-wall',
  'lateral-body',
  'genome',
] as const;

export class ObservationStore {
  private state: ObservationState;

  constructor(reducedMotion = false, initialId: ObservationPresetId = 't4') {
    this.state = {
      version: 'virus-observation-v4.3',
      specimen: createSpecimen(initialId),
      scanner: {
        enabled: false,
        probe: { axis: 'z', position: 0.5, thickness: 0.08 },
        restore: null,
      },
      decoration: { level: 'subtle', paused: reducedMotion },
      reducedMotion,
    };
  }

  getSnapshot(): ObservationSnapshot {
    return cloneState(this.state);
  }

  getActiveSpecimen(): SpecimenObservationState {
    return this.state.specimen;
  }

  setPreset(presetId: ObservationPresetId): void {
    this.state = {
      ...this.state,
      specimen: createSpecimen(presetId),
      scanner: { ...this.state.scanner, enabled: false, restore: null },
    };
  }

  setView(view: InspectionView): void {
    if (this.state.scanner.enabled && view === 'exploded') return;
    this.updateSpecimen((specimen) => ({
      ...specimen,
      view,
      explosion:
        view === 'exploded' && specimen.explosion === 0
          ? 62
          : view === 'exploded'
            ? specimen.explosion
            : 0,
    }));
  }

  setExplosion(explosion: number): void {
    if (this.state.scanner.enabled) return;
    this.updateSpecimen((specimen) => ({
      ...specimen,
      view: 'exploded',
      explosion: clamp(explosion, 0, 100),
    }));
  }

  setSectionOffset(sectionOffset: number): void {
    this.updateSpecimen((specimen) => ({
      ...specimen,
      view: 'section',
      sectionOffset: clamp(sectionOffset, -1, 1),
    }));
  }

  setGenomeVisible(genomeVisible: boolean): void {
    this.updateSpecimen((specimen) => ({
      ...specimen,
      genomeVisible,
      layerVisibility: genomeVisible
        ? { ...specimen.layerVisibility, genome: true }
        : specimen.layerVisibility,
    }));
  }

  setLayerVisible(layer: ObservationLayerId, visible: boolean): void {
    this.updateSpecimen((specimen) => ({
      ...specimen,
      layerVisibility: { ...specimen.layerVisibility, [layer]: visible },
    }));
  }

  selectPart(selectedPartId: ObservationPartId | null): void {
    this.updateSpecimen((specimen) => ({ ...specimen, selectedPartId }));
  }

  setScannerEnabled(enabled: boolean): void {
    if (enabled === this.state.scanner.enabled) return;
    if (enabled) {
      const specimen = this.state.specimen;
      this.state = {
        ...this.state,
        specimen: {
          ...specimen,
          view: specimen.view === 'exploded' ? 'surface' : specimen.view,
          explosion: 0,
        },
        scanner: {
          ...this.state.scanner,
          enabled: true,
          restore: { view: specimen.view, explosion: specimen.explosion },
        },
      };
      return;
    }
    const restore = this.state.scanner.restore;
    this.state = {
      ...this.state,
      specimen: restore ? { ...this.state.specimen, ...restore } : this.state.specimen,
      scanner: { ...this.state.scanner, enabled: false, restore: null },
    };
  }

  setScannerAxis(axis: ScannerAxis): void {
    this.updateScannerProbe((probe) => ({ ...probe, axis }));
  }

  setScannerPosition(position: number): void {
    this.updateScannerProbe((probe) => ({ ...probe, position: clamp(position, 0, 1) }));
  }

  setScannerThickness(thickness: number): void {
    this.updateScannerProbe((probe) => ({
      ...probe,
      thickness: clamp(thickness, 0.01, 0.3),
    }));
  }

  setDecorationLevel(level: DecorationLevel): void {
    this.state = { ...this.state, decoration: { ...this.state.decoration, level } };
  }

  setDecorationPaused(paused: boolean): void {
    this.state = { ...this.state, decoration: { ...this.state.decoration, paused } };
  }

  private updateSpecimen(
    update: (specimen: SpecimenObservationState) => SpecimenObservationState,
  ): void {
    this.state = { ...this.state, specimen: update(this.state.specimen) };
  }

  private updateScannerProbe(
    update: (
      probe: ObservationState['scanner']['probe'],
    ) => ObservationState['scanner']['probe'],
  ): void {
    this.state = {
      ...this.state,
      scanner: { ...this.state.scanner, probe: update(this.state.scanner.probe) },
    };
  }
}

function createSpecimen(presetId: ObservationPresetId): SpecimenObservationState {
  const definition = getCatalogEntry(presetId);
  return {
    presetId,
    view: 'surface',
    selectedPartId: null,
    explosion: 0,
    sectionOffset: 0,
    genomeVisible: false,
    layerVisibility: createLayerVisibility(definition.layers.map((item) => item.id)),
  };
}

function createLayerVisibility(
  visibleLayers: readonly ObservationLayerId[],
): LayerVisibility {
  const visible = new Set(visibleLayers);
  return Object.fromEntries(
    ALL_LAYER_IDS.map((id) => [id, visible.has(id)]),
  ) as unknown as LayerVisibility;
}

function cloneState(state: ObservationState): ObservationState {
  return {
    ...state,
    specimen: {
      ...state.specimen,
      layerVisibility: { ...state.specimen.layerVisibility },
    },
    scanner: {
      ...state.scanner,
      probe: { ...state.scanner.probe },
      restore: state.scanner.restore ? { ...state.scanner.restore } : null,
    },
    decoration: { ...state.decoration },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
