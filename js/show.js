// Show choreography. Pure logic: no canvas, no clock, no DOM.
//
// buildShow() turns a scene's show settings plus a seed into a list of cues.
// A cue says WHEN (seconds from the start) and WHAT (a shell, a comet, the
// bridge waterfall...). Positions are 0..1 so a show fits any screen.
// The same seed always gives the same show; a new seed gives a new one.

export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, list) => list[Math.floor(r() * list.length)];

function shuffle(r, list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- acts: each adds cues starting at t and returns its length ----------

function opening(c, t) {
  c.shell(t, 0.5, 0.9, 'chrys', { size: 1.3, whistle: true });
  c.shell(t + 1.5, 0.27, 0.62, 'peony', { whistle: true });
  c.shell(t + 1.9, 0.73, 0.62, 'peony', { whistle: true });
  c.shell(t + 3.1, 0.5, 0.78, 'saturn', { size: 1.2 });
  return 4.5;
}

function chase(c, t) {
  const n = 8;
  const flip = c.r() < 0.5;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = 0.08 + 0.84 * (flip ? 1 - u : u);
    c.shell(t + i * 0.26, x, 0.3 + 0.3 * Math.sin(Math.PI * u), 'peony', { color: c.col(i), size: 0.8 });
    c.shell(t + 2.5 + i * 0.2, 1 - x, 0.6 + 0.25 * Math.sin(Math.PI * u), i % 2 ? 'ring' : 'peony', { color: c.col(i + 1), size: 0.9 });
  }
  return 5.2;
}

function mirror(c, t) {
  const types = shuffle(c.r, ['saturn', 'ring', 'peony', 'chrys']);
  for (let i = 0; i < 4; i++) {
    const d = 0.08 + 0.115 * i;
    const o = { color: c.col(i), color2: c.col(i + 1), size: 0.85 + i * 0.08, whistle: i === 0 };
    c.shell(t + i * 0.85, 0.5 - d, 0.42 + 0.13 * i, types[i], o);
    c.shell(t + i * 0.85, 0.5 + d, 0.42 + 0.13 * i, types[i], o);
  }
  c.shell(t + 3.7, 0.5, 0.7, 'crossette', { size: 1.1 });
  return 5.4;
}

function fans(c, t) {
  const posts = [0.12, 0.31, 0.5, 0.69, 0.88];
  const color = c.col();
  posts.forEach((x) => c.add(t, 'comet', { x, angle: 0, speed: 0.95, color }));
  posts.forEach((x) => {
    c.add(t + 0.9, 'comet', { x, angle: -0.38, speed: 0.9, color: c.col(1) });
    c.add(t + 0.9, 'comet', { x, angle: 0.38, speed: 0.9, color: c.col(1) });
  });
  posts.forEach((x, i) => {
    c.add(t + 1.8 + i * 0.1, 'comet', { x, angle: -0.5 + i * 0.25, speed: 1, color: c.col(2) });
    c.add(t + 2.7, 'mine', { x, color: c.col(i), size: 0.9 });
  });
  c.shell(t + 2.2, 0.33, 0.72, 'palm', { size: 1.1 });
  c.shell(t + 2.5, 0.67, 0.72, 'palm', { size: 1.1 });
  return 5;
}

function willows(c, t) {
  const xs = shuffle(c.r, [0.18, 0.34, 0.5, 0.66, 0.82]);
  xs.forEach((x, i) => c.shell(t + i * 0.7, x, 0.68 + c.r() * 0.2, 'willow', { size: 1.15, whistle: i === 0 }));
  c.shell(t + 3.7, 0.5, 0.86, 'kamuro', { size: 1.25 });
  return 6;
}

function garden(c, t) {
  for (let i = 0; i < 16; i++) {
    const type = i % 4 === 3 ? 'crackle' : pick(c.r, ['peony', 'ring', 'peony']);
    c.shell(t + i * 0.22, 0.08 + c.r() * 0.84, 0.18 + c.r() * 0.42, type, { size: 0.55 + c.r() * 0.25 });
  }
  return 4.8;
}

function crossfire(c, t) {
  [0.25, 0.5, 0.75].forEach((x, i) => c.shell(t + i * 0.5, x, 0.58, 'crossette', { color: c.col(i) }));
  c.shell(t + 2.0, 0.36, 0.74, 'palm', { size: 1.1 });
  c.shell(t + 2.0, 0.64, 0.74, 'palm', { size: 1.1 });
  c.shell(t + 2.9, 0.5, 0.9, 'strobe', { size: 1.2 });
  return 5;
}

function sparkle(c, t) {
  [0.3, 0.7, 0.5].forEach((x, i) => c.shell(t + i * 0.9, x, 0.8, 'strobe', { size: 1.05 }));
  [0.2, 0.42, 0.58, 0.8].forEach((x, i) => c.shell(t + 1.2 + i * 0.45, x, 0.38, 'crackle', { size: 0.9 }));
  return 5;
}

