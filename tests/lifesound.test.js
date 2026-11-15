// The quiet sounds of life between shows: their plans, how they are built
// with Web Audio nodes, and the limit on how many play at once.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LIFE_SOUNDS, LIFE_SOUND_LIMIT, MIN_FADE, lifeSoundPlan, playLifeSound, createSoundGate } from '../js/lifesound.js';
import { scenes } from '../js/scenes/index.js';

const seeded = (n) => () => { n = (n * 16807) % 2147483647; return (n % 1000) / 1000; };
const plans = (kind) => [0, 1, 2, 3, 4].map((i) => lifeSoundPlan(kind, i ? seeded(i * 77) : () => 0));

// A pretend audio context that writes down what is asked of it.
function fakeAudio() {
  const made = [];
  const param = (value) => {
    const p = { value, events: [] };
    p.setValueAtTime = (v, t) => { p.events.push(['set', v, t]); };
    p.linearRampToValueAtTime = (v, t) => { p.events.push(['ramp', v, t]); };
    return p;
  };
  const node = (type, extra = {}) => {
    const n = { type0: type, to: [], connect(x) { n.to.push(x); return x; }, disconnect() {}, ...extra };
    made.push(n);
    return n;
  };
  const source = (type) => node(type, { frequency: param(440), starts: [], stops: [], start(t) { this.starts.push(t); }, stop(t) { this.stops.push(t); } });
  return {
    made,
    createGain: () => node('gain', { gain: param(1) }),
    createBiquadFilter: () => node('filter', { frequency: param(350), Q: param(1) }),
    createOscillator: () => source('tone'),
    createBufferSource: () => source('noise'),
  };
}

for (const kind of LIFE_SOUNDS) {
  test(`life sound "${kind}": volume starts at zero, ends at zero and only moves in slow ramps`, () => {
    for (const plan of plans(kind)) {
      assert.ok(plan.voices.length >= 1);
      for (const v of plan.voices) {
        const env = v.env;
        assert.equal(env[0][1], 0, 'must start silent');
        assert.equal(env.at(-1)[1], 0, 'must end silent');
        assert.equal(env[0][0], v.start, 'the fade in begins when the source starts');
        for (let i = 1; i < env.length; i++) {
          assert.ok(env[i][0] - env[i - 1][0] >= MIN_FADE - 1e-9, `step ${i} is shorter than ${MIN_FADE}s: a click`);
          assert.ok(env[i][1] >= 0 && env[i][1] <= 0.06, `level ${env[i][1]} is not quiet`);
        }
        assert.ok(v.stop >= env.at(-1)[0], 'stopped before the fade out is over');
        assert.ok(v.stop <= env.at(-1)[0] + 0.25, 'left running long after it went silent');
        assert.ok(v.stop <= plan.length + 1e-9);
      }
    }
  });
}

test('the horn can be heard: it is not the quietest sound and has tones above 200 Hz', () => {
  const top = (kind) => Math.max(...lifeSoundPlan(kind, () => 0.5).voices.flatMap((v) => v.env.map((p) => p[1])));
  const horn = lifeSoundPlan('horn', () => 0.5);
  assert.ok(top('horn') >= top('water'), 'the horn is quieter than the water');
  assert.ok(top('horn') >= 4 * top('chime'));
  assert.ok(horn.voices.some((v) => v.freq > 200));
  for (const v of horn.voices) {
    assert.notEqual(v.wave, 'sine', 'a low pure tone is lost on small speakers');
    assert.ok(v.filter.freq > v.freq * 2, 'the filter removes the horn itself');
  }
});

// The travel cue of voyage mode. An earlier sound here (wind, then a sail)
// was heard as "the water sound". These rules keep the cue a bell chime
// over a low hum, and keep noise a small, low, quiet part of it.
const area = (env) => env.slice(1).reduce((sum, p, i) => sum + (p[0] - env[i][0]) * (p[1] + env[i][1]) / 2, 0);
const peak = (v) => Math.max(...v.env.map((p) => p[1]));
const NOISE_CEILING = 400;   // Hz: no noise filter may open above this

test('the old sail sound is gone', () => {
  assert.equal(lifeSoundPlan('sail'), null);
  assert.ok(!LIFE_SOUNDS.includes('sail'));
  assert.equal(LIFE_SOUNDS[6], 'travel', 'key 7 in ?debug=1 plays the travel cue');
});

