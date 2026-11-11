import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes, getScene } from '../js/scenes/index.js';
import { buildShow, SIGNATURES, SIGNATURE_RIG, EXTRA_MOVEMENTS, MOVEMENTS } from '../js/show.js';
import { parseLink } from '../js/link.js';
import { createLife, lifeRandom } from '../js/life.js';
import { fakeContext, fakeView, SCREENS } from './helpers/fake-canvas.js';

test('there is at least one scene and ids are unique', () => {
  assert.ok(scenes.length >= 1);
  assert.equal(new Set(scenes.map((s) => s.id)).size, scenes.length);
});

test('getScene falls back to the first scene for an unknown id', () => {
  assert.equal(getScene('nowhere'), scenes[0]);
  assert.equal(getScene(scenes[0].id), scenes[0]);
});

for (const scene of scenes) {
  test(`scene "${scene.id}" has everything the engine needs`, () => {
    assert.equal(typeof scene.id, 'string');
    assert.equal(typeof scene.name, 'string');
    assert.equal(typeof scene.country, 'string');
    assert.equal(typeof scene.drawSkyline, 'function');
    assert.ok(Array.isArray(scene.palette.sky) && scene.palette.sky.length >= 2);
    assert.ok(Array.isArray(scene.palette.water) && scene.palette.water.length >= 2);

    assert.ok(scene.show.intervalSeconds >= 30);
    assert.ok(scene.show.palettes.length >= 2, 'needs 2+ palettes so shows differ');
    for (const p of scene.show.palettes) {
      assert.equal(typeof p.name, 'string');
      assert.ok(p.colors.length >= 2);
      for (const c of p.colors) {
        assert.equal(c.length, 3);
        for (const part of c) assert.ok(part >= 0 && part <= 255);
      }
    }
  });

  test(`scene "${scene.id}" rig returns pixel anchors`, () => {
    if (!scene.rig) return;
    const v = { w: 1000, h: 700, hz: 500, S: 1, U: 750, px: (x) => 500 + x, py: (y) => 500 - y };
    const rig = scene.rig(v);
    if (rig.waterfall) {
      assert.ok(rig.waterfall.length >= 2);
      for (const p of rig.waterfall) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
    if (rig.crown) {
      for (const p of rig.crown) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.angle));
    }
  });
}

// ---------- checks every scene must pass (old and new) ----------

test('Sydney is the first scene, so it is the default', () => {
  assert.equal(scenes[0].id, 'sydney');
  assert.equal(getScene(null).id, 'sydney');
  assert.equal(getScene(undefined).id, 'sydney');
});

