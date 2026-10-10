# Waterfall quality v2

## Behavior

The debug waterfall now has a closed, ten-sided volume rather than a two-vertex ribbon. Its path follows the loaded cliff, rounds the cascade over ledges without going behind the sampled rock face, and flattens into the existing pond outlet. Width changes gradually along the fall. Standard lighting and fog are retained; only the procedural water receives interpolated normals, while the cliff assets remain unchanged.

An irregular, downward-moving color pattern replaces the strong horizontal bands. Five scalloped foam patches, three expanding oval ripples, and eighteen instanced low-poly droplets mark the pond outlet. No textures, Blender changes, GLB edits, physics simulation, or extra light/shadow casters are introduced. The river and effects use the existing pond height and shoreline. Rebuilds dispose geometry, materials, and instanced buffers; reduced motion freezes the animation.

Use `/projects/jelly-oasis/?debug&waterfall=v2`. Existing `?debug&waterfall=v1` links select the improved effect too. It remains a debug candidate; the ordinary scene has no waterfall. Water v1 is independently selectable.

## Validation

- ESLint and TypeScript/Vite production build passed.
- Existing suite: 52 files, 294 tests passed.
- `scripts/waterfall-quality-qa.mjs`: desktop and mobile, front/side/close/night views, WebGL/console errors, animation and reduced motion, finite descending path, shared pond height, effect budget below 2,000 triangles, and unchanged ordinary debug scene.
- Eight screenshots and browser snapshots are in `artifacts/jelly-oasis/waterfall-quality-v2/`.
- Real-device GPU performance and long-duration thermal behavior were not measured.

The result is a stylized cascade candidate for visual review, not a photorealistic water simulation.
