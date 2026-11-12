# Progress - Volume slider and postcard snapshot
Branch: feature/volume-and-postcard (made from main at b515faf)
Last updated: 2026-11-12

## Done
- (Earlier work is in main. See git history.)
- Step 1: Volume slider.
  - `js/volume.js` (new, pure rules): volume 0..1, default 1, full volume = master gain 0.8 (exactly today's level, nothing can be louder), squared curve, clamping, load and save in localStorage inside try/catch (key `boomvoyage.volume`), 0 acts as mute, the mute button and slider rules (`toggleSound`, `slideTo`).
  - `js/audio.js`: `setVolume`, `silent`; the master gain follows volume and mute, so fireworks, ambience and life sounds all follow. No single sound was changed. No sounds are made while silent.
  - `index.html`, `css/style.css`: a small popover with a range slider above the mute button. Opens on hover (mouse), on keyboard focus (Tab to the slider, arrow keys move it 5% a step), and on a phone after a tap on the mute button (closes after 4 s or a tap elsewhere). It is inside the controls, so ambient mode hides it.
  - `js/main.js`: wiring. The mute button works as before; if the slider is at 0 it brings full volume back. Moving the slider above 0 takes mute off. The mute icon shows "off" whenever nothing can be heard.
  - `tests/volume.test.js` (new, 11 tests). 216 pass.
  - Checked in real Chrome: full = gain 0.8, 40% = 0.128, saved as 0.4 and kept after reload, 0 = gain 0 and no sounds made, hidden in ambient mode, popover inside the screen at 1600x815 and 390x844. Looked at screenshots of both.
- Step 2: Postcard snapshot.
  - `js/postcard.js` (new): caption ("Paris · Show No. 4"), small line ("France · 12 November 2026"), file name (`boomvoyage-paris-show-4.png`), share-or-download choice, card sizes, and the drawing: the sky as it is on a paper-coloured card with a hairline, the BoomVoyage name and the caption. Wide pictures: name left, caption right. Tall pictures: words stacked in the middle. No personal names, no addresses.
  - Size: the picture uses the canvas's own pixels (sharp on high-DPI screens), is never made bigger, and its longest side is at most 1920 pixels.
  - `index.html`, `css/style.css`: camera button, first in the row. Phone portrait: the bottom grid has one more column (camera, link, ambient on the first row; Launch now, sound, fullscreen on the second). It is in the controls, so ambient mode hides it.
  - `js/main.js`: on press (or key P) the card is made once. Phones and tablets with a share sheet that takes files get the share sheet ("Postcard shared"; closing the sheet says nothing); everything else downloads the PNG ("Postcard saved"). The show does no extra work for it.
  - `tests/postcard.test.js` (new, 9 tests). 225 pass.
  - Checked in real Chrome and Firefox at 1600x815 (pixel ratio 1.5), 390x844 (3) and 844x390 (2): the button saves a PNG with the right name in 56 to 77 ms (Chrome), shows "Postcard saved", is disabled while busy, is hidden in ambient mode, and all six controls fit without touching the clock. Looked at the postcards from Paris (wide) and London (tall).
- Step 3: README: volume slider, postcard, keys, tests, file list, creative decisions.

## In progress
- nothing

## Next step
- The user opens the Pull Request for `feature/volume-and-postcard` and merges it. Do not merge into main from here.

## Measurements
- AFTER (this branch, same window): Chrome Sydney and Paris quiet 144 fps, heavy show 144 fps. Firefox quiet 144 fps; heavy show Sydney 69 and 73 fps, Paris 68 and 73 fps. Same as before within Firefox's usual swing (see the line below): nothing was added to the frame loop, the volume is one number on the master gain and the postcard only runs on a press.
- BEFORE (main; window 1600x815, pixel ratio 1.5, 144 Hz): Chrome Sydney quiet 144 fps, heavy show 144 fps. Firefox quiet 144 fps; heavy show Sydney 70 and 74 fps, Paris 87 and 104 fps (Firefox swings between about 73 and 100 from run to run, as noted in earlier tasks).

## Decisions
- The slider shows 0 while muted, because it shows what you hear. Unmuting brings the saved level back.
- Keyboard focus opening the popover is plain CSS (`:focus-within`). The test browser window does not hold focus, so this one thing was not checked by machine: on the hand-test list.

## Problems / questions for the user
- To test by hand (could not be checked by machine):
  1. Listen: the slider at full is as loud as before; lower is quieter for fireworks AND life sounds; at 0 there is silence and the mute icon shows "off".
  2. Keyboard: Tab to the mute button, Tab again to the slider (it should open), arrow keys move it, Esc closes it.
  3. Mouse: hover the mute button, the slider opens, and stays open while the mouse moves up onto it.
  4. Phone: tap the mute button: sound toggles and the slider opens for a few seconds.
  5. Phone: tap the camera: the share sheet opens with the picture. Desktop: the PNG downloads.
  6. Open a saved postcard and zoom in: it should be sharp.
