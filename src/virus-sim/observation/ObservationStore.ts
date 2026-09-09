import { getCatalogEntry } from '../catalog/registry';
import {
  EMPTY_TRANSITION,
  beginReassembly,
  beginStructuralTransition,
  stepStructuralTransition,
} from '../inspection/transition';
import type {
  ComparisonScaleMode,
  DecorationLevel,
  InspectionView,
  LayerVisibility,
  ObservationLayerId,
  ObservationPartId,
  ObservationPresetId,
  ObservationSnapshot,
  ObservationState,
  ScannerAxis,
  SlotId,
  SpecimenObservationState,
  StructuralRevealMode,
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
      version: 'virus-observation-v3.5',
      slots: { a: createSpecimen(initialId), b: null },
      activeSlot: 'a',
      comparison: { enabled: false, linked: true, scaleMode: 'normalized' },
      scanner: {
        enabled: false,
        probes: {
          a: { axis: 'z', position: 0.5, thickness: 0.08 },
          b: { axis: 'z', position: 0.5, thickness: 0.08 },
        },
        linked: true,
        restore: {},
      },
      decoration: { level: 'subtle', paused: reducedMotion },
      reducedMotion,
    };
  }

  getSnapshot(): ObservationSnapshot {
    return cloneState(this.state);
  }

  replaceSnapshot(snapshot: ObservationSnapshot): void {
    this.state = cloneState(snapshot);
  }

  getActiveSpecimen(): SpecimenObservationState {
    return this.state.slots[this.state.activeSlot] ?? this.state.slots.a;
  }

  step(dt: number): void {
    const a = stepStructuralTransition(
      this.state.slots.a,
      dt,
      this.state.reducedMotion,
    );
    const b = this.state.slots.b
      ? stepStructuralTransition(this.state.slots.b, dt, this.state.reducedMotion)
      : null;
    if (a === this.state.slots.a && b === this.state.slots.b) return;
    this.state = { ...this.state, slots: { a, b } };
  }

  setActiveSlot(slot: SlotId): void {
    if (slot === 'b' && !this.state.slots.b) return;
    this.state = { ...this.state, activeSlot: slot };
  }

  setPreset(presetId: ObservationPresetId, slot = this.state.activeSlot): void {
    const current = this.specimen(slot);
    const next = createSpecimen(presetId, current);
    this.setSpecimen(slot, next, false);
  }

  addComparison(presetId: ObservationPresetId): void {
    const b = createSpecimen(presetId, this.state.slots.a);
    this.state = {
      ...this.state,
      slots: { ...this.state.slots, b },
      activeSlot: 'b',
      comparison: { ...this.state.comparison, enabled: true },
      scanner: {
        ...this.state.scanner,
        probes: {
          ...this.state.scanner.probes,
          b: { ...this.state.scanner.probes.a },
        },
      },
    };
  }

  closeComparison(): void {
    this.state = {
      ...this.state,
      slots: { ...this.state.slots, b: null },
      activeSlot: 'a',
      comparison: { ...this.state.comparison, enabled: false },
    };
  }

  swapComparison(): void {
    const b = this.state.slots.b;
    if (!b) return;
    this.state = {
      ...this.state,
      slots: { a: b, b: this.state.slots.a },
      activeSlot: this.state.activeSlot === 'a' ? 'b' : 'a',
      scanner: {
        ...this.state.scanner,
        probes: {
          a: this.state.scanner.probes.b,
          b: this.state.scanner.probes.a,
        },
        restore: {
          ...(this.state.scanner.restore.b ? { a: this.state.scanner.restore.b } : {}),
          ...(this.state.scanner.restore.a ? { b: this.state.scanner.restore.a } : {}),
        },
      },
    };
  }

  setComparisonLinked(linked: boolean): void {
    this.state = { ...this.state, comparison: { ...this.state.comparison, linked } };
  }

  setComparisonScaleMode(scaleMode: ComparisonScaleMode): void {
    this.state = {
      ...this.state,
      comparison: { ...this.state.comparison, scaleMode },
    };
  }

  setView(view: InspectionView): void {
    if (this.state.scanner.enabled && view === 'exploded') return;
    this.updateInspections((specimen) => ({
      ...specimen,
      view,
      explosion:
        view === 'exploded' && specimen.explosion === 0
          ? 62
          : view === 'exploded'
            ? specimen.explosion
            : 0,
      transition: EMPTY_TRANSITION,
    }));
  }

  setExplosion(explosion: number): void {
    if (this.state.scanner.enabled) return;
    this.updateInspections((specimen) => ({
      ...specimen,
      view: 'exploded',
      explosion: clamp(explosion, 0, 100),
      transition: EMPTY_TRANSITION,
    }));
  }

  setSectionOffset(sectionOffset: number): void {
    this.updateInspections((specimen) => ({
      ...specimen,
      view: 'section',
      sectionOffset: clamp(sectionOffset, -1, 1),
      transition: EMPTY_TRANSITION,
    }));
  }

  setGenomeVisible(genomeVisible: boolean): void {
    this.updateInspections((specimen) => ({
      ...specimen,
      genomeVisible,
      layerVisibility: genomeVisible
        ? { ...specimen.layerVisibility, genome: true }
        : specimen.layerVisibility,
    }));
  }

  setLayerVisible(layer: ObservationLayerId, visible: boolean): void {
    this.updateInspections((specimen) => ({
      ...specimen,
      layerVisibility: { ...specimen.layerVisibility, [layer]: visible },
    }));
  }

  selectPart(
    selectedPartId: ObservationPartId | null,
    slot = this.state.activeSlot,
  ): void {
    this.setSpecimen(slot, { ...this.specimen(slot), selectedPartId }, false);
  }

  setVariant(variantId: string | null, slot = this.state.activeSlot): void {
    this.setSpecimen(slot, { ...this.specimen(slot), variantId }, false);
  }

  startStructuralReveal(
    mode: Exclude<StructuralRevealMode, 'none' | 'reassemble'>,
  ): void {
    if (this.state.scanner.enabled) return;
    this.updateInspections((specimen) => beginStructuralTransition(specimen, mode));
  }

  reassemble(): void {
    if (this.state.scanner.enabled) {
      this.updateInspections((specimen) => ({
        ...specimen,
        view: 'surface',
        explosion: 0,
        transition: EMPTY_TRANSITION,
      }));
      return;
    }
    this.updateInspections(beginReassembly);
  }

  setScannerEnabled(enabled: boolean): void {
    if (enabled === this.state.scanner.enabled) return;
    if (enabled) {
      const restore: ObservationState['scanner']['restore'] = {
        a: { view: this.state.slots.a.view, explosion: this.state.slots.a.explosion },
        ...(this.state.slots.b
          ? {
              b: {
                view: this.state.slots.b.view,
                explosion: this.state.slots.b.explosion,
              },
            }
          : {}),
      };
      const reset = (specimen: SpecimenObservationState): SpecimenObservationState => ({
        ...specimen,
        view: specimen.view === 'exploded' ? 'surface' : specimen.view,
        explosion: 0,
        transition: EMPTY_TRANSITION,
      });
      this.state = {
        ...this.state,
        slots: {
          a: reset(this.state.slots.a),
          b: this.state.slots.b ? reset(this.state.slots.b) : null,
        },
        scanner: { ...this.state.scanner, enabled: true, restore },
      };
      return;
    }
    const restore = this.state.scanner.restore;
    const recover = (slot: SlotId, specimen: SpecimenObservationState | null) => {
      if (!specimen) return null;
      const saved = restore[slot];
      return saved
        ? { ...specimen, view: saved.view, explosion: saved.explosion }
        : specimen;
    };
    this.state = {
      ...this.state,
      slots: {
        a: recover('a', this.state.slots.a)!,
        b: recover('b', this.state.slots.b),
      },
      scanner: { ...this.state.scanner, enabled: false, restore: {} },
    };
  }

  setScannerAxis(axis: ScannerAxis): void {
    this.updateScannerProbe((probe) => ({ ...probe, axis }));
  }

  setScannerPosition(position: number): void {
    this.updateScannerProbe((probe) => ({
      ...probe,
      position: clamp(position, 0, 1),
    }));
  }

  setScannerThickness(thickness: number): void {
    this.updateScannerProbe((probe) => ({
      ...probe,
      thickness: clamp(thickness, 0.01, 0.3),
    }));
  }

  setScannerLinked(linked: boolean): void {
    const probes = linked
      ? {
          a: { ...this.state.scanner.probes[this.state.activeSlot] },
          b: { ...this.state.scanner.probes[this.state.activeSlot] },
        }
      : this.state.scanner.probes;
    this.state = {
      ...this.state,
      scanner: { ...this.state.scanner, linked, probes },
    };
  }

  setDecorationLevel(level: DecorationLevel): void {
    this.state = { ...this.state, decoration: { ...this.state.decoration, level } };
  }

  setDecorationPaused(paused: boolean): void {
    this.state = { ...this.state, decoration: { ...this.state.decoration, paused } };
  }

  private updateInspections(
    update: (specimen: SpecimenObservationState) => SpecimenObservationState,
  ): void {
    const active = this.state.activeSlot;
    let a = this.state.slots.a;
    let b = this.state.slots.b;
    if (this.state.comparison.enabled && this.state.comparison.linked && b) {
      a = update(a);
      b = update(b);
    } else if (active === 'a') a = update(a);
    else if (b) b = update(b);
    this.state = { ...this.state, slots: { a, b } };
  }

  private updateScannerProbe(
    update: (
      probe: ObservationState['scanner']['probes'][SlotId],
    ) => ObservationState['scanner']['probes'][SlotId],
  ): void {
    const active = this.state.activeSlot;
    const probes = this.state.scanner.linked
      ? {
          a: update(this.state.scanner.probes.a),
          b: update(this.state.scanner.probes.b),
        }
      : {
          ...this.state.scanner.probes,
          [active]: update(this.state.scanner.probes[active]),
        };
    this.state = {
      ...this.state,
      scanner: { ...this.state.scanner, probes },
    };
  }

  private specimen(slot: SlotId): SpecimenObservationState {
    return this.state.slots[slot] ?? this.state.slots.a;
  }

  private setSpecimen(
    slot: SlotId,
    specimen: SpecimenObservationState,
    activate = true,
  ): void {
    this.state = {
      ...this.state,
      slots:
        slot === 'a'
          ? { ...this.state.slots, a: specimen }
          : { ...this.state.slots, b: specimen },
      activeSlot: activate ? slot : this.state.activeSlot,
    };
  }
}

