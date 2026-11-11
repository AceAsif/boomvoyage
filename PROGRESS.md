# Progress - Dubai, Paris and London scenes
Branch: feature/dubai-paris-london
Last updated: 2026-11-11

## Done
- (Earlier work is merged in main: v1, ghosting fix, phone portrait, Opera House, share link, act names, ambient mode, Firefox speed fix. See git history.)
- Step 1: Scene system changes. No new city yet; Sydney is unchanged (a test pins three Sydney shows by seed).
  - `js/show.js`: a scene's `show` can now set `acts` (which middle acts may be picked), `opening` (classic, tower, duet, strikes), `signature` (spire, glitter, wheel; takes the waterfall's place), `finaleTypes`, `actLabels`. Four extra acts: fountain, palms, waltz, chimes. `SIGNATURE_RIG` says which anchor sets a signature needs from the scene's `rig()`.
  - `js/engine.js`: cue `crown` can use any anchor set (`set`, `only`, `step`); new cue `at` (small bursts right at anchor points); new cue `glitter` (twinkling points drawn in FRONT of the skyline). `js/particles.js`: `front` particles. `js/fireworks.js`: `density` for tiny bursts.
  - `js/scenes/kit.js`: shared helpers `shifted`, `haze`, `boat`.
  - `index.html` / `js/main.js`: no fixed Sydney text any more. Start-screen line, "Stop 0N", page title and canvas label come from the scene; brand line is now "Fireworks from the world's waterfronts"; menu says "places".
  - Tests: `tests/flavour.test.js` (11), generic checks for every scene in `tests/scenes.test.js` (link opens it, texts, themes, acts, signature anchors on every screen size, drawing runs on a pretend canvas at 7 screen sizes), `tests/helpers/fake-canvas.js`. 94/94 pass.
  Screenshots looked at: Chrome 1600x815, 390x844, 844x390 (idle and signature); Firefox 360x740, 1024x768, 768x1024 (bursts).
  Speed, heavy load plus the signature act, 1600x815 at pixel ratio 1.5, 144 Hz: Firefox 160 about 100 fps (typical 7.0 ms, slow 13.9 ms, worst 13.9 ms; fireworks layer at 80%), Chrome 157 144 fps (typical 6.9 ms, slow 7.0 ms; layer at 100%).
  Bug found and fixed here: glitter particles were not drawn at all (a line of no length draws nothing). `js/particles.js` now draws front particles as small glints. This also fixed the facade glitter in Dubai's signature act.
  Screenshots looked at: Chrome 1600x815, 390x844, close-up of the glitter; Firefox 360x740, 844x390, 768x1024, 1024x768.
  Speed, same test as Dubai: Firefox 160 about 101 fps (typical 7.0 ms, slow 13.9 ms, worst 13.9 ms; layer at 80%), Chrome 157 144 fps (typical 6.9 ms, slow 7.0 ms; layer at 100%).
  Screenshots looked at: Chrome 1600x815 and 390x844 (idle and signature); Firefox 844x390 and 768x1024 (bursts); 360x740 and 1024x768 were taken and passed the layout tests.
  Speed, same test: Firefox 160 about 102 fps (typical 7.0 ms, slow 13.9 ms, worst 13.9 ms; layer at 80%), Chrome 157 144 fps (typical 6.9 ms, slow 7.0 ms; layer at 100%).

## In progress
- nothing

## Next step
- All steps are done. The user opens the Pull Request from `feature/dubai-paris-london` into `main` and merges it.

## Decisions
- New show options are all optional; a scene that sets none gets exactly the old shows (needed so Sydney share links keep working).
- Extra acts are NOT added to the classic list, because Sydney picks from that list by seed.
- "Stop 0N" is the scene's place in `js/scenes/index.js`.

## Problems / questions for the user
- Measured on one PC only (144 Hz screen, pixel ratio 1.5). Phone and tablet sizes were checked in desktop Chrome and Firefox set to those sizes, not on real devices.
- Sound was not listened to; each city only changes the existing sound settings (reverb, echo, pitch, ambience).
- Reduced-motion mode was not looked at for the new cities (the glitter has no flicker and half the rate there; covered by code, not by a screenshot).
- No reference pictures were looked up; the landmarks are drawn from knowledge of them.
- The brand line changed from "harbours" to "waterfronts" (Paris and London are river cities). Say if you want the old words back.
