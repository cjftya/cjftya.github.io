import { BufferAttribute, BufferGeometry } from 'three';

interface TerrainAttributeData {
  array: BufferAttribute['array'];
  itemSize: number;
  normalized: boolean;
}

export interface TerrainGeometryData {
  attributes: Record<string, TerrainAttributeData>;
  index: TerrainAttributeData | null;
}

export function packTerrainGeometry(geometry: BufferGeometry): TerrainGeometryData {
  const attributes: TerrainGeometryData['attributes'] = {};
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (!(attribute instanceof BufferAttribute)) {
      throw new Error(`Unsupported terrain attribute: ${name}`);
    }
    const { array, itemSize, normalized } = attribute;
    attributes[name] = { array, itemSize, normalized };
  }
  const index = geometry.index;
  return {
    attributes,
    index: index && {
      array: index.array,
      itemSize: index.itemSize,
      normalized: index.normalized,
    },
  };
}

export function unpackTerrainGeometry(data: TerrainGeometryData): BufferGeometry {
  const geometry = new BufferGeometry();
  for (const [name, { array, itemSize, normalized }] of Object.entries(
    data.attributes,
  )) {
    geometry.setAttribute(name, new BufferAttribute(array, itemSize, normalized));
  }
  if (data.index) {
    const { array, itemSize, normalized } = data.index;
    geometry.setIndex(new BufferAttribute(array, itemSize, normalized));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
