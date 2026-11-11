import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, createFrameStats, formatStats } from '../js/stats.js';

test('no frames gives zeros, not NaN', () => {
  assert.deepEqual(summarize([]), { frames: 0, fps: 0, typical: 0, slow: 0, worst: 0, over33: 0 });
  assert.equal(formatStats(summarize([])), 'measuring…');
});

test('a steady 60 fps run', () => {
  const s = summarize(new Array(120).fill(1000 / 60));
  assert.equal(s.frames, 120);
  assert.ok(Math.abs(s.fps - 60) < 0.01);
  assert.ok(Math.abs(s.typical - 16.667) < 0.01);
  assert.ok(Math.abs(s.slow - 16.667) < 0.01);
  assert.equal(s.over33, 0);
});

test('typical, slow and worst come from the sorted frame times', () => {
  const times = [];
  for (let i = 1; i <= 100; i++) times.push(i); // 1..100 ms, any order works
  times.reverse();
  const s = summarize(times);
  assert.equal(s.typical, 51);
  assert.equal(s.slow, 96);
  assert.equal(s.worst, 100);
  assert.equal(s.over33, 67); // 34..100
  assert.ok(Math.abs(s.fps - 1000 / 50.5) < 1e-9);
});

test('a few very slow frames show in "slow" and "worst" but not in "typical"', () => {
  const times = new Array(90).fill(16.7).concat(new Array(10).fill(80));
  const s = summarize(times);
  assert.equal(s.typical, 16.7);
  assert.equal(s.slow, 80);
  assert.equal(s.worst, 80);
  assert.equal(s.over33, 10);
});

test('the recorder keeps only the newest frames', () => {
  const stats = createFrameStats(4);
  for (const ms of [100, 100, 10, 10, 10, 10]) stats.push(ms);
  assert.equal(stats.length, 4);
  assert.equal(stats.summary().worst, 10, 'the two old 100 ms frames were pushed out');
});

test('the recorder ignores pauses and bad values', () => {
  const stats = createFrameStats(10);
  for (const ms of [16, 0, -5, NaN, 5000, 17]) stats.push(ms);
  assert.equal(stats.length, 2);
  stats.reset();
  assert.equal(stats.length, 0);
  assert.equal(stats.summary().frames, 0);
});

test('formatStats makes one short readable line', () => {
  const line = formatStats(summarize([16.7, 16.7, 16.7, 33.3]));
  assert.match(line, /^\d+ fps · typical 16\.7 ms · slow 33\.3 ms · worst 33\.3 ms$/);
});
