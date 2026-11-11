// Scene: London from the Thames on a cloudy winter night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// Left: the London Eye in cold blue-white light. Right: Elizabeth Tower
// (Big Ben) and the Houses of Parliament in warm floodlight. Between them,
// Westminster Bridge with a red bus. The clock shows midnight.

import { towerRow, lamp, rng, shifted, haze, boat } from './kit.js';

const WARM = '#ffd9a0';
const ICE = '#dff1ff';
const QUAY = 7;                    // height of the river wall
const EYE = { y: 108, r: 88 };     // the wheel: centre height and radius
const BEN = { x: 60, w: 14, tip: 150 };

// Where things stand. Wide screens: wheel far left, palace at full length.
// Portrait: the wheel moves in beside the tower, the bridge runs in front of
// it, and the palace is drawn shorter, as if it runs away from us.
function layout(v) {
  if (!v.portrait) return { eyeX: -250, bridge: [-130, 52], palace: v, far: v };
  return {
    eyeX: -110,
    bridge: [-204, 52],
    palace: { ...v, S: v.S * 0.55, px: (x) => v.px(76 + (x - 76) * 0.55), py: (y) => v.py(y * 0.55) },
    far: shifted(v, 150, 0.5),
  };
}

const STONE_TOP = '#dcb162';
const STONE_LOW = '#6a4a22';
function stone(ctx, v, top) {
  const g = ctx.createLinearGradient(0, v.py(top), 0, v.py(0));
  g.addColorStop(0, STONE_TOP);
  g.addColorStop(1, STONE_LOW);
  return g;
}

// ---------- London Eye ----------

function drawEye(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  const x0 = X(cx), y0 = Y(EYE.y), R = EYE.r * S;

  const halo = ctx.createRadialGradient(x0, y0, R * 0.6, x0, y0, R * 1.5);
  halo.addColorStop(0, 'rgba(120,200,255,0)');
  halo.addColorStop(0.45, 'rgba(120,200,255,0.10)');
  halo.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x0 - R * 1.5, y0 - R * 1.5, R * 3, R * 3);

  // The A-frame that holds the hub.
  ctx.strokeStyle = '#8fa8c6';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, 2.2 * S);
  ctx.beginPath();
  ctx.moveTo(x0, y0); ctx.lineTo(X(cx - 30), Y(0));
  ctx.moveTo(x0, y0); ctx.lineTo(X(cx + 30), Y(0));
  ctx.stroke();

  // Spokes, thin as cables.
  ctx.strokeStyle = 'rgba(200,225,255,0.24)';
  ctx.lineWidth = Math.max(0.4, 0.4 * S);
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(a) * R, y0 + Math.sin(a) * R);
  }
  ctx.stroke();

  // The rim: two rings with a zigzag between them.
  ctx.strokeStyle = ICE;
  ctx.lineWidth = Math.max(0.9, 1.5 * S);
  ctx.beginPath();
  ctx.arc(x0, y0, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(223,241,255,0.6)';
  ctx.lineWidth = Math.max(0.5, 0.7 * S);
  ctx.beginPath();
  ctx.arc(x0, y0, R - 5 * S, 0, Math.PI * 2);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, b = ((i + 1) / 64) * Math.PI * 2;
    const r1 = i % 2 ? R : R - 5 * S, r2 = i % 2 ? R - 5 * S : R;
    ctx.moveTo(x0 + Math.cos(a) * r1, y0 + Math.sin(a) * r1);
    ctx.lineTo(x0 + Math.cos(b) * r2, y0 + Math.sin(b) * r2);
  }
  ctx.stroke();

  // 32 capsules, each a small lit pod on the outside of the rim.
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2 + 0.1;
    const px = x0 + Math.cos(a) * (R + 4.2 * S), py = y0 + Math.sin(a) * (R + 4.2 * S);
    ctx.fillStyle = '#f2fbff';
    ctx.beginPath();
    ctx.ellipse(px, py, 3.1 * S, 2.1 * S, 0, 0, Math.PI * 2);
    ctx.fill();
    lamp(ctx, px, py, Math.max(0.5, 0.7 * S), '#8fd8ff', 0.5);
  }
  ctx.fillStyle = '#c6dcf2';
  ctx.beginPath();
  ctx.arc(x0, y0, 5 * S, 0, Math.PI * 2);
  ctx.fill();
}

