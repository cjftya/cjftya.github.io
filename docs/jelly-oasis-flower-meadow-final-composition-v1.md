# Jelly Oasis — Flower Meadow & Final Composition v1

**TECH_PASS / ART_USER_REVIEW**. Production adopts density **A**. Final art approval and real Galaxy Fold FPS, 30 minute heat/memory and touch testing remain **NOT_TESTED**.

Phase 1: `f11aeaa` (merged as `c662ae9`). Phase 2 / this phase's base master: `55587e889a2a6a53aef6ec905b38fa72e0da477c`. The final stage remains **224 × 224m**, bounds ±112m; oasis anchor (14,14), yaw π/6, scale1. The enclosing commit of this document is the Phase 3 completion revision.

## Composition and decision

Three small separated flower meadows occupy the south/west foreground, with three sparse grass/shrub transition patches at west grove, northwest grove and north rock edges. The original tree/pond/ruin hierarchy, 6m loop, 16m clearing, 6m arch approach and 4m passage remain protected. No plants enter the shore protection band or finite stage margin. Broad gaps between the flowers are intentional; central entry, middle distance and dry outer slope stay open.

The first candidate placed flowers too far into the foreground and used narrow pointed heads. The adopted layout brings the patches closer to the oasis without changing the camera. Five folded diamond petals now join the original flower centre; original stems, leaves and flower height remain. Muted lilac and warm cream palettes use per-patch primary/secondary species. Existing source grass and shrub geometry is reused. Existing vegetation, composition and scenery instances are unchanged; no textures, shader animation, GLB binaries, water, weather, terrain or camera behavior changed. Additional pebbles were omitted because Phase 2 already provides sparse low stones.

| Patch           | World candidate centre | Radius | Accepted A | Composition                     |
| --------------- | ---------------------- | -----: | ---------: | ------------------------------- |
| Southwest lilac | (-28,44.80)            |   3.3m |         32 | 25 lilac,2 cream,5 grass        |
| South cream     | (44.80,54.88)          |   3.2m |         30 | 6 lilac,18 cream,6 grass        |
| Southeast lilac | (60.48,35.84)          |     3m |         25 | 19 lilac,1 cream,5 grass        |
| West edge       | (-51.52,33.60)         |     3m |          9 | 2 lilac,5 grass,2 shrub         |
| North rocks     | (58.24,-67.20)         |     3m |          6 | 5 grass,1 shrub                 |
| Northwest edge  | (-44.80,-4.48)         |     3m |          7 | 1 lilac,1 cream,4 grass,1 shrub |

Centres are fractions of the actual stage width, transformed into landmark-local coordinates. They remain at their world sites when the landmark moves. Patch ellipses use a0.7 aspect ratio; the table lists candidate regions rather than forced positions. The early southwest site rejected slopes; the adopted site uses safer ground. Tight patch capacity rejects some requested companions; quotas and colour ratios are not forced by extra retries. A has 109 instances and still leaves open space. B is a debug-only denser comparison, not the production default. Whole-stage overview flowers remain subtle, especially on portrait mobile; medium/ground and close captures show their form. This is a known scale limitation, not a claim of dramatically filled terrain.

## Placement and resource ownership

The independent `0x03671012` master seed hashes patch/species names. Attempts are capped at24×requested; failures record patch-specific reasons. The existing `exclusionReason()` implements pond, loop, clearing, approach, passage, GLB near-ground footprints and radius-aware stage bounds. Both approved decoration populations and all Phase 2 canopy/rock radii reserve occupied space; new meadow instances also reserve radius+0.12m separation. No third copy of route masks was created.

Eight-direction slope samples use the excavated triangle-ground sampler; centre heights embed0.015m. Source geometry projected radii are independently checked against placement reservations. World size, placement height, positions and slopes stay finite. Flowers stay about0.45–0.64m tall, grass about0.39–0.54m, shrubs about0.52–0.61m. The mobile owner displays a deterministic two-of-three subset of each source while retaining the full master placement for occupancy checks.

Four InstancedMeshes share one source per kind. New instances receive existing shadows but do not cast them. Off allocates no geometry/material/texture. Placement recomputes only during landmark placement/rebuild; no frame-time random generation. The owner participates in isolate, material refresh, page teardown and context rebuild; disposal is idempotent and removes its root group before the landmark is disposed.

## Measured cost

