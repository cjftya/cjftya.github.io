import {
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import type { WaterFlowPath } from './flowPath';

/** Foam and waves live on the exact pond mesh; only ballistic spray uses extra geometry. */
export function createImpactZone(flow: WaterFlowPath, mobile: boolean) {
  const group = new Group();
  group.name = 'ImpactZoneV6';
  const count = mobile ? 56 : 112;
  const drops = new InstancedMesh(
    new SphereGeometry(1, 6, 4),
    new MeshStandardMaterial({
      color: '#d4e5e4',
      roughness: 0.32,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
    count,
  );
  drops.name = 'BallisticImpactSprayV6';
  drops.frustumCulled = false;
  drops.receiveShadow = true;
  group.add(drops);
  const spraySpeed = Math.min(
    3.8,
    Math.hypot(
      flow.velocity.x,
      flow.velocity.y - 9.8 * flow.duration,
      flow.velocity.z,
    ) * 0.19,
  );
  const particle = new Object3D(),
    velocity = new Vector3();
  function update(time: number) {
    for (let i = 0; i < count; i++) {
      const seed = (Math.sin(i * 127.1) * 43758.5453) % 1;
      const lifetime = 0.55 + (i % 7) * 0.047;
      const age = (time + i * 0.173) % lifetime;
      const angle =
        i * 2.39996 +
        Math.sin(Math.floor((time + i * 0.173) / lifetime) * 1.71 + i) * 0.37;
      const speed = 0.55 + (i % 9) * 0.11;
      velocity.set(
        Math.cos(angle) * speed,
        spraySpeed + (i % 5) * 0.22,
        Math.sin(angle) * speed * 0.75 + 0.22,
      );
      particle.position.copy(flow.impact).addScaledVector(velocity, age);
      particle.position.y += 0.015 - 4.9 * age * age;
      particle.position.x += Math.sin(i * 2.17) * 0.46;
      const size =
        particle.position.y <= flow.impact.y
          ? 0
          : (0.013 + (i % 4) * 0.007) * (1 - age / lifetime) * Math.abs(seed + 0.5);
      particle.scale.set(size, size * (1.6 + age), size);
      particle.updateMatrix();
      drops.setMatrixAt(i, particle.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { group, update, count };
}
