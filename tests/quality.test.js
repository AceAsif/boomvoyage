import test from 'node:test';
import assert from 'node:assert/strict';
import { createGovernor } from '../js/quality.js';

// Feeds `seconds` of frames of a fixed length.
function run(g, ms, seconds, loaded = true) {
  for (let t = 0; t < seconds * 1000; t += ms) g.frame(ms, loaded);
  return g.level;
}

test('starts at full size', () => {
  const g = createGovernor();
  assert.equal(g.level, 0);
  assert.equal(g.scale, 1);
});

test('a browser that keeps up never loses quality (60 Hz and 144 Hz)', () => {
  for (const ms of [1000 / 60, 1000 / 144]) {
    const g = createGovernor();
    run(g, ms, 2, false);
    assert.equal(run(g, ms, 120), 0);
  }
});

test('Firefox-like case: 144 Hz screen, loaded frames take 21 ms -> steps down', () => {
  const g = createGovernor();
  run(g, 6.9, 2, false);          // idle: the screen's own pace is learned
  assert.equal(g.level, 0);
  run(g, 20.8, 2);                // a show starts and the browser falls behind
  assert.equal(g.level, 1);
});

test('it keeps stepping down while still slow, and stops at the last level', () => {
  const g = createGovernor({ levels: [1, 0.8, 0.67] });
  run(g, 6.9, 1, false);
  run(g, 30, 30);
  assert.equal(g.level, 2);
  assert.equal(g.scale, 0.67);
  run(g, 30, 30);
  assert.equal(g.level, 2, 'no level below the last one');
});

test('it stops stepping down as soon as the frames are good enough', () => {
  const g = createGovernor();
  run(g, 6.9, 1, false);
  run(g, 20.8, 2);                // slow -> level 1
  assert.equal(g.level, 1);
  run(g, 13.9, 20);               // 72 fps on a 144 Hz screen is fine (under the 15 ms floor)
  assert.equal(g.level, 1);
});

test('a 60 Hz screen: dropping every second frame (33 ms) steps down, a few drops do not', () => {
  const slow = createGovernor();
  run(slow, 16.7, 2, false);
  run(slow, 33.3, 3);
  assert.equal(slow.level, 1);

  const fine = createGovernor();
  run(fine, 16.7, 2, false);
  for (let i = 0; i < 2000; i++) fine.frame(i % 10 === 0 ? 33.3 : 16.7, true); // 10% dropped
  assert.equal(fine.level, 0);
});

test('idle frames are never judged, however slow', () => {
  const g = createGovernor();
  run(g, 6.9, 1, false);
  assert.equal(run(g, 50, 60, false), 0);
});

test('pauses (hidden tab) are ignored and restart the judging', () => {
  const g = createGovernor();
  run(g, 16.7, 1, false);
  for (let i = 0; i < 200; i++) g.frame(i % 20 === 0 ? 4000 : 16.7, true);
  assert.equal(g.level, 0);
  assert.equal(g.frame(NaN, true), 0);
  assert.equal(g.frame(-3, true), 0);
});

test('after a step it waits before judging again (the resize itself costs a frame or two)', () => {
  const g = createGovernor({ windowMs: 1000, settleMs: 700 });
  run(g, 6.9, 1, false);
  run(g, 25, 1.05);               // one full window -> level 1
  assert.equal(g.level, 1);
  run(g, 25, 1.5);                // 0.7 s settling + only 0.8 s judged: not a full window yet
  assert.equal(g.level, 1);
  run(g, 25, 0.5);
  assert.equal(g.level, 2);
});

test('it never goes back up', () => {
  const g = createGovernor();
  run(g, 6.9, 1, false);
  run(g, 30, 5);
  const low = g.level;
  assert.ok(low > 0);
  run(g, 6.9, 60);
  assert.equal(g.level, low);
});
