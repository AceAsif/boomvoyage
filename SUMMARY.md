# BoomVoyage: summary

One page. Details are in `README.md` and `Website links for testing.md`.

## 1. What is made

- **Cities:** Sydney, Dubai, Paris, London, New York, Tokyo, Hong Kong.
- **Shows:** a new fireworks show every 2 minutes.
- **Sound and mute:** made live in the browser.
- **Volume:** a slider, remembered.
- **Voyage mode:** sails to the next city before each show.
- **New Year's Eve mode:** from 30 December, a countdown to each city's midnight.
- **Postcards:** save a picture of the sky; 4:5 on phones.
- **Hold-and-drag:** tap for a shell, hold for a big one, drag for comets.
- **Station voice:** "Next stop, Tokyo" in voyage mode. Station voice made with ElevenLabs.
- **Share links:** a link replays the same show.
- **Install as app:** on a phone's home screen.

## 2. How it works

Plain HTML, CSS and JavaScript. No framework, no build step.

- `index.html`, `css/style.css`: the page and its look.
- `js/main.js`: connects everything.
- `js/engine.js`, `js/fireworks.js`: draw the city and the sparks.
- `js/show.js`: builds a show from a seed number.
- `js/schedule.js`: the 2-minute clock.
- `js/audio.js`, `js/lifesound.js`, `js/voice.js`: sound.
- `js/voyage.js`, `js/newyear.js`, `js/postcard.js`, `js/touch.js`, `js/link.js`: one feature each.
- `js/scenes/`: one file per city.

**A show:** the clock reaches zero, `show.js` turns a seed into timed cues, and the engine fires each one on time.

**A new city:** copy a file in `js/scenes/`, change the drawing, colours and `timeZone`, and add it to `js/scenes/index.js` (README, "Add a place").

## 3. Tests

- **Automated:** 400 tests pass (`node --test`). They cover every feature above.
- **By hand, still to do:**
  - Frame rate in Chrome and Firefox (`?debug=1`).
  - Every city on a phone, upright and sideways.
  - Hold-and-drag on a phone: no scrolling or zooming.
  - Link preview in a chat app.
  - Install as app.
  - New Year's Eve links (passed on a desktop).
  - Station voice on a phone.

## 4. Future improvements

1. **Licence first:** the voice clips come from the free ElevenLabs plan. It needs the credit and is for non-commercial use only (check their terms). Replace them with licensed clips before the site makes money.
2. A show director: choose acts and colours yourself.
3. More cities.
4. The voice in other languages.
5. Offline use (nothing is saved today, the clips included).
6. A key for the station voice switch.
