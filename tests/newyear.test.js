// New Year's Eve mode (js/newyear.js): real time zones, the order of the
// midnights, and the fake clock used for testing. Every time is a number
// handed in, so nothing here depends on today's date.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MIDNIGHT_GAP, MIDNIGHT_GRACE, zoneTime, zoneOffsetMinutes, localMidnight, knownZone, midnights, newYearState, upcomingStop, showTimeNearMidnight, mayStartShow, isMidnightShow, midnightLabel, newYearTitle, formatLongCountdown, parseClock } from '../js/newyear.js';
import { parseLink } from '../js/link.js';
import { scenes } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';

const CITIES = scenes.map((s) => ({ id: s.id, name: s.name, timeZone: s.timeZone }));
const utc = (text) => Date.parse(text);
const HOUR = 3600000;

test('every city has a real time zone the Intl API knows', () => {
  const want = { sydney: 'Australia/Sydney', dubai: 'Asia/Dubai', paris: 'Europe/Paris', london: 'Europe/London', newyork: 'America/New_York', tokyo: 'Asia/Tokyo', hongkong: 'Asia/Hong_Kong' };
  for (const s of scenes) {
    assert.equal(s.timeZone, want[s.id], s.id);
    assert.equal(knownZone(s.timeZone), true, s.timeZone);
  }
  assert.equal(knownZone('Mars/Olympus_Mons'), false);
});

test('time-zone maths: offsets, also across summer time', () => {
  assert.equal(zoneOffsetMinutes('Asia/Tokyo', utc('2026-12-31T12:00:00Z')), 540);
  assert.equal(zoneOffsetMinutes('Asia/Dubai', utc('2026-12-31T12:00:00Z')), 240);
  assert.equal(zoneOffsetMinutes('Asia/Hong_Kong', utc('2026-12-31T12:00:00Z')), 480);
  assert.equal(zoneOffsetMinutes('Europe/London', utc('2026-12-31T12:00:00Z')), 0);
  assert.equal(zoneOffsetMinutes('Europe/London', utc('2026-07-01T12:00:00Z')), 60, 'British Summer Time');
  assert.equal(zoneOffsetMinutes('Europe/Paris', utc('2026-12-31T12:00:00Z')), 60);
  assert.equal(zoneOffsetMinutes('America/New_York', utc('2026-12-31T12:00:00Z')), -300);
  assert.equal(zoneOffsetMinutes('America/New_York', utc('2026-07-01T12:00:00Z')), -240, 'daylight time');
  assert.equal(zoneOffsetMinutes('Australia/Sydney', utc('2026-12-31T12:00:00Z')), 660, 'summer in the south');
  assert.equal(zoneOffsetMinutes('Australia/Sydney', utc('2026-07-01T12:00:00Z')), 600);
  assert.equal(zoneOffsetMinutes('Asia/Kolkata', utc('2026-12-31T12:00:00Z')), 330, 'half-hour zones work too');
  assert.deepEqual(zoneTime('Asia/Tokyo', utc('2026-12-31T15:00:00Z')), { year: 2027, month: 1, day: 1, hour: 0, minute: 0, second: 0 });
});

