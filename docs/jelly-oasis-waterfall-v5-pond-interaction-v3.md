# Waterfall v5 / Pond interaction v3 — candidate status

Base: `d2c2406531e1963c3970db3a5324a415e315b8fa` (`origin/master`, 2026-10-11). Branch: `feat/jelly-oasis-waterfall-v5-pond-v3`.

## Existing behavior and candidate changes

The ordinary page keeps its water and waterfall effects disabled. The existing debug URLs for v1–v4 remain available. `?debug&water=v2&waterfall=v5` selects this candidate.

v4 traces the cliff and launches a clear 65-point falling trajectory, but normally launches at the first available point, leaving little visible wetted rock. v5 searches for a clear launch from at least the sixth traced point, preserving more of the sampled cliff surface. The same raycast landing point now feeds the pond shader in pond-local XZ coordinates. The pond retains its existing two reflection/refraction captures, Fresnel blend, depth absorption, and shoreline attenuation. A damped radial wave is added to the smaller ambient waves. The three separate impact rings are omitted in v5; two smaller foam patches remain at the landing point. v1–v4 use their previous geometry and impact effects.

This is a **draft candidate**, not a visual quality pass. No terrain, GLB, `layout.json`, shared pond boundary, or module placement changed.

## Verification

- `npm run build`: passed.
- `npm test -- --maxWorkers=2`: 52 files, 294 tests passed.
- `npm run lint`: passed after the import correction.
- `scripts/waterfall-pond-v5-qa.mjs` provides desktop front/side/close/night and mobile capture, path/impact/reflection checks, reduced-motion and ordinary-page checks. **Not executed successfully:** no Chromium exists in this runner, and `npx playwright install chromium` repeatedly returned a zero-byte/corrupt archive.
- v4 and realistic-water browser regression scripts, screenshots, actual rendered cliff clearance, GPU/CPU frame time, and mobile device FPS remain **unverified** for the same reason.

## Gate status and next steps

Gate 0 and the visual gates are pending. Run a production build and the candidate browser QA in an environment with Chromium, review the generated images, and correct path or shader artifacts before treating this as a finished v5. In particular, verify that a launch from trace index 5 or later clears the actual refined cliff, that the crest-to-flight tangent is smooth, and that the radial wave stays aligned with the landing point. Compare v4 and v5 from the same cameras and inspect night brightness and mobile cost.

The production default remains unchanged. This branch has not been merged or pushed to `master`.
