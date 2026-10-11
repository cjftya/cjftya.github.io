import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  Vector3,
} from 'three';
import type { FallingFlow } from './fallingFlow';
import { ballisticPoint } from './fallingFlow';
import { createFlowMaterial } from './flowMaterial';

/** Thin ribbons on the checked trajectories; shader animation never moves collision geometry. */
export function createFallingFilm(
  flow: FallingFlow,
  time: { value: number },
  mobile: boolean,
  paths = false,
) {
  const group = new Group();
  group.name = 'FallingFilmV1';
  flow.paths.forEach((path, lane) => {
    const end = path.lanes[0]!.at(-1)!;
    const tangent = end.point.clone().sub(path.lanes[0]!.at(-2)!.point).normalize();
    const across = new Vector3().crossVectors(tangent, end.normal).normalize();
    const positions: number[] = [],
      uv: number[] = [],
      travel: number[] = [],
      progress: number[] = [],
      indices: number[] = [];
    const steps = mobile ? 48 : 80;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps,
        t = u * path.duration;
      const p = ballisticPoint(path.launch, path.velocity, flow.gravity, t);
      const speed = path.velocity
        .clone()
        .add(new Vector3(0, -flow.gravity * t, 0))
        .length();
      const width = end.width * Math.sqrt(path.velocity.length() / speed);
      for (let j = 0; j <= 4; j++) {
        const q = p.clone().addScaledVector(across, (j / 4 - 0.5) * width);
        // Match the upstream film crown exactly, then stretch it to a thin sheet.
        q.addScaledVector(end.normal, Math.sin((j / 4) * Math.PI) * 0.026 * (1 - u));
        positions.push(...q.toArray());
        uv.push(j / 4, u);
        travel.push(flow.travelTime + t);
        progress.push(u);
        if (i && j < 4) {
          const a = (i - 1) * 5 + j,
            b = i * 5 + j;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setAttribute('travelTime', new Float32BufferAttribute(travel, 1));
    geometry.setAttribute('flowProgress', new Float32BufferAttribute(progress, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const material = createFlowMaterial(time, true, lane, false, false, false);
    material.side = DoubleSide;
    material.opacity = 0.74;
    material.roughness = 0.18;
    const mesh = new Mesh(geometry, material);
    mesh.name = `FallingFilm-${lane}`;
    group.add(mesh);
    if (paths) {
      const line = new Line(
        new BufferGeometry().setFromPoints(path.fall),
        new LineBasicMaterial({ color: 0xffae52, depthTest: false }),
      );
      line.name = `MeasuredBallisticPath-${lane}`;
      line.renderOrder = 10;
      group.add(line);
    }
  });
  return group;
}