// County Hall: the long pale building behind the wheel.
function drawCountyHall(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#2b3140';
  ctx.fillRect(X(cx - 150), Y(30), 270 * S, 30 * S + 1);
  ctx.fillStyle = '#1b202c';
  ctx.fillRect(X(cx - 150), Y(36), 270 * S, 6 * S);
  ctx.fillRect(X(cx - 28), Y(44), 30 * S, 10 * S);
  for (let x = cx - 146; x < cx + 116; x += 6.2) {
    ctx.globalAlpha = 0.35 + ((x * 7.3) % 5 + 5) % 5 * 0.1;
    ctx.fillStyle = WARM;
    ctx.fillRect(X(x), Y(25), Math.max(0.9, 1.6 * S), 13 * S);
  }
  ctx.globalAlpha = 1;
}

// ---------- Elizabeth Tower (Big Ben) ----------

function drawBigBen(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const x = BEN.x, w = BEN.w, mid = x + w / 2;

  const halo = ctx.createRadialGradient(X(mid), Y(100), 0, X(mid), Y(100), 70 * S);
  halo.addColorStop(0, 'rgba(255,200,110,0.20)');
  halo.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(mid - 70), Y(170), 140 * S, 140 * S);

  ctx.fillStyle = stone(ctx, v, 120);
  ctx.fillRect(X(x), Y(92), w * S, 92 * S + 1);                       // shaft
  ctx.fillRect(X(x - 1.6), Y(112), (w + 3.2) * S, 20.5 * S);            // clock stage
  ctx.fillRect(X(x - 0.6), Y(120), (w + 1.2) * S, 8.5 * S);             // belfry

  // Ribs and narrow windows on the shaft.
  ctx.fillStyle = 'rgba(70,44,14,0.42)';
  for (let i = 1; i < 5; i++) ctx.fillRect(X(x + (w * i) / 5 - 0.25), Y(91), Math.max(0.5, 0.5 * S), 91 * S);
  for (let y = 12; y < 88; y += 11) {
    for (let i = 0; i < 4; i++) ctx.fillRect(X(x + 1.6 + i * 3.1), Y(y + 6), Math.max(0.6, 1.1 * S), 6 * S);
  }
  ctx.fillStyle = 'rgba(60,38,12,0.7)';
  for (const y of [91.5, 112, 120]) ctx.fillRect(X(x - 2.2), Y(y + 0.8), (w + 4.4) * S, Math.max(0.7, 1 * S));
  for (let i = 0; i < 4; i++) ctx.fillRect(X(x + 1.4 + i * 3.2), Y(118.6), 1.6 * S, 5 * S); // belfry openings

  // The clock: a glowing face, both hands straight up. Midnight.
  const glow = ctx.createRadialGradient(X(mid), Y(101.6), 0, X(mid), Y(101.6), 13 * S);
  glow.addColorStop(0, 'rgba(255,244,210,0.55)');
  glow.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(X(mid - 13), Y(114.6), 26 * S, 26 * S);
  ctx.fillStyle = '#fff4d2';
  ctx.beginPath();
  ctx.arc(X(mid), Y(101.6), 6.6 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3c2a10';
  ctx.lineWidth = Math.max(0.6, 0.7 * S);
  ctx.beginPath();
  ctx.arc(X(mid), Y(101.6), 6.6 * S, 0, Math.PI * 2);
  ctx.moveTo(X(mid), Y(101.6)); ctx.lineTo(X(mid), Y(107));
  ctx.stroke();
  ctx.lineWidth = Math.max(0.8, 1 * S);
  ctx.beginPath();
  ctx.moveTo(X(mid), Y(101.6)); ctx.lineTo(X(mid), Y(105));
  ctx.stroke();

  // Roof, lantern and spire.
  ctx.fillStyle = '#4a3c22';
  ctx.beginPath();
  ctx.moveTo(X(x - 1.2), Y(120));
  ctx.lineTo(X(x + w + 1.2), Y(120));
  ctx.lineTo(X(x + w - 2.6), Y(132));
  ctx.lineTo(X(x + 2.6), Y(132));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_TOP;
  ctx.fillRect(X(x + 2.6), Y(137), (w - 5.2) * S, 5 * S);
  ctx.fillStyle = '#4a3c22';
  ctx.beginPath();
  ctx.moveTo(X(x + 2.2), Y(137));
  ctx.lineTo(X(x + w - 2.2), Y(137));
  ctx.lineTo(X(mid), Y(BEN.tip));
  ctx.closePath();
  ctx.fill();
  for (const dx of [0, w]) ctx.fillRect(X(x + dx - 0.6), Y(125), 1.2 * S, 5 * S);  // corner pinnacles
  lamp(ctx, X(mid), Y(BEN.tip), Math.max(0.6, 0.6 * S), '#ffe7b0', 0.95);
  lamp(ctx, X(mid), Y(134.5), Math.max(0.8, 1 * S), '#fff0c4', 0.9);
}

