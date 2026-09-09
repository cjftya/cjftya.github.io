import * as THREE from 'three';
import { getCatalogEntry } from '../../catalog/registry';
import { getPhysicsProfileById } from '../../lab/profiles/registry';
import type { LabBodySnapshot } from '../../lab/types';
import type { RenderQuality } from '../quality/quality';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export class LabSpecimenView {
  readonly root = new THREE.Group();
  private readonly material: THREE.MeshPhysicalMaterial;
  private readonly selectionMaterial: THREE.MeshBasicMaterial;
  private readonly selectable: THREE.Object3D[] = [];
  private readonly segmentMeshes: THREE.Mesh[] = [];
  private selectionHalo: THREE.Mesh | null = null;

  constructor(
    readonly instanceId: string,
    readonly virusId: string,
    profileId: string,
    bodyScale: number,
    quality: RenderQuality,
  ) {
    const profile = getPhysicsProfileById(profileId);
    const entry = getCatalogEntry(virusId);
    const color = colorForId(virusId);
    this.material = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.12),
      emissiveIntensity: 0.5,
      roughness: 0.38,
      metalness: 0.08,
      clearcoat: 0.45,
      clearcoatRoughness: 0.28,
      transparent: true,
      opacity: 0.94,
    });
    this.selectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x63eee0,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    if (profile.shape === 'filament') {
      const radius = profile.radius * bodyScale;
      const segmentLength =
        (profile.halfLength * 2 * bodyScale) / Math.max(1, profile.segmentCount - 1);
      const geometry = new THREE.CapsuleGeometry(
        radius,
        Math.max(0.02, segmentLength - radius * 1.2),
        quality === 'performance' ? 2 : 4,
        quality === 'enhanced' ? 10 : 7,
      );
      for (let index = 0; index < profile.segmentCount - 1; index += 1) {
        const mesh = new THREE.Mesh(geometry, this.material);
        mesh.userData.labInstanceId = instanceId;
        this.segmentMeshes.push(mesh);
        this.selectable.push(mesh);
        this.root.add(mesh);
      }
    } else if (profile.shape === 'sphere') {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          profile.radius * bodyScale,
          quality === 'performance' ? 1 : quality === 'enhanced' ? 3 : 2,
        ),
        this.material,
      );
      mesh.userData.labInstanceId = instanceId;
      this.selectable.push(mesh);
      this.root.add(mesh);
      if (entry.silhouette === 'envelope')
        this.addSurfaceCrown(profile.radius * bodyScale, color, quality);
    } else if (profile.shape === 'capsule') {
      const mesh =
        entry.silhouette === 'brick'
          ? new THREE.Mesh(
              new THREE.BoxGeometry(
                (profile.halfLength * 2 + profile.radius * 2) * bodyScale,
                profile.radius * 2 * bodyScale,
                profile.radius * 1.65 * bodyScale,
                2,
                2,
                2,
              ),
              this.material,
            )
          : capsuleMesh(
              profile.radius * bodyScale,
              profile.halfLength * 2 * bodyScale,
              this.material,
              quality,
            );
      mesh.userData.labInstanceId = instanceId;
      this.selectable.push(mesh);
      this.root.add(mesh);
    } else if (entry.silhouette === 'phage') {
      this.buildPhage(profile, bodyScale, quality);
    } else {
      const sphereGeometry = new THREE.IcosahedronGeometry(
        profile.radius * bodyScale,
        quality === 'performance' ? 1 : 2,
      );
      for (const offset of profile.compoundOffsets) {
        const mesh = new THREE.Mesh(sphereGeometry, this.material);
        mesh.position.set(
          offset[0] * bodyScale,
          offset[1] * bodyScale,
          offset[2] * bodyScale,
        );
        mesh.scale.setScalar(offset === profile.compoundOffsets[0] ? 1 : 0.64);
        mesh.userData.labInstanceId = instanceId;
        this.selectable.push(mesh);
        this.root.add(mesh);
      }
      if (profile.compoundOffsets.length === 0) {
        const mesh = new THREE.Mesh(sphereGeometry, this.material);
        mesh.userData.labInstanceId = instanceId;
        this.selectable.push(mesh);
        this.root.add(mesh);
      }
    }
    this.root.userData.labInstanceId = instanceId;
    this.root.name = `lab-specimen-${entry.shortName}`;
  }

  update(body: LabBodySnapshot, selected: boolean): void {
    if (body.filamentPoints.length > 1) {
      this.root.position.set(0, 0, 0);
      this.root.quaternion.identity();
      for (let index = 0; index < this.segmentMeshes.length; index += 1) {
        const start = body.filamentPoints[index]!;
        const end = body.filamentPoints[index + 1]!;
        const midpoint = new THREE.Vector3(
          (start[0] + end[0]) / 2,
          (start[1] + end[1]) / 2,
          (start[2] + end[2]) / 2,
        );
        const direction = new THREE.Vector3(
          end[0] - start[0],
          end[1] - start[1],
          end[2] - start[2],
        ).normalize();
        const mesh = this.segmentMeshes[index]!;
        mesh.position.copy(midpoint);
        mesh.quaternion.setFromUnitVectors(Y_AXIS, direction);
      }
    } else {
      this.root.position.set(...body.position);
      this.root.quaternion.set(...body.orientation);
    }
    this.material.emissiveIntensity = selected ? 1.45 : 0.5;
    this.setSelection(selected, body);
  }

  getSelectables(): readonly THREE.Object3D[] {
    return this.selectable;
  }

  dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const meshMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of meshMaterials) materials.add(material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    materials.add(this.material);
    materials.add(this.selectionMaterial);
    for (const material of materials) material.dispose();
    this.root.removeFromParent();
  }

  private setSelection(selected: boolean, body: LabBodySnapshot): void {
    if (!selected) {
      if (this.selectionHalo) {
        this.selectionHalo.geometry.dispose();
        this.selectionHalo.removeFromParent();
      }
      this.selectionHalo = null;
      return;
    }
    if (!this.selectionHalo) {
      this.selectionHalo = new THREE.Mesh(
        new THREE.SphereGeometry(1, 18, 12),
        this.selectionMaterial,
      );
      this.selectionHalo.userData.ignoreCameraBounds = true;
      this.root.add(this.selectionHalo);
    }
    const profile = getPhysicsProfileById(body.physicsProfileId);
    const size = (profile.radius + profile.halfLength) * body.scale * 1.22;
    this.selectionHalo.scale.setScalar(Math.max(0.5, size));
    if (body.filamentPoints.length > 0)
      this.selectionHalo.position.set(...body.position);
    else this.selectionHalo.position.set(0, 0, 0);
  }

  private addSurfaceCrown(
    radius: number,
    color: THREE.Color,
    quality: RenderQuality,
  ): void {
    const count = quality === 'performance' ? 8 : quality === 'enhanced' ? 18 : 12;
    const geometry = new THREE.ConeGeometry(radius * 0.09, radius * 0.25, 5);
    const material = new THREE.MeshStandardMaterial({
      color: color.clone().offsetHSL(0.03, 0.08, 0.12),
      emissive: color.clone().multiplyScalar(0.08),
      roughness: 0.48,
    });
    for (let index = 0; index < count; index += 1) {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const direction = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      const spike = new THREE.Mesh(geometry, material);
      spike.position.copy(direction).multiplyScalar(radius * 1.08);
      spike.quaternion.setFromUnitVectors(Y_AXIS, direction);
      spike.userData.labInstanceId = this.instanceId;
      this.selectable.push(spike);
      this.root.add(spike);
    }
  }

  private buildPhage(
    profile: ReturnType<typeof getPhysicsProfileById>,
    bodyScale: number,
    quality: RenderQuality,
  ): void {
    const radius = profile.radius * bodyScale;
    const head = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, quality === 'performance' ? 1 : 2),
      this.material,
    );
    head.position.x = 0.55 * bodyScale;
    this.addSelectable(head);
    const minimumX = Math.min(...profile.compoundOffsets.map((offset) => offset[0]));
    const tailStart = 0.05 * bodyScale;
    const tailEnd = (minimumX + 0.2) * bodyScale;
    const tailLength = Math.max(radius * 0.7, tailStart - tailEnd);
    const tail = capsuleMesh(radius * 0.28, tailLength, this.material, quality);
    tail.position.x = (tailStart + tailEnd) / 2;
    this.addSelectable(tail);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, radius * 0.2, 6),
      this.material,
    );
    base.rotation.z = Math.PI / 2;
    base.position.x = tailEnd;
    this.addSelectable(base);
    for (const signY of [-1, 1]) {
      for (const signZ of [-1, 1]) {
        const leg = capsuleMesh(radius * 0.1, radius * 0.9, this.material, quality);
        leg.position.set(
          tailEnd - radius * 0.2,
          signY * radius * 0.52,
          signZ * radius * 0.42,
        );
        leg.rotation.z = signY * 0.7;
        leg.rotation.y = signZ * 0.45;
        this.addSelectable(leg);
      }
    }
  }

  private addSelectable(mesh: THREE.Mesh): void {
    mesh.userData.labInstanceId = this.instanceId;
    this.selectable.push(mesh);
    this.root.add(mesh);
  }
}

function capsuleMesh(
  radius: number,
  length: number,
  material: THREE.Material,
  quality: RenderQuality,
): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(
    radius,
    Math.max(0.04, length),
    quality === 'performance' ? 2 : 5,
    quality === 'enhanced' ? 12 : 8,
  );
  geometry.rotateZ(-Math.PI / 2);
  return new THREE.Mesh(geometry, material);
}

function colorForId(id: string): THREE.Color {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const hue = ((hash >>> 0) % 300) / 360 + 0.05;
  return new THREE.Color().setHSL(hue % 1, 0.62, 0.55);
}
