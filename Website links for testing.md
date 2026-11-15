# BoomVoyage: links for testing by hand

Every link here uses a plain `&` between options, so it can be copied as it is.

How the options work: they go after a `?` and are joined with `&`, in any
order. `scene` picks the city, `debug=1` shows the small green panel,
`clock` pretends it is another moment (only for New Year's Eve mode),
`voyage=1` turns voyage mode on, `ambient=1` starts in ambient (TV) mode.
The full table is in `README.md` under "Link options".

Two things to know about `clock` links:

- The fake clock starts when the page **loads**, not when you tap "Tap to
  start". So tap soon after opening the link.
- To run a test again, load the link again (press Enter in the address bar
  or reload).

Last checked: 15 November 2026, on the live site and on a local copy, in a
Chromium browser. Time zone of the test computer: Australia/Hobart (UTC+11).

---

**Original link for website:**

https://aceasif.github.io/boomvoyage/

**Debug link for website:**

https://aceasif.github.io/boomvoyage/?debug=1

The green panel shows the frame rate, the number of sparks, the life events,
"new year mode: on/off" with its start and end time, voyage mode, and the
keys for the quiet sounds.

---

## 1. One link per city

**Sydney:**
https://aceasif.github.io/boomvoyage/?scene=sydney
https://aceasif.github.io/boomvoyage/?scene=sydney&debug=1

**Dubai:**
https://aceasif.github.io/boomvoyage/?scene=dubai
https://aceasif.github.io/boomvoyage/?scene=dubai&debug=1

**Paris:**
https://aceasif.github.io/boomvoyage/?scene=paris
https://aceasif.github.io/boomvoyage/?scene=paris&debug=1

**London:**
https://aceasif.github.io/boomvoyage/?scene=london
https://aceasif.github.io/boomvoyage/?scene=london&debug=1

**New York:**
https://aceasif.github.io/boomvoyage/?scene=newyork
https://aceasif.github.io/boomvoyage/?scene=newyork&debug=1

**Tokyo:**
https://aceasif.github.io/boomvoyage/?scene=tokyo
https://aceasif.github.io/boomvoyage/?scene=tokyo&debug=1

**Hong Kong:**
https://aceasif.github.io/boomvoyage/?scene=hongkong
https://aceasif.github.io/boomvoyage/?scene=hongkong&debug=1

What you should see: the page opens in that city (its name is on the start
screen and in the tab title). A city opened by a link is remembered as your
city for next time.

---

## New Year's Eve clock tests

New Year's Eve mode is on from 00:00 on 30 December **in your own time
zone** until 90 seconds after midnight in New York. While it is on, the big
clock counts down to the next city's real midnight, in this order: Sydney,
Tokyo, Hong Kong, Dubai, Paris, London, New York.

### 2. START test: 10 seconds before the mode turns on

**This time depends on the time zone of the device you test on.** The links
below are right for Hobart (Australia/Hobart, UTC+11 in December): 00:00 on
30 December in Hobart is 13:00 UTC on 29 December, so the fake clock is
`2026-12-29T12:59:50Z`.

**Debug link and new year eve clock link for testing the clock (Hobart time):**

**Sydney:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=sydney

**Dubai:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=dubai

**Paris:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=paris

**London:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=london

**New York:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=newyork

**Tokyo:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=tokyo

**Hong Kong:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T12:59:50Z&scene=hongkong

What you should see: the panel says "new year mode: off" and "starts 30 Dec
2026, 00:00". The clock says "Next show in 2:00". Ten seconds later the
panel says "new year mode: on" and the big clock changes to "Midnight in
Sydney Harbour in 1d 23:59:59" and counts down. The city in the link only
decides which city you are looking at; the countdown is always to Sydney
first.

**For another time zone:** you do not need to work out UTC. Write the local
time with your own offset from UTC at the end:

`clock=2026-12-29T23:59:50+11:00` (Hobart, the same moment as the links above)

Put your offset in place of `+11:00`, for example `+06:00` for Dhaka,
`+00:00` for London, `-05:00` for New York. In a link the `+` must be written
as `%2B` (a `-` stays as it is). Examples:

- Hobart: https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T23:59:50%2B11:00&scene=sydney
- Dhaka: https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T23:59:50%2B06:00&scene=sydney
- London: https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T23:59:50Z&scene=sydney
- New York: https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-29T23:59:50-05:00&scene=sydney

Each of these only shows the switch from off to on if the device is really
in that time zone. If you are not sure of your zone, open the Debug link:
the panel names it ("when 30 Dec begins in your time zone (...)") and gives
the start time in UTC in brackets. Take 10 seconds off that time.

### 3. MIDNIGHT show test: 40 seconds before each city's real midnight

These do not depend on your own time zone. Each time comes from the city's
time zone in the code (`timeZone` in `js/scenes/`).

| City | Time zone in the code | Its midnight in UTC | Fake clock (40 s before) |
|---|---|---|---|
| Sydney | Australia/Sydney (UTC+11) | 2026-12-31 13:00:00 | 2026-12-31T12:59:20Z |
| Tokyo | Asia/Tokyo (UTC+9) | 2026-12-31 15:00:00 | 2026-12-31T14:59:20Z |
| Hong Kong | Asia/Hong_Kong (UTC+8) | 2026-12-31 16:00:00 | 2026-12-31T15:59:20Z |
| Dubai | Asia/Dubai (UTC+4) | 2026-12-31 20:00:00 | 2026-12-31T19:59:20Z |
| Paris | Europe/Paris (UTC+1) | 2026-12-31 23:00:00 | 2026-12-31T22:59:20Z |
| London | Europe/London (UTC+0) | 2027-01-01 00:00:00 | 2026-12-31T23:59:20Z |
| New York | America/New_York (UTC-5) | 2027-01-01 05:00:00 | 2027-01-01T04:59:20Z |

**Sydney:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T12:59:20Z&scene=sydney

**Tokyo:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T14:59:20Z&scene=tokyo

**Hong Kong:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T15:59:20Z&scene=hongkong

**Dubai:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T19:59:20Z&scene=dubai

**Paris:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T22:59:20Z&scene=paris

**London:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2026-12-31T23:59:20Z&scene=london

**New York:**
https://aceasif.github.io/boomvoyage/?debug=1&clock=2027-01-01T04:59:20Z&scene=newyork

What you should see: the panel says "new year mode: on · welcoming 2027 ·
next midnight" with that city's name. The big clock says "Midnight in
(city) in 0:39". Tap "Tap to start" at once. No show starts yet (the sky is
kept quiet before a midnight). When the clock reaches 0:00 the city plays
its longer, bigger show with "Happy New Year 2027" on the screen. Then the
clock moves on to the next city (after New York: back to "Next show in").

