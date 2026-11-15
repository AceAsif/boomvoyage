# Progress - Test links file, and hold-and-drag shells
Branch: feature/hold-and-drag (made from main at da5a20a)
Last updated: 2026-11-15

Two jobs, in this order. Job 1: fix and complete `Website links for testing.md` (no code changes). Job 2: hold-and-drag shells (tap = normal shell, long press = one big shell with a growing ring, drag = a fan of comets along the path).
(The notes of earlier tasks are in git history: see PROGRESS.md at commit da5a20a.)

## Done
- Job 1: `Website links for testing.md` rewritten (the file name has spaces, not underscores; it was kept). Every link uses a plain `&`; all 9 backslash links fixed, the duplicate Paris link and the empty heading removed. The owner's bold labels are kept. New sections: 1) one link per city, with and without debug; 2) New Year's Eve START test for Hobart (clock `2026-12-29T12:59:50Z`), with how to write the time for another zone (`clock=2026-12-29T23:59:50%2B11:00`); 3) MIDNIGHT test per city, 40 s before its real midnight, with a table of the time zones from the code; 4) END test (`2027-01-01T05:01:20Z`); 5) voyage and ambient links; 6) keys; 7) hand-test checklist. No code changed. 360 tests pass.
- Job 1 checks. The times were worked out by running the project's own `js/newyear.js` in Node. All 41 links in the file were read by the project's own `parseLink`: every `scene` and `clock` is accepted. In the browser (local copy, same code as main): each of the 7 scene links opens its city; each of the 7 MIDNIGHT links shows "new year mode: on · next midnight (that city)" and "0:39"; the Tokyo one was run to the end ("Midnight in Tokyo · Happy New Year 2027", then the clock went on to Hong Kong); START went from off to on with "1d 23:59:57"; END went from on to off; voyage, voyage=0, ambient and both together did what the labels say. One START link was also opened on the live site (https://aceasif.github.io/boomvoyage/): same result, so the live site has the 30 December change.

## In progress
- nothing

## Next step
- Job 2, step 1: new file `js/touch.js` with the pure rules (no page, no canvas): when a press is a tap, a long press or a drag; how the ring grows; how a drawn path becomes comets; limits on shells per second. Tests in `tests/touch.test.js`.
- Job 2, step 2: wire it into `js/main.js` and `js/engine.js` (pointer events for touch and mouse, the ring, the big shell, the comets, `touch-action: none` on the canvas).
- Job 2, step 3: look at it at desktop, phone upright and phone sideways sizes; frame rate with `?debug=1`.
- Job 2, step 4: README, and a "Hold-and-drag" section in the links file.

## Decisions
- Job 1: the browser used for the checks is the Chromium browser inside the Claude app, not a separately installed Chrome.
- Job 1: START links cannot be right for every visitor, because the start depends on the visitor's time zone. The file says so and shows how to write the time with your own offset.

## Problems / questions for the user
- (from the last task, still open) Please listen to the travel sound: `?debug=1`, tap to start, press 7.
