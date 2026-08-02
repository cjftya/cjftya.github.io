import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Texture,
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
  private readonly aura: Mesh<IcosahedronGeometry, MeshBasicMaterial>;
  private readonly spores: Points<BufferGeometry, PointsMaterial>;
  private readonly satelliteOrbit: Group | null;
  private readonly baseAuraOpacity: number;
  private readonly fullBodyColor = new Color('#ffffff');
  private readonly mutedBodyColor = new Color('#e3e5ec');
  private elapsedSeconds = 0;
  private selected = false;
  private hovered = false;
  private muted = false;

  constructor(
    definition: PlanetDefinition,
    geometry: BufferGeometry,
    material: MeshStandardMaterial,
    ring?: RingParts,
  ) {
    this.project = definition;
    this.selectableMesh = new Mesh(geometry, material);
    this.selectableMesh.userData.projectId = definition.id;
    this.baseAuraOpacity = definition.status === 'active' ? 0.075 : 0.045;
    this.aura = this.createAura(definition);
    this.spores = this.createSpores(definition);
    this.satelliteOrbit = ring === undefined ? this.createSatellite(definition) : null;

    this.orbitPlane.rotation.z = MathUtils.degToRad(
      definition.planet.orbit.inclination,
    );
    this.orbitPlane.rotation.y = MathUtils.degToRad(definition.planet.orbit.startAngle);
    this.bodyAnchor.position.x = definition.planet.orbit.radius;
    this.axisGroup.rotation.z = MathUtils.degToRad(definition.planet.rotation.axisTilt);

    this.spinGroup.add(this.selectableMesh);
    this.axisGroup.add(this.aura, this.spores);
    this.axisGroup.add(this.spinGroup);
    this.bodyAnchor.add(this.axisGroup);
    this.orbitPlane.add(this.bodyAnchor);

    if (ring !== undefined) {
      const ringMesh = new Mesh(ring.geometry, ring.material);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.rotation.z = MathUtils.degToRad(definition.planet.ring.tilt);
      this.axisGroup.add(ringMesh);
    }

    if (this.satelliteOrbit !== null) {
      this.axisGroup.add(this.satelliteOrbit);
    }
  }

  update(deltaSeconds: number): void {
    const { orbit, rotation } = this.project.planet;
    const direction = rotation.direction === 'clockwise' ? -1 : 1;
    this.elapsedSeconds += deltaSeconds;

    this.orbitPlane.rotation.y += orbit.speed * deltaSeconds;

    this.spinGroup.rotation.y += direction * rotation.speed * deltaSeconds;
    this.spores.rotation.y += direction * deltaSeconds * 0.16;
    this.spores.rotation.x += deltaSeconds * 0.045;
    if (this.satelliteOrbit !== null) {
      this.satelliteOrbit.rotation.y += direction * deltaSeconds * 0.34;
    }

    const targetScale = this.selected ? 1.12 : this.hovered ? 1.065 : 1;
    const targetEmissiveIntensity = this.selected ? 0.48 : this.hovered ? 0.22 : 0.055;
    const pulse =
      1 + Math.sin(this.elapsedSeconds * 1.35 + this.project.planet.seed) * 0.025;
    const targetAuraOpacity = this.selected
      ? 0.28
      : this.hovered
        ? 0.15
        : this.baseAuraOpacity;
    const targetSporeOpacity = this.selected ? 0.7 : this.hovered ? 0.36 : 0.13;
    const scale = MathUtils.damp(this.axisGroup.scale.x, targetScale, 10, deltaSeconds);
    this.axisGroup.scale.setScalar(scale);
    this.aura.scale.setScalar(pulse);
    this.aura.material.opacity = MathUtils.damp(
      this.aura.material.opacity,
      targetAuraOpacity,
      7,
      deltaSeconds,
    );
    this.spores.material.opacity = MathUtils.damp(
      this.spores.material.opacity,
      targetSporeOpacity,
      7,
      deltaSeconds,
    );
    this.selectableMesh.material.emissiveIntensity = MathUtils.damp(
      this.selectableMesh.material.emissiveIntensity,
      targetEmissiveIntensity,
      10,
      deltaSeconds,
    );
    this.selectableMesh.material.color.lerp(
      this.selected || this.hovered || !this.muted
        ? this.fullBodyColor
        : this.mutedBodyColor,
      1 - Math.exp(-deltaSeconds * 8),
    );
  }

  setSelected(selected: boolean, muted = false): void {
    this.selected = selected;
    this.muted = muted;
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

  private createAura(
    definition: PlanetDefinition,
  ): Mesh<IcosahedronGeometry, MeshBasicMaterial> {
    const geometry = new IcosahedronGeometry(definition.planet.shape.radius * 1.16, 2);
    const material = new MeshBasicMaterial({
      color: definition.planet.surface.baseColor,
      transparent: true,
      opacity: this.baseAuraOpacity,
      depthWrite: false,
      side: BackSide,
      blending: AdditiveBlending,
    });

    return new Mesh(geometry, material);
  }

  private createSpores(
    definition: PlanetDefinition,
  ): Points<BufferGeometry, PointsMaterial> {
    const count = 9;
    const positions = new Float32Array(count * 3);
    const random = this.createSeededRandom(definition.planet.seed + 503);
    const radius = definition.planet.shape.radius;

    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const distance = radius * (1.3 + random() * 0.65);
      const positionIndex = index * 3;
      positions[positionIndex] = Math.cos(angle) * distance;
      positions[positionIndex + 1] = (random() - 0.5) * radius * 1.35;
      positions[positionIndex + 2] = Math.sin(angle) * distance;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: definition.planet.surface.baseColor,
      size: radius * 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    return new Points(geometry, material);
  }

  private createSatellite(definition: PlanetDefinition): Group {
    const orbit = new Group();
    const radius = definition.planet.shape.radius;
    const geometry = new SphereGeometry(radius * 0.105, 8, 6);
    const material = new MeshBasicMaterial({
      color: definition.planet.ring.color,
      transparent: true,
      opacity: 0.78,
    });
    const satellite = new Mesh(geometry, material);

    satellite.position.x = radius * (1.65 + (definition.planet.seed % 3) * 0.12);
    orbit.rotation.z = MathUtils.degToRad(((definition.planet.seed % 31) - 15) * 0.8);
    orbit.add(satellite);
    return orbit;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    };
  }
}
