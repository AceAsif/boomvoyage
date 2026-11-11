// Frame-time numbers for the ?debug=1 meter. Pure functions: no DOM, no clock.
//
// A "frame time" is the time from one drawn frame to the next, in
// milliseconds. 16.7 ms is 60 frames per second.

// Turns a list of frame times into a few numbers a person can report.
export function summarize(times) {
  const n = times.length;
  if (!n) return { frames: 0, fps: 0, typical: 0, slow: 0, worst: 0, over33: 0 };
  const sorted = Array.from(times).sort((a, b) => a - b);
  let sum = 0;
  let over33 = 0;
  for (const t of sorted) {
    sum += t;
    if (t > 33.4) over33 += 1;
  }
  const at = (share) => sorted[Math.min(n - 1, Math.floor(n * share))];
  return {
    frames: n,
    fps: sum > 0 ? 1000 / (sum / n) : 0,   // average frames per second
    typical: at(0.5),                      // half of the frames are faster than this
    slow: at(0.95),                        // 95% of the frames are faster than this
    worst: sorted[n - 1],
    over33: (over33 / n) * 100,            // % of frames slower than 30 fps
  };
}

// Remembers the last `limit` frame times.
export function createFrameStats(limit = 600) {
  const ring = new Float64Array(limit);
  let count = 0;
  let next = 0;
  return {
    push(ms) {
      // A huge gap is a hidden tab or a paused page, not a slow frame.
      if (!(ms > 0) || ms > 1000) return;
      ring[next] = ms;
      next = (next + 1) % limit;
      if (count < limit) count += 1;
    },
    reset() { count = 0; next = 0; },
    get length() { return count; },
    summary() { return summarize(ring.subarray(0, count)); },
  };
}

// One short line for the on-screen meter.
export function formatStats(s) {
  if (!s.frames) return 'measuring…';
  const r = (x) => (x >= 100 ? x.toFixed(0) : x.toFixed(1));
  return `${s.fps.toFixed(0)} fps · typical ${r(s.typical)} ms · slow ${r(s.slow)} ms · worst ${r(s.worst)} ms`;
}
