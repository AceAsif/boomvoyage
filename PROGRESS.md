# Progress - Sail sound, phone postcard, New Year's Eve check
Branch: fix/sail-sound-and-phone-postcard (made from main at a79e5b1)
Last updated: 2026-11-15

Steps, in this order: 1) sail sound. 2) phone postcard shape and layout. 3) postcard taken at the moment of most light. 4) look at the phone postcards in five cities. 5) New Year's Eve mode in the debug panel.
(The notes of the earlier task "Grand voyage" are in git history: see PROGRESS.md at commit a79e5b1.)

## Done
- Step 1: sail sound rebuilt (`js/lifesound.js`). It is no longer wind noise with two notes. It is now: (a) cloth: four soft flaps, each a short thump (a triangle tone falling from 210 to 105 Hz in 0.2 s) with a tiny puff of air; (b) rope and wood: a slow creak, a very low sawtooth (24 to 43 ticks a second, speeding up) through two narrow filters (880 Hz and 1750 Hz), once long and once short; (c) one low, short swish at the end (noise through a low filter that opens from 200 to 520 Hz and closes again). The plan format gained `glide` (moving pitch) and `filter.sweep` (moving filter). Fades, the stop of every source, the limit of two sounds and the limiter are unchanged. Key 7 with `?debug=1` still plays it. `tests/lifesound.test.js`: 3 new tests (what the sail is made of, that it is not the water sound, that glides are built as ramps). 336 tests pass.

## In progress
- nothing

## Next step
- Step 2: phone postcard. In `js/postcard.js` a tall source (a phone held upright) must give a 4:5 picture cut from the canvas around the city, with a bigger caption. Wide sources (desktop) must give exactly the same layout as before. Add tests in `tests/postcard.test.js`.

## Decisions
- The sail sound keeps every level at or below 0.03 (the old rule in `tests/voyage.test.js`), so it stays the quietest kind of sound.
- Noise is still used in the sail sound, but only as a small part: a puff on each flap and the short swish. Tests check that tones are the loudest and carry more sound than the noise.

## Problems / questions for the user
- The sail sound is checked by rule only. Please listen: open the page with `?debug=1`, tap to start, press 7 (sail) and 2 (water) to compare.
