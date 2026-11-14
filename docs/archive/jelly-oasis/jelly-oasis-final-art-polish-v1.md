# Jelly Oasis — v1 final art polish

Base: master `8cdbca5d21c7d0b75b133be7b5d7686edfe9bf1e` (2026-10-16).

## Why

The sanctuary composition was complete, but the tree's branch forks disappeared
at night, the daytime scene carried a yellow haze, and evenly exposed crystal
colonies looked placed rather than grown into the banks.

## Changes

- Replace the existing tree point light with one distant, feathered, unshadowed
  spotlight aimed at the branch forks. It follows the existing night factor,
  remains static under reduced motion, and adds no shadow map or light count.
- Neutralize daytime hemisphere fill and midday sunlight, reduce midday fill
  slightly, and move fair-weather fog behind the focal basin. Dense mist retains
  the original near-fog distance; rain interpolates toward it.
- Shift world-tree foliage toward deeper greens and the basin toward cooler
  greens. Reuse existing surface samples for irregular moss on the rock shelves;
  no texture fetches, textures, or new postprocessing passes are added.
- Keep six crystal colonies / 40 shards. Emphasize the lakeside hero and cyan
  supporting cluster, lower and partially bury the smaller clusters, vary their
  orientation, enlarge a few host stones, and break up circular flower skirts.
- Add two small, asymmetric shelf understory pockets through the existing
  grounded, collision-aware instancing system. The production placement accepts
  5 east and 8 west instances. Existing scenery reservations and slope limits
  still decide placement, so the proposed quotas are not forced into the slope.

## Validation

- TypeScript check and ESLint on the changed source/script: passed.
- Relevant existing suites: fantasy, environment, scenery, surface; 18 distinct
  tests passed. The fantasy suite was rerun after replacing the trial point light.
- Browser: desktop and mobile at noon, dusk, midnight; plus a desktop orbit
  change using pointer input. Zero page/console errors and no GPU water error.
- Inspected desktop day/night/orbit and mobile night screenshots. A trial light
  caused a bright canopy spot; the final distant feathered light removes it.
- All 40 crystals and the existing 144 desktop / 72 mobile particles remain.
  Scenery remains six instanced draws, with 290 desktop / 243 mobile instances.
- Captures and state: `artifacts/jelly-oasis/final-art-polish-v1/`.
  Renderer calls/triangles from the global snapshot are intentionally omitted:
  with the composer they describe the final pass, not the entire scene.
- Software-rendered browser checks are not a real-device FPS benchmark.
  No new full-suite or full production build was run; the existing deployment CI
  remains the final build gate when this branch is merged.

## Reproduce the visual check

Run `node scripts/final-art-polish-browser-qa.mjs`. Optional environment variables:
`OASIS_QA_BROWSER` for a Chromium executable, `OASIS_QA_SOFTWARE=1` for software
rendering, `OASIS_QA_FONT_CSS` for locally available Korean fonts in a minimal
container, and `OASIS_QA_OUTPUT` for the capture directory. Fonts supplied this
way only affect the QA browser; no font dependency was added to the product.

## Release scope

This completes the planned visual polish. The tree geometry, lake simulation,
weather scheduling, camera controls and production UI remain unchanged.
Keep the result on the work branch until master integration is requested.
