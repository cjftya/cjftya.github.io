import { Scene, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseProjectCollection } from '../src/data/validation';
import { SolarSystem } from '../src/solar-system/SolarSystem';
import { createValidProjectCollection } from './fixtures';

function satelliteCollection() {
  const collection = createValidProjectCollection();
  const parent = collection.projects[0]!;
  const satellite = structuredClone(parent);
  satellite.id = 'android';
  satellite.parentProjectId = parent.id;
  satellite.planet.orbit.radius = 1.6;
  satellite.planet.orbit.speed = 0.3;
  satellite.planet.shape.radius = 0.25;
  // A child may appear before its parent in the data.
  collection.projects.unshift(satellite);
  return collection;
}

afterEach(() => vi.unstubAllGlobals());

describe('project satellites', () => {
  it('accepts only a different root parent in the same galaxy', () => {
    const collection = satelliteCollection();
    expect(parseProjectCollection(collection).projects[0]!.parentProjectId).toBe(
      'sample-project',
    );
    for (const parentId of ['missing', 'android']) {
      collection.projects[0]!.parentProjectId = parentId;
      expect(() => parseProjectCollection(collection)).toThrow('parentProjectId');
    }
    collection.projects[0]!.parentProjectId = 'sample-project';
    collection.projects[1]!.parentProjectId = 'android';
    expect(() => parseProjectCollection(collection)).toThrow('parentProjectId');
    delete collection.projects[1]!.parentProjectId;
    collection.galaxies.push({
      ...structuredClone(collection.galaxies[0]!),
      id: 'other-galaxy',
    });
    collection.projects[1]!.galaxyId = 'other-galaxy';
    expect(() => parseProjectCollection(collection)).toThrow('parentProjectId');
  });

  it('orbits the moving parent, remains selectable, hides on galaxy switch and disposes once', async () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    const collection = satelliteCollection();
    const scene = new Scene();
    const system = new SolarSystem(scene);
    await system.load(collection.projects, collection.galaxies[0]!);
    const childMesh = system
      .getSelectableMeshes()
      .find((mesh) => system.getProjectForMesh(mesh)?.id === 'android')!;
    expect(childMesh).toBeDefined();
    const parentPosition = new Vector3();
    const childPosition = new Vector3();
    const initialPosition = new Vector3();
    system.copyProjectWorldPosition('android', initialPosition);
    for (let i = 0; i < 10; i++) {
      system.update(0.1);
      system.copyProjectWorldPosition('sample-project', parentPosition);
      system.copyProjectWorldPosition('android', childPosition);
      expect(childPosition.distanceTo(parentPosition)).toBeCloseTo(1.6);
    }
    expect(childPosition.distanceTo(initialPosition)).toBeGreaterThan(0.1);
    expect(
      system
        .getLabelAnchors()
        .find((anchor) => anchor.id === 'android')!
        .position.distanceTo(childPosition),
    ).toBeLessThan(0.00001);
    const geometryDispose = vi.spyOn(childMesh.geometry, 'dispose');
    system.setActiveGalaxy({ ...collection.galaxies[0]!, id: 'other-galaxy' });
    expect(system.getSelectableMeshes()).toHaveLength(0);
    expect(system.getLabelAnchors()).toHaveLength(0);
    system.setActiveGalaxy(collection.galaxies[0]!);
    expect(system.getSelectableMeshes()).toContain(childMesh);
    system.dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(scene.children).toHaveLength(0);
  });
});
