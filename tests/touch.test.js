// Playing in the sky (js/touch.js): tap, long press and drag; the path that
// becomes comets; the limits; and the visitor's own random numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOLD_MS, RING_DELAY_MS, SLOP, MAX_PRESSES, FAN, LEAN, COMET_SPEED, BIG_SIZE, LIMITS,
  startPress, pressMove, pressTick, pressUp, ringAt, createTrail, cometFor,
  tapShell, bigShell, sparkFactor, createBucket, paceFor, hasRoom, createRandom,
} from '../js/touch.js';
import { BURST_TYPES } from '../js/fireworks.js';
import { buildShow } from '../js/show.js';
import { scenes } from '../js/scenes/index.js';

const COLORS = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];

// ---------- tap, long press, drag ----------

test('a long press is about half a second', () => {
  assert.equal(HOLD_MS, 500);
  assert.ok(RING_DELAY_MS >= 80 && RING_DELAY_MS < HOLD_MS / 2);
  assert.ok(SLOP.touch > SLOP.mouse, 'a finger is less steady than a mouse');
  assert.equal(MAX_PRESSES, 2);
});

test('a quick press and release is a tap', () => {
  for (const ms of [0, 30, 120, 300, HOLD_MS - 1]) {
    const p = startPress(1000, 50, 60, 'mouse');
    assert.equal(pressTick(p, 1000 + ms), null);
    assert.equal(pressUp(p, 1000 + ms), 'tap', `${ms} ms`);
    assert.equal(pressUp(p, 1000 + ms + 5), null, 'only once');
  }
});

test('a press held still for half a second is a long press, once, without waiting for the release', () => {
  const p = startPress(0, 50, 60, 'touch');
  assert.equal(pressTick(p, HOLD_MS - 1), null);
  assert.equal(pressTick(p, HOLD_MS), 'hold');
  assert.equal(pressTick(p, HOLD_MS + 100), null, 'the big shell is fired once');
  assert.equal(pressMove(p, HOLD_MS + 200, 300, 300), null, 'after the big shell, moving draws nothing');
  assert.equal(pressUp(p, HOLD_MS + 900), null, 'and lifting the finger fires nothing more');
});

test('a long press whose timer never ran still counts when the finger is lifted', () => {
  const p = startPress(0, 50, 60, 'touch');
  assert.equal(pressUp(p, HOLD_MS + 40), 'hold');
});

test('a small wobble does not turn a tap or a long press into a drag', () => {
  for (const pointer of ['mouse', 'touch', 'pen']) {
    const p = startPress(0, 100, 100, pointer);
    const s = SLOP[pointer];
    assert.equal(pressMove(p, 50, 100 + s, 100), null);
    assert.equal(pressMove(p, 90, 100, 100 - s), null);
    assert.equal(pressTick(p, HOLD_MS), 'hold', `${pointer}: the wobble spoiled the long press`);
  }
  const tap = startPress(0, 100, 100, 'touch');
  pressMove(tap, 40, 108, 104);
  assert.equal(pressUp(tap, 150), 'tap');
  assert.equal(startPress(0, 0, 0, 'something-new').slop, SLOP.touch, 'an unknown pointer is treated like a finger');
});

test('moving away before half a second is a drag, and a drag is never a tap or a long press', () => {
  const p = startPress(0, 100, 100, 'mouse');
  assert.equal(pressMove(p, 80, 100 + SLOP.mouse + 1, 100), 'drag');
  assert.equal(pressMove(p, 120, 180, 90), 'drag');
  assert.equal(pressTick(p, HOLD_MS + 500), null, 'a slow drag fired a big shell');
  assert.equal(pressMove(p, 2000, 300, 90), 'drag', 'a drag may last as long as you like');
  assert.equal(pressUp(p, 2500), 'drag-end');
  assert.equal(pressMove(p, 2600, 400, 90), null, 'after the release nothing more happens');
});

test('moving away after half a second is still a long press, not a drag', () => {
  const p = startPress(0, 100, 100, 'mouse');
  assert.equal(pressMove(p, HOLD_MS + 5, 300, 100), null);
  assert.equal(pressTick(p, HOLD_MS + 6), 'hold');
});

