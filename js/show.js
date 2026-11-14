// Show choreography. Pure logic: no canvas, no clock, no DOM.
//
// buildShow() turns a scene's show settings plus a seed into a list of cues.
// A cue says WHEN (seconds from the start) and WHAT (a shell, a comet, the
// bridge waterfall...). Positions are 0..1 so a show fits any screen.
// The same seed always gives the same show; a new seed gives a new one.

import { slugify } from './link.js';

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

// ---------- more acts, for scenes that ask for them ----------
// A scene lists the acts it wants in `show.acts`. Scenes that do not (Sydney)
// use the seven acts above, so their shows stay exactly as they were.

// Rows of jets that rise and cross like a dancing fountain.
function fountain(c, t) {
  const posts = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  posts.forEach((x, i) => {
    const u = i / (posts.length - 1);
    c.add(t + i * 0.07, 'comet', { x, angle: 0, speed: 0.62 + 0.3 * Math.sin(Math.PI * u), color: c.col(0) });
    c.add(t + 1.1 + (posts.length - 1 - i) * 0.07, 'comet', { x, angle: i % 2 ? 0.26 : -0.26, speed: 0.8, color: c.col(1) });
    c.add(t + 2.2, 'comet', { x, angle: (0.5 - u) * 0.9, speed: 0.92, color: c.col(2) });
  });
  [0.1, 0.3, 0.5, 0.7, 0.9].forEach((x, i) => c.add(t + 2.25, 'mine', { x, color: c.col(i), size: 0.8 }));
  [0.42, 0.5, 0.58].forEach((x) => c.add(t + 3.2, 'comet', { x, angle: 0, speed: 1.12, color: c.col(0) }));
  c.shell(t + 3.0, 0.28, 0.7, 'palm', { size: 1.05 });
  c.shell(t + 3.0, 0.72, 0.7, 'palm', { size: 1.05 });
  return 5;
}

// A grove of palm bursts, left to right, with one tall palm to close.
function palms(c, t) {
  [0.16, 0.33, 0.5, 0.67, 0.84].forEach((x, i) => {
    c.shell(t + i * 0.45, x, 0.52 + (i % 2) * 0.12, 'palm', { size: 1.05, color: c.col(i) });
  });
  c.shell(t + 2.6, 0.33, 0.82, 'crackle', { size: 0.9 });
  c.shell(t + 2.9, 0.67, 0.82, 'crackle', { size: 0.9 });
  c.shell(t + 3.4, 0.5, 0.92, 'palm', { size: 1.35, whistle: true });
  return 5.2;
}

// Three-four time: one large ring, then two small steps, four bars.
function waltz(c, t) {
  const beat = 0.48;
  [0.3, 0.7, 0.4, 0.6].forEach((x, bar) => {
    const at = t + bar * beat * 3;
    c.shell(at, x, 0.74, bar % 2 ? 'saturn' : 'ring', { size: 1.15, color: c.col(bar), color2: c.col(bar + 1) });
    c.shell(at + beat, x - 0.14, 0.46, 'peony', { size: 0.6, color: c.col(bar + 1) });
    c.shell(at + beat * 2, x + 0.14, 0.46, 'peony', { size: 0.6, color: c.col(bar + 1) });
  });
  return 6;
}

// Four slow, heavy strikes like a great bell, each with a crackling echo.
function chimes(c, t) {
  const xs = [0.5, 0.36, 0.64, 0.5];
  const hs = [0.8, 0.66, 0.66, 0.88];
  for (let i = 0; i < 4; i++) {
    c.shell(t + i * 1.25, xs[i], hs[i], 'chrys', { size: 1.35, color: c.col(i) });
    c.shell(t + i * 1.25 + 0.5, xs[i] + (i % 2 ? 0.12 : -0.12), 0.34, 'crackle', { size: 0.7 });
  }
  return 5.8;
}

// Rows of quick small shells, like the bulbs running round a theatre sign.
function marquee(c, t) {
  for (let i = 0; i < 10; i++) {
    const u = i / 9;
    c.shell(t + i * 0.14, 0.1 + 0.8 * u, 0.34, i % 2 ? 'strobe' : 'peony', { size: 0.6, color: c.col(i) });
    c.shell(t + 1.7 + i * 0.14, 0.9 - 0.8 * u, 0.56, i % 2 ? 'peony' : 'crackle', { size: 0.65, color: c.col(i + 1) });
  }
  [0.25, 0.5, 0.75].forEach((x, i) => c.shell(t + 3.5 + i * 0.18, x, 0.84, 'ring', { size: 1.15, color: c.col(i) }));
  c.shell(t + 4.3, 0.5, 0.92, 'peony', { size: 1.4 });
  return 5.6;
}

