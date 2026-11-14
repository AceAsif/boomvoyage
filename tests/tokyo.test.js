import test from 'node:test';
import assert from 'node:assert/strict';
import tokyo from '../js/scenes/tokyo.js';
import { getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { postcardCaption, postcardFileName } from '../js/postcard.js';
import { LIFE_LAYERS } from '../js/life.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

const cuesOf = (show, key) => {
  const act = show.timeline.find((a) => a.key === key);
  return act ? show.cues.filter((c) => c.t >= act.start && c.t < act.end) : [];
};

test('Tokyo is registered and a share link opens it', () => {
  assert.equal(getScene('tokyo'), tokyo);
  assert.equal(getScene(parseLink('?scene=tokyo&seed=9&theme=sakura').scene), tokyo);
  assert.equal(parseLink('?scene=TOKYO').scene, 'tokyo');
});

test('Tokyo has its own themes, act names, opening and signature', () => {
  assert.equal(tokyo.show.signature, 'starmine');
  assert.equal(tokyo.show.opening, 'single');
  assert.ok(tokyo.show.palettes.some((p) => p.name === 'Sakura'));
  const s = buildShow(tokyo.show, 21);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'Ichiban');
  assert.equal(labels[labels.length - 2], 'Star Mine');
  assert.equal(labels[labels.length - 1], 'Grand Hanabi');
  assert.ok(!labels.includes('Waterfall'));
});

test('the Tokyo show opens with one great round shell alone in the sky', () => {
  const s = buildShow(tokyo.show, 5);
  const first = s.cues[0];
  assert.equal(first.kind, 'shell');
  assert.equal(first.type, 'chrys');
  assert.equal(first.x, 0.5);
  assert.ok(first.size >= 1.5);
  const next = s.cues.find((c) => c !== first);
  assert.ok(next.t - first.t >= 2, 'it is given time to be looked at');
});

test('Japanese style: chrysanthemum shells lead, and shells come in mirrored pairs', () => {
  let kiku = 0, pairs = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = buildShow(tokyo.show, seed);
    const k = cuesOf(s, 'kiku').filter((c) => c.kind === 'shell');
    if (k.length) {
      kiku += 1;
      assert.ok(k.filter((c) => c.type === 'chrys').length >= 4, 'the Kiku act is made of chrysanthemums');
      assert.ok(Math.max(...k.map((c) => c.size)) >= 1.5, 'and they are large');
    }
    for (const key of ['pairs', 'kiku', 'starmine']) {
      const shells = cuesOf(s, key).filter((c) => c.kind === 'shell');
      if (key === 'pairs' && shells.length) pairs += 1;
      for (const a of shells) {
        if (Math.abs(a.x - 0.5) < 1e-9) continue;       // a shell in the middle is its own twin
        const twin = shells.find((b) => b !== a && b.t === a.t && Math.abs(b.x - (1 - a.x)) < 1e-9 && b.h === a.h && b.type === a.type);
        assert.ok(twin, `${key}: a shell at x=${a.x} has no twin on the other side`);
      }
    }
  }
  assert.ok(kiku >= 5 && pairs >= 5, 'both acts turn up in shows');
});

test('the same seed and theme give the same Tokyo show (share links)', () => {
  const sent = buildShow(tokyo.show, 777, { avoid: 'Matcha' });
  assert.deepEqual(buildShow(tokyo.show, 777, { theme: sent.themeId }), sent);
});

test('the Star Mine is fired from a row along the bridge, mirrored about its middle', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(tokyo, w, h);
    const { bridge, towers } = tokyo.rig(v);
    assert.equal(bridge.length, 10);
    assert.equal(towers.length, 2);
    const mid = (towers[0].x + towers[1].x) / 2;
    for (let i = 0; i < 5; i++) {
      const a = bridge[i], b = bridge[9 - i];
      assert.ok(Math.abs((a.x + b.x) / 2 - mid) < 1, `${w}x${h}: points ${i} and ${9 - i} are not mirrored`);
      assert.ok(Math.abs(a.angle + b.angle) < 1e-9, 'their comets lean opposite ways');
      assert.ok(a.angle < 0 && b.angle > 0);
      assert.equal(a.y, b.y);
    }
    for (let i = 1; i < 10; i++) assert.ok(bridge[i].x - bridge[i - 1].x > 12, `${w}x${h}: the points are too close together`);
    assert.ok(towers[0].y < bridge[0].y, 'the bridge towers stand above the roadway');
  }
});

test('Tokyo Tower and the Skytree stand whole on every screen, one on each side', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(tokyo, w, h);
    const [tower, tree] = tokyo.rig(v).tips;
    for (const [name, tip] of [['Tokyo Tower', tower], ['Skytree', tree]]) {
      assert.ok(tip.y > 8, `${w}x${h}: the ${name} is cut off at the top (y=${tip.y.toFixed(0)})`);
      assert.ok(tip.x > 16 && tip.x < w - 16, `${w}x${h}: the ${name} is off the side`);
      assert.ok((v.hz - tip.y) / v.hz > 0.3, `${w}x${h}: the ${name} is too small`);
    }
    assert.ok(tower.x < w / 2 && tree.x > w / 2);
    assert.ok(tree.y < tower.y, 'the Skytree is the taller one');
  }
});

test('Tokyo life: every event has a layer, the train and plane pass behind, boats and lanterns are in front', () => {
  const layer = Object.fromEntries(tokyo.life.map((d) => [d.id, d.layer]));
  for (const d of tokyo.life) assert.ok(LIFE_LAYERS.includes(d.layer), d.id);
  assert.equal(layer.train, 'behind');
  assert.equal(layer.plane, 'behind');
  assert.equal(layer.skyring, 'behind');
  assert.equal(layer.houseboat, 'front');
  assert.equal(layer.waterbus, 'front');
  assert.equal(layer.lanterns, 'front');
  assert.deepEqual(tokyo.life.filter((d) => d.sound).map((d) => `${d.id}:${d.sound}`).sort(), ['houseboat:water', 'lanterns:furin', 'skyring:chime', 'waterbus:horn']);
});

test('a Tokyo postcard has the right caption and file name', () => {
  assert.equal(postcardCaption({ name: tokyo.name, showNo: 5 }), 'Tokyo · Show No. 5');
  assert.equal(postcardFileName({ id: tokyo.id, showNo: 5 }), 'boomvoyage-tokyo-show-5.png');
});