test('the real moment of each city\'s midnight', () => {
  assert.equal(localMidnight('Australia/Sydney', 2027), utc('2026-12-31T13:00:00Z'));
  assert.equal(localMidnight('Asia/Tokyo', 2027), utc('2026-12-31T15:00:00Z'));
  assert.equal(localMidnight('Asia/Hong_Kong', 2027), utc('2026-12-31T16:00:00Z'));
  assert.equal(localMidnight('Asia/Dubai', 2027), utc('2026-12-31T20:00:00Z'));
  assert.equal(localMidnight('Europe/Paris', 2027), utc('2026-12-31T23:00:00Z'));
  assert.equal(localMidnight('Europe/London', 2027), utc('2027-01-01T00:00:00Z'));
  assert.equal(localMidnight('America/New_York', 2027), utc('2027-01-01T05:00:00Z'));
  for (const c of CITIES) {
    for (const year of [2026, 2027, 2030, 2040]) {
      const at = localMidnight(c.timeZone, year);
      assert.deepEqual(zoneTime(c.timeZone, at), { year, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, `${c.id} ${year}`);
      assert.equal(zoneTime(c.timeZone, at - 1000).year, year - 1, 'one second earlier it is still the old year');
    }
  }
});

test('the midnights come in the order they really happen: Sydney, Tokyo, Hong Kong, Dubai, Paris, London, New York', () => {
  const order = ['sydney', 'tokyo', 'hongkong', 'dubai', 'paris', 'london', 'newyork'];
  for (const year of [2026, 2027, 2028, 2035]) {
    const stops = midnights(CITIES, year);
    assert.deepEqual(stops.map((s) => s.id), order, String(year));
    for (let i = 1; i < stops.length; i++) assert.ok(stops[i].at > stops[i - 1].at);
    assert.equal(stops.at(-1).at - stops[0].at, 16 * HOUR, 'New York is sixteen hours after Sydney');
  }
  // The list of scenes is in another order; the midnights do not follow it.
  assert.notDeepEqual(scenes.map((s) => s.id), order);
  assert.deepEqual(midnights([...CITIES].reverse(), 2027).map((s) => s.id), order);
});

test('on other dates nothing changes', () => {
  for (const day of ['2026-11-14T12:00:00Z', '2026-12-30T12:00:00Z', '2027-01-02T12:00:00Z', '2026-06-21T00:00:00Z', '2026-12-25T18:00:00Z']) {
    for (const zone of ['Europe/London', 'Australia/Sydney', 'America/New_York']) {
      assert.deepEqual(newYearState(utc(day), CITIES, zone), { active: false }, `${day} in ${zone}`);
    }
  }
  assert.deepEqual(newYearState(NaN, CITIES, 'UTC'), { active: false });
  assert.deepEqual(newYearState(utc('2026-12-31T12:00:00Z'), [], 'UTC'), { active: false });
});

test('with a fake clock at noon UTC on 31 December, the countdown is to Sydney, one hour away', () => {
  const now = utc('2026-12-31T12:00:00Z');
  const state = newYearState(now, CITIES, 'Europe/London');
  assert.equal(state.active, true);
  assert.equal(state.year, 2027);
  assert.equal(state.next.id, 'sydney');
  assert.equal(state.next.at - now, HOUR);
  assert.equal(formatLongCountdown(state.next.at - now), '1:00:00');
});

test('after each midnight the countdown moves to the next city', () => {
  const zone = 'Europe/London';
  const walk = [
    ['2026-12-31T12:59:59Z', 'sydney'], ['2026-12-31T13:02:00Z', 'tokyo'], ['2026-12-31T15:30:00Z', 'hongkong'],
    ['2026-12-31T16:02:00Z', 'dubai'], ['2026-12-31T20:02:00Z', 'paris'], ['2026-12-31T23:02:00Z', 'london'],
    ['2027-01-01T00:02:00Z', 'newyork'], ['2027-01-01T04:59:59Z', 'newyork'],
  ];
  for (const [at, city] of walk) assert.equal(newYearState(utc(at), CITIES, zone).next.id, city, at);
  // Just after a midnight, that city is still "next" for a short while, so
  // its show can start even if the page was a little late.
  assert.equal(newYearState(utc('2026-12-31T13:00:30Z'), CITIES, zone).next.id, 'sydney');
  assert.equal(newYearState(utc('2026-12-31T13:00:00Z') + MIDNIGHT_GRACE * 1000, CITIES, zone).next.id, 'tokyo');
});

test('the mode starts on the visitor\'s own 31 December and ends after the last city', () => {
  // A visitor in London: the last midnight (New York) is at 05:00 on their 1 January.
  assert.equal(newYearState(utc('2026-12-31T00:00:00Z'), CITIES, 'Europe/London').active, true);
  assert.equal(newYearState(utc('2026-12-30T23:59:59Z'), CITIES, 'Europe/London').active, false);
  assert.equal(newYearState(utc('2027-01-01T03:00:00Z'), CITIES, 'Europe/London').next.id, 'newyork');
  assert.equal(newYearState(utc('2027-01-01T05:10:00Z'), CITIES, 'Europe/London').active, false, 'all seven have had their midnight');
  // A visitor in Sydney: their 31 December begins at 13:00 UTC on the 30th.
  assert.equal(newYearState(utc('2026-12-30T12:59:00Z'), CITIES, 'Australia/Sydney').active, false);
  assert.equal(newYearState(utc('2026-12-30T13:00:00Z'), CITIES, 'Australia/Sydney').next.id, 'sydney');
  assert.equal(newYearState(utc('2026-12-31T14:00:00Z'), CITIES, 'Australia/Sydney').next.id, 'tokyo', 'already 1 January in Sydney, Tokyo is still waiting');
  // A visitor in New York sees Sydney's midnight at 8 in the morning on the 31st.
  const ny = newYearState(utc('2026-12-31T12:00:00Z'), CITIES, 'America/New_York');
  assert.equal(ny.next.id, 'sydney');
  assert.equal(zoneTime('America/New_York', ny.next.at).hour, 8);
  // It is the same list of moments for everyone.
  assert.deepEqual(ny.stops, newYearState(utc('2026-12-31T12:00:00Z'), CITIES, 'Asia/Tokyo').stops);
});

test('an ordinary show never runs into a midnight: it waits and becomes the midnight show', () => {
  const M = utc('2026-12-31T13:00:00Z');
  assert.equal(showTimeNearMidnight(M - 10 * 60000, M), M - 10 * 60000, 'far from midnight: untouched');
  assert.equal(showTimeNearMidnight(M - (MIDNIGHT_GAP + 1) * 1000, M), M - (MIDNIGHT_GAP + 1) * 1000);
  assert.equal(showTimeNearMidnight(M - 30000, M), M, 'too close: wait for midnight');
  assert.equal(showTimeNearMidnight(M + 20000, M), M, 'it would be late: strike at midnight');
  assert.equal(showTimeNearMidnight(M - 30000, null), M - 30000, 'no midnight near: untouched');
  assert.equal(mayStartShow(M - 5 * 60000, M), true);
  assert.equal(mayStartShow(M - 30000, M), false, '"Launch now" half a minute before midnight is held back');
  assert.equal(mayStartShow(M + 1000, M), true);
  assert.equal(mayStartShow(M - 30000, null), true);
  // A show is about 47 seconds; the gap leaves the sky quiet before midnight.
  for (const s of scenes) assert.ok(buildShow(s.show, 3).duration < MIDNIGHT_GAP, s.id);
});

test('only the show that starts at a midnight is the midnight show', () => {
  const next = { id: 'tokyo', name: 'Tokyo', at: utc('2026-12-31T15:00:00Z') };
  assert.equal(isMidnightShow(next.at, next.at, next), true);
  assert.equal(isMidnightShow(next.at + 20000, next.at, next), true, 'a little late still counts');
  assert.equal(isMidnightShow(next.at + (MIDNIGHT_GRACE + 1) * 1000, next.at, next), false, 'too late: an ordinary show');
  assert.equal(isMidnightShow(next.at - 60000, next.at - 60000, next), false, 'an ordinary show before midnight');
  assert.equal(isMidnightShow(next.at - 1000, next.at, next), false, '"Launch now" just before midnight');
  assert.equal(isMidnightShow(next.at, next.at, null), false);
});

test('the midnight show is longer and bigger, and the ordinary show is untouched', () => {
  for (const s of scenes) {
    const plain = buildShow(s.show, 2027), grand = buildShow(s.show, 2027, { grand: true });
    assert.deepEqual(buildShow(s.show, 2027, { grand: false }), plain, `${s.id}: an ordinary show must not change`);
    assert.ok(grand.duration >= plain.duration + 10, `${s.id}: ${grand.duration.toFixed(1)}s against ${plain.duration.toFixed(1)}s`);
    assert.ok(grand.duration < s.show.intervalSeconds, `${s.id}: it must still end before the next show`);
    assert.equal(grand.acts.length, plain.acts.length + 1, 'one more act');
    const finale = (show) => { const a = show.timeline.at(-1); return show.cues.filter((c) => c.kind === 'shell' && c.t >= a.start); };
    assert.ok(finale(grand).length > finale(plain).length * 1.6, `${s.id}: a much longer finale`);
    const mean = (list) => list.reduce((sum, c) => sum + c.size, 0) / list.length;
    assert.ok(mean(finale(grand)) > mean(finale(plain)), `${s.id}: bigger shells`);
    assert.deepEqual(buildShow(s.show, 2027, { grand: true }), grand, 'the same seed gives the same midnight show');
  }
});

test('the words on the clock and the caption', () => {
  assert.equal(midnightLabel('Tokyo'), 'Midnight in Tokyo in');
  assert.equal(midnightLabel('Sydney Harbour', true), 'Showing now · midnight in Sydney Harbour in');
  assert.equal(newYearTitle(2027), 'Happy New Year 2027');
  assert.equal(formatLongCountdown(4985000), '1:23:05');
  assert.equal(formatLongCountdown(16 * HOUR), '16:00:00');
  assert.equal(formatLongCountdown(125000), '2:05');
  assert.equal(formatLongCountdown(59001), '1:00');
  assert.equal(formatLongCountdown(900), '0:01');
  assert.equal(formatLongCountdown(0), '0:00');
  assert.equal(formatLongCountdown(-5), '0:00');
});

test('the testing option ?clock= needs a full date, time and zone; anything else is ignored', () => {
  assert.equal(parseClock('2026-12-31T12:00:00Z'), utc('2026-12-31T12:00:00Z'));
  assert.equal(parseClock('2026-12-31T23:59Z'), utc('2026-12-31T23:59:00Z'));
  assert.equal(parseClock('2026-12-31T23:59:30+11:00'), utc('2026-12-31T12:59:30Z'));
  assert.equal(parseClock('2026-12-31T23:59:30 11:00'), utc('2026-12-31T12:59:30Z'), 'a + in a link arrives as a space');
  for (const bad of ['', 'now', '2026-12-31', '2026-12-31T12:00:00', '31/12/2026 12:00', '2026-13-40T99:00:00Z', '<script>', null, undefined, 5]) {
    assert.equal(parseClock(bad), null, String(bad));
  }
  assert.equal(parseLink('?clock=2026-12-31T12:00:00Z').clock, utc('2026-12-31T12:00:00Z'));
  assert.equal(parseLink('?scene=paris').clock, null, 'no option: the real clock');
  assert.equal(parseLink('?clock=banana').clock, null);
});

test("once a city has had its midnight show, the countdown moves to the next city at once", () => {
  const zone = 'Europe/London';
  const justAfter = newYearState(utc('2026-12-31T13:00:02Z'), CITIES, zone);
  assert.equal(justAfter.next.id, 'sydney', 'still inside the grace time');
  assert.equal(upcomingStop(justAfter).id, 'sydney', 'no show yet: Sydney is still to come');
  assert.equal(upcomingStop(justAfter, utc('2026-12-31T13:00:00Z')).id, 'tokyo', 'its show has begun: on to Tokyo');
  const last = newYearState(utc('2027-01-01T05:00:05Z'), CITIES, zone);
  assert.equal(upcomingStop(last).id, 'newyork');
  assert.equal(upcomingStop(last, utc('2027-01-01T05:00:00Z')), null, 'after New York there is no one left');
  assert.equal(upcomingStop({ active: false }), null);
  // An earlier midnight that was struck does not hide a later one.
  const evening = newYearState(utc('2026-12-31T19:00:00Z'), CITIES, zone);
  assert.equal(upcomingStop(evening, utc('2026-12-31T16:00:00Z')).id, 'dubai');
});
