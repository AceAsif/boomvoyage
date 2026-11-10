# Progress - BoomVoyage v1
Branch: feature/boomvoyage-v1
Last updated: 2026-11-10

## Done
- Step 1: Project skeleton. `index.html`, `css/style.css` (full UI shell), `js/main.js` (stub), `package.json` (only for `node --test`), `.gitignore`, `README.md`.
- Step 2: Canvas engine and particles. `js/particles.js` (pooled, capped), `js/fireworks.js` (11 burst types, comet, mine), `js/engine.js` (layers, trails, bloom, rippling water reflections, rockets, waterfall). Tap the sky to fire a shell.
- Step 3: Sydney scene. `js/scenes/sydney.js` (config: sky, skyline, water, rig, show palettes, sound tweaks), `js/scenes/kit.js` (shared drawing helpers), `js/scenes/index.js` (registry), `tests/scenes.test.js`. Checked in the browser at 1280x720: no console errors.
- Step 4: Show choreography. `js/show.js` (seeded show builder: opening, 3 random acts out of 7, bridge waterfall, finale; plus a cue runner that skips cues missed in a background tab), `tests/show.test.js`. "Launch now" plays a show. Measured in the browser at 1280x720: median frame 7 ms, 95% of frames under 14 ms, slowest 28 ms.
- Step 5: Schedule and countdown. `js/schedule.js` (pure, timestamp based), `tests/schedule.test.js` (9 tests: background sleep, uneven ticks, Launch now, m:ss format). Countdown, progress line and automatic shows are wired in `js/main.js`. 22/22 tests pass.
- Step 6: Sound engine and mute button. `js/audio.js` (Web Audio only: whoosh, whistle, boom, crackle, pop, waterfall hiss, ambient water/breeze/buoy bell, reverb + echo). Connected to engine events in `js/main.js`. Mute is saved in localStorage key `boomvoyage.muted`. Checked in the browser: audio signal measured during a show, mute survives a reload, no console errors.
- Step 7: Start overlay, UI and mobile polish. "Tap to start" unlocks audio and plays the first show; scene switcher menu built from the registry (choice saved in localStorage key `boomvoyage.scene`); fullscreen button; keys M / F / Space; controls dim after 6 s without input. Checked in the browser at 1280x720, 375x812 (phone portrait) and 740x360 (phone landscape): no console errors.
- Step 8: README. How to run, test, deploy to GitHub Pages, add a country, file map, and "Creative decisions". Added empty `.nojekyll` for GitHub Pages.

## In progress
- nothing

## Next step
- All 8 steps are done. The user opens the Pull Request from `feature/boomvoyage-v1` into `main` and squash-merges it, then turns on GitHub Pages (see README).

## Plan
1. Project skeleton and README
2. Canvas engine and particles
3. Sydney scene (`js/scenes/sydney.js` + `js/scenes/index.js`)
4. Show choreography (`js/show.js`)
5. Schedule and countdown with test (`js/schedule.js`, `tests/`)
6. Sound engine and mute button (`js/audio.js`)
7. Start overlay, UI and mobile polish
8. README: run, test, deploy to GitHub Pages, creative decisions

## Decisions
- ES modules loaded with `<script type="module">`. No build step, but needs a local server (`py -m http.server`).
- `package.json` exists only to set `"type": "module"` so Node can test the same files the browser uses. No dependencies.
- No web fonts (they are external files). Uses system serif/sans font stacks.
- `.claude/` is in `.gitignore` (local tool settings only).

- A show starts from the moment of launch; the 2-minute countdown is start-to-start. "Launch now" resets it to 2:00.
- If a show time passes while the tab is hidden, the show waits and plays once when the tab is visible again.
- Shells are launched from the waterline behind the skyline; tap/click on the sky fires one extra shell (an extra, not requested).
- Sound is synced by event, not by a second timeline: the engine emits `burst` on the frame it draws the burst.
- Master volume 0.8 and at most 3 booms per 0.1 s, to avoid distortion in the finale.

## Problems / questions for the user
- Sound was checked by measuring the signal level in the browser, not by ear. Please listen once and say if anything should be louder or softer.
- Not tested on a real phone or in Safari, only in the built-in Chromium browser at phone sizes.
- `gh` (GitHub CLI) is not installed, so the Pull Request was not opened; the user planned to open it himself.