// Japanese style: great round chrysanthemums, one at a time, with room to
// be looked at. One alone, then a pair, then one more above them all.
function kiku(c, t) {
  c.shell(t, 0.5, 0.9, 'chrys', { size: 1.55, whistle: true, color: c.col(0), color2: c.col(1) });
  c.shell(t + 1.7, 0.29, 0.74, 'chrys', { size: 1.3, color: c.col(1), color2: c.col(2) });
  c.shell(t + 1.7, 0.71, 0.74, 'chrys', { size: 1.3, color: c.col(1), color2: c.col(2) });
  c.shell(t + 3.3, 0.5, 0.95, 'chrys', { size: 1.65, color: c.col(2), color2: c.col(0) });
  c.shell(t + 4.3, 0.38, 0.48, 'peony', { size: 0.6, color: c.col(0) });
  c.shell(t + 4.3, 0.62, 0.48, 'peony', { size: 0.6, color: c.col(0) });
  return 5.9;
}

// Symmetrical pairs: every shell has a twin on the other side of the sky.
// The pairs step outward and upward, and one shell in the middle closes.
function pairs(c, t) {
  const types = ['ring', 'chrys', 'peony', 'chrys', 'saturn'];
  for (let i = 0; i < 5; i++) {
    const d = 0.07 + 0.085 * i;
    const o = { color: c.col(i), color2: c.col(i + 1), size: 0.8 + i * 0.1 };
    c.shell(t + i * 0.62, 0.5 - d, 0.46 + 0.09 * i, types[i], o);
    c.shell(t + i * 0.62, 0.5 + d, 0.46 + 0.09 * i, types[i], o);
  }
  c.shell(t + 3.7, 0.5, 0.94, 'chrys', { size: 1.45 });
  return 5.7;
}

// A dragon: a winding line of small bursts crossing the sky, with a great
// head at the end and two crackling pearls beside it.
function dragon(c, t) {
  const flip = c.r() < 0.5;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = 0.07 + 0.8 * (flip ? 1 - u : u);
    c.shell(t + i * 0.17, x, 0.52 + 0.17 * Math.sin(u * Math.PI * 3), 'peony', { size: 0.5, color: c.col(i % 2) });
  }
  const head = flip ? 0.1 : 0.9;
  c.shell(t + n * 0.17 + 0.2, head, 0.8, 'chrys', { size: 1.4, color: c.col(0), color2: c.col(1) });
  c.shell(t + n * 0.17 + 0.9, head + (flip ? 0.16 : -0.16), 0.6, 'crackle', { size: 0.8 });
  c.shell(t + n * 0.17 + 1.1, head + (flip ? 0.3 : -0.3), 0.74, 'crackle', { size: 0.8 });
  return 5.6;
}

export const EXTRA_MOVEMENTS = { fountain, palms, waltz, chimes, marquee, kiku, pairs, dragon };
const ALL_MOVEMENTS = { ...MOVEMENTS, ...EXTRA_MOVEMENTS };

// ---------- other openings (a scene picks one with `show.opening`) ----------

// One huge gold shell first, then jets and palms: an entrance for a tower.
function openingTower(c, t) {
  c.shell(t, 0.5, 0.95, 'kamuro', { size: 1.4, whistle: true });
  [0.14, 0.32, 0.5, 0.68, 0.86].forEach((x) => c.add(t + 1.6, 'comet', { x, angle: 0, speed: 0.9, color: c.col(0) }));
  c.shell(t + 2.4, 0.25, 0.6, 'palm');
  c.shell(t + 2.4, 0.75, 0.6, 'palm');
  c.shell(t + 3.3, 0.5, 0.8, 'saturn', { size: 1.2 });
  return 4.5;
}

// Two willows together, a ring between them, then a pair of small peonies.
function openingDuet(c, t) {
  c.shell(t, 0.38, 0.78, 'willow', { size: 1.1, whistle: true });
  c.shell(t + 0.5, 0.62, 0.78, 'willow', { size: 1.1 });
  c.shell(t + 2.0, 0.5, 0.9, 'ring', { size: 1.3 });
  c.shell(t + 3.1, 0.3, 0.6, 'peony');
  c.shell(t + 3.1, 0.7, 0.6, 'peony');
  return 4.5;
}

