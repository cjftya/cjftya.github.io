import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import type { ObservationDefinition } from '../../src/virus-sim/observation/types';
import {
  CAPSID_GEOMETRY_DETAIL,
  createFivefoldCapsomerGeometry,
} from '../../src/virus-sim/rendering/models/capsidComponents';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import type { ObservationModel } from '../../src/virus-sim/rendering/models/types';

const PART_ONE_BUILDERS = new Set([
  'icosahedral-capsid',
  'layered-capsid',
  'ms2',
  'adenovirus',
  'rotavirus',
]);

const PART_ONE_ENTRIES = VIRUS_CATALOG.filter((entry) =>
  PART_ONE_BUILDERS.has(entry.modelBuilder),
);

describe('Virus Sim v4.9 part 1 capsid geometry quality', () => {
  it('covers the exact 32-entry capsid rollout without changing catalog scope', () => {
    expect(VIRUS_CATALOG).toHaveLength(95);
    expect(PART_ONE_ENTRIES).toHaveLength(32);
    expect(
      PART_ONE_ENTRIES.filter((entry) => entry.modelBuilder === 'icosahedral-capsid'),
    ).toHaveLength(23);
    expect(
      PART_ONE_ENTRIES.filter((entry) => entry.modelBuilder === 'layered-capsid'),
    ).toHaveLength(6);
    for (const builder of ['ms2', 'adenovirus', 'rotavirus']) {
      expect(
        PART_ONE_ENTRIES.filter((entry) => entry.modelBuilder === builder),
        builder,
      ).toHaveLength(1);
    }
  });

  it('defines a consistently richer high-quality geometry tier', () => {
    const high = CAPSID_GEOMETRY_DETAIL.high;
    const low = CAPSID_GEOMETRY_DETAIL.low;
    expect(high.strongShellSubdivision).toBeGreaterThan(low.strongShellSubdivision);
    expect(high.moderateShellSubdivision).toBeGreaterThan(low.moderateShellSubdivision);
    expect(high.smoothShellWidthSegments).toBeGreaterThan(low.smoothShellWidthSegments);
    expect(high.smoothShellHeightSegments).toBeGreaterThan(
      low.smoothShellHeightSegments,
    );
    expect(high.capsomerRadialSegments).toBeGreaterThan(low.capsomerRadialSegments);
    expect(high.capsomerHeightSegments).toBeGreaterThan(low.capsomerHeightSegments);
    expect(high.roundedUnitCapSegments).toBeGreaterThan(low.roundedUnitCapSegments);
    expect(high.roundedUnitRadialSegments).toBeGreaterThan(
      low.roundedUnitRadialSegments,
    );
    expect(high.roundedUnitSphereWidthSegments).toBeGreaterThan(
      low.roundedUnitSphereWidthSegments,
    );
    expect(high.roundedUnitSphereHeightSegments).toBeGreaterThan(
      low.roundedUnitSphereHeightSegments,
    );
    expect(high.torusRadialSegments).toBeGreaterThan(low.torusRadialSegments);
    expect(high.torusTubularSegments).toBeGreaterThan(low.torusTubularSegments);
    expect(high.vertexRadialSegments).toBeGreaterThan(low.vertexRadialSegments);
    expect(high.turretRadialSegments).toBeGreaterThan(low.turretRadialSegments);
  });

  it('keeps a fivefold outline while beveling high-quality pentamers', () => {
    const high = createFivefoldCapsomerGeometry(0.12, 0.16, 0.1, 'high');
    const low = createFivefoldCapsomerGeometry(0.12, 0.16, 0.1, 'low');
    expect(high.type).toBe('LatheGeometry');
    expect(high.name).toBe('fivefold-beveled-capsomer');
    expect(low.type).toBe('CylinderGeometry');
    expect((high as THREE.LatheGeometry).parameters.segments).toBe(5);
    expect((low as THREE.CylinderGeometry).parameters.radialSegments).toBe(5);
    expect(high.getAttribute('position').count).toBeGreaterThan(
      low.getAttribute('position').count,
    );
    high.dispose();
    low.dispose();
  });

  it('builds all 32 high and low models with finite contracts and budgets', () => {
    for (const entry of PART_ONE_ENTRIES) {
      const measurements = (['high', 'low'] as const).map((quality) => {
        const model = createObservationModel(entry.id, quality);
        assertModelContract(entry, model, quality);
        const measurement = measureModel(model.root);
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
        return measurement;
      });
      expect(
        measurements[0]!.triangles,
        `${entry.id}: quality ordering`,
      ).toBeGreaterThanOrEqual(measurements[1]!.triangles);
    }
  });

  it('preserves structural markers while increasing representative detail', () => {
    for (const quality of ['high', 'low'] as const) {
      for (const [id, names] of Object.entries({
        hpv16: ['capsid-shell-smooth', 'ordered-surface-pentameric'],
        aav2: ['dimple-rings'],
        'canine-parvovirus': ['ordered-surface-channelled', 'channelled-dimple-rings'],
        'adenovirus-5': [
          'adenovirus-vertex-pentons',
          'adenovirus-fiber-shafts-and-knobs',
        ],
        'rotavirus-rrv': ['layered-cone-projections'],
        'reovirus-t3d': ['reovirus-channelled-turrets'],
        stiv: ['stiv-wide-vertex-turrets'],
      })) {
        const model = createObservationModel(id, quality);
        for (const name of names) {
          expect(
            model.root.getObjectByName(name),
            `${id} ${quality}: ${name}`,
          ).toBeDefined();
        }
        disposeObject(model.root);
      }
    }

    const highHpv = createObservationModel('hpv16', 'high');
    const lowHpv = createObservationModel('hpv16', 'low');
    expect(meshGeometry(highHpv, 'ordered-surface-pentameric').name).toBe(
      'fivefold-beveled-capsomer',
    );
    expect(meshGeometry(lowHpv, 'ordered-surface-pentameric').type).toBe(
      'CylinderGeometry',
    );
    expect(
      meshGeometry(highHpv, 'capsid-shell-smooth').getAttribute('position').count,
    ).toBeGreaterThan(
      meshGeometry(lowHpv, 'capsid-shell-smooth').getAttribute('position').count,
    );

    const highAav = createObservationModel('aav2', 'high');
    const lowAav = createObservationModel('aav2', 'low');
    expect(
      meshGeometry(highAav, 'dimple-rings').getAttribute('position').count,
    ).toBeGreaterThan(
      meshGeometry(lowAav, 'dimple-rings').getAttribute('position').count,
    );

    const highAdenovirus = createObservationModel('adenovirus-5', 'high');
    const lowAdenovirus = createObservationModel('adenovirus-5', 'low');
    expect(
      meshGeometry(highAdenovirus, 'adenovirus-faceted-capsid').getAttribute('position')
        .count,
    ).toBeGreaterThan(
      meshGeometry(lowAdenovirus, 'adenovirus-faceted-capsid').getAttribute('position')
        .count,
    );

    for (const model of [
      highHpv,
      lowHpv,
      highAav,
      lowAav,
      highAdenovirus,
      lowAdenovirus,
    ]) {
      disposeObject(model.root);
    }
  });
});

