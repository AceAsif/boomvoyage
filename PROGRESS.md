# Progress - Fix ghosting, phone portrait, Opera House
Branch: fix/ghosting-and-phone
Last updated: 2026-11-10

## Done
- (v1 is merged in main: all 8 build steps, see git history.)
- Step 1: Ghosting and dark patches. Cause: the trail fade in `js/engine.js` only multiplies, and with 8-bit pixels very faint values (1-5 of 255) round back to themselves, so a thin haze stayed in every place a spark had been (measured: about 27% of the sky after a show). Places with no haze looked like dark patches next to it, and the old `color-dodge` light made the haze many times stronger. It was a bug, not smoke.
  Fix: the fireworks layer is now a black, add-only picture. Each frame it is dimmed and then one brightness step is subtracted (60 steps per second), so every pixel reaches true black (`fadeFx()`, `wipeFx()`). The first tile clean-up was removed again. Measured during a show: 0% faint leftover pixels; 3 s after a burst: 0 lit pixels. Frame time unchanged (median 7 ms at 1280x720).
  Burst light: `color-dodge` replaced by add-only light (`lightLand()` plus a thin sky wash). Kept: desktop looks cleaner (no brown haze), sails and windows still catch the light.

## In progress
- nothing

## Next step
- Step 2: Portrait redesign. Add `portraitSpan` to the scene so the whole bridge fits the width (about 506 units, focusX 200); in portrait draw the Opera House in front of the left side of the bridge and the city as a small hazy row behind it; portrait `U = min(w*2, hz*1.5)` for bigger bursts; burst height range 0.30..0.86 of the sky in portrait. The landscape code path must not change.
- Step 3: Redraw the Opera House (two large shell groups side by side, a small group at the harbour end, glass walls, stepped podium).
- Step 4: Test 390x844, 360x740, phone landscape, tablet, desktop in the built-in browser (look at screenshots).
- Step 5: Update README and Creative decisions.

## Decisions
- Screenshots from the test browser are JPEG and show blocky dark shapes in a dark sky by themselves. Pixel reads and lossless zooms were used to judge the sky.
- `window.boomvoyage.engine` is used for testing in the console.

## Problems / questions for the user
- none