test('the travel cue is a rising bell chime over a low hum, with nothing else', () => {
  for (const plan of plans('travel')) {
    assert.deepEqual([...new Set(plan.voices.map((v) => v.part))].sort(), ['chime', 'hum']);

    // The chime: two or three notes, each later and higher than the one before.
    const notes = plan.voices.filter((v) => v.part === 'chime' && v.env[1][1] === Math.max(...plan.voices.filter((n) => n.part === 'chime').map(peak)));
    assert.ok(notes.length === 2 || notes.length === 3, `${notes.length} notes`);
    for (let i = 1; i < notes.length; i++) {
      assert.ok(notes[i].start >= notes[i - 1].start + 0.25, 'the notes are told apart');
      assert.ok(notes[i].freq > notes[i - 1].freq * 1.1, 'the chime must rise');
    }
    for (const v of plan.voices.filter((n) => n.part === 'chime')) {
      assert.equal(v.source, 'tone');
      assert.equal(v.wave, 'sine', 'a bell, not a buzzer');
      assert.ok(v.freq >= 500, 'a bell note is not low');
      // struck: at its loudest at once, then dying away
      assert.ok(v.env[1][0] - v.env[0][0] <= 0.05);
      assert.equal(peak(v), v.env[1][1]);
      assert.ok(v.env.at(-1)[0] - v.env[1][0] >= 1, 'a bell rings on');
    }
    // The loudest thing in the cue is a bell note.
    assert.ok(plan.voices.every((v) => peak(v) <= peak(notes[0])));

    // The hum: low, slow in and slow out, under the chime.
    const hum = plan.voices.filter((v) => v.part === 'hum');
    assert.ok(hum.some((v) => v.source === 'tone'), 'the hum has a tone in it, not only noise');
    for (const v of hum) {
      if (v.source === 'tone') assert.ok(v.freq <= 200, 'the hum is low');
      const top = v.env.findIndex((p) => p[1] === peak(v));
      assert.ok(v.env[top][0] - v.env[0][0] >= 1.5, 'the hum fades in slowly');
      assert.ok(v.env.at(-1)[0] - v.env.findLast((p) => p[1] > 0)[0] >= 1.5, 'the hum fades out slowly');
      assert.ok(v.start <= 0.5 && v.env.at(-1)[0] >= plan.length - 0.5, 'the hum lasts for the whole way');
    }
  }
});

test('the travel cue is not made mainly of noise', () => {
  for (const plan of plans('travel')) {
    const tones = plan.voices.filter((v) => v.source === 'tone'), noises = plan.voices.filter((v) => v.source === 'noise');
    assert.ok(tones.length >= 5);
    assert.ok(noises.length <= 1, 'at most one noise voice');
    assert.ok(tones.reduce((sum, v) => sum + area(v.env), 0) > 1.3 * noises.reduce((sum, v) => sum + area(v.env), 0), 'noise carries too much of the sound');
    const loudest = plan.voices.reduce((a, b) => (peak(b) > peak(a) ? b : a));
    assert.equal(loudest.source, 'tone');
  }
});

test('every noise in the travel cue is deep, very quiet and faded', () => {
  for (const plan of plans('travel')) {
    for (const v of plan.voices.filter((n) => n.source === 'noise')) {
      assert.equal(v.filter.type, 'lowpass');
      const opens = [v.filter.freq, ...(v.filter.sweep || []).map((p) => p[1])];
      assert.ok(Math.max(...opens) < NOISE_CEILING, `the noise filter opens to ${Math.max(...opens)} Hz`);
      assert.ok(v.filter.q <= 1, 'no whistle at the filter edge');
      assert.ok(peak(v) <= 0.02, 'very quiet');
      assert.equal(v.env[0][1], 0);
      assert.equal(v.env.at(-1)[1], 0);
      assert.ok(v.env[1][0] - v.env[0][0] >= 1, 'a long fade in');
      assert.ok(v.env.at(-1)[0] - v.env.at(-2)[0] >= 1, 'a long fade out');
    }
  }
});

test('the travel cue is clearly not the water sound', () => {
  const water = lifeSoundPlan('water', () => 0.5), travel = lifeSoundPlan('travel', () => 0.5);
  assert.ok(water.voices.every((v) => v.source === 'noise'), 'water is all noise');
  const band = water.voices[0].filter;
  for (const v of travel.voices.filter((n) => n.source === 'noise')) {
    assert.notEqual(v.filter.type, band.type);
    assert.ok(Math.max(...v.filter.sweep.map((p) => p[1])) < band.freq - 200, 'far below the band of the water sound');
    assert.ok(peak(v) < peak(water.voices[0]) * 0.5);
    // the water laps (it swells three times); the hum swells once
    const rises = (env) => env.filter((p, i) => i > 0 && p[1] > env[i - 1][1]).length;
    assert.equal(rises(v.env), 1);
    assert.ok(rises(water.voices[0].env) >= 3);
  }
});

