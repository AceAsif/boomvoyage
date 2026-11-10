import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShow, createRunner } from '../js/show.js';
import { BURST_TYPES } from '../js/fireworks.js';
import { scenes } from '../js/scenes/index.js';

const cfg = scenes[0].show;

test('the same seed gives the same show', () => {
  assert.deepEqual(buildShow(cfg, 42), buildShow(cfg, 42));
});

test('different seeds give different shows', () => {
  const keys = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const s = buildShow(cfg, seed);
    keys.add(s.title + '|' + s.acts.join(','));
  }
  assert.ok(keys.size >= 12, `only ${keys.size} distinct shows out of 20`);
});

test('cues are sorted, valid and inside the show', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = buildShow(cfg, seed);
    assert.ok(s.duration > 30 && s.duration < 75, `duration ${s.duration}`);
    assert.ok(s.duration < cfg.intervalSeconds, 'a show must end before the next one starts');
    let last = 0;
    for (const cue of s.cues) {
      assert.ok(cue.t >= last, 'sorted by time');
      last = cue.t;
      assert.ok(cue.t < s.duration);
      if (cue.x !== undefined) assert.ok(cue.x >= 0 && cue.x <= 1);
      if (cue.kind === 'shell') {
        assert.ok(BURST_TYPES.includes(cue.type), cue.type);
        assert.ok(cue.h >= 0 && cue.h <= 1);
      }
    }
  }
});

test('every show has a waterfall and a finale when the scene supports it', () => {
  const s = buildShow(cfg, 7);
  assert.equal(s.cues.filter((c) => c.kind === 'waterfall').length, 1);
  assert.ok(s.cues.filter((c) => c.type === 'kamuro').length >= 6);
});

test('a scene without a waterfall line gets no waterfall cue', () => {
  const s = buildShow({ ...cfg, features: {} }, 7);
  assert.equal(s.cues.filter((c) => c.kind === 'waterfall' || c.kind === 'crown').length, 0);
});

test('avoid skips the last palette', () => {
  for (let seed = 1; seed <= 40; seed++) {
    assert.notEqual(buildShow(cfg, seed, { avoid: 'Jacaranda' }).title, 'Jacaranda');
  }
});

test('calm shows have no strobe or salute and a slower finale', () => {
  const calm = buildShow(cfg, 5, { calm: true });
  const full = buildShow(cfg, 5);
  assert.ok(!calm.cues.some((c) => c.type === 'strobe' || c.type === 'salute'));
  assert.ok(calm.cues.length < full.cues.length);
});

test('runner hands out each cue once, in time order', () => {
  const s = buildShow(cfg, 3);
  const run = createRunner(s);
  let count = 0;
  for (let t = 0; t <= s.duration; t += 0.05) count += run.due(t).length;
  assert.equal(count, s.cues.length);
  assert.equal(run.due(s.duration + 10).length, 0);
  assert.ok(run.finished(s.duration));
  assert.ok(!run.finished(1));
});

test('runner drops cues missed while the tab was asleep', () => {
  const show = {
    duration: 30,
    cues: [
      { t: 1, kind: 'shell' },
      { t: 2, kind: 'waterfall', dur: 9 },
      { t: 3, kind: 'shell' },
      { t: 7.5, kind: 'shell' },
    ],
  };
  const run = createRunner(show);
  const due = run.due(8); // first call comes 8 seconds in
  assert.deepEqual(due.map((c) => c.kind), ['waterfall', 'shell']);
  assert.equal(due[0].dur, 3); // the waterfall resumes with the time left
  assert.equal(due[1].t, 7.5);
});

test('a show knows its theme id', () => {
  const s = buildShow(cfg, 11);
  assert.equal(s.themeId, s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
});

test('the same seed and theme id rebuild exactly the same show (share links)', () => {
  for (let seed = 1; seed <= 40; seed++) {
    // The sender's show: its theme was chosen with "avoid" in play.
    const sent = buildShow(cfg, seed, { avoid: cfg.palettes[seed % cfg.palettes.length].name });
    // The receiver has no "avoid", only the link (seed + theme id).
    const received = buildShow(cfg, seed, { theme: sent.themeId });
    assert.deepEqual(received, sent, `seed ${seed}`);
  }
});

test('an unknown theme id falls back to the normal pick', () => {
  assert.deepEqual(buildShow(cfg, 5, { theme: 'no-such-theme' }), buildShow(cfg, 5));
});

test('a theme id changes only the colours, not the choreography', () => {
  const a = buildShow(cfg, 21, { theme: 'harbour-blue' });
  const b = buildShow(cfg, 21, { theme: 'waratah' });
  assert.equal(a.title, 'Harbour Blue');
  assert.equal(b.title, 'Waratah');
  assert.deepEqual(a.cues.map((c) => [c.t, c.kind, c.type, c.x]), b.cues.map((c) => [c.t, c.kind, c.type, c.x]));
});
