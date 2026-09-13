import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PHYSICAL_DIMENSIONS } from '../../src/virus-sim/catalog/dimensions';
import {
  VIRUS_HISTORY,
  getVirusHistory,
} from '../../src/virus-sim/catalog/history/registry';
import {
  HISTORY_SOURCES,
  getHistorySource,
} from '../../src/virus-sim/catalog/history/sources';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import {
  STRUCTURE_SOURCES,
  getStructureSource,
} from '../../src/virus-sim/catalog/sources';
import {
  STRUCTURAL_SIGNATURES,
  getStructuralSignature,
} from '../../src/virus-sim/catalog/structuralSignatures';
import { ObservationStore } from '../../src/virus-sim/observation/ObservationStore';
import type {
  ObservationDefinition,
  ScannerAxis,
} from '../../src/virus-sim/observation/types';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import type { ObservationModel } from '../../src/virus-sim/rendering/models/types';

const QUALITIES = ['high', 'low'] as const;
const SCANNER_AXES: readonly ScannerAxis[] = ['x', 'y', 'z'];

describe('Virus Sim v4.9 final model quality audit', () => {
  it('publishes consistent v4.9 and 95-virus page metadata', () => {
    const page = readFileSync('projects/virus-sim/index.html', 'utf8');
    expect(page).toContain('<title>Virus Sim v4.9 · 3D Virus Structure Viewer</title>');
    expect(page).toContain('content="95개 바이러스의 3D 구조');
  });

  it('keeps exact catalog, builder, signature, dimension, history and source coverage', () => {
    const catalogIds = VIRUS_CATALOG.map(({ id }) => id);
    expect(catalogIds).toHaveLength(95);
    expect(new Set(catalogIds).size).toBe(95);
    expect(new Set(VIRUS_CATALOG.map(({ modelBuilder }) => modelBuilder)).size).toBe(
      26,
    );
    expect(new Set(STRUCTURAL_SIGNATURES.map(({ virusId }) => virusId))).toEqual(
      new Set(catalogIds),
    );
    expect(new Set(Object.keys(PHYSICAL_DIMENSIONS))).toEqual(new Set(catalogIds));
    expect(new Set(VIRUS_HISTORY.map(({ virusId }) => virusId))).toEqual(
      new Set(catalogIds),
    );
    expect(new Set(STRUCTURE_SOURCES.map(({ id }) => id)).size).toBe(
      STRUCTURE_SOURCES.length,
    );
    expect(new Set(HISTORY_SOURCES.map(({ id }) => id)).size).toBe(
      HISTORY_SOURCES.length,
    );

    for (const entry of VIRUS_CATALOG) {
      const signature = getStructuralSignature(entry.id);
      expect(signature?.builder, entry.id).toBe(entry.modelBuilder);
      for (const sourceId of [
        ...entry.sourceIds,
        ...PHYSICAL_DIMENSIONS[entry.id]!.sourceIds,
        ...signature!.evidence.flatMap(({ sourceIds }) => sourceIds),
      ]) {
        expect(getStructureSource(sourceId), `${entry.id}: ${sourceId}`).toBeDefined();
      }

      const history = getVirusHistory(entry.id);
      for (const sourceId of [
        ...history.sourceIds,
        ...(history.discovery?.sourceIds ?? []),
        ...(history.hostContext?.sourceIds ?? []),
        ...history.events.flatMap(({ sourceIds }) => sourceIds),
      ]) {
        expect(getHistorySource(sourceId), `${entry.id}: ${sourceId}`).toBeDefined();
      }
    }
  });

  it('audits all 95 high and low models with geometry diagnostics and hard budgets', () => {
    const measurements: ModelMeasurement[] = [];
    for (const entry of VIRUS_CATALOG) {
      for (const quality of QUALITIES) {
        const model = createObservationModel(entry.id, quality);
        assertModelIntegrity(entry, model, quality);
        const measurement = measureModel(entry, quality, model.root);
        measurements.push(measurement);
        expect(measurement.extent, `${entry.id} ${quality}: extent`).toBeGreaterThan(
          0.5,
        );
        expect(measurement.extent, `${entry.id} ${quality}: extent`).toBeLessThan(24);
        expect(
          measurement.objects,
          `${entry.id} ${quality}: objects`,
        ).toBeLessThanOrEqual(64);
        expect(
          measurement.renderables,
          `${entry.id} ${quality}: renderables`,
        ).toBeLessThanOrEqual(56);
        expect(
          measurement.geometries,
          `${entry.id} ${quality}: geometries`,
        ).toBeLessThanOrEqual(48);
        expect(
          measurement.materials,
          `${entry.id} ${quality}: materials`,
        ).toBeLessThanOrEqual(32);
        expect(
          measurement.triangles,
          `${entry.id} ${quality}: triangles`,
        ).toBeLessThanOrEqual(75_000);
        expect(
          measurement.baseVertices,
          `${entry.id} ${quality}: base vertices`,
        ).toBeGreaterThan(0);
        expect(
          measurement.effectiveVertices,
          `${entry.id} ${quality}: effective vertices`,
        ).toBeGreaterThanOrEqual(measurement.baseVertices);
        disposeAndAssert(model.root, `${entry.id} ${quality}`);
      }
    }

    for (const entry of VIRUS_CATALOG) {
      const high = measurements.find(
        (item) => item.id === entry.id && item.quality === 'high',
      )!;
      const low = measurements.find(
        (item) => item.id === entry.id && item.quality === 'low',
      )!;
      expect(high.triangles, `${entry.id}: quality ordering`).toBeGreaterThanOrEqual(
        low.triangles,
      );
    }

    if (process.env.VIRUS_SIM_V49_AUDIT_REPORT === '1') {
      process.stdout.write(`${JSON.stringify(summarizeMeasurements(measurements))}\n`);
    }
  });

  it('deep-checks one enhanced-quality representative from all 26 builders', () => {
    const representatives = builderRepresentatives();
    expect(representatives).toHaveLength(26);

    for (const entry of representatives) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, entry.id);
      const view = new SpecimenView(scene, entry.id, 'enhanced');

      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.35);
        if (mode === 'exploded') store.setExplosion(72);
        store.setGenomeVisible(true);
        view.update(store.getSnapshot().specimen);
        expectFiniteBounds(view.getBounds(), `${entry.modelBuilder}: ${mode}`);
      }

      for (const partId of entry.parts) {
        store.selectPart(partId);
        view.update(store.getSnapshot().specimen);
        expectFiniteBounds(view.getBounds(), `${entry.modelBuilder}: part ${partId}`);
      }
      for (const layer of entry.layers) {
        store.setLayerVisible(layer.id, false);
        view.update(store.getSnapshot().specimen);
        store.setLayerVisible(layer.id, true);
        view.update(store.getSnapshot().specimen);
      }

      store.setView('surface');
      view.update(store.getSnapshot().specimen);
      for (const axis of SCANNER_AXES) {
        const slice = view.prepareScannerClipping(axis, 0.5, 0.08);
        expect(
          [
            ...slice.center.toArray(),
            ...slice.direction.toArray(),
            ...slice.up.toArray(),
            slice.width,
            slice.height,
            slice.depth,
          ].every(Number.isFinite),
          `${entry.modelBuilder}: scanner ${axis}`,
        ).toBe(true);
        expect(slice.width).toBeGreaterThan(0);
        expect(slice.height).toBeGreaterThan(0);
        expect(slice.depth).toBeGreaterThan(0);
        slice.restore();
      }

      view.dispose();
      expect(scene.children).not.toContain(view.root);
    }
  });
});

