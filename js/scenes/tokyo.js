// Scene: Tokyo across the bay on a still summer night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// Left: Tokyo Tower in orange and white. Right: the slim, pale Skytree.
// In front of both, the Rainbow Bridge crosses the bay; a pagoda stands
// between them and Mount Fuji is a faint shape on the horizon.
// The show is in the Japanese manner: great round shells, one at a time,
// and everything in mirrored pairs. Its signature, the "Star Mine", is
// fired from a row of points along the bridge.
// Everything is drawn here in code, as a stylised picture.

import { towerRow, lamp, shifted, haze, boat, glow, crossing, vessel, afloat } from './kit.js';

const WARM = '#ffd9a0';
const QUAY = 6;
const DECK = 22;          // height of the bridge roadway
const PYLON = 66;         // height of the bridge towers
const TT = 215;           // height of Tokyo Tower
const TREE = 300;         // height of the Skytree (before it is scaled)

// Where things stand. Wide screens: tower left, Skytree right, the bridge
// across the middle. Portrait: both towers move in and the bridge is shorter.
function layout(v) {
  if (!v.portrait) return { tower: -250, tree: 345, treeK: 1, pagoda: 46, fuji: -420, bridge: { L: -390, t1: -72, t2: 168, R: 450 }, city: v };
  return { tower: -108, tree: 138, treeK: 0.86, pagoda: 20, fuji: -150, bridge: { L: -270, t1: -58, t2: 92, R: 300 }, city: shifted(v, 0, 0.62) };
}

// ---------- Tokyo Tower ----------

const outer = (y) => 1.1 + 27 * Math.exp(-y / 50);                            // half-width of the tower
const gap = (y) => (y < 40 ? 17 * (1 - Math.pow(y / 40, 1.6)) : 0);          // the open arch between the legs

function towerShape(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py;
  ctx.beginPath();
  ctx.moveTo(X(-outer(0)), Y(0));
  for (let y = 0; y <= TT; y += 3) ctx.lineTo(X(-outer(y)), Y(y));
  ctx.lineTo(X(outer(TT)), Y(TT));
  for (let y = TT; y >= 0; y -= 3) ctx.lineTo(X(outer(y)), Y(y));
  ctx.closePath();
  ctx.moveTo(X(-gap(0)), Y(0));
  for (let y = 0; y <= 40; y += 2) ctx.lineTo(X(-gap(y)), Y(y));
  for (let y = 40; y >= 0; y -= 2) ctx.lineTo(X(gap(y)), Y(y));
  ctx.closePath();
}

