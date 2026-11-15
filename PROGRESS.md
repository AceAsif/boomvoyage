# Progress - Travel cue and New Year's Eve start on 30 December
Branch: fix/travel-sound-and-nye-start (made from main at bfd4df7)
Last updated: 2026-11-15

Steps, in this order: 1) replace the sail sound with a travel cue. 2) New Year's Eve mode starts on 30 December. 3) countdown over 24 hours ("1d 23:59:59"). 4) check in the browser with `?clock=`. 5) README.
(The notes of earlier tasks are in git history: see PROGRESS.md at commit bfd4df7.)

## Done
- Step 1: the sail sound is gone; the travel cue takes its place (`js/lifesound.js`, kind `travel`, still key 7 with `?debug=1`). It is made of: (a) "next stop": three soft bell notes going up (G, B, D: 784, 988 and 1175 Hz), each a pure tone with a faint higher ring, 0.4 s apart; (b) a very quiet low city hum: two low tones a fifth apart (about 100 and 150 Hz) and a little deep rumble (noise through a low-pass filter that moves between 160 and 300 Hz, never above). The hum fades in over about 2.5 s while the picture goes dark and fades out as the next city appears. The whole cue is 5.5 s (the sail is 5.6 s). No voices. `js/main.js` plays `travel` when a sail begins. Old sail code removed (the flaps, the creak, the swish and the pitch `glide`); the filter `sweep` stays because the hum uses it. Fades, the stop of every source, the limit of two life sounds, mute and the limiter are unchanged (the cue goes through the same path as every life sound). Tests: `tests/lifesound.test.js` (6 tests replace the 3 sail tests: sail gone, chime rises over a hum, not mainly noise, every noise below 400 Hz and very quiet with long fades, not the water sound, sweep built as ramps), `tests/voyage.test.js` (the hum peaks while the picture is dark). README: key 7. 356 tests pass.
- Step 2: New Year's Eve mode starts at 00:00 on 30 December on the visitor's own calendar and time zone (`js/newyear.js`: `START_DAY = 30`, used by `newYearState` and `newYearWindow`). The end is unchanged: 90 seconds after midnight in New York. The `?debug=1` panel says "starts 30 Dec ..., = when 30 Dec begins in your time zone".
- Step 3: the big clock shows more than 24 hours with days: "1d 23:59:59", "2d 03:00:00" (`formatLongCountdown`). Under 24 hours it is as before ("23:59:59", "1:23:05", "2:05").
- Tests for steps 2 and 3 in `tests/newyear.test.js`: 4 new tests (on at the first second of 30 December and off one second before, in 7 time zones; the first countdown is to Sydney and is written with days; the end has not moved; the format around 24 hours) and 3 old tests changed from 31 to 30 December. 360 tests pass.
- Step 4: checked on the real page at phone size (390x844) with `?debug=1&clock=2026-12-29T12:59:52Z` (this computer's time zone is 11 hours ahead of UTC, so that is 8 seconds before its 30 December). Before: "new year mode: off", clock "2:00", "Next show in". Ten seconds later: "new year mode: on", "on since 30 Dec 2026, 00:00", clock "1d 23:59:58", label "midnight in Sydney Harbour in". The clock text is 190 pixels wide and does not touch the buttons; the page does not scroll sideways. The debug line lists "7 travel" and the cue played.
- Step 4 also: the travel cue was rendered to numbers in the browser (not heard). Loudest point 0.031 of full volume. Average level: bell notes 0.0039, hum tones 0.0049, rumble (the noise) 0.0004. So the noise is about one fifteenth of the cue. Silent at the end.
- Step 5: README updated (30 December start, days in the countdown, the 90 seconds after New York, key 7 travel).

## In progress
- nothing

## Next step
- Nothing left in this task. The user listens to the travel cue, then opens the Pull Request for `fix/travel-sound-and-nye-start`. Do not merge into main from here.

## Decisions
- The sound kind is renamed from `sail` to `travel`. It keeps place 7 in the list, so key 7 still plays it.
- The rumble (noise) is the quietest part: level 0.01, the bell notes 0.014, the hum tones 0.012 and 0.008.
- Steps 2 and 3 are in one commit: the first countdown on 30 December is longer than a day, so the new start date and the new format are tested together.
- On 30 December everything else in the mode works as on 31 December: ordinary shows every two minutes, and the page only goes to a city 10 seconds before its midnight. Only the big clock is different for one more day.

## Problems / questions for the user
- The travel cue is checked by rule and by numbers only, not by ear. Please listen: open the page with `?debug=1`, tap to start, press 7. To hear it in place, turn voyage mode on and wait for "Sailing to ...".
- The low hum (about 100 and 150 Hz) may be hard to hear on a small phone speaker; the bell notes will be heard everywhere. Say if you want the hum higher or louder.
- To try the new start yourself: add `?debug=1&clock=2026-12-30T00:00:00+11:00` (put your own time zone offset in place of `+11:00`).