export const MOVEMENTS = { chase, mirror, fans, willows, garden, crossfire, sparkle };

// The quiet act: a curtain of sparks from the scene's waterfall line
// (in Sydney, the bridge deck), with slow white shells floating above it.
function waterfallAct(c, t) {
  c.add(t, 'waterfall', { dur: 9 });
  c.shell(t + 1.2, 0.3 + c.r() * 0.4, 0.9, 'strobe', { size: 1.1 });
  c.shell(t + 3.4, 0.3 + c.r() * 0.4, 0.84, 'willow', { size: 1.1 });
  c.shell(t + 5.4, 0.3 + c.r() * 0.4, 0.9, 'strobe', { size: 1.1 });
  if (c.features.crown) {
    c.add(t + 6.6, 'crown', { speed: 0.42, color: c.col(0) });
    c.add(t + 7.4, 'crown', { speed: 0.5, color: c.col(1) });
    c.add(t + 8.2, 'crown', { speed: 0.6, color: c.col(2) });
  }
  return 9.4;
}

// Faster and faster, then gold across the whole sky, then one last shell.
function finale(c, t, seconds) {
  const types = ['peony', 'chrys', 'ring', 'saturn', 'palm', 'crackle', 'peony', 'crossette'];
  const fastest = c.calm ? 0.34 : 0.11;
  let gap = 0.42;
  let i = 0;
  for (let tt = t; tt < t + seconds; tt += gap) {
    c.shell(tt, 0.06 + c.r() * 0.88, 0.28 + c.r() * 0.62, pick(c.r, types), { size: 0.8 + c.r() * 0.5 });
    if (i++ % 6 === 5) c.add(tt, 'mine', { x: 0.1 + c.r() * 0.8, color: c.col(), size: 1 });
    gap = Math.max(fastest, gap * 0.93);
  }
  const end = t + seconds + 0.3;
  [0.14, 0.32, 0.5, 0.68, 0.86].forEach((x) => c.shell(end, x, 0.74, 'kamuro', { size: 1.3 }));
  [0.3, 0.5, 0.7].forEach((x, k) => c.shell(end + 0.7 + k * 0.12, x, 0.5, 'salute', { size: 1 }));
  c.shell(end + 2.1, 0.5, 0.92, 'kamuro', { size: 1.6, whistle: true });
  return seconds + 3.4;
}

// ---------- builder ----------

// cfg: the `show` object of a scene. opts.calm: gentler show (reduced motion).
// opts.avoid: a palette name not to use (so two shows in a row look different).
export function buildShow(cfg, seed, opts = {}) {
  const r = seededRandom(seed);
  let palettes = cfg.palettes;
  if (opts.avoid && palettes.length > 1) palettes = palettes.filter((p) => p.name !== opts.avoid);
  const theme = pick(r, palettes);
  const cues = [];
  const calm = !!opts.calm;

  const c = {
    r, calm,
    features: cfg.features || {},
    col: (i) => (i === undefined ? pick(r, theme.colors) : theme.colors[i % theme.colors.length]),
    shell(t, x, h, type, o = {}) {
      if (calm && type === 'strobe') type = 'chrys';   // no flicker
      if (calm && type === 'salute') type = 'peony';   // no white flash
      cues.push({
        t, kind: 'shell', x, h, type,
        color: o.color ?? c.col(),
        color2: o.color2 ?? c.col(),
        size: o.size ?? 1,
        whistle: o.whistle ?? false,
        drift: r() - 0.5,
      });
    },
    add(t, kind, o) { cues.push({ t, kind, ...o }); },
  };

  let t = 0.2;
  t += opening(c, t);
  const names = shuffle(r, Object.keys(MOVEMENTS)).slice(0, cfg.movements ?? 3);
  for (const name of names) t += MOVEMENTS[name](c, t) + 0.5;
  if (c.features.waterfall) t += waterfallAct(c, t) + 0.3;
  t += finale(c, t, cfg.finaleSeconds ?? 8);

  cues.sort((a, b) => a.t - b.t);
  return { seed, title: theme.name, acts: names, cues, duration: t + 4.5 };
}

// ---------- runner ----------

// Hands out cues as time passes. `elapsed` comes from real timestamps, so if
// the tab slept for a while we skip what was missed instead of firing it all
// at once. Long cues (the waterfall) are resumed with the time they have left.
export function createRunner(show, { lateLimit = 1.2 } = {}) {
  let i = 0;
  const cues = show.cues;
  return {
    show,
    due(elapsed) {
      const out = [];
      while (i < cues.length && cues[i].t <= elapsed) {
        const cue = cues[i++];
        const late = elapsed - cue.t;
        if (late <= lateLimit) out.push(cue);
        else if (cue.dur && cue.dur - late > 1) out.push({ ...cue, dur: cue.dur - late });
      }
      return out;
    },
    finished(elapsed) { return elapsed >= show.duration; },
  };
}
