# Progress - Sail sound, phone postcard, New Year's Eve check
Branch: fix/sail-sound-and-phone-postcard (made from main at a79e5b1)
Last updated: 2026-11-15

Steps, in this order: 1) sail sound. 2) phone postcard shape and layout. 3) postcard taken at the moment of most light. 4) look at the phone postcards in five cities. 5) New Year's Eve mode in the debug panel.
(The notes of the earlier task "Grand voyage" are in git history: see PROGRESS.md at commit a79e5b1.)

## Done
- Step 1: sail sound rebuilt (`js/lifesound.js`). It is no longer wind noise with two notes. It is now: (a) cloth: four soft flaps, each a short thump (a triangle tone falling from 210 to 105 Hz in 0.2 s) with a tiny puff of air; (b) rope and wood: a slow creak, a very low sawtooth (24 to 43 ticks a second, speeding up) through two narrow filters (880 Hz and 1750 Hz), once long and once short; (c) one low, short swish at the end (noise through a low filter that opens from 200 to 520 Hz and closes again). The plan format gained `glide` (moving pitch) and `filter.sweep` (moving filter). Fades, the stop of every source, the limit of two sounds and the limiter are unchanged. Key 7 with `?debug=1` still plays it. `tests/lifesound.test.js`: 3 new tests (what the sail is made of, that it is not the water sound, that glides are built as ramps). 336 tests pass.
- Step 2: phone postcard shape (`js/postcard.js`). A screen more than 1.3 times taller than wide is "phone-shaped". Its picture is now 4:5: the full width of the screen, but only the rows with the city, a thin strip of water (6%) and the sky above (a very tall skyline moves the picture up a little, the waterline always stays in). The caption ("Dubai · Show No. 1") is first and about twice as big as before, the site name is under it. Wide screens go through the old code untouched. `postcardLayout` now also returns `source` (the part of the canvas used) and `phone`. Also here: `createMomentPicker`, the pure rule for when to take the picture (used in step 3). `tests/postcard.test.js`: 14 new tests (desktop layout compared with a copy of the old formula for 10 screen sizes, the 4:5 shape, full width, waterline, caption size, capture timing). 350 tests pass.
- Step 3: capture at the moment of most light (`js/main.js`). On a phone-shaped screen, while a show is on, the camera button now waits (message "Waiting for the brightest moment…") and keeps a copy of the brightest frame: it stops when the light has clearly passed a real peak, or after 3.5 seconds at most. Light is measured in the part of the sky that goes on the card (the engine's small glow picture shrunk to 16x20 pixels, read every second frame, only while waiting). A quiet sky, and every desktop postcard, is taken at once as before. If the city or the window changes during the wait, the frame already held is used. 350 tests pass.
- Step 4: looked at the phone postcard at 390x844 for Sydney, Dubai, New York, Tokyo and Hong Kong (asked for 1 second after the show began), and a desktop one at 1280x720. All five phone cards are 834x1152 pixels, the city is as wide as the frame, the caption is large. Found and fixed: the first measure of light picked the white flash at the instant of a burst. Now each small pixel of the measure counts only up to a low cap and the score is lowered while a flash is in the air, so an open burst wins. Numbers of the timing rule set from light measured on the page (one burst 0.7 to 0.9, finale 1 to 2). Desktop: taken at once (0 ms wait), 2006x1239 as before. 351 tests pass.

## In progress
- nothing

## Next step
- Step 5: New Year's Eve mode line in the `?debug=1` panel (on/off and start time). No behaviour change.

## Decisions
- The sail sound keeps every level at or below 0.03 (the old rule in `tests/voyage.test.js`), so it stays the quietest kind of sound.
- Noise is still used in the sail sound, but only as a small part: a puff on each flap and the short swish. Tests check that tones are the loudest and carry more sound than the noise.
- Phone card: the picture is exactly 4:5; the whole card with its caption band is a little taller (about 4:5.5). I first made the whole card 4:5, but then the picture was nearly square and the fireworks, which burst high on a phone, were cut off.
- Phone card caption order: place and show first and largest, site name below (on desktop it is unchanged).
- The "most light" wait is only for phone-shaped screens, because desktop postcards must stay as they are. To use it on desktop too, remove the `.phone` check in `bestMoment` in `js/main.js`.
- The wait is at most 3.5 seconds so that the phone's share sheet still opens (browsers only allow it shortly after a tap). If a browser refuses, the card is downloaded instead, as before.
- On a phone the fireworks burst high in the tall sky, so in a 4:5 picture the highest bursts touch or pass the top edge. The picture already takes as much sky as it can while keeping the waterline. The light is measured only inside the picture, so the frame chosen is one where the fireworks are in it.

## Problems / questions for the user
- The sail sound is checked by rule only. Please listen: open the page with `?debug=1`, tap to start, press 7 (sail) and 2 (water) to compare.
- In this session the built-in browser pane did not run animation frames by itself, so I drove the frames from a timer to test. Real timing on a real phone was not tested: please take a postcard on your phone during a show.
