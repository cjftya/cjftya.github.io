import { type Mesh, type Scene, Vector3 } from 'three';
import type { Galaxy, Project } from '../data/Project';
import { PlanetBuilder } from '../planets/PlanetBuilder';
import { CosmicGarden } from './CosmicGarden';
import { Orbit } from './Orbit';
import type { Planet } from './Planet';
import { Sun } from './Sun';

export interface PlanetLabelAnchor {
  id: string;
  galaxyId: string;
  radius: number;
  position: Vector3;
}

export class SolarSystem {
  private readonly sun = new Sun();
  private readonly planets: Planet[] = [];
  private readonly orbits: Orbit[] = [];
  private readonly selectableMeshes: Mesh[] = [];
  private readonly activeSelectableMeshes: Mesh[] = [];
  private readonly labelAnchors: PlanetLabelAnchor[] = [];
  private readonly projectByMesh = new Map<Mesh, Project>();
  private readonly planetByProjectId = new Map<string, Planet>();
  private readonly orbitByProjectId = new Map<string, Orbit>();
  private readonly cosmicGardenByGalaxyId = new Map<string, CosmicGarden>();
  private activeGalaxyId: string | null = null;
  private selectedProjectId: string | null = null;
  private hoveredProjectId: string | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly planetBuilder = new PlanetBuilder(),
  ) {
    this.scene.add(this.sun.object);
  }

  async load(projects: Project[], initialGalaxy: Galaxy): Promise<void> {
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
        galaxyId: planet.project.galaxyId,
        radius: planet.project.planet.shape.radius,
        position: new Vector3(),
      });
      this.projectByMesh.set(planet.selectableMesh, planet.project);
      this.planetByProjectId.set(planet.project.id, planet);
      this.orbitByProjectId.set(planet.project.id, orbit);
      this.scene.add(orbit.object, planet.orbitPlane);
    });

    const reducedEffects =
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const galaxyIds = new Set(projects.map((project) => project.galaxyId));

    galaxyIds.forEach((galaxyId) => {
      const galaxyPlanets = this.planets.filter(
        (planet) => planet.project.galaxyId === galaxyId,
      );
      const cosmicGarden = new CosmicGarden(galaxyPlanets, reducedEffects);
      this.cosmicGardenByGalaxyId.set(galaxyId, cosmicGarden);
      this.scene.add(cosmicGarden.object);
    });

    this.setActiveGalaxy(initialGalaxy);
  }

  update(deltaSeconds: number): void {
    this.sun.update(deltaSeconds);

    for (const planet of this.planets) {
      if (planet.project.galaxyId !== this.activeGalaxyId) {
        continue;
      }

      const projectId = planet.project.id;
      const selected = projectId === this.selectedProjectId;
      const hovered = projectId === this.hoveredProjectId;
      planet.update(deltaSeconds, selected);
      this.orbitByProjectId.get(projectId)?.update(deltaSeconds, selected, hovered);
    }

    if (this.activeGalaxyId !== null) {
      this.cosmicGardenByGalaxyId.get(this.activeGalaxyId)?.update(deltaSeconds);
    }
  }

  getSelectableMeshes(): Mesh[] {
    return this.activeSelectableMeshes;
  }

  getProjectForMesh(mesh: Mesh): Project | undefined {
    return this.projectByMesh.get(mesh);
  }

  setSelected(projectId: string | null): void {
    this.selectedProjectId = projectId;
    if (this.activeGalaxyId !== null) {
      this.cosmicGardenByGalaxyId.get(this.activeGalaxyId)?.setSelected(projectId);
    }

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
    const activeAnchors = this.labelAnchors.filter(
      (anchor) => anchor.galaxyId === this.activeGalaxyId,
    );

    for (const anchor of activeAnchors) {
      const planet = this.planetByProjectId.get(anchor.id);

      if (planet !== undefined) {
        planet.selectableMesh.getWorldPosition(anchor.position);
      }
    }

    return activeAnchors;
  }

  getProjectWorldPosition(projectId: string): Vector3 | null {
    const planet = this.planetByProjectId.get(projectId);

    return planet?.selectableMesh.getWorldPosition(new Vector3()) ?? null;
  }

  setActiveGalaxy(galaxy: Galaxy): void {
    this.activeGalaxyId = galaxy.id;
    this.selectedProjectId = null;
    this.hoveredProjectId = null;
    this.activeSelectableMeshes.length = 0;

    for (const planet of this.planets) {
      const active = planet.project.galaxyId === galaxy.id;
      planet.orbitPlane.visible = active;
      this.orbitByProjectId.get(planet.project.id)!.object.visible = active;
      planet.setSelected(false);
      planet.setHovered(false);

      if (active) {
        this.activeSelectableMeshes.push(planet.selectableMesh);
      }
    }

    this.cosmicGardenByGalaxyId.forEach((garden, galaxyId) => {
      garden.object.visible = galaxyId === galaxy.id;
      garden.setSelected(null);
    });
    this.sun.setColor(galaxy.color);
  }

  dispose(): void {
    this.scene.remove(this.sun.object);
    this.sun.dispose();
    this.cosmicGardenByGalaxyId.forEach((garden) => {
      this.scene.remove(garden.object);
      garden.dispose();
    });
    this.cosmicGardenByGalaxyId.clear();

    this.planets.forEach((planet) => {
      this.scene.remove(planet.orbitPlane);
      planet.dispose();
    });
    this.orbits.forEach((orbit) => {
      this.scene.remove(orbit.object);
      orbit.dispose();
    });
    this.selectableMeshes.length = 0;
    this.activeSelectableMeshes.length = 0;
    this.labelAnchors.length = 0;
    this.projectByMesh.clear();
    this.planetByProjectId.clear();
    this.orbitByProjectId.clear();
    this.selectedProjectId = null;
    this.hoveredProjectId = null;
    this.activeGalaxyId = null;
  }
}
