import test from 'node:test';
import assert from 'node:assert/strict';
import london from '../js/scenes/london.js';
import { scenes, getScene } from '../js/scenes/index.js';
import { buildShow } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { fakeView, SCREENS } from './helpers/fake-canvas.js';

test('London is registered and a share link opens it', () => {
  assert.equal(getScene('london'), london);
  assert.equal(getScene(parseLink('?scene=london&seed=9&theme=crown-jewels').scene), london);
});

test('the switcher lists the four places, Sydney first', () => {
  assert.deepEqual(scenes.map((s) => s.id), ['sydney', 'dubai', 'paris', 'london']);
});

test('London has its own themes, act names and the wheel signature', () => {
  assert.equal(london.show.signature, 'wheel');
  const s = buildShow(london.show, 31);
  const labels = s.timeline.map((a) => a.label);
  assert.equal(labels[0], 'Overture');
  assert.equal(labels[labels.length - 2], 'The Wheel');
  assert.equal(labels[labels.length - 1], 'Grand Finale');
  const first = s.cues.filter((c) => c.t < 3).map((c) => c.type);
  assert.deepEqual(first, ['chrys', 'chrys', 'chrys'], 'the show opens with three slow strikes');
  assert.equal(buildShow(london.show, 3, { theme: 'crown-jewels' }).title, 'Crown Jewels');
  const sent = buildShow(london.show, 555, { avoid: 'Union' });
  assert.deepEqual(buildShow(london.show, 555, { theme: sent.themeId }), sent);
});

test('the wheel has 16 rim points on a true circle, whole on every screen', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(london, w, h);
    const { wheel, hub } = london.rig(v);
    assert.equal(wheel.length, 16);
    const cx = hub[0].x, cy = hub[0].y;
    const radii = wheel.map((p) => Math.hypot(p.x - cx, p.y - cy));
    for (const r of radii) assert.ok(Math.abs(r - radii[0]) < 0.01, 'all points the same distance from the hub');
    assert.ok(Math.min(...wheel.map((p) => p.x)) >= 0, `${w}x${h}: the wheel leaves the screen on the left`);
    assert.ok(Math.min(...wheel.map((p) => p.y)) >= 8, `${w}x${h}: the wheel is cut off at the top`);
    assert.ok(Math.max(...wheel.map((p) => p.y)) < v.hz, `${w}x${h}: the wheel dips into the river`);
    assert.ok(wheel[0].y < cy && Math.abs(wheel[0].x - cx) < 0.01, 'the first point is the top of the wheel');
    assert.ok(wheel[4].x > cx, 'the run goes clockwise');
  }
});

test('the clock tower is whole and stands to the right of the wheel, never behind it', () => {
  for (const [w, h] of SCREENS) {
    const v = fakeView(london, w, h);
    const { wheel, clock } = london.rig(v);
    const wheelRight = Math.max(...wheel.map((p) => p.x));
    assert.ok(clock[0].x > wheelRight + 10, `${w}x${h}: the tower is hidden by the wheel`);
    assert.ok(clock[0].x < w - 10, `${w}x${h}: the tower leaves the screen`);
    assert.ok(v.py(150) > 8, `${w}x${h}: the spire is cut off`);
  }
});

test('on a phone the shortened palace ends inside the screen', () => {
  for (const [w, h] of [[390, 844], [360, 740], [768, 1024]]) {
    const v = fakeView(london, w, h);
    const palaceRight = v.px(76 + (362 - 76) * 0.55);
    assert.ok(palaceRight <= w, `${w}x${h}: Victoria Tower is cut off (${palaceRight.toFixed(0)} > ${w})`);
  }
});
