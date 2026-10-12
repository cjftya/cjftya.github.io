# Jelly Oasis — Landscape Composition v1

2026-10-12. Baseline: `5d71851b8bed6eafc808125c2dfef499c653870c`.

## Result and scope

Ship restrained A as the default: low faceted rocks and existing grass/shrub/flower sources create asymmetric shore, tree-edge, ruin-edge and outer-meadow patches. Large gaps remain deliberate. No new landmark, texture, animated object or Blender asset was added. Pond-only GPGPU water, excavation, terrain material, 16 GLBs, crystal details and camera presets remain unchanged.

The original density A coordinates are preserved. The original placement function is unchanged; its renderer now accepts the same near-ground footprint array computed once per landmark placement. Composition owns four static instanced meshes with its own seed and source resources; Off allocates no composition geometry or material. Instances are regenerated only on placement, never in the frame loop. Disposal is idempotent and runs before landmark resource disposal.

## Layout decision

| Zone              | Basis          | A placed | Decision                                                                                      |
| ----------------- | -------------- | -------: | --------------------------------------------------------------------------------------------- |
| Shore transition  | Landmark local |       21 | Low patches outside shoreline and original vegetation footprints                              |
| Tree edge         | Landmark local |       20 | Small outer-root framing, clear trunk silhouette                                              |
| Ruin frame        | Landmark local |       12 | Mask rejects crowded stone/access candidates; do not force requested totals                   |
| Meadow transition | Landmark local |       19 | Three sparse patches outside the landmark loop                                                |
| West hills        | World          |        8 | Two quiet markers, fixed world centers during landmark relocation                             |
| North highland    | World          |        0 | All candidates fail slope; retain the open slope rather than move terrain or relax protection |

Near framing is visible from the medium and targeted low cameras. Overview additions stay small; this is a subtle composition pass, not a redesign. A keeps more visual breathing room than B. The arch and water foreground stay open. Final aesthetic acceptance remains **USER_REVIEW**.

## Counts and budgets

| Metric                               |       Desktop A |       Mobile A |
| ------------------------------------ | --------------: | -------------: |
| Original vegetation                  | 180 (120/24/36) | 120 (80/16/24) |
| Added rocks                          |              17 |             12 |
| Added grass/shrub/flower             |         44/6/13 |         30/4/9 |
| Total added instances                |              80 |             55 |
| Added logical body draws             |               4 |              4 |
| Added body triangles                 |           1,871 |          1,283 |
| Owned source geometries/materials    |             4/4 |            4/4 |
| New textures / shadow-casting meshes |             0/0 |            0/0 |

Requested A is only an upper bound: 24 rocks + 73 plants. Rejections are reported by zone and cause. Mobile uses a stable two-thirds subset per kind, preserving the master seed. `renderer.info.render.calls` includes water captures and culling and is recorded separately in the browser evidence; it is not the four logical added body draws.

Production ignores `composition` queries. Debug comparison URLs:

- `?debug&composition=off`: original composition baseline.
- `?debug&composition=a`: final default.
- `?debug&composition=b`: richer comparison only.

Existing `vegetation=off|density-b` semantics remain intact.

## Verification and evidence

- `npm ci`, `npm run lint`, `npm test -- --maxWorkers=2`, `npm run build`: PASS, 60 test files / 316 tests.
- Real GLB + excavated-terrain test: deterministic instances, original A coordinates/counts unchanged, shared exclusions, radius-aware inter-instance spacing, grounding, world-zone coordinate conversion at basin/west/north sites and rotated/scaled placement, finite A/B budgets, stable resource identities, isolate/restore, refresh and double-disposal: PASS.
- Existing vegetation browser QA: PASS, including CPU rain impulses, page lifecycle, WebGL loss/restore, reset, relocation, production query ignoring and failed-load alert.
- New landscape browser QA: **PASS**, including all 144 matrix cases, rebuild/isolate/reset, pagehide/pageshow, WebGL loss/restore, CPU rain and production query guards.
- New browser evidence: `artifacts/jelly-oasis/landscape-composition-v1/`; reproducible command `node scripts/landscape-composition-browser-qa.mjs` after build. Off/A/B share camera presets and manually selected time/weather. Full matrix covers 1440×900, 390×844, 360×780 and 844×390; overview/medium/ground; noon CLEAR, 23:00 CLEAR, RAIN and MIST.
- Browser rendering uses headless Chromium with SwiftShader. Some Korean glyphs in screenshots may be unavailable in the container font environment; the app typography source was not changed.
- Galaxy Fold hardware FPS, GPU timing and long-duration device memory: **NOT_TESTED**. Browser resource checks are not a hardware performance claim.

## Whole-render measurements (noon medium)

| Device / variant | Render calls | Render triangles | Geometries | Textures |
| ---------------- | -----------: | ---------------: | ---------: | -------: |
| Desktop Off      |           40 |           74,185 |         79 |       10 |
| Desktop A        |           48 |           77,927 |         83 |       10 |
| Desktop B        |           48 |           78,893 |         83 |       10 |
| Mobile 390 Off   |           42 |           55,039 |         79 |       10 |
| Mobile 390 A     |           50 |           57,605 |         83 |       10 |
| Mobile 390 B     |           50 |           58,311 |         83 |       10 |

A adds 8 observed render calls and 3,742 desktop / 2,566 mobile render triangles in this view, versus its 4 logical body draws and 1,871 / 1,283 body triangles. Capture passes account for repeated rendering. Off/A/B summaries and baseline cameras are preserved in `composition-summary.json` and `composition-baseline.json`. B has 110 desktop / 75 mobile instances and stays comparison-only.

## Follow-up

Environment Polish can address local tree joins, cliff bands and ruin-stone appearance. Water remains fixed. No creature movement, physics engine or decorating UI is introduced here.
