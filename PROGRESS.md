# Progress - Share link, act names, ambient mode
Branch: feature/share-acts-ambient
Last updated: 2026-11-10

## Done
- (Earlier work is merged in main: v1, ghosting fix, phone portrait, Opera House. See git history.)
- Step 1: Share link. `js/link.js` (new, pure: `parseLink`, `buildShareLink`, `slugify`), `js/show.js` (`buildShow` takes `opts.theme`; show has `themeId`; same seed + same theme id gives exactly the same show), `js/main.js` (first show comes from the link; "Copy link" copies `?scene=&seed=&theme=` of the last show; fallback box with the link if copying is blocked), `index.html` / `css/style.css` (link button, "Link copied" toast, link box, phone bottom grid with room for the ambient button). Tests: `tests/link.test.js` (11), 4 new in `tests/show.test.js`. 37/37 pass. Checked in the browser at 390x844 and 1280x720 (toast and fallback box).
- Step 2: Act names. `js/show.js`: `buildShow` records a `timeline` (key, label, index, start, end; acts have no gaps), new `actAt(show, elapsed)` and `ACT_LABELS` (a scene can override with `show.actLabels`). `index.html` / `css/style.css`: caption ("Act 2 of 6" + act name) just above the controls, outside the idle dimming. `js/main.js`: `showAct()` fades the words out and in; with reduced motion they change at once. 8 new tests in `tests/show.test.js`. 45/45 pass. Checked in the browser: all six acts appeared in order and the caption cleared at the end.
- Step 3: Ambient mode. `js/wakelock.js` (new: Screen Wake Lock API, then a silent-video fallback, then nothing; re-asks when the tab is shown again), `js/main.js` (`setAmbient()`, `?ambient=1`, button, key A, tap or Esc leaves, a tap does not fire a shell), `index.html` / `css/style.css` (button, `body.ambient` hides the controls and captions with a fade, cursor hidden; a short hint toast stays when entering by button or key). 9 tests in `tests/wakelock.test.js`. 54/54 pass. Checked in the browser: `?ambient=1` start note, controls hidden after start, tap and Esc leave, lock released on leaving; in the test browser the Wake Lock API was refused and the silent-video fallback took over. Phone portrait 390x844 and 360x740 and desktop 1280x720 checked.
- Step 4: README (link options table, ambient mode, keys, tests list, file map, act labels, creative notes) and last checks. Found and fixed: on a low landscape phone (844x390) the caption sat on the bridge; it is now one line on the water above the controls (`css/style.css`, `@media (max-height: 460px)`). Looked at screenshots: 1280x720, 390x844, 360x740, 844x390, 768x1024. No console errors. 54/54 tests pass.

## In progress
- nothing

## Next step
- All steps are done. The user opens the Pull Request from `feature/share-acts-ambient` into `main` and merges it.

## Decisions
- The link carries scene + seed + theme id. The theme is needed because a show's colour theme can depend on the previous show (it avoids repeating), which the receiver does not have.
- A shared link plays as the receiver's FIRST show only. After that, shows are random as usual.
- A link with an unknown `scene` is ignored for the show (it cannot be reproduced); bad `seed` / `theme` values are ignored too.
- The link keeps the page folder, so it works on GitHub Pages.
- The "Copy link" button is an icon (like mute and fullscreen) to keep the controls row calm.
- Ambient mode: a tap leaves it and does not fire a shell; Esc also leaves. The hint toast is shown only when entering by button or key, not for `?ambient=1` links (the start screen explains it there).
- Act captions live outside the controls' idle dimming, so they stay readable.
- Phone bottom area is now a 3-column grid: clock + two small buttons on the first row, Launch now + mute + fullscreen on the second row (the second row looks as before).

## Problems / questions for the user
- Wake Lock: in the built-in test browser the API was refused, so only the silent-video fallback was seen working there. The real API path is covered by tests with a pretend browser, not by a real phone or TV.
- Not tested on a real phone, Safari or a smart TV browser.
- Copying to the clipboard was refused in the test browser, so only the fallback box was seen there for real. The "Link copied" toast was checked with a stubbed clipboard.
