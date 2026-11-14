# Waterfall free fall v4

Review: `/projects/jelly-oasis/?debug&water=v2&waterfall=v4`.

The waterfall v3 curtain followed the cliff surface and continued across the ground into the pond. V4 changes its form and motion: a ballistic sheet leaves the crest, clears the actual cliff, and lands directly inside the existing pond. Features are advected in flight-time coordinates, so their descent accelerates instead of scrolling at one constant speed. The source and impact remain anchored while the edges flutter; the lower curtain fragments into smaller streams.

Twenty-four elongated falling droplets and forty-eight translucent splash droplets share one instanced mesh. Splash height is increased for the higher-energy impact. Soft foam uses irregular multiscale noise to remove the former checker pattern. The existing reflective/refractive pond renderer, water level, bank, and GLB assets are unchanged.

The free-fall trajectory uses 65 samples, preceded by a short sampled crest feed and gravity of 9.8 local units/s². Its duration is approximately 1.70 seconds. Sampled cliff clearance must remain positive at the centre and both edges. The source stays at the exact sampled cliff lip, before the legacy curtain smoothing. The actual impact point is ray-tested against the shared pond, not a guessed shoreline. The effect totals 8,712 triangles. This is an authored ballistic effect, not a fluid simulation.

Validation: TypeScript/Vite build, ESLint, and 52 files / 294 existing tests pass. `scripts/freefall-waterfall-qa.mjs` checks the quadratic descent, cliff clearance, pond impact, desktop/mobile front/side/close/night views, animation and reduced motion, reflection reuse and invalidation, WebGL recovery, and absence of browser errors. Snapshots and front-view images are in `artifacts/jelly-oasis/waterfall-freefall-v4/`.

V1–V3 remain selectable for comparison. V4 remains a debug candidate; the normal page is unchanged. Real-device GPU/frame-rate/thermal testing is not claimed.