// ---------- Houses of Parliament ----------
// Drawn from x = 70 to 362 in the view it is given (see layout).
function drawPalace(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const L = 70, R = 362, H = 38;

  ctx.fillStyle = '#2c2a2c';                                 // slate roofs behind
  ctx.fillRect(X(L), Y(H + 7), (R - L) * S, 8 * S);
  ctx.fillStyle = stone(ctx, v, 60);
  ctx.fillRect(X(L), Y(H), (R - L) * S, H * S + 1);

  // Central Tower: a slim spire over the middle of the palace.
  ctx.beginPath();
  ctx.moveTo(X(205), Y(H));
  ctx.lineTo(X(207), Y(60));
  ctx.lineTo(X(213), Y(94));
  ctx.lineTo(X(219), Y(60));
  ctx.lineTo(X(221), Y(H));
  ctx.closePath();
  ctx.fill();

  // Victoria Tower: square and heavy, four pinnacles and a flag.
  ctx.fillRect(X(334), Y(96), 28 * S, 96 * S + 1);
  for (const dx of [0, 9, 19, 28]) ctx.fillRect(X(334 + dx - 1.2), Y(109), 2.4 * S, 14 * S);
  ctx.fillStyle = '#3c2a10';
  ctx.fillRect(X(347.6), Y(128), Math.max(0.6, 0.8 * S), 20 * S);
  ctx.fillStyle = '#d23a44';
  ctx.fillRect(X(348.4), Y(128), 8 * S, 5 * S);

  // Bays: a buttress with a pinnacle, and two tall lit windows, again and again.
  for (let x = L; x <= R - 2; x += 7.3) {
    ctx.fillStyle = STONE_TOP;
    ctx.beginPath();
    ctx.moveTo(X(x - 0.9), Y(H));
    ctx.lineTo(X(x), Y(H + 8));
    ctx.lineTo(X(x + 0.9), Y(H));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(70,44,14,0.5)';
    ctx.fillRect(X(x - 0.4), Y(H), Math.max(0.5, 0.8 * S), H * S);
    for (const [y, h] of [[18, 9], [33, 11]]) {
      ctx.fillStyle = ((x * 13 + y) % 7) < 4.4 ? 'rgba(255,236,190,0.9)' : 'rgba(60,40,14,0.75)';
      ctx.fillRect(X(x + 2.3), Y(y), 2.6 * S, h * S);
    }
  }
  ctx.fillStyle = 'rgba(60,38,12,0.6)';
  for (const y of [8, 21, H]) ctx.fillRect(X(L), Y(y + 0.7), (R - L) * S, Math.max(0.6, 0.9 * S));
  ctx.fillStyle = 'rgba(70,44,14,0.45)';
  for (let y = 12; y < 92; y += 12) for (const dx of [5, 12, 19]) ctx.fillRect(X(334 + dx), Y(y + 7), 2.2 * S, 7 * S);
}

// Westminster Abbey's two west towers, pale and far to the right.
function drawAbbey(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#3c3f4c';
  for (const x of [398, 420]) {
    ctx.fillRect(X(x), Y(62), 14 * S, 62 * S + 1);
    for (const dx of [0, 14]) ctx.fillRect(X(x + dx - 1), Y(70), 2 * S, 9 * S);
  }
  ctx.fillRect(X(410), Y(40), 80 * S, 40 * S + 1);
  ctx.fillStyle = 'rgba(255,217,160,0.5)';
  for (const x of [403, 425]) ctx.fillRect(X(x), Y(52), 4 * S, 16 * S);
  for (let x = 440; x < 488; x += 9) ctx.fillRect(X(x), Y(30), 3 * S, 14 * S);
}

// ---------- bridge, far city ----------

