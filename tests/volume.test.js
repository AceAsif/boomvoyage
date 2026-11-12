// The master volume rules (js/volume.js) and how the sound engine uses them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { VOLUME_KEY, FULL_LEVEL, DEFAULT_VOLUME, clampVolume, loadVolume, saveVolume, isSilent, masterGain, slideTo, toggleSound, toPercent } from '../js/volume.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

test('the default is full volume, and full volume is exactly as loud as before the slider', () => {
  assert.equal(DEFAULT_VOLUME, 1);
  assert.equal(FULL_LEVEL, 0.8, 'this was the master level before the slider existed');
  assert.equal(masterGain(DEFAULT_VOLUME, false), FULL_LEVEL);
});

test('nothing can be louder than full volume', () => {
  for (const v of [1, 1.01, 2, 100, Infinity, '7']) assert.ok(masterGain(v, false) <= FULL_LEVEL, `volume ${v}`);
  for (let v = 0; v <= 1; v += 0.01) assert.ok(masterGain(v, false) <= FULL_LEVEL);
});

test('volume is clamped to 0..1 and nonsense becomes the default', () => {
  assert.equal(clampVolume(0.4), 0.4);
  assert.equal(clampVolume(-3), 0);
  assert.equal(clampVolume(5), 1);
  assert.equal(clampVolume('0.25'), 0.25);
  assert.equal(clampVolume('0'), 0);
  for (const bad of [NaN, 'loud', '', '  ', null, undefined, {}, [], true]) assert.equal(clampVolume(bad), DEFAULT_VOLUME, String(bad));
});

test('the saved level comes back, clamped', () => {
  const s = fakeStorage();
  assert.equal(loadVolume(s), DEFAULT_VOLUME, 'nothing saved yet');
  saveVolume(s, 0.35);
  assert.equal(s.data[VOLUME_KEY], '0.35');
  assert.equal(loadVolume(s), 0.35);
  saveVolume(s, 0);
  assert.equal(loadVolume(s), 0, 'a saved 0 stays 0');
  saveVolume(s, 9);
  assert.equal(loadVolume(s), 1);
  assert.equal(loadVolume(fakeStorage({ [VOLUME_KEY]: 'banana' })), DEFAULT_VOLUME);
  assert.equal(loadVolume(fakeStorage({ [VOLUME_KEY]: '-2' })), 0);
});

test('a blocked localStorage does not break anything', () => {
  assert.equal(loadVolume(broken), DEFAULT_VOLUME);
  assert.doesNotThrow(() => saveVolume(broken, 0.5));
  assert.equal(loadVolume(undefined), DEFAULT_VOLUME);
});

test('slider at 0 acts as mute', () => {
  assert.equal(masterGain(0, false), 0);
  assert.equal(isSilent(0, false), true);
  assert.equal(isSilent(0.05, false), false);
  assert.equal(isSilent(1, true), true);
  assert.equal(masterGain(1, true), 0, 'mute silences every level');
  assert.equal(masterGain(0.6, true), 0);
});

test('louder slider, louder sound: the gain only ever goes up with the slider', () => {
  let last = 0;
  for (let v = 0.05; v <= 1.0001; v += 0.05) {
    const g = masterGain(v, false);
    assert.ok(g > last, `gain did not rise at ${v}`);
    last = g;
  }
  assert.ok(masterGain(0.5, false) < FULL_LEVEL / 2, 'the middle of the slider is clearly quieter');
});

test('moving the slider above 0 takes mute off; moving it to 0 leaves mute as it was', () => {
  assert.deepEqual(slideTo({ volume: 1, muted: true }, 0.4), { volume: 0.4, muted: false });
  assert.deepEqual(slideTo({ volume: 1, muted: false }, 0), { volume: 0, muted: false });
  assert.deepEqual(slideTo({ volume: 0.5, muted: true }, 0), { volume: 0, muted: true });
  assert.deepEqual(slideTo({ volume: 0.5, muted: false }, 7), { volume: 1, muted: false });
});

test('the mute button always changes what you hear', () => {
  assert.deepEqual(toggleSound({ volume: 0.6, muted: false }), { volume: 0.6, muted: true }, 'sound on: mute, keep the level');
  assert.deepEqual(toggleSound({ volume: 0.6, muted: true }), { volume: 0.6, muted: false }, 'muted: back to the same level');
  assert.deepEqual(toggleSound({ volume: 0, muted: false }), { volume: 1, muted: false }, 'slider at 0: back to full');
  assert.deepEqual(toggleSound({ volume: 0, muted: true }), { volume: 1, muted: false });
  for (const state of [{ volume: 0.6, muted: false }, { volume: 0.6, muted: true }, { volume: 0, muted: false }, { volume: 0, muted: true }]) {
    const next = toggleSound(state);
    assert.notEqual(isSilent(next.volume, next.muted), isSilent(state.volume, state.muted));
  }
});

test('percent for the slider and for screen readers', () => {
  assert.equal(toPercent(1), 100);
  assert.equal(toPercent(0.35), 35);
  assert.equal(toPercent(-1), 0);
});

test('the sound engine sets the volume on the master gain only', () => {
  const src = fs.readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
  assert.match(src, /masterGain\(this\.volume, this\.muted\)/, 'the master gain must follow volume and mute');
  assert.ok(!/const LEVEL\b/.test(src), 'the old fixed level is gone: FULL_LEVEL in volume.js is the one place');
  // Every sound still ends in the master gain, so one control reaches all of them.
  assert.match(src, /this\.dry\.connect\(this\.master\)/);
  assert.match(src, /isSilent\(this\.volume, this\.muted\)/, 'no sounds are made while nothing can be heard');
});
