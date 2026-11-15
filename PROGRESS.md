# Progress - Travel cue and New Year's Eve start on 30 December
Branch: fix/travel-sound-and-nye-start (made from main at bfd4df7)
Last updated: 2026-11-15

Steps, in this order: 1) replace the sail sound with a travel cue. 2) New Year's Eve mode starts on 30 December. 3) countdown over 24 hours ("1d 23:59:59"). 4) check in the browser with `?clock=`. 5) README.
(The notes of earlier tasks are in git history: see PROGRESS.md at commit bfd4df7.)

## Done
- Step 1: the sail sound is gone; the travel cue takes its place (`js/lifesound.js`, kind `travel`, still key 7 with `?debug=1`). It is made of: (a) "next stop": three soft bell notes going up (G, B, D: 784, 988 and 1175 Hz), each a pure tone with a faint higher ring, 0.4 s apart; (b) a very quiet low city hum: two low tones a fifth apart (about 100 and 150 Hz) and a little deep rumble (noise through a low-pass filter that moves between 160 and 300 Hz, never above). The hum fades in over about 2.5 s while the picture goes dark and fades out as the next city appears. The whole cue is 5.5 s (the sail is 5.6 s). No voices. `js/main.js` plays `travel` when a sail begins. Old sail code removed (the flaps, the creak, the swish and the pitch `glide`); the filter `sweep` stays because the hum uses it. Fades, the stop of every source, the limit of two life sounds, mute and the limiter are unchanged (the cue goes through the same path as every life sound). Tests: `tests/lifesound.test.js` (6 tests replace the 3 sail tests: sail gone, chime rises over a hum, not mainly noise, every noise below 400 Hz and very quiet with long fades, not the water sound, sweep built as ramps), `tests/voyage.test.js` (the hum peaks while the picture is dark). README: key 7. 356 tests pass.

## In progress
- nothing

## Next step
- Step 2: in `js/newyear.js` make `newYearState` active from 00:00 on 30 December (visitor's calendar) and `newYearWindow` start on 30 December. Update the tests in `tests/newyear.test.js` that say 30 December is an ordinary day. Update the debug line in `js/main.js` ("when 30 Dec begins").
- Step 3: `formatLongCountdown` shows "1d 23:59:59" from 24 hours up. Check the big clock still fits on a phone.

## Decisions
- The sound kind is renamed from `sail` to `travel`. It keeps place 7 in the list, so key 7 still plays it.
- The rumble (noise) is the quietest part: level 0.01, the bell notes 0.014, the hum tones 0.012 and 0.008.

## Problems / questions for the user
- The travel cue is checked by rule only. Please listen: open the page with `?debug=1`, tap to start, press 7. To hear it in place, turn voyage mode on and wait for "Sailing to ...".
