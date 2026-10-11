# Real water baseline v1

Remote master: 6c12aa11b4ad57c5b921d6a111200d34042acaeb. Local checkout tree verified file-by-file against the recursive remote tree, including all assets. Ordinary page has no water effects. No layout or asset edits are planned.

Production preview v5, desktop front/side/close/night and 390x844 mobile were captured before geometry edits in artifacts/jelly-oasis/waterfall-v5-pond-v3. The existing QA passed, but these images are not a realism pass. Front and side show a flat translucent curtain; close shows periodic concentric waves. Shader inspection confirms realistic cross sections replace the closed ellipse with a linear across coordinate. The pond uses a single periodic radial sine.

Loaded refined cliff centerline raycast (asset-local): upper rock at y14.4,z-1.24; first ledge y12.4,z-0.55; next ledge y8.4,z-0.31, front face y8,z0.58. These actual ledges support a substantial attached upper flow before release. The new system must raycast each lane, avoid smoothing it away from the face, and validate its landing against the existing pond triangles. Grounded runtime coordinates are authoritative; asset coordinates above only diagnose shape.

Gate 0: baseline and geometric cause recorded. Extended matched crest/impact/pond temporal comparisons are provided by water-realism-v1-qa.mjs; visual status remains pending until inspection.
