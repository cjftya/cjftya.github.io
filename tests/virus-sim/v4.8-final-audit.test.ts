import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PHYSICAL_DIMENSIONS } from '../../src/virus-sim/catalog/dimensions';
import { getGeometryProfile } from '../../src/virus-sim/catalog/geometryProfiles';
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
import type { ScannerAxis } from '../../src/virus-sim/observation/types';
import { SpecimenView } from '../../src/virus-sim/rendering/SpecimenView';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import { renderAppLayout } from '../../src/virus-sim/ui/layout';

const EXPECTED_BUILDERS = [
  't4',
  'lambda',
  't7',
  'phage-family',
  'ms2',
  'tmv',
  'm13',
  'adenovirus',
  'rotavirus',
  'hsv',
  'influenza',
  'vsv',
  'vaccinia',
  'filovirus',
  'lentivirus',
  'coronavirus',
  'hbv',
  'alphavirus',
  'cystovirus',
  'icosahedral-capsid',
  'layered-capsid',
  'plant-filament',
  'archaeal-rod',
  'spindle-virus',
  'geminate-capsid',
] as const;

const SCANNER_AXES: readonly ScannerAxis[] = ['x', 'y', 'z'];

describe('Virus Sim v4.8 final catalog and lifecycle audit', () => {
  it('keeps catalog, signature, dimensions and history registries exact', () => {
    const catalogIds = VIRUS_CATALOG.map((entry) => entry.id);
    expect(catalogIds).toHaveLength(71);
    expect(new Set(catalogIds).size).toBe(71);
    expect(new Set(STRUCTURAL_SIGNATURES.map((entry) => entry.virusId))).toEqual(
      new Set(catalogIds),
    );
    expect(new Set(Object.keys(PHYSICAL_DIMENSIONS))).toEqual(new Set(catalogIds));
    expect(new Set(VIRUS_HISTORY.map((entry) => entry.virusId))).toEqual(
      new Set(catalogIds),
    );
    expect(new Set(VIRUS_CATALOG.map((entry) => entry.modelBuilder))).toEqual(
      new Set(EXPECTED_BUILDERS),
    );

    for (const entry of VIRUS_CATALOG) {
      expect(entry.name.trim(), `${entry.id}: name`).not.toBe('');
      expect(entry.shortName.trim(), `${entry.id}: shortName`).not.toBe('');
      expect(entry.category.trim(), `${entry.id}: category`).not.toBe('');
      expect(
        entry.description.trim().length,
        `${entry.id}: description`,
      ).toBeGreaterThan(20);
      expect(entry.feature.trim().length, `${entry.id}: feature`).toBeGreaterThan(5);
      expect(
        entry.simplifications.length,
        `${entry.id}: simplifications`,
      ).toBeGreaterThan(0);
      expect(entry.displayLength, `${entry.id}: displayLength`).toBeGreaterThan(0);
      expect(entry.sectionRadius, `${entry.id}: sectionRadius`).toBeGreaterThan(0);
      expect(getStructuralSignature(entry.id)?.builder, entry.id).toBe(
        entry.modelBuilder,
      );
    }
    if (process.env.VIRUS_SIM_CATALOG_REPORT === '1') {
      process.stdout.write(
        `${JSON.stringify(
          VIRUS_CATALOG.map((entry) => ({
            id: entry.id,
            name: entry.shortName,
            family: getGeometryProfile(entry.geometryProfileId).family,
            builder: entry.modelBuilder,
            evidence: entry.evidenceStatus,
            parts: entry.parts.length,
            layers: entry.layers.length,
          })),
        )}\n`,
      );
    }
  });

  it('resolves every nested source reference with unique registry IDs', () => {
    expect(new Set(STRUCTURE_SOURCES.map((source) => source.id)).size).toBe(
      STRUCTURE_SOURCES.length,
    );
    expect(new Set(HISTORY_SOURCES.map((source) => source.id)).size).toBe(
      HISTORY_SOURCES.length,
    );

    for (const source of [...STRUCTURE_SOURCES, ...HISTORY_SOURCES]) {
      expect(source.url, source.id).toMatch(/^https:\/\//);
      expect(source.checkedOn, source.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    for (const entry of VIRUS_CATALOG) {
      for (const sourceId of [
        ...entry.sourceIds,
        ...PHYSICAL_DIMENSIONS[entry.id]!.sourceIds,
      ]) {
        expect(getStructureSource(sourceId), `${entry.id}: ${sourceId}`).toBeDefined();
      }
      for (const evidence of getStructuralSignature(entry.id)!.evidence) {
        expect(
          evidence.sourceIds.length,
          `${entry.id}: ${evidence.componentId}`,
        ).toBeGreaterThan(0);
        for (const sourceId of evidence.sourceIds) {
          expect(
            getStructureSource(sourceId),
            `${entry.id}: ${sourceId}`,
          ).toBeDefined();
        }
      }

      const history = getVirusHistory(entry.id);
      const historySourceIds = [
        ...history.sourceIds,
        ...(history.discovery?.sourceIds ?? []),
        ...(history.hostContext?.sourceIds ?? []),
        ...history.events.flatMap((event) => event.sourceIds),
      ];
      expect(historySourceIds.length, `${entry.id}: history sources`).toBeGreaterThan(
        0,
      );
      for (const sourceId of historySourceIds) {
        expect(getHistorySource(sourceId), `${entry.id}: ${sourceId}`).toBeDefined();
      }
      expect(history.verifiedAt, entry.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps all high and low models inside global resource budgets', () => {
    const measurements: ModelMeasurement[] = [];
    for (const entry of VIRUS_CATALOG) {
      for (const quality of ['high', 'low'] as const) {
        const startedAt = performance.now();
        const model = createObservationModel(entry.id, quality);
        const measurement = measureModel(
          entry.id,
          quality,
          model.root,
          performance.now() - startedAt,
        );
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
        disposeObject(model.root);
      }
    }

    for (const entry of VIRUS_CATALOG) {
      const high = measurements.find(
        (measurement) => measurement.id === entry.id && measurement.quality === 'high',
      )!;
      const low = measurements.find(
        (measurement) => measurement.id === entry.id && measurement.quality === 'low',
      )!;
      expect(low.triangles, `${entry.id}: low triangle budget`).toBeLessThanOrEqual(
        high.triangles,
      );
    }
    if (process.env.VIRUS_SIM_AUDIT_REPORT === '1') {
      process.stdout.write(`${JSON.stringify(summarizeMeasurements(measurements))}\n`);
    }
  });

  it('sweeps every view, layer, part and scanner axis for all 71 entries', () => {
    for (const entry of VIRUS_CATALOG) {
      const scene = new THREE.Scene();
      const store = new ObservationStore(false, entry.id);
      const view = new SpecimenView(scene, entry.id, 'performance');

      for (const mode of ['surface', 'transparent', 'section', 'exploded'] as const) {
        store.setView(mode);
        if (mode === 'section') store.setSectionOffset(0.35);
        if (mode === 'exploded') store.setExplosion(72);
        store.setGenomeVisible(true);
        view.update(store.getSnapshot().specimen);
        expectFiniteBounds(view.getBounds(), `${entry.id}: ${mode}`);
      }

      for (const partId of entry.parts) {
        store.selectPart(partId);
        view.update(store.getSnapshot().specimen);
        expectFiniteBounds(view.getBounds(), `${entry.id}: part ${partId}`);
      }
      for (const layer of entry.layers) {
        store.setLayerVisible(layer.id, false);
        view.update(store.getSnapshot().specimen);
        store.setLayerVisible(layer.id, true);
      }

      store.setView('surface');
      view.update(store.getSnapshot().specimen);
      for (const axis of SCANNER_AXES) {
        for (const position of [0, 0.5, 1]) {
          const slice = view.prepareScannerClipping(axis, position, 0.08);
          expect(
            [
              ...slice.center.toArray(),
              ...slice.direction.toArray(),
              ...slice.up.toArray(),
              slice.width,
              slice.height,
              slice.depth,
            ].every(Number.isFinite),
            `${entry.id}: scanner ${axis} ${position}`,
          ).toBe(true);
          expect(slice.width, `${entry.id}: scanner ${axis}`).toBeGreaterThan(0);
          expect(slice.height, `${entry.id}: scanner ${axis}`).toBeGreaterThan(0);
          expect(slice.depth, `${entry.id}: scanner ${axis}`).toBeGreaterThan(0);
          slice.restore();
        }
      }
      view.dispose();
      expect(scene.children).not.toContain(view.root);
    }
  });

  it('disposes every owned geometry and material exactly once', () => {
    for (const entry of VIRUS_CATALOG) {
      const scene = new THREE.Scene();
      const view = new SpecimenView(scene, entry.id, 'performance');
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      view.root.traverse((object) => {
        if ('geometry' in object)
          geometries.add((object as THREE.Mesh).geometry as THREE.BufferGeometry);
        if (!('material' in object)) return;
        const value = (object as THREE.Mesh).material;
        for (const material of Array.isArray(value) ? value : [value]) {
          materials.add(material);
        }
      });
      const disposed = new Map<string, number>();
      for (const resource of [...geometries, ...materials]) {
        disposed.set(resource.uuid, 0);
        resource.addEventListener('dispose', () => {
          disposed.set(resource.uuid, (disposed.get(resource.uuid) ?? 0) + 1);
        });
      }
      view.dispose();
      for (const [uuid, count] of disposed) {
        expect(count, `${entry.id}: ${uuid}`).toBe(1);
      }
    }
  });

  it('keeps the v4.8.2 native-select UI compact, semantic and externally safe', () => {
    const root = { innerHTML: '' } as HTMLElement;
    renderAppLayout(root);
    expect(root.innerHTML).toContain('<span class="eyebrow">v4.8.2</span>');
    expect(root.innerHTML.match(/<details class="detail-section/g)).toHaveLength(5);
    expect(root.innerHTML.match(/<select id="virus-select">/g)).toHaveLength(1);
    const virusSelect =
      root.innerHTML.match(/<select id="virus-select">([\s\S]*?)<\/select>/)?.[1] ?? '';
    const virusOptions = virusSelect.match(/<option value=/g);
    expect(virusOptions).toHaveLength(71);
    for (const link of root.innerHTML.matchAll(/target="_blank"[^>]+>/g)) {
      expect(link[0]).toContain('rel="noopener noreferrer"');
    }
    for (const removedCopy of [
      'Physics Arena',
      'Micro Lab',
      '비교 모드',
      '자동 다큐',
      'data-camera-step',
      'reset-camera',
    ]) {
      expect(root.innerHTML).not.toContain(removedCopy);
    }
  });
});

interface ModelMeasurement {
  readonly id: string;
  readonly quality: 'high' | 'low';
  readonly extent: number;
  readonly objects: number;
  readonly renderables: number;
  readonly geometries: number;
  readonly materials: number;
  readonly triangles: number;
  readonly buildMs: number;
}

function measureModel(
  id: string,
  quality: 'high' | 'low',
  root: THREE.Object3D,
  buildMs: number,
): ModelMeasurement {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  let objects = 0;
  let renderables = 0;
  let triangles = 0;
  root.traverse((object) => {
    objects += 1;
    if (!('geometry' in object)) return;
    renderables += 1;
    const mesh = object as THREE.Mesh;
    geometries.add(mesh.geometry);
    const objectMaterials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    objectMaterials.forEach((material) => materials.add(material));
    if (!(object instanceof THREE.Mesh)) return;
    const baseTriangles =
      (mesh.geometry.index?.count ??
        mesh.geometry.getAttribute('position')?.count ??
        0) / 3;
    triangles += baseTriangles * (mesh instanceof THREE.InstancedMesh ? mesh.count : 1);
  });
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  return {
    id,
    quality,
    extent: Math.max(...size.toArray()),
    objects,
    renderables,
    geometries: geometries.size,
    materials: materials.size,
    triangles,
    buildMs,
  };
}

function summarizeMeasurements(measurements: readonly ModelMeasurement[]) {
  const top = (
    field: 'objects' | 'geometries' | 'materials' | 'triangles' | 'buildMs',
  ) =>
    [...measurements]
      .sort((left, right) => right[field] - left[field])
      .slice(0, 8)
      .map(({ id, quality, [field]: value }) => ({ id, quality, value }));
  return {
    models: measurements.length,
    objects: top('objects'),
    geometries: top('geometries'),
    materials: top('materials'),
    triangles: top('triangles'),
    buildMs: top('buildMs'),
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

function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if ('geometry' in object) geometries.add((object as THREE.Mesh).geometry);
    if (!('material' in object)) return;
    const value = (object as THREE.Mesh).material;
    for (const material of Array.isArray(value) ? value : [value])
      materials.add(material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
