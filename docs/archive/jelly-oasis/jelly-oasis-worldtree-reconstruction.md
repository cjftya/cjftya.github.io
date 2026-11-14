# World tree and ruined enclosure

Reconstructed from the requested world-tree composition on master `7fa3f48`.
The earlier local-only commit `29f85be` was unavailable; this is a new implementation.

- Continuous tapered, faceted trunk and branching structure; broad, asymmetric layered foliage. No external textures, subdivision, or extra lights.
- Six irregular masonry sections using the existing ruin palette and chipped stone geometry, plus an arch and fallen masonry.
- Large roots cross the wall coping and return to terrain. The circulation ring remains open: roots pass beneath its soil, and masonry crossing the route is omitted.
- Existing original tree/root assets remain loaded for resource ownership but their render children are hidden in the sacred composition.
- Existing lake contour, water solver, ecology, terrain and weather remain in place.
- Removed the large sanctuary terrace and entry staircase; seated the surviving hall into the surveyed ground.
- Included the new precinct in vegetation exclusions, material refresh, isolation, disposal, framing and route audits. Portrait framing now centers the actual landmark bounds.

Validation: full suite 67 files / 330 tests passed before the final circulation correction; the affected sacred-lake integration test is rerun after that correction. Build, lint and browser QA cover desktop/portrait, wheel/pinch, day/night/rain and rebuild. The world-tree QA script adds front, left, rear and root views. Actual phone GPU performance is not measured. Browser screenshots in this environment may lack Korean fonts.

## Follow-up: remove the competing hall

The detached monumental hall, altar, plinths and all twelve approach paving stones
are removed from the scene and source. Its broad vegetation exclusion zones are
also removed so the existing planting system can populate that area naturally.
The world-tree enclosure, its small arches and original low ruins remain.
Camera framing now follows the remaining landmarks independently of the removed
hall; debug isolation offers the world-tree precinct instead.

Validation for this removal: build/lint, sacred-lake and pond-only integration,
plus desktop and portrait browser checks (including wheel/pinch and rebuild).
This change removes the competing architecture; it is not the complete foliage,
bark and ground-detail redesign discussed against the reference image.
