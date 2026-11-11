import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, drawLife, lifeRandom, LIFE_DEFAULTS } from '../js/life.js';
import { buildShow } from '../js/show.js';
import sydney from '../js/scenes/sydney.js';
import { fakeContext } from './helpers/fake-canvas.js';

// Four pretend events. The drawing does not matter for the timing rules.
const DEFS = [
  { id: 'boat', group: 'water', layer: 'water', duration: [20, 28], weight: 2, draw() {} },
  { id: 'raft', group: 'water', layer: 'water', duration: [14, 20], draw() {} },
  { id: 'star', layer: 'sky', duration: [4, 6], calm: false, draw() {} },
  { id: 'lamps', layer: 'land', duration: [10, 16], draw() {} },
];

const SHOW = 47;      // seconds a show lasts
const CYCLE = 120;    // seconds from one show start to the next
const DT = 1 / 30;

// Runs the director through `cycles` shows, like the page does: a show plays
// for 47 s, then it is quiet until the next one starts at 120 s.
// `check(life, state)` is called on every frame.
function run(life, cycles, check, { dt = DT } = {}) {
  let wall = 0;
  const end = cycles * CYCLE;
  while (wall < end) {
    const inCycle = wall % CYCLE;
    const playing = inCycle < SHOW;
    const remaining = CYCLE - inCycle;
    life.tick(dt, remaining, !playing);
    if (check) check(life, { wall, inCycle, playing, remaining });
    wall += dt;
  }
  return life;
}

test('lifeRandom gives the same numbers for the same seed, between 0 and 1', () => {
  const a = lifeRandom(42), b = lifeRandom(42), c = lifeRandom(43);
  const xs = Array.from({ length: 50 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 50 }, () => b()));
  assert.notDeepEqual(xs, Array.from({ length: 50 }, () => c()));
  for (const x of xs) assert.ok(x >= 0 && x < 1);
});

test('events never overlap with a show', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const life = run(createLife(DEFS, { seed }), 6, (l, s) => {
      // The show has been on for longer than the quick fade: nothing may be left.
      if (s.playing && s.inCycle > LIFE_DEFAULTS.cutFade + 0.1) assert.equal(l.active.length, 0, `seed ${seed}: life during a show at ${s.wall.toFixed(1)}s`);
      // In the last moments before a show everything is already gone.
      if (!s.playing && s.remaining < LIFE_DEFAULTS.guard - 0.2) assert.equal(l.active.length, 0, `seed ${seed}: life ${s.remaining.toFixed(2)}s before a show`);
    });
    assert.ok(life.log.length >= 12, `seed ${seed}: only ${life.log.length} events in 6 quiet stretches`);
    for (const ev of life.log) {
      const quietAt = ev.at % CYCLE;   // the clock runs with the wall here
      assert.ok(quietAt >= SHOW, 'an event started while a show was playing');
      assert.ok(quietAt + ev.dur <= CYCLE - LIFE_DEFAULTS.guard + 0.05, 'an event was planned to run into the next show');
    }
  }
});

test('never more than 2 events at once, and never two of the same group', () => {
  let most = 0;
  run(createLife(DEFS, { seed: 9 }), 10, (l) => {
    most = Math.max(most, l.active.length);
    assert.ok(l.active.length <= 2);
    const groups = l.active.map((e) => e.def.group ?? e.def.id);
    assert.equal(new Set(groups).size, groups.length, 'two events of one group at once');
  });
  assert.equal(most, 2, 'two at once should happen sometimes');
});

test('the same seed gives the same life events; another seed gives others', () => {
  const a = run(createLife(DEFS, { seed: 77 }), 5).log;
  const b = run(createLife(DEFS, { seed: 77 }), 5).log;
  const c = run(createLife(DEFS, { seed: 78 }), 5).log;
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map((e) => e.id), c.map((e) => e.id));
});

