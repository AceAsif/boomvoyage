// Scene: Sydney Harbour, seen from the east on a warm night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.

import { towerRow, lamp } from './kit.js';

// Harbour Bridge geometry, in scene units.
const B = { L: -20, R: 420, deck: 40, cx: 200, half: 220, panels: 28 };
const n = (x) => (x - B.cx) / B.half;
const lowerChord = (x) => B.deck - 10 + 100 * (1 - n(x) ** 2);
const upperChord = (x) => B.deck + 42 + 68 * (1 - n(x) ** 2);

// A copy of the view that draws everything moved sideways and resized.
// Used to re-arrange the landmarks for portrait screens.
function shifted(v, dx, k = 1) {
  return { ...v, S: v.S * k, px: (x) => v.px(x * k + dx), py: (y) => v.py(y * k) };
}

const STEEL = '#0b0f21';
const WARM = '#ffd7a0';

function drawSky(ctx, v) {
  const { w, hz, U } = v;

  // City haze: warm light sitting on the horizon behind the towers.
  const hx = v.px(v.portrait ? 60 : -260);
  const haze = ctx.createRadialGradient(hx, hz, 0, hx, hz, U * 0.75);
  haze.addColorStop(0, 'rgba(255,140,90,0.30)');
  haze.addColorStop(0.4, 'rgba(210,90,120,0.12)');
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, hz);

  // The Southern Cross and its two pointers, upper left.
  const cx = w * (v.portrait ? 0.3 : 0.24), cy = hz * (v.portrait ? 0.4 : 0.3), s = U * 0.034;
  const stars = [
    [0, -1, 1.5], [0.14, 1, 1.9], [-0.68, 0.08, 1.6], [0.55, -0.24, 1.2], [0.3, 0.32, 0.7],
    [-2.7, 1.0, 1.9], [-1.95, 0.62, 1.6],
  ];
  const rot = -0.35, cr = Math.cos(rot), sr = Math.sin(rot);
  for (const [sx, sy, mag] of stars) {
    lamp(ctx, cx + (sx * cr - sy * sr) * s, cy + (sx * sr + sy * cr) * s, mag * 0.75, '#eaf1ff', 0.95);
  }

  // A thin setting moon, upper right.
  const mx = w * (v.portrait ? 0.8 : 0.86), my = hz * (v.portrait ? 0.3 : 0.17), mr = U * 0.016;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(0.5);
  ctx.shadowColor = 'rgba(255,236,200,0.8)';
  ctx.shadowBlur = mr * 1.6;
  ctx.fillStyle = '#f6ecd6';
  ctx.beginPath();
  ctx.arc(0, 0, mr, -Math.PI / 2, Math.PI / 2);
  ctx.ellipse(0, 0, mr * 0.62, mr, 0, Math.PI / 2, -Math.PI / 2, true);
  ctx.fill();
  ctx.restore();
}

