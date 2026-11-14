# Jelly Oasis — Monumental Composition v1

Replaces the sparse Phase 3 direction with connected forest shoulders, large dry geological masses and three broad foreground meadow fields. Stage size remains 224m. The 16 landmark GLBs, hero tree, ruins, pond-only simulation, terrain topology, camera presets and weather systems are retained.

## Remove / keep / expand

| Population                                                     | Decision                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| Isolated pebbles, ruin-stones, meadow-stones                   | Remove                                                   |
| Scattered composition rocks and flowers, distant micro-patches | Remove                                                   |
| Original core vegetation                                       | Reduce from 180 requests to 40; retain grass/shrubs only |
| Shore and root transition                                      | Retain two quiet low patches                             |
| West / northwest woodland                                      | Connect into a broad asymmetric forest body              |
| North / northeast backdrop                                     | Large, thick dry ridge forms with clustered boulders     |
| East perimeter                                                 | Secondary woodland and geological shoulder               |
| Southern flowers                                               | Three 19–22m fields, replacing 3–3.3m micro-patches      |

Supporting crowns are widened 1.5× at source, with tree instance scale 1.9–2.15×. Height hierarchy remains below the 28m hero. Ridge prototypes are widened to 18m across and 12m high before instance scaling; these are faceted irregular dry rock forms, not waterfall structures. Flowers/grass use 2.7–3.5× size so their fields remain readable from medium views. Instanced source owners, material refresh, isolate and disposal paths are retained, without extra textures or lights.

## Placement changes and grounding

Large ridges are scheduled before smaller objects within each zone. Tree crowns can interlock at 48% of summed canopy radii; grouped ridge/boulder silhouettes can overlap at 50%. Full-radius separation still applies against other populations, landmark obstacles, pond and protected routes. Whole projected geometry remains reserved at stage boundaries.

The prior 48m hero exclusion becomes 32m plus crown radius. Shared 16m clearing, loop, arch approach, passage and pond masks remain unchanged. Forest trees are sampled over their actual trunk support radius rather than empty terrain under the entire canopy. Trees embed below the minimum of eight trunk support probes. Tree slope acceptance is 0.6 (about 31 degrees); ridge slope is 0.55 with the original 58% maximum burial constraint and every actual projected rock vertex sampled. This intentionally updates scenery support criteria while preserving independent route and pond masks. No centre-only rock support or arbitrary height clamps are used.

Mask/spacing rejections skip unnecessary terrain probes before continuing. Placement stays deterministic, capped and outside frame updates. Mobile retains deterministic subsets and full master reservations.

## Evidence and reproduction

Before images are copied from commit `6484393` Phase 3 captures, with the same overview and medium camera presets. After screenshots, exact placement audits and lifecycle state are under `artifacts/jelly-oasis/monumental-composition-v1`. The browser QA checks desktop, portrait and landscape mobile, overview/medium/ground/pond, west/north, sunset/night/rain/mist, all protected routes, frozen GLB hashes, three rebuilds, context restoration and production debug isolation.

```sh
npm run lint
npm test -- --maxWorkers=2
npm run build
node scripts/monumental-browser-qa.mjs
```

Art remains subject to user review after deployment. Software-renderer screenshots do not establish Galaxy Fold FPS, thermal behavior or long-session GPU memory.

## Measured final production population

Desktop: 80 supporting trees (48 broad, 22 spire, 10 young), 10 large ridge forms, 8 boulders, zero scenery pebbles. Meadows: 445 accepted plants across three broad fields. Core vegetation: 40, retained composition: 18. Requested quotas are not forced through masks or terrain rejection. The east shoulder remains lower density than the west forest; the central entry and upper bare hillside intentionally stay readable.

Scenery adds five body draws and 25,664 triangles; meadow adds three body draws and 18,478 triangles, with no new textures. A desktop overview total renderer snapshot is 67 calls / 149,233 triangles including the existing reflection and other passes. Three rebuilds retain exactly 95 geometries, 8 textures and 98 scenery instances. These are renderer snapshots, not hardware FPS measurements. Browser QA: PASS, 23 captures, no page/console/shader errors. All four protected route audits pass at every viewport.

Integration tests retain independent geometry/footprint bounds, actual flat rock-base contact, masks, transformed-placement determinism, mobile subsets, resource ownership and double disposal. Reduced decoration-count expectations are updated. Vitest allows 30 seconds for real-GLB tests on slower runners; the exhaustive meadow, multi-world rescale and legacy waterfall rebuild audits use explicit 120-second budgets.

Final validation: lint PASS; TypeScript / production build PASS; complete Vitest suite **64 files / 325 tests PASS** using the repository default test timeout configuration.

CI follow-up: the initial deploy attempt timed out only in the multi-world rescale and legacy waterfall rebuild audits (30 seconds). Both long-running real-GLB audits now use 120 seconds, without changing their assertions or production behavior.
