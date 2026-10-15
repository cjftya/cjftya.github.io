# Jelly Oasis — Fantasy sanctuary finish v1

Base: master `d9d850c` (includes the sacred-lake CI timeout fix).

## Visible changes

- Six asymmetric colonies containing 40 faceted lavender/turquoise crystals.
- A large west-shore colony, smaller root/ruin accents, and forest-edge discoveries. The east arch opening stays clear.
- Merged crystal geometry (two draw calls) and instanced stone, moss and flower skirts. Colony footprints participate in vegetation exclusions.
- Time-of-day emission with restrained, slow pulses; soft local halos and HDR bloom. Facet shading remains visible at night.
- Golden/turquoise drifting motes around the roots and lake: 144 desktop / 72 mobile.
- Soft night fill around the tree, three low lake mist wisps, and subtle moss/soil variation using existing terrain texture samples.
- Mobile bloom pyramid resolution is reduced while main render resolution is retained. Mobile uses one local light, desktop two; neither adds shadow maps.
- Reduced-motion freezes drift/pulses while retaining time-of-day responses. Existing tab suspension and context recovery remain in effect.

## Validation

- `npm run lint`: passed.
- `npm test -- --maxWorkers=1`: 68 files, 333 tests passed. The single worker avoids CPU contention among the existing geometry/solver audits; assertions and timeout settings were not changed.
- `npm run build`: passed.
- Browser QA: desktop 1440×1000 and mobile 412×915, noon/dusk/night, rain, orientation/resize, animation and reduced-motion. No browser errors; GPU pond solver retained without fallback errors.
- Lifecycle tests cover terrain rebuilds, geometry disposal, static reduced-motion frames, time-of-day changes and mobile particle counts.
- Screenshots and structured results: `artifacts/jelly-oasis/fantasy-sanctuary-v1/`.

Run the browser check with `OASIS_QA_BROWSER=/path/to/chromium node scripts/fantasy-sanctuary-browser-qa.mjs`. Software rendering environments may set `OASIS_QA_SOFTWARE=1`. `OASIS_QA_FONT_CSS` optionally supplies a local CJK font fixture for screenshots; it does not alter production styles.

The captures use headless Chromium with software rendering. They verify appearance and behavior, not real-device frame rates. Final mobile performance should be checked on the target phone.

## Delivery status

Implementation and evidence are committed locally on `codex/oasis-crystal-fantasy-finish`. GitHub push was blocked by automatic approval review because it requires explicit push authorization. No remote branch or live deployment has been changed by this work.
