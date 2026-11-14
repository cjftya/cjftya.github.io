# Waterfall v5 / Pond interaction v3 — candidate status

Base: `d2c2406531e1963c3970db3a5324a415e315b8fa` (`origin/master`, 2026-10-11). Branch: `feat/jelly-oasis-waterfall-v5-pond-v3`.

## Existing behavior and candidate changes

The ordinary page keeps its water and waterfall effects disabled. The existing debug URLs for v1–v4 remain available. `?debug&water=v2&waterfall=v5` selects this candidate.

v4 traces the cliff and launches a clear 65-point falling trajectory, but normally launches at the first available point, leaving little visible wetted rock. v5 searches for a clear launch from at least the sixth traced point, preserving more of the sampled cliff surface. The same raycast landing point now feeds the pond shader in pond-local XZ coordinates. The pond retains its existing two reflection/refraction captures, Fresnel blend, depth absorption, and shoreline attenuation. A damped radial wave is added to the smaller ambient waves. The three separate impact rings are omitted in v5; two smaller foam patches remain at the landing point. v1–v4 use their previous geometry and impact effects.

This is a **draft candidate with visual WARN**, not a final quality pass. No terrain, GLB, `layout.json`, shared pond boundary, or module placement changed.

## Verification

- `npm run build`: passed.
- `npm test -- --maxWorkers=2`: 52 files, 294 tests passed.
- `npm run lint`: passed after the import correction.
- `scripts/waterfall-pond-v5-qa.mjs`: passed on a production preview in headless Chromium 153 (SwiftShader), with desktop front/side/close/night and mobile 390×844 captures, path/impact/reflection, reduced motion, and no-water debug checks. No page or console errors. The normal Playwright CDN returned a corrupt archive, so the browser was obtained separately from npm. Five captures and `qa.json` were generated under `artifacts/jelly-oasis/waterfall-v5-pond-v3/` locally.
- v5: launch trace index 5, cliff clearance 0.471 root units, 8,584 waterfall triangles, shared impact XZ `(0.114, -1.419)`, two reflection/refraction passes, desktop 768 and mobile 256 capture textures. The reflection impact uniform matches the water effect's coordinate.
- `scripts/freefall-waterfall-qa.mjs`: v4 regression passed, including desktop/mobile, reduced motion, context recovery and baseline no-water check. v4 launched at trace index 1, with 0.514 root-unit clearance and 8,712 waterfall triangles in its front capture.
- These browser render statistics include extra capture passes and do not establish real-device FPS, GPU frame time, memory, or heat. Those measurements remain pending.

## Gate status and next steps

The structural browser checks pass, but the visual gate is **WARN**. In matched front/side/close captures, v5 shows more water against the upper rock and a visible pond response. The central fall still reads as a thin translucent sheet, and the impact waves look like repeated concentric rings, especially close up and on mobile. The night water is visible without an obvious white glow. Improve the falling volume/breakup and make the impact waves less periodic before asking for a default switch. Test actual mobile hardware for frame time, memory and heat.

The production default remains unchanged. This branch has not been merged or pushed to `master`.