function assertModelContract(
  entry: ObservationDefinition,
  model: ObservationModel,
  quality: 'high' | 'low',
): void {
  model.root.updateMatrixWorld(true);
  for (const partId of entry.parts) {
    expect(
      model.parts.get(partId)?.length ?? 0,
      `${entry.id} ${quality}: ${partId}`,
    ).toBeGreaterThan(0);
  }
  for (const partId of model.parts.keys()) {
    expect(entry.parts, `${entry.id} ${quality}: orphan part ${partId}`).toContain(
      partId,
    );
  }
  for (const layer of entry.layers) {
    expect(
      model.layers.get(layer.id)?.length ?? 0,
      `${entry.id} ${quality}: ${layer.id}`,
    ).toBeGreaterThan(0);
  }
  for (const layerId of model.layers.keys()) {
    expect(
      entry.layers.map((layer) => layer.id),
      `${entry.id} ${quality}: orphan layer ${layerId}`,
    ).toContain(layerId);
  }

  model.root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const attributeName of ['position', 'normal'] as const) {
      const attribute = object.geometry.getAttribute(attributeName);
      if (!attribute) continue;
      expect(
        Array.from(attribute.array).every(Number.isFinite),
        `${entry.id} ${quality}: ${attributeName}`,
      ).toBe(true);
    }
    if (object.geometry.index) {
      expect(
        Array.from(object.geometry.index.array).every(Number.isFinite),
        `${entry.id} ${quality}: index`,
      ).toBe(true);
    }
  });
}

function meshGeometry(model: ObservationModel, name: string): THREE.BufferGeometry {
  const object = model.root.getObjectByName(name);
  expect(object, name).toBeDefined();
  expect(object, name).toBeInstanceOf(THREE.Mesh);
  return (object as THREE.Mesh).geometry;
}

function measureModel(root: THREE.Object3D): {
  extent: number;
  objects: number;
  renderables: number;
  geometries: number;
  materials: number;
  triangles: number;
} {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  let objects = 0;
  let renderables = 0;
  let triangles = 0;
  root.traverse((object) => {
    objects += 1;
    if (!(object instanceof THREE.Mesh)) return;
    renderables += 1;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of objectMaterials) materials.add(material);
    const primitiveTriangles = object.geometry.index
      ? object.geometry.index.count / 3
      : (object.geometry.getAttribute('position')?.count ?? 0) / 3;
    triangles +=
      primitiveTriangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
  });
  return {
    extent: Math.max(...size.toArray()),
    objects,
    renderables,
    geometries: geometries.size,
    materials: materials.size,
    triangles,
  };
}

function disposeObject(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of objectMaterials) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