If you tap later than 40 seconds after loading, the midnight show starts as
soon as you tap (up to 90 seconds late). Later than that, it is missed: load
the link again.

### 4. END test: 10 seconds before the mode turns off

The mode ends 90 seconds after midnight in New York: 05:01:30 UTC on
1 January. This does not depend on your time zone.

https://aceasif.github.io/boomvoyage/?debug=1&clock=2027-01-01T05:01:20Z&scene=newyork

What you should see: the panel says "new year mode: on · next midnight New
York" and the big clock says "Midnight in New York in 0:00". Ten seconds
later the panel says "new year mode: off" and the clock is back to "Next
show in 2:00". (If you tap to start in those first ten seconds, New York's
midnight show plays, because it has not played yet on this page.)

---

## 5. Voyage mode and ambient mode

**Voyage mode on:**
https://aceasif.github.io/boomvoyage/?voyage=1
https://aceasif.github.io/boomvoyage/?voyage=1&debug=1

What you should see: after you tap to start, the sailboat button is lit.
With debug, the panel says "voyage: on". After a show and its quiet minute,
ten seconds before the next show, the picture goes dark, says "Sailing to
..." and the next city appears. The travel sound plays during the sail.

**Voyage mode off (whatever was saved before):**
https://aceasif.github.io/boomvoyage/?voyage=0

**Ambient (TV) mode:**
https://aceasif.github.io/boomvoyage/?ambient=1
https://aceasif.github.io/boomvoyage/?ambient=1&debug=1

What you should see: "Tap to start" is still shown first (browsers only
allow sound after a tap). After the tap all buttons are hidden and only the
show is on screen. Tap, or press Esc or A, to leave ambient mode. With
debug, the green panel stays on screen.

**Both, starting in a chosen city (a slow trip round the world for a screen on a wall):**
https://aceasif.github.io/boomvoyage/?scene=hongkong&voyage=1&ambient=1

---

## 6. Keys

Keys work after "Tap to start".

| Key | What it does |
|---|---|
| Space (or Enter) | Starts a show now ("Launch now"). |
| M | Mutes the sound, or turns it back on. |
| F | Fullscreen on and off. |
| A | Ambient (TV) mode on and off. |
| Esc | Leaves ambient mode; closes the city menu, the volume slider and the link box. |
| P | Saves a postcard (not in ambient mode). |
| V | Voyage mode on and off. |

Only with `?debug=1` in the address: the number keys play one quiet sound at once.

| Key | Sound |
|---|---|
| 1 | horn (a boat horn far away) |
| 2 | water (three soft laps) |
| 3 | chime (three gentle notes) |
| 4 | bell (a harbour bell, two strikes) |
| 5 | furin (a glass wind chime) |
| 6 | gong (one soft strike) |
| 7 | travel (the sound of voyage mode: three rising bell notes and a very quiet low hum) |

A small message names the sound, or says why it did not play (sound is
muted, or two quiet sounds are already playing).

---

## 7. Hand-test checklist

Tick each one when it looks and sounds right.

- [ ] **Quiet sounds.** Open the Debug link, tap to start, press 1, 2, 3, 4,
      5 and 6 one after another. Each is soft, has no click at the start or
      end, and they sound different from each other.
- [ ] **Travel sound.** Press 7. You hear three bell notes going up, then a
      very quiet low hum that fades away. It must not sound like the water
      sound (press 2 to compare). Press M and then 7: nothing plays and the
      message says the sound is muted.
- [ ] **Voyage mode on a real phone.** Open the voyage link, tap to start,
      watch a show, wait about a minute. The picture goes dark, says
      "Sailing to ...", and the next city appears before its show.
- [ ] **New Year's Eve.** Open one MIDNIGHT link (section 3), tap to start
      at once, wait 40 seconds. The big show plays with "Happy New Year
      2027". Then try the START link for your time zone (section 2).
- [ ] **Every city on your own phone, upright and sideways.** Use the links
      in section 1. Every landmark is whole, nothing is cut off, the buttons
      do not cover each other.
- [ ] **Phone postcard.** On a phone held upright, tap the camera button
      about a second after a show starts. It says "Waiting for the brightest
      moment…" and then shares or saves a 4:5 picture with fireworks in it
      and a large caption. On a desktop the postcard is saved at once and
      shows the whole screen.
