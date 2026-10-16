# Jelly Oasis v2 — natural vegetation animation

Keeps the v1 layout, source models, painted vertex colors, faceted lighting,
terrain and water simulation. Adds one shared, slowly changing world-space wind
with weather-dependent strength and traveling gusts. No new runtime dependencies.

## Implementation

- `animation/vegetationWind.ts`: per-scene uniforms, existing standard-material
  vertex shader extension and the identical directional-light depth deformation.
- Static per-vertex metadata (16 bytes per vertex on participating geometries)
  carries the anchor XZ and bounded bend/flutter amplitudes. RGB stays untouched.
- Grass, flowers, shrubs and instanced grove trees retain their meshes and instance
  matrices. No instance updates or scene traversal in the frame loop.
- World-tree trunk and roots are fixed. Only terminal portions of branches move;
  canopy/leaf details and hanging vines sway gently. Vine leaves share their vine's
  anchor and bend field. Wall-attached vine stems and all stone batches stay fixed.
- Precinct plants, crystal flowers and rooted aquatic plants use the same wind.
  Lily pads remain unchanged; no new water physics or particle system.
- Rest bounds are rebuilt and padded by maximum displacement. Sun and moon share
  the animated shadow shader. Existing water reflection cadence is preserved.
- Reduced motion keeps a continuous breeze at 65% bend strength and 35% gust
  strength. Switching the preference eases between these values. Hidden tabs retain the existing stopped render loop;
  frame delta is capped to prevent a jump after resuming.
- Materials are shared by original material, restored before scene rebuild and
  disposed by the wind owner. Existing placement/disposal ownership is preserved.

## Verification

`npm test`, `npm run build`, `npm run lint`.

`node scripts/oasis-wind-browser-qa.mjs` starts its own local Vite server and checks
actual WebGL compilation/rendering at desktop and mobile viewport/input settings,
weather response, sun/moon shadows, unchanged mesh draw budgets and resources,
reduced motion/resume and placement rebuilds. `OASIS_QA_BROWSER` selects an installed
Chromium executable; `OASIS_QA_SOFTWARE=1` selects software-renderer launch flags.
Canvas PNG captures use test-only `preserveDrawingBuffer`; production does not.

Software rendering and device emulation do not establish physical phone FPS,
battery usage or thermal behavior. The app retains its existing 60/30 fps desktop/
mobile scheduling caps, not a guarantee that every device attains these rates.

### Initial v2 validation

- Build and lint passed; all 69 test files / 338 tests passed.
- Chromium WebGL checks passed at 960 × 640 desktop and 390 × 844 mobile emulation.
- No browser or shader errors. Wind binding covers 22 desktop / 21 mobile meshes.
- Geometry counts stayed 105 desktop / 104 mobile; texture counts stayed 23.
  Existing per-category mesh draw budgets stayed unchanged.
- Weather response, moon shadows, reduced motion and scene rebuild checks passed.
- Day, isolated world-tree phases and rainy-night captures were inspected.
- Machine-readable results: `../artifacts/jelly-oasis/natural-animation-v2/verification-summary.json`.

## Visibility correction

The first v2 release moved giant crown geometry by only a few hundredths of a
world unit in clear weather, too little to read at the normal overview camera.
Crown displacement now scales with crown width and remains bounded; attached leaf
tips share that exact crown field, so the stronger motion does not separate them.
Grove trees, meadow flowers, grass, bushes and hanging vines have larger but still
root-anchored amplitudes. Clear and mist weather keep an observable baseline breeze.

Mobile and desktop use identical wind coefficients and elapsed-time integration.
The existing 30/60 fps render caps and geometry detail budgets remain separate.
Reduced-motion preferences soften the breeze rather than disabling it.

Browser QA now checks **ordinary animation-loop playback at the default camera**:
it waits for two wind seconds without the manual stepping helper, then compares
rendered pixels with only the world tree visible. Both desktop and mobile must
change at least 0.1% of their pixels by more than 8 color levels. This is a motion
regression check, not a physical-device performance or perceptual-quality score.
The unit suite also compares the same elapsed time at 30 and 60 Hz.

Correction validation: build, lint and all 6 wind unit tests passed. Browser checks
passed for desktop and mobile, including live default-camera playback, softened
reduced-motion playback, shader compilation, weather response and rebuilds.
In the default-camera comparison, 1.46% of desktop pixels and 1.87% of mobile
pixels changed by more than 8 color levels. Geometry/texture counts did not grow.
Results: `../artifacts/jelly-oasis/natural-animation-v2/visibility-correction-summary.json`.

## References inspected before implementation

- NVIDIA GPU Gems 3, Chapter 16, Vegetation Procedural Animation and Shading in Crysis:
  https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-16-vegetation-procedural-animation-and-shading-crysis
- Three.js customDepthMaterial / customDistanceMaterial:
  https://threejs.org/docs/pages/Object3D.html
- Three.js instancing and bounding volumes:
  https://threejs.org/docs/pages/InstancedMesh.html

Only the bounded bending and shared-wind principles are adapted; there is no new
physics engine, WebGPU migration, texture-based foliage or change to v1 art direction.
