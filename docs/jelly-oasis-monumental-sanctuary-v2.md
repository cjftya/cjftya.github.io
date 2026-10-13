# Jelly Oasis — monumental sanctuary and shoreline revision v2

Base: `6ffc3633e6ac1baa857cc3dda766b13e7c12db64`.

The v1 gate was too small in the full composition, its terrace was hidden by foreground trees, and the lake's cut edge produced repeated jagged soil bands. Normal camera controls stopped at a target distance of 35 even though inspection cameras could approach much closer.

## Architecture and composition

- Rebuilt the sanctuary as an open stone hall: deep rear arch, lower entrance arch, two lateral arcade bays, buttressed piers, broken masonry, side walls, central raised altar and broad entrance stairs.
- Main arch rises approximately 29.2 m above the deck (v1: 15.12 m). The terrace is 36 × 30 m (v1: 22 × 12 m); its footprint is about 4.1 times larger. Total structure including foundation and stairs is approximately 36 × 35 × 37 m.
- Moved the site to landmark-local (40, 38), keeping the same lake-facing orientation. A terrain survey and rendered comparison rejected the first hillside placement because it created an excessive retaining wall.
- Updated footprint exclusions and the foreground sightline. Existing landmark modules remain loaded; trees do not obscure the entrance by default.
- Existing ruin palette, flat stone faces, broad corner cuts and shadows retained. No new textures, lights or bloom. Approximately 19,568 stonework/approach triangles, one material, one merged mesh.
- The massing reference was the open nave, connected bays and remaining masonry described in [English Heritage's Rievaulx Abbey architectural record](https://www.english-heritage.org.uk/visit/places/rievaulx-abbey/history-and-stories/history/description/). This is a stylized original sanctuary, not a reconstruction of the abbey.

## Lake and controls

- Retained the shared 57-point boundary, 412.88 m² guide area and 2.8 m maximum depth.
- Graded the dry shore into the shallow shelf; varied shelf and deep-transition widths. Increased only the excavation patch resolution from 0.5 m to 0.25 m.
- Feathered excavation around existing foundations and preserved the 16 m clearing. The displayed terrain remains the source for grounding and depth sampling.
- Added an interpolated basin weight to the terrain material so small submerged slope changes no longer acquire mountain-like soil/rock bands. Soft sediment color retains the surrounding terrain palette.
- Varied the aquatic colonies' width and leaf heights, retaining five submerged source rocks and six valid water-surface leaves.
- Normal and reset camera minimum distance: 35 → 1.5. Near clip: 0.5 → 0.1. Mouse wheel zoom follows the cursor; mobile pinch remains supported.

## Verification

- `npm run lint`, `npm run build`, `git diff --check`: pass.
- Sacred lake integration and pond-only suites: 2 files / 4 tests pass. Includes real GLB loading, finite geometry, CPU fallback, repeat rebuild/disposal and rendered-bed ecology anchoring.
- Existing sampled loop, clearing, approach and arch passage: clear.
- Chromium/SwiftShader: desktop overview, medium, lake close-up, sanctuary close-up, night/rain; 390 × 844 portrait day/night. Browser errors: zero.
- Exercised actual mouse wheel and two-touch pinch events before invoking review cameras. Both pass the old 35-distance barrier; reset retains the new 1.5 minimum.
- Screenshots remain internal QA output; no encoded images or large generated assets committed.

Actual phone GPU performance has not been measured. The final art retains Jelly Oasis's stylized faceted language, rather than photographic masonry or water.
