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
- Step 2: Fix Firefox. Two changes in `js/engine.js`, plus `js/quality.js` (new) and `tests/quality.test.js` (10 tests). 72/72 pass.
  1. `lightLand()` no longer multiplies the skyline by the burst colour every frame. `paintLit()` splits the skyline ONCE (per resize) into a red, a green and a blue picture, cropped to the rows that hold skyline; each frame the three are just added with the strength of the burst's red, green and blue. Same result on screen, no slow blend mode per frame.
  2. Automatic quality (`createGovernor` in `js/quality.js`): while fireworks are in the air the engine watches the real frame times. Only if the browser is clearly behind (average frame more than 25% over the screen's own frame time and over 15 ms) the fireworks layer is made smaller: 100% -> 80% -> 67%. It is copied across, so nothing blinks, and it never goes back up. A fast browser keeps 100%.

  | Same heavy load, same machine | fps | typical frame | slow frame (95%) | worst |
  |---|---|---|---|---|
  | Firefox BEFORE | 21.5 | 48.6 ms | 48.6 ms | 55.6 ms |
  | Firefox after change 1 only | 57.3 | 20.8 ms | 20.8 ms | 27.8 ms |
  | Firefox AFTER (both; layer settled at 80%) | 92.6 | 13.9 ms | 13.9 ms | 13.9 ms |
  | Chrome before | 144 | 6.9 ms | 7.0 ms | 7.1 ms |
  | Chrome after (layer stays 100%) | 144 | 6.9 ms | 7.0 ms | 7.1 ms |

  Also tried and NOT kept: fewer subtract passes (small gain, one 35 ms hitch), a software-only trail canvas (no gain). Trails still end in true black: 0 lit pixels 5 s after a burst. Real-browser screenshots (Chrome before, Chrome after, Firefox after, 1600x815 at pixel ratio 1.5) look the same.
- Step 3: Phone bridge waterfall. Cause: the fireworks are drawn behind the skyline, and in portrait the Opera House stands in front of the left half of the bridge deck, so half of the deck waterfall was hidden. Fix in `js/scenes/sydney.js` (`rig()`): in portrait the curtain hangs from the arch (its lower curve, 25 points) across the whole bridge; its top edge is above the Opera House roofs everywhere, and the sparks fall behind the sails. Wide screens keep the deck waterfall. `js/engine.js`: a scene can ask for a denser curtain (`waterfallDensity`, 1.5 in portrait). New `tests/sydney.test.js` (3 tests). Also fixed in `css/style.css`: at 360 px wide the harbour button could leave the screen; its text now shortens instead. 75/75 pass.
  Looked at real-browser screenshots: 390x844 and 360x740 (Chrome and Firefox), 844x390 and 1600x815 (Chrome).
- Step 4: README (the `debug` link option, "Check the speed", tests list, file map, waterfall on a phone, speed notes).

## In progress
- nothing

## Next step
- All steps are done. The user opens the Pull Request from `fix/firefox-and-phone-bridge` into `main` and merges it.

## Decisions
- No browser-name check anywhere. The quality step is decided from measured frame times, so it also helps slow phones and does nothing on fast machines.
- On a 144 Hz screen 72 fps (13.9 ms) counts as good enough: the layer is not shrunk further to chase 144.
- The frame meter looks at the last 600 frames. "typical" is the middle frame time, "slow" is the 95% value.
- Measuring was done in the real installed Firefox and Chrome with temporary profiles (the user's own profiles were not touched).

## Problems / questions for the user
- Measured on one machine only (the user's PC: 144 Hz screen, pixel ratio 1.5). Please open the deployed site in Firefox with `?debug=1` after merging and report the numbers during the finale if it still feels slow.
- Phone sizes were checked in desktop Chrome and Firefox set to phone sizes, not on a real phone.
- With reduced motion the skyline light is off (as before), so that path was not part of the Firefox problem.
