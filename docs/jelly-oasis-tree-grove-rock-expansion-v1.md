# Jelly Oasis — Tree Grove & Rock Expansion v1

**TECH_PASS / ART_USER_REVIEW**. Production adopts **A**. Real Galaxy Fold FPS, heat and prolonged GPU memory remain **NOT_TESTED**.

Base master: `c662ae9b0d8da4a3b35ac3a206bbf648ae2f69f4` (Phase 1 merged, TECH_PASS). Final stage remains **224 × 224m**, boundary ±112m, oasis anchor (14,14), yaw π/6, scale 1. Read `createWorldConfig()`; no former (70,58) placement is copied into scenery. All 16 GLBs and their source hashes, approved GPGPU/CPU pond, paths, terrain, camera and environment defaults are preserved.

## Adopted composition

Two groves sit west/northwest of the hero tree, with three distinct silhouette sources: asymmetrical broad crown, narrow vertical crown and young tree. Connected six-sided trunks and intersecting tapered boughs support opaque faceted crowns. Approximate rendered tree heights are 3.4–10.3m, always smaller than the existing 28m hero tree. Six vertex-coloured source geometries/materials are shared by six InstancedMeshes. No textures, animation, extra lights, physical collisions or Blender resources were introduced. New objects receive existing shadows but do not cast them on either desktop or mobile.

| Source         | Desktop A | Mobile A |                      Source triangles |
| -------------- | --------: | -------: | ------------------------------------: |
| Broad crown    |         7 |        6 |                                   392 |
| Vertical crown |         5 |        4 |                                   184 |
| Young tree     |         4 |        3 |                                   184 |
| Pebble         |        16 |       12 |                                    20 |
| Boulder        |        16 |       12 |                                    20 |
| Low ridge      |         2 |        2 |                                    80 |
| Total          |    **50** |   **39** | **5,200 / 4,280 instanced triangles** |

Mobile selects a stable three-of-four subset by source kind and keeps every accepted ridge. The full deterministic master placement remains available to exclusion checks. Shared geometry reservation covers every actual projected vertex.

| Zone            | Candidate centre(s), world metres unless noted           | A accepted | Role                                                 |
| --------------- | -------------------------------------------------------- | ---------: | ---------------------------------------------------- |
| west-grove      | (-56,15.68), radius15m                                   |         15 | Main complementary grove and low rocks               |
| northwest-grove | (-42.56,-24.64), radius15m                               |         15 | Separated smaller woodland mass                      |
| north-ridge     | (-60.48,-69.44), (3.36,-89.60), (60.48,-69.44), radius8m |         12 | Two dry ridge pieces plus dispersed boulders/pebbles |
| ruin-stones     | Landmark-local (25,-18), (25,10), radius4m               |          1 | Sparse framing outside route masks                   |
| meadow-stones   | (-35.84,67.20), (42.56,69.44), (73.92,44.80), radius5m   |          7 | Three low patches with broad meadow gaps             |

World candidate centres are fractions of the actual stage width. They stay at their world sites if the landmark moves, while ruin-local candidates follow the landmark transform. Exact accepted positions/radii/seed/rejections are in `placement-audit.json` and `browser-qa.json`; the table is not a list of forced placements.

The initial north/NW proposal produced excessive slope rejection and **zero** ridges. The measured height/slope grid identified safer NW ground and highland shoulders. Centres were changed; slope thresholds were **not loosened** (tree0.28, pebble0.32, boulder/ridge0.38). Ridge quotas were deliberately not forced: two of three requested sections survived spacing/support checks. New ridges are irregular independent dry masses without the older waterfall cliff's horizontal colour bands.

## Placement and lifecycle

Each zone/kind uses independent seed hashing from `0x02671012`; attempts are capped at32×target. Placement uses patched `sampleGround()` after excavation and support regeneration, the common pond+1m / loop / clearing / approach / passage / near-ground GLB footprint masks, both pre-existing decoration populations, and all new canopy/object radii plus0.5m spacing. New crowns remain outside the48m hero area plus their reserved radius, so western groves frame the scene without replacing the centre silhouette.

Dry rock bases use eight radial probes **and actual projected mesh vertices**, sampling after local rotation, scale and world transform. The base embeds below the minimum sample; excessive slope or burial (>58% of source height) rejects a candidate. Tests independently verify every flat-base mesh vertex against the actual patched terrain. No centre-only support assumptions, arbitrary height clamps or collision system are used.

`place()` refreshes scenery after vegetation/composition; existing isolate, material invalidation, WebGL restore and pagehide routes manage it. Scenery owns its geometry/material/instance buffers, removes its group before landmark teardown, and disposes each resource once. Off allocates no GPU resources. `scenery=off|a|b` is honoured only with debug enabled; normal URLs retain A and expose no debug global.

## A/B decision and measured cost