function drawTokyoTower(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const halo = ctx.createRadialGradient(X(0), Y(100), 0, X(0), Y(100), 150 * S);
  halo.addColorStop(0, 'rgba(255,140,70,0.24)');
  halo.addColorStop(1, 'rgba(255,140,70,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(-150), Y(250), 300 * S, 250 * S);

  const paint = ctx.createLinearGradient(0, Y(TT), 0, Y(0));
  paint.addColorStop(0, '#ffe6c4');
  paint.addColorStop(0.35, '#ff8f45');
  paint.addColorStop(1, '#c2431a');
  ctx.fillStyle = paint;
  towerShape(ctx, v, cx);
  ctx.fill('evenodd');

  ctx.save();
  towerShape(ctx, v, cx);
  ctx.clip('evenodd');
  // White bands, as the real tower is painted.
  ctx.fillStyle = 'rgba(255,250,240,0.85)';
  for (const [y0, y1] of [[42, 56], [112, 126], [166, 178], [200, 208]]) ctx.fillRect(X(-30), Y(y1), 60 * S, (y1 - y0) * S);
  // Lattice: crossing diagonals and level lines.
  ctx.strokeStyle = 'rgba(90,26,8,0.45)';
  ctx.lineWidth = Math.max(0.5, 0.5 * S);
  ctx.beginPath();
  for (let k = -260; k <= 260; k += 6) {
    ctx.moveTo(X(k), Y(0)); ctx.lineTo(X(k + 220), Y(220));
    ctx.moveTo(X(k), Y(0)); ctx.lineTo(X(k - 220), Y(220));
  }
  for (let y = 8; y < TT; y += 10) { ctx.moveTo(X(-30), Y(y)); ctx.lineTo(X(30), Y(y)); }
  ctx.stroke();
  ctx.restore();

  // The two observation decks, and the antenna.
  for (const [y, t, half] of [[94, 11, 11], [150, 6, 5]]) {
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(X(-half), Y(y + t), half * 2 * S, t * S);
    ctx.fillStyle = 'rgba(120,40,12,0.6)';
    ctx.fillRect(X(-half), Y(y + t * 0.5), half * 2 * S, Math.max(0.6, 0.9 * S));
  }
  ctx.fillStyle = '#ffe2c0';
  ctx.fillRect(X(0) - Math.max(0.5, 0.6 * S), Y(TT + 20), Math.max(1, 1.2 * S), 20 * S);
  lamp(ctx, X(0), Y(TT + 20), Math.max(0.8, 0.8 * S), '#ff5548', 1);
  for (let y = 6; y < TT; y += 9) {
    lamp(ctx, X(-outer(y)), Y(y), Math.max(0.4, 0.4 * S), '#fff0cc', 0.75);
    lamp(ctx, X(outer(y)), Y(y), Math.max(0.4, 0.4 * S), '#fff0cc', 0.75);
  }
}

// ---------- Skytree ----------
// Drawn around x = 0 in the view it is given (see layout: it is far away,
// so on a phone it is drawn a little smaller).

const treeHalf = (y) => 7 - 4 * Math.min(1, y / 215);

function drawSkytree(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const halo = ctx.createRadialGradient(X(0), Y(210), 0, X(0), Y(210), 120 * S);
  halo.addColorStop(0, 'rgba(150,170,255,0.20)');
  halo.addColorStop(1, 'rgba(150,170,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(-120), Y(330), 240 * S, 240 * S);

  const body = ctx.createLinearGradient(X(-8), 0, X(8), 0);
  body.addColorStop(0, '#263a66');
  body.addColorStop(0.5, '#b4cdff');
  body.addColorStop(1, '#1f3058');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(X(-treeHalf(0)), Y(0));
  ctx.lineTo(X(-treeHalf(215)), Y(215));
  ctx.lineTo(X(treeHalf(215)), Y(215));
  ctx.lineTo(X(treeHalf(0)), Y(0));
  ctx.closePath();
  ctx.fill();
  // The woven steel: fine crossing lines.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(16,24,56,0.4)';
  ctx.lineWidth = Math.max(0.4, 0.4 * S);
  ctx.beginPath();
  for (let y = -10; y < 220; y += 7) {
    ctx.moveTo(X(-8), Y(y)); ctx.lineTo(X(8), Y(y + 22));
    ctx.moveTo(X(8), Y(y)); ctx.lineTo(X(-8), Y(y + 22));
  }
  ctx.stroke();
  ctx.restore();

  // Lower deck (it flares out), neck, upper deck, then the antenna.
  ctx.fillStyle = '#e4f0ff';
  ctx.beginPath();
  ctx.moveTo(X(-5.5), Y(213));
  ctx.lineTo(X(-10.5), Y(230));
  ctx.lineTo(X(10.5), Y(230));
  ctx.lineTo(X(5.5), Y(213));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7f98d6';
  ctx.fillRect(X(-4.6), Y(238), 9.2 * S, 8 * S);
  ctx.fillStyle = '#e4f0ff';
  ctx.fillRect(X(-7), Y(247), 14 * S, 9 * S);
  ctx.fillStyle = '#c8d8ff';
  ctx.beginPath();
  ctx.moveTo(X(-2.2), Y(247));
  ctx.lineTo(X(-0.7), Y(TREE));
  ctx.lineTo(X(0.7), Y(TREE));
  ctx.lineTo(X(2.2), Y(247));
  ctx.closePath();
  ctx.fill();
  // Violet lights round the decks, a white beacon on top.
  for (let i = -3; i <= 3; i++) {
    lamp(ctx, X(i * 3.2), Y(229), Math.max(0.45, 0.45 * S), '#b89cff', 0.9);
    lamp(ctx, X(i * 2.1), Y(246), Math.max(0.4, 0.4 * S), '#b89cff', 0.9);
  }
  lamp(ctx, X(0), Y(TREE), Math.max(0.7, 0.7 * S), '#ffffff', 1);
}

// ---------- pagoda, Fuji ----------

function drawPagoda(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  for (let i = 0; i < 5; i++) {
    const y = 28 + i * 10, half = 13 - i * 1.7;
    ctx.fillStyle = '#1b0e1c';
    ctx.fillRect(X(-half * 0.55), Y(y), half * 1.1 * S, 10 * S + 1);       // the storey
    ctx.fillStyle = i % 2 ? 'rgba(255,200,120,0.75)' : 'rgba(255,170,90,0.6)';
    ctx.fillRect(X(-half * 0.3), Y(y - 3), half * 0.6 * S, 2.6 * S);        // its lit window
    ctx.fillStyle = '#120812';
    ctx.beginPath();                                                       // its roof, tips turned up
    ctx.moveTo(X(-half - 2.4), Y(y + 2));
    ctx.quadraticCurveTo(X(-half * 0.6), Y(y - 0.4), X(-half * 0.45), Y(y + 3.8));
    ctx.lineTo(X(half * 0.45), Y(y + 3.8));
    ctx.quadraticCurveTo(X(half * 0.6), Y(y - 0.4), X(half + 2.4), Y(y + 2));
    ctx.quadraticCurveTo(X(0), Y(y - 1.6), X(-half - 2.4), Y(y + 2));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,74,58,0.8)';
    ctx.lineWidth = Math.max(0.5, 0.55 * S);
    ctx.beginPath();
    ctx.moveTo(X(-half - 2.4), Y(y + 2));
    ctx.quadraticCurveTo(X(0), Y(y - 1.6), X(half + 2.4), Y(y + 2));
    ctx.stroke();
  }
  ctx.fillStyle = '#d8b25a';
  ctx.fillRect(X(0) - Math.max(0.4, 0.45 * S), Y(92), Math.max(0.8, 0.9 * S), 13 * S);
}

function drawFuji(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py;
  ctx.fillStyle = 'rgba(70,58,128,0.5)';
  ctx.beginPath();
  ctx.moveTo(X(-170), Y(QUAY));
  ctx.quadraticCurveTo(X(-60), Y(34), X(-11), Y(100));
  ctx.lineTo(X(11), Y(100));
  ctx.quadraticCurveTo(X(60), Y(34), X(170), Y(QUAY));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(236,230,255,0.42)';                               // the snow cap
  ctx.beginPath();
  ctx.moveTo(X(-11), Y(100));
  ctx.lineTo(X(11), Y(100));
  ctx.lineTo(X(24), Y(78));
  ctx.lineTo(X(13), Y(84));
  ctx.lineTo(X(4), Y(76));
  ctx.lineTo(X(-6), Y(85));
  ctx.lineTo(X(-14), Y(77));
  ctx.lineTo(X(-24), Y(78));
  ctx.closePath();
  ctx.fill();
}

// ---------- Rainbow Bridge ----------

function cableY(b, x) {
  if (x <= b.t1) { const u = Math.max(0, (x - b.L) / (b.t1 - b.L)); return DECK + 2 + (PYLON - 4 - DECK) * u * u; }
  if (x >= b.t2) { const u = Math.max(0, (b.R - x) / (b.R - b.t2)); return DECK + 2 + (PYLON - 4 - DECK) * u * u; }
  const mid = (b.t1 + b.t2) / 2, half = (b.t2 - b.t1) / 2;
  return DECK + 5 + (PYLON - 7 - DECK) * ((x - mid) / half) ** 2;
}

// Roadway (two decks), cables and suspenders, behind the bridge towers.
function drawSpan(ctx, v, b) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#d9e2ee';
  ctx.fillRect(X(b.L), Y(DECK), (b.R - b.L) * S, 1.3 * S);
  ctx.fillStyle = '#39445c';
  ctx.fillRect(X(b.L), Y(DECK - 1.3), (b.R - b.L) * S, 2.4 * S);
  ctx.fillStyle = '#aab6c8';
  ctx.fillRect(X(b.L), Y(DECK - 3.7), (b.R - b.L) * S, 0.9 * S);
  // Piers under the side spans.
  ctx.fillStyle = '#2a3348';
  for (let x = b.L + 30; x < b.R - 10; x += 62) {
    if (Math.abs(x - b.t1) < 22 || Math.abs(x - b.t2) < 22 || (x > b.t1 && x < b.t2)) continue;
    ctx.fillRect(X(x - 1.6), Y(DECK - 4), 3.2 * S, (DECK - 4) * S + 1);
  }
  ctx.strokeStyle = 'rgba(236,244,255,0.9)';
  ctx.lineWidth = Math.max(0.8, 1 * S);
  ctx.beginPath();
  ctx.moveTo(X(b.L), Y(cableY(b, b.L)));
  for (let x = b.L + 4; x <= b.R; x += 4) ctx.lineTo(X(x), Y(cableY(b, x)));
  ctx.stroke();
  ctx.strokeStyle = 'rgba(236,244,255,0.3)';
  ctx.lineWidth = Math.max(0.4, 0.4 * S);
  ctx.beginPath();
  for (let x = b.L + 5; x < b.R; x += 5) { ctx.moveTo(X(x), Y(cableY(b, x))); ctx.lineTo(X(x), Y(DECK)); }
  ctx.stroke();
  // Lights along the cable in three colours: the "rainbow".
  const lights = ['#ffffff', '#8dffc0', '#ff9ad0'];
  let i = 0;
  for (let x = b.L + 8; x < b.R; x += 8) lamp(ctx, X(x), Y(cableY(b, x)), Math.max(0.45, 0.45 * S), lights[i++ % 3], 0.9);
}

