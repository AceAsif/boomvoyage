// Playing in the sky: the rules. Pure logic: no page, no canvas, no clock.
// Times are handed in as numbers (milliseconds), so everything here can be
// tested without a browser.
//
//   a quick tap or click      one ordinary shell goes up to that point
//   a long press (0.5 s)      one big shell; a thin ring grows while you wait
//   press and drag            a fan of comets follows the path you draw
//
// Three things are kept safe here:
// - the shows: everything a visitor fires takes its random numbers from its
//   own generator (createRandom), never from a show's seed;
// - the frame rate: shells and comets are limited per second (createBucket),
//   less on the lower quality steps, and nothing is added when the sky is
//   already full of sparks (hasRoom);
// - the size: a big shell is larger, not denser. It has no more sparks than
//   an ordinary shell (sparkFactor).

export const HOLD_MS = 500;        // a press this long is a long press
export const RING_DELAY_MS = 120;  // the ring waits this long, so a quick tap shows no ring
// How far (CSS pixels) a press may wander and still be a tap or a long
// press. A finger is less steady than a mouse.
export const SLOP = { mouse: 6, touch: 12, pen: 8 };
export const MAX_PRESSES = 2;      // fingers that may play at the same time

// ---------- one press: tap, long press or drag ----------

// A press that has just begun at time `t` (ms) and point (x, y).
// `pointer` is 'mouse', 'touch' or 'pen'.
export function startPress(t, x, y, pointer = 'mouse') {
  return { t0: t, x0: x, y0: y, slop: SLOP[pointer] ?? SLOP.touch, state: 'pressing' };
}

// The pointer moved. Answers 'drag' while a path is being drawn, else null.
// Once a press has become a long press it can no longer become a drag.
export function pressMove(press, t, x, y) {
  if (press.state === 'dragging') return 'drag';
  if (press.state !== 'pressing') return null;
  if (Math.hypot(x - press.x0, y - press.y0) <= press.slop) return null;
  // Moved away in time: a drag. (A press that has already lasted HOLD_MS is
  // a long press even if the timer has not told us yet.)
  if (t - press.t0 >= HOLD_MS) return null;
  press.state = 'dragging';
  return 'drag';
}

// Time passes while the pointer is down. Answers 'hold' once, at the moment
// the press becomes a long press.
export function pressTick(press, t) {
  if (press.state !== 'pressing' || t - press.t0 < HOLD_MS) return null;
  press.state = 'held';
  return 'hold';
}

// The pointer was lifted. Answers 'tap', 'hold' (a long press whose timer
// never ran), 'drag-end', or null (the long press already fired).
export function pressUp(press, t) {
  const was = press.state;
  press.state = 'done';
  if (was === 'pressing') return t - press.t0 >= HOLD_MS ? 'hold' : 'tap';
  if (was === 'dragging') return 'drag-end';
  return null;
}

// How far the ring has grown, 0 to 1. It is 0 for the first RING_DELAY_MS
// and reaches 1 exactly when the press becomes a long press.
export function ringAt(press, t) {
  if (press.state !== 'pressing') return 0;
  const k = (t - press.t0 - RING_DELAY_MS) / (HOLD_MS - RING_DELAY_MS);
  return Math.max(0, Math.min(1, k));
}

// ---------- a drawn path becomes comets ----------

// Feed it the points of the path as they come. add() answers the places
// where a comet should start: one every `spacing` pixels along the path
// (not one per pointer event, which would depend on the device). Each place
// is { x, y, lean }: `lean` is -1..1, how much the path was going left or
// right there.
export function createTrail(x, y, spacing = 30) {
  let px = x, py = y, left = spacing;
  return {
    add(nx, ny) {
      const out = [];
      let len = Math.hypot(nx - px, ny - py);
      if (len <= 0) return out;
      const ux = (nx - px) / len, uy = (ny - py) / len;
      while (len >= left) {
        px += ux * left;
        py += uy * left;
        len -= left;
        left = spacing;
        out.push({ x: px, y: py, lean: ux });
      }
      left -= len;
      px = nx;
      py = ny;
      return out;
    },
  };
}

