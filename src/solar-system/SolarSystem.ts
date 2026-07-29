import { type Mesh, type Scene, Vector3 } from 'three';
import type { Project } from '../data/Project';
import { PlanetBuilder } from '../planets/PlanetBuilder';
import { Orbit } from './Orbit';
import type { Planet } from './Planet';
import { Sun } from './Sun';

export class SolarSystem {
  private readonly sun = new Sun();
  private readonly planets: Planet[] = [];
  private readonly orbits: Orbit[] = [];
  private readonly selectableMeshes: Mesh[] = [];
  private readonly projectByMesh = new Map<Mesh, Project>();
  private readonly planetByProjectId = new Map<string, Planet>();
  private selectedProjectId: string | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly planetBuilder = new PlanetBuilder(),
  ) {
    this.scene.add(this.sun.object);
  }

  async load(projects: Project[]): Promise<void> {
    const planets = await Promise.all(
      projects.map((project) => this.planetBuilder.build(project)),
    );

    planets.forEach((planet) => {
      const orbit = new Orbit(planet.project.planet.orbit);
      this.planets.push(planet);
      this.orbits.push(orbit);
      this.selectableMeshes.push(planet.selectableMesh);
      this.projectByMesh.set(planet.selectableMesh, planet.project);
      this.planetByProjectId.set(planet.project.id, planet);
      this.scene.add(orbit.object, planet.orbitPlane);
    });
  }

  update(deltaSeconds: number): void {
    for (const planet of this.planets) {
      planet.update(deltaSeconds, planet.project.id === this.selectedProjectId);
    }
  }

  getSelectableMeshes(): Mesh[] {
    return this.selectableMeshes;
  }

  getProjectForMesh(mesh: Mesh): Project | undefined {
    return this.projectByMesh.get(mesh);
  }

  setSelected(projectId: string | null): void {
    this.selectedProjectId = projectId;

    for (const planet of this.planets) {
      planet.setSelected(planet.project.id === projectId);
    }
  }

  getProjectWorldPosition(projectId: string): Vector3 | null {
    const planet = this.planetByProjectId.get(projectId);

    return planet?.selectableMesh.getWorldPosition(new Vector3()) ?? null;
  }

  dispose(): void {
    this.scene.remove(this.sun.object);
    this.sun.dispose();

    this.planets.forEach((planet) => {
      this.scene.remove(planet.orbitPlane);
      planet.dispose();
    });
    this.orbits.forEach((orbit) => {
      this.scene.remove(orbit.object);
      orbit.dispose();
    });
    this.selectableMeshes.length = 0;
    this.projectByMesh.clear();
    this.planetByProjectId.clear();
    this.selectedProjectId = null;
  }
}
