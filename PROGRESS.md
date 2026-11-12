# Progress - Life between shows (now: fixing the life sounds)
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
- Sound fix 1: found both causes, by rendering the real code into an OfflineAudioContext in real Chrome (numbers under "Sound measurements").
  - Static noise: the `water` sound. Its noise source started at once, but its volume changes were scheduled 0.5 to 2.5 s later. A Web Audio gain node passes sound at full volume (1.0) until its first scheduled change, so raw filtered noise played about 26 times too loud for that time, then dropped to the planned level. It was in every city (yacht, dhow, fountain, lantern boat, tug). Dubai has two water events, so it shows up there most.
  - Horn: it was wired to one event in every city (ferry, abra, sightseeing boat, river bus) and it did play, but as two soft triangle tones near 150 and 190 Hz at level 0.014 behind a 420 Hz filter. Too low and too quiet to hear on normal speakers.
- Sound fix 2: `js/lifesound.js` (new): every life sound is a plan (tones or noise, start, stop, volume points) built by `playLifeSound`: gain made silent first, linear ramps only, fades of 30 ms or more, every source stopped. Horn is now two sawtooth tones near 200 and 250 Hz through a 760 Hz filter, about three times louder. `createSoundGate`: at most two life sounds at once. `js/audio.js`: `life(kind, { now })` uses the plans, each sound has its own volume strip; `hushLife()` fades and stops them in 0.3 s. `js/main.js`: `hushLife()` when a show starts or the place changes.
- Sound fix 3: with `?debug=1`, keys 1 / 2 / 3 play horn / water / chime at once (a message names the sound or says why not). The meter shows the hint.
- Sound fix 4: `tests/lifesound.test.js` (12 tests). Checked in real Chrome and Firefox: keys, the two-at-once limit, fade-out and stop at show start, mute (nothing is even created when muted), no errors. 181/181 pass.

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

## Sound measurements
Real code rendered offline (44.1 kHz, dry signal, no reverb), Chrome 157; Firefox gives the same.
- BEFORE: water: peak 0.371, already at full level at time 0 (level in the first second 0.101, planned top level 0.014), biggest jump between two samples 0.12. Four water sounds together: peak 1.54 (above full scale = clipping). Horn: peak 0.019. Chime: peak 0.007.
- AFTER: water: silent until its start, peak 0.015, biggest jump 0.005. Horn: peak 0.061. Chime: peak 0.008. Horn + water + chime asked together: the third is refused, peak 0.067. Four water sounds asked together: two play, peak 0.029.

## Decisions
- Before every commit check `git branch --show-current` says `feature/life-between-shows`, and push with `git push origin feature/life-between-shows`.
- Life is not tied to the fireworks seed. A share link fixes the fireworks only.
- Before "Tap to start" no life events run; they start after the first show ends.
- No compressor on the life sounds: with two at most the worst case is far below full volume, and a Web Audio compressor adds its own make-up gain. The master compressor is unchanged.
- Life sounds are not seeded (like all other sound) and are skipped when muted or when the tab is hidden.

## Problems / questions for the user
- The new horn, water and chime levels were measured, not heard. Please listen with `?debug=1` and keys 1, 2, 3 and say if any should be louder or softer.
- In the second measuring session Firefox ran the heavy load at about 75 fps instead of about 99, on main and on this branch alike, and the automatic quality step (trail layer to 80%) did not switch on. This is older behaviour, not part of this task, and was not changed. Worth a separate look: should the quality step also react when Firefox holds a steady 72 fps on a 144 Hz screen?
