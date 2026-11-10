import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShow, createRunner, actAt, ACT_LABELS } from '../js/show.js';
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

// ---------- act names ----------

test('the timeline lists opening, the middle acts, the waterfall and the finale in order', () => {
  const s = buildShow(cfg, 8);
  const keys = s.timeline.map((a) => a.key);
  assert.equal(keys[0], 'opening');
  assert.deepEqual(keys.slice(1, 1 + cfg.movements), s.acts);
  assert.equal(keys[keys.length - 2], 'waterfall');
  assert.equal(keys[keys.length - 1], 'finale');
  assert.equal(keys.length, cfg.movements + 3);
  assert.deepEqual(s.timeline.map((a) => a.index), keys.map((_, i) => i + 1));
});

test('acts follow each other with no gaps and stay inside the show', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const { timeline, duration } = buildShow(cfg, seed);
    assert.equal(timeline[0].start, 0.2);
    for (let i = 0; i < timeline.length; i++) {
      assert.ok(timeline[i].end > timeline[i].start, 'an act has a length');
      if (i > 0) assert.equal(timeline[i].start, timeline[i - 1].end, 'no gap, no overlap');
    }
    assert.ok(timeline[timeline.length - 1].end < duration, 'the afterglow comes after the last act');
  }
});

test('actAt gives the act that is playing, and null outside the acts', () => {
  const s = buildShow(cfg, 3);
  const [first, second] = s.timeline;
  assert.equal(actAt(s, 0), null);
  assert.equal(actAt(s, first.start - 0.01), null);
  assert.equal(actAt(s, first.start).key, 'opening');
  assert.equal(actAt(s, first.end - 0.001).key, 'opening');
  assert.equal(actAt(s, first.end).key, second.key, 'the next act starts exactly when the last one ends');
  const last = s.timeline[s.timeline.length - 1];
  assert.equal(actAt(s, last.end - 0.001).key, 'finale');
  assert.equal(actAt(s, last.end), null);
  assert.equal(actAt(s, s.duration + 100), null);
});

test('every cue is launched while its own act is playing', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = buildShow(cfg, seed);
    for (const cue of s.cues) {
      assert.ok(actAt(s, cue.t), `seed ${seed}: cue at ${cue.t} is outside every act`);
    }
    assert.equal(actAt(s, s.cues[0].t).key, 'opening');
    assert.equal(actAt(s, s.cues[s.cues.length - 1].t).key, 'finale');
  }
});

test('stepping through a show gives each caption once, in order, then none', () => {
  const s = buildShow(cfg, 12);
  const seen = [];
  for (let t = 0; t <= s.duration; t += 0.05) {
    const key = actAt(s, t)?.key ?? null;
    if (seen[seen.length - 1] !== key) seen.push(key);
  }
  assert.deepEqual(seen, [null, ...s.timeline.map((a) => a.key), null]);
});

test('act labels have readable defaults and a scene can change them', () => {
  const s = buildShow(cfg, 2);
  assert.equal(s.timeline[0].label, 'Opening');
  assert.equal(s.timeline[s.timeline.length - 1].label, 'Finale');
  assert.equal(s.timeline.find((a) => a.key === 'waterfall').label, 'Waterfall');
  for (const act of s.timeline) assert.ok(ACT_LABELS[act.key], `no label for ${act.key}`);

  const custom = buildShow({ ...cfg, actLabels: { waterfall: 'Bridge of Light', finale: 'Grand Finale' } }, 2);
  assert.equal(custom.timeline.find((a) => a.key === 'waterfall').label, 'Bridge of Light');
  assert.equal(custom.timeline[custom.timeline.length - 1].label, 'Grand Finale');
  assert.equal(custom.timeline[0].label, 'Opening');
});

test('a scene without a waterfall has no waterfall act and still counts acts correctly', () => {
  const s = buildShow({ ...cfg, features: {} }, 4);
  assert.ok(!s.timeline.some((a) => a.key === 'waterfall'));
  assert.equal(s.timeline.length, cfg.movements + 2);
  assert.deepEqual(s.timeline.map((a) => a.index), s.timeline.map((_, i) => i + 1));
});

test('adding the timeline did not change any cue (same show as before for a seed)', () => {
  const s = buildShow(cfg, 42);
  assert.equal(s.cues.length, buildShow(cfg, 42).cues.length);
  assert.equal(s.duration, s.timeline[s.timeline.length - 1].end + 4.5);
});
