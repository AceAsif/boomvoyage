# Progress - Firefox lag and phone bridge waterfall
Branch: fix/firefox-and-phone-bridge
Last updated: 2026-11-11

## Done
- (Earlier work is merged in main: v1, ghosting fix, phone portrait, Opera House, share link, act names, ambient mode. See git history.)
- Step 1: Measure. Added `?debug=1` (frame-rate meter on screen): `js/stats.js` (new, pure), `tests/stats.test.js` (7 tests), `debug` option in `js/link.js` (+1 test), meter in `js/main.js` / `css/style.css`, and `engine.stats` / `engine.skip` in `js/engine.js` (skip turns one drawing part off, only for measuring). 62/62 tests pass.
  Measured in the real installed browsers (Firefox 159 and Chrome 157, window about 1600x815, screen pixel ratio 1.5, canvas 2400x1223, 144 Hz screen), with a steady heavy load (about 9 shells a second, about 1500 sparks, like the finale). A small script outside the project drove the browsers (Firefox: WebDriver BiDi, Chrome: DevTools protocol); no library was added.

  | Firefox, heavy load | fps | typical frame | slow frame (95%) |
  |---|---|---|---|
  | everything on (BEFORE) | 21.5 | 48.6 ms | 48.6 ms |
  | without the trail subtract | 22.5 | 41.7 ms | 48.6 ms |
  | without the trail fade | 22.8 | 41.7 ms | 48.6 ms |
  | without drawing the sparks | 22.8 | 41.7 ms | 48.6 ms |
  | without glow / reflection of fireworks | 22.5 | 41.7 ms | 48.6 ms |
  | without the moving water | 21.8 | 48.6 ms | 48.6 ms |
  | **without the skyline burst light (`lightLand`)** | **70.8** | **13.9 ms** | **13.9 ms** |
  | idle (no fireworks) | 144 | 6.9 ms | 7.0 ms |

  Chrome, same load: 144 fps, 6.9 ms typical, with everything on.
  Cause: `lightLand()` in `js/engine.js`. Every frame it copies the full-size skyline to a scratch canvas with the blend modes `copy`, `multiply` and `destination-in`, then adds it to the picture. Chrome does this on the graphics card. Firefox does not, so each frame costs about 35 ms. The other suspects (trail layer, sparks, water, glow) cost almost nothing by comparison.

## In progress
- nothing

## Next step
- Step 2: Fix Firefox. Replace `lightLand()` with something cheap in every browser (for example: draw the skyline a second time with `lighter` and a low alpha, or pre-tint only when the light colour changes, on a small canvas). Then measure again; look for what is left between 71 fps and 144 fps (cap the pixel ratio, cheaper water rows) and fix it if it is real. Trails must still end in true black.
- Step 3: Phone portrait: the bridge waterfall looks cut in half next to the Opera House. Make it read as one whole curtain.
- Step 4: Test 390x844, 360x740, phone landscape, desktop (screenshots), README.

## Decisions
- The frame meter looks at the last 600 frames. "typical" is the middle frame time, "slow" is the 95% value.
- Measuring was done in the real installed Firefox and Chrome with temporary profiles (the user's own profiles were not touched).

## Problems / questions for the user
- none