function drawBridge(ctx, v, L, R) {
  const X = v.px, Y = v.py, S = v.S;
  const DECK = 14;
  const n = Math.max(2, Math.round((R - L) / 46));
  const span = (R - L) / n;
  const g = ctx.createLinearGradient(0, Y(DECK), 0, Y(0));
  g.addColorStop(0, '#35584a');
  g.addColorStop(1, '#14241e');
  ctx.fillStyle = g;
  ctx.fillRect(X(L), Y(DECK), (R - L) * S, DECK * S + 1);
  ctx.fillStyle = '#070b0c';
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.ellipse(X(L + span * (i + 0.5)), Y(0), span * 0.42 * S, 10.5 * S, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(200,255,220,0.25)';
  ctx.fillRect(X(L), Y(DECK), (R - L) * S, Math.max(0.6, 0.7 * S));
  for (let i = 0; i <= n; i++) {
    const x = L + span * i;
    ctx.fillStyle = '#16261f';
    ctx.fillRect(X(x - 0.4), Y(DECK + 7), Math.max(0.7, 0.8 * S), 7 * S);
    for (const dx of [-1.9, 0, 1.9]) lamp(ctx, X(x + dx), Y(DECK + 7 + (dx ? 0 : 1.4)), Math.max(0.5, 0.48 * S), WARM, 0.95);
  }
  // A red double-decker bus crossing.
  const bx = L + (R - L) * 0.42;
  ctx.fillStyle = '#c8202a';
  ctx.fillRect(X(bx), Y(DECK + 6.4), 13 * S, 6.4 * S);
  ctx.fillStyle = '#ffe9b8';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(X(bx + 1 + i * 2.4), Y(DECK + 5.6), 1.7 * S, 1.6 * S);
    ctx.fillRect(X(bx + 1 + i * 2.4), Y(DECK + 3), 1.7 * S, 1.6 * S);
  }
}

// The City far away: hazy blocks, the Shard and the Gherkin.
function drawFar(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  towerRow(ctx, v, { seed: 6, from: -640, to: 660, minW: 20, maxW: 42, minH: 18, maxH: 50, gap: 2, colors: ['#131c2a', '#172131'] });
  ctx.fillStyle = '#1a2535';
  ctx.beginPath();                                          // the Shard
  ctx.moveTo(X(-452), Y(0));
  ctx.lineTo(X(-440), Y(150));
  ctx.lineTo(X(-438), Y(150));
  ctx.lineTo(X(-426), Y(0));
  ctx.closePath();
  ctx.fill();
  lamp(ctx, X(-439), Y(146), Math.max(0.6, 0.6 * S), '#cfe6ff', 0.8);
  ctx.fillStyle = '#1a2535';
  ctx.beginPath();                                          // the Gherkin
  ctx.moveTo(X(-404), Y(0));
  ctx.bezierCurveTo(X(-410), Y(50), X(-402), Y(80), X(-393), Y(82));
  ctx.bezierCurveTo(X(-384), Y(80), X(-376), Y(50), X(-382), Y(0));
  ctx.closePath();
  ctx.fill();
  const r = rng(19);
  for (let i = 0; i < 46; i++) {
    ctx.globalAlpha = 0.2 + r() * 0.4;
    ctx.fillStyle = '#cfe6ff';
    const y = 6 + r() * 120;
    ctx.fillRect(X(-439 + (r() - 0.5) * (150 - y) * 0.16), Y(y), Math.max(0.7, 0.7 * S), Math.max(0.7, 0.7 * S));
  }
  ctx.globalAlpha = 1;
}