test('the ring grows from nothing to full exactly as the long press arrives', () => {
  const p = startPress(1000, 10, 10, 'touch');
  assert.equal(ringAt(p, 1000), 0);
  assert.equal(ringAt(p, 1000 + RING_DELAY_MS), 0, 'a quick tap shows no ring');
  assert.equal(ringAt(p, 1000 + HOLD_MS), 1);
  assert.equal(ringAt(p, 1000 + HOLD_MS + 400), 1);
  let last = 0;
  for (let t = 1000; t <= 1000 + HOLD_MS; t += 10) {
    const k = ringAt(p, t);
    assert.ok(k >= last && k >= 0 && k <= 1, 'the ring only grows');
    last = k;
  }
  const mid = ringAt(p, 1000 + (HOLD_MS + RING_DELAY_MS) / 2);
  assert.ok(Math.abs(mid - 0.5) < 1e-9);
  // No ring once the press has become something.
  pressTick(p, 1000 + HOLD_MS);
  assert.equal(ringAt(p, 1000 + HOLD_MS), 0);
  const d = startPress(0, 0, 0, 'mouse');
  pressMove(d, 200, 90, 0);
  assert.equal(ringAt(d, 300), 0, 'a drag has no ring');
});

// ---------- the path becomes comets ----------

test('a path gives one comet place every 30 pixels, however the pointer events arrive', () => {
  // The same 300-pixel line, sent as 1 event, as 10 and as 300.
  for (const steps of [1, 10, 300]) {
    const trail = createTrail(100, 200);
    const places = [];
    for (let i = 1; i <= steps; i++) places.push(...trail.add(100 + (300 * i) / steps, 200));
    assert.equal(places.length, 10, `${steps} events gave ${places.length} places`);
    places.forEach((p, i) => {
      assert.ok(Math.abs(p.x - (130 + i * 30)) < 1e-6, `place ${i} at ${p.x}`);
      assert.ok(Math.abs(p.y - 200) < 1e-6);
      assert.ok(Math.abs(p.lean - 1) < 1e-9, 'the path goes right');
    });
  }
});

test('the places follow the path round corners, and standing still gives none', () => {
  const trail = createTrail(0, 0, 10);
  assert.deepEqual(trail.add(0, 0), [], 'no movement, no comet');
  assert.deepEqual(trail.add(4, 0), [], 'not far enough yet');
  const a = trail.add(25, 0);                 // 25 px right in all: places at 10 and 20
  assert.deepEqual(a.map((p) => Math.round(p.x)), [10, 20]);
  const b = trail.add(25, 30);                // then 30 px down: 5 px were left over, so at y = 5, 15, 25
  assert.deepEqual(b.map((p) => [Math.round(p.x), Math.round(p.y)]), [[25, 5], [25, 15], [25, 25]]);
  assert.ok(b.every((p) => Math.abs(p.lean) < 1e-9), 'straight down: no lean');
  const c = trail.add(-5, 30);                // back to the left
  assert.ok(c.length === 3 && c.every((p) => p.lean === -1));
  // Every place is on the path, and neighbours are `spacing` apart along it.
  const all = [...a, ...b, ...c];
  for (const p of all) assert.ok((Math.abs(p.y) < 1e-6 && p.x <= 25) || (Math.abs(p.x - 25) < 1e-6) || Math.abs(p.y - 30) < 1e-6);
});

test('a longer path gives more comet places, in step with its length', () => {
  for (const spacing of [20, 30, 45]) {
    const trail = createTrail(0, 0, spacing);
    let n = 0, length = 0, x = 0, y = 0;
    const r = createRandom(5);
    for (let i = 0; i < 400; i++) {
      const nx = x + (r() - 0.3) * 40, ny = y + (r() - 0.5) * 40;
      length += Math.hypot(nx - x, ny - y);
      n += trail.add(nx, ny).length;
      x = nx; y = ny;
    }
    assert.equal(n, Math.floor(length / spacing + 1e-9), `spacing ${spacing}`);
  }
});