| Overview viewport | Off calls / triangles | A calls / triangles | B calls / triangles |
| ----------------- | --------------------: | ------------------: | ------------------: |
| 1440x900          |           69 / 81,875 |         77 / 90,915 |         77 / 91,783 |
| 390x844           |          127 / 87,032 |        131 / 90,124 |        131 / 90,396 |
| 360x780           |           76 / 60,007 |         84 / 66,191 |        131 / 90,396 |
| 844x390           |           69 / 59,656 |         77 / 65,840 |         77 / 66,384 |

These total renderer samples include pond reflection/refraction and intermittent existing shadow updates. They are not isolated body costs or real-device FPS; the360px B frame sampled a shadow refresh unlike A/Off. Logical A adds4 body draws,4,520 desktop/3,092 mobile instanced triangles,4 geometries,4 materials and0 textures. A displays109 desktop/74 mobile instances; B123/83. GPU geometries in overview increase89→93; textures stay10. Three rebuilds at a fixed state retain95 geometries,8 textures and109 meadow instances. View-dependent allocation differences are not memory leaks. No RAM-byte or real-device GPU memory measurements are claimed.

A is selected because denser B mostly consumes limited patch capacity and sparse edge sites rather than improving the three foreground groups. A's actual primary colour shares are93%/75%/95%, prioritising readable lilac/cream grouping; the design ratios were suggestions, not forced acceptance criteria. Additional uniform noise is avoided.

## Validation and evidence

- `npm ci`, lint, production build: PASS. Full suite: **64 files /325 tests PASS**.
- Real GLB/terrain integration: deterministic A/B and mobile subsets, independent source footprint bounds, transformed placement→original restoration, sample-ground contact, masks and all pair spacing, unchanged approved owners, isolate/material refresh and double disposal: PASS.
- `browser-qa.json`: production-build Off/A/B at1440×900,390×844,360×780,844×390; same overview/medium/ground/pond camera, close flower shapes, noon/sunset/night,CLEAR/RAIN/MIST,shadows-off, production URL and rebuild×3/context restoration. Retained evidence includes selected JPEGs; full reproduction generates all61 debug captures plus4 production captures.
- `lifecycle-qa.json`: existing lifecycle script re-run on the final build, pending-load context restoration/disposal, unsupported float-extension CPU fallback, persisted pagehide/pageshow and final teardown: PASS.
- `placement-audit.json`: exact adopted placements, rejection reasons, source populations and resource/body-draw counts.

- `controls-qa.json`: orientation/Orbit/Zoom/sky/Reset and final teardown: PASS. A renderer-contention attempt timed out while waiting for damped Orbit stability; the meadow control runner allows90s for headless settling. No camera code was changed.
- `failure-qa.json`: forced GLB404 displays the existing Korean alert, expected load errors only and safe teardown: PASS.
- `pond/browser-qa.json`: numerical ripple propagation, RAIN impulses, MIST/other presets/night, GPGPU/forced CPU, rebuild/context restoration, reduced motion,390/360px portrait,landscape and production smoke: PASS. An initial concurrent run exceeded the30s weather transition wait; the completed re-run passed unchanged assertions. Meadow weather captures record transition states; full weather convergence is covered by the pond regression.
- All16 GLB hashes match the Phase2 manifest byte-for-byte. Original phase evidence is retained unchanged.

Automated checks do not approve art or establish real-device FPS. Screenshot environment can lack Korean font glyphs; no app font changes were made. Headless shader/console errors are tracked separately. Final density/colour/layout stays **ART_USER_REVIEW**; no creature v2 systems or roadmap were reintroduced.

Reproduce:

```sh
npm ci
npm run lint
npm test -- --maxWorkers=2
npm run build
OASIS_QA_BROWSER=/tmp/chromium node scripts/flower-meadow-browser-qa.mjs
OASIS_QA_BROWSER=/tmp/chromium node scripts/flower-meadow-controls-qa.mjs
OASIS_QA_BROWSER=/tmp/chromium node scripts/flower-meadow-failure-qa.mjs
POND_QA_OUTPUT=artifacts/jelly-oasis/flower-meadow-final-composition-v1/pond node scripts/pond-only-browser-qa.mjs
OASIS_QA_BROWSER=/tmp/chromium OASIS_QA_OUTPUT=artifacts/jelly-oasis/flower-meadow-final-composition-v1 node scripts/scenery-lifecycle-qa.mjs
```
