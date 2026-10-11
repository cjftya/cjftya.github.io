# Jelly Oasis — Water Dynamics v1 / waterfall v8 candidate

Date: 2026-10-11. Baseline master: `898222c190d943a24452131dfb75eac80347b959`.

This is an opt-in candidate at `?debug&waterfall=v8&view=waterfall`. The ordinary
page and v7 comparison remain available. Visual approval is still the user's.
No Blender, new rocks, crystals, lights, or module remodeling were introduced.

## Implementation

The v7 inlet's final centre was 0.035 above the pond. The channel used a separate,
transparent rock-flow material on top of the pond, with no shared hydrodynamic
state. v8 subtracts the channel footprint from the original pond triangles and
inserts the channel into that same surface. Collinear boundary vertices are
shared before subdivision to avoid T junction cracks under vertex displacement.
There is one water material and no overlapping channel overlay. The last 28% of
the channel is level at the pond Y; its width increases from 1.8 to 2.8 local units.
The existing excavation algorithm and protection zones remain in place; only
its candidate channel samples change. Rebuilds always use the original pond
GUIDE bounds, rather than bounds enlarged by the newly joined surface.

Seven attached cliff lanes reuse the original ray-traced rock paths. Their
1D energy/friction model accumulates travel time from actual distance and slope.
Q = width * model depth * velocity is conserved per lane. One world unit is
interpreted as one metre; local gravity is 9.81 / root.scale.x. There is a bounded
8 m/s speed budget. Q per lane is 0.032 local volume units/s, total Q 0.224.
The inlet direction follows the last segment, rather than a constant +Z vector.
Film opacity reads the model depth; whiteness and base opacity are reduced.
These are a quasi-physical path model and optical art settings, not a volumetric
fluid solution. The geometrical water thickness is not a solved 3D volume.

The inlet and pond use a CPU staggered-grid **linear depth-averaged shallow-water
approximation**: H perturbation, face velocities u/v, depth-dependent conservative
flux, inlet volume and momentum, reflective dry faces, drag and upwind foam.
Pulsed inlet forcing and a small asymmetric momentum term seed local mixing.
An equal distributed return drain removes inflow, and bounded height energy is
projected back to zero mean. `massError` measures residual mean-volume error;
this balanced-drain model is not an outlet river or a full conservative nonlinear
solver. It does not model hydraulic jumps or fully developed turbulent vortices.

128x128 desktop, 64x64 coarse-pointer mobile. CPU was selected deliberately after
considering GPU ping-pong: the bounded grid and two existing scene captures make
an extra float-render-target pipeline unnecessary for this candidate. The RGBA8
DataTexture is renderable/samplable without float-render-target extensions and is
the fallback backend itself, not a claimed GPU solver. RGBA stores H/u/v/foam;
height quantization is about 2.36 mm before display scaling. Geometry, optical
normals and foam all sample that same texture and clock. Display wave response
is **2x the solved H**, an explicit visual tuning multiplier, not extra physical
energy. Far background wave amplitude is 0.005.

The sloping upstream channel blends from lit translucent water to the shared
planar captures as its height approaches pond Y. Planar reflection is not applied
unchanged to the whole slope. Channel sheen is advected using cumulative travel
time; foam is transported in the solved velocity field, with a finite lifetime.

## Stability and lifecycle

Fixed dt is chosen from grid spacing, gravity/depth and the velocity budget.
Maximum 24 substeps per update; dt is capped at 0.1 s and dropped time is recorded.
The texture has no required float capability, additional capture, or simulation
render target. Reduced motion pauses updates. Nonfinite dt is rejected. Returning
to a tab cannot inject a huge simulation step. Rebuild disposes the old texture;
normal resource disposal and WebGL context restoration are exercised by QA.

Debug API: `window.__oasisLandmark.reviewWaterFlow(0|1|2)` controls inlet flow.
`reviewWaterStep(seconds)` steps the same state, `reviewRebuild()` resets it.
Debug snapshots include flow samples, Q, travel time, seam metadata, H/velocity,
CFL, volume balance, dropped time and simulation CPU update time. Separate knobs
for every optical preset are not exposed in this first candidate.

## Verification status