test('the comets make a fan: upward, turning left and right by turns, leaning the way of the path', () => {
  const rand = createRandom(1);
  const view = { horizon: 600, U: 1000 };
  const straight = [0, 1, 2, 3, 4, 5].map((n) => cometFor({ x: 100 + n * 30, y: 300, lean: 0 }, n, view, COLORS, rand));
  straight.forEach((c, n) => {
    assert.equal(Math.sign(c.angle), n % 2 === 0 ? -1 : 1, 'neighbours turn opposite ways');
    assert.ok(Math.abs(c.angle) >= FAN * 0.75 - 1e-9 && Math.abs(c.angle) <= FAN * 1.25 + 1e-9);
    assert.ok(Math.abs(c.angle) < Math.PI / 2, 'every comet goes up, none down');
    assert.ok(c.speed >= 1000 * COMET_SPEED * 0.85 && c.speed <= 1000 * COMET_SPEED * 1.15);
    assert.ok(COLORS.includes(c.color));
    assert.equal(c.x, 100 + n * 30);
    assert.equal(c.y, 300);
  });
  // A path drawn to the right leans every comet to the right; to the left, left.
  for (let n = 0; n < 6; n++) {
    assert.ok(cometFor({ x: 0, y: 0, lean: 1 }, n, view, COLORS, rand).angle > 0);
    assert.ok(cometFor({ x: 0, y: 0, lean: -1 }, n, view, COLORS, rand).angle < 0);
    const wild = cometFor({ x: 0, y: 0, lean: 99 }, n, view, COLORS, rand).angle;
    assert.ok(Math.abs(wild) <= LEAN + FAN * 1.25 + 1e-9 && Math.abs(wild) < Math.PI / 2);
  }
});

test('a path drawn over the water gives comets from the waterline, never from under it', () => {
  const rand = createRandom(2);
  const c = cometFor({ x: 50, y: 750, lean: 0 }, 0, { horizon: 600, U: 800 }, COLORS, rand);
  assert.equal(c.y, 600);
  assert.equal(cometFor({ x: 50, y: 100, lean: 0 }, 0, { horizon: 600, U: 800 }, COLORS, rand).y, 100);
});

// ---------- the shells ----------

test('a tap gives an ordinary shell of a known shape, in the colours of the place', () => {
  const rand = createRandom(3);
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const s = tapShell(COLORS, rand);
    assert.ok(BURST_TYPES.includes(s.type));
    assert.ok(s.type !== 'salute' && s.type !== 'kamuro', 'as before: no salute and no kamuro from a tap');
    assert.ok(COLORS.includes(s.color) && COLORS.includes(s.color2));
    assert.ok(s.size >= 0.75 && s.size <= 1.15);
    seen.add(s.type);
  }
  assert.equal(seen.size, 9, 'every shape turns up');
});

test('a long press gives one big shell: much larger, but with no more sparks than an ordinary one', () => {
  const rand = createRandom(4);
  for (let i = 0; i < 200; i++) {
    const big = bigShell(COLORS, rand);
    assert.ok(BURST_TYPES.includes(big.type));
    assert.equal(big.size, BIG_SIZE);
    assert.ok(big.size >= 1.4 * 1.15, 'clearly bigger than the biggest tapped shell (1.15)');
    assert.ok(sparkFactor(big) <= 1 + 1e-9, `spark factor ${sparkFactor(big)}`);
    assert.ok(sparkFactor(big) <= sparkFactor({ size: 1 }) + 1e-9);
    assert.ok(COLORS.includes(big.color) && COLORS.includes(big.color2));
  }
  assert.equal(sparkFactor({ size: 1 }), 1);
  assert.ok(sparkFactor({ size: BIG_SIZE }) > 1.15, 'without the lower density it would have more sparks');
});

// ---------- limits ----------

test('taps: four at once, then three a second, however fast the visitor taps', () => {
  const bucket = createBucket(LIMITS.shells);
  let fired = 0;
  for (let t = 0; t < 10000; t += 20) if (bucket.take(t)) fired += 1;     // 50 taps a second for 10 s
  assert.ok(fired >= 30 && fired <= 4 + 30, `${fired} shells in 10 s`);
  // In any one second: never more than capacity + rate.
  const b2 = createBucket(LIMITS.shells);
  const times = [];
  for (let t = 0; t < 5000; t += 7) if (b2.take(t)) times.push(t);
  for (const t of times) assert.ok(times.filter((u) => u >= t && u < t + 1000).length <= LIMITS.shells.capacity + LIMITS.shells.perSecond);
});

