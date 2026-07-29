import {
  Group,
  MathUtils,
  Mesh,
  Texture,
  type BufferGeometry,
  type Material,
  type MeshStandardMaterial,
  type RingGeometry,
} from 'three';
import type { Project } from '../data/Project';
import type { PlanetDefinition } from '../planets/PlanetDefinition';

interface RingParts {
  geometry: RingGeometry;
  material: MeshStandardMaterial;
}

export class Planet {
  readonly orbitPlane = new Group();
  readonly selectableMesh: Mesh<BufferGeometry, MeshStandardMaterial>;
  readonly project: Project;

  private readonly bodyAnchor = new Group();
  private readonly axisGroup = new Group();
  private readonly spinGroup = new Group();
  private selected = false;
  private hovered = false;

  constructor(
    definition: PlanetDefinition,
    geometry: BufferGeometry,
    material: MeshStandardMaterial,
    ring?: RingParts,
  ) {
    this.project = definition;
    this.selectableMesh = new Mesh(geometry, material);
    this.selectableMesh.userData.projectId = definition.id;

    this.orbitPlane.rotation.z = MathUtils.degToRad(
      definition.planet.orbit.inclination,
    );
    this.orbitPlane.rotation.y = MathUtils.degToRad(definition.planet.orbit.startAngle);
    this.bodyAnchor.position.x = definition.planet.orbit.radius;
    this.axisGroup.rotation.z = MathUtils.degToRad(definition.planet.rotation.axisTilt);

    this.spinGroup.add(this.selectableMesh);
    this.axisGroup.add(this.spinGroup);
    this.bodyAnchor.add(this.axisGroup);
    this.orbitPlane.add(this.bodyAnchor);

    if (ring !== undefined) {
      const ringMesh = new Mesh(ring.geometry, ring.material);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.rotation.z = MathUtils.degToRad(definition.planet.ring.tilt);
      this.axisGroup.add(ringMesh);
    }
  }

  update(deltaSeconds: number, orbitPaused = false): void {
    const { orbit, rotation } = this.project.planet;
    const direction = rotation.direction === 'clockwise' ? -1 : 1;

    if (!orbitPaused) {
      this.orbitPlane.rotation.y += orbit.speed * deltaSeconds;
    }

    this.spinGroup.rotation.y += direction * rotation.speed * deltaSeconds;
    const targetScale = this.selected ? 1.12 : this.hovered ? 1.065 : 1;
    const targetEmissiveIntensity = this.selected ? 0.48 : this.hovered ? 0.22 : 0.055;
    const scale = MathUtils.damp(this.axisGroup.scale.x, targetScale, 10, deltaSeconds);
    this.axisGroup.scale.setScalar(scale);
    this.selectableMesh.material.emissiveIntensity = MathUtils.damp(
      this.selectableMesh.material.emissiveIntensity,
      targetEmissiveIntensity,
      10,
      deltaSeconds,
    );
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
  }

  setHovered(hovered: boolean): void {
    this.hovered = hovered;
  }

  dispose(): void {
    this.orbitPlane.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.geometry.dispose();
      const materials: Material[] = Array.isArray(object.material)
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        if ('map' in material && material.map instanceof Texture) {
          material.map.dispose();
        }
        material.dispose();
      });
    });
  }
}