// Three slow strikes in the middle of the sky, then a crossette.
function openingStrikes(c, t) {
  [0, 1.3, 2.6].forEach((dt, i) => c.shell(t + dt, 0.5, 0.82 + (i === 2 ? 0.06 : 0), 'chrys', { size: 1.3, color: c.col(i), whistle: i === 0 }));
  c.shell(t + 3.4, 0.5, 0.62, 'crossette', { size: 1.1 });
  return 4.5;
}

// A loud start: a fan of comets, two big peonies, three reports, a ring.
function openingSalvo(c, t) {
  [-0.5, -0.25, 0, 0.25, 0.5].forEach((angle, i) => c.add(t, 'comet', { x: 0.5, angle, speed: 0.95, color: c.col(i) }));
  c.shell(t + 1.0, 0.3, 0.72, 'peony', { size: 1.2, whistle: true });
  c.shell(t + 1.0, 0.7, 0.72, 'peony', { size: 1.2 });
  [0.34, 0.5, 0.66].forEach((x, i) => c.shell(t + 2.2 + i * 0.16, x, 0.5, 'salute', { size: 0.9 }));
  c.shell(t + 3.2, 0.5, 0.9, 'ring', { size: 1.35 });
  return 4.5;
}

// One perfect shell alone in the sky, a pause, then a matching pair.
function openingSingle(c, t) {
  c.shell(t, 0.5, 0.93, 'chrys', { size: 1.6, whistle: true, color: c.col(0), color2: c.col(1) });
  c.shell(t + 2.4, 0.3, 0.7, 'chrys', { size: 1.1, color: c.col(1) });
  c.shell(t + 2.4, 0.7, 0.7, 'chrys', { size: 1.1, color: c.col(1) });
  c.shell(t + 3.5, 0.5, 0.56, 'ring', { size: 0.9, color: c.col(2) });
  return 4.5;
}

// Shells sweep across the harbour in one rising and falling arc, then palms.
function openingSweep(c, t) {
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    c.shell(t + i * 0.3, 0.1 + 0.8 * u, 0.44 + 0.42 * Math.sin(Math.PI * u), i % 2 ? 'ring' : 'peony', { size: 0.85, color: c.col(i), whistle: i === 0 });
  }
  c.shell(t + 2.9, 0.28, 0.66, 'palm', { size: 1.1 });
  c.shell(t + 2.9, 0.72, 0.66, 'palm', { size: 1.1 });
  return 4.5;
}

const OPENINGS = { classic: opening, tower: openingTower, duet: openingDuet, strikes: openingStrikes, salvo: openingSalvo, single: openingSingle, sweep: openingSweep };

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

// ---------- signature acts ----------
// A scene without a waterfall can name one of these with `show.signature`.
// Each one plays on anchor points the scene gives in its rig() (see
// SIGNATURE_RIG), so the effect sits on the scene's own landmark.

// Sparks climb a tower tier by tier, then fan out from its spire.
function spire(c, t) {
  for (let pass = 0; pass < 2; pass++) {
    for (let level = 0; level < 6; level++) {
      c.add(t + pass * 2.2 + level * 0.3, 'crown', { set: 'tiers', only: level, speed: 0.13 + 0.012 * level, color: c.col(pass) });
    }
  }
  c.add(t + 1.0, 'glitter', { set: 'facade', dur: 7.6, rate: 0.5 });
  c.add(t + 4.6, 'crown', { set: 'tiers', speed: 0.18, color: c.col(2) });
  for (let k = 0; k < 4; k++) c.add(t + 5.3 + k * 0.75, 'crown', { set: 'spire', speed: 0.3 + 0.07 * k, color: c.col(k) });
  c.shell(t + 5.6, 0.5, 0.98, 'strobe', { size: 1.2 });
  c.shell(t + 7.4, 0.5, 0.98, 'kamuro', { size: 1.3 });
  return 9.4;
}

// A tower twinkles in slow pulses while gold willows open beside it.
function glitter(c, t) {
  c.add(t, 'glitter', { set: 'tower', dur: 8.6, rate: 1.8, pulse: true });
  c.shell(t + 1.4, 0.2, 0.8, 'willow', { size: 1.1 });
  c.shell(t + 2.6, 0.8, 0.8, 'willow', { size: 1.1 });
  c.shell(t + 4.6, 0.28, 0.88, 'kamuro', { size: 1.1 });
  c.shell(t + 5.4, 0.72, 0.88, 'kamuro', { size: 1.1 });
  c.add(t + 6.8, 'crown', { set: 'top', speed: 0.22, color: c.col(0) });
  c.add(t + 7.6, 'crown', { set: 'top', speed: 0.3, color: c.col(1) });
  return 9.4;
}

