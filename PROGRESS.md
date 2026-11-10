# Progress - Fix ghosting and phone portrait
Branch: fix/ghosting-and-phone
Last updated: 2026-11-10 (stopped early: usage limit reached)

## Done
- (v1 is merged in main: all 8 build steps, see git history.)

## In progress
- Step 1: Ghosting. PARTLY DONE, committed as a checkpoint.
  - Found cause A (confirmed by measuring pixels): the trail fade in `js/engine.js` can never reach zero with 8-bit pixels. After a show about 27% of the sky pixels of the fireworks layer were stuck at alpha 2. This is a bug, not smoke.
  - Fix A (done): the fireworks layer is split into 48 px tiles; a tile that no spark touched for 0.6 s is wiped (`touch()`, `sweepTiles()` in `js/engine.js`). Measured after a show: 0 leftover pixels, sky is clean.
  - Cause B (NOT solved): during a show, darker round patches still show around old bursts in screenshots at 1280x720. Reading the canvas pixels says no pixel is darker than the clean sky (leftover is +5 brighter at most), so the patches may be a contrast effect of the faint leftover light inside tiles that are still active, or a GPU-only blend difference. Not yet proven.
  - Changed while testing B (done, keep or revert after checking by eye): the `color-dodge` light wash was replaced by add-only light (`lightLand()` + a thin `lighter` wash). This changes the desktop look a little during bursts (less haze over the sky).

## Next step
- Step 1 (finish): reproduce cause B. Test page idea already used: draw a flash gradient into an off-screen canvas, fade it N times, draw it with `lighter` on a mid-blue canvas. Things to try: end the flash gradient in `flash()` with the burst colour at alpha 0 instead of `rgba(0,0,0,0)`; shorter TILE_STALE; smaller tiles. Check by eye on a real monitor.
- Step 2: Portrait redesign (not started). Plan: add `portraitSpan` to the scene so the bridge (-37..437 units) fits the width (about 506 units, focusX 200); in portrait draw the Opera House in front of the left side of the bridge (shift about +222 units, scale 1.1) and the city as a small hazy row behind it; portrait `U = min(w*2, hz*1.5)` for bigger bursts; burst height range 0.30..0.86 of the sky in portrait. Landscape code path must not change.
- Step 3: Test 390x844, 360x740, phone landscape, tablet, desktop in the built-in browser (look at screenshots).
- Step 4: Update README and Creative decisions.

## Decisions
- Tiles are cleared in device pixels so no line is left between tiles.
- `window.boomvoyage.engine` is used for testing in the console.

## Problems / questions for the user
- Please look at the sky during and after a show on this branch and say if dark patches are still visible to you, and if the new burst light on the skyline is acceptable.
- Step 2 to 4 are not done.