export const FAN = 0.24;        // radians each comet turns away from its neighbour
export const LEAN = 0.5;        // radians of tilt for a path drawn straight sideways
export const COMET_SPEED = 0.4; // of the engine's reference size U, per second

// The comet for the n-th place on a path. It starts on the path (never
// below the waterline `horizon`), flies upward, leans the way the path was
// going, and turns left and right by turns: together they make a fan.
// `angle` is measured from straight up, as in the engine.
export function cometFor(place, n, { horizon, U }, colors, rand) {
  const side = n % 2 === 0 ? -1 : 1;
  return {
    x: place.x,
    y: Math.min(place.y, horizon),
    angle: Math.max(-1, Math.min(1, place.lean)) * LEAN + side * FAN * (0.75 + rand() * 0.5),
    speed: U * COMET_SPEED * (0.85 + rand() * 0.3),
    color: colors[Math.floor(rand() * colors.length)],
  };
}

// ---------- the shells ----------

const TAP_TYPES = ['peony', 'chrys', 'willow', 'ring', 'saturn', 'palm', 'crossette', 'crackle', 'strobe'];
const BIG_TYPES = ['chrys', 'peony', 'willow', 'saturn', 'palm'];
export const BIG_SIZE = 1.7;

const pick = (list, rand) => list[Math.floor(rand() * list.length)];

// The ordinary shell of a tap: any round shape in the colours of the place.
export function tapShell(colors, rand) {
  return { type: pick(TAP_TYPES, rand), color: pick(colors, rand), color2: pick(colors, rand), size: 0.75 + rand() * 0.4 };
}

// The big shell of a long press: much wider, with two colours. Its
// `density` is lowered so that it has no more sparks than an ordinary one.
export function bigShell(colors, rand) {
  const spec = { type: pick(BIG_TYPES, rand), color: pick(colors, rand), color2: pick(colors, rand), size: BIG_SIZE };
  spec.density = 1 / (0.75 + spec.size * 0.25);
  return spec;
}

// How many sparks a shell has, compared with a shell of size 1 (this is the
// rule in fireworks.js: sparks grow with 0.75 + size / 4, times density).
export function sparkFactor(spec) {
  return (spec.density ?? 1) * (0.75 + (spec.size ?? 1) * 0.25);
}

// ---------- limits ----------

// A bucket of tokens: `capacity` at most, refilled at `perSecond`. take()
// answers true and uses one token if there is one. `scale` slows the refill
// (see paceFor). Times are milliseconds.
export function createBucket({ perSecond, capacity }) {
  let tokens = capacity, last = null;
  return {
    take(now, scale = 1) {
      if (last !== null && now > last) tokens = Math.min(capacity, tokens + ((now - last) / 1000) * perSecond * scale);
      last = last === null ? now : Math.max(last, now);
      if (tokens < 1) return false;
      tokens -= 1;
      return true;
    },
  };
}

// The most a visitor can fire. With the buckets full: 4 taps at once and
// then 3 a second; one big shell every 1.25 s; 10 comets a second; a launch
// sound for the comets at most 5 times a second.
export const LIMITS = {
  shells: { perSecond: 3, capacity: 4 },
  big: { perSecond: 0.8, capacity: 1 },
  comets: { perSecond: 10, capacity: 4 },
  whoosh: { perSecond: 5, capacity: 2 },
};

// How fast the buckets refill: full speed on quality step 1, slower on the
// lower steps (the browser is already struggling) and with "reduce motion".
export function paceFor(level = 0, calm = false) {
  const byLevel = [1, 0.7, 0.45];
  return byLevel[Math.max(0, Math.min(byLevel.length - 1, level))] * (calm ? 0.5 : 1);
}

// Is there room in the sky for more? `count` sparks are alive, `max` is the
// engine's cap. Comets stop first, then tapped shells; the show's own
// shells are never refused by this.
export function hasRoom(kind, count, max) {
  return count < max * (kind === 'comet' ? 0.6 : 0.85);
}

// ---------- random numbers of its own ----------

// A small seeded generator (0 <= n < 1), separate from the one that builds
// the shows. Nothing a visitor does can change which show a seed gives.
export function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
