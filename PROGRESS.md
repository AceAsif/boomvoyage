# Progress - Life layering (behind or in front of landmarks)
Branch: fix/life-layering (made from main at 420ffa8, which has the life-between-shows work)
Last updated: 2026-11-12

## Done
- (Earlier work is in main. See git history.)
- Step 1: Looked at the problem in real Chrome, zoomed in, before changing anything.
  - Sydney, desktop and phone: the car lights on the bridge deck were drawn on top of the Opera House sails. On the phone a hand-written rule tried to hide the city windows behind the sails.
  - London, phone: the travelling lights at the foot of the wheel were drawn on top of Westminster Bridge and the bus.
  - Dubai and Paris: no wrong overlap (the plane and the birds were already behind the whole skyline).
- Step 2: Two layers. `js/life.js`: every event must declare `layer: 'behind'` or `'front'` (`createLife` throws on anything else); `drawLandWithLife` draws backdrop, then "behind" events, then foreground. `js/engine.js`: the skyline can be painted as two halves (`landHalves`), only when a "behind" event is on screen; otherwise the same single picture as before. "front" events are drawn last, over the water. `js/main.js`: gives the engine the list of events.
- Step 3: Every scene has `drawBackdrop` and `drawForeground`; `drawSkyline` calls both, in the same order as before, so the still picture did not change.
  - Sydney: backdrop = far shore, city, bridge. Foreground = Opera House.
  - Dubai: backdrop = other towers, mall. Foreground = Burj Khalifa, palms.
  - Paris: backdrop = city, Montmartre, dome, trees, river wall. Foreground = tower, bridge.
  - London: backdrop = far city, County Hall, Abbey, wheel. Foreground = palace, clock tower, river wall, bridge.
- Step 4: Layer of every life event.
  - Sydney: ferry front, yacht front, star behind, citylights (windows + bridge cars) behind, beacon behind. The hand-written phone rule for windows is gone.
  - Dubai: dhow front, abra front, plane behind, pulse (light on the Burj) front, fountain front.
  - Paris: bateau front, barque front, sparkle front, birds behind, cloud behind.
  - London: riverbus front, tug front, wheel behind, clock front, bus front.
- Step 5: Tests (193 pass): layer must be valid, "behind" is drawn after the backdrop and before the foreground, halves are only asked for when needed, backdrop + foreground make the same drawing calls as the whole skyline at seven screen sizes, every scene has both kinds.
- Step 6: Checked in real browsers.
  - Zoomed pictures after: Sydney cars and windows are hidden by the sails (desktop and phone), London wheel light goes behind the bridge (phone).
  - "Backdrop then foreground" compared with the one-piece skyline, pixel by pixel, all four cities, 1600x815 and 390x844. Chrome: biggest difference 2 of 255 (one pixel 5). Firefox: 2 of 255, except Sydney 6 to 8 of 255 on up to 272 edge pixels. Not visible. First run found a real difference in London (clock hands had square ends in the halves, because a line style was carried over from the wheel); fixed.
- Frame rate: main and this branch measured back to back in real browsers (window 1600x815, pixel ratio 1.5, 144 Hz), all four cities. Chrome: quiet 144 fps, heavy show 144 fps, all life events forced on at once 144 fps, on main and on this branch. Firefox: quiet 144 fps and all life events on 144 fps (143.5 once on main), on both. Firefox heavy show: between 68 and 102 fps on main and on this branch alike. It is about 73 fps when the automatic quality step stays off and about 100 fps when it switches on, and which one happens changes from run to run on both (Paris, three pairs of runs: branch 80, 101, 73; main 98, 73, 73). No difference between main and this branch. No life event runs during a show, so the show draws the same single skyline picture as before.

## In progress
- nothing

## Next step
- The user opens the Pull Request for `fix/life-layering` and merges it. Do not merge into main from here.

## Decisions
- Two layers only, as asked. The old "sky" layer became "behind", the old "land" and "water" layers became "front".
- The halves are extra pictures in memory (two more the size of the screen), painted on first use after a resize.
- Before every commit check `git branch --show-current` says `fix/life-layering`.

## Problems / questions for the user
- none
