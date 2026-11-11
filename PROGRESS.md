# Progress - Life between shows
Branch: feature/life-between-shows
Last updated: 2026-11-12

## Done
- (Earlier work is in main: v1, ghosting fix, phone portrait, Opera House, share link, act names, ambient mode, Firefox speed fix, Dubai / Paris / London. See git history. Note: the Dubai / Paris / London commits went straight to main by mistake; the user chose to keep main as it is.)
- Step 1: Life engine and tests. `js/life.js` (new): the director. Events only start while it is quiet (no show, no sparks), one every 10-25 s, at most 2 at once, never the same twice in a row, never two of one group; each is gone 2.5 s before the next show; "Launch now" fades everything in 1.2 s; time only moves with drawn frames (hidden tab = pause); own random numbers (`lifeRandom`), never `Math.random`. With reduce motion: every 18-40 s, one at a time, events marked `calm: false` are skipped. `js/engine.js`: `lifeDraw` hook for three layers (sky, land, water). `js/main.js`: one director per scene, ticked each frame; the `?debug=1` meter shows the active life events. `js/scenes/kit.js`: `glow`, `glint`, `crossing`, `vessel` helpers for scenes. Tests: `tests/life.test.js` (15), three checks per scene with a life list in `tests/scenes.test.js`. No scene has events yet. 153/153 pass.
  Frame rate BEFORE (real browsers, window 1600x815, pixel ratio 1.5, 144 Hz): see "Measurements" below.

## In progress
- nothing

## Next step
- Step 2: Sydney life events in `js/scenes/sydney.js` (ferry, shooting star, windows, small boat). Screenshots desktop and phone portrait. Commit.
- Step 3: Dubai (abra / dhow, aircraft lights, light pulse on the tower).
- Step 4: Paris (river boat, soft sparkle on the tower, birds).
- Step 5: London (river boat, turning wheel lights, a red bus crossing the bridge).
- Step 6: Quiet sounds for life events in `js/audio.js` (`sound.life(kind)`), through the master volume so mute silences them.
- Step 7: Measure after in Firefox and Chrome, README ("Life between shows" per city), final report.

## Measurements
- BEFORE: filled in at step 2 (the baseline run was still going when step 1 was committed).

## Decisions
- IMPORTANT for whoever continues: before every commit check `git branch --show-current` says `feature/life-between-shows`, and push with `git push origin feature/life-between-shows`. Last task the folder was silently back on main.
- Life is not tied to the fireworks seed. A share link fixes the fireworks only.
- Before "Tap to start" no life events run; they start after the first show ends.

## Problems / questions for the user
- none
