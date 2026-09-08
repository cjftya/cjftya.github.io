import * as THREE from 'three';
import type { ModelCollector } from './shared';
import {
  COLORS,
  addGenome,
  addObjectExplosion,
  createGenomeCoil,
  physicalMaterial,
  register,
  standardMaterial,
} from './shared';

export function buildVaccinia(
  collector: ModelCollector,
  quality: 'high' | 'low',
): void {
  const membrane = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(
      4.7,
      3.35,
      2.5,
      quality === 'high' ? 4 : 2,
      quality === 'high' ? 4 : 2,
      2,
    ),
    physicalMaterial(0x9b648b, 0.74, false),
  );
  membrane.add(shell);
  const ridgeMaterial = new THREE.LineBasicMaterial({
    color: 0xe2a9cb,
    transparent: true,
    opacity: 0.38,
  });
  const ridges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(4.74, 3.39, 2.54), 16),
    ridgeMaterial,
  );
  membrane.add(ridges);
  collector.root.add(membrane);
  register(collector, membrane, 'envelope', 'membrane', true);
  addObjectExplosion(collector, membrane, new THREE.Vector3(0.55, 0.25, 0.38), 0.78);

  const coreProfile = [
    new THREE.Vector2(0.3, -1.7),
    new THREE.Vector2(0.92, -1.48),
    new THREE.Vector2(1.03, -1.05),
    new THREE.Vector2(0.64, -0.36),
    new THREE.Vector2(0.58, 0),
    new THREE.Vector2(0.64, 0.36),
    new THREE.Vector2(1.03, 1.05),
    new THREE.Vector2(0.92, 1.48),
    new THREE.Vector2(0.3, 1.7),
  ];
  const core = new THREE.Mesh(
    new THREE.LatheGeometry(coreProfile, quality === 'high' ? 36 : 20),
    physicalMaterial(COLORS.layerGold, 0.88, false),
  );
  core.rotation.z = Math.PI / 2;
  core.scale.z = 0.74;
  collector.root.add(core);
  register(collector, core, 'core-wall', 'core-wall', true);
  addObjectExplosion(collector, core, new THREE.Vector3(-0.52, 0.3, 0.35), 0.72);

  const lateralBodies = new THREE.Group();
  const lateralMaterial = standardMaterial(COLORS.layerBlue, 0.9);
  for (const side of [-1, 1]) {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.42,
        1.65,
        quality === 'high' ? 8 : 5,
        quality === 'high' ? 16 : 10,
      ),
      lateralMaterial,
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = side * 0.98;
    body.scale.z = 0.72;
    lateralBodies.add(body);
  }
  collector.root.add(lateralBodies);
  register(collector, lateralBodies, 'lateral-body', 'lateral-body', true);
  addObjectExplosion(
    collector,
    lateralBodies,
    new THREE.Vector3(0.2, -0.65, -0.35),
    0.78,
  );

  const genome = createGenomeCoil(0.73, 19, 0.04, quality, 2.8);
  genome.rotation.z = Math.PI / 2;
  addGenome(collector, genome, new THREE.Vector3(0.55, -0.32, 0.35), 0.64);
}