test('a new event starts every 10 to 25 seconds, the first one 4 to 9 seconds into the quiet', () => {
  const life = run(createLife(DEFS, { seed: 5 }), 12);
  const byCycle = new Map();
  for (const ev of life.log) {
    const k = Math.floor(ev.at / CYCLE);
    if (!byCycle.has(k)) byCycle.set(k, []);
    byCycle.get(k).push(ev.at % CYCLE);
  }
  for (const starts of byCycle.values()) {
    assert.ok(starts[0] - SHOW >= 4 - 0.1 && starts[0] - SHOW <= 9 + 0.1, `first event ${(starts[0] - SHOW).toFixed(1)}s into the quiet`);
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i] - starts[i - 1];
      // A start can wait a little longer when its group is still on screen.
      assert.ok(gap >= 10 - 0.1 && gap <= 25 + 3.2, `gap of ${gap.toFixed(1)}s`);
    }
  }
});

test('it never feels like a loop: no event twice in a row, all events get a turn, details differ', () => {
  const life = run(createLife(DEFS.map((d) => ({ ...d, setup: (r) => ({ k: r() }) })), { seed: 3 }), 20, (l) => {
    for (const e of l.active) assert.ok(e.dir === 1 || e.dir === -1);
  });
  const ids = life.log.map((e) => e.id);
  for (let i = 1; i < ids.length; i++) assert.notEqual(ids[i], ids[i - 1], 'the same event twice in a row');
  assert.equal(new Set(ids).size, DEFS.length);
  const durs = new Set(life.log.map((e) => e.dur.toFixed(3)));
  assert.ok(durs.size > life.log.length * 0.9, 'durations should vary');
});

test('an event fades in, is fully there, and fades out by itself', () => {
  const life = createLife([DEFS[3]], { seed: 1 });
  life.tick(DT, 1000, true);
  const e = life.force('lamps', 12);
  const seen = [];
  while (life.active.length) { life.tick(DT, 1000, true); if (life.active.length) seen.push(e.alpha); }
  assert.ok(seen[0] < 0.1, 'starts invisible');
  assert.ok(Math.max(...seen) === 1, 'reaches full strength');
  assert.ok(seen[seen.length - 1] < 0.1, 'ends invisible');
  for (const a of seen) assert.ok(a > 0 && a <= 1);
});

test('"Launch now": when a show starts early everything fades out quickly', () => {
  const life = createLife(DEFS, { seed: 4 });
  for (let t = 0; t < 12; t += DT) life.tick(DT, 70 - t, true);
  if (!life.active.length) life.force('boat');
  for (let t = 0; t < 2; t += DT) life.tick(DT, 60, true);
  assert.ok(life.active.length >= 1);
  let t = 0;
  let last = 1;
  while (life.active.length && t < 5) {
    life.tick(DT, 120, false);           // a show is playing now
    for (const e of life.active) { assert.ok(e.alpha <= last + 1e-9, 'only fading, never back up'); }
    if (life.active.length) last = Math.max(...life.active.map((e) => e.alpha));
    t += DT;
  }
  assert.ok(t <= LIFE_DEFAULTS.cutFade + 0.1, `took ${t.toFixed(2)}s to clear`);
  const before = life.log.length;
  for (let k = 0; k < 600; k++) life.tick(DT, 100, false);
  assert.equal(life.log.length, before, 'nothing starts during a show');
});

test('if time was lost (tab was hidden) events that can no longer finish fade out early', () => {
  const life = createLife(DEFS, { seed: 2 });
  life.tick(DT, 60, true);
  life.force('boat', 28);
  for (let t = 0; t < 5; t += DT) life.tick(DT, 60 - t, true);
  assert.equal(life.active.length, 1);
  // The tab comes back and the next show is suddenly 6 seconds away.
  let remaining = 6;
  while (remaining > 0) {
    life.tick(DT, remaining, true);
    if (remaining < LIFE_DEFAULTS.guard) assert.equal(life.active.length, 0);
    remaining -= DT;
  }
});

