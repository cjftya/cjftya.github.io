import { BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3 } from 'three';
import { createFlowMaterial } from './flowMaterial';
import type { WaterFlowPath } from './flowPath';

/** Independent closed, non-coplanar lobes: a connected core and sparse aerated strands. */
export function createFallingWater(
  flow: WaterFlowPath,
  time: { value: number },
  mobile: boolean,
) {
  const group = new Group();
  group.name = 'FallingWaterV6';
  const count = mobile ? 9 : 13,
    segments = mobile ? 64 : 96,
    sides = mobile ? 8 : 10;
  for (let lane = 0; lane < count; lane++) {
    const core = lane < 5;
    const offset = core ? (lane - 2) * 0.27 : Math.sin(lane * 2.39996) * 0.72;
    const positions: number[] = [],
      uvs: number[] = [],
      travel: number[] = [],
      progress: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments,
        t = u * flow.duration;
      const p = flow.launch.clone().addScaledVector(flow.velocity, t);
      p.y -= 4.9 * t * t;
      const anchor = Math.sin(u * Math.PI);
      p.x += offset + Math.sin(u * 9.3 + lane * 1.7) * 0.13 * anchor;
      p.z += Math.sin(lane * 2.1) * 0.11 * (core ? 0.6 : 1.3) * anchor;
      const tangent = flow.velocity.clone();
      tangent.y -= 9.8 * t;
      tangent.normalize();
      const outward = new Vector3(0, tangent.z, -tangent.y).normalize();
      // Flow stretches under gravity, while air entrainment broadens the outer plume.
      const radius =
        (core ? 0.23 : 0.045) *
        (1 - 0.1 * u) *
        (1 + 0.24 * Math.sin(u * 25 + lane * 2.3));
      const depth =
        radius *
        (core ? 0.8 : 1.1) *
        (0.36 + 0.64 * Math.sin((Math.min(u * 2, 1) * Math.PI) / 2));
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2;
        const point = p
          .clone()
          .add(new Vector3(Math.cos(angle) * radius, 0, 0))
          .addScaledVector(outward, Math.sin(angle) * depth);
        positions.push(...point.toArray());
        uvs.push(j / sides, u);
        travel.push(t);
        progress.push(u);
        if (i && j < sides) {
          const a = (i - 1) * (sides + 1) + j,
            b = i * (sides + 1) + j;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('travelTime', new Float32BufferAttribute(travel, 1));
    geometry.setAttribute('flowProgress', new Float32BufferAttribute(progress, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, createFlowMaterial(time, true, lane, !core));
    mesh.name = core ? `WaterCore-${lane}` : `AeratedStrand-${lane}`;
    mesh.receiveShadow = true;
    geometry.computeBoundingSphere();
    geometry.boundingSphere!.radius += 0.4;
    group.add(mesh);
  }
  return group;
}
