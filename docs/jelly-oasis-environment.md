# Jelly Oasis environment foundation

## Result and scope

The terrain v1 geometry, vertex colors, height sampling, and existing camera controls are retained. The environment adds a coordinated 24-hour cycle, procedural sky, sunlight and night fill, stars, atmospheric fog, instanced clouds, and batched rain. No Blender assets, terrain reshaping, water, vegetation, creatures, or post-processing pipeline are included.

Open `/projects/jelly-oasis/` for the normal scene, or `/projects/jelly-oasis/?debug` for inspection. The default is clear weather at 10:00 with an eight-minute day. Weather remains at the selected preset; automatic weather scheduling is outside this stage. Runtime config can change the day length and transition duration.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| `environment/timeOfDay.ts` | Pure wrapping, advancement, reusable keyframe interpolation output |
| `environment/weather.ts` | Serializable state, five profiles, smooth transition interpolation, budgets |
| `environment/EnvironmentController.ts` | Coordinates time/weather with Three.js resources, fog, lights, lifecycle |
| `environment/createSky.ts` | 528-triangle dome shader with gradient and sun glow/disc; 360 point stars |
| `environment/createClouds.ts` | Ten clusters of five shared low-poly puffs in one InstancedMesh |
| `environment/createRain.ts` | GPU-animated camera-local rain, one LineSegments object |
| `environment/debugPanel.ts` | Debug-only time/playback/speed/weather, toggles, rendering counters |
| `main.ts`, `styles.css`, project HTML | Integration, capped animation loop, lifecycle, restrained debug layout |
| `tests/jelly-oasis-environment.test.ts` | Nine environment behavior and resource-budget tests |

## Time and weather

The cycle uses smooth interpolation between midnight, predawn, dawn, morning, noon, afternoon, sunset, dusk, and night palettes. Sun position follows an art-directed continuous angular path. Color inputs use sRGB and are converted through Three.js Color before lighting/shader use. Night retains hemisphere illumination and a weak directional fill; that fill has no shadows.

Presets: `CLEAR`, `PARTLY_CLOUDY`, `OVERCAST`, `RAIN`, `MIST`. They coordinate cloud amount/darkness, sunlight, ambient illumination, fog, and precipitation. Changes take five seconds by default. If another preset is requested during a transition, interpolation restarts from the current blended profile. Endpoints copy the exact profile values.

The sky uses a procedural dome without an image texture. Stars use one Points draw. Clouds reuse 50 instances of an 80-triangle icosphere; clusters grow/shrink during weather changes and taper down at recycling boundaries. Cloud matrices update at most around 20 Hz. Rain uses a fixed camera-centered 140 × 100 × 140 volume and shader time; no per-drop CPU object creation or collision simulation.

Fog uses camera-relative near/far distances, retaining the terrain across close and overview zoom levels. Its color comes from the current horizon and its range responds to weather.

## Geometry and rendering budgets

| Component | Geometry / batch budget |
| --- | --- |
| Terrain + edge | 13,440 triangles, unchanged |
| Sky | 528 triangles, one mesh |
| Clouds | 4,000 triangles submitted, 50 instances in one mesh |
| Total triangle geometry | **17,968** (verified from Three.js geometry) |
| Stars | 360 points, at most one additional draw |
| Rain | 420 desktop / 180 mobile segments, at most one additional draw |
| Main scene draws | Expected 4 daytime; up to 6 when both stars and rain are visible |
| Textures authored / loaded | **0** |
| Shadows | One directional source, 1024² shadow map; desktop on, mobile off by default |

Draw counts are structural estimates, not a GPU measurement. Shadows may add a terrain draw and 12,800 submitted triangles and allocate an internal render-target texture; the debug texture counter therefore need not be zero when shadows are enabled. The night fill and clouds do not cast shadows. RendererManager's existing DPR cap (1.2–1.5) and pixel budget are unchanged.

## Interaction, motion, and lifecycle

Desktop updates are capped near 60 Hz and mobile/coarse-pointer or low-core devices near 30 Hz. Reduced-motion preference starts paused and switching that preference on pauses the environment. Debug playback lets the user explicitly resume. Pausing freezes time, cloud drift, and falling rain; a requested weather transition still completes and then rendering returns to dirty-only drawing. The animation callback remains registered while visible, but static frames skip GPU rendering.

Hidden pages suspend the animation loop. Resume resets the time baseline, preventing elapsed background time from jumping the cycle. WebGL context loss pauses updates; restoration invalidates the scene. Resize and back-forward cache restoration retain the original controls. Environment geometry, materials, lights/shadow targets, and debug listeners are disposed on permanent page exit.

## Validation and remaining QA

- Baseline `npm ci --prefer-offline --no-audit --no-fund`, lint, 261 existing tests, and production build passed before implementation.
- Final lint, 270 tests (49 files), and production build passed.
- Terrain-source diff is empty.
- Production entries and local asset references are verified for Jelly Plants, Viola, Uriel, Virus Sim, and Jelly Oasis; no `/src/*.ts` entry is left in built HTML.
- New tests cover time wrapping/invalid inputs, keyframe continuity and storage reuse, preset bounds, interrupted transitions, exact endpoints, paused/reduced-motion behavior, camera-relative fog, geometry budgets, stable allocation, cleanup, and configurable day length.
- The available cloud browser previously reported WebGL disabled. GPU shader compilation, aesthetic QA, actual FPS/draw counters, mobile touch/orientation, and context-restoration behavior have **not** been visually verified. Unit tests do not substitute for these checks.

Visual acceptance should cover dawn/clear, morning/clear, noon/clear, sunset/partly-cloudy, night/clear, noon/overcast, noon/rain, and morning/mist. The debug panel can be collapsed to inspect a full portrait or landscape viewport.

After environment approval, consider water/ponds and waterfalls, then rock modules and vegetation. These are not implemented here.
