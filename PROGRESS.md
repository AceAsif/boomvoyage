# Progress - Life between shows
Branch: feature/life-between-shows
Last updated: 2026-11-12

## Done
- (Earlier work is in main: v1, ghosting fix, phone portrait, Opera House, share link, act names, ambient mode, Firefox speed fix, Dubai / Paris / London. See git history.)
- Step 1: Life engine and tests. `js/life.js` (new): the director. Events only start while it is quiet (no show, no sparks), one every 10-25 s, at most 2 at once, never the same twice in a row, never two of one group; each is gone 2.5 s before the next show; "Launch now" fades everything in 1.2 s; time only moves with drawn frames (hidden tab = pause); own random numbers, never `Math.random`. With reduce motion: every 18-40 s, one at a time, events marked `calm: false` are skipped. `js/engine.js`: `lifeDraw` hook for three layers (sky, land, water). `js/main.js`: one director per scene; the `?debug=1` meter shows the active life events. `js/scenes/kit.js`: `glow`, `glint`, `crossing`, `vessel`, `afloat`, `towerPlan` helpers.
- Step 2: Sydney: ferry, yacht, shooting star, city lights (windows and bridge traffic), bridge beacon.
- Step 3: Dubai: dhow, abra, plane lights, light climbing the Burj Khalifa, lake fountain.
- Step 4: Paris: sightseeing boat, lantern boat, soft tower sparkle, birds, drifting cloud.
- Step 5: London: river bus, tug, lights round the wheel, glowing clock face, second red bus on the bridge. Tests require a life list in every scene.
- Step 6: Quiet sounds in `js/audio.js` (`sound.life(kind)`: horn, water, chime), through the master volume, so mute silences them.
- Step 7: Measured after, README ("Life between shows" per city, how to add life events, tests, file list). 169/169 tests pass.
- Every scene was looked at in real Chrome at 1600x815 and 390x844 (phone portrait) with all its events forced on.

## In progress
- nothing

## Next step
- The user opens the Pull Request for `feature/life-between-shows` and merges it. Do not merge into main from here.

## Measurements
Real browsers, window 1600x815, pixel ratio 1.5, 144 Hz screen. "Load" = heavy fireworks plus the scene's signature act. "Life" = quiet scene with all five life events of the place forced on at once.
- BEFORE, first run (main, at the start of this task):
  - Firefox 160: quiet 144 fps in all four scenes. Load: Sydney 99 fps, Dubai 99, Paris 100.6, London 98.4 (typical frame 7.0 ms, slow 13.9 ms, trail layer at 80%).
  - Chrome 157: Sydney and London quiet 144 fps, load 144 fps (typical 6.9 ms, slow 7.0 ms).
- AFTER (this branch, measured later the same day):
  - Firefox: quiet 144 fps, life 144 fps (typical 6.9 ms, slow 7.0 ms) in all four scenes. Load: Sydney 74 fps, Dubai 76, Paris 75, London 77 (typical 13.9 ms, slow 20.8 ms, trail layer stayed at 100%).
  - Chrome: quiet 144, life 144, load 144 fps in all four scenes (typical 6.9 ms, slow 7.0 ms).
- The lower Firefox load number is NOT from this branch. Checked by measuring a clean copy of main and this branch back to back, twice, Sydney, Firefox: main 77.4 and 74.2 fps, this branch 76.8 and 73.6 fps (same typical 13.9 ms, slow 20.8 ms). So the computer itself was slower in the second session than in the first; old and new code are equal. Life events never run during a show.

## Decisions
- Before every commit check `git branch --show-current` says `feature/life-between-shows`, and push with `git push origin feature/life-between-shows`.
- Life is not tied to the fireworks seed. A share link fixes the fireworks only.
- Before "Tap to start" no life events run; they start after the first show ends.
- Life sounds are not seeded (like all other sound) and are skipped when muted or when the tab is hidden.

## Problems / questions for the user
- In the second measuring session Firefox ran the heavy load at about 75 fps instead of about 99, on main and on this branch alike, and the automatic quality step (trail layer to 80%) did not switch on. This is older behaviour, not part of this task, and was not changed. Worth a separate look: should the quality step also react when Firefox holds a steady 72 fps on a 144 Hz screen?