A is adopted because the separated groves and low highland masses retain the main tree/pond/ruin hierarchy and meadow gaps. B is an inspection candidate only:22 trees and44 stones, with all ridge candidates rejected after the denser earlier boulders occupy support sites. B's loss of ridge hierarchy and larger crowns are a **WARN**, not a reason to force placements or expand production density. Four identical cameras/views at four viewports record the comparison.

| Overview snapshot | Off calls / triangles | A calls / triangles | B calls / triangles | GPU geometries Off→A | Textures |
| ----------------- | --------------------: | ------------------: | ------------------: | -------------------: | -------: |
| 1440×900          |           57 / 71,475 |         69 / 81,875 |         67 / 85,907 |                83→89 |    10→10 |
| 390×844           |           64 / 51,447 |         76 / 60,007 |         74 / 63,135 |                83→89 |    10→10 |
| 360×780           |          121 / 82,752 |        127 / 87,032 |         74 / 63,135 |                83→89 |    10→10 |
| 844×390           |           57 / 51,096 |         69 / 59,656 |         67 / 62,784 |                83→89 |    10→10 |

These are total renderer snapshots, including pond reflection/refraction and intermittent existing shadow renders. They are **not logical body draw counts or an FPS benchmark**. The360px Off/A pair captured a different shadow-update frame than the other pairs, so it cannot establish a smaller mobile cost. Logical A scenery uses6 body draws,5,200 desktop /4,280 mobile triangles,6 geometries,6 materials,0 textures. Reflection traversal commonly makes the visible call delta12. New objects do not add shadow casts. Three consecutive rebuilds at a fixed camera/weather/shadow state retained exactly91 geometries,8 textures and50 scenery instances; snapshot allocation differences between views are not leaks.

## Validation and evidence

- `npm ci`, `npm run lint`, `npm run build`: PASS. Full suite: **63 files / 323 tests PASS**, including Phase1 map rescale, frozen GLBs, water and terrain integration.
- New real-GLB integration verifies reserved source bounds, deterministic A/B/seed independence, actual ground contact, all shared masks/spacing, transformed world/local sites, reset reproducibility, unchanged existing decoration, mobile subsets, isolate/restore, fixed resources and idempotent disposal.
- `browser-qa.json`: PASS, no console/page/shader errors,16 source GLB hashes and all200 responses, A/B/Off at1440×900 /390×844 /360×780 /844×390,89 debug images plus4 normal-page images. Overview/medium/ground/pond, west/north, six source types ×four angles, tree noon/sunset/night, RAIN/MIST and shadows-off are recorded. All loop/clearing/approach/passage audits pass. Rebuilds and post-load WebGL loss/restore preserve instances and the GPGPU pond.
- `lifecycle-qa.json`: PASS. Pending GLB load with context loss/restore, pending-load pagehide teardown, unavailable float extension CPU fallback, BFCache resume and final disposal all work with scenery.
- `pond/browser-qa.json`: approved pond-only regression evidence. Numerical waves/rain/mist/night, forced CPU, reconstruction, context restore and mobile/production checks use the existing pond QA script.
- `placement-audit.json`:16 real world module bounds, existing vegetation/composition and conservative near-ground footprint occupancy,57×57 patched height/slope grid, exact A placements/rejections.
- `height-slope-occupancy.png`: top-down analytical map. Cyan rectangles are conservative GLB bounds; tree canopy/rock reserve circles show occupied space. It complements the exact masks rather than defining new exclusions.

Container screenshots may lack Korean system-font glyphs; app font/CSS settings are unchanged. The portrait overview intentionally preserves the Phase1 whole-stage fit; use medium to inspect grove silhouettes. Overall aesthetics remain **USER_REVIEW**, with no unresolved technical BLOCK.

Reproduce from the checkout:

```sh
npm ci
npm run lint
npm test -- --maxWorkers=2
npm run build
OASIS_QA_BROWSER=/tmp/chromium node scripts/scenery-browser-qa.mjs
OASIS_QA_BROWSER=/tmp/chromium node scripts/scenery-lifecycle-qa.mjs
POND_QA_BROWSER=/tmp/chromium POND_QA_OUTPUT=artifacts/jelly-oasis/tree-grove-rock-expansion-v1/pond node scripts/pond-only-browser-qa.mjs
```

## Phase 3 handoff

Preserve the two west/NW grove canopy circles and accepted north ridge/boulder bases from the exact placement audit. Use the warm olive palette (`#6b8050`, `#809363`, `#667d54`, young`#92a572`) and muted stone palette (`#a2a08b`, `#949484`, `#838a7c`). Avoid new foreground height in front of the hero, lake or arch. South meadow between/around the three sparse low stone patches is the intended flower composition area; retain open corridors and broad gaps rather than filling every space. Reuse actual mesh footprints, both existing vegetation groups and scenery canopy/base radii in Phase3 exclusions. The Phase1 camera, all16 GLBs, route audits and pond behavior remain its QA baseline. Aesthetic approval and real-device performance are outstanding user-side observations, not fabricated test passes.
