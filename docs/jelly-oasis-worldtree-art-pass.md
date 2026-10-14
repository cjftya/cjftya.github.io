# World tree art pass — 2026-10-14

The flat canopy and isolated masonry left the tree, rock and lake visually disconnected. This pass changes their geometry and composition while retaining the interactive 3D scene.

- Replace the broad flattened canopy discs with asymmetric rounded clusters and small closed leaf meshes. Use fewer clusters and leaf tips on mobile.
- Thicken and sculpt the main trunk; add face-level bark variation and finer branch silhouettes.
- Add hanging vines, surface-following rock vegetation, shrub colonies, ground plants and scattered stones around the tree and lake.
- Lower the rear ruined walls to 3–5 units and taper the roots crossing them. Add small broken wall fragments near the planting. The previously removed detached sanctuary and white paving remain absent.
- Frame the tree directly on reset. Portrait framing permits a slight crop at the canopy edges to reduce empty space; the overview control still fits the whole world.

Plant placement excludes the pond, circulation loop, clearing, approach and passage. Generated geometry stays merged into six mesh categories and is disposed/rebuilt with the landmark. No image backdrop replaces the scene and no new runtime dependency is added.

## Validation

- Production TypeScript/Vite build and ESLint pass.
- Sacred-lake integration test passes: every generated position/normal is finite, every triangle has nonzero area, ground/lake geometry stays stable on rebuild, resources dispose, and route samples remain clear.
- Existing landmark and vegetation tests pass.
- Chromium/SwiftShader checks at 1280×800 and 390×844: no page/console errors; desktop wheel zoom and mobile pinch zoom work; reset remains usable; day/night/rain views reviewed.
- Route audit: loop 5,040 samples, clearing 3,209, approach 4,212, passage 1,000; no sampled intersections. This is sampled clearance, not a continuous collision guarantee.
- Captured render counters, including shadow passes: desktop 88 calls / 683,866 triangles; mobile 92 calls / 555,787 triangles. Mobile uses reduced foliage geometry. Actual phone frame rate has not been measured.

This is a procedural low-poly interpretation of the supplied visual reference, not a pixel-identical recreation of its painted foliage and bark.
