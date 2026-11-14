import test from 'node:test';
import assert from 'node:assert/strict';
import hongkong from '../js/scenes/hongkong.js';
import { scenes, getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { postcardCaption, postcardFileName } from '../js/postcard.js';
import { LIFE_LAYERS } from '../js/life.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

test('Hong Kong is registered and a share link opens it', () => {
  assert.equal(getScene('hongkong'), hongkong);
  assert.equal(getScene(parseLink('?scene=hongkong&seed=9&theme=jade').scene), hongkong);
  assert.equal(parseLink('?scene=HongKong').scene, 'hongkong');
});

test('the switcher lists all seven places, Sydney first', () => {
  assert.deepEqual(scenes.map((s) => s.id), ['sydney', 'dubai', 'paris', 'london', 'newyork', 'tokyo', 'hongkong']);
});

test('every place has its own signature, opening and act names', () => {
  const middle = scenes.map((s) => (s.show.features?.waterfall ? `waterfall:${s.id}` : s.show.signature));
  assert.equal(new Set(middle).size, scenes.length, 'two places share a signature effect');
  const finales = scenes.map((s) => buildShow(s.show, 3).timeline.at(-1).label);
  assert.equal(new Set(finales).size, scenes.length, 'two places name their finale the same');
  const themes = scenes.flatMap((s) => s.show.palettes.map((p) => p.name));
  assert.equal(new Set(themes).size, themes.length, 'two places share a theme name');
  const skies = scenes.map((s) => s.palette.sky.map((stop) => stop[1]).join());
  assert.equal(new Set(skies).size, scenes.length, 'two places share the same sky colours');
});

test('Hong Kong has its own themes, act names, opening and signature', () => {
  assert.equal(hongkong.show.signature, 'beams');
  assert.equal(hongkong.show.opening, 'sweep');
  assert.ok(hongkong.show.acts.includes('dragon'));
  assert.ok(hongkong.show.palettes.some((p) => p.name === 'Lucky Red & Gold'));
  const s = buildShow(hongkong.show, 21);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'Harbour Lights');
  assert.equal(labels[labels.length - 2], 'Sky Beams');
  assert.equal(labels[labels.length - 1], 'Fortune Finale');
});

test('the Sky Beams act asks for beams from the rooftops in the colours of the show', () => {
  const s = buildShow(hongkong.show, 8);
  const act = s.timeline.find((a) => a.key === 'beams');
  const cue = s.cues.find((c) => c.kind === 'beams');
  assert.ok(cue && cue.t >= act.start && cue.t < act.end);
  assert.equal(cue.set, 'roofs');
  assert.ok(cue.dur >= 6 && cue.t + cue.dur <= act.end, 'the beams are over when the act ends');
  assert.equal(cue.colors.length, 3);
  for (const c of cue.colors) assert.ok(c.length === 3 && Math.max(...c) >= 150);
  assert.equal(s.cues.filter((c) => c.kind === 'beams').length, 1);
});

test('the same seed and theme give the same Hong Kong show (share links)', () => {
  const sent = buildShow(hongkong.show, 2468, { avoid: 'Pearl' });
  assert.deepEqual(buildShow(hongkong.show, 2468, { theme: sent.themeId }), sent);
});

test('six beams start from rooftops across the whole skyline, outer ones leaning outward', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(hongkong, w, h);
    const { roofs, tips } = hongkong.rig(v);
    assert.equal(roofs.length, 6);
    for (let i = 1; i < roofs.length; i++) {
      assert.ok(roofs[i].x > roofs[i - 1].x, `${w}x${h}: rooftops run left to right`);
      assert.ok(roofs[i].angle > roofs[i - 1].angle, 'beams fan out');
    }
    assert.ok(roofs[0].angle < 0 && roofs[5].angle > 0);
    assert.ok(roofs[5].x - roofs[0].x > w * 0.7, `${w}x${h}: the beams should span the skyline`);
    for (const p of roofs) {
      assert.ok(p.x >= 0 && p.x <= w && p.y > 6 && p.y < v.hz, `${w}x${h}: a rooftop is off the screen`);
    }
    const tip = tips[0];
    assert.ok(tip.y > 8, `${w}x${h}: the tallest tower is cut off (y=${tip.y.toFixed(0)})`);
    assert.ok((v.hz - tip.y) / v.hz > 0.35, `${w}x${h}: the towers are too small`);
    assert.equal(Math.min(...roofs.map((p) => p.y)), tip.y, 'the crown tower is the tallest');
  }
});

test('Hong Kong life: boats and tower lights in front, the Peak tram and mist behind the towers', () => {
  const layer = Object.fromEntries(hongkong.life.map((d) => [d.id, d.layer]));
  for (const d of hongkong.life) assert.ok(LIFE_LAYERS.includes(d.layer), d.id);
  assert.equal(layer.peaktram, 'behind');
  assert.equal(layer.mist, 'behind');
  for (const id of ['starferry', 'junk', 'sampan', 'windows', 'neon']) assert.equal(layer[id], 'front', id);
  assert.deepEqual(hongkong.life.filter((d) => d.sound).map((d) => `${d.id}:${d.sound}`).sort(), ['junk:gong', 'neon:chime', 'sampan:water', 'starferry:horn']);
});

test('a Hong Kong postcard has the right caption and file name', () => {
  assert.equal(postcardCaption({ name: hongkong.name, showNo: 3 }), 'Hong Kong · Show No. 3');
  assert.equal(postcardFileName({ id: hongkong.id, showNo: 3 }), 'boomvoyage-hongkong-show-3.png');
});
