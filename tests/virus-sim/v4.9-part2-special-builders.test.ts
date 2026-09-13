import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { VIRUS_CATALOG } from '../../src/virus-sim/catalog/registry';
import type { ObservationDefinition } from '../../src/virus-sim/observation/types';
import { SURFACE_COMPONENT_DETAIL } from '../../src/virus-sim/rendering/models/components';
import { createObservationModel } from '../../src/virus-sim/rendering/models/createObservationModel';
import type { ObservationModel } from '../../src/virus-sim/rendering/models/types';

const PART_TWO_BUILDERS = new Set([
  'spindle-virus',
  'vaccinia',
  'vsv',
  'phage-family',
  't7',
  't4',
  'lambda',
  'geminate-capsid',
  'hbv',
  'alphavirus',
  'cystovirus',
  'hsv',
  'influenza',
  'filovirus',
  'coronavirus',
  'lentivirus',
]);

const PART_TWO_ENTRIES = VIRUS_CATALOG.filter((entry) =>
  PART_TWO_BUILDERS.has(entry.modelBuilder),
);

describe('Virus Sim v4.9 part 2 special builder quality', () => {
  it('keeps all 95 entries and reviews every one of the 26 builders', () => {
    expect(VIRUS_CATALOG).toHaveLength(95);
    expect(new Set(VIRUS_CATALOG.map(({ id }) => id)).size).toBe(95);
    expect(new Set(VIRUS_CATALOG.map(({ modelBuilder }) => modelBuilder)).size).toBe(
      26,
    );
    for (const builder of PART_TWO_BUILDERS) {
      expect(
        PART_TWO_ENTRIES.some((entry) => entry.modelBuilder === builder),
        builder,
      ).toBe(true);
    }
  });

  it('uses richer high-quality surface component geometry', () => {
    const high = SURFACE_COMPONENT_DETAIL.high;
    const low = SURFACE_COMPONENT_DETAIL.low;
    expect(high.latheSegments).toBeGreaterThan(low.latheSegments);
    expect(high.coneSegments).toBeGreaterThan(low.coneSegments);
    expect(high.channelSegments).toBeGreaterThan(low.channelSegments);
    expect(high.capSegments).toBeGreaterThan(low.capSegments);
    expect(high.radialSegments).toBeGreaterThan(low.radialSegments);
    expect(high.capsomerHeightSegments).toBeGreaterThan(low.capsomerHeightSegments);
  });

  it('builds every catalog entry in both qualities with finite exact contracts', () => {
    for (const entry of VIRUS_CATALOG) {
      const measurements = (['high', 'low'] as const).map((quality) => {
        const model = createObservationModel(entry.id, quality);
        assertModelContract(entry, model, quality);
        assertExplosionContract(entry, model, quality);
        const measurement = measureModel(model.root);
        expect(measurement.extent, `${entry.id} ${quality}: extent`).toBeGreaterThan(
          0.5,
        );
        expect(measurement.extent, `${entry.id} ${quality}: extent`).toBeLessThan(24);
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

  it('preserves special-builder identity markers in high and low quality', () => {
    for (const quality of ['high', 'low'] as const) {
      const expectedNames: Record<string, readonly string[]> = {
        t4: [
          'phage-contractile-stacked-sheath',
          'phage-contractile-inner-tube',
          'phage-baseplate-contractile-complex',
          'phage-thin-segmented-tail-fibers',
        ],
        lambda: ['phage-long-noncontractile-tail'],
        t7: ['phage-head-tail-portal', 'phage-compact-short-tail-nozzle'],
        p22: ['phage-short-thick-tailspikes'],
        hk97: ['phage-capsomers-crosslinked-thin', 'phage-capsid-focused-minimal-tail'],
        'vsv-indiana': ['vsv-bullet-envelope', 'vsv-directional-helical-rnp'],
        'rabies-virus': ['vsv-bullet-envelope', 'vsv-directional-helical-rnp'],
        'vaccinia-mv': [
          'vaccinia-layered-rounded-brick',
          'vaccinia-dumbbell-core-wall',
          'vaccinia-paired-lateral-bodies',
        ],
      };
      for (const [id, names] of Object.entries(expectedNames)) {
        const model = createObservationModel(id, quality);
        for (const name of names) {
          expect(
            model.root.getObjectByName(name),
            `${id} ${quality}: ${name}`,
          ).toBeDefined();
        }
        disposeObject(model.root);
      }

      const ssv1 = createObservationModel('ssv1', quality);
      expect(
        ssv1.root.getObjectByName('ssv1-one-polar-fiber-crown')?.children,
      ).toHaveLength(6);
      const atv = createObservationModel('atv', quality);
      expect(
        atv.root.getObjectByName('atv-two-opposed-terminal-tails')?.children,
      ).toHaveLength(2);
      disposeObject(ssv1.root);
      disposeObject(atv.root);
    }
  });

  it('raises representative detail without changing family identities', () => {
    expectHigherDetail('ssv1', 'ssv1-fusiform-outer-shell');
    expectHigherDetail('vaccinia-mv', 'vaccinia-rounded-outer-membrane');
    expectHigherDetail('vaccinia-mv', 'vaccinia-dumbbell-core-wall');
    expectHigherDetail('vsv-indiana', 'vsv-bullet-envelope');
    expectHigherDetail('vsv-indiana', 'surface-glycoprotein-g');
    expectHigherDetail('hsv1', 'hsv-icosahedral-capsid');
    expectHigherDetail('ebola-virus', 'filovirus-gp-array');
    expectHigherDetail('influenza-a', 'surface-ha');

    const highGeminate = createObservationModel('maize-streak', 'high');
    const lowGeminate = createObservationModel('maize-streak', 'low');
    expect(
      meshGeometry(highGeminate, 'maize-streak-paired-capsomer-lattices').name,
    ).toBe('fivefold-beveled-capsomer');
    expect(
      meshGeometry(lowGeminate, 'maize-streak-paired-capsomer-lattices').type,
    ).toBe('CylinderGeometry');
    disposeObject(highGeminate.root);
    disposeObject(lowGeminate.root);

    const highT7 = createObservationModel('t7', 'high');
    const lowT7 = createObservationModel('t7', 'low');
    const highHead = findMesh(highT7.root, 'phage-capsomers-');
    const lowHead = findMesh(lowT7.root, 'phage-capsomers-');
    expect(highHead.geometry.name).toContain('phage-beveled-head-unit');
    expect(highHead.geometry.getAttribute('position').count).toBeGreaterThan(
      lowHead.geometry.getAttribute('position').count,
    );
    disposeObject(highT7.root);
    disposeObject(lowT7.root);
  });
});

function assertModelContract(
  entry: ObservationDefinition,
  model: ObservationModel,
  quality: 'high' | 'low',
): void {
  model.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model.root);
  expect(bounds.isEmpty(), `${entry.id} ${quality}: bounds`).toBe(false);
  expect(
    [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite),
    `${entry.id} ${quality}: bounds finite`,
  ).toBe(true);
  expect(new Set(model.parts.keys()), `${entry.id} ${quality}: parts`).toEqual(
    new Set(entry.parts),
  );
  expect(new Set(model.layers.keys()), `${entry.id} ${quality}: layers`).toEqual(
    new Set(entry.layers.map(({ id }) => id)),
  );

  model.root.traverse((object) => {
    if (!('geometry' in object)) return;
    const geometry = (object as THREE.Mesh).geometry;
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
}

function assertExplosionContract(
  entry: ObservationDefinition,
  model: ObservationModel,
  quality: 'high' | 'low',
): void {
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
    expect(explosion.origins, `${label} origins`).toHaveLength(explosion.mesh.count);
    expect(explosion.directions, `${label} directions`).toHaveLength(
      explosion.mesh.count,
    );
    expect(explosion.quaternions, `${label} quaternions`).toHaveLength(
      explosion.mesh.count,
    );
    expect(explosion.scales, `${label} scales`).toHaveLength(explosion.mesh.count);
    expect(
      [
        ...explosion.origins.flatMap((value) => value.toArray()),
        ...explosion.directions.flatMap((value) => value.toArray()),
        ...explosion.quaternions.flatMap((value) => value.toArray()),
        ...explosion.scales.flatMap((value) => value.toArray()),
      ].every(Number.isFinite),
      `${label} finite`,
    ).toBe(true);
  }
}

function expectHigherDetail(id: string, objectName: string): void {
  const high = createObservationModel(id, 'high');
  const low = createObservationModel(id, 'low');
  expect(
    meshGeometry(high, objectName).getAttribute('position').count,
    `${id}: ${objectName}`,
  ).toBeGreaterThan(meshGeometry(low, objectName).getAttribute('position').count);
  disposeObject(high.root);
  disposeObject(low.root);
}

function meshGeometry(model: ObservationModel, name: string): THREE.BufferGeometry {
  const object = model.root.getObjectByName(name);
  expect(object, name).toBeInstanceOf(THREE.Mesh);
  return (object as THREE.Mesh).geometry;
}

function findMesh(root: THREE.Object3D, namePrefix: string): THREE.Mesh {
  let result: THREE.Mesh | undefined;
  root.traverse((object) => {
    if (!result && object instanceof THREE.Mesh && object.name.startsWith(namePrefix)) {
      result = object;
    }
  });
  expect(result, namePrefix).toBeDefined();
  return result!;
}

function measureModel(root: THREE.Object3D): {
  extent: number;
  triangles: number;
} {
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const baseTriangles =
      (object.geometry.index?.count ??
        object.geometry.getAttribute('position')?.count ??
        0) / 3;
    triangles +=
      baseTriangles * (object instanceof THREE.InstancedMesh ? object.count : 1);
  });
  return { extent: Math.max(...size.toArray()), triangles };
}

function disposeObject(root: THREE.Object3D): void {
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
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
