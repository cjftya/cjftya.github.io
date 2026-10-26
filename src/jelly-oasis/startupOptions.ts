import { selectMeadow } from './meadow/meadowConfig';
import { selectScenery } from './scenery/sceneryConfig';
import { createWorldConfig, selectWorldSize } from './terrain/worldLayout';
import { selectComposition } from './composition/compositionConfig';
import { selectVegetation } from './vegetation/vegetationConfig';
import { selectCrystalDetail } from './landmark/landmarkConfig';

/** Resolve URL variants once at startup; inspection overrides remain debug-only. */
export function readStartupOptions(search: string, development = false) {
  const query = new URLSearchParams(search);
  const debugEnabled = development || query.has('debug');
  const config = createWorldConfig(
    selectWorldSize(debugEnabled, query.get('world')),
    debugEnabled && query.get('art') === 'b' ? 2 : 1,
  );
  const cliffDetail = !(debugEnabled && query.get('cliff') === 'blockout');
  const ruinDetail = !(debugEnabled && query.get('ruin') === 'blockout');
  const treeDetail = !(debugEnabled && query.get('tree') === 'blockout');
  const pondQuery = debugEnabled ? query.get('pond') : null;
  const pondDetail: boolean | 'v2' =
    pondQuery === 'blockout' ? false : pondQuery === 'detail' ? true : 'v2';
  // Approved detailed crystals are the production default; blockout is debug-only.
  const crystalDetail = selectCrystalDetail(debugEnabled, query.get('crystal'));
  const waterQuery = debugEnabled ? query.get('water') : null;
  const refinedDefault = !(debugEnabled && query.get('aesthetic') === 'baseline');
  const aesthetic = {
    sacred: !(debugEnabled && query.get('sacred') === 'baseline'),
    tree:
      (refinedDefault && !(debugEnabled && query.get('tree') === 'detail')) ||
      (debugEnabled && query.get('tree') === 'refined'),
    pond:
      (refinedDefault && !(debugEnabled && pondQuery === 'detail-v2')) ||
      (debugEnabled && pondQuery === 'refined'),
    cliff:
      (refinedDefault &&
        !(
          debugEnabled && ['detail', 'detail-v1'].includes(query.get('cliff') ?? '')
        )) ||
      (debugEnabled && query.get('cliff') === 'refined'),
    water:
      waterQuery === 'deep' || waterQuery === 'soft'
        ? waterQuery
        : waterQuery === 'baseline' || !refinedDefault
          ? undefined
          : 'soft',
  } as const;
  return {
    query,
    debugEnabled,
    config,
    cliffDetail,
    ruinDetail,
    treeDetail,
    pondDetail,
    crystalDetail,
    aesthetic,
    vegetation: selectVegetation(debugEnabled, query.get('vegetation')),
    composition: selectComposition(debugEnabled, query.get('composition')),
    scenery: selectScenery(debugEnabled, query.get('scenery')),
    meadow: selectMeadow(debugEnabled, query.get('meadow')),
  };
}
