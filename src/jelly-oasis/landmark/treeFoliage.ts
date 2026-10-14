import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Vector3,
} from 'three';
import { paintFaces } from './sanctuaryGeometry';

/** Closed, faceted leaves cast a silhouette without transparent cards. */
export function leafBlade(
  origin: Vector3,
  angle: number,
  length: number,
  color: Color,
) {
  const d = new Vector3(Math.cos(angle), -0.44, Math.sin(angle));
  const side = new Vector3(-Math.sin(angle), 0, Math.cos(angle));
  const tip = origin.clone().addScaledVector(d, length);
  const center = origin
    .clone()
    .addScaledVector(d, length * 0.48)
    .add(new Vector3(0, length * 0.16, 0));
  const left = center.clone().addScaledVector(side, length * 0.32);
  const right = center.clone().addScaledVector(side, -length * 0.32);
  const underside = center.clone().add(new Vector3(0, -length * 0.11, 0));
  const faces = [
    [origin, left, center],
    [left, tip, center],
    [tip, right, center],
    [right, origin, center],
    [origin, underside, left],
    [left, underside, tip],
    [tip, underside, right],
    [right, underside, origin],
  ];
  const g = new BufferGeometry();
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      faces.flatMap((face) => face.flatMap((p) => p.toArray())),
      3,
    ),
  );
  g.computeVertexNormals();
  return paintFaces(g, [
    color,
    color.clone().multiplyScalar(1.1),
    color.clone().multiplyScalar(0.82),
  ]);
}

/** Rounded clusters with embedded leaf tips replace the former flat discs. */
export function foliageCrown(
  center: Vector3,
  width: number,
  seed: number,
  mobile: boolean,
) {
  const palette = ['#6e9147', '#95ad56', '#466e44'].map((c) => new Color(c));
  const parts: BufferGeometry[] = [];
  const count = mobile ? 28 : 42;
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963 + seed * 0.8,
      h = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - h * h),
      radial = width * 0.76;
    const pos = center
      .clone()
      .add(
        new Vector3(
          Math.cos(a) * r * radial,
          h * width * 0.37,
          Math.sin(a) * r * radial * 0.88,
        ),
      );
    const size = width * (0.24 + 0.055 * Math.sin(i * 4.13 + seed));
    const g = new IcosahedronGeometry(1, 1);
    g.deleteAttribute('uv');
    const v = g.attributes.position!;
    for (let j = 0; j < v.count; j++) {
      const x = v.getX(j),
        y = v.getY(j),
        z = v.getZ(j);
      const f = 1 + 0.08 * Math.sin(x * 8 + z * 7 + seed + i);
      v.setXYZ(j, x * f, y * f, z * f);
    }
    g.scale(size, size * 0.74, size * 0.91)
      .rotateY(a)
      .translate(pos.x, pos.y, pos.z);
    g.computeVertexNormals();
    const tint = 0.92 + 0.09 * Math.sin(i * 1.7 + seed) + 0.08 * h;
    parts.push(
      paintFaces(
        g,
        palette.map((c) => c.clone().multiplyScalar(tint)),
      ),
    );
    for (let k = 0; k < (mobile ? 4 : 7); k++) {
      const b = a + k * 2.399,
        lift = 0.1 + 0.3 * ((k * 0.37) % 1);
      const origin = pos
        .clone()
        .add(
          new Vector3(
            Math.cos(b) * size * 0.55,
            size * lift,
            Math.sin(b) * size * 0.55,
          ),
        );
      parts.push(
        leafBlade(
          origin,
          b,
          0.9 + size * 0.24,
          palette[1]!.clone().multiplyScalar(tint),
        ),
      );
    }
  }
  return parts;
}