// One bridge tower: two white legs joined by three beams.
function drawPylon(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const g = ctx.createLinearGradient(0, Y(PYLON), 0, Y(0));
  g.addColorStop(0, '#f4f8ff');
  g.addColorStop(1, '#8f9cb8');
  ctx.fillStyle = g;
  for (const dx of [-4.6, 2.4]) ctx.fillRect(X(dx), Y(PYLON), 2.2 * S, PYLON * S + 1);
  for (const y of [PYLON - 1, 46, 30]) ctx.fillRect(X(-4.6), Y(y), 9.2 * S, 2.4 * S);
  ctx.fillStyle = '#5b6680';
  ctx.fillRect(X(-7), Y(6), 14 * S, 6 * S + 1);
  lamp(ctx, X(-3.5), Y(PYLON + 2), Math.max(0.5, 0.5 * S), '#ff5548', 0.9);
  lamp(ctx, X(3.5), Y(PYLON + 2), Math.max(0.5, 0.5 * S), '#ff5548', 0.9);
}

// ---------- skyline ----------

const NEON = [WARM, '#8fe8ff', '#ff9ad0', '#ffe9c4'];

// Backdrop: Fuji, the city, the pagoda, both towers and the bridge's roadway.
function drawBackdrop(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const at = layout(v), c = at.city;
  drawFuji(ctx, v, at.fuji);
  towerRow(ctx, c, { seed: 8, from: -700, to: 700, minW: 20, maxW: 40, minH: 36, maxH: 84, gap: 2, colors: ['#151238', '#1a1642'] });
  towerRow(ctx, c, { seed: 33, from: -700, to: 700, minW: 13, maxW: 26, minH: 24, maxH: 74, gap: 4, colors: ['#0c0a22', '#100d2a', '#130f30'], windows: { lit: 0.36, colors: NEON } });
  drawSkytree(ctx, shifted(v, at.tree, at.treeK));
  drawPagoda(ctx, v, at.pagoda);
  drawTokyoTower(ctx, v, at.tower);

  const wall = ctx.createLinearGradient(0, Y(QUAY), 0, Y(0));
  wall.addColorStop(0, '#2a2648');
  wall.addColorStop(1, '#0e0c20');
  ctx.fillStyle = wall;
  ctx.fillRect(0, Y(QUAY), v.w, QUAY * S + 1);
  for (let x = -700; x < 700; x += 14) lamp(ctx, X(x), Y(QUAY + 1.8), Math.max(0.45, 0.45 * S), WARM, 0.8);

  drawSpan(ctx, v, at.bridge);
}

