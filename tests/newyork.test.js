import test from 'node:test';
import assert from 'node:assert/strict';
import newyork from '../js/scenes/newyork.js';
import { getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { postcardCaption, postcardFileName } from '../js/postcard.js';
import { LIFE_LAYERS } from '../js/life.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

test('New York is registered and a share link opens it', () => {
  assert.equal(getScene('newyork'), newyork);
  assert.equal(getScene(parseLink('?scene=newyork&seed=9&theme=empire-blue').scene), newyork);
  assert.equal(parseLink('?scene=NewYork').scene, 'newyork');
});

test('New York has its own themes, act names and opening', () => {
  assert.equal(newyork.show.opening, 'salvo');
  assert.ok(newyork.show.features.waterfall, 'its middle act is the waterfall from the bridge cables');
  assert.ok(newyork.show.acts.includes('marquee'));
  assert.ok(newyork.show.palettes.some((p) => p.name === 'Stars & Stripes'));
  const s = buildShow(newyork.show, 21);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'Curtain Up');
  assert.equal(labels[labels.length - 2], 'Bridge of Light');
  assert.equal(labels[labels.length - 1], 'Big Apple Finale');
  assert.equal(s.cues[0].kind, 'comet', 'the show opens with a fan of comets');
});

test('the same seed and theme give the same New York show (share links)', () => {
  const sent = buildShow(newyork.show, 4321, { avoid: 'Taxi Yellow' });
  assert.deepEqual(buildShow(newyork.show, 4321, { theme: sent.themeId }), sent);
});

test('the waterfall hangs from the bridge cables: a curve that is high at both towers and low in the middle', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(newyork, w, h);
    const { waterfall } = newyork.rig(v);
    assert.ok(waterfall.length >= 12, `${w}x${h}: only ${waterfall.length} points`);
    for (let i = 1; i < waterfall.length; i++) assert.ok(waterfall[i].x > waterfall[i - 1].x, 'points run left to right');
    for (const p of waterfall) {
      assert.ok(p.x >= 0 && p.x <= w, `${w}x${h}: a point is off the screen`);
      assert.ok(p.y < v.hz - 20 * v.S, `${w}x${h}: the cable is above the roadway everywhere`);
      assert.ok(p.y > v.hz - 90 * v.S, `${w}x${h}: the cable is not above the towers`);
    }
    const ys = waterfall.map((p) => p.y);
    const highest = Math.min(...ys), lowest = Math.max(...ys);
    assert.ok(lowest - highest > 30 * v.S, `${w}x${h}: the cable should rise and dip, not be a straight line`);
    // It dips between two high points (the towers): low, high, low, high or similar.
    const peaks = ys.filter((y, i) => i > 0 && i < ys.length - 1 && y <= ys[i - 1] && y <= ys[i + 1] && y < highest + 12 * v.S).length;
    assert.ok(peaks >= 1, `${w}x${h}: no tower top found on the cable`);
  }
});

test('the Empire State Building stands whole on every screen and is the tallest thing', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(newyork, w, h);
    const { crown, waterfall } = newyork.rig(v);
    const tip = crown[0];
    assert.ok(tip.y > 8, `${w}x${h}: the antenna is cut off at the top (y=${tip.y.toFixed(0)})`);
    assert.ok(tip.x > 20 && tip.x < w - 20, `${w}x${h}: the tower is off the side`);
    assert.ok((v.hz - tip.y) / v.hz > 0.3, `${w}x${h}: the tower is too small`);
    assert.ok(tip.y < Math.min(...waterfall.map((p) => p.y)), 'taller than the bridge');
    assert.equal(crown.length, 7);
    assert.ok(crown[0].angle < 0 && crown[6].angle > 0 && crown[3].angle === 0, 'the fan spreads to both sides');
  }
});

test('New York life: every event has a layer, cabs and helicopter pass behind the bridge towers, boats are in front', () => {
  const layer = Object.fromEntries(newyork.life.map((d) => [d.id, d.layer]));
  for (const d of newyork.life) assert.ok(LIFE_LAYERS.includes(d.layer), d.id);
  assert.equal(layer.cabs, 'behind');
  assert.equal(layer.helicopter, 'behind');
  assert.equal(layer.steam, 'behind');
  assert.equal(layer.ferry, 'front');
  assert.equal(layer.tug, 'front');
  assert.deepEqual(newyork.life.filter((d) => d.sound).map((d) => `${d.id}:${d.sound}`).sort(), ['buoy:bell', 'crownlights:chime', 'ferry:horn', 'tug:water']);
});

test('a New York postcard has the right caption and file name', () => {
  assert.equal(postcardCaption({ name: newyork.name, showNo: 2 }), 'New York · Show No. 2');
  assert.equal(postcardFileName({ id: newyork.id, showNo: 2 }), 'boomvoyage-newyork-show-2.png');
});
