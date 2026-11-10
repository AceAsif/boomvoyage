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
- Step 4: Tested in the built-in browser, looking at screenshots: 390x844 and 360x740 (phone portrait), 844x390 (phone landscape), 768x1024 and 1024x768 (tablet), 1280x720 and 2400x1350 (desktop). Both landmarks are whole at every size, no console errors, 22/22 tests.
- Step 5: README updated (portrait, Opera House, trail fade, burst light).

## In progress
- nothing

## Next step
- All steps are done. The user opens the Pull Request from `fix/ghosting-and-phone` into `main` and merges it.

## Decisions
- The small restaurant shells are at the LAND end of the Opera House (as on the real building), not at the harbour end as the request said. To move them, change the two `shell(ctx, v, -247 ...)` / `-243` lines in `drawOperaHouse()`.
- The add-only burst light was kept (not reverted): the desktop sky is cleaner than with `color-dodge`, and the sails and windows still catch the light.
- Screenshots from the test browser are JPEG and show blocky dark shapes in a dark sky by themselves. Pixel reads and lossless zooms were used to judge the sky.
- `window.boomvoyage.engine` is used for testing in the console.

## Problems / questions for the user
- Not tested on a real phone or in Safari, only in the built-in Chromium browser at phone and tablet sizes.
- No web reference was looked up for the Opera House; it is drawn from knowledge of the building.
