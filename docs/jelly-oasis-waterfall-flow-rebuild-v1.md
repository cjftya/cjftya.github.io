# Waterfall Flow Rebuild v1 — debug candidate

Implemented against master `305b29d70b53cc439dc825e432be3feac97cf1ec` on 2026-10-12 KST.
Technical geometry: **PASS**. Art approval: **USER_REVIEW**. This is an opt-in candidate, not the default waterfall.

## Entry points

- A: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&surface=gpgpu-proto&material=optics&view=waterfall
- B: https://cjftya.github.io/projects/jelly-oasis/?debug&waterfall=v8&surface=gpgpu-proto&flow=fall-v1&material=optics&view=waterfall
- Measured path overlay: add `&paths=1` to B. Overlays are for inspection, not part of the water appearance.

The flag requires `debug` and `waterfall=v8`. It also works with the existing CPU v8 surface. Normal pages and A retain their prior behavior. The approved GPGPU geometry, shoreline mask, welded channel seam, shader optics, wave equation, grid sizes, damping and wave speed are unchanged. Its only behavioral extension is `automaticInlet`, defaulting to true; successful B paths set it false and supply impulses through the existing public interface.

## Measured geometry and release

The full seven-lane face remains the survey input. A fixed central three-lane source, approximately 0.65 local metres wide, supplies the candidate film from the top. The wider source's outer water reaches dry ground or collides with rock; it is not redirected into the channel. No GLB, terrain excavation, pond shape or channel alignment was changed.

Shelf candidates require an upward-facing shelf in adjacent samples, outward incoming tangent, a steeper following section, positive full-width clearance and a measured first collision in the original channel. Launch velocity uses the last three measured centre samples and `solveFlow` speed; the landing position never determines velocity. All three lanes share the sheet's centre momentum, with their individually measured launch positions. The final conservative profile check chooses sample **29**, just after the upper shelf. Earlier sample 26 passed a simple X-width probe but fails the final film-oriented edge check; it is not the shipped release.

At the default uniform root scale 1, coordinates below are root-local:

| Quantity                                                                 | Measured value                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Centre launch                                                            | (-0.105899, 12.575044, -12.663883)                                                   |
| Initial velocity                                                         | (-0.285652, -5.809850, 3.575871) local m/s                                           |
| Gravity                                                                  | 9.81 local m/s², calculated as 9.81 / root.scale.x                                   |
| Centre first impact                                                      | (-0.417038, 0.427453, -8.768952)                                                     |
| Flight duration                                                          | 1.089226 s                                                                           |
| Left / right impact                                                      | (-0.622543, 0.424644, -8.753309) / (-0.211965, 0.431700, -8.787218)                  |
| Minimum sampled clearance after the first 0.025 s, left / centre / right | 0.146389 / 0.134608 / 0.115339 local m                                               |
| First surface                                                            | Existing channel, upstream of the lake                                               |
| Initial inlet travel delay                                               | Approximately 4.55 s, including attached travel, flight and remaining channel travel |

Positions follow `p0 + v0*t + (0,-g*t²/2,0)`. Initial tracing uses 0.005-second swept segments and left/centre/right film profile checks. Rock intersections are two-sided during tracing, and shared material sides are restored afterward. Ground height comes from the same excavated terrain sampler used by the scene. The collision-only channel strip copies existing cross sections without creating a visible mesh or changing the welded surface. This avoids repeatedly raycasting the tessellated lake. Tracing happens only at construction/replacement, not during animation.

If placement cannot produce a valid route, `flowError` reports `GEOMETRY_BLOCKER` and the candidate preserves the old attached flow. No target-seeking trajectory or automatic terrain editing is used.

## Rendering and inflow

- Three thin, two-sided ribbons match the attached film's final position, width and crown. Width contracts with increasing ballistic speed. Transport time includes upstream travel, so moving shader features accelerate during descent.
- Candidate shader animation changes water appearance and normals, not its checked collision geometry. No thick closed cylinders or displaced vertices are introduced.
- Local impact spray uses 24 small instances on desktop and 12 on mobile, short lifetimes and the measured gravity. No second fall is needed for this valid channel landing.
- The existing continuous channel and welded pond seam remain the downstream surface. The lake receives rate-limited, mask-checked impulses at its existing inlet, weighted by three-lane discharge and user flow rate. The independent automatic inlet is disabled only after successful candidate construction.
- OFF hides the candidate waterfall and stops new inlet events; NORMAL resumes after travel delay; HIGH increases impulse strength. GPU pause gates new events. Debug reset/impulse controls remain available.
- GPU initialization/shader failure retains the CPU v8 solver. No replacement lake solver was added.

## Verification

`npm run build`, `npm run lint`, and the following focused suite passed (12 tests):

```sh
npx vitest run tests/jelly-oasis-waterfall-flow-rebuild.test.ts tests/jelly-oasis-gpgpu-pond.test.ts tests/jelly-oasis-water-dynamics.test.ts tests/jelly-oasis-real-water.test.ts
```

Tests cover ballistic calculation and immutable launch data, tangent-derived speed on the real GLB, full-width clearances and first impacts, exact attached/falling mesh boundaries, unchanged excavation/channel across three replacements, resource disposal, CPU fallback, OFF/HIGH visibility, reduced-motion pause, explicit geometry blockers/material restoration, and existing pond-domain/stability regressions.

Chromium/SwiftShader browser checks covered:

- A/B at the same front, side and low cameras with at least 5.5 seconds of animation per view.
- Day and 23:00 night inspection; optional measured trajectory overlay.
- Successful GPU heightfield initialization; automatic inlet true for A and false for B.
- OFF event counter unchanged; NORMAL/HIGH event delivery; debug reset and impulse controls.
- Three replacements and one WebGL context loss/restoration, retaining the candidate and GPU solver.
- 390×844 touch/mobile configuration, 64×64 GPU grid, 12 spray instances, and reduced-motion pause.
- No JavaScript page errors in the completed checks. Context restoration emitted WebGL stale-context resource-delete warnings in the existing renderer cleanup path; the surface restored and rendered successfully. These warnings remain recorded rather than being treated as a clean console result.

Water-system geometry is **8,344 triangles for A versus 3,480 for desktop B**, excluding optional debug lines and the unchanged pond. Candidate mobile uses **2,280 triangles**. Both variants have seven water render objects (A: seven attached lanes; B: three attached lanes, three falling ribbons, one instanced spray mesh). GPU resolution, targets and pond mesh density are unchanged. Initial frame renderer counters were collected at different warm-up stages and are not claimed as a valid total-scene performance comparison.

## Remaining review

- The narrow film reads as three fine streams. Evaluate whether this suits Jelly Oasis; this is not a claim of final art approval.
- Impact spray is deliberately restrained, particularly at distant or night views.
- Actual mobile hardware FPS/memory remains **PENDING**. Software rendering and mobile emulation verify behavior, not mobile GPU performance.
- Raycast clearance is a bounded sampled check, not a full fluid simulation or analytic proof of every triangle's continuous clearance.
- Screenshots were reviewed locally and are not checked into Git. Deployment status is reported separately after the master push.