function drawBridge(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const step = (B.R - B.L) / B.panels;

  // Approach spans and their piers.
  ctx.fillStyle = STEEL;
  ctx.fillRect(X(-300), Y(B.deck), (840) * S, 4 * S);
  for (let x = -290; x < 540; x += 26) {
    if (x > B.L - 20 && x < B.R + 20) continue;
    ctx.fillRect(X(x), Y(B.deck), 2.4 * S, B.deck * S);
  }

  ctx.strokeStyle = STEEL;
  ctx.lineJoin = 'round';

  // Hangers from the arch down to the deck.
  ctx.lineWidth = Math.max(0.6, 0.7 * S);
  ctx.beginPath();
  for (let i = 1; i < B.panels; i++) {
    const x = B.L + i * step;
    if (lowerChord(x) > B.deck) { ctx.moveTo(X(x), Y(lowerChord(x))); ctx.lineTo(X(x), Y(B.deck)); }
  }
  ctx.stroke();

  // Truss between the two chords.
  ctx.lineWidth = Math.max(0.8, 1.1 * S);
  ctx.beginPath();
  for (let i = 0; i <= B.panels; i++) {
    const x = B.L + i * step;
    ctx.moveTo(X(x), Y(lowerChord(x)));
    ctx.lineTo(X(x), Y(upperChord(x)));
    if (i < B.panels) {
      const x2 = x + step;
      const leftHalf = i < B.panels / 2;
      ctx.moveTo(X(x), Y(leftHalf ? upperChord(x) : lowerChord(x)));
      ctx.lineTo(X(x2), Y(leftHalf ? lowerChord(x2) : upperChord(x2)));
    }
  }
  ctx.stroke();

  // The two chords.
  for (const [fn, width] of [[lowerChord, 2.6], [upperChord, 2.2]]) {
    ctx.lineWidth = Math.max(1.2, width * S);
    ctx.beginPath();
    for (let i = 0; i <= B.panels * 2; i++) {
      const x = B.L + (i * step) / 2;
      if (i === 0) ctx.moveTo(X(x), Y(fn(x))); else ctx.lineTo(X(x), Y(fn(x)));
    }
    ctx.stroke();
  }
  // A faint cool edge on the top chord so the arch reads against the sky.
  ctx.strokeStyle = 'rgba(150,172,230,0.28)';
  ctx.lineWidth = Math.max(0.6, 0.6 * S);
  ctx.beginPath();
  for (let i = 0; i <= B.panels * 2; i++) {
    const x = B.L + (i * step) / 2;
    const y = Y(upperChord(x)) - 1.1 * S;
    if (i === 0) ctx.moveTo(X(x), y); else ctx.lineTo(X(x), y);
  }
  ctx.stroke();

  // Stone pylons at each end.
  for (const x of [B.L - 17, B.R + 1]) {
    const g = ctx.createLinearGradient(0, Y(86), 0, Y(0));
    g.addColorStop(0, '#2c2936');
    g.addColorStop(1, '#55424a');
    ctx.fillStyle = g;
    ctx.fillRect(X(x), Y(84), 16 * S, 84 * S + 1);
    ctx.fillStyle = '#211f2b';
    ctx.fillRect(X(x - 1.5), Y(86), 19 * S, 3 * S);
    ctx.fillRect(X(x + 3), Y(60), 2 * S, 14 * S);
    ctx.fillRect(X(x + 11), Y(60), 2 * S, 14 * S);
  }

  // Lights: a string along the deck, pearls on the arch, a beacon on top.
  for (let x = -296; x < 540; x += 7) lamp(ctx, X(x), Y(B.deck + 5.5), Math.max(0.6, 0.6 * S), WARM, 0.85);
  for (let i = 0; i <= B.panels; i++) {
    const x = B.L + i * step;
    lamp(ctx, X(x), Y(upperChord(x) + 2), Math.max(0.5, 0.5 * S), '#fff1d6', 0.7);
  }
  lamp(ctx, X(B.cx), Y(upperChord(B.cx) + 6), Math.max(0.9, 0.9 * S), '#ff5548', 1);
}

// ---------- Opera House ----------
// Drawn from the side, with the harbour to the right. Each hall is a row of
// shells that lean toward the harbour and get taller toward it, plus one
// small shell at the back that faces the land. The far hall is the larger
// one; the near hall overlaps it. A small pair of shells (the restaurant)
// sits at the land end, and everything stands on a wide stepped podium.

