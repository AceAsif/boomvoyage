# Progress - BoomVoyage v1
Branch: feature/boomvoyage-v1
Last updated: 2026-11-10

## Done
- Step 1: Project skeleton. `index.html`, `css/style.css` (full UI shell), `js/main.js` (stub), `package.json` (only for `node --test`), `.gitignore`, `README.md`.

## In progress
- nothing

## Next step
- Step 2: Canvas engine and particles. Add `js/particles.js`, `js/fireworks.js`, `js/engine.js`; wire in `js/main.js` so a tap on the sky fires a shell.

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