// Small bursts run around a great wheel, then the whole rim fires at once.
function wheel(c, t) {
  const n = 16;
  for (let i = 0; i < n; i++) {
    c.add(t + i * 0.11, 'at', { set: 'wheel', only: i, type: 'peony', size: 0.3, color: c.col(0) });
    c.add(t + 2.1 + i * 0.09, 'at', { set: 'wheel', only: n - 1 - i, type: 'ring', size: 0.34, color: c.col(1) });
  }
  c.add(t + 3.9, 'at', { set: 'wheel', step: 2, offset: 0, type: 'peony', size: 0.34, color: c.col(2) });
  c.add(t + 4.4, 'at', { set: 'wheel', step: 2, offset: 1, type: 'peony', size: 0.34, color: c.col(0) });
  c.add(t + 5.0, 'at', { set: 'wheel', type: 'ring', size: 0.36, color: c.col(1) });
  c.add(t + 5.8, 'crown', { set: 'hub', speed: 0.16, color: c.col(0) });
  c.shell(t + 6.2, 0.5, 0.92, 'saturn', { size: 1.3 });
  c.add(t + 6.6, 'crown', { set: 'hub', speed: 0.2, color: c.col(1) });
  c.add(t + 7.6, 'at', { set: 'wheel', type: 'chrys', size: 0.42, color: c.col(2) });
  return 9.4;
}

// A "star mine": quick fans of comets from a row of points along a bridge,
// always in mirrored pairs, first from the outside in, then from the inside
// out, then all at once, with great twin shells above.
function starmine(c, t) {
  const n = 10;
  for (let k = 0; k < 5; k++) {
    for (const only of [k, n - 1 - k]) c.add(t + k * 0.28, 'crown', { set: 'bridge', only, speed: 0.34, color: c.col(0) });
    for (const only of [4 - k, 5 + k]) c.add(t + 1.8 + k * 0.22, 'crown', { set: 'bridge', only, speed: 0.42, color: c.col(1) });
  }
  c.add(t + 3.2, 'crown', { set: 'bridge', speed: 0.5, color: c.col(2) });
  c.add(t + 3.3, 'at', { set: 'towers', type: 'chrys', size: 0.45, color: c.col(0) });
  c.shell(t + 3.6, 0.3, 0.86, 'chrys', { size: 1.4, color: c.col(0), color2: c.col(1) });
  c.shell(t + 3.6, 0.7, 0.86, 'chrys', { size: 1.4, color: c.col(0), color2: c.col(1) });
  c.add(t + 5.0, 'crown', { set: 'bridge', step: 2, offset: 0, speed: 0.46, color: c.col(1) });
  c.add(t + 5.4, 'crown', { set: 'bridge', step: 2, offset: 1, speed: 0.46, color: c.col(2) });
  c.add(t + 6.0, 'crown', { set: 'bridge', speed: 0.56, color: c.col(0) });
  c.add(t + 6.1, 'at', { set: 'towers', type: 'ring', size: 0.5, color: c.col(1) });
  c.shell(t + 6.6, 0.5, 0.96, 'chrys', { size: 1.6 });
  c.shell(t + 7.7, 0.5, 0.96, 'kamuro', { size: 1.3 });
  return 9.4;
}

// Beams of light sweep the sky from the rooftops, first together, then
// crossing each other, while slow rings open between them.
function beams(c, t) {
  c.add(t, 'beams', { set: 'roofs', dur: 8.8, colors: [c.col(0), c.col(1), c.col(2)] });
  c.shell(t + 1.2, 0.3, 0.86, 'ring', { size: 1.2 });
  c.shell(t + 2.3, 0.7, 0.86, 'ring', { size: 1.2 });
  c.shell(t + 4.0, 0.36, 0.7, 'peony', { size: 1.0 });
  c.shell(t + 4.0, 0.64, 0.7, 'peony', { size: 1.0 });
  c.shell(t + 5.6, 0.5, 0.94, 'chrys', { size: 1.4 });
  c.shell(t + 6.8, 0.26, 0.6, 'crackle', { size: 0.9 });
  c.shell(t + 6.8, 0.74, 0.6, 'crackle', { size: 0.9 });
  c.add(t + 7.7, 'at', { set: 'roofs', type: 'peony', size: 0.3, color: c.col(0) });
  return 9.4;
}

