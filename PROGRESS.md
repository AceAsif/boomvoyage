# Progress - Fix ghosting, phone portrait, Opera House
Branch: fix/ghosting-and-phone
Last updated: 2026-11-10

## Done
- (v1 is merged in main: all 8 build steps, see git history.)
- Step 1: Ghosting and dark patches. Cause: the trail fade in `js/engine.js` only multiplies, and with 8-bit pixels very faint values (1-5 of 255) round back to themselves, so a thin haze stayed in every place a spark had been (measured: about 27% of the sky after a show). Places with no haze looked like dark patches next to it, and the old `color-dodge` light made the haze many times stronger. It was a bug, not smoke.
  Fix: the fireworks layer is now a black, add-only picture. Each frame it is dimmed and then one brightness step is subtracted (60 steps per second), so every pixel reaches true black (`fadeFx()`, `wipeFx()`). The first tile clean-up was removed again. Measured during a show: 0% faint leftover pixels; 3 s after a burst: 0 lit pixels. Frame time unchanged (median 7 ms at 1280x720).
  Burst light: `color-dodge` replaced by add-only light (`lightLand()` plus a thin sky wash). Kept: desktop looks cleaner (no brown haze), sails and windows still catch the light.
- Step 2: Phone portrait. `js/engine.js`: a scene can set `portraitSpan` (units that must fit across a portrait screen); portrait bursts are bigger (`U = min(w*2, hz*1.5)`) and use 30%..86% of the sky height. `js/scenes/sydney.js`: portrait composition (whole bridge across the width, Opera House in front of its left side, small far city behind). Landscape code path unchanged. Checked at 390x844.
- Step 3: Opera House redrawn in `js/scenes/sydney.js` (`shell()`, `hall()`, `drawOperaHouse()`): pointed shells leaning to the harbour and rising toward it, two halls (far one larger, near one overlapping), one land-facing shell per hall, small restaurant shells at the land end, ribs, warm glass walls with mullions, three-step podium with stairs and lamps. Drawn from memory of the building, no photo used. Checked enlarged in the browser and at 390x844 and 360x740.

## In progress
- nothing

## Next step
- Step 4: Test 390x844, 360x740, phone landscape, tablet, desktop in the built-in browser (look at screenshots).
- Step 5: Update README and Creative decisions.

## Decisions
- Screenshots from the test browser are JPEG and show blocky dark shapes in a dark sky by themselves. Pixel reads and lossless zooms were used to judge the sky.
- `window.boomvoyage.engine` is used for testing in the console.

## Problems / questions for the user
- none
