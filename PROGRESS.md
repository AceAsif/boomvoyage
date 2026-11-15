# Progress - Station voice, and a one-page summary
Branch: feature/station-voice (made from main at 2b958b1)
Last updated: 2026-11-15

Two jobs, in this order. Job 1: the station voice of voyage mode ("Next stop, <city>"), its switch, `?voice=0`, the credit. Job 2: a new one-page `SUMMARY.md`.
(The notes of earlier tasks are in git history: see PROGRESS.md at commit 2b958b1.)

## Done
- Step 0: main is up to date. `audio/` has exactly the seven clips with the right names. Sizes in bytes: sydney 47,030; tokyo 48,283; hongkong 49,537; dubai 45,776; paris 48,283; london 47,030; newyork 49,537. Total 335,476 bytes (about 328 KB). Decoded in the browser: each is 1.8 to 2.0 seconds, one channel, 48 kHz, loudest point 0.35 to 0.55 of full scale. The clips were not renamed, edited or re-encoded.
- Job 1, step 1: `js/voice.js` (new, pure rules): the clip for each place (`voiceFile`), the on/off choice (on by default, key `boomvoyage.voice`), the link option, when a clip may be loaded (`shouldLoadVoice`: voyage on, voice on, and the visitor has tapped), when it starts (1.7 s after the travel cue begins, so right after the third bell note; a clip that arrives more than 1.2 s late is skipped), the level (0.4) and the one credit text `VOICE_CREDIT`. `js/link.js`: option `voice` (`?voice=0` off, `?voice=1` on). `tests/voice.test.js`: 15 tests. `tests/link.test.js`: the expected objects gained `voice: null`.
- Job 1, step 2: playing and the switch. `js/audio.js`: `loadVoice` (fetch and decode once, null on any failure, tried again next time), `say` (one voice at a time, through the dry path, the master volume and the limiter, nothing when muted or hidden), `hushVoice` (fade of 0.25 s). It uses the AudioContext that the first tap unlocked, not an audio element. `js/main.js`: the voice is said when a voyage sail begins (not on a New Year's Eve trip to a midnight city, whose caption is "Midnight in ..."); the next stop's clip is loaded at the first tap, when voyage mode or the voice is switched on, when a city is picked by hand, and on arrival (so a whole show early); the voice is faded away if a show starts during a sail or voyage mode is switched off; the `?debug=1` panel says "station voice: on/off". `index.html` and `css/style.css`: a speech-bubble switch next to the sailboat, in the same style, shown only while voyage mode is on; on phones the bottom rows make room for it (four buttons of 42 px, the clock takes two columns).
- Job 1, step 3: the credit. The words are only in `js/voice.js`. The page shows them as a small line at the foot of the city menu. The README says it in the voyage part, and `SUMMARY.md` will. `js/voice.js` has a note on how to remove it later. README: 8 lines in "Voyage mode", one row in the link options table, one line each in the test list and the file list (two in the file list). `Website links for testing.md`: station voice links, what to see and hear, one checklist line.
- Job 1 checks in the browser (Chromium pane, phone size 390x844, frames driven by a timer). Before the first tap: no clip is fetched. After the tap with voyage on: only the next stop's clip (Dubai from Sydney). A real sail was run: caption "Sailing to Dubai", the voice began 1.7 s after the chime and ended 1.8 s later, the city changed, and London (the stop after) was fetched on arrival. With `?voice=0`: switch off, no clip fetched, the saved choice untouched. A second clip replaces the first (never two). Muted: nothing plays. A missing file: silence, nothing on the page (the browser's own network log notes the 404). Switch on: saved as "1", the clip is fetched, message "Station voice on". Voyage off: the switch is hidden. The bottom rows fit at 390 px (clock 208 px wide, nothing overlaps, no sideways scroll). 400 tests pass.
- Job 2: `SUMMARY.md` (new, repo root): one page, 398 words by `wc -w` (that count includes list marks, so the real words are fewer), four parts: what is made, how it works, tests (400 pass), future improvements with the licence note first. It has the credit line (a test checks it). README.md was not changed for it. The hand-test list is marked "still to do" because none of those was done on a real phone or in Firefox in these sessions; the New Year's Eve links passed on a desktop.

## In progress
- nothing

## Next step
- Nothing left in this task. The user listens to the station voice on a phone, then opens the Pull Request for `feature/station-voice`. Do not merge into main from here.

## Decisions
- The switch is shown only while voyage mode is on, because the voice is only heard there and a phone has no room for an eighth button otherwise.
- No voice on the New Year's Eve trip to a midnight city: the picture says "Midnight in Tokyo", not "Sailing to Tokyo", and the clips say "Next stop".
- `?voice=0` is not saved: it only sets the voice for that visit, like `?voyage`. A tap on the switch is saved.
- Voice level 0.4: with the clips' own loudness this is about three times the level of the bell notes and far below the fireworks. Set by numbers, not by ear.
- Offline and install-as-app: the site has no service worker and saves no files for offline use (a test even checks that none is registered). So the clips are NOT saved for offline use; like the rest of the site they come from the network or the browser's ordinary cache. Nothing was changed here.

## Problems / questions for the user
- Please listen on a real phone: is the voice loud enough next to the chime and the harbour sound, and does it start soon enough? Both are one number each in `js/voice.js` (`VOICE_LEVEL`, `VOICE_DELAY`).
- As far as I know the ElevenLabs free plan is for non-commercial use only and needs the credit; please check their current terms. Before the site earns money (ads, sales, paid work), replace the clips with licensed ones (see `js/voice.js` for how to remove the credit).
