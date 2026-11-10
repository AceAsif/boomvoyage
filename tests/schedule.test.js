import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSchedule, remainingMs, isDue, restart, tick, progress, formatCountdown,
} from '../js/schedule.js';

const TWO_MIN = 120_000;
const T0 = 1_800_000_000_000; // any fixed "now"

test('a new schedule is due one interval from now', () => {
  const s = createSchedule(TWO_MIN, T0);
  assert.equal(s.nextAt, T0 + TWO_MIN);
  assert.equal(remainingMs(s, T0), TWO_MIN);
  assert.equal(isDue(s, T0), false);
});

test('createSchedule rejects a bad interval', () => {
  assert.throws(() => createSchedule(0, T0), RangeError);
  assert.throws(() => createSchedule(-5, T0), RangeError);
  assert.throws(() => createSchedule(NaN, T0), RangeError);
});

test('time left follows the clock, not the number of ticks', () => {
  const s = createSchedule(TWO_MIN, T0);
  assert.equal(remainingMs(s, T0 + 30_000), 90_000);
  // Asking many times or only once gives the same answer.
  for (let i = 0; i < 1000; i++) remainingMs(s, T0 + i);
  assert.equal(remainingMs(s, T0 + 119_999), 1);
  assert.equal(remainingMs(s, T0 + TWO_MIN), 0);
  assert.equal(remainingMs(s, T0 + TWO_MIN + 50_000), 0, 'never negative');
});

test('tick does nothing before the time and fires exactly at the time', () => {
  const s = createSchedule(TWO_MIN, T0);
  const early = tick(s, T0 + TWO_MIN - 1);
  assert.equal(early.due, false);
  assert.equal(early.schedule, s);

  const onTime = tick(s, T0 + TWO_MIN);
  assert.equal(onTime.due, true);
  assert.equal(onTime.schedule.nextAt, T0 + 2 * TWO_MIN);
});

test('after a long sleep only one show starts, and the next is a full interval later', () => {
  let s = createSchedule(TWO_MIN, T0);
  const wake = T0 + 17 * 60_000; // tab was in the background for 17 minutes
  const first = tick(s, wake);
  assert.equal(first.due, true);
  s = first.schedule;
  assert.equal(s.nextAt, wake + TWO_MIN);
  assert.equal(tick(s, wake + 16).due, false, 'no second show on the next frame');
  assert.equal(tick(s, wake + TWO_MIN - 1).due, false);
  assert.equal(tick(s, wake + TWO_MIN).due, true);
});

test('slow, uneven ticks (background tab) still fire once per interval', () => {
  let s = createSchedule(TWO_MIN, T0);
  let shows = 0;
  let now = T0;
  const end = T0 + 10 * TWO_MIN + 500;
  let step = 0;
  while (now <= end) {
    const r = tick(s, now);
    if (r.due) shows += 1;
    s = r.schedule;
    now += [16, 1000, 1003, 250, 4000][step++ % 5]; // throttled timers
  }
  assert.ok(shows === 9 || shows === 10, `got ${shows} shows in 20 minutes`);
});

test('restart ("Launch now") resets the countdown to a full interval', () => {
  const s = createSchedule(TWO_MIN, T0);
  const r = restart(s, T0 + 45_000);
  assert.equal(r.nextAt, T0 + 45_000 + TWO_MIN);
  assert.equal(remainingMs(r, T0 + 45_000), TWO_MIN);
  assert.equal(s.nextAt, T0 + TWO_MIN, 'the old schedule object is not changed');
});

test('progress goes from 0 to 1 and stays inside that range', () => {
  const s = createSchedule(TWO_MIN, T0);
  assert.equal(progress(s, T0), 0);
  assert.equal(progress(s, T0 + 60_000), 0.5);
  assert.equal(progress(s, T0 + TWO_MIN), 1);
  assert.equal(progress(s, T0 + 5 * TWO_MIN), 1);
  assert.equal(progress(s, T0 - 10_000), 0);
});

test('formatCountdown shows m:ss and rounds up to the next second', () => {
  assert.equal(formatCountdown(120_000), '2:00');
  assert.equal(formatCountdown(119_001), '2:00');
  assert.equal(formatCountdown(119_000), '1:59');
  assert.equal(formatCountdown(61_500), '1:02');
  assert.equal(formatCountdown(9_000), '0:09');
  assert.equal(formatCountdown(900), '0:01');
  assert.equal(formatCountdown(0), '0:00');
  assert.equal(formatCountdown(-500), '0:00');
  assert.equal(formatCountdown(600_000), '10:00');
});
