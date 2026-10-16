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
- Reduced motion restores the static silhouette and freezes wind time. Resuming
  ramps strength back up. Hidden tabs retain the existing stopped render loop;
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

### Completed validation

- Build and lint passed; all 69 test files / 338 tests passed.
- Chromium WebGL checks passed at 960 × 640 desktop and 390 × 844 mobile emulation.
- No browser or shader errors. Wind binding covers 22 desktop / 21 mobile meshes.
- Geometry counts stayed 105 desktop / 104 mobile; texture counts stayed 23.
  Existing per-category mesh draw budgets stayed unchanged.
- Weather response, moon shadows, reduced motion and scene rebuild checks passed.
- Day, isolated world-tree phases and rainy-night captures were inspected.
- Machine-readable results: `../artifacts/jelly-oasis/natural-animation-v2/verification-summary.json`.

## References inspected before implementation

- NVIDIA GPU Gems 3, Chapter 16, Vegetation Procedural Animation and Shading in Crysis:
  https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-16-vegetation-procedural-animation-and-shading-crysis
- Three.js customDepthMaterial / customDistanceMaterial:
  https://threejs.org/docs/pages/Object3D.html
- Three.js instancing and bounding volumes:
  https://threejs.org/docs/pages/InstancedMesh.html

Only the bounded bending and shared-wind principles are adapted; there is no new
physics engine, WebGPU migration, texture-based foliage or change to v1 art direction.