test('big shells: one, then the next only after more than a second', () => {
  const bucket = createBucket(LIMITS.big);
  assert.equal(bucket.take(0), true);
  assert.equal(bucket.take(500), false);
  assert.equal(bucket.take(1000), false);
  assert.equal(bucket.take(1300), true);
  assert.equal(bucket.take(1400), false);
});

test('comets: at most about ten a second on a long fast drag', () => {
  const bucket = createBucket(LIMITS.comets);
  let fired = 0;
  for (let t = 0; t < 6000; t += 5) if (bucket.take(t)) fired += 1;        // 200 places a second
  assert.ok(fired <= LIMITS.comets.capacity + 60 && fired >= 55, `${fired} comets in 6 s`);
});

test('a bucket is patient: unused time is not saved up beyond its capacity, and time never runs backwards', () => {
  const bucket = createBucket({ perSecond: 2, capacity: 3 });
  for (let i = 0; i < 3; i++) assert.equal(bucket.take(0), true);
  assert.equal(bucket.take(0), false);
  let got = 0;
  for (let i = 0; i < 10; i++) if (bucket.take(60000)) got += 1;           // a minute later
  assert.equal(got, 3);
  assert.equal(bucket.take(1000), false, 'an older time gives nothing');
  assert.equal(bucket.take(60499), false);
  assert.equal(bucket.take(60500), true);
});

test('the lower quality steps and reduce motion get fewer visitor fireworks', () => {
  assert.equal(paceFor(0), 1);
  assert.ok(paceFor(1) < paceFor(0) && paceFor(2) < paceFor(1));
  assert.equal(paceFor(9), paceFor(2));
  assert.equal(paceFor(-1), paceFor(0));
  assert.equal(paceFor(0, true), 0.5);
  const count = (scale) => { const b = createBucket(LIMITS.comets); let n = 0; for (let t = 0; t < 10000; t += 5) if (b.take(t, scale)) n += 1; return n; };
  assert.ok(count(paceFor(2)) < count(paceFor(0)) * 0.55);
  assert.ok(count(paceFor(0, true)) < count(paceFor(0)) * 0.6);
});

test('nothing is added to a sky that is already full of sparks; comets give way first', () => {
  assert.equal(hasRoom('comet', 0, 1000), true);
  assert.equal(hasRoom('comet', 599, 1000), true);
  assert.equal(hasRoom('comet', 600, 1000), false);
  assert.equal(hasRoom('shell', 600, 1000), true);
  assert.equal(hasRoom('shell', 850, 1000), false);
  assert.equal(hasRoom('big', 849, 1000), true);
});

// ---------- random numbers of its own ----------

test('the visitor generator is seeded, even, and never the same as another seed', () => {
  const a = createRandom(7), b = createRandom(7), c = createRandom(8);
  const xs = Array.from({ length: 2000 }, () => a());
  assert.deepEqual(xs.slice(0, 50), Array.from({ length: 50 }, () => b()));
  assert.notDeepEqual(xs.slice(0, 5), Array.from({ length: 5 }, () => c()));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  assert.ok(Math.abs(mean - 0.5) < 0.03);
});

test('nothing a visitor fires uses Math.random, and a shared show stays the same show', () => {
  const cfg = scenes[0].show;
  const before = buildShow(cfg, 3735928559, { theme: 'harbour-blue' });
  const real = Math.random;
  Math.random = () => { throw new Error('Math.random was used'); };
  try {
    const rand = createRandom(99);
    const trail = createTrail(0, 0);
    for (let i = 0; i < 200; i++) {
      tapShell(COLORS, rand);
      bigShell(COLORS, rand);
      trail.add(i * 17, (i % 5) * 9).forEach((place, n) => cometFor(place, n, { horizon: 500, U: 900 }, COLORS, rand));
    }
    // The show built in the middle of all that play is the very same show.
    assert.deepEqual(buildShow(cfg, 3735928559, { theme: 'harbour-blue' }), before);
  } finally {
    Math.random = real;
  }
  assert.deepEqual(buildShow(cfg, 3735928559, { theme: 'harbour-blue' }), before);
});
