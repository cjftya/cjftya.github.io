# Jelly Oasis terrain foundation

Open `/projects/jelly-oasis/`. This is an isolated Vite entry; the existing home page and projects are unchanged.

## Terrain

- 320 × 320 units, 80 × 80 cells: 12,800 surface triangles.
- Cut edges: 640 triangles. Total: 13,440 triangles, two meshes/materials, zero textures.
- Wide flat central meadow, northern shelf, western shoulder, eastern basin, gentle southern rise.
- `terrain/heightfield.ts` owns pure deterministic height sampling. `terrain/createTerrain.ts` owns geometry and vertex colors.
- `TerrainConfig.size` and `segments` are independent. Landmarks use normalized coordinates; flat-center radius and feather are world units.
- Height scale starts at 26 units (the original plan suggested 18); the northern shelf is more legible while the center stays flat. No fine noise is used.
- Geometry is generated once. RendererManager retains its existing DPR/pixel budget. Static frames skip drawing and hidden pages suspend the animation loop.
- Shadow map size is reserved at 1024²; shadow rendering stays disabled until actual shadow casters are introduced.

## Controls and inspection

Drag to orbit, right-drag to pan, scroll to zoom. On touch screens, one finger rotates and two fingers pan/zoom. The overview button restores framing appropriate to the current aspect ratio.

Camera target travel, distance, and polar angle are bounded. A terrain-height guard keeps the camera above the surface. Resize, WebGL context recovery, and back-forward cache restoration are handled.

Append `?debug` for draw-call, triangle, texture, and DPR counters. Press W in debug mode to toggle wireframe. Debug tools are also enabled by Vite development mode.

## Build and validation

`npm ci`, `npm run lint`, `npm test`, `npm run build`.

`tests/jelly-oasis-terrain.test.ts` checks mesh budgets independent of world size, flat-center/landmark shape, seeded determinism, bounded neighbor slopes, and invalid settings. The legacy copy script must exclude `jelly-oasis`, otherwise it overwrites the built HTML with a TypeScript entry that cannot run on Pages.

Terrain approval precedes sky/time, weather, water, rocks, vegetation, and creatures. No physics, navigation, imported assets, or future engine framework is included.
