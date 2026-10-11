# Real Water Rebuild v1 — Waterfall v6 / Pond v4 candidate

Base: remote master `6c12aa11b4ad57c5b921d6a111200d34042acaeb`, tree verified against the local checkout. Development branch: `feat/jelly-oasis-real-water-v6`. The user explicitly authorized master integration and a test link. **Technical checks PASS; overall visual status WARN. This is a testable candidate, not a claim that the complete realism target has been met.** Ordinary-page defaults remain unchanged.

## Original requirements and actual status

| Requirement | Implementation and evidence | Status |
|---|---|---|
| Water follows rock | Seven independently sampled surface lanes, face normals and varying widths; release requires a measured nearby ledge. Front, crest and side views show a much longer rock section. Close up, the thin lanes still look too much like glossy ribbons. | WARN |
| Volumetric waterfall | Five overlapping closed core lobes and non-coplanar aerated strands; transported vertex deformation and density noise use travel time. Compared with v5 the fall has volume and independent breakup. Close views still contain overly continuous smooth streaks. | WARN |
| Rock → fall → pond continuity | One root-local flow path supplies the release, ballistic velocity, exact pond-raycast landing and reflection impact uniform. Geometry tests and front/side evidence support spatial continuity. This is a visual approximation, not a calibrated conserved fluid flux. | Structural PASS; visual candidate |
| Impact interaction | Ballistic spray speed derives from landing speed. White churn, swirl and advected foam are shaded on the actual pond mesh; there are no foam discs or decorative ring meshes. Impact captures and the sequence show changing foam and spray. | Candidate improvement; final realism review pending |
| Dynamic lake | Jittered sources, directional packet envelopes, ambient waves, local turbulence and shared depth attenuation replace the v5 periodic radial sine in v6. A single height field controls geometry and optical normals. Water-only mode disables collision waves and foam while retaining ambient waves. | Technical PASS; irregular motion visible |
| Actual scene optics | Existing reflection/refraction capture pair, Fresnel and depth absorption retained. Waves distort reflected rock/arch/tree; foam uses scene lighting rather than emission. Noon/night/low/high pond views supplied. | Candidate visual PASS |
| Coherent scene/mobile | All 16 modules, GLBs, layout, pond boundary, height, weather and camera controls preserved. 390×844 browser checks pass; actual phone GPU time, heat and sustained FPS have not been measured. | Browser PASS; device performance pending |

## Implementation

`createWaterEffects` dispatches v6 to `createRealWaterEffects` while preserving v1–v5. `flowPath` traces the current grounded cliff and validates the outlet against shared pond triangles. `createRockFlow`, `createFallingWater` and `createImpactZone` have distinct geometry and lifetime responsibilities. `flowMaterial` transports shape/aeration with distance or flight time rather than moving one global texture. v6 omits physical transmission, the flat main curtain, the coplanar aeration veil, foam circles and impact rings.

`pondWaves` supplies the same procedural field to vertex displacement, optical slope and reflection distortion. Packets vary source, direction, wavelength, lifetime and angular envelope. Impact velocity supplies the dominant surface-flow direction and normalized strength. Foam has radial advection and local rotation; its color uses incident scene lighting, so it is not a night-time emissive decal. `subdividePond` subdivides existing triangles without changing their footprint. Mobile uses fewer subdivisions, strands and spray instances; capture sizes stay 256² mobile and 768² desktop with two passes.

Rebuild retires geometry/material/instancing resources before recreating the flow, preserves the reflection targets, and recalculates depth. Dispose removes the v6 group and releases targets. Failed initialization retires resources before propagating its diagnostic. Debug-only `reviewWaterStep` enables fixed simulation-time temporal QA with reduced motion enabled. `view=waterfall` opens a repeatable noon front camera without changing the ordinary page.

## Matched evidence

All evidence is in `artifacts/jelly-oasis/real-water-rebuild-v1/`. WebP files are compressed copies of the captured PNGs; PNG frames are reproducible using the QA script.

| View | v5 | v6 |
|---|---|---|
| Front / attached rock | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-front.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-front.webp) |
| Side / fall thickness | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-side.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-side.webp) |
| Crest close-up | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-crest.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-crest.webp) |
| Impact / foam | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-impact.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-impact.webp) |
| Lake low camera | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-pond-low.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-pond-low.webp) |
| Night | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-desktop-night.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-desktop-night.webp) |
| Mobile front | [Before](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-mobile-front.webp) | [Candidate](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-mobile-front.webp) |

[Before impact sequence](../artifacts/jelly-oasis/real-water-rebuild-v1/v5-impact-sequence.mp4) / [Candidate impact sequence](../artifacts/jelly-oasis/real-water-rebuild-v1/v6-impact-sequence.mp4): 20 samples at 0.5 simulation-second intervals. MP4 duplicates these samples to 20 output FPS; it is **not** evidence of real-time 20 FPS performance. `qa.json` records the simulation times. The additional strict right-profile camera is obstructed by the arch/cliff and cannot establish a clean side-quality pass. The unobstructed oblique side view is provided; strict profile remains a review limitation.

## Verification and limits

- `npm run build`: PASS, TypeScript and production bundle.
- `npm run lint`: PASS.
- `npm test -- --maxWorkers=2`: PASS, 53 files / 295 tests. The added test checks the loaded refined cliff, seven lanes, exact basin landing and water level, rebuild disposal, and reduced-motion pause.
- `LANDMARK_QA_BROWSER=/tmp/chromium node scripts/water-realism-v1-qa.mjs`: production-preview browser checks; matched desktop/mobile noon/night/rain/mist, two sequences, reduced motion, WebGL loss/restore, waterfall-off and unchanged ordinary default. `WATER_QA_VERSION=6` refreshes v6 while retaining captured v5 evidence. Console/page errors must be empty for technical PASS.
- Browser: headless Chromium with SwiftShader. `qa.json` reports CPU submission/render measurements and resource counters; these are not hardware GPU frame time or real-device thermal/FPS results. No extra reflection pass or SSR was introduced.

The runtime schema exposes version, pond version, all seven world-space rock paths, release/velocity, actual landing, clearance, flight duration, region names, wave model, reflection capture count/size/direction and triangle count. Detailed measured values are in the companion JSON, rather than guessed from the asset bounds.

**Remaining visual work:** break the overly smooth continuous fall streaks more convincingly, vary the thin attached lanes so they stop reading as glossy ribbons in close-up, and verify a clean unobstructed strict side view plus sustained real-phone performance. This candidate is merged for the user's direct testing; there is no automatic default switch or final realism completion claim.

## Test URLs

- v6: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v6&view=waterfall
- v5 comparison: https://cjftya.github.io/projects/jelly-oasis/?debug&water=v2&waterfall=v5&view=waterfall
- Pond v4 without a waterfall: https://cjftya.github.io/projects/jelly-oasis/?debug&water=v4&view=waterfall

Build/commit, Pages deployment success and observation of the production URL are separate checks. Deployment status is reported after integration, rather than inferred from a local build.

Measured final candidate: 34 rock-path samples per lane, 10.220 root-unit rock path, 1.199 s flight, minimum tested rock clearance 0.451 root units, impact XZ `(0.054301, -1.349264)`. Desktop effect geometry: 30,840 triangles; pond: 7,497 vertices. Final browser run: 27 recorded view states, zero console/page errors, v6 sequence from elapsed 6.0 to 15.5 seconds. Reflection impact strength 1.0902 and flow direction `(0.01432, 0.99990)` are derived from the landing velocity. These values establish connectivity/cost, not visual realism.
