# Progress - BoomVoyage v1
Branch: feature/boomvoyage-v1
Last updated: 2026-11-10

## Done
- Step 1: Project skeleton. `index.html`, `css/style.css` (full UI shell), `js/main.js` (stub), `package.json` (only for `node --test`), `.gitignore`, `README.md`.
- Step 2: Canvas engine and particles. `js/particles.js` (pooled, capped), `js/fireworks.js` (11 burst types, comet, mine), `js/engine.js` (layers, trails, bloom, rippling water reflections, rockets, waterfall). Tap the sky to fire a shell.
- Step 3: Sydney scene. `js/scenes/sydney.js` (config: sky, skyline, water, rig, show palettes, sound tweaks), `js/scenes/kit.js` (shared drawing helpers), `js/scenes/index.js` (registry), `tests/scenes.test.js`. Checked in the browser at 1280x720: no console errors.

## In progress
- nothing

## Next step
- Step 4: Show choreography. Add `js/show.js` (pure, seeded show builder + cue runner) and `tests/show.test.js`; make "Launch now" play a show.

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

## Problems / questions for the user
- none
