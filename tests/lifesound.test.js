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
