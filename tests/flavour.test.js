// Tests for the parts of a show a scene can choose: its acts, its opening,
// its signature act and its finale mix. And a check that scenes which choose
// nothing (Sydney) are left exactly as they were.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShow, actAt, MOVEMENTS, EXTRA_MOVEMENTS, SIGNATURES, SIGNATURE_RIG, ACT_LABELS } from '../js/show.js';
import { BURST_TYPES } from '../js/fireworks.js';
import sydney from '../js/scenes/sydney.js';

const base = { ...sydney.show, features: {} };

test('Sydney shows are unchanged by the new options (fixed seeds, known shows)', () => {
  // These numbers were taken from the code before the options were added.
  const expected = { 1: ['Southern Gold', 'willows,sparkle,garden', 112], 2: ['Coral Sea', 'garden,sparkle,mirror', 115], 3: ['Coral Sea', 'sparkle,chase,fans', 133] };
  for (const [seed, [title, acts, cues]] of Object.entries(expected)) {
    const s = buildShow(sydney.show, Number(seed));
    assert.equal(s.title, title);
    assert.equal(s.acts.join(','), acts);
    assert.equal(s.cues.length, cues);
    assert.ok(s.cues.every((c) => ['shell', 'comet', 'mine', 'waterfall', 'crown'].includes(c.kind)));
    assert.ok(s.cues.every((c) => c.set === undefined), 'no anchor sets in a classic show');
  }
});

test('without a list of acts only the seven classic acts are picked', () => {
  for (let seed = 1; seed <= 60; seed++) {
    for (const act of buildShow(sydney.show, seed).acts) assert.ok(MOVEMENTS[act], act);
  }
});

test('a scene can list its own acts, also the extra ones', () => {
  const cfg = { ...base, acts: ['fountain', 'palms', 'waltz', 'chimes'], movements: 3 };
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const s = buildShow(cfg, seed);
    assert.equal(s.acts.length, 3);
    assert.equal(new Set(s.acts).size, 3, 'no act twice in one show');
    for (const act of s.acts) { assert.ok(EXTRA_MOVEMENTS[act], act); seen.add(act); }
  }
  assert.equal(seen.size, 4, 'every listed act gets its turn');
});

test('unknown act names in a list are ignored', () => {
  const s = buildShow({ ...base, acts: ['waltz', 'no-such-act', 'chimes'], movements: 3 }, 5);
  assert.deepEqual([...s.acts].sort(), ['chimes', 'waltz']);
});

test('every extra act gives valid cues and has a caption', () => {
  for (const name of Object.keys(EXTRA_MOVEMENTS)) {
    const s = buildShow({ ...base, acts: [name], movements: 1 }, 9);
    assert.deepEqual(s.acts, [name]);
    assert.ok(ACT_LABELS[name], `no caption for ${name}`);
    const act = s.timeline.find((a) => a.key === name);
    const mine = s.cues.filter((c) => c.t >= act.start && c.t < act.end);
    assert.ok(mine.length >= 6, `${name} has only ${mine.length} cues`);
    for (const cue of mine) {
      if (cue.x !== undefined) assert.ok(cue.x >= 0 && cue.x <= 1, `${name} x=${cue.x}`);
      if (cue.kind === 'shell') { assert.ok(BURST_TYPES.includes(cue.type)); assert.ok(cue.h >= 0 && cue.h <= 1); }
    }
  }
});

test('each signature act takes the place of the waterfall and uses only its own anchor sets', () => {
  for (const name of Object.keys(SIGNATURES)) {
    const s = buildShow({ ...base, signature: name }, 4);
    const keys = s.timeline.map((a) => a.key);
    assert.equal(keys[keys.length - 2], name);
    assert.ok(!keys.includes('waterfall'));
    assert.ok(ACT_LABELS[name]);
    const act = s.timeline.find((a) => a.key === name);
    const sets = new Set(s.cues.filter((c) => c.set && c.t >= act.start && c.t < act.end).map((c) => c.set));
    for (const need of SIGNATURE_RIG[name]) assert.ok(sets.has(need), `${name} never uses the "${need}" anchors`);
    for (const cue of s.cues) assert.ok(actAt(s, cue.t), 'every cue is inside an act');
  }
});

test('a scene with a waterfall keeps the waterfall even if a signature is named', () => {
  const s = buildShow({ ...sydney.show, signature: 'wheel' }, 4);
  assert.ok(s.timeline.some((a) => a.key === 'waterfall'));
  assert.ok(!s.timeline.some((a) => a.key === 'wheel'));
});

test('an unknown signature or opening falls back quietly', () => {
  const plain = buildShow(base, 6);
  assert.deepEqual(buildShow({ ...base, signature: 'nope', opening: 'nope' }, 6), plain);
});

test('each opening is different, lasts as long as the classic one and starts the show', () => {
  const firsts = new Set();
  for (const opening of ['classic', 'tower', 'duet', 'strikes']) {
    const s = buildShow({ ...base, opening }, 7);
    assert.equal(s.timeline[0].key, 'opening');
    assert.ok(Math.abs(s.timeline[0].end - s.timeline[0].start - 4.5) < 1e-9);
    const cues = s.cues.filter((c) => c.t < s.timeline[0].end);
    assert.ok(cues.length >= 4);
    firsts.add(cues.map((c) => `${c.kind}:${c.type || ''}`).join(','));
  }
  assert.equal(firsts.size, 4);
});

test('finaleTypes changes what the finale fires, not how long it is', () => {
  const plain = buildShow(base, 11);
  const rings = buildShow({ ...base, finaleTypes: ['ring'] }, 11);
  assert.equal(rings.duration, plain.duration);
  const finale = rings.timeline[rings.timeline.length - 1];
  const barrage = rings.cues.filter((c) => c.kind === 'shell' && c.t >= finale.start && c.t < finale.start + 8);
  assert.ok(barrage.length > 20);
  assert.ok(barrage.every((c) => c.type === 'ring'));
});

test('shows with a signature still fit before the next show and are the same for the same seed', () => {
  for (const signature of Object.keys(SIGNATURES)) {
    const cfg = { ...base, signature, acts: ['fountain', 'palms', 'waltz', 'chimes', 'willows'] };
    for (let seed = 1; seed <= 20; seed++) {
      const s = buildShow(cfg, seed);
      assert.ok(s.duration < cfg.intervalSeconds);
      assert.deepEqual(buildShow(cfg, seed), s);
    }
  }
});