// One shell. (bx, 0) is the foot of its back edge; `dir` 1 leans right.
// The back edge rises in one long curve to a sharp tip that hangs over the
// open front; the front edge drops back to the podium under it.
function shell(ctx, v, bx, w, h, dir, tone) {
  const X = (t) => v.px(bx + dir * w * t), Y = (t) => v.py(PODIUM + h * t);
  const back = [[0, 0], [0.04, 0.62], [0.55, 0.9], [1, 1]];   // cubic: foot -> tip
  const point = (u) => {
    const k = 1 - u;
    const f = [k * k * k, 3 * k * k * u, 3 * k * u * u, u * u * u];
    return [0, 1].map((i) => back.reduce((sum, p, j) => sum + p[i] * f[j], 0));
  };

  const g = ctx.createLinearGradient(X(0.1), Y(1), X(0.75), Y(0));
  g.addColorStop(0, tone.top);
  g.addColorStop(0.5, tone.mid);
  g.addColorStop(1, tone.low);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(0));
  ctx.bezierCurveTo(X(back[1][0]), Y(back[1][1]), X(back[2][0]), Y(back[2][1]), X(1), Y(1));
  ctx.quadraticCurveTo(X(0.8), Y(0.46), X(0.7), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = tone.edge;
  ctx.lineWidth = Math.max(0.5, 0.6 * v.S);
  ctx.lineJoin = 'miter';
  ctx.stroke();

  // Ribs: the tiles follow lines that fan out from the foot of the shell.
  ctx.strokeStyle = tone.rib;
  ctx.lineWidth = Math.max(0.4, 0.35 * v.S);
  ctx.beginPath();
  for (const u of [0.3, 0.46, 0.62, 0.78, 0.92]) {
    const [tx, ty] = point(u);
    ctx.moveTo(X(0.62), Y(0));
    ctx.quadraticCurveTo(X(0.62 * 0.5 + tx * 0.5 - 0.05), Y(ty * 0.62), X(tx), Y(ty));
  }
  ctx.stroke();

  // Glass wall in the open front, lit warm from inside, with mullions.
  const glass = ctx.createLinearGradient(0, Y(0.8), 0, Y(0));
  glass.addColorStop(0, 'rgba(46,30,34,0.95)');
  glass.addColorStop(0.55, 'rgba(150,88,44,0.95)');
  glass.addColorStop(1, 'rgba(246,176,92,1)');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(X(0.7), Y(0));
  ctx.quadraticCurveTo(X(0.79), Y(0.42), X(0.955), Y(0.9));
  ctx.quadraticCurveTo(X(0.7), Y(0.5), X(0.52), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,26,30,0.55)';
  ctx.lineWidth = Math.max(0.4, 0.3 * v.S);
  ctx.beginPath();
  for (const t of [0.57, 0.62, 0.67]) {
    ctx.moveTo(X(t), Y(0));
    ctx.quadraticCurveTo(X(t + 0.07), Y(0.3), X(t + 0.2), Y(0.62 - (t - 0.57)));
  }
  ctx.stroke();
}

const PODIUM = 11; // height of the podium top above the water, in scene units

const NEAR = { top: '#fbf5e8', mid: '#e3dcd9', low: '#8f89a8', edge: 'rgba(40,36,64,0.6)', rib: 'rgba(96,90,128,0.22)' };
const FAR = { top: '#e4dfdc', mid: '#bdb7c4', low: '#6d6890', edge: 'rgba(34,30,58,0.6)', rib: 'rgba(80,76,112,0.2)' };

// One hall: three shells rising toward the harbour and one facing the land.
// Small shells are drawn last so every pointed tip stays visible.
function hall(ctx, v, x, k, tone) {
  shell(ctx, v, x + 40 * k, 62 * k, 70 * k, 1, tone);
  shell(ctx, v, x + 17 * k, 48 * k, 51 * k, 1, tone);
  shell(ctx, v, x, 36 * k, 35 * k, 1, tone);
  shell(ctx, v, x + 9 * k, 25 * k, 27 * k, -1, tone);
}

function drawOperaHouse(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;

  // Podium: three wide steps, palest on top where the lamps are.
  const steps = [[-262, -38, 4, '#16131c'], [-256, -42, 8, '#221c24'], [-250, -46, PODIUM, '#30272c']];
  for (const [x0, x1, top, color] of steps) {
    ctx.fillStyle = color;
    ctx.fillRect(X(x0), Y(top), (x1 - x0) * S, top * S + 1);
  }
  // The grand stairs at the land end.
  ctx.strokeStyle = 'rgba(255,215,160,0.16)';
  ctx.lineWidth = Math.max(0.4, 0.35 * S);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(X(-262 + i * 2.2), Y(1.5 + i * 1.7));
    ctx.lineTo(X(-236), Y(1.5 + i * 1.7));
  }
  ctx.stroke();

  hall(ctx, v, -212, 1, FAR);                              // concert hall, behind
  shell(ctx, v, -247, 21, 19, 1, NEAR);                     // restaurant, land end
  shell(ctx, v, -243, 13, 13, -1, NEAR);
  hall(ctx, v, -140, 0.86, NEAR);                          // theatre, in front

  for (let x = -247; x < -48; x += 6) lamp(ctx, X(x), Y(PODIUM - 2.2), Math.max(0.5, 0.45 * S), WARM, 0.8);
  for (let x = -258; x < -40; x += 9) lamp(ctx, X(x), Y(2), Math.max(0.4, 0.35 * S), WARM, 0.5);
}

