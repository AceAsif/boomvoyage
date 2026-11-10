import test from 'node:test';
import assert from 'node:assert/strict';
import { scenes, getScene } from '../js/scenes/index.js';

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
