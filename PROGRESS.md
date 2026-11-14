# Progress - Grand voyage (three cities, Voyage mode, New Year's Eve mode)
Branch: feature/grand-voyage (made from main at 3bb787b)
Last updated: 2026-11-14

Phases, in this order: A) New York, Tokyo, Hong Kong. B) Voyage mode. C) New Year's Eve mode.
Rule: a city is added to `js/scenes/index.js` only in the commit where it is finished and tested.

## Done
- (Earlier work is in main. See git history.)
- Step A0: shared building blocks. `js/show.js`: new acts `marquee`, `kiku`, `pairs`, `dragon`; new openings `salvo`, `single`, `sweep`; new signature acts `starmine` (anchor sets `bridge`, `towers`) and `beams` (anchor set `roofs`). `js/engine.js`: new cue kind `beams` (light beams sweeping the sky behind the skyline, a few see-through triangles per frame). `js/lifesound.js`: three more quiet sounds `bell`, `furin`, `gong`, built by the same rules (fades, stop, two at once). `js/main.js`: with `?debug=1` keys 1 to 6 play the six life sounds. Old cities' shows did not change (their tests pass).
- Step A1: New York (`js/scenes/newyork.js`, registered). Empire State Building, an art-deco neighbour, a downtown glass tower, the Statue of Liberty small at the left edge, the Brooklyn Bridge with stone towers and cables. Middle act: the waterfall hangs from the bridge's main cables ("Bridge of Light"), with a fan of comets from the Empire State antenna. Opening `salvo`, own act `marquee` ("Broadway"), six themes, loud finale mix. Life: ferry (horn), tug (water), helicopter (behind), yellow cabs on the bridge (behind: they pass behind the stone towers), rooftop steam (behind), Empire State crown lights changing colour (chime), channel buoy (bell). Portrait: Empire State left of the middle, bridge shorter beside it. `tests/newyork.test.js` (7 tests). Looked at in real Chrome: 1600x815, 390x844, 844x390, 1024x768, idle, bursts, waterfall and all life events. 253 tests pass.
- Step A2: Tokyo (`js/scenes/tokyo.js`, registered). Tokyo Tower in orange and white, the pale Skytree, the Rainbow Bridge across the bay with coloured cable lights, a five-storey pagoda, a faint Mount Fuji, a large low moon with a cloud across it. Japanese style show: opening `single` (one great chrysanthemum alone), acts `kiku` and `pairs` (every shell has a twin), signature `starmine` fired from ten mirrored points along the bridge, round finale mix, Japanese act names, six themes. Life: lantern houseboat (water), glass water bus (horn), train on the bridge (behind the bridge towers), landing plane (behind), festival lanterns along the shore (furin), ring of light climbing the Skytree (chime). Portrait: both towers move in, bridge shorter. `tests/tokyo.test.js` (9 tests). Looked at in real Chrome: 1600x815, 390x844, 844x390, 1024x768, bursts, Star Mine and all life events. 277 tests pass.
- Step A3: Hong Kong (`js/scenes/hongkong.js`, registered). A wall of glass towers in front of the dark ridge of the Peak: a tower with a face of coloured lights, a braced prism with two masts, the tallest with a crown of fins, a slim one edged in green, and a low hall with curved roofs on the water. Show: opening `sweep`, act `dragon` ("Golden Dragon"), signature `beams`: six light beams sweep the sky from the rooftops in the colours of the show, first together and then crossing (our own design). Six themes, own act names. Life: green-and-white harbour ferry (horn), red-sailed junk (gong), sampan (water), tower windows, the tallest crown changing colour (chime), the Peak tram lights (behind the towers), mist on the ridge (behind). `tests/hongkong.test.js` (9 tests, one checks that all seven places differ in signature, finale name, theme names and sky). Looked at in real Chrome: 1600x815, 390x844, 844x390, 1024x768, bursts, beams and all life events. 301 tests pass.
- Phase B: Voyage mode. `js/voyage.js` (new, pure rules): city order and wrap-around, "Stop 3 of 7", when to paint the next city, when to sail (only with voyage on, in the quiet stretch, no show, no sparks, no life events on screen, tab visible, and only if the whole sail fits before the next show), the fade timeline, the saved choice. `js/engine.js`: `viewFor`, `prepare(scene)` paints another city offscreen in four small steps and `adopt()` shows it without painting. `js/main.js`: sailboat button (aria-pressed, key V, saved in localStorage, `?voyage=1` / `?voyage=0`), the sail (fade to night, caption "Sailing to Tokyo" / "Stop 6 of 7", a thin progress line, fade in), `arrive()` changes the city without starting a show or touching the schedule, life events are told to finish 10 s before the show. "Launch now" during a sail arrives at once, then starts the show; switching voyage off or picking a city by hand before the change cancels the sail. Reduce motion: a slower fade. Hidden tab: the sail waits (it runs on drawn frames). Quiet sound `sail` (wind and two soft notes) through the life-sound rules, so mute and volume apply. `js/link.js`: `voyage` option. `index.html`, `css/style.css`: button, overlay, phone grid (Launch now, voyage, sound, fullscreen on the second row). `tests/voyage.test.js` (16 tests). 319 tests pass. Checked on the real page in Chrome and Firefox: painting starts 17 s before the show and is done 16 s before; the sail starts 10 s before and the city is in place 4.4 s before; the show starts on time in the new city; countdown untouched; all seven buttons fit at 390x844.

## In progress
- nothing

## Next step
- Step A4: measure every new city in Firefox and Chrome.
- Phase C: New Year's Eve mode (real time zones with Intl, midnight order, longer finale show, `?clock=` fake time for testing).
- README: creative decisions for each city and both modes, link options table. Final report.

## Measurements
- Frame rates per city are measured at the end of phase A and during a voyage transition in phase B.

## Decisions
- Before every commit check `git branch --show-current` says `feature/grand-voyage`.
- New cities reuse the engine. Only one new engine effect was added (sky beams). Nothing in the old cities' files changed.
- New York's bridge towers are the foreground half of its skyline, so traffic on the roadway is hidden behind them.
- Voyage mode sails just before the next show, not just after the last one: each city gets its arrival, its show and its quiet minute with life events, then we leave.

## Problems / questions for the user
- none