// Portrait: the classic postcard view. The whole bridge fills the width,
// the Opera House sits in front of its left side, and the city is a small
// far-away row behind the sails.
function drawSkylinePortrait(ctx, v) {
  drawFarShore(ctx, v);
  drawCity(ctx, shifted(v, 292, 0.55));
  drawBridge(ctx, v);
  drawOperaHouse(ctx, shifted(v, 246, 1.08));
}

function drawFarShore(ctx, v) {
  const Y = v.py, S = v.S, w = v.w;
  ctx.fillStyle = '#0a0d1e';
  ctx.beginPath();
  ctx.moveTo(0, Y(0) + 1);
  for (let px = 0; px <= w + 8; px += 8) {
    const u = px / S;
    ctx.lineTo(px, Y(7 + 4 * Math.sin(u * 0.021) + 3 * Math.sin(u * 0.057 + 1)));
  }
  ctx.lineTo(w, Y(0) + 1);
  ctx.closePath();
  ctx.fill();
}

function drawSkyline(ctx, v) {
  if (v.portrait) { drawSkylinePortrait(ctx, v); return; }
  const X = v.px, Y = v.py, S = v.S, w = v.w;
  drawFarShore(ctx, v);
  drawCity(ctx, v);

  // North shore, to the right of the bridge.
  towerRow(ctx, v, {
    seed: 41, from: 436, to: 640, minW: 12, maxW: 24, minH: 16, maxH: 62, gap: 6,
    colors: ['#090c1c', '#0c1024'],
    windows: { lit: 0.24, colors: [WARM, '#bcd8ff'] },
  });

  drawBridge(ctx, v);
  drawOperaHouse(ctx, v);
}

function drawCity(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const fade = (t) => 0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.05));

  // City: a hazy back row, then lit towers in front.
  towerRow(ctx, v, { seed: 11, from: -620, to: -230, minW: 16, maxW: 34, minH: 40, maxH: 92, gap: 2, shape: fade, colors: ['#151a3a', '#181d40'] });
  towerRow(ctx, v, {
    seed: 23, from: -610, to: -246, minW: 13, maxW: 28, minH: 26, maxH: 112, gap: 5, shape: fade,
    colors: ['#080b1a', '#0b0f22', '#0e1228'],
    windows: { lit: 0.3, colors: [WARM, '#ffe9c4', '#bcd8ff'] },
  });

  // Sydney Tower: thin shaft, gold turret, spire.
  ctx.fillStyle = '#0b0f22';
  ctx.fillRect(X(-372), Y(128), 3 * S, 128 * S);
  ctx.fillRect(X(-370.8), Y(150), 0.8 * S, 22 * S);
  ctx.fillStyle = '#6a5230';
  ctx.beginPath();
  ctx.moveTo(X(-378), Y(118));
  ctx.lineTo(X(-380.5), Y(126));
  ctx.lineTo(X(-378), Y(133));
  ctx.lineTo(X(-363), Y(133));
  ctx.lineTo(X(-360.5), Y(126));
  ctx.lineTo(X(-363), Y(118));
  ctx.closePath();
  ctx.fill();
  for (let x = -379; x <= -362; x += 2.4) lamp(ctx, X(x), Y(126), Math.max(0.4, 0.4 * S), WARM, 0.9);
  lamp(ctx, X(-370.4), Y(151), Math.max(0.7, 0.7 * S), '#ff5548', 1);
}