interface ModelMeasurement {
  readonly id: string;
  readonly builder: string;
  readonly quality: (typeof QUALITIES)[number];
  readonly extent: number;
  readonly objects: number;
  readonly renderables: number;
  readonly geometries: number;
  readonly materials: number;
  readonly baseVertices: number;
  readonly effectiveVertices: number;
  readonly triangles: number;
  readonly minimumRadialSegments: number | null;
  readonly shellDetails: readonly string[];
}

function assertModelIntegrity(
  entry: ObservationDefinition,
  model: ObservationModel,
  quality: (typeof QUALITIES)[number],
): void {
  model.root.updateMatrixWorld(true);
  expect(new Set(model.parts.keys()), `${entry.id} ${quality}: parts`).toEqual(
    new Set(entry.parts),
  );
  expect(new Set(model.layers.keys()), `${entry.id} ${quality}: layers`).toEqual(
    new Set(entry.layers.map(({ id }) => id)),
  );

  model.root.traverse((object) => {
    expect(
      [
        ...object.position.toArray(),
        ...object.quaternion.toArray(),
        ...object.scale.toArray(),
      ].every(Number.isFinite),
      `${entry.id} ${quality}: ${object.name || object.type} transform`,
    ).toBe(true);
    if (!('geometry' in object)) return;
    const geometry = (object as THREE.Mesh).geometry;
    const position = geometry.getAttribute('position');
    expect(position, `${entry.id} ${quality}: ${object.name} position`).toBeDefined();
    expect(
      position.count,
      `${entry.id} ${quality}: ${object.name} empty`,
    ).toBeGreaterThan(0);
    for (const attributeName of ['position', 'normal'] as const) {
      const attribute = geometry.getAttribute(attributeName);
      if (!attribute) continue;
      expect(
        Array.from(attribute.array).every(Number.isFinite),
        `${entry.id} ${quality}: ${object.name} ${attributeName}`,
      ).toBe(true);
    }
    if (geometry.index) {
      expect(
        Array.from(geometry.index.array).every(Number.isFinite),
        `${entry.id} ${quality}: ${object.name} index`,
      ).toBe(true);
    }
  });

  for (const explosion of model.objectExplosions) {
    expect(
      explosion.origin.equals(explosion.object.position),
      `${entry.id} ${quality}: object explosion origin`,
    ).toBe(true);
    expect(
      [...explosion.origin.toArray(), ...explosion.direction.toArray()].every(
        Number.isFinite,
      ),
      `${entry.id} ${quality}: object explosion finite`,
    ).toBe(true);
  }
  for (const explosion of model.instanceExplosions) {
    const label = `${entry.id} ${quality}: ${explosion.mesh.name}`;
    for (const values of [
      explosion.origins,
      explosion.directions,
      explosion.quaternions,
      explosion.scales,
    ]) {
      expect(values, label).toHaveLength(explosion.mesh.count);
      expect(
        values.flatMap((value) => value.toArray()).every(Number.isFinite),
        `${label}: finite`,
      ).toBe(true);
    }
  }
}

