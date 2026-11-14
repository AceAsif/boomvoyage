// Voyage mode rules (js/voyage.js), its link option and its saved choice.
import test from 'node:test';
import assert from 'node:assert/strict';
import { VOYAGE_KEY, SAIL, SAIL_CALM, sailLength, nextStop, stopLabel, sailCaption, initialVoyage, loadVoyage, saveVoyage, shouldPrepare, shouldSail, lifeRemaining, sailAt } from '../js/voyage.js';
import { parseLink, buildShareLink } from '../js/link.js';
import { scenes } from '../js/scenes/index.js';
import { createLife } from '../js/life.js';
import { LIFE_SOUNDS, lifeSoundPlan } from '../js/lifesound.js';

const IDS = scenes.map((s) => s.id);
const quiet = (over = {}) => ({ on: true, started: true, showing: false, busy: false, life: 0, remaining: 9, hidden: false, sailing: false, sailed: false, ...over });

test('the voyage visits every city in the order of the switcher', () => {
  assert.deepEqual(IDS, ['sydney', 'dubai', 'paris', 'london', 'newyork', 'tokyo', 'hongkong']);
  let at = 'sydney';
  const seen = [at];
  for (let i = 0; i < IDS.length - 1; i++) { at = nextStop(IDS, at); seen.push(at); }
  assert.deepEqual(seen, IDS);
});

test('after the last city the voyage wraps round to the first', () => {
  assert.equal(nextStop(IDS, 'hongkong'), 'sydney');
  let at = 'paris';
  for (let i = 0; i < IDS.length * 3; i++) at = nextStop(IDS, at);
  assert.equal(at, 'paris', 'three full laps end where they began');
});

test('a manual switch continues the voyage from the chosen city', () => {
  assert.equal(nextStop(IDS, 'tokyo'), 'hongkong');
  assert.equal(nextStop(IDS, 'dubai'), 'paris');
  assert.equal(nextStop(IDS, 'nowhere'), 'sydney', 'an unknown city starts the voyage at the beginning');
  assert.equal(nextStop(['only'], 'only'), 'only');
  assert.equal(nextStop([], 'x'), null);
});

test('the caption names the next stop and its number', () => {
  assert.equal(sailCaption('Tokyo'), 'Sailing to Tokyo');
  assert.equal(stopLabel(IDS, 'paris'), 'Stop 3 of 7');
  assert.equal(stopLabel(IDS, 'sydney'), 'Stop 1 of 7');
  assert.equal(stopLabel(IDS, 'hongkong'), 'Stop 7 of 7');
  assert.equal(stopLabel(IDS, 'nowhere'), '');
});

test('never during a show: no sail and no preparing while a show plays or sparks are in the air', () => {
  for (let remaining = 0; remaining <= 120; remaining += 0.5) {
    for (const calm of [false, true]) {
      assert.equal(shouldSail(quiet({ showing: true, remaining }), calm), false);
      assert.equal(shouldPrepare(quiet({ showing: true, remaining }), calm), false);
      assert.equal(shouldSail(quiet({ busy: true, remaining }), calm), false);
      assert.equal(shouldPrepare(quiet({ busy: true, remaining }), calm), false);
    }
  }
});

test('a sail starts only in the quiet stretch, with voyage mode on, after the life events have faded', () => {
  assert.equal(shouldSail(quiet()), true);
  assert.equal(shouldSail(quiet({ on: false })), false, 'voyage mode is off');
  assert.equal(shouldSail(quiet({ started: false })), false, 'before "Tap to start"');
  assert.equal(shouldSail(quiet({ life: 1 })), false, 'a life event is still on screen');
  assert.equal(shouldSail(quiet({ hidden: true })), false, 'the tab is hidden');
  assert.equal(shouldSail(quiet({ sailing: true })), false, 'already sailing');
  assert.equal(shouldSail(quiet({ sailed: true })), false, 'one sail per quiet stretch');
  assert.equal(shouldSail(quiet({ remaining: 60 })), false, 'too early: the city keeps its quiet minute');
});

test('a sail always fits before the next show, or it does not start', () => {
  for (const calm of [false, true]) {
    const t = calm ? SAIL_CALM : SAIL;
    assert.ok(sailLength(calm) + t.spare < t.lead, 'the sail must fit inside its lead time');
    for (let remaining = 0; remaining <= 30; remaining += 0.1) {
      if (shouldSail(quiet({ remaining }), calm)) {
        assert.ok(remaining - sailLength(calm) >= t.spare - 1e-9, `a sail begun ${remaining}s before the show would run into it`);
        assert.ok(remaining <= t.lead);
      }
    }
    assert.equal(shouldSail(quiet({ remaining: 3 }), calm), false, 'too late: this stretch is skipped');
  }
});

test('the next city is painted before the sail, never after it has begun', () => {
  const t = SAIL;
  assert.equal(shouldPrepare(quiet({ remaining: t.lead + t.prepare - 0.1 })), true);
  assert.equal(shouldPrepare(quiet({ remaining: t.lead + t.prepare + 5 })), false, 'not yet');
  assert.equal(shouldPrepare(quiet({ remaining: t.lead + 1, life: 2 })), true, 'life events do not stop the painting');
  assert.equal(shouldPrepare(quiet({ on: false, remaining: t.lead + 1 })), false);
  assert.ok(t.prepare >= 4, 'room to paint in small steps');
});

