# Progress - Test links file, and hold-and-drag shells
Branch: feature/hold-and-drag (made from main at da5a20a)
Last updated: 2026-11-15

Two jobs, in this order. Job 1: fix and complete `Website links for testing.md` (no code changes). Job 2: hold-and-drag shells (tap = normal shell, long press = one big shell with a growing ring, drag = a fan of comets along the path).
(The notes of earlier tasks are in git history: see PROGRESS.md at commit da5a20a.)

## Done
- Job 1: `Website links for testing.md` rewritten (the file name has spaces, not underscores; it was kept). Every link uses a plain `&`; all 9 backslash links fixed, the duplicate Paris link and the empty heading removed. The owner's bold labels are kept. New sections: 1) one link per city, with and without debug; 2) New Year's Eve START test for Hobart (clock `2026-12-29T12:59:50Z`), with how to write the time for another zone (`clock=2026-12-29T23:59:50%2B11:00`); 3) MIDNIGHT test per city, 40 s before its real midnight, with a table of the time zones from the code; 4) END test (`2027-01-01T05:01:20Z`); 5) voyage and ambient links; 6) keys; 7) hand-test checklist. No code changed. 360 tests pass.
- Job 1 checks. The times were worked out by running the project's own `js/newyear.js` in Node. All 41 links in the file were read by the project's own `parseLink`: every `scene` and `clock` is accepted. In the browser (local copy, same code as main): each of the 7 scene links opens its city; each of the 7 MIDNIGHT links shows "new year mode: on · next midnight (that city)" and "0:39"; the Tokyo one was run to the end ("Midnight in Tokyo · Happy New Year 2027", then the clock went on to Hong Kong); START went from off to on with "1d 23:59:57"; END went from on to off; voyage, voyage=0, ambient and both together did what the labels say. One START link was also opened on the live site (https://aceasif.github.io/boomvoyage/): same result, so the live site has the 30 December change.
- Job 2, step 1: `js/touch.js` (new, pure rules): a press is a tap (lifted before 0.5 s), a long press (still down at 0.5 s, fired at once, not on release) or a drag (moved more than 6 px with a mouse, 12 px with a finger, before 0.5 s); the ring (nothing for the first 0.12 s, full at 0.5 s); a path gives one comet place every 30 px however the pointer events arrive; the comets turn left and right by turns and lean the way the path goes (a fan); the tap shell and the big shell (size 1.7, density lowered so it has no more sparks than a shell of size 1); limits (taps: 4 at once then 3 a second; big: one every 1.25 s; comets: 10 a second; slower on quality steps 2 and 3 and with reduce motion; nothing when the sky is 60% full for comets, 85% for shells); the visitor's own seeded random generator. `tests/touch.test.js`: 23 tests. 383 tests pass.
- Job 2, step 2: wired in. `js/main.js`: pointer events on the canvas (down, move, up, cancel) for mouse, touch and pen, up to two fingers; pointer capture so a drag may leave the canvas; the ring (`#holdRing`, a CSS animation whose times are set from `HOLD_MS`); a tap fires on release, as it must wait to see it is not a long press or a drag; the browser's own long-press menu is stopped on the canvas; the `?debug=1` panel shows "your fireworks: n shells, n big, n comets, n held back by the limits". `js/engine.js`: `launchAt(x, y, spec, rand)` takes the shell and the visitor's generator; new `drawnComet`. `js/fireworks.js`: `comet` has an optional tail size (a show's comet is unchanged: 70; a drawn comet: 34). `css/style.css`: `touch-action: none` and no text selection on the canvas; the ring. `index.html`: the ring element. Sound: the big shell and tapped shells go through the engine's own launch and burst reports (same limiter, mute works); drawn comets make a launch sound at most 5 times a second. 2 more tests (page set-up, keys). 385 tests pass. Checked in the Chromium pane with made-up pointer events: tap gives 1 shell, hold gives 1 big shell (size 1.7) and the ring ends, a 800 px drag gave 13 comets with 16 held back by the limits, nothing left pressed afterwards, canvas `touch-action` is `none`.

## In progress
- nothing

## Next step
- Job 2, step 3: look at it at desktop, phone upright (390x844) and phone sideways (844x390); check the frame rate with `?debug=1` while playing; fix what looks wrong.
- Job 2, step 4: README (a "Play in the sky" part and the test list), and a "Hold-and-drag" section in `Website links for testing.md`.

## Decisions
- Job 1: the browser used for the checks is the Chromium browser inside the Claude app, not a separately installed Chrome.
- Job 1: START links cannot be right for every visitor, because the start depends on the visitor's time zone. The file says so and shows how to write the time with your own offset.
- Job 2: a tap now fires when the finger is lifted (before: when it went down), because the page must first see that it is not a long press or a drag.
- Job 2: the long press fires at 0.5 s while the finger is still down (the ring is full at that moment). Lifting later fires nothing more.
- Job 2: taps are now limited too (4 at once, then 3 a second). Before there was no limit.
- Job 2: `touch-action` on the canvas went from `manipulation` to `none`. The buttons and the menu are not part of the canvas and work as before.

## Problems / questions for the user
- (from the last task, still open) Please listen to the travel sound: `?debug=1`, tap to start, press 7.
