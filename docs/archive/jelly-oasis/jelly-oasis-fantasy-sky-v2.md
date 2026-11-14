# Jelly Oasis v2 — twin moons and giant planet

## Art and implementation

The sky now has a huge blue-violet gas giant and two differently sized, cool-white
and rose-tinted moons. Atmospheric rims, a curved light/shadow boundary, banded
planet clouds and mottled lunar surfaces are computed in the existing sky shader.
Three color layers distinguish blue/lavender daylight, peach-violet sunset and
indigo night. A restrained star river and two scales of wispy cloud add depth.
Weather fades celestial contrast, and clouds pass in front of the bodies.
Point stars are masked behind all three discs.

All celestial bodies share world-space directions. Orbiting the camera changes the
view normally; the sky follows camera translation only. The primary moon still
shares its direction with the single existing moon shadow light. The companion
moon and planet do not introduce additional lights or shadow maps. Moon discs are
visible in daylight without enabling the moon light during the day.

The scenic reset camera has a lower pitch to expose the sky around the world tree.
Terrain, assets and placement remain unchanged; manual orbit and zoom are retained.
The new sky adds no meshes, image textures, draw calls or runtime dependencies.
The procedural fragment shading does cost more GPU arithmetic than the old gradient;
physical-phone FPS, battery usage and thermal behavior are not established by emulation.

## Wind follow-up

The previously deployed `4b47212` production bundle was checked without `?debug`:
actual WebGL `oasisWindTime` uploads advanced from 0.2 to 3.2332 seconds, strength
settled at 0.3789 and no page errors were observed. This confirms playback in the
verification browser, not the state of the user's device.

The sway waveform now visibly reverses direction instead of remaining mostly
leaned to one side. The giant crown's bounded bend scales with crown width (maximum
3 world units before weather/height weighting). Attached leaf tips retain the same
crown field. Roots and the central trunk remain fixed. Desktop/mobile use the same
elapsed-time calculation and amplitudes; reduced motion retains a softened breeze.

## Verification

- `npm run build` and `npm run lint`.
- Environment, night/weather and wind test suites.
- `node scripts/oasis-fantasy-sky-qa.mjs` serves the production build with Vite
  preview and loads the normal entry **without debug mode or manual time stepping**.
  It checks live GPU wind uploads and visible crown pixels, day/sunset/night/rain
  rendering, the sky-view/reset controls and continued wind under reduced motion.
- `OASIS_QA_BROWSER` can select a Chromium executable; `OASIS_QA_SOFTWARE=1` enables
  software WebGL for headless environments. Canvas capture uses test-only
  `preserveDrawingBuffer`; production does not. Mobile viewport/touch emulation is
  a functional/rendering check, not a physical-phone performance benchmark.

### Completed checks

Build, lint and 24 focused environment/wind tests passed. Production-browser checks
passed for desktop and mobile emulation with no JavaScript/shader errors. In the
paused-lighting crown region, 17.78% of desktop pixels and 11.99% of mobile pixels
changed by more than 8 color levels across two wind seconds. These are motion
regression checks, not performance measurements. Both final lunar positions are
also visually checked after the last composition adjustment.

Machine-readable results: `../artifacts/jelly-oasis/fantasy-sky-v2/production-summary.json`.

## References

Inspected while developing the sky; the GLSL here is project-specific and does not
copy the external shader implementation or add its engine dependencies.

- GDQuest stylized sky: three-color gradients, cloud layers and celestial bodies:
  https://github.com/gdquest-demos/godot-4-stylized-sky
- Three.js material customization and shader lifecycle:
  https://threejs.org/docs/pages/Material.html
