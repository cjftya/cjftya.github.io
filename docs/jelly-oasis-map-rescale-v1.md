# Jelly Oasis — Map Rescale & Framing v1

**TECH_PASS / ART_USER_REVIEW**. Real Android FPS, heat and prolonged GPU memory: **NOT_TESTED**.

Base: `0c3298d370f8b44e222e998406efac7e73df92c7`; branch `feat/jelly-oasis-map-rescale-v1`. Source GLBs, water implementation, weather/shadow defaults, Blender and other project sources are unchanged.

## Final decision

Production is **224 × 224m**, world boundary ±112m, oasis anchor **(14,14)**, yaw **π/6**, scale **1**. The application uses `createWorldConfig()` / `FINAL_TERRAIN_SIZE=224`; the original 320m default config remains a legacy fixture.

| Candidate | Area m² | Original area | Grid            | Minimum loaded GLB margin | Desktop vegetation / composition | Decision                                                                    |
| --------- | ------: | ------------: | --------------- | ------------------------: | -------------------------------- | --------------------------------------------------------------------------- |
| 320       | 102,400 |          100% | 80 segments, 4m |                    61.61m | 180 / 80                         | Original excessive empty surroundings, off-centre oasis                     |
| 224       |  50,176 |           49% | 56 segments, 4m |                    69.61m | 180 / 80                         | **Adopted**: central oasis and useful future grove/cliff space              |
| 192       |  36,864 |           36% | 48 segments, 4m |                    53.61m | 180 / 88                         | Technically valid; less expansion room, north patches become slope-eligible |

Same-framing comparison files are `{320,224,192}-{1440x900,390x844,360x780,844x390}-{overview,medium,ground,pond-low}.jpg`. Desktop north/west and the original production-camera baseline are also archived. Screenshots use DPR1, noon CLEAR and reduced motion. `browser-qa.json.frameCoverage` records projected viewport fractions (conservative terrain bounds and actual tree bounds). Full-stage portrait naturally leaves vertical breathing room; medium is the closer silhouette view. Final aesthetics remain for user review.

## Layout and sampling

Within 60m of the new anchor, sampling preserves the approved 320m ground translated by **(-56,-44)**. Between 60m and 80m it blends smoothly into compact outer hills. Both translations and compact grids share the original 4m vertices and triangle diagonals. `sampleGround()` still queries actual patched excavation triangles, with original triangle interpolation elsewhere. Existing support/contact/shore/excavation regeneration runs through `place()`. Heights are not forced and models are not scaled down.

World composition centres follow `size/320`; landmark-local detail keeps metre offsets. The 224m result retains desktop **180 / 80**, mobile **120 / 55**, west-hills 8, and north-highland **0 / 128 slope rejections**. No placement quota is forced. Rebuilds reproduce the same positions and stable texture/geometry counts.

Compact debug offers only the validated central site; manual X/Z/yaw is disabled. Old west/north placements remain only in the explicit 320m fixture. `world=320|224|192` works only in debug; normal queries cannot override size, vegetation, composition, solver or waterfall defaults.

Overview/Reset fits actual terrain, cut-wall and module bounds at FOV42°, with the original southeast view direction and 88% horizontal / 82% vertical fit limits. Resize refits overview/medium; manual orbit/zoom releases automatic framing. Maximum orbit distance accommodates the legacy 320m portrait comparison. Sky view, damping and weather controls remain.

## Validation

- `npm ci`, lint, typecheck/build: PASS. Tests: **62 files / 321 PASS**.
- `world-bounds-audit.json`: 16 real imported GLBs, 20,894 asset triangles, finite bounds, ≥5m loaded-module boundary margin, loop/clearing/approach/passage clear at all sizes. Existing frozen-asset tests retain zero-area and geometry invariants.
- `browser-qa.json`: 3 sizes × 4 viewports, all GLB responses200 and source SHA256 captured, GPGPU pond-only, `channelPath=[]`, no waterfall rock flow, legal instance radii, all routes clear, Reset and three rebuilds stable, no rendering errors.
- `pond/browser-qa.json`: numerical wave spread, ambient/rain impulses, mist/night, forced CPU, mobile64² / desktop128², reconstruction, WebGL loss/restore and production smoke PASS. Archived PNGs are compressed to JPEG.
- `lifecycle-qa.json`: unavailable `EXT_color_buffer_float` selects CPU, persisted pagehide/pageshow resumes, nonpersisted pagehide disposes globals, production entry/Reset on four viewports PASS.
- `controls-qa.json`: shadows, automatic/manual weather, time pause/play, sky/Reset, medium rotation, orbit/wheel, manual-orbit resize preservation, visibility suspend/re-entry PASS. Camera rotation checks wait for an actual update rather than a fixed-time delay on SwiftShader.
- SwiftShader metrics are snapshots, not real-device performance. Korean system-font glyphs are absent in some container captures; application fonts/CSS were not changed.

Reproduce after `npm ci` and `npm run build`:

```sh
OASIS_RESCALE_AUDIT=artifacts/jelly-oasis/map-rescale-v1 npm test -- --maxWorkers=2 tests/jelly-oasis-map-rescale.test.ts
OASIS_QA_BROWSER=/path/to/chromium node scripts/map-rescale-browser-qa.mjs
OASIS_QA_BROWSER=/path/to/chromium node scripts/map-rescale-lifecycle-qa.mjs
OASIS_QA_BROWSER=/path/to/chromium node scripts/map-rescale-controls-qa.mjs
POND_QA_BROWSER=/path/to/chromium POND_QA_OUTPUT=artifacts/jelly-oasis/map-rescale-v1/pond node scripts/pond-only-browser-qa.mjs
```

## Phase 2 handoff

Use the shared landmark transform and actual `sampleGround()`. World zones follow compact outer hills; local detail uses metre offsets. New scene code must use (14,14), not the old (70,58).

Keep pond polygon +1m+instance radius, the 6m loop, 16m clearing, 6m approach, 4m arch passage and near-ground triangle footprints excluded. Generated instances must remain within ±112m including radius/safety margin. North-highland remains empty for Phase2 rock composition; do not weaken slopes to plant flowers. West-hills and meadow-transition provide existing visual anchors. Debug medium/ground/pond cameras follow the adopted placement; Reset is a stage-bounds fit. Keep water/lifecycle gates passing during expansion.

No new grove/rock/flower models, creature/NPC/NavMesh or interaction UI were added. User aesthetic review remains separate from technical readiness.
