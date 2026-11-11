import test from 'node:test';
import assert from 'node:assert/strict';
import paris from '../js/scenes/paris.js';
import { getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

test('Paris is registered and a share link opens it', () => {
  assert.equal(getScene('paris'), paris);
  assert.equal(getScene(parseLink('?scene=paris&seed=9&theme=la-vie-en-rose').scene), paris);
});

test('Paris has French act names, its own themes and the glitter signature', () => {
  assert.equal(paris.show.signature, 'glitter');
  const s = buildShow(paris.show, 14);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'Ouverture');
  assert.equal(labels[labels.length - 2], 'Scintillement');
  assert.equal(labels[labels.length - 1], 'Bouquet final');
  assert.equal(s.cues[0].type, 'willow', 'the show opens with two willows');
  const names = paris.show.palettes.map((p) => p.name);
  assert.ok(names.includes('Champagne') && names.includes('Bleu Blanc Rouge'));
});

test('a theme id from a link picks the right French theme', () => {
  assert.equal(buildShow(paris.show, 3, { theme: 'la-vie-en-rose' }).title, 'La Vie en Rose');
  assert.equal(buildShow(paris.show, 3, { theme: 'bleu-blanc-rouge' }).title, 'Bleu Blanc Rouge');
  const sent = buildShow(paris.show, 77, { avoid: 'Champagne' });
  assert.deepEqual(buildShow(paris.show, 77, { theme: sent.themeId }), sent);
});

test('the Eiffel Tower stands whole on every screen; phones centre it', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(paris, w, h);
    const { tower, top } = paris.rig(v);
    assert.equal(tower.length, 150);
    const xs = tower.map((p) => p.x), ys = tower.map((p) => p.y);
    assert.ok(Math.min(...xs) > 0 && Math.max(...xs) < w, `${w}x${h}: the tower's feet leave the screen`);
    assert.ok(top[0].y > 8, `${w}x${h}: the top is cut off (y=${top[0].y.toFixed(0)})`);
    assert.ok((v.hz - top[0].y) / v.hz > 0.35, `${w}x${h}: the tower is too small`);
    assert.ok(Math.max(...ys) <= v.hz, 'no glitter under the water');
    if (v.portrait) assert.ok(Math.abs(top[0].x - w / 2) < 1, 'centred on a phone');
    else assert.ok(top[0].x < w / 2, 'left of the middle on a wide screen');
  }
});

test('glitter appears on the iron, not in the open arch', () => {
  const v = fakeView(paris, 1000, 1000 / 0.74);      // 1 unit = 1 pixel, tower at x = 430
  const { tower } = paris.rig(v);
  const cx = v.px(0);
  const underArch = tower.filter((p) => v.hz - p.y < 8 + 20 && Math.abs(p.x - cx) < 15);
  assert.equal(underArch.length, 0);
  const left = tower.filter((p) => p.x < cx).length;
  assert.ok(left > 50 && left < 100, 'both legs sparkle');
});

test('the bridge fits a phone screen: its end columns are inside a 360 unit view', () => {
  const v = fakeView(paris, 360, 740);
  assert.ok(v.px(-176) >= 0 && v.px(176) <= 360);
});