function drawSkyline(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const at = layout(v);

  drawFar(ctx, at.far);
  drawCountyHall(ctx, v, at.eyeX);
  if (!v.portrait) drawAbbey(ctx, v);
  drawEye(ctx, v, at.eyeX);
  drawPalace(ctx, at.palace);
  drawBigBen(ctx, v);

  // The embankment wall with its globe lamps.
  const wall = ctx.createLinearGradient(0, Y(QUAY), 0, Y(0));
  wall.addColorStop(0, '#343944');
  wall.addColorStop(1, '#10131a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, Y(QUAY), v.w, QUAY * S + 1);
  for (let x = -640; x < 660; x += 15) lamp(ctx, X(x), Y(QUAY + 2.2), Math.max(0.5, 0.5 * S), WARM, 0.85);

  drawBridge(ctx, v, at.bridge[0], at.bridge[1]);
}

// A long soft streak of cloud.
function cloud(ctx, x, y, rx, ry, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // Sodium-lamp glow of a big city under low cloud.
  haze(ctx, v, w * 0.5, hz, U * 1.0, [[0, 'rgba(255,170,110,0.20)'], [0.5, 'rgba(150,120,140,0.10)'], [1, 'rgba(0,0,0,0)']]);

  // The moon behind thin cloud: a wide pale glow with a dim disc.
  const mx = w * (v.portrait ? 0.74 : 0.6), my = Math.max(hz * (v.portrait ? 0.24 : 0.2), 100);
  haze(ctx, v, mx, my, U * 0.2, [[0, 'rgba(215,228,255,0.30)'], [0.3, 'rgba(190,210,245,0.12)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillStyle = 'rgba(236,242,255,0.55)';
  ctx.beginPath();
  ctx.arc(mx, my, U * 0.017, 0, Math.PI * 2);
  ctx.fill();

  // Cloud banks: pale where the city lights them, dark where they do not.
  const banks = [
    [0.18, 0.2, 0.34, 0.05, 'rgba(120,140,170,0.16)'], [0.7, 0.14, 0.4, 0.045, 'rgba(120,140,170,0.14)'],
    [0.45, 0.36, 0.5, 0.05, 'rgba(8,12,22,0.42)'], [0.9, 0.42, 0.3, 0.04, 'rgba(140,150,175,0.12)'],
    [0.12, 0.52, 0.36, 0.045, 'rgba(8,12,22,0.36)'], [0.6, 0.62, 0.44, 0.04, 'rgba(170,150,150,0.12)'],
    [0.3, 0.76, 0.4, 0.035, 'rgba(190,150,130,0.10)'], [0.62, 0.24, 0.16, 0.03, 'rgba(8,12,22,0.4)'],
  ];
  for (const [fx, fy, rx, ry, color] of banks) cloud(ctx, w * fx, hz * fy, w * rx, hz * ry, color);
}

function drawWater(ctx, v) {
  boat(ctx, v, v.portrait ? -150 : -360, 0.3, 1.2, '#7dffb0');
  boat(ctx, v, v.portrait ? 120 : 210, 0.52, 1.5, '#ff6a5a');
}

// Anchor points for the signature act "The Wheel" (in pixels):
// `wheel` = 16 points around the rim, `hub` = a fan of directions from the hub.
function rig(v) {
  const { eyeX } = layout(v);
  const wheel = [];
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (i / 16) * Math.PI * 2;        // from the top, clockwise
    wheel.push({ x: v.px(eyeX + Math.cos(a) * (EYE.r + 5)), y: v.py(EYE.y - Math.sin(a) * (EYE.r + 5)) });
  }
  const hub = [];
  for (let i = 0; i < 12; i++) hub.push({ x: v.px(eyeX), y: v.py(EYE.y), angle: -1.9 + (i / 11) * 3.8 });
  return { wheel, hub, clock: [{ x: v.px(BEN.x + BEN.w / 2), y: v.py(101.6) }] };
}

export default {
  id: 'london',
  name: 'London',
  country: 'UK',
  tagline: 'London on the Thames, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 15 },
  // Portrait: 450 units across holds the wheel, the tower and the shortened palace.
  portraitSpan: 450,

  palette: {
    sky: [[0, '#03050b'], [0.4, '#0a1422'], [0.75, '#18283c'], [1, '#403a4c']],
    water: [[0, '#17212f'], [0.3, '#0a121c'], [1, '#020408']],
    star: '#dfe8ff',
  },
  stars: 70,

  drawSky,
  drawSkyline,
  drawWater,
  rig,

  show: {
    intervalSeconds: 120,
    movements: 3,
    finaleSeconds: 8,
    features: {},
    opening: 'strikes',
    signature: 'wheel',
    acts: ['chimes', 'chase', 'crossfire', 'garden', 'mirror', 'willows'],
    finaleTypes: ['chrys', 'crossette', 'peony', 'ring', 'crackle', 'peony', 'saturn', 'chrys'],
    actLabels: {
      opening: 'Overture',
      chimes: 'The Chimes',
      chase: 'River Run',
      crossfire: 'Crossfire',
      garden: 'Royal Garden',
      mirror: 'Pageant',
      willows: 'Golden Willows',
      wheel: 'The Wheel',
      finale: 'Grand Finale',
    },
    palettes: [
      { name: 'Union', colors: [[230, 40, 60], [255, 255, 255], [60, 100, 255]] },
      { name: 'Royal Purple', colors: [[170, 90, 255], [255, 205, 110], [225, 200, 255]] },
      { name: 'Thames Mist', colors: [[200, 225, 255], [140, 200, 230], [255, 255, 255]] },
      { name: 'Poppy', colors: [[255, 50, 40], [255, 130, 50], [255, 210, 120]] },
      { name: 'Emerald Park', colors: [[60, 220, 120], [255, 255, 255], [255, 210, 110]] },
      { name: 'Crown Jewels', colors: [[235, 40, 80], [60, 110, 255], [40, 210, 130], [255, 205, 100]] },
    ],
  },

  // A wide river between stone banks under low cloud: full booms, a clear
  // echo, and a far-off bell now and then.
  sound: {
    reverbSeconds: 2.6,
    echoSeconds: 0.3,
    echoLevel: 0.2,
    boomPitch: 0.97,
    ambient: { wash: 0.9, breeze: 0.9, bell: true },
  },
};
