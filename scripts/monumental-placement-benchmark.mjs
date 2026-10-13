// Requires a sibling ../baseline checkout at 1a74835 with node_modules available.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as beforeRuin from '../../baseline/src/jelly-oasis/landmark/createOvergrownRuin.ts';
import * as beforeTerrain from '../../baseline/src/jelly-oasis/terrain/createTerrain.ts';
import * as beforeWorld from '../../baseline/src/jelly-oasis/terrain/worldLayout.ts';
import * as beforeVegetation from '../../baseline/src/jelly-oasis/vegetation/vegetationPlacement.ts';
import * as beforePlacement from '../../baseline/src/jelly-oasis/scenery/sceneryPlacement.ts';
import * as beforeGeometry from '../../baseline/src/jelly-oasis/scenery/sceneryGeometry.ts';
import * as beforeConfig from '../../baseline/src/jelly-oasis/scenery/sceneryConfig.ts';
import * as afterRuin from '../src/jelly-oasis/landmark/createOvergrownRuin.ts';
import * as afterTerrain from '../src/jelly-oasis/terrain/createTerrain.ts';
import * as afterWorld from '../src/jelly-oasis/terrain/worldLayout.ts';
import * as afterVegetation from '../src/jelly-oasis/vegetation/vegetationPlacement.ts';
import * as afterPlacement from '../src/jelly-oasis/scenery/sceneryPlacement.ts';
import * as afterGeometry from '../src/jelly-oasis/scenery/sceneryGeometry.ts';
import * as afterConfig from '../src/jelly-oasis/scenery/sceneryConfig.ts';
const dir = resolve('public/assets/jelly-oasis/landmarks/overgrown-ruin');
globalThis.fetch = async () =>
  new Response(await readFile(resolve(dir, 'layout.json'), 'utf8'));
GLTFLoader.prototype.loadAsync = async function (url) {
  const b = await readFile(resolve(dir, url.split('/overgrown-ruin/').at(-1)));
  return this.parseAsync(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
};
const result = {
  environment:
    'Node CPU, 224m, same GLB fixtures, one warmup, five placement calls; not a device FPS benchmark',
  cases: {},
};
for (const [
  name,
  ruin,
  terrainModule,
  world,
  vegetation,
  placement,
  geometry,
  configModule,
] of [
  [
    'baseline',
    beforeRuin,
    beforeTerrain,
    beforeWorld,
    beforeVegetation,
    beforePlacement,
    beforeGeometry,
    beforeConfig,
  ],
  [
    'candidate',
    afterRuin,
    afterTerrain,
    afterWorld,
    afterVegetation,
    afterPlacement,
    afterGeometry,
    afterConfig,
  ],
]) {
  const config = world.createWorldConfig(),
    terrain = terrainModule.createTerrain(config);
  const l = await ruin.createOvergrownRuin(
    config,
    true,
    true,
    true,
    'v2',
    true,
    { tree: true, pond: true, cliff: true },
    { pondOnly: true, water: true, waterfall: false, forceCpu: true },
    terrain,
  );
  const site = {
    placement: l.placement,
    rootY: l.root.position.y,
    terrain: config,
    pond: l.assets.pondGuide,
    approach: l.assets.layout.guides.CreaturePaths_ArchApproach_6m,
    obstacles: vegetation.groundFootprints(l.root, l.assets.modules, config),
  };
  const footprints = Object.fromEntries(
    configModule.SCENERY_KINDS.map((kind) => {
      const g = geometry.createSceneryGeometry(kind),
        p = geometry.projectedFootprint(g);
      g.dispose();
      return [kind, p];
    }),
  );
  const occupied = [...l.vegetation.instances(), ...l.composition.instances()];
  placement.placeScenery(site, occupied, footprints);
  const ms = [];
  let count;
  for (let i = 0; i < 5; i++) {
    const start = performance.now(),
      p = placement.placeScenery(site, occupied, footprints);
    ms.push(performance.now() - start);
    count = p.instances.length;
  }
  result.cases[name] = { ms, medianMs: [...ms].sort((a, b) => a - b)[2], count };
  l.dispose();
  terrain.geometry.dispose();
  terrain.material.dispose();
}
await writeFile(
  'artifacts/jelly-oasis/monumental-art-v2/placement-performance.json',
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
