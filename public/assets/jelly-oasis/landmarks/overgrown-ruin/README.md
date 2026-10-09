# Overgrown Oasis Ruin — runtime blockout

Source: existing Blender scene `JellyOasis_OvergrownRuin_v1`, Blender 5.2.2 LTS.
Units: metres. Export axes: Blender `(x, y, z)` → glTF `(x, z, -y)`.

The sixteen module GLBs are exported at local origins with scale 1. `layout.json`
records original scene anchors and the actual live composition-guide vertices.
The runtime adds per-module terrain grounding and the broken-wall offset configured
in `src/jelly-oasis/landmark/landmarkConfig.ts`. No image textures are used.

`Cliff_Waterfall_A.glb` includes the integration feedback edit: a 32-vertex,
60-triangle connecting base/rear mass. Its original dimensions remain unchanged.
Runtime module total: **8,002 triangles**.

`Overgrown_Oasis_Ruin_Blockout_v1.glb` is the unchanged **7,942-triangle** source
layout reference. It intentionally shows the earlier cliff and wall arrangement
and is loaded only by the optional debug comparison.

`Pond_Blockout` is a guide in the JSON, not a textured water asset. Runtime uses a
level inspection plane and fits the thin pond rim vertically to the existing
terrain. The terrain itself is unchanged.

See `docs/jelly-oasis-landmark-integration-v1.md` for placement, tests, screenshots,
limitations, and the saved integration `.blend` copy.
