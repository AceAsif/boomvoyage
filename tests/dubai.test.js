import test from 'node:test';
import assert from 'node:assert/strict';
import dubai from '../js/scenes/dubai.js';
import { getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

test('Dubai is registered and a share link opens it', () => {
  assert.equal(getScene('dubai'), dubai);
  assert.equal(getScene(parseLink('?scene=dubai&seed=9&theme=sapphire').scene), dubai);
});

test('Dubai has its own themes, act names and signature', () => {
  assert.equal(dubai.show.signature, 'spire');
  assert.equal(dubai.show.opening, 'tower');
  assert.ok(dubai.show.palettes.some((p) => p.name === 'Desert Gold'));
  const s = buildShow(dubai.show, 21);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'First Light');
  assert.equal(labels[labels.length - 2], 'The Spire');
  assert.equal(labels[labels.length - 1], 'Golden Finale');
  assert.ok(!labels.includes('Waterfall'));
  assert.equal(s.cues[0].type, 'kamuro', 'the show opens with one huge gold shell');
});

test('the same seed and theme give the same Dubai show (share links)', () => {
  const sent = buildShow(dubai.show, 1234, { avoid: 'Sapphire' });
  assert.deepEqual(buildShow(dubai.show, 1234, { theme: sent.themeId }), sent);
});

test('the Burj Khalifa stands whole on every screen, tip in the sky and in the middle', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(dubai, w, h);
    const { spire, tiers } = dubai.rig(v);
    const tip = spire[0];
    assert.ok(tip.y > 8, `${w}x${h}: the tip is cut off at the top (y=${tip.y.toFixed(0)})`);
    assert.ok(Math.abs(tip.x - w / 2) < 1, `${w}x${h}: the tower is not centred`);
    assert.ok((v.hz - tip.y) / v.hz > 0.35, `${w}x${h}: the tower is too small to be the star`);
    assert.equal(tiers.length, 12);
    for (let level = 0; level < 6; level++) {
      const pair = tiers.filter((p) => p.level === level);
      assert.equal(pair.length, 2);
      assert.ok(pair[0].x < w / 2 && pair[1].x > w / 2, 'one jet on each side');
      assert.ok(pair[0].angle < 0 && pair[1].angle > 0, 'jets point away from the tower');
    }
    const ys = [0, 2, 4, 6, 8, 10].map((i) => tiers[i].y);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], 'levels climb the tower');
  }
});

test('the spire fan spreads to both sides', () => {
  const { spire } = dubai.rig(fakeView(dubai, 390, 844));
  assert.equal(spire.length, 7);
  assert.equal(spire[3].angle, 0);
  assert.ok(spire[0].angle < 0 && spire[6].angle > 0);
});
