// Show schedule. Pure functions over timestamps (milliseconds, like Date.now()).
//
// Nothing here counts ticks. The time left is always "next start minus now",
// so it stays right when the browser slows timers in a background tab.

export function createSchedule(intervalMs, now) {
  if (!(intervalMs > 0)) throw new RangeError('intervalMs must be greater than 0');
  return { intervalMs, nextAt: now + intervalMs };
}

export function remainingMs(schedule, now) {
  return Math.max(0, schedule.nextAt - now);
}

export function isDue(schedule, now) {
  return now >= schedule.nextAt;
}

// A show starts now (on time, late, or by "Launch now"): count again from here.
export function restart(schedule, now) {
  return { intervalMs: schedule.intervalMs, nextAt: now + schedule.intervalMs };
}

// One step: tells if a show should start, and gives the schedule to keep.
// However long the page slept, only ONE show starts, and the next one is a
// full interval after it.
export function tick(schedule, now) {
  if (!isDue(schedule, now)) return { due: false, schedule };
  return { due: true, schedule: restart(schedule, now) };
}

// 0 just after a show starts, 1 when the next one is due.
export function progress(schedule, now) {
  return Math.min(1, Math.max(0, 1 - remainingMs(schedule, now) / schedule.intervalMs));
}

// 120000 -> "2:00", 61500 -> "1:02", 900 -> "0:01", 0 -> "0:00"
export function formatCountdown(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
