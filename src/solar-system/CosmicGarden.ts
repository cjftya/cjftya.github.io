import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import type { Planet } from './Planet';

interface GardenConnection {
  first: Planet;
  second: Planet;
}

const BASE_CONNECTION_COLOR = new Color('#66749a');
const ACTIVE_CONNECTION_COLOR = new Color('#b6ddff');

export class CosmicGarden {
  readonly object = new Group();

  private readonly connections: GardenConnection[];
  private readonly connectionGeometry = new BufferGeometry();
  private readonly connectionMaterial = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly connectionPositions: Float32Array;
  private readonly connectionColors: Float32Array;
  private readonly nodeGeometry = new BufferGeometry();
  private readonly nodeMaterial = new PointsMaterial({
    vertexColors: true,
    size: 0.065,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly nodePositions: Float32Array;
  private readonly nodeColors: Float32Array;
  private readonly planetColors: Color[];
  private readonly firstPosition = new Vector3();
  private readonly secondPosition = new Vector3();
  private readonly selectedColor = new Color();
  private selectedProjectId: string | null = null;
  private elapsedSeconds = 0;

  constructor(
    private readonly planets: readonly Planet[],
    reducedEffects: boolean,
  ) {
    this.connections = this.createConnections(reducedEffects);
    this.connectionPositions = new Float32Array(this.connections.length * 6);
    this.connectionColors = new Float32Array(this.connections.length * 6);
    this.nodePositions = new Float32Array(this.planets.length * 3);
    this.nodeColors = new Float32Array(this.planets.length * 3);
    this.planetColors = this.planets.map(
      (planet) => new Color(planet.project.planet.surface.baseColor),
    );

    this.connectionGeometry.setAttribute(
      'position',
      new BufferAttribute(this.connectionPositions, 3).setUsage(DynamicDrawUsage),
    );
    this.connectionGeometry.setAttribute(
      'color',
      new BufferAttribute(this.connectionColors, 3).setUsage(DynamicDrawUsage),
    );
    this.nodeGeometry.setAttribute(
      'position',
      new BufferAttribute(this.nodePositions, 3).setUsage(DynamicDrawUsage),
    );
    this.nodeGeometry.setAttribute(
      'color',
      new BufferAttribute(this.nodeColors, 3).setUsage(DynamicDrawUsage),
    );

    this.object.add(
      new LineSegments(this.connectionGeometry, this.connectionMaterial),
      new Points(this.nodeGeometry, this.nodeMaterial),
    );
    this.updateColors();
  }

  setSelected(projectId: string | null): void {
    if (projectId === this.selectedProjectId) {
      return;
    }

    this.selectedProjectId = projectId;
    this.updateColors();
  }

  update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    const pulse = 0.88 + Math.sin(this.elapsedSeconds * 0.72) * 0.12;
    const hasSelection = this.selectedProjectId !== null;
    this.connectionMaterial.opacity = MathUtils.damp(
      this.connectionMaterial.opacity,
      hasSelection ? 0.18 : 0.11,
      5,
      deltaSeconds,
    );
    this.nodeMaterial.opacity = 0.44 + pulse * 0.12;

    this.connections.forEach((connection, index) => {
      connection.first.selectableMesh.getWorldPosition(this.firstPosition);
      connection.second.selectableMesh.getWorldPosition(this.secondPosition);

      const positionIndex = index * 6;
      this.firstPosition.toArray(this.connectionPositions, positionIndex);
      this.secondPosition.toArray(this.connectionPositions, positionIndex + 3);
    });

    this.planets.forEach((planet, index) => {
      planet.selectableMesh.getWorldPosition(this.firstPosition);
      this.firstPosition.toArray(this.nodePositions, index * 3);
    });

    this.connectionGeometry.getAttribute('position').needsUpdate = true;
    this.nodeGeometry.getAttribute('position').needsUpdate = true;
  }

  dispose(): void {
    this.connectionGeometry.dispose();
    this.connectionMaterial.dispose();
    this.nodeGeometry.dispose();
    this.nodeMaterial.dispose();
  }

  private createConnections(reducedEffects: boolean): GardenConnection[] {
    const connections: GardenConnection[] = [];

    for (let index = 0; index < this.planets.length - 1; index += 1) {
      const first = this.planets[index];
      const second = this.planets[index + 1];

      if (first !== undefined && second !== undefined) {
        connections.push({ first, second });
      }
    }

    if (!reducedEffects && this.planets.length >= 6) {
      const first = this.planets[0];
      const middle = this.planets[3];
      const second = this.planets[1];
      const last = this.planets[5];

      if (first !== undefined && middle !== undefined) {
        connections.push({ first, second: middle });
      }
      if (second !== undefined && last !== undefined) {
        connections.push({ first: second, second: last });
      }
    }

    return connections;
  }

  private updateColors(): void {
    this.connections.forEach((connection, index) => {
      const positionIndex = index * 6;
      const selected =
        connection.first.project.id === this.selectedProjectId ||
        connection.second.project.id === this.selectedProjectId;
      this.selectedColor.copy(
        selected ? ACTIVE_CONNECTION_COLOR : BASE_CONNECTION_COLOR,
      );
      this.selectedColor.toArray(this.connectionColors, positionIndex);
      this.selectedColor
        .multiplyScalar(selected ? 0.92 : 0.68)
        .toArray(this.connectionColors, positionIndex + 3);
    });

    this.planets.forEach((planet, index) => {
      const selected = planet.project.id === this.selectedProjectId;
      const color = selected
        ? ACTIVE_CONNECTION_COLOR
        : (this.planetColors[index] ?? BASE_CONNECTION_COLOR);
      color.toArray(this.nodeColors, index * 3);
    });

    this.connectionGeometry.getAttribute('color').needsUpdate = true;
    this.nodeGeometry.getAttribute('color').needsUpdate = true;
  }
}
