import test from 'node:test';
import assert from 'node:assert/strict';
import sydney from '../js/scenes/sydney.js';

// A pretend view, like the engine makes: scene units to pixels.
function view(w, h, portrait) {
  const hz = Math.round(h * (portrait ? sydney.horizon.portrait : sydney.horizon.landscape));
  const S = portrait ? w / sydney.portraitSpan : Math.max(w / 1000, h / 1400);
  const fx = portrait ? sydney.focusX.portrait : sydney.focusX.landscape;
  return { w, h, hz, S, portrait, U: 700, px: (x) => w / 2 + (x - fx) * S, py: (y) => hz - y * S };
}

test('wide screens: the waterfall pours from the straight bridge deck', () => {
  const v = view(1600, 900, false);
  const { waterfall } = sydney.rig(v);
  assert.equal(waterfall.length, 2);
  assert.equal(waterfall[0].y, waterfall[1].y, 'the deck is level');
  assert.ok(waterfall[0].y < v.hz, 'above the water');
});

test('portrait: the waterfall hangs from the arch, across the whole bridge', () => {
  for (const [w, h] of [[390, 844], [360, 740], [768, 1024]]) {
    const v = view(w, h, true);
    const { waterfall, waterfallDensity } = sydney.rig(v);
    assert.ok(waterfall.length >= 10, 'a curve needs many points');
    assert.ok(waterfallDensity > 1, 'a taller curtain needs more sparks');

    // It spans most of the screen and stays on it.
    const xs = waterfall.map((p) => p.x);
    assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= w, 'inside the screen');
    assert.ok(Math.max(...xs) - Math.min(...xs) > w * 0.8, 'nearly the full width');
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1], 'left to right, evenly');

    // An arch: highest in the middle, lower at both ends, never under water.
    const ys = waterfall.map((p) => p.y);
    const mid = ys[Math.floor(ys.length / 2)];
    assert.ok(mid < ys[0] && mid < ys[ys.length - 1], 'the middle is the highest point');
    assert.ok(Math.max(...ys) <= v.hz, 'never below the waterline');
  }
});

test('portrait: the curtain starts above the Opera House roofs, so its top edge is never hidden', () => {
  // In portrait the Opera House is drawn 1.08x and moved 246 units to the
  // right (see drawSkylinePortrait). Its tallest shells reach about 87 units
  // near x = 127 and 77 units near x = 190.
  const v = view(390, 844, true);
  const { waterfall } = sydney.rig(v);
  const heightAt = (x) => {
    const px = v.px(x);
    let best = waterfall[0];
    for (const p of waterfall) if (Math.abs(p.x - px) < Math.abs(best.x - px)) best = p;
    return (v.hz - best.y) / v.S; // back to scene units above the water
  };
  assert.ok(heightAt(127) > 87 + 10);
  assert.ok(heightAt(190) > 77 + 10);
});
