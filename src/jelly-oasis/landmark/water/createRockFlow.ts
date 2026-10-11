import { BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3 } from 'three';
import { createFlowMaterial } from './flowMaterial';
import type { WaterFlowPath } from './flowPath';

export function createRockFlow(flow: WaterFlowPath, time: { value: number }) {
  const group = new Group();
  group.name = 'RockFlowV6';
  flow.lanes.forEach((lane, index) => {
    const positions: number[] = [],
      uvs: number[] = [],
      travel: number[] = [],
      progress: number[] = [],
      indices: number[] = [];
    let distance = 0;
    lane.forEach((s, i) => {
      if (i) distance += s.point.distanceTo(lane[i - 1]!.point);
      const tangent = lane[Math.min(i + 1, lane.length - 1)]!.point.clone()
        .sub(lane[Math.max(0, i - 1)]!.point)
        .normalize();
      const across = new Vector3().crossVectors(tangent, s.normal).normalize();
      for (let j = 0; j <= 4; j++) {
        const u = j / 4;
        const p = s.point
          .clone()
          .addScaledVector(across, (u - 0.5) * s.width)
          .addScaledVector(s.normal, Math.sin(u * Math.PI) * 0.026);
        positions.push(...p.toArray());
        uvs.push(u, distance);
        travel.push(distance / (1.5 + index * 0.14));
        progress.push(i / (lane.length - 1));
        if (i && j < 4) {
          const a = (i - 1) * 5 + j,
            b = i * 5 + j;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('travelTime', new Float32BufferAttribute(travel, 1));
    geometry.setAttribute('flowProgress', new Float32BufferAttribute(progress, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, createFlowMaterial(time, false, index));
    mesh.name = `RockStreamlet-${index}`;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}