export const SIGNATURES = { spire, glitter, wheel, starmine, beams };
// The rig() anchor sets each signature act needs from its scene.
export const SIGNATURE_RIG = { spire: ['tiers', 'spire'], glitter: ['tower', 'top'], wheel: ['wheel', 'hub'], starmine: ['bridge', 'towers'], beams: ['roofs'] };

// Faster and faster, then gold across the whole sky, then one last shell.
function finale(c, t, seconds) {
  const types = c.finaleTypes || ['peony', 'chrys', 'ring', 'saturn', 'palm', 'crackle', 'peony', 'crossette'];
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

// ---------- act names ----------

// What the caption says for each act. A scene can change any of them with
// `show.actLabels` (for example { waterfall: 'Bridge of Light' }).
export const ACT_LABELS = {
  opening: 'Opening',
  chase: 'The Chase',
  mirror: 'Mirror',
  fans: 'Fans',
  willows: 'Willows',
  garden: 'Garden',
  crossfire: 'Crossfire',
  sparkle: 'Sparkle',
  fountain: 'Fountain',
  palms: 'Palms',
  waltz: 'Waltz',
  chimes: 'Chimes',
  marquee: 'Marquee',
  kiku: 'Chrysanthemum',
  pairs: 'Pairs',
  dragon: 'Dragon',
  waterfall: 'Waterfall',
  spire: 'The Spire',
  glitter: 'Glitter',
  wheel: 'The Wheel',
  starmine: 'Star Mine',
  beams: 'Sky Beams',
  finale: 'Finale',
};

// The act that is playing `elapsed` seconds into the show, or null before the
// first act and after the last one. Acts follow each other without gaps.
export function actAt(show, elapsed) {
  const timeline = show.timeline;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (elapsed >= timeline[i].start) return elapsed < timeline[i].end ? timeline[i] : null;
  }
  return null;
}

// ---------- builder ----------

// Optional flavour a scene can put in cfg: acts (which middle acts may be
// picked), opening, signature, finaleTypes, actLabels.
// cfg: the `show` object of a scene. opts.calm: gentler show (reduced motion).
// opts.avoid: a palette name not to use (so two shows in a row look different).
// opts.theme: a palette id (see slugify) to use instead of the random pick. The
// random numbers are used in the same way either way, so the same seed and
// the same theme always give exactly the same show (this is what share links use).
export function buildShow(cfg, seed, opts = {}) {
  const r = seededRandom(seed);
  let palettes = cfg.palettes;
  if (opts.avoid && palettes.length > 1) palettes = palettes.filter((p) => p.name !== opts.avoid);
  const picked = pick(r, palettes);
  const forced = opts.theme ? cfg.palettes.find((p) => slugify(p.name) === opts.theme) : null;
  const theme = forced || picked;
  const cues = [];
  const calm = !!opts.calm;

  const c = {
    r, calm,
    features: cfg.features || {},
    finaleTypes: cfg.finaleTypes,
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

  // Every act is written down with its start and end, for the act captions.
  // The pause after an act belongs to that act, so acts have no gaps.
  const timeline = [];
  const labelOf = (key) => cfg.actLabels?.[key] ?? ACT_LABELS[key] ?? key;
  let t = 0.2;
  const run = (key, play, pause = 0) => {
    const length = play() + pause;
    timeline.push({ key, label: labelOf(key), start: t, end: t + length });
    t += length;
  };

  const open = OPENINGS[cfg.opening] || opening;
  run('opening', () => open(c, t));
  // A scene may list its own acts; without a list the seven classic ones are used.
  const pool = cfg.acts ? cfg.acts.filter((key) => ALL_MOVEMENTS[key]) : Object.keys(MOVEMENTS);
  const names = shuffle(r, pool).slice(0, cfg.movements ?? 3);
  for (const name of names) run(name, () => ALL_MOVEMENTS[name](c, t), 0.5);
  // The quiet middle: the waterfall, or the scene's own signature act.
  const signature = SIGNATURES[cfg.signature];
  if (c.features.waterfall) run('waterfall', () => waterfallAct(c, t), 0.3);
  else if (signature) run(cfg.signature, () => signature(c, t), 0.3);
  run('finale', () => finale(c, t, cfg.finaleSeconds ?? 8));
  timeline.forEach((act, i) => { act.index = i + 1; });

  cues.sort((a, b) => a.t - b.t);
  return { seed, title: theme.name, themeId: slugify(theme.name), acts: names, timeline, cues, duration: t + 4.5 };
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