test('a hidden tab pauses everything: no frames, no time', () => {
  const life = createLife(DEFS, { seed: 6 });
  for (let t = 0; t < 20; t += DT) life.tick(DT, 70, true);
  const snap = JSON.stringify({ clock: life.clock, log: life.log, alphas: life.active.map((e) => e.alpha) });
  for (let k = 0; k < 1000; k++) { life.tick(0, 70, true); life.tick(NaN, 70, true); }
  assert.equal(JSON.stringify({ clock: life.clock, log: life.log, alphas: life.active.map((e) => e.alpha) }), snap);
});

test('reduce motion: fewer events, one at a time, and no events marked calm: false', () => {
  const calm = run(createLife(DEFS, { seed: 8, calm: true }), 10, (l) => assert.ok(l.active.length <= 1));
  const full = run(createLife(DEFS, { seed: 8 }), 10);
  assert.ok(calm.log.length < full.log.length);
  assert.ok(!calm.log.some((e) => e.id === 'star'));
  assert.ok(calm.log.length >= 10, 'still alive');
});

test('life has its own random numbers: it never touches Math.random', () => {
  const real = Math.random;
  Math.random = () => { throw new Error('life must not use Math.random'); };
  try {
    run(createLife(DEFS.map((d) => ({ ...d, setup: (r) => ({ a: r(), b: r() }) })), { seed: 11 }), 3);
  } finally {
    Math.random = real;
  }
});

test('the fireworks are identical with and without life events', () => {
  const cfg = sydney.show;
  const plain = [101, 202, 303].map((seed) => buildShow(cfg, seed, { avoid: 'Jacaranda' }));

  // The same shows again, but with life running before and between them.
  const life = createLife(sydney.life || DEFS, { seed: 999 });
  const withLife = [101, 202, 303].map((seed) => {
    run(life, 2);
    const show = buildShow(cfg, seed, { avoid: 'Jacaranda' });
    run(life, 1);
    return show;
  });
  assert.deepEqual(withLife, plain);
  assert.ok(life.log.length > 5, 'life really did run');

  // And the other way round: building shows does not change the life events.
  const quiet = createLife(DEFS, { seed: 5 });
  for (let i = 0; i < 4; i++) run(quiet, 1);
  const alone = quiet.log;
  const mixed = createLife(DEFS, { seed: 5 });
  for (let i = 0; i < 4; i++) { buildShow(cfg, 1000 + i); run(mixed, 1); }
  assert.deepEqual(mixed.log, alone);
});

test('drawLife draws only the asked layer and fades each event as a whole', () => {
  const calls = [];
  const defs = [
    { id: 'a', layer: 'sky', duration: [10, 10], draw: (ctx, v, e) => calls.push(['a', ctx.globalAlpha, e.alpha]) },
    { id: 'b', layer: 'water', duration: [10, 10], draw: () => calls.push(['b']) },
    { id: 'c', duration: [10, 10], draw: () => calls.push(['c']) },   // no layer = sky
  ];
  const life = createLife(defs, { seed: 1 });
  life.tick(DT, 500, true);
  life.force('a'); life.force('b'); life.force('c');
  for (let t = 0; t < 3; t += DT) life.tick(DT, 500, true);
  const ctx = fakeContext();
  drawLife(ctx, {}, life.active, 'sky');
  assert.deepEqual(calls.map((c) => c[0]), ['a', 'c']);
  assert.equal(calls[0][1], calls[0][2], 'globalAlpha is set to the event alpha');
  assert.equal(ctx.calls.save, 2);
  assert.equal(ctx.calls.restore, 2);
  calls.length = 0;
  drawLife(ctx, {}, life.active, 'water');
  assert.deepEqual(calls.map((c) => c[0]), ['b']);
  drawLife(ctx, {}, life.active, 'land');
  assert.equal(calls.length, 1);
});

test('a scene with no life list just stays quiet', () => {
  const life = run(createLife(undefined, { seed: 1 }), 2);
  assert.equal(life.log.length, 0);
  assert.equal(life.force('nothing'), null);
});