function createSpecimen(
  presetId: ObservationPresetId,
  previous?: SpecimenObservationState,
): SpecimenObservationState {
  const definition = getCatalogEntry(presetId);
  const visibility = createLayerVisibility(
    definition.layers.map((item) => item.id),
    previous?.layerVisibility,
  );
  const selectedPartId =
    previous?.selectedPartId && definition.parts.includes(previous.selectedPartId)
      ? previous.selectedPartId
      : null;
  return {
    presetId,
    variantId: null,
    view: previous?.view ?? 'surface',
    selectedPartId,
    explosion: previous?.explosion ?? 0,
    sectionOffset: previous?.sectionOffset ?? 0,
    genomeVisible: previous?.genomeVisible ?? false,
    layerVisibility: visibility,
    transition: EMPTY_TRANSITION,
  };
}

function createLayerVisibility(
  visibleLayers: readonly ObservationLayerId[],
  previous?: LayerVisibility,
): LayerVisibility {
  const visible = new Set(visibleLayers);
  return Object.fromEntries(
    ALL_LAYER_IDS.map((id) => [id, visible.has(id) ? (previous?.[id] ?? true) : false]),
  ) as unknown as LayerVisibility;
}

function cloneSpecimen(specimen: SpecimenObservationState): SpecimenObservationState {
  return {
    ...specimen,
    layerVisibility: { ...specimen.layerVisibility },
    transition: { ...specimen.transition },
  };
}

function cloneState(state: ObservationState): ObservationState {
  return {
    ...state,
    slots: {
      a: cloneSpecimen(state.slots.a),
      b: state.slots.b ? cloneSpecimen(state.slots.b) : null,
    },
    comparison: { ...state.comparison },
    scanner: {
      ...state.scanner,
      probes: {
        a: { ...state.scanner.probes.a },
        b: { ...state.scanner.probes.b },
      },
      restore: { ...state.scanner.restore },
    },
    decoration: { ...state.decoration },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