function measureModel(
  entry: ObservationDefinition,
  quality: (typeof QUALITIES)[number],
  root: THREE.Object3D,
): ModelMeasurement {
  const bounds = new THREE.Box3().setFromObject(root);
  expect(bounds.isEmpty(), `${entry.id} ${quality}: bounds`).toBe(false);
  expect(
    [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
    `${entry.id} ${quality}: bounds finite`,
  ).toBe(true);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const radialSegments: number[] = [];
  const shellDetails = new Set<string>();
  let objects = 0;
  let renderables = 0;
  let baseVertices = 0;
  let effectiveVertices = 0;
  let triangles = 0;
  root.traverse((object) => {
    objects += 1;
    if (!('geometry' in object)) return;
    renderables += 1;
    const renderable = object as THREE.Mesh;
    const geometry = renderable.geometry;
    const instances = object instanceof THREE.InstancedMesh ? object.count : 1;
    const vertices = geometry.getAttribute('position')?.count ?? 0;
    geometries.add(geometry);
    baseVertices += vertices;
    effectiveVertices += vertices * instances;
    const objectMaterials = Array.isArray(renderable.material)
      ? renderable.material
      : [renderable.material];
    for (const material of objectMaterials) materials.add(material);

    const parameters = (
      geometry as THREE.BufferGeometry & {
        parameters?: Record<string, unknown>;
      }
    ).parameters;
    const radial = parameters?.radialSegments;
    if (typeof radial === 'number') radialSegments.push(radial);
    if (/(shell|capsid|head|envelope|body)/i.test(object.name)) {
      const detail =
        parameters?.detail ??
        parameters?.widthSegments ??
        parameters?.radialSegments ??
        parameters?.segments ??
        'custom';
      shellDetails.add(`${object.name || object.type}:${geometry.type}:${detail}`);
    }
    if (object instanceof THREE.Mesh) {
      const baseTriangles = (geometry.index?.count ?? vertices) / 3;
      triangles += baseTriangles * instances;
    }
  });

  return {
    id: entry.id,
    builder: entry.modelBuilder,
    quality,
    extent: Math.max(...bounds.getSize(new THREE.Vector3()).toArray()),
    objects,
    renderables,
    geometries: geometries.size,
    materials: materials.size,
    baseVertices,
    effectiveVertices,
    triangles,
    minimumRadialSegments:
      radialSegments.length > 0 ? Math.min(...radialSegments) : null,
    shellDetails: [...shellDetails],
  };
}

function builderRepresentatives(): ObservationDefinition[] {
  const byBuilder = new Map<string, ObservationDefinition>();
  for (const entry of VIRUS_CATALOG) {
    if (!byBuilder.has(entry.modelBuilder)) byBuilder.set(entry.modelBuilder, entry);
  }
  return [...byBuilder.values()];
}

function summarizeMeasurements(measurements: readonly ModelMeasurement[]) {
  const top = (field: 'objects' | 'renderables' | 'effectiveVertices' | 'triangles') =>
    [...measurements]
      .sort((left, right) => right[field] - left[field])
      .slice(0, 10)
      .map(({ id, builder, quality, [field]: value }) => ({
        id,
        builder,
        quality,
        value,
      }));
  return {
    models: measurements.length,
    builders: new Set(measurements.map(({ builder }) => builder)).size,
    objects: top('objects'),
    renderables: top('renderables'),
    effectiveVertices: top('effectiveVertices'),
    triangles: top('triangles'),
    primitiveDiagnostics: measurements.map(
      ({ id, quality, minimumRadialSegments, shellDetails }) => ({
        id,
        quality,
        minimumRadialSegments,
        shellDetails,
      }),
    ),
  };
}

function expectFiniteBounds(bounds: THREE.Box3, label: string): void {
  expect(bounds.isEmpty(), label).toBe(false);
  expect(
    [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
    label,
  ).toBe(true);
  expect(bounds.getSize(new THREE.Vector3()).length(), label).toBeGreaterThan(0.5);
}

function disposeAndAssert(root: THREE.Object3D, label: string): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if ('geometry' in object) geometries.add((object as THREE.Mesh).geometry);
    if (!('material' in object)) return;
    const value = (object as THREE.Mesh).material;
    for (const material of Array.isArray(value) ? value : [value]) {
      materials.add(material);
    }
  });
  const disposeCounts = new Map<string, number>();
  for (const resource of [...geometries, ...materials]) {
    disposeCounts.set(resource.uuid, 0);
    resource.addEventListener('dispose', () => {
      disposeCounts.set(resource.uuid, (disposeCounts.get(resource.uuid) ?? 0) + 1);
    });
    resource.dispose();
  }
  for (const [uuid, count] of disposeCounts) {
    expect(count, `${label}: dispose ${uuid}`).toBe(1);
  }
}
