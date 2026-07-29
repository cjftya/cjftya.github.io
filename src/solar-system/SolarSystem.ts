import { type Mesh, type Scene, Vector3 } from 'three';
import type { Project } from '../data/Project';
import { PlanetBuilder } from '../planets/PlanetBuilder';
import { Orbit } from './Orbit';
import type { Planet } from './Planet';
import { Sun } from './Sun';

export interface PlanetLabelAnchor {
  id: string;
  radius: number;
  position: Vector3;
}

export class SolarSystem {
  private readonly sun = new Sun();
  private readonly planets: Planet[] = [];
  private readonly orbits: Orbit[] = [];
  private readonly selectableMeshes: Mesh[] = [];
  private readonly labelAnchors: PlanetLabelAnchor[] = [];
  private readonly projectByMesh = new Map<Mesh, Project>();
  private readonly planetByProjectId = new Map<string, Planet>();
  private readonly orbitByProjectId = new Map<string, Orbit>();
  private selectedProjectId: string | null = null;
  private hoveredProjectId: string | null = null;

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
      const orbit = new Orbit(
        planet.project.planet.orbit,
        planet.project.planet.surface.baseColor,
      );
      this.planets.push(planet);
      this.orbits.push(orbit);
      this.selectableMeshes.push(planet.selectableMesh);
      this.labelAnchors.push({
        id: planet.project.id,
        radius: planet.project.planet.shape.radius,
        position: new Vector3(),
      });
      this.projectByMesh.set(planet.selectableMesh, planet.project);
      this.planetByProjectId.set(planet.project.id, planet);
      this.orbitByProjectId.set(planet.project.id, orbit);
      this.scene.add(orbit.object, planet.orbitPlane);
    });
  }

  update(deltaSeconds: number): void {
    this.sun.update(deltaSeconds);

    for (const planet of this.planets) {
      const projectId = planet.project.id;
      const selected = projectId === this.selectedProjectId;
      const hovered = projectId === this.hoveredProjectId;
      planet.update(deltaSeconds, selected);
      this.orbitByProjectId.get(projectId)?.update(deltaSeconds, selected, hovered);
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

  setHovered(projectId: string | null): void {
    this.hoveredProjectId = projectId;

    for (const planet of this.planets) {
      planet.setHovered(planet.project.id === projectId);
    }
  }

  getLabelAnchors(): readonly PlanetLabelAnchor[] {
    for (let index = 0; index < this.planets.length; index += 1) {
      const planet = this.planets[index];
      const anchor = this.labelAnchors[index];

      if (planet !== undefined && anchor !== undefined) {
        planet.selectableMesh.getWorldPosition(anchor.position);
      }
    }

    return this.labelAnchors;
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
    this.labelAnchors.length = 0;
    this.projectByMesh.clear();
    this.planetByProjectId.clear();
    this.orbitByProjectId.clear();
    this.selectedProjectId = null;
    this.hoveredProjectId = null;
  }
}