for (const scene of scenes) {
  test(`scene "${scene.id}": a link with ?scene=${scene.id} opens it`, () => {
    const link = parseLink(`?scene=${scene.id}&seed=5`);
    assert.equal(link.scene, scene.id);
    assert.equal(getScene(link.scene), scene);
    assert.equal(parseLink(`?scene=${scene.id.toUpperCase()}`).scene, scene.id, 'capital letters also work');
  });

  test(`scene "${scene.id}": has its own start-screen text and menu text`, () => {
    assert.ok(scene.tagline && scene.tagline.length > 10);
    assert.ok(scene.name.length <= 16, 'the name must fit the switcher button on a phone');
    assert.ok(scene.country.length <= 16);
  });

  test(`scene "${scene.id}": themes have unique names and bright colours`, () => {
    const names = scene.show.palettes.map((p) => p.name);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.length >= 4, 'at least four themes, so shows differ');
    for (const p of scene.show.palettes) {
      for (const c of p.colors) assert.ok(Math.max(...c) >= 150, `${p.name}: a colour is too dark to see`);
    }
  });

  test(`scene "${scene.id}": its acts exist and its shows build`, () => {
    for (const act of scene.show.acts || []) assert.ok(MOVEMENTS[act] || EXTRA_MOVEMENTS[act], `unknown act "${act}"`);
    if (scene.show.acts) assert.ok(scene.show.acts.length > (scene.show.movements ?? 3), 'more acts than slots, so shows differ');
    for (const key of Object.keys(scene.show.actLabels || {})) assert.equal(typeof scene.show.actLabels[key], 'string');
    const kinds = new Set();
    for (let seed = 1; seed <= 25; seed++) {
      const s = buildShow(scene.show, seed);
      assert.ok(s.duration > 30 && s.duration < scene.show.intervalSeconds);
      assert.equal(s.timeline[0].key, 'opening');
      assert.equal(s.timeline[s.timeline.length - 1].key, 'finale');
      for (const act of s.timeline) assert.ok(act.label && act.label !== act.key, `act "${act.key}" has no caption`);
      kinds.add(s.acts.join(','));
    }
    assert.ok(kinds.size >= 8, 'shows should differ from seed to seed');
  });

  test(`scene "${scene.id}": has a middle act of its own (waterfall or signature) with its anchors on screen`, () => {
    const sig = scene.show.features?.waterfall ? 'waterfall' : scene.show.signature;
    assert.ok(sig === 'waterfall' || SIGNATURES[sig], 'needs features.waterfall or a known show.signature');
    assert.ok(buildShow(scene.show, 3).timeline.some((a) => a.key === sig));
    const sets = sig === 'waterfall' ? ['waterfall'] : SIGNATURE_RIG[sig];
    for (const [w, h] of SCREENS) {
      const v = fakeView(scene, w, h);
      const rig = scene.rig(v);
      for (const name of sets) {
        const pts = rig[name];
        assert.ok(Array.isArray(pts) && pts.length >= 1, `${w}x${h}: rig has no "${name}" anchors`);
        for (const p of pts) {
          assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${w}x${h}: bad "${name}" anchor`);
          assert.ok(p.x >= -2 && p.x <= w + 2, `${w}x${h}: a "${name}" anchor is off the side of the screen (x=${p.x.toFixed(0)})`);
          assert.ok(p.y >= 0 && p.y <= v.hz + 2, `${w}x${h}: a "${name}" anchor is off the sky (y=${p.y.toFixed(0)}, sky is 0..${v.hz})`);
        }
      }
    }
  });

  test(`scene "${scene.id}": draws on every screen size without errors`, () => {
    for (const [w, h] of SCREENS) {
      const v = fakeView(scene, w, h);
      for (const part of ['drawSky', 'drawSkyline', 'drawWater']) {
        if (!scene[part]) continue;
        const ctx = fakeContext();
        scene[part](ctx, v);
        if (part === 'drawSkyline') assert.ok(ctx.calls.total > 50, `${w}x${h}: the skyline drew almost nothing`);
      }
    }
  });

  test(`scene "${scene.id}": portrait keeps its own framing`, () => {
    assert.ok(scene.portraitSpan > 200 && scene.portraitSpan < 900, 'portraitSpan says how many scene units fit across a phone');
    const v = fakeView(scene, 390, 844);
    assert.ok(v.S > 0.4, 'landmarks would be tiny on a phone');
  });
}

// ---------- life between shows ----------

for (const scene of scenes) {
  if (!scene.life) continue;

  test(`scene "${scene.id}": its life events are well formed`, () => {
    assert.ok(scene.life.length >= 3, 'at least three events, so the quiet time has variety');
    const ids = scene.life.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length, 'ids must be unique');
    for (const d of scene.life) {
      assert.equal(typeof d.draw, 'function', `${d.id} needs draw()`);
      assert.ok(['sky', 'land', 'water'].includes(d.layer), `${d.id}: layer must be sky, land or water`);
      assert.ok(d.duration[0] >= 3 && d.duration[0] <= d.duration[1] && d.duration[1] <= 40, `${d.id}: odd duration`);
      if (d.sound) assert.equal(typeof d.sound, 'string');
    }
    assert.ok(scene.life.filter((d) => d.calm !== false).length >= 2, 'something must be left with reduce motion');
    assert.ok(new Set(scene.life.map((d) => d.group ?? d.id)).size >= 2, 'needs two groups, or two events could never overlap');
  });

  test(`scene "${scene.id}": every life event draws on every screen size, both ways, calm or not`, () => {
    const r = lifeRandom(5);
    for (const [w, h] of SCREENS) {
      const v = fakeView(scene, w, h);
      for (const d of scene.life) {
        let drew = 0;
        for (const dir of [1, -1]) {
          for (const calm of [false, true]) {
            const dur = (d.duration[0] + d.duration[1]) / 2;
            const p = d.setup ? d.setup(r) : {};
            for (const u of [0.005, 0.2, 0.5, 0.8, 0.995]) {
              const ctx = fakeContext();
              ctx.globalAlpha = 0.8;
              d.draw(ctx, v, { t: u * dur, dur, u, alpha: 0.8, dir, p, calm, def: d, id: d.id });
              assert.ok(Math.abs(ctx.globalAlpha - 0.8) < 1e-9, `${d.id} must leave globalAlpha as it found it`);
              drew += ctx.calls.total;
            }
          }
        }
        assert.ok(drew > 0, `${w}x${h}: ${d.id} never drew anything`);
      }
    }
  });

  test(`scene "${scene.id}": its life keeps the rules over ten quiet stretches`, () => {
    const life = createLife(scene.life, { seed: 321 });
    const seen = new Set();
    for (let wall = 0; wall < 1200; wall += 1 / 20) {
      const inCycle = wall % 120;
      life.tick(1 / 20, 120 - inCycle, inCycle >= 47);
      assert.ok(life.active.length <= 2);
      if (inCycle > 1.5 && inCycle < 47) assert.equal(life.active.length, 0, 'life during a show');
      for (const e of life.active) seen.add(e.id);
    }
    assert.equal(seen.size, scene.life.length, `some events never appeared: only ${[...seen].join(', ')}`);
  });
}
