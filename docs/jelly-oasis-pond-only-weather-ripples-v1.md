# Jelly Oasis — Pond-only weather ripples v1

2026-10-12 · Implementation and validation report

## Result

The ordinary `/projects/jelly-oasis/` page now owns a standalone pond heightfield with the existing reflection/refraction optics. CLEAR and other dry presets create occasional seeded impacts at irregular interior positions. Blended `environment.profile.rainIntensity` drives rain impacts; RAIN at 0.85 requests 8 impacts/s on desktop and 4/s on mobile. Ambient frequency smoothly falls to zero as rain increases. Waves already present continue to decay when rain stops.

The page no longer constructs cliff film, falling ribbons, spray, foam, channel water, channel excavation or automatic inlet pulses. Legacy `waterfall=v1..v8`, `flow=fall-v1` and `surface=gpgpu-proto` queries cannot re-enable them. Historical implementations and evidence remain available for their existing tests; they are disconnected from the page's runtime options.

Baseline: `c8ddb8a3861090a0d6cc48d457478e94150955ca` on `master`. No pre-existing working tree edits, AGENTS.md or Blender processes were used. No GLB, Blender, layout, texture or landmark transform asset was changed. The 16 modules still contain **20,894 asset triangles**.

## Ownership and behavior

`main.ts → createOvergrownRuin → createWaterEffects → createPondWater → GPGPUPondSurface / CPUPondSurface + createReflectivePond`

- Excavation receives `channel=[]`; original pond guide, height calculation and ground sampler are reused. Shore/bank overlay primitives follow the existing excavated-pond treatment; stone owners retain rigid grounding.
- The pond uses its original irregular indexed footprint, independently tessellated to the existing 0.45 desktop / 0.7 mobile spacing. No combined channel surface, new water rectangle or visual ring particles are added.
- The original damped finite-difference height equation, shoreline/depth fade, GPU normal sampling and reflection/refraction optics remain. GPU is 128² desktop / 64² mobile, with two half-float targets, fixed 1/60 s steps and at most three compute passes per update.
- Scheduler candidates are precomputed solver-cell centers with depth/shore mask ≥0.7. Seed 19271 is isolated from sky, rain VFX and automatic weather. Ambient delay is 1.8–3.5 s, strength 0.035–0.08, radius 0.6–1.1 local meters. Rain strength is 0.008–0.025, radius 0.25–0.55.
- Rain credit is bounded to two emissions/update and the solver queue to four. Rejected events are counted. Rain does not add compute passes. Diagnostics expose source, accepted ambient/rain counts, rejected count, average rate and last point; ordinary rendering performs no readback.
- The CPU fallback runs the same height equation at 32², bounded to three steps/update and the mobile event rate. It uses the same optical material and pond mask, with no channel data.
- Reduced motion and hidden/root-hidden/paused conditions stop automatic excitation and simulation. Suspension clears pending impulses and fractional compute time without resetting existing heights. Large stale dt cannot trigger catch-up. Restore/rebuild recreates targets, geometry, captures, material uniforms and scheduler. Dispose releases all owned resources.

## Validation

`npm run lint`, `npm test -- --maxWorkers=2` and `npm run build` passed. **58 test files / 312 tests** passed, including three new tests covering seeded rate scaling, dry-cell rejection/CPU propagation, queue/pause handling, and real-GLB pond-only loading/rebuilds. Original landmark, route, terrain and historical-water tests were retained. Test-generated changes to historical JSON evidence were restored rather than published.

Production build was tested with Playwright Chromium and software WebGL2/SwiftShader. These are browser/emulation results, not physical-device performance claims.

