# Jelly Oasis — Environment Polish v1

## Release status

Environment v1 final audit, 2026-10-12. Baseline: `9271637cd8f7487f07dae72eba2868293c384c24`.

This release preserves the selected scene. **No production TypeScript, model, shader, terrain, placement, or material changes were adopted.** The deliverable is a reproducible final inspection, an additional production asset/northern slope regression test, and evidence of the existing environment. This is not a claim that every aesthetic imperfection has been repaired.

Visual acceptance remains **USER_REVIEW**. Android/Galaxy Fold FPS, heat, long-duration GPU memory, and real device touch behavior are **NOT_TESTED**. Headless screenshots use software rendering and lack Korean font glyphs; this is a capture environment limitation, not a product text change.

## Candidate decisions

| ID   | Evidence and cause                                                                                                                                                                                                                                         | Alternatives considered                                                        | Decision                                                                                                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | `tree-under-noon/night/sunset` shows blunt geometry ends inside the crown. `tree-right` preserves the selected silhouette. A view from underneath exaggerates the issue.                                                                                   | Extend 1–2 terminal branches into the existing canopy; retain original assets. | **KEEP / WARN**. Blender is unavailable in this execution environment; source scripts require an external Windows `.blend`. No safe, validated candidate export or two-angle A/B improvement was available. Geometry is unchanged. |
| C-01 | `cliff-front` and `cliff-side` show three ledge bands with bright upward-facing facets. Lighting changes contrast; repeated ledge geometry remains.                                                                                                        | Alter one ledge direction; retain selected faceted rock.                       | **KEEP / WARN**. The pattern is present at the medium view but no validated improvement candidate is available; avoid repeating the prior ineffective 98-vertex change.                                                            |
| R-01 | `ruin-front/side` shows intentional gaps between separate chamfered blocks and a broken wall silhouette. Passage checks remain clear.                                                                                                                      | One local stone chip; retain current blocks and separation.                    | **KEEP**. No new gap/clearance defect warrants editing. The discarded 12-vertex weathering proposal was not reapplied.                                                                                                             |
| S-01 | `pond-low/top` shows a warm transition along the water edge; reflection and the excavated bank meet continuously.                                                                                                                                          | Small material contrast adjustment; retain existing water/shore relationship.  | **KEEP / WARN**. A warm edge remains visible but no new floating or broken boundary was observed. Its color is retained for user review. Hidden source shore regions are not treated as visible defects.                           |
| N-01 | Actual patched terrain, 1m grid: 594 samples across x −26..0 / z −91..−70. No sample passed slope 0.22 at all tested footprint steps (0.35 / 0.5 / 0.95m). Minimum conservative slope 0.3546163. Original north attempts: 128 slope rejects, 0 placements. | Move the two centers within nearby flat ground; retain the empty rise.         | **KEEP_EMPTY**. No local eligible area was found. No slope relaxation, terrain reshaping, or wider relocation.                                                                                                                     |

Before/after model pairs are intentionally absent because all assets are unchanged. The KEEP evidence uses the current baseline build at fixed cameras, DPR 1, reduced motion, manual noon/sunset/midnight and CLEAR/RAIN/MIST. Camera position, target, time and renderer state are recorded per screenshot in `browser-qa.json`. No isolated angle is presented as proof of a model improvement.

## Preserved invariants

- 320×320 terrain; landmark `(70,58)`, rotation π/6, scale 1; BrokenWall offset `(4,11)`.
- 16 selected GLBs, 20,894 model triangles; no non-finite positions or zero-area triangles in the asset audit. Selected asset SHA-256 and bounds are recorded.
- Desktop vegetation A: 180 instances; composition A: 80. Mobile: 120 / 55. All five populated composition zones and the empty northern zone retain their original deterministic coordinates. Whole-list/per-zone coordinate hashes are recorded.
- Repeated three placements reproduce exact vegetation and composition coordinates. Existing owner disposal and transformed-site tests remain active.
- Six-metre loop, sixteen-metre clearing, arch approach and four-metre passage sampled audits are clear. This is a visual clearance audit, not collision physics or navigation.
- Pond-only GPGPU plus CPU fallback, empty channel path and zero rock flow; all production water/optics and climate code are untouched.
- Debug variants remain opt-in. Production query parameters do not expose the review API or alter asset defaults.

## Validation and renderer evidence

Baseline and final CI commands pass: **61 test files / 317 tests**, lint and production build. The selected Jelly Oasis bundle and every selected GLB remain identical to the baseline.