test('in voyage mode the life events are told to finish before the sail', () => {
  assert.equal(lifeRemaining(60, false), 60);
  assert.equal(lifeRemaining(60, true), 60 - SAIL.lead);
  assert.equal(lifeRemaining(4, true), 0);
  // With that, a real life director has nothing on screen when the sail may begin.
  const defs = scenes[0].life;
  const life = createLife(defs, { seed: 77 });
  let sawLife = false;
  for (let remaining = 73; remaining > 0; remaining -= 1 / 20) {
    life.tick(1 / 20, lifeRemaining(remaining, true), true);
    if (life.active.length) sawLife = true;
    if (remaining <= SAIL.lead) assert.equal(life.active.length, 0, `a life event is still on screen ${remaining.toFixed(1)}s before the show`);
  }
  assert.ok(sawLife, 'the quiet minute still has its life events');
});

test('the city changes only while the picture is fully dark', () => {
  for (const calm of [false, true]) {
    const total = sailLength(calm);
    let swapAt = null, last = 0;
    for (let t = 0; t <= total + 0.5; t += 0.01) {
      const s = sailAt(t, calm);
      assert.ok(s.dark >= 0 && s.dark <= 1);
      if (s.swap && swapAt === null) { swapAt = t; assert.equal(s.dark, 1, 'the swap must happen in the dark'); assert.equal(s.stage, 'hold'); }
      if (s.stage === 'out') { assert.ok(s.dark >= last - 1e-9, 'fading out only gets darker'); assert.equal(s.swap, false); }
      last = s.dark;
    }
    assert.ok(swapAt !== null);
    assert.equal(sailAt(0, calm).dark, 0);
    assert.deepEqual(sailAt(total + 0.01, calm), { stage: 'done', dark: 0, swap: true });
  }
  assert.ok(sailLength(true) > sailLength(false), 'reduce motion gets a slower, calmer fade');
});

test('the on/off choice is saved and read back; a blocked storage does not break it', () => {
  const data = {};
  const storage = { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
  assert.equal(initialVoyage(null, loadVoyage(storage)), false, 'off by default');
  saveVoyage(storage, true);
  assert.equal(data[VOYAGE_KEY], '1');
  assert.equal(initialVoyage(null, loadVoyage(storage)), true);
  saveVoyage(storage, false);
  assert.equal(initialVoyage(null, loadVoyage(storage)), false);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(loadVoyage(broken), null);
  assert.doesNotThrow(() => saveVoyage(broken, true));
  assert.equal(initialVoyage(null, loadVoyage(broken)), false);
});

test('?voyage=1 starts it on, ?voyage=0 starts it off, and no option leaves the saved choice', () => {
  assert.equal(parseLink('?voyage=1').voyage, true);
  assert.equal(parseLink('?voyage').voyage, true);
  assert.equal(parseLink('?voyage=yes').voyage, true);
  assert.equal(parseLink('?voyage=0').voyage, false);
  assert.equal(parseLink('?voyage=off').voyage, false);
  assert.equal(parseLink('?scene=tokyo').voyage, null);
  assert.equal(parseLink('').voyage, null);
  assert.equal(initialVoyage(true, '0'), true, 'the link wins over the saved choice');
  assert.equal(initialVoyage(false, '1'), false);
  assert.equal(initialVoyage(null, '1'), true);
  assert.equal(initialVoyage(null, null), false);
  assert.equal(initialVoyage(null, 'banana'), false);
});

test('links to the new cities work together with the other options', () => {
  const link = parseLink('?scene=hongkong&seed=77&theme=jade&voyage=1&ambient=1');
  assert.deepEqual({ scene: link.scene, seed: link.seed, theme: link.theme, voyage: link.voyage, ambient: link.ambient }, { scene: 'hongkong', seed: 77, theme: 'jade', voyage: true, ambient: true });
  for (const id of ['newyork', 'tokyo', 'hongkong']) assert.equal(parseLink(`?scene=${id}`).scene, id);
});

test('a share link still carries the current city, seed and theme, and nothing else', () => {
  const url = buildShareLink('https://example.org/boomvoyage/?voyage=1&scene=sydney#x', { scene: 'tokyo', seed: 123, theme: 'sakura' });
  assert.equal(url, 'https://example.org/boomvoyage/?scene=tokyo&seed=123&theme=sakura');
});

test('the sail has its own quiet sound, built by the same rules as the life sounds', () => {
  assert.ok(LIFE_SOUNDS.includes('sail'));
  const plan = lifeSoundPlan('sail', () => 0.5);
  assert.ok(plan.length <= sailLength(false), 'the sound is over before the next city is fully in');
  for (const v of plan.voices) {
    assert.equal(v.env[0][1], 0);
    assert.equal(v.env.at(-1)[1], 0);
    assert.ok(Math.max(...v.env.map((p) => p[1])) <= 0.03, 'very quiet');
  }
});

test('the page has a clear on/off button for voyage mode, off until the page says otherwise, and the key V', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const button = html.match(/<button id="voyageBtn"[^>]*>/);
  assert.ok(button, 'no voyage button');
  assert.match(button[0], /aria-pressed="false"/, 'off by default');
  assert.match(button[0], /aria-label="Voyage mode[^"]+"/);
  assert.match(button[0], /title="Voyage mode \(V\)"/);
  assert.ok(html.indexOf('id="voyageBtn"') > html.indexOf('class="controls"') && html.indexOf('id="voyageBtn"') < html.indexOf('</footer>'), 'the button is inside the controls, so ambient mode hides it');
  assert.match(html, /<div id="sail"[^>]*aria-live="polite"/, 'the sail caption is announced');
  const main = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
  assert.match(main, /key === 'v'\) setVoyage\(!voyage\)/);
  assert.match(main, /finishSail\(\);\s+\/\/ a show never starts in the middle of a sail/);
  const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
  assert.match(css, /#voyageBtn \{ grid-column: 2; grid-row: 2; \}/, 'it has its own place in the phone layout');
});