test('a filter sweep is built as ramps from a set starting point', () => {
  const ctx = fakeAudio();
  const plan = lifeSoundPlan('travel', () => 0.5);
  playLifeSound(ctx, {}, plan, 50, { duration: 2 });
  const swept = ctx.made.filter((n) => n.type0 === 'filter' && n.frequency.events.length);
  assert.equal(swept.length, 1);
  const sweep = plan.voices.find((v) => v.filter && v.filter.sweep).filter.sweep;
  assert.deepEqual(swept[0].frequency.events, sweep.map(([time, freq], i) => [i ? 'ramp' : 'set', freq, 50 + time]));
  // No tone changes pitch: bells and a steady hum.
  for (const tone of ctx.made.filter((n) => n.type0 === 'tone')) assert.equal(tone.frequency.events.length, 0);
});

test('an unknown sound has no plan', () => {
  assert.equal(lifeSoundPlan('trumpet'), null);
});

test('even the two loudest sounds together stay far below full volume', () => {
  const tops = LIFE_SOUNDS.map((kind) => {
    const plan = lifeSoundPlan(kind, () => 0.5);
    return plan.voices.reduce((sum, v) => sum + Math.max(...v.env.map((p) => p[1])), 0);   // all voices at their loudest at once
  }).sort((a, b) => b - a);
  assert.ok(tops[0] * LIFE_SOUND_LIMIT < 0.25, `worst case ${tops[0] * LIFE_SOUND_LIMIT}`);
});

for (const kind of LIFE_SOUNDS) {
  test(`life sound "${kind}": built silent, ramped, and every source is stopped`, () => {
    const ctx = fakeAudio();
    const out = { name: 'out' };
    const plan = lifeSoundPlan(kind, () => 0.5);
    const sources = playLifeSound(ctx, out, plan, 100, { duration: 2 });
    assert.equal(sources.length, plan.voices.length);
    for (const s of sources) {
      assert.equal(s.starts.length, 1);
      assert.equal(s.stops.length, 1, 'a source that is never stopped plays for ever');
      assert.ok(s.starts[0] >= 100, 'starts before its time');
      assert.ok(s.stops[0] > s.starts[0] && s.stops[0] <= 100 + plan.length + 1e-9);
      assert.equal(typeof s.onended, 'function', 'nodes are let go when the sound is over');
    }
    const gains = ctx.made.filter((n) => n.type0 === 'gain');
    assert.equal(gains.length, plan.voices.length);
    for (const g of gains) {
      assert.equal(g.gain.value, 0, 'a gain node passes full volume until its first change, so it must be made silent');
      assert.deepEqual(g.gain.events[0].slice(0, 2), ['set', 0]);
      assert.ok(g.gain.events.slice(1).every((e) => e[0] === 'ramp'), 'volume must not jump');
      assert.equal(g.gain.events.at(-1)[1], 0);
      assert.deepEqual(g.to, [out]);
    }
    // Nothing reaches the output except through a gain node.
    for (const n of ctx.made) if (n.type0 !== 'gain') assert.ok(!n.to.includes(out));
    if (kind === 'water') assert.equal(sources[0].loop, true);
  });
}

test('never more than two life sounds at once', () => {
  const gate = createSoundGate();
  assert.equal(gate.admit(0, 1, 4), true);
  assert.equal(gate.admit(0.5, 1.5, 5), true);
  assert.equal(gate.admit(1, 2, 6), false, 'a third sound was let in');
  assert.equal(gate.count(1), 2);
  assert.equal(gate.admit(4.5, 5, 8), true, 'the first one is over, so there is room again');
  assert.equal(gate.admit(4.6, 5, 8), false);
  gate.clear();
  assert.equal(gate.count(4.6), 0);
});

test('the limit holds over a long random run', () => {
  const r = seeded(9);
  const gate = createSoundGate();
  const playing = [];
  for (let now = 0; now < 600; now += 0.25) {
    if (r() < 0.4) {
      const start = now + 0.5 + r() * 2, end = start + 2.5 + r() * 1.6;
      if (gate.admit(now, start, end)) playing.push([start, end]);
    }
    assert.ok(playing.filter(([, end]) => end > now).length <= LIFE_SOUND_LIMIT);
  }
  assert.ok(playing.length > 50);
});

test('every city has an event that sounds the horn', () => {
  for (const scene of scenes) {
    assert.ok(scene.life.some((d) => d.sound === 'horn'), `${scene.id} never sounds the horn`);
  }
});
