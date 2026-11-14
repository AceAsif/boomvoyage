// New Year's Eve mode: the rules. Pure logic: no page, no canvas. The time
// is always handed in as a number (milliseconds, like Date.now()), so a
// fake clock can be used for testing.
//
// On 31 December (by the visitor's own calendar) the page counts down to
// the real midnight of each city, one after another, in the order in which
// those midnights really happen around the world. At each midnight that
// city plays a longer, bigger show. When the last city has had its
// midnight, everything is as on any other day.
//
// Real time zones come from the browser (the Intl API), so summer time and
// odd offsets are right without any table in this project.

// How close to a midnight an ordinary show may still start (seconds). A
// show is about 47 seconds long; the sky must be quiet again, with time to
// sail to the midnight city, before the clock strikes.
export const MIDNIGHT_GAP = 80;
// After a city's midnight has passed, its own show still counts as
// "the midnight show" for this long (a slow timer, a tab that was asleep).
export const MIDNIGHT_GRACE = 90;

const formatters = new Map();
function partsOf(timeZone, ms) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    formatters.set(timeZone, f);
  }
  const out = {};
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out;
}

// The calendar date and clock time in a time zone at the moment `ms`.
export function zoneTime(timeZone, ms) {
  const p = partsOf(timeZone, ms);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour % 24, minute: p.minute, second: p.second };
}

// How many minutes a time zone is ahead of UTC at the moment `ms`
// (Tokyo: 540, New York in winter: -300).
export function zoneOffsetMinutes(timeZone, ms) {
  const t = zoneTime(timeZone, ms);
  const asUtc = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

// The moment (in UTC milliseconds) when 1 January of `year` begins in a
// time zone.
export function localMidnight(timeZone, year) {
  const wall = Date.UTC(year, 0, 1, 0, 0, 0);
  let ms = wall - zoneOffsetMinutes(timeZone, wall) * 60000;
  ms = wall - zoneOffsetMinutes(timeZone, ms) * 60000;       // once more, in case the offset differs there
  return ms;
}

// True if the browser knows this time zone.
export function knownZone(timeZone) {
  try { partsOf(timeZone, 0); return true; } catch { return false; }
}

// The visitor's own time zone, as the browser reports it.
export function visitorZone() {
  try { return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

// Every city's midnight for the new year `year`, earliest first.
// `cities` is a list of { id, name, timeZone }. Cities whose midnights fall
// at the same moment keep the order of the list.
const cache = new Map();
export function midnights(cities, year) {
  const key = `${year}|${cities.map((c) => `${c.id}@${c.timeZone}`).join(',')}`;
  let list = cache.get(key);
  if (!list) {
    list = cities
      .filter((c) => c.timeZone && knownZone(c.timeZone))
      .map((c, i) => ({ id: c.id, name: c.name, at: localMidnight(c.timeZone, year), i }))
      .sort((a, b) => a.at - b.at || a.i - b.i)
      .map(({ id, name, at }) => ({ id, name, at }));
    cache.set(key, list);
  }
  return list;
}

// What New Year's Eve mode should do at the moment `now`.
//   { active: false }                       an ordinary day
//   { active: true, year, stops, next }     `year` is the year being
//       welcomed, `stops` every city's midnight in order, `next` the first
//       one still to come (or the one that struck less than MIDNIGHT_GRACE
//       seconds ago), or null when all have passed.
// `zone` is the visitor's time zone (their own calendar decides the day).
export function newYearState(now, cities, zone = visitorZone()) {
  if (!Number.isFinite(now) || !cities || !cities.length) return { active: false };
  const here = zoneTime(zone, now);
  let year;
  if (here.month === 12 && here.day === 31) year = here.year + 1;      // New Year's Eve here
  else if (here.month === 1 && here.day === 1) year = here.year;        // already past midnight here: other cities may still be waiting
  else return { active: false };
  const stops = midnights(cities, year);
  if (!stops.length) return { active: false };
  const next = stops.find((s) => now < s.at + MIDNIGHT_GRACE * 1000) || null;
  // On 1 January the mode only goes on while a city is still waiting.
  if (!next) return { active: false };
  return { active: true, year, stops, next };
}

// The stop to count down to, given the moment (`struckAt`) of the last
// midnight whose show has already begun here. A city whose show has started
// is done: the countdown moves on to the next one at once.
export function upcomingStop(state, struckAt = -Infinity) {
  if (!state || !state.active) return null;
  return state.stops.find((s) => s.at >= state.next.at && s.at > struckAt) || null;
}

// When should the next show start, if a midnight is near? An ordinary show
// keeps its own time unless it would start less than MIDNIGHT_GAP seconds
// before the midnight, or after it: then it waits and becomes the midnight
// show. Times are milliseconds.
export function showTimeNearMidnight(nextAt, midnight, gapSeconds = MIDNIGHT_GAP) {
  if (!Number.isFinite(midnight)) return nextAt;
  return nextAt > midnight - gapSeconds * 1000 ? midnight : nextAt;
}

// May an ordinary show start at `now` (a tap on "Launch now", a new city)?
// Not in the last MIDNIGHT_GAP seconds before a midnight.
export function mayStartShow(now, midnight, gapSeconds = MIDNIGHT_GAP) {
  return !Number.isFinite(midnight) || now >= midnight || midnight - now >= gapSeconds * 1000;
}

// Is the show that starts at `now` the midnight show of the stop `next`?
export function isMidnightShow(now, nextAt, next) {
  return !!next && nextAt === next.at && now >= next.at && now < next.at + MIDNIGHT_GRACE * 1000;
}

export function midnightLabel(name, showing = false) {
  return showing ? `Showing now · midnight in ${name} in` : `Midnight in ${name} in`;
}

export function newYearTitle(year) {
  return `Happy New Year ${year}`;
}

// 4985000 -> "1:23:05", 125000 -> "2:05", 900 -> "0:01". Hours only when needed.
export function formatLongCountdown(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const two = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

// Reads the testing option ?clock=2026-12-31T12:00:00Z. It must be a full
// date and time with a time zone (Z or +hh:mm), or it is ignored. Returns
// milliseconds, or null.
export function parseClock(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim().replace(' ', '+');     // a "+" in a link arrives as a space
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(t)) return null;
  const ms = Date.parse(t);
  return Number.isFinite(ms) ? ms : null;
}