| Check | Result |
|---|---|
| Ordinary URL, no debug globals | Loaded with no browser errors; production screenshot |
| Legacy v8 / fall-v1 query | Pond only, rock flow 0, droplets 0, channel path empty |
| CLEAR / RAIN / MIST / OVERCAST / PARTLY_CLOUDY | Rain events only during positive rain intensity; existing weather VFX retained |
| CLEAR noon / night 23 | Pond, ground and reflected scene remain visible |
| Rain at 0.85, deterministic 2 s step | Desktop 15 impacts; mobile / CPU 7 impacts (fractional credit retained) |
| Wave propagation | Height readback's absolute-height weighted radius grew 0.263 → 2.051 m in 0.8 s after one manual impact |
| Shore contact | Measured guide contact gaps below 10⁻⁶ local meters; mask rejects dry/shore positions |
| 390×844 / 360×780 / 844×390 touch emulation | 64² GPU, reduced rate, visible pond, no browser errors |
| Explicit CPU mode | 32² pond and optics render, no browser errors |
| Forced missing EXT_color_buffer_float | Automatic CPU fallback, no cliff/channel resurrection or browser errors |
| Reduced motion | Scheduler statistics remained unchanged while stopped |
| Hidden → visible simulation | No updates while hidden, no impact burst after return |
| Three placement rebuilds | Textures 10 / geometries 60 remained stable on all three captures |
| WebGL loss → restore | Pond recreated as GPU heightfield without errors |
| Reset | Camera reset captured; pond stays enabled |

The 0/1/2/4 s screenshots and quantitative readback are complementary: a still screenshot alone is not used to declare propagation. Shader compilation and framebuffer initialization were exercised successfully. Actual shader-failure injection, prolonged memory soak, physical Android FPS, hardware GPU timings, and user art approval remain **not measured / user review**, not PASS. Korean text can appear as missing-glyph boxes in this container's font environment; UI text assets were not changed.

## Same-camera comparison

Both builds used an 800×600 desktop viewport, the same pond-low camera, optics, noon and reduced motion. Counters were sampled after a planar capture. They include the capture work represented by that rendered frame, not a full-game FPS benchmark.

| Counter | Previous coupled v8 GPU candidate | Standalone pond |
|---|---:|---:|
| Draw calls | 81 | 73 |
| Rendered triangles | 193,788 | 105,644 |
| Geometries | 62 | 55 |
| Textures | 11 | 10 |
| Pond surface triangles | 52,076 | 26,592 |
| Asset triangles | 20,894 | 20,894 |
| Capture size / passes | 768² / 2 | 768² / 2 |
| GPU simulation target bytes | 262,144 | 262,144 |

CPU submission time for this single software-rendered frame was 2.8 → 2.1 ms; this excludes reliable GPU elapsed timing and must not be interpreted as device FPS. Capture cadence stays bounded to 20 Hz desktop / 10 Hz mobile when moving; unchanged camera/time/environment reuse the prior capture.

## Evidence and inspection

- `artifacts/jelly-oasis/pond-only-v1/browser-qa.json`: final production-build browser checks, mobile snapshots, rebuild counts and errors.
- `artifacts/jelly-oasis/pond-only-v1/comparison-and-lifecycle.json`: same-camera baseline, numeric propagation, simulated visibility lifecycle and forced unsupported-extension fallback.
- `artifacts/jelly-oasis/pond-only-v1/wave-sequence.json`: impact sequence samples accompanying the 0/1/2/4 s captures.
- PNGs in that directory: clear sequence, rain, mist, night, legacy queries, CPU, mobile/landscape, ordinary production and Reset.
- `scripts/pond-only-browser-qa.mjs`: production preview/browser QA; optional `POND_QA_BROWSER` selects an installed Chromium executable. `POND_QA_URL` selects the inspected origin.

Useful URLs after Pages deployment:

- `/projects/jelly-oasis/`: normal default pond.
- `?debug&view=pond-low` / `?debug&view=pond-top`: inspection cameras.
- `?debug&panel=pond`: solver controls.
- `?debug&surface=cpu&view=pond-top`: explicit safe fallback.
- `?debug&material=neutral&view=pond-low`: diagnostic lighting, never the ordinary default.

Master publication is permitted by the user's request; the final chat reports the actual commit and Pages deployment result separately after verification.