| Requirement | Status | Evidence / limit |
|---|---|---|
| Baseline geometry and v7 captures | PASS | Baseline build and basin QA, including water-off terrain, 38 states |
| One shared inlet surface | PASS technical | Coverage/overlap tests, welded edge nodes, 0 base seam height difference |
| Thin rock optical material | PASS candidate | Day/night/rain and near/front/side captures; user visual approval pending |
| Slope/time based transport | PASS technical | Acceleration and widening tests; recorded live front/inlet animation |
| Inlet H and momentum source | PASS technical | Q/direction/width/speed source shared with channel |
| Vortices and artistic realism | WARN | Linear approximation and asymmetric forcing; not a nonlinear turbulence solver |
| 60 s zero/standard/high flow | PASS | `stability.json`; browser rate runs also validate actual source/mask |
| Rebuild three times | PASS technical | Geometry/texture counts and original-guide channel path invariant |
| Context loss/restore | PASS technical | Browser QA restores WebGL and rerenders the simulation texture |
| Mobile functionality | PASS emulation | Coarse pointer + 390x844; 64 grid and 256 capture targets |
| Physical PC/Android fps/heat | PENDING | Software headless rendering is not a physical GPU benchmark |
| GPU ping-pong implementation | Not selected | CPU/RGBA8 backend; no claim of GPU simulation |
| All 16 models / default page | PASS regression | Existing tests, basin QA and legacy water QA |
| Individual optical debug knobs | WARN | Flow knob and measured state provided; preset optics are code constants |
| Phase 2 decoration | PASS scope | Only `phase2-placement.json` data regenerated |
| Visual final approval | PENDING | Candidate only; no ordinary-page promotion |

All build/lint/test logs and final rendering metrics are summarized in
`artifacts/jelly-oasis/water-dynamics-v1/verification.json`. Render artifacts are
in `baseline/` and `candidate/`; camera/time/viewport are fixed by
`scripts/water-dynamics-v1-qa.mjs`. The QA recorder captures setup and real 8.5-second running sections. Only curated
front/inlet comparison clips (approximately 8 seconds each) are committed, rather
than duplicate full session recordings.
Headless frame throttling and dt clamping can slow simulated time relative to
wall time; these recordings are evidence of running frames, not physical-device
fps or proof of real-time target performance.

New GPU texture payload is 65,536 bytes desktop / 16,384 bytes mobile, plus CPU
state arrays (about 0.50 / 0.13 MiB). Existing reflection/refraction target sizes
remain 768 / 256. Joined surface tessellation increases water vertices; final
frame calls, rendered triangles, resource counts and CPU cost are recorded, not
silently described as cost-free. GPU timing is PENDING.

## Reproduction

```
npm ci
npm run build
npm run lint
npm test -- --maxWorkers=2
# Install Chromium and Playwright's video encoder, or set LANDMARK_QA_BROWSER.
node scripts/water-dynamics-v1-qa.mjs v7 desktop
node scripts/water-dynamics-v1-qa.mjs v8 desktop
node scripts/water-dynamics-v1-qa.mjs v8 mobile
node scripts/basin-watercourse-qa.mjs
node scripts/water-realism-v1-qa.mjs
```

The candidate is authorized for master, but only after technical QA succeeds.
Push and Pages deployment are separate checks; deployment verification is saved
with its actual commit/workflow/HTTP result. A URL alone is not a verified deploy.

## Final local measurements

Desktop front: 40 calls / 130,211 rendered triangles / 73 geometries / 7 textures,
versus v7 48 / 70,443 / 74 / 6 in the comparison snapshot. These are render-info
snapshots, not an isolated draw-call benchmark. Mobile coarse-pointer candidate:
19 / 65,003 / 49 / 7. No additional simulation capture pass.

At 60 s with actual pond mask and standard Q: desktop maximum H 0.02962, maximum
face speed 0.13790, mass error 5.85e-10; mobile 0.03384 / 0.20733 / -1.79e-9.
Rendered response doubles H. Means stay near zero. Desktop fixed dt 0.006963,
CFL upper estimate 0.3430; mobile dt 0.008333, CFL 0.2053.

Mean CPU time for **manual 0.1-second advances** in the software browser was
12.34 ms desktop / 2.77 ms mobile emulation. This is not a per-frame GPU time,
Android hardware measurement, or a 60/30 fps guarantee. Use the animation
snapshots for whole-frame software-browser timing.

## Publication note

Source, test logs, stability measurements and placement data were published without screenshot/video binaries or verbose browser snapshot JSON. Full verification artifacts remain in the original local working copy; image blob upload was intentionally skipped.