- Focused browser inspection: 71 current captures at 1440×900, 390×844, 360×780 and 844×390; all 16 GLB URLs return HTTP 200; no console, page or shader errors.
- Landscape suite: 144 full matrix cases plus 16 density, lifecycle, CPU and failure cases. Three repeated rebuilds, isolate/restore, WebGL loss/restore, persisted pagehide/pageshow, transformed sites and intentional GLB 404 handling pass.
- Pond suite: GPGPU readback, CLEAR→RAIN→MIST/OVERCAST/PARTLY_CLOUDY/CLEAR transitions, CPU fallback, reduced motion, rebuild/restore and ignored legacy flow flags pass. At the diagnostic impulse, significant cells expand from 44 initially to 2,304 at 1s. Cells beyond 1.5m expand from 0 to 2,060; the farthest significant displacement expands from 0.620m to 4.777m. The 2s/4s samples include normal dry ambient forcing and are recorded rather than claimed as isolated impulse propagation.
- Vegetation suite: deterministic densities, routes, three rebuilds, resource disposal/isolation, context restore, viewport variants and asset 404 handling pass. Controls suite: shadow toggles, automatic→manual weather, play/pause, sky target, orientation preset, orbit preservation, synthetic visibility pause/resume and non-persisted pagehide/re-entry pass. Orbit settling is checked across six animation frames, and sky viewing checks the target direction (it intentionally keeps the camera position).
- Initial parallel pond run exceeded the unchanged 30s weather wait under concurrent software renderers. The isolated rerun passed without timeout increases or weakened assertions. New controls QA initially sampled damping before it had settled and incorrectly expected sky viewing to move the camera position; those test assumptions were corrected using the actual render loop and target behavior. The first focused script used an unavailable shore selector option; its test setup was corrected and the complete rerun passed. These were QA execution failures, not accepted product failures.

| Fixed noon medium view | Render calls | Rendered triangles | Geometries | Textures |
| ---------------------- | -----------: | -----------------: | ---------: | -------: |
| Desktop 1440×900       |           48 |             77,927 |         83 |       10 |
| Portrait 390×844       |           50 |             57,605 |         83 |       10 |
| Landscape 844×390      |           48 |             57,548 |         83 |       10 |

Desktop and portrait values equal the recorded prior release values at these views. Counts include water reflection/refraction; they are not FPS. In the landscape lifecycle suite, additional inspected prototype geometry remains cached at 85 geometries / 10 textures across repeated rebuilds; the pond-only camera suite is stable at 67 / 10. Different visibility histories must not be compared as evidence of a leak.

The [northern slope map](../artifacts/jelly-oasis/environment-polish-v1/north-slope-grid.svg) shows the original 4m search disks and nearby measured terrain. All 144 numeric matrix results are retained; duplicate matrix JPEGs are omitted according to `screenshot-manifest.json`, with hashes and a script to reproduce them. Focused evidence and representative restore/fallback captures are retained.

## Reproduction

```bash
npm ci
npm run lint
npm test -- --maxWorkers=2
npm run build
OASIS_POLISH_AUDIT=artifacts/jelly-oasis/environment-polish-v1 \
  npx vitest run tests/jelly-oasis-environment-polish.test.ts --maxWorkers=2
OASIS_QA_BROWSER=/path/to/chromium node scripts/environment-polish-browser-qa.mjs
OASIS_QA_BROWSER=/path/to/chromium node scripts/environment-polish-controls-qa.mjs
OASIS_QA_BROWSER=/path/to/chromium \
  OASIS_QA_OUTPUT=artifacts/jelly-oasis/environment-polish-v1/landscape \
  node scripts/landscape-composition-browser-qa.mjs
POND_QA_BROWSER=/path/to/chromium \
  POND_QA_OUTPUT=artifacts/jelly-oasis/environment-polish-v1/pond \
  node scripts/pond-only-browser-qa.mjs
OASIS_QA_BROWSER=/path/to/chromium \
  OASIS_QA_OUTPUT=artifacts/jelly-oasis/environment-polish-v1/vegetation \
  node scripts/vegetation-browser-qa.mjs
```

The existing scripts keep their previous output locations by default; the new environment variables isolate this release's evidence. The new focused script accepts `OASIS_QA_URL` to inspect a deployed production build and otherwise starts a strict-port local preview. It only adds a temporary shore option to the test page's debug selector; product UI and runtime code are unchanged.

Legacy aesthetic scripts require Edge and obsolete flow/material expectations. They were read, but their old water candidates were not reintroduced. Current production coverage comes from the focused inspection, existing landscape/vegetation/pond suites, and production unit tests.

## Device review

Open [Jelly Oasis](https://cjftya.github.io/projects/jelly-oasis/) on the Galaxy Fold. Rotate the device, orbit/zoom for 30–60 seconds, reset the camera, switch noon/night and CLEAR/RAIN/MIST, then leave and reopen the page. Report black water, persistent missing models, visible stutter, or unusual heat. Confirm whether the retained tree ends, cliff bands and warm shoreline are acceptable. These observations determine ART_APPROVED; automated viewport captures do not substitute for device measurements.

## Recovery

No scene changes require recovery. Reverting this audit release removes only QA scripts/tests/docs/artifacts. The selected production assets and runtime remain the baseline's identical versions.