// Foreground: the two towers of the bridge. The train on the roadway passes
// behind them (see the "train" life event).
function drawForeground(ctx, v) {
  const b = layout(v).bridge;
  drawPylon(ctx, v, b.t1);
  drawPylon(ctx, v, b.t2);
}

function drawSkyline(ctx, v) {
  drawBackdrop(ctx, v);
  drawForeground(ctx, v);
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // Neon on warm, damp air: a wide rose glow along the whole horizon.
  haze(ctx, v, w * 0.5, hz, U * 1.05, [[0, 'rgba(255,110,170,0.26)'], [0.5, 'rgba(150,90,200,0.12)'], [1, 'rgba(0,0,0,0)']]);

  // A large pale-gold moon, low, with one thin cloud drawn across it.
  const mx = w * (v.portrait ? 0.78 : 0.62), my = hz * (v.portrait ? 0.3 : 0.3), mr = U * 0.034;
  ctx.save();
  ctx.shadowColor = 'rgba(255,225,170,0.7)';
  ctx.shadowBlur = mr * 1.6;
  ctx.fillStyle = '#ffe9c0';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(40,24,80,0.55)';
  ctx.beginPath();
  ctx.ellipse(mx - mr * 0.2, my + mr * 0.28, mr * 2.6, mr * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,24,80,0.4)';
  ctx.beginPath();
  ctx.ellipse(mx + mr * 0.9, my - mr * 0.3, mr * 1.6, mr * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(ctx, v) {
  boat(ctx, v, v.portrait ? -130 : -340, 0.34, 1.2, '#ff9ad0');
  boat(ctx, v, v.portrait ? 140 : 300, 0.56, 1.5, '#8dffc0');
}

// Anchor points for the signature act "Star Mine" (in pixels):
// `bridge` = ten points along the roadway, fanning slightly outward;
// `towers` = the tops of the two bridge towers.
// `tips` = the tops of Tokyo Tower and the Skytree (used by the tests).
function rig(v) {
  const at = layout(v), b = at.bridge;
  const mid = v.px((b.t1 + b.t2) / 2);
  const reach = Math.min(mid - 14, v.w - 14 - mid, (v.px(b.R) - v.px(b.L)) / 2 - 16 * v.S);
  const bridge = [];
  for (let i = 0; i < 10; i++) {
    const t = i / 9 - 0.5;                                  // -0.5 .. 0.5 across the bridge
    bridge.push({ x: mid + t * 2 * reach, y: v.py(DECK + 2), angle: t * 0.5 });
  }
  const towers = [b.t1, b.t2].map((x) => ({ x: v.px(x), y: v.py(PYLON + 2) }));
  const tree = shifted(v, at.tree, at.treeK);
  const tips = [{ x: v.px(at.tower), y: v.py(TT + 20) }, { x: tree.px(0), y: tree.py(TREE) }];
  return { bridge, towers, tips };
}

// ---------- life between shows ----------
// Small things that happen while the countdown runs (see js/life.js).
// "behind" events are covered by the bridge towers; "front" ones are not.

const life = [
  {
    // A yakatabune: a low wooden houseboat with a row of red paper lanterns.
    id: 'houseboat', group: 'water', layer: 'front', weight: 2, duration: [22, 30], sound: 'water',
    setup: (r) => ({ depth: 0.3 + r() * 0.22, from: 0.1 + r() * 0.45 }),
    draw(ctx, v, e) {
      const s = v.S * (1.4 + e.p.depth * 2.1);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      const x = v.w * (start + e.dir * 0.3 * e.u), y = afloat(v, e.p.depth, e, 0.8);
      vessel(ctx, x, y, s, { dir: e.dir, length: 30, decks: 1, hull: '#1c100c', stripe: '#6a3a22', cabin: '#2c1912', windows: '#ffcf8a', lights: '#ffd9a0', glow: '#ff9a70' });
      for (let i = 0; i < 7; i++) glow(ctx, x + (i - 3) * 3.2 * s, y - 5.6 * s + Math.sin(e.t * 1.6 + i) * 0.25 * s, Math.max(0.6, 0.55 * s), '#ff5a3c', 0.85);
    },
  },
  {
    // The water bus: a low glass boat crossing the whole bay.
    id: 'waterbus', group: 'water', layer: 'front', duration: [22, 30], sound: 'horn',
    setup: (r) => ({ depth: 0.1 + r() * 0.12 }),
    draw(ctx, v, e) {
      const s = v.S * (1.5 + e.p.depth * 2.4);
      vessel(ctx, crossing(v, e, 40 * s), afloat(v, e.p.depth, e, 0.4), s, {
        dir: e.dir, length: 36, decks: 1, hull: '#dfe8f2', stripe: '#57c8ff', cabin: '#8fd0ff', windows: '#f2ffff', lights: '#ffffff', glow: '#bfe8ff',
      });
    },
  },
  {
    // A train of lit windows crossing the bridge. Behind: it slips behind
    // each bridge tower and out again.
    id: 'train', group: 'road', layer: 'behind', duration: [14, 20],
    draw(ctx, v, e) {
      const b = layout(v).bridge, S = v.S;
      const cars = 6, car = 9, total = cars * (car + 0.8);
      const u = e.dir > 0 ? e.u : 1 - e.u;
      const head = b.L - total + u * (b.R - b.L + total);
      for (let i = 0; i < cars; i++) {
        const x = head + i * (car + 0.8);
        if (x < b.L || x + car > b.R) continue;
        ctx.fillStyle = '#c9d4e4';
        ctx.fillRect(v.px(x), v.py(DECK + 3.2), car * S, 3 * S);
        ctx.fillStyle = '#fff3c8';
        ctx.fillRect(v.px(x + 0.7), v.py(DECK + 2.6), (car - 1.4) * S, 1.2 * S);
      }
    },
  },
  {
    // A plane coming in to land: steady white, red wing light, and a strobe
    // (no blinking with reduce motion). It passes behind both towers.
    id: 'plane', layer: 'behind', duration: [18, 24],
    setup: (r) => ({ y: 0.1 + r() * 0.16, sink: 0.04 + r() * 0.06, phase: r() * 3 }),
    draw(ctx, v, e) {
      const x = crossing(v, e, 20);
      const y = v.hz * (e.p.y + e.p.sink * e.u);
      const size = Math.max(0.7, 0.6 * v.S);
      glow(ctx, x, y, size, '#fff4dc', 0.75);
      glow(ctx, x - e.dir * 3.2 * size, y + size * 0.4, size * 0.85, '#ff4a3c', 0.8);
      if (!e.calm && (e.t + e.p.phase) % 1.4 < 0.09) glow(ctx, x - e.dir * 1.6 * size, y, size * 1.9, '#ffffff', 1);
    },
  },
  {
    // Festival lanterns along the shore light up one after another.
    id: 'lanterns', group: 'lights', layer: 'front', duration: [14, 20], sound: 'furin',
    draw(ctx, v, e) {
      const n = Math.max(8, Math.round(v.w / (26 * Math.max(1, v.S))));
      const size = Math.max(1.1, 1.3 * v.S);
      for (let i = 0; i < n; i++) {
        const k = e.calm ? 1 : Math.min(1, Math.max(0, (e.u * 2.4 - i / n) * 5));
        if (k <= 0) continue;
        const x = ((i + 0.5) / n) * v.w;
        const y = v.py(QUAY + 3.4) + Math.sin(i * 1.7) * 0.6 * v.S + (e.calm ? 0 : Math.sin(e.t * 1.4 + i) * 0.35 * v.S);
        glow(ctx, x, y, size, i % 3 === 1 ? '#ffd27a' : '#ff5a3c', 0.9 * k);
      }
    },
  },
  {
    // A ring of light climbing the Skytree (a soft steady glow with reduce
    // motion).
    id: 'skyring', group: 'lights', layer: 'behind', duration: [10, 14], sound: 'chime',
    draw(ctx, v, e) {
      const at = layout(v), t = shifted(v, at.tree, at.treeK);
      const head = -20 + e.u * 260;
      ctx.fillStyle = '#e8dcff';
      for (let y = 4; y < 214; y += 6) {
        const k = e.calm ? 0.28 : Math.max(0, 1 - Math.abs(y - head) / 30);
        if (k <= 0) continue;
        const half = treeHalf(y);
        ctx.globalAlpha = e.alpha * k * k * 0.7;
        ctx.fillRect(t.px(-half), t.py(y + 6), half * 2 * t.S, 6 * t.S + 0.5);
      }
      ctx.globalAlpha = e.alpha;
    },
  },
];

export default {
  id: 'tokyo',
  name: 'Tokyo',
  country: 'Japan',
  timeZone: 'Asia/Tokyo',   // for New Year's Eve mode: when midnight really is here
  tagline: 'Tokyo Bay, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 0 },
  // Portrait: 420 units across: Tokyo Tower, the Skytree and the main span
  // of the bridge between them.
  portraitSpan: 420,

  palette: {
    sky: [[0, '#04030f'], [0.4, '#0e0a30'], [0.75, '#2c1656'], [1, '#70305e']],
    water: [[0, '#1c1444'], [0.3, '#0d0a28'], [1, '#03030a']],
    star: '#efe6ff',
  },
  stars: 120,

  drawSky,
  drawSkyline,
  drawBackdrop,
  drawForeground,
  drawWater,
  rig,
  life,

  show: {
    intervalSeconds: 120,
    movements: 3,
    finaleSeconds: 8,
    features: {},
    opening: 'single',
    signature: 'starmine',
    acts: ['kiku', 'pairs', 'willows', 'garden', 'mirror', 'sparkle'],
    finaleTypes: ['chrys', 'chrys', 'peony', 'kamuro', 'ring', 'willow', 'chrys', 'saturn'],
    actLabels: {
      opening: 'Ichiban',
      kiku: 'Kiku',
      pairs: 'Tsui',
      willows: 'Yanagi',
      garden: 'Senrin',
      mirror: 'Kagami',
      sparkle: 'Hotaru',
      starmine: 'Star Mine',
      finale: 'Grand Hanabi',
    },
    palettes: [
      { name: 'Sakura', colors: [[255, 150, 190], [255, 235, 240], [255, 105, 160]] },
      { name: 'Matcha', colors: [[150, 225, 110], [240, 250, 200], [70, 200, 140]] },
      { name: 'Ai Indigo', colors: [[90, 120, 255], [150, 215, 255], [240, 244, 255]] },
      { name: 'Momiji', colors: [[255, 80, 50], [255, 160, 50], [255, 220, 120]] },
      { name: 'Neon Shibuya', colors: [[255, 70, 210], [60, 235, 255], [255, 240, 90]] },
      { name: 'Kinpaku', colors: [[255, 205, 100], [255, 236, 180], [255, 255, 255]] },
    ],
  },

  // A wide, open bay: clean, round booms with a soft tail and a gentle echo.
  sound: {
    reverbSeconds: 2.8,
    echoSeconds: 0.3,
    echoLevel: 0.18,
    boomPitch: 1.05,
    ambient: { wash: 0.8, breeze: 0.7, bell: false },
  },
};
