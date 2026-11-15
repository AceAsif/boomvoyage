// The station voice (js/voice.js): which clip belongs to which place, the
// saved on/off choice, the link option ?voice=0, when a clip may start, and
// how the page and the sound engine use it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  VOICE_CREDIT, VOICE_KEY, VOICE_SCENES, VOICE_DELAY, VOICE_MAX_LATE, VOICE_LEVEL, VOICE_FADE,
  voiceFile, initialVoice, loadVoice, saveVoice, voiceStart, shouldLoadVoice,
} from '../js/voice.js';
import { parseLink, buildShareLink } from '../js/link.js';
import { scenes } from '../js/scenes/index.js';
import { lifeSoundPlan } from '../js/lifesound.js';
import { sailLength } from '../js/voyage.js';

const root = new URL('../', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8');

// ---------- scene to file ----------

test('every place has its own clip, and the file is really there', () => {
  assert.equal(scenes.length, 7);
  const files = new Set();
  for (const scene of scenes) {
    const file = voiceFile(scene.id);
    assert.equal(file, `audio/next-stop-${scene.id}.mp3`, scene.id);
    assert.ok(fs.existsSync(new URL(file, root)), `${file} is missing`);
    assert.ok(fs.statSync(new URL(file, root)).size > 5000, `${file} is empty`);
    files.add(file);
  }
  assert.equal(files.size, scenes.length, 'two places share a clip');
  assert.deepEqual([...VOICE_SCENES].sort(), scenes.map((s) => s.id).sort());
});

test('the exact seven file names', () => {
  const want = ['next-stop-sydney.mp3', 'next-stop-tokyo.mp3', 'next-stop-hongkong.mp3', 'next-stop-dubai.mp3', 'next-stop-paris.mp3', 'next-stop-london.mp3', 'next-stop-newyork.mp3'];
  assert.deepEqual(VOICE_SCENES.map((id) => voiceFile(id).replace('audio/', '')), want);
  assert.deepEqual(fs.readdirSync(new URL('audio/', root)).sort(), [...want].sort(), 'audio/ holds exactly the seven clips');
});

test('a place without a clip, or nonsense, gives no file (the voice stays silent)', () => {
  for (const id of ['rio', '', null, undefined, 'Sydney', '../secret', 'sydney.mp3', 42]) assert.equal(voiceFile(id), null, String(id));
});

test('the clips together stay small', () => {
  const total = VOICE_SCENES.reduce((sum, id) => sum + fs.statSync(new URL(voiceFile(id), root)).size, 0);
  assert.ok(total < 400 * 1024, `the clips are ${total} bytes together`);
});

// ---------- the saved setting ----------

function fakeStorage(start = {}) {
  const data = { ...start };
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

test('the station voice is on by default, and the saved choice comes back', () => {
  assert.equal(initialVoice(null, null), true, 'on the first visit');
  assert.equal(initialVoice(null, '1'), true);
  assert.equal(initialVoice(null, '0'), false);
  assert.equal(initialVoice(null, 'rubbish'), true, 'anything but a clear "off" is on');
  const storage = fakeStorage();
  assert.equal(loadVoice(storage), null);
  saveVoice(storage, false);
  assert.equal(storage.data[VOICE_KEY], '0');
  assert.equal(initialVoice(null, loadVoice(storage)), false);
  saveVoice(storage, true);
  assert.equal(initialVoice(null, loadVoice(storage)), true);
  assert.equal(VOICE_KEY, 'boomvoyage.voice');
});

test('a blocked localStorage does not break anything', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(loadVoice(broken), null);
  assert.doesNotThrow(() => saveVoice(broken, false));
  assert.equal(loadVoice(null), null);
  assert.equal(initialVoice(null, loadVoice(broken)), true);
});

// ---------- the link option ----------

test('?voice=0 turns the voice off, ?voice=1 turns it on, and without it nothing is said', () => {
  assert.equal(parseLink('?voice=0').voice, false);
  for (const off of ['false', 'no', 'off', 'OFF', ' 0 ']) assert.equal(parseLink(`?voice=${off}`).voice, false, off);
  assert.equal(parseLink('?voice=1').voice, true);
  assert.equal(parseLink('?voice').voice, true);
  assert.equal(parseLink('').voice, null);
  assert.equal(parseLink('?voyage=1').voice, null);
  const both = parseLink('?scene=tokyo&voyage=1&voice=0&debug=1');
  assert.deepEqual([both.scene, both.voyage, both.voice, both.debug], ['tokyo', true, false, true]);
});

test('the link wins over the saved choice, in both directions', () => {
  assert.equal(initialVoice(parseLink('?voice=0').voice, '1'), false);
  assert.equal(initialVoice(parseLink('?voice=0').voice, null), false);
  assert.equal(initialVoice(parseLink('?voice=1').voice, '0'), true);
  assert.equal(initialVoice(parseLink('?scene=paris').voice, '0'), false, 'no option: the saved choice');
});

test('a share link does not carry the voice option', () => {
  const url = buildShareLink('https://example.org/boomvoyage/?voice=0&voyage=1', { scene: 'tokyo', seed: 123, theme: 'sakura' });
  assert.equal(url, 'https://example.org/boomvoyage/?scene=tokyo&seed=123&theme=sakura');
});

// ---------- when a clip may load and start ----------

test('a clip is loaded only when it would be used', () => {
  assert.equal(shouldLoadVoice({ voyage: true, voice: true, started: true }), true);
  assert.equal(shouldLoadVoice({ voyage: false, voice: true, started: true }), false, 'voyage mode is off: nothing is fetched');
  assert.equal(shouldLoadVoice({ voyage: true, voice: false, started: true }), false, 'the voice is off');
  assert.equal(shouldLoadVoice({ voyage: true, voice: true, started: false }), false, 'before the first tap');
});

test('the voice comes right after the chime and is over before the next city is in', () => {
  const cue = lifeSoundPlan('travel', () => 0.5);
  const struck = cue.voices.filter((v) => v.part === 'chime').map((v) => v.start);
  const lastNote = Math.max(...struck);
  assert.ok(VOICE_DELAY >= lastNote + 0.5, 'the voice would talk over the last bell note being struck');
  assert.ok(VOICE_DELAY <= lastNote + 1, 'a gap after the chime: no longer "right after"');
  // The clips are about three seconds long. Even so there is time left in the sail.
  assert.ok(VOICE_DELAY + 3.2 <= sailLength(false), 'the voice would run past the end of the sail');
  assert.ok(VOICE_LEVEL > 0.2 && VOICE_LEVEL <= 0.6, 'clear, but an announcement and not a shout');
  assert.ok(VOICE_FADE >= 0.1 && VOICE_FADE <= 0.5);
});

test('a clip starts on time, a little late if it was still loading, and not at all if far too late', () => {
  assert.equal(voiceStart(10, 8), 10, 'loaded early: starts exactly when wanted');
  assert.equal(voiceStart(10, 10), 10);
  assert.ok(Math.abs(voiceStart(10, 10.5) - 10.52) < 1e-9, 'loaded half a second late: starts at once');
  assert.ok(voiceStart(10, 10 + VOICE_MAX_LATE) !== null);
  assert.equal(voiceStart(10, 10 + VOICE_MAX_LATE + 0.01), null, 'too late: silence');
  assert.equal(voiceStart(10, 60), null);
  assert.equal(voiceStart(NaN, 1), null);
  assert.equal(voiceStart(1, undefined), null);
});

// ---------- how the page and the sound engine use it ----------

test('the sound engine plays the clip through the unlocked audio, the master volume and the limiter', () => {
  const audio = read('js/audio.js');
  const say = audio.slice(audio.indexOf('  say('), audio.indexOf('  hushVoice('));
  assert.ok(say.length > 100, 'no say() in the sound engine');
  assert.ok(!/new Audio|<audio|createMediaElementSource/.test(audio), 'the voice must use the AudioContext that the first tap unlocked');
  assert.match(audio, /decodeAudioData/);
  assert.match(say, /this\.hushVoice\(\)/, 'a clip that is still playing is faded away first');
  assert.match(say, /this\.live/, 'nothing when muted or with the volume at zero');
  assert.match(say, /\.connect\(this\.dry\)/, 'the voice must go through the master volume and the limiter');
  assert.ok(!/ctx\.destination/.test(say), 'the voice goes straight to the speakers');
  // A file that is missing or broken: silence, and no error shown or thrown.
  const load = audio.slice(audio.indexOf('  loadVoice('), audio.indexOf('  say('));
  assert.match(load, /\.catch\(\(\) => null\)/);
  assert.match(load, /if \(!response\.ok\) return null/);
  assert.ok(!/console\.|toast|alert/.test(load + say));
});

test('the page has the switch, uses it, and loads a clip only for voyage mode', () => {
  const html = read('index.html'), main = read('js/main.js'), css = read('css/style.css');
  const button = html.match(/<button id="voiceBtn"[^>]*>/);
  assert.ok(button, 'no station voice switch');
  assert.match(button[0], /class="icon toggle"/, 'same style as the voyage switch');
  assert.match(button[0], /aria-pressed="true"/, 'on by default');
  assert.match(button[0], /aria-label="Station voice/);
  assert.match(main, /\$\('voiceBtn'\)\.addEventListener\('click', \(\) => setVoice\(!voice\)\)/);
  assert.match(main, /initialVoice\(link\.voice,/);
  assert.match(main, /saveVoice\(localStorage, voice\)/);
  // Loading and speaking both ask the pure rule first.
  assert.match(main, /if \(!shouldLoadVoice\(\{ voyage, voice, started \}\)\) return;/);
  assert.match(main, /sound\.say\(/);
  // The voice never touches the show or the countdown.
  const voiceCode = main.slice(main.indexOf('// ---------- station voice ----------'), main.indexOf('// ---------- voyage mode ----------'));
  assert.ok(voiceCode.length > 200);
  assert.ok(!/schedule|startShow|current =|Date\.now/.test(voiceCode), 'the station voice code touches the show or the clock');
  assert.match(css, /#voiceBtn/);
});

test('the credit is shown: in the place menu, in the README and in SUMMARY.md, from one text', () => {
  assert.equal(VOICE_CREDIT, 'Station voice made with ElevenLabs');
  const main = read('js/main.js'), html = read('index.html');
  // The page takes the words from the one constant: they are written nowhere else in the code.
  assert.match(main, /VOICE_CREDIT/);
  for (const [name, text] of [['js/main.js', main], ['index.html', html], ['css/style.css', read('css/style.css')], ['js/audio.js', read('js/audio.js')]]) {
    assert.ok(!text.includes('ElevenLabs'), `${name} has its own copy of the credit`);
  }
  assert.ok(read('README.md').includes(VOICE_CREDIT), 'the README does not give the credit');
  if (fs.existsSync(new URL('SUMMARY.md', root))) assert.ok(read('SUMMARY.md').includes(VOICE_CREDIT), 'SUMMARY.md does not give the credit');
});
