// Voyage mode: the rules for sailing from city to city. Pure logic: no page,
// no canvas, no clock of its own, so everything here can be tested in Node.
//
// When voyage mode is on, the page stays in a city for its show and for the
// quiet minute after it. Then, a few seconds before the next show, it sails
// to the next city: the picture fades to night, a caption names the next
// stop, and the next city fades in, just in time for its own show.
//
// What never changes: the two-minute schedule and the countdown. And the
// city never changes during a show.

export const VOYAGE_KEY = 'boomvoyage.voyage';

// Seconds. `lead` is how long before the next show the sail begins;
// `prepare` is how much earlier the next city starts being painted offscreen.
export const SAIL = { lead: 10, prepare: 7, out: 2.2, hold: 1.0, in: 2.4, spare: 1.5 };
export const SAIL_CALM = { ...SAIL, out: 3, hold: 1, in: 3 };     // reduce motion: a slower, softer fade

export const sailTimes = (calm) => (calm ? SAIL_CALM : SAIL);
export const sailLength = (calm) => { const s = sailTimes(calm); return s.out + s.hold + s.in; };

// The city after `id` in the list; after the last one comes the first.
// An unknown id starts the voyage at the first city.
export function nextStop(ids, id) {
  if (!ids.length) return null;
  const i = ids.indexOf(id);
  return ids[(i + 1) % ids.length];
}

// "Stop 3 of 7" for the city `id`.
export function stopLabel(ids, id) {
  const i = ids.indexOf(id);
  return i < 0 ? '' : `Stop ${i + 1} of ${ids.length}`;
}

export function sailCaption(name) {
  return `Sailing to ${name}`;
}

// Is voyage mode on when the page opens? A link option wins (?voyage=1 or
// ?voyage=0); without one the saved choice is used; without that it is off.
export function initialVoyage(linkValue, storedText) {
  if (linkValue === true || linkValue === false) return linkValue;
  return storedText === '1';
}

export function loadVoyage(storage) {
  try { return storage.getItem(VOYAGE_KEY); } catch { return null; }
}
export function saveVoyage(storage, on) {
  try { storage.setItem(VOYAGE_KEY, on ? '1' : '0'); } catch { /* private mode: keep going */ }
}

// The quiet stretch, as the page sees it at one moment:
//   on        voyage mode is on
//   started   the visitor has pressed "Tap to start"
//   showing   a show is playing
//   busy      sparks, rockets or beams are still in the air
//   life      how many life events are on screen
//   remaining seconds until the next show
//   hidden    the tab is hidden
//   sailing   a sail is already under way
//   sailed    this quiet stretch has already had its sail
const quiet = (s) => s.on && s.started && !s.showing && !s.busy && !s.hidden && !s.sailing && !s.sailed;

// Time to start painting the next city offscreen?
export function shouldPrepare(s, calm = false) {
  const t = sailTimes(calm);
  return quiet(s) && s.remaining <= t.lead + t.prepare && s.remaining >= sailLength(calm) + t.spare;
}

// Time to set sail? Only in the quiet stretch, only once the life events
// have faded, and only if the whole sail still fits before the next show.
// If it does not fit (voyage mode was switched on late, or the tab was
// asleep), this stretch is skipped and the show plays where we are.
export function shouldSail(s, calm = false) {
  const t = sailTimes(calm);
  return quiet(s) && s.life === 0 && s.remaining <= t.lead && s.remaining >= sailLength(calm) + t.spare;
}

// Life events must be gone before the sail begins, so in voyage mode the
// life director is told the show is `lead` seconds nearer than it is.
export function lifeRemaining(remaining, on, calm = false) {
  return on ? Math.max(0, remaining - sailTimes(calm).lead) : remaining;
}

// Where a sail is, `t` seconds after it began:
//   stage    'out' (fading to night), 'hold' (dark, the city changes here),
//            'in' (the next city fades in) or 'done'
//   dark     0..1, how far the picture is covered
//   swap     true once the city may change (only while fully dark)
export function sailAt(t, calm = false) {
  const s = sailTimes(calm);
  const ease = (u) => u * u * (3 - 2 * u);
  if (t < s.out) return { stage: 'out', dark: ease(Math.max(0, t) / s.out), swap: false };
  if (t < s.out + s.hold) return { stage: 'hold', dark: 1, swap: t >= s.out + s.hold * 0.4 };
  if (t < s.out + s.hold + s.in) return { stage: 'in', dark: 1 - ease((t - s.out - s.hold) / s.in), swap: true };
  return { stage: 'done', dark: 0, swap: true };
}