function drawWater(ctx, v) {
  // A few small boats waiting for the show, each with a riding light.
  const boats = [[-330, 0.2, 1], [40, 0.34, 1.3], [300, 0.16, 0.9], [-140, 0.55, 1.6], [440, 0.42, 1.2]];
  const wh = v.h - v.hz;
  for (const [x, d, k] of boats) {
    const bx = v.px(x), by = v.hz + wh * d, s = v.S * k * 1.4;
    ctx.fillStyle = '#04050c';
    ctx.beginPath();
    ctx.moveTo(bx - 9 * s, by - 1.6 * s);
    ctx.lineTo(bx + 10 * s, by - 1.6 * s);
    ctx.lineTo(bx + 7 * s, by + 0.8 * s);
    ctx.lineTo(bx - 7 * s, by + 0.8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx - 3 * s, by - 4 * s, 6 * s, 2.6 * s);
    ctx.fillRect(bx - 0.3 * s, by - 9 * s, 0.6 * s, 5 * s);
    lamp(ctx, bx, by - 9 * s, Math.max(0.7, 0.6 * s), '#ffe2b0', 0.95);
    lamp(ctx, bx + 2 * s, by - 2.8 * s, Math.max(0.5, 0.4 * s), k > 1.2 ? '#7dffb0' : '#ff6a5a', 0.9);
    const g = ctx.createLinearGradient(0, by, 0, by + 16 * s);
    g.addColorStop(0, 'rgba(255,226,176,0.35)');
    g.addColorStop(1, 'rgba(255,226,176,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 0.8 * s, by + 1 * s, 1.6 * s, 16 * s);
  }
}

// Where the special effects of this scene are anchored (in pixels).
function rig(v) {
  const crown = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8 - 0.5;                       // -0.5 .. 0.5 along the arch
    const x = B.cx + t * 2 * B.half * 0.84;
    crown.push({ x: v.px(x), y: v.py(upperChord(x) + 2), angle: t * 1.7 });
  }
  return {
    waterfall: [
      { x: v.px(B.L + 6), y: v.py(B.deck - 3) },
      { x: v.px(B.R - 6), y: v.py(B.deck - 3) },
    ],
    crown,
  };
}

export default {
  id: 'sydney',
  name: 'Sydney Harbour',
  country: 'Australia',
  tagline: 'Sydney Harbour, tonight and every two minutes.',

  // Where the waterline sits (share of screen height), and which scene x is
  // centred. Portrait screens shift right so the bridge stays in view.
  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 200 },
  // Portrait only: this many scene units must fit across the screen
  // (the bridge is 474 units long, so it fits with a small margin).
  portraitSpan: 506,

  palette: {
    sky: [[0, '#02030b'], [0.45, '#070b24'], [0.8, '#161a44'], [1, '#3a2a56']],
    water: [[0, '#15163a'], [0.25, '#0a0d25'], [1, '#02030a']],
    star: '#e6ecff',
  },
  stars: 240,

  drawSky,
  drawSkyline,
  drawWater,
  rig,

  show: {
    intervalSeconds: 120,
    movements: 3,          // middle acts per show, picked at random
    finaleSeconds: 8,
    features: { waterfall: true, crown: true },
    palettes: [
      { name: 'Ember & Jade', colors: [[255, 170, 70], [255, 84, 60], [80, 235, 170]] },
      { name: 'Harbour Blue', colors: [[70, 150, 255], [140, 230, 255], [255, 255, 255]] },
      { name: 'Jacaranda', colors: [[176, 120, 255], [255, 120, 200], [230, 225, 255]] },
      { name: 'Southern Gold', colors: [[255, 200, 110], [255, 150, 60], [255, 240, 210]] },
      { name: 'Coral Sea', colors: [[255, 110, 100], [60, 225, 215], [255, 235, 130]] },
      { name: 'Waratah', colors: [[255, 50, 70], [255, 255, 255], [255, 180, 120]] },
    ],
  },

  // Optional sound tweaks. Open water and a far shore: long tail, clear echo.
  sound: {
    reverbSeconds: 3.4,
    echoSeconds: 0.36,
    echoLevel: 0.2,
    boomPitch: 1,
    ambient: { wash: 1, breeze: 1, bell: true },
  },
};
