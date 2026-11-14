// Scene: New York from the East River on a clear, cold night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// Left: Manhattan, with a glass tower downtown, the Empire State Building and
// an art-deco neighbour, and far off a hint of the Statue of Liberty.
// Right: the Brooklyn Bridge with its two stone towers and its web of cables.
// The waterfall of this show hangs from the bridge's main cables.
// Everything is drawn here in code, as a stylised picture.

import { towerRow, towerPlan, lamp, rng, shifted, haze, boat, glow, crossing, vessel, afloat } from './kit.js';

const WARM = '#ffd9a0';
const COOL = '#cfe3ff';
const QUAY = 6;
const DECK = 24;          // height of the bridge roadway
const TOWER = 84;         // height of the bridge towers

// Where things stand. Wide screens: the whole skyline, the bridge on the
// right. Portrait: the Empire State Building left of the middle, the bridge
// drawn shorter beside it, the far city smaller.
function layout(v) {
  if (!v.portrait) return { esb: -150, deco: -52, glass: -335, liberty: -464, bridge: { L: -34, t1: 112, t2: 384, R: 548 }, city: v, k: 1 };
  return { esb: -92, deco: -22, glass: -186, liberty: -212, bridge: { L: -24, t1: 58, t2: 206, R: 310 }, city: shifted(v, 57, 0.6), k: 0.8 };
}

// ---------- Empire State Building ----------
// A stack of setbacks: [from height, to height, half-width].
const ESB = [[0, 92, 22], [92, 150, 17], [150, 186, 12], [186, 206, 8], [206, 215, 5]];
const ESB_MAST = 240, ESB_TIP = 264;

function drawEmpire(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  const halo = ctx.createRadialGradient(X(cx), Y(205), 0, X(cx), Y(205), 110 * S);
  halo.addColorStop(0, 'rgba(255,236,200,0.20)');
  halo.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(cx - 110), Y(315), 220 * S, 220 * S);

  for (const [y0, y1, half] of ESB) {
    const g = ctx.createLinearGradient(X(cx - half), 0, X(cx + half), 0);
    g.addColorStop(0, '#1b2238');
    g.addColorStop(0.5, y0 >= 150 ? '#8a8fa6' : '#3d4560');
    g.addColorStop(1, '#141a2c');
    ctx.fillStyle = g;
    ctx.fillRect(X(cx - half), Y(y1), half * 2 * S, (y1 - y0) * S + 1);
  }
  // Tall window strips between the stone piers.
  for (const [y0, y1, half] of ESB.slice(0, 3)) {
    for (let x = -half + 2; x < half - 1.5; x += 3.4) {
      ctx.globalAlpha = 0.22 + (((x + cx) * 7.3) % 5 + 5) % 5 * 0.07;
      ctx.fillStyle = WARM;
      ctx.fillRect(X(cx + x), Y(y1 - 3), Math.max(0.7, 1 * S), (y1 - y0 - 6) * S);
    }
  }
  ctx.globalAlpha = 1;
  // Floodlit crown: the top setbacks glow pale gold.
  const lit = ctx.createLinearGradient(0, Y(215), 0, Y(150));
  lit.addColorStop(0, 'rgba(255,244,214,0.95)');
  lit.addColorStop(1, 'rgba(255,214,150,0.12)');
  ctx.fillStyle = lit;
  for (const [y0, y1, half] of ESB.slice(2)) ctx.fillRect(X(cx - half), Y(y1), half * 2 * S, (y1 - y0) * S);
  // Mast and antenna.
  ctx.fillStyle = '#d9dceb';
  ctx.beginPath();
  ctx.moveTo(X(cx - 3.2), Y(215));
  ctx.lineTo(X(cx - 1.4), Y(ESB_MAST));
  ctx.lineTo(X(cx + 1.4), Y(ESB_MAST));
  ctx.lineTo(X(cx + 3.2), Y(215));
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(X(cx) - Math.max(0.5, 0.45 * S), Y(ESB_TIP), Math.max(1, 0.9 * S), (ESB_TIP - ESB_MAST) * S);
  lamp(ctx, X(cx), Y(ESB_TIP), Math.max(0.8, 0.8 * S), '#ff5548', 1);
}

// Its art-deco neighbour: a slim shaft with a crown of stacked arches.
function drawDeco(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  const g = ctx.createLinearGradient(X(cx - 12), 0, X(cx + 12), 0);
  g.addColorStop(0, '#161c30');
  g.addColorStop(0.5, '#343c58');
  g.addColorStop(1, '#10152a');
  ctx.fillStyle = g;
  ctx.fillRect(X(cx - 12), Y(118), 24 * S, 118 * S + 1);
  ctx.fillRect(X(cx - 8), Y(140), 16 * S, 22 * S + 1);
  ctx.fillStyle = COOL;
  for (let x = -10; x < 10; x += 3.2) {
    ctx.globalAlpha = 0.16 + (((x + cx) * 3.7) % 4 + 4) % 4 * 0.06;
    ctx.fillRect(X(cx + x), Y(112), Math.max(0.6, 0.9 * S), 104 * S);
  }
  ctx.globalAlpha = 1;
  // The crown: five arches, each smaller, lit silver-white.
  for (let i = 0; i < 5; i++) {
    const r = 8 - i * 1.5, y = 140 + i * 7;
    ctx.fillStyle = i % 2 ? '#aeb8d6' : '#e6ecff';
    ctx.beginPath();
    ctx.ellipse(X(cx), Y(y), r * S, (r + 3) * S, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e6ecff';
  ctx.beginPath();
  ctx.moveTo(X(cx - 1.3), Y(176));
  ctx.lineTo(X(cx), Y(206));
  ctx.lineTo(X(cx + 1.3), Y(176));
  ctx.closePath();
  ctx.fill();
  lamp(ctx, X(cx), Y(206), Math.max(0.6, 0.55 * S), '#ffffff', 0.9);
}

// The downtown glass tower: a tall prism that narrows, with a mast.
function drawGlass(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  const H = 196;
  const g = ctx.createLinearGradient(X(cx - 20), 0, X(cx + 20), 0);
  g.addColorStop(0, '#16304a');
  g.addColorStop(0.42, '#6fa6cf');
  g.addColorStop(0.58, '#2c5676');
  g.addColorStop(1, '#0e2236');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(cx - 20), Y(0));
  ctx.lineTo(X(cx - 11), Y(H));
  ctx.lineTo(X(cx + 11), Y(H));
  ctx.lineTo(X(cx + 20), Y(0));
  ctx.closePath();
  ctx.fill();
  // The long facets of the prism, and floor lines.
  ctx.fillStyle = 'rgba(210,235,255,0.20)';
  ctx.beginPath();
  ctx.moveTo(X(cx), Y(0));
  ctx.lineTo(X(cx - 11), Y(H));
  ctx.lineTo(X(cx - 4), Y(H));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(6,14,26,0.22)';
  for (let y = 6; y < H; y += 6) ctx.fillRect(X(cx - 20), Y(y), 40 * S, Math.max(0.5, 0.5 * S));
  ctx.fillStyle = '#cfe3ff';
  ctx.fillRect(X(cx) - Math.max(0.5, 0.5 * S), Y(H + 34), Math.max(1, 1 * S), 34 * S);
  lamp(ctx, X(cx), Y(H + 34), Math.max(0.7, 0.6 * S), '#ff5548', 0.95);
  lamp(ctx, X(cx), Y(H + 2), Math.max(0.7, 0.7 * S), '#ffffff', 0.7);
}

// A hint of the Statue of Liberty, small and far away on her island.
function drawLiberty(ctx, v, bx) {
  const X = (x) => v.px(bx + x), Y = v.py, S = v.S;
  ctx.fillStyle = '#0b1220';
  ctx.beginPath();
  ctx.ellipse(X(0), Y(0), 30 * S, 4 * S, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  const stone = ctx.createLinearGradient(0, Y(22), 0, Y(0));
  stone.addColorStop(0, '#b9a37c');
  stone.addColorStop(1, '#4a3f30');
  ctx.fillStyle = stone;
  ctx.fillRect(X(-8), Y(8), 16 * S, 6 * S);
  ctx.fillRect(X(-4.5), Y(22), 9 * S, 14 * S);
  // The figure, in pale copper green lit from below.
  const green = ctx.createLinearGradient(0, Y(46), 0, Y(22));
  green.addColorStop(0, '#8fd6c0');
  green.addColorStop(1, '#3f8f7c');
  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.moveTo(X(-3.2), Y(22));
  ctx.lineTo(X(-1.8), Y(37));
  ctx.lineTo(X(1.8), Y(37));
  ctx.lineTo(X(3.2), Y(22));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(0), Y(38.6), 1.5 * S, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(X(-3.8), Y(33), 1.8 * S, 3.6 * S);                  // the tablet
  ctx.strokeStyle = '#8fd6c0';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, 1.2 * S);
  ctx.beginPath();
  ctx.moveTo(X(1.4), Y(36));
  ctx.lineTo(X(3.6), Y(45));                                      // the raised arm
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {                  // the crown's rays
    ctx.moveTo(X(0), Y(39.6));
    ctx.lineTo(X(Math.sin(a) * 3), Y(39.6 + Math.cos(a) * 3));
  }
  ctx.stroke();
  lamp(ctx, X(3.7), Y(46.4), Math.max(0.8, 0.9 * S), '#ffd27a', 1);
}

// ---------- Brooklyn Bridge ----------

// Height of the main cable above scene x.
function cableY(b, x) {
  if (x <= b.t1) { const u = (x - b.L) / (b.t1 - b.L); return DECK + 2 + (TOWER - 6 - DECK) * u * u; }
  if (x >= b.t2) { const u = (b.R - x) / (b.R - b.t2); return DECK + 2 + (TOWER - 6 - DECK) * u * u; }
  const mid = (b.t1 + b.t2) / 2, half = (b.t2 - b.t1) / 2;
  return DECK + 6 + (TOWER - 10 - DECK) * ((x - mid) / half) ** 2;
}

// Roadway, cables, suspenders and the fan of stays (behind the towers).
function drawSpan(ctx, v, b) {
  const X = v.px, Y = v.py, S = v.S;
  // Roadway: a dark truss with a line of lamps.
  const g = ctx.createLinearGradient(0, Y(DECK), 0, Y(DECK - 5));
  g.addColorStop(0, '#4a3d36');
  g.addColorStop(1, '#16110f');
  ctx.fillStyle = g;
  ctx.fillRect(X(b.L), Y(DECK), (b.R - b.L) * S, 5 * S);
  ctx.fillStyle = 'rgba(255,222,170,0.28)';
  ctx.fillRect(X(b.L), Y(DECK), (b.R - b.L) * S, Math.max(0.6, 0.7 * S));
  // The Manhattan approach: stone arches down to the shore.
  ctx.fillStyle = '#2a211d';
  ctx.fillRect(X(b.L - 26), Y(DECK - 1), 30 * S, (DECK - 1) * S + 1);
  ctx.fillStyle = '#0a0808';
  for (const dx of [-19, -7]) {
    ctx.beginPath();
    ctx.ellipse(X(b.L + dx), Y(0), 4.6 * S, 15 * S, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  // Cables.
  ctx.strokeStyle = 'rgba(214,200,180,0.85)';
  ctx.lineWidth = Math.max(0.8, 1.1 * S);
  ctx.beginPath();
  ctx.moveTo(X(b.L), Y(cableY(b, b.L)));
  for (let x = b.L + 4; x <= b.R; x += 4) ctx.lineTo(X(x), Y(cableY(b, x)));
  ctx.stroke();
  // Suspenders (straight down) and stays (slanting out from the tower tops).
  ctx.strokeStyle = 'rgba(214,200,180,0.34)';
  ctx.lineWidth = Math.max(0.4, 0.4 * S);
  ctx.beginPath();
  for (let x = b.L + 6; x < b.R; x += 6) { ctx.moveTo(X(x), Y(cableY(b, x))); ctx.lineTo(X(x), Y(DECK)); }
  for (const t of [b.t1, b.t2]) {
    for (let i = 1; i <= 7; i++) {
      for (const dir of [-1, 1]) {
        const reach = i * 0.105 * (dir < 0 ? t - (t === b.t1 ? b.L : b.t1) : (t === b.t2 ? b.R : b.t2) - t);
        ctx.moveTo(X(t), Y(TOWER - 8));
        ctx.lineTo(X(t + dir * reach), Y(DECK));
      }
    }
  }
  ctx.stroke();
  for (let x = b.L + 5; x < b.R; x += 9) lamp(ctx, X(x), Y(DECK + 1.2), Math.max(0.45, 0.42 * S), WARM, 0.85);
}

// One stone tower: two tall pointed arches, floodlit warm from below.
function drawPier(ctx, v, cx) {
  const X = v.px, Y = v.py, S = v.S;
  const W = 17;
  const g = ctx.createLinearGradient(0, Y(TOWER), 0, Y(0));
  g.addColorStop(0, '#8a7560');
  g.addColorStop(0.6, '#c49a6a');
  g.addColorStop(1, '#4a382a');
  ctx.fillStyle = g;
  ctx.fillRect(X(cx - W / 2), Y(TOWER - 3), W * S, (TOWER - 3) * S + 1);
  ctx.fillRect(X(cx - W / 2 - 1.4), Y(TOWER), (W + 2.8) * S, 4 * S);        // the cornice
  ctx.fillRect(X(cx - W / 2 - 1.8), Y(8), (W + 3.6) * S, 8 * S + 1);          // the footing
  ctx.fillStyle = '#0c0a0e';
  for (const dx of [-4.1, 4.1]) {                                            // the two arches
    ctx.beginPath();
    ctx.moveTo(X(cx + dx - 2.7), Y(DECK + 5));
    ctx.lineTo(X(cx + dx - 2.7), Y(60));
    ctx.quadraticCurveTo(X(cx + dx - 2.6), Y(69), X(cx + dx), Y(73));
    ctx.quadraticCurveTo(X(cx + dx + 2.6), Y(69), X(cx + dx + 2.7), Y(60));
    ctx.lineTo(X(cx + dx + 2.7), Y(DECK + 5));
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(40,28,18,0.4)';
  for (const y of [DECK - 5, 46, TOWER - 3]) ctx.fillRect(X(cx - W / 2), Y(y + 0.8), W * S, Math.max(0.6, 0.9 * S));
  lamp(ctx, X(cx), Y(TOWER + 3), Math.max(0.6, 0.6 * S), '#ff5548', 0.9);
  for (const dx of [-W / 2, W / 2]) lamp(ctx, X(cx + dx), Y(DECK + 2), Math.max(0.5, 0.5 * S), WARM, 0.9);
}

// ---------- the city ----------

const rise = (t) => 0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.1));
const CITY_FRONT = {
  seed: 61, from: -424, to: -36, minW: 13, maxW: 27, minH: 34, maxH: 124, gap: 4, shape: rise,
  colors: ['#0a0f1c', '#0d1322', '#101728'],
  windows: { lit: 0.36, colors: [WARM, '#ffe9c4', COOL] },
};
const CITY_TOWERS = towerPlan(CITY_FRONT);

function drawBackdrop(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const at = layout(v), c = at.city;
  // Far Manhattan, hazy; Brooklyn's low roofs on the right. The city starts
  // a little in from the left edge, so the statue stands clear against the sky.
  towerRow(ctx, c, { seed: 14, from: -436, to: 0, minW: 18, maxW: 36, minH: 50, maxH: 150, gap: 2, shape: rise, colors: ['#111a2e', '#152036'] });
  towerRow(ctx, c, { seed: 27, from: 20, to: 620, minW: 16, maxW: 34, minH: 14, maxH: 44, gap: 3, colors: ['#0f1626', '#131b2c'], windows: { lit: 0.18, colors: [WARM] } });
  drawLiberty(ctx, shifted(v, at.liberty, at.k), 0);
  drawGlass(ctx, shifted(v, at.glass, at.k), 0);
  towerRow(ctx, c, CITY_FRONT);
  drawDeco(ctx, shifted(v, at.deco, at.k), 0);
  drawEmpire(ctx, v, at.esb);

  // The river wall along Manhattan.
  const wall = ctx.createLinearGradient(0, Y(QUAY), 0, Y(0));
  wall.addColorStop(0, '#262c3a');
  wall.addColorStop(1, '#0c0f18');
  ctx.fillStyle = wall;
  ctx.fillRect(0, Y(QUAY), v.w, QUAY * S + 1);
  for (let x = -640; x < 660; x += 13) lamp(ctx, X(x), Y(QUAY + 1.6), Math.max(0.45, 0.45 * S), WARM, 0.8);

  drawSpan(ctx, v, at.bridge);
}

// Foreground: the two stone towers of the bridge. Traffic on the roadway
// passes behind them (see the "cabs" life event).
function drawForeground(ctx, v) {
  const b = layout(v).bridge;
  drawPier(ctx, v, b.t1);
  drawPier(ctx, v, b.t2);
}

function drawSkyline(ctx, v) {
  drawBackdrop(ctx, v);
  drawForeground(ctx, v);
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // The glow of the city on the cold air, strongest over Manhattan.
  haze(ctx, v, v.px(layout(v).esb), hz, U * 0.95, [[0, 'rgba(255,176,110,0.26)'], [0.5, 'rgba(120,130,190,0.10)'], [1, 'rgba(0,0,0,0)']]);

  // A half moon, high on the right.
  const mx = w * (v.portrait ? 0.8 : 0.78), my = Math.max(hz * (v.portrait ? 0.26 : 0.18), 96), mr = U * 0.019;
  ctx.save();
  ctx.shadowColor = 'rgba(220,232,255,0.8)';
  ctx.shadowBlur = mr * 1.8;
  ctx.fillStyle = '#eef3ff';
  ctx.beginPath();
  ctx.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2);
  ctx.ellipse(mx, my, mr * 0.22, mr, 0, Math.PI / 2, -Math.PI / 2, true);
  ctx.fill();
  ctx.restore();

  // Two thin clouds, lit from below by the streets.
  for (const [fx, fy, rx, ry, a] of [[0.3, 0.46, 0.24, 0.016, 0.1], [0.72, 0.62, 0.2, 0.012, 0.08]]) {
    ctx.save();
    ctx.translate(w * fx, hz * fy);
    ctx.scale(1, (hz * ry * 3) / (w * rx));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * rx);
    g.addColorStop(0, `rgba(255,200,160,${a * 1.5})`);
    g.addColorStop(1, 'rgba(255,200,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w * rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWater(ctx, v) {
  boat(ctx, v, v.portrait ? -150 : -390, 0.3, 1.2, '#7dffb0');
  boat(ctx, v, v.portrait ? 150 : 250, 0.55, 1.5, '#ff6a5a');
}

// Anchor points for the special effects (in pixels).
// `waterfall`: along the main cables of the bridge, tower to tower and down
// the side spans, as far as the screen shows them.
// `crown`: a fan of directions from the top of the Empire State Building.
function rig(v) {
  const at = layout(v), b = at.bridge;
  const waterfall = [];
  for (let x = b.L + 2; x <= b.R - 2; x += 6) {
    const px = v.px(x);
    if (px < 3 || px > v.w - 3) continue;
    waterfall.push({ x: px, y: v.py(cableY(b, x) - 1) });
  }
  const crown = [];
  for (let i = 0; i < 7; i++) crown.push({ x: v.px(at.esb), y: v.py(ESB_TIP), angle: (i - 3) * 0.3 });
  return { waterfall, waterfallDensity: 1.25, crown };
}

// ---------- life between shows ----------
// Small things that happen while the countdown runs (see js/life.js).
// "behind" events are covered by the bridge towers; "front" ones are not.

const CROWN_COLOURS = [[255, 70, 70], [255, 255, 255], [80, 140, 255], [255, 205, 110]];

const life = [
  {
    // The orange harbour ferry, crossing the whole river.
    id: 'ferry', group: 'water', layer: 'front', weight: 2, duration: [24, 32], sound: 'horn',
    setup: (r) => ({ depth: 0.12 + r() * 0.16 }),
    draw(ctx, v, e) {
      const s = v.S * (1.5 + e.p.depth * 2.4);
      vessel(ctx, crossing(v, e, 44 * s), afloat(v, e.p.depth, e, 0.5), s, {
        dir: e.dir, length: 42, decks: 2, hull: '#b9531a', stripe: '#14233c', cabin: '#d77a2c', windows: '#fff0c8', funnel: '#14233c', lights: '#fff2d0',
      });
    },
  },
  {
    // A tugboat pushing a short way upstream.
    id: 'tug', group: 'water', layer: 'front', duration: [18, 26], sound: 'water',
    setup: (r) => ({ depth: 0.38 + r() * 0.2, from: 0.12 + r() * 0.45 }),
    draw(ctx, v, e) {
      const s = v.S * (1.3 + e.p.depth * 2);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      vessel(ctx, v.w * (start + e.dir * 0.26 * e.u), afloat(v, e.p.depth, e, 1), s, {
        dir: e.dir, length: 16, decks: 1, hull: '#0a0d14', stripe: '#c2362e', cabin: '#1c2230', windows: '#ffd9a0', funnel: '#c2362e', mast: true,
      });
    },
  },
  {
    // A helicopter's lights crossing low over the city (no blinking with
    // reduce motion). It passes behind the bridge towers.
    id: 'helicopter', layer: 'behind', duration: [16, 22],
    setup: (r) => ({ y: 0.34 + r() * 0.16, bob: 0.4 + r() * 0.6, phase: r() * 3 }),
    draw(ctx, v, e) {
      const x = crossing(v, e, 20);
      const y = v.hz * e.p.y + Math.sin(e.t * 0.9) * 4 * e.p.bob * v.S;
      const size = Math.max(0.7, 0.62 * v.S);
      ctx.fillStyle = 'rgba(8,10,18,0.9)';
      ctx.fillRect(x - 3.2 * size, y - 1.1 * size, 6.4 * size, 2.2 * size);
      ctx.fillRect(x - e.dir * 8 * size, y - 0.4 * size, e.dir * 5 * size, 0.8 * size);
      glow(ctx, x + e.dir * 2.6 * size, y + 0.6 * size, size, '#fff4dc', 0.8);
      glow(ctx, x - e.dir * 7.6 * size, y - 0.4 * size, size * 0.8, '#57e389', 0.7);
      if (e.calm || (e.t + e.p.phase) % 1.1 < 0.12) glow(ctx, x, y - 1.6 * size, size * 1.4, '#ff4a3c', e.calm ? 0.6 : 1);
    },
  },
  {
    // Yellow cabs on the bridge: headlights one way, tail lights the other.
    // Behind: they disappear behind each stone tower and come out again.
    id: 'cabs', group: 'road', layer: 'behind', duration: [16, 22],
    draw(ctx, v, e) {
      const b = layout(v).bridge;
      const S = v.S, len = 4.2;
      for (let i = 0; i < 4; i++) {
        const dir = i % 2 ? -1 : 1;
        const u = (e.u * 0.8 + i * 0.27) % 1;
        const x = dir > 0 ? b.L + u * (b.R - b.L - len) : b.R - len - u * (b.R - b.L - len);
        ctx.fillStyle = '#f2c230';
        ctx.fillRect(v.px(x), v.py(DECK + 2.1), len * S, 1.7 * S);
        ctx.fillRect(v.px(x + 0.9), v.py(DECK + 3.1), (len - 1.8) * S, 1.1 * S);
        glow(ctx, v.px(dir > 0 ? x + len : x), v.py(DECK + 1.3), Math.max(0.5, 0.42 * S), '#fff6dc', 0.9);
        glow(ctx, v.px(dir > 0 ? x : x + len), v.py(DECK + 1.3), Math.max(0.45, 0.36 * S), '#ff4a3c', 0.8);
      }
    },
  },
  {
    // Steam rising from three rooftops in the cold (it stands still with
    // reduce motion).
    id: 'steam', layer: 'behind', duration: [14, 20],
    setup: (r) => Array.from({ length: 3 }, () => {
      const t = CITY_TOWERS[Math.floor(r() * CITY_TOWERS.length)];
      return { x: t.x + t.w * (0.3 + r() * 0.4), y: t.h, lean: (r() - 0.3) * 10, phase: r() };
    }),
    draw(ctx, v, e) {
      const c = layout(v).city;
      ctx.fillStyle = '#d7dcea';
      for (const vent of e.p) {
        for (let j = 0; j < 6; j++) {
          const a = e.calm ? j / 6 : (e.t * 0.22 + vent.phase + j / 6) % 1;
          ctx.globalAlpha = e.alpha * 0.15 * (1 - a) * Math.min(1, a * 6);
          ctx.beginPath();
          ctx.arc(c.px(vent.x + vent.lean * a * a), c.py(vent.y + 2 + a * 30), (1.6 + 6.5 * a) * c.S, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = e.alpha;
    },
  },
  {
    // The lights on top of the Empire State Building change colour, slowly.
    id: 'crownlights', group: 'lights', layer: 'behind', duration: [12, 18], sound: 'chime',
    setup: (r) => ({ first: Math.floor(r() * CROWN_COLOURS.length) }),
    draw(ctx, v, e) {
      const cx = layout(v).esb;
      const turn = e.calm ? 0 : e.u * 2.999;
      const a = CROWN_COLOURS[(e.p.first + Math.floor(turn)) % CROWN_COLOURS.length];
      const b = CROWN_COLOURS[(e.p.first + Math.floor(turn) + 1) % CROWN_COLOURS.length];
      const m = Math.min(1, (turn % 1) * 2.5);
      const mix = a.map((part, i) => Math.round(part + (b[i] - part) * m));
      ctx.fillStyle = `rgb(${mix[0]},${mix[1]},${mix[2]})`;
      ctx.globalAlpha = e.alpha * 0.62;
      for (const [y0, y1, half] of ESB.slice(2)) ctx.fillRect(v.px(cx - half), v.py(y1), half * 2 * v.S, (y1 - y0) * v.S);
      ctx.globalAlpha = e.alpha;
      glow(ctx, v.px(cx), v.py(ESB_MAST), Math.max(1.4, 1.8 * v.S), ctx.fillStyle, 0.7);
    },
  },
  {
    // A channel buoy: a green light on the water and, now and then, its bell.
    id: 'buoy', group: 'marker', layer: 'front', duration: [10, 14], sound: 'bell',
    setup: (r) => ({ x: 0.18 + r() * 0.64, depth: 0.42 + r() * 0.3 }),
    draw(ctx, v, e) {
      const s = v.S * (1 + e.p.depth * 1.6);
      const x = v.w * e.p.x, y = afloat(v, e.p.depth, e, 1.4);
      ctx.fillStyle = '#060a10';
      ctx.beginPath();
      ctx.moveTo(x - 2.2 * s, y);
      ctx.lineTo(x - 0.9 * s, y - 6 * s);
      ctx.lineTo(x + 0.9 * s, y - 6 * s);
      ctx.lineTo(x + 2.2 * s, y);
      ctx.closePath();
      ctx.fill();
      const on = e.calm ? 0.7 : 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(e.t * 2.4)), 3);
      glow(ctx, x, y - 7 * s, Math.max(0.8, 0.8 * s), '#57e389', on);
    },
  },
];

export default {
  id: 'newyork',
  name: 'New York',
  country: 'USA',
  tagline: 'New York on the East River, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 0 },
  // Portrait: 460 units across: the Empire State Building, the downtown
  // tower, and the bridge from its Manhattan end to its second tower.
  portraitSpan: 460,

  palette: {
    sky: [[0, '#02040b'], [0.4, '#06112a'], [0.75, '#122446'], [1, '#4a3040']],
    water: [[0, '#101c34'], [0.3, '#081120'], [1, '#02040a']],
    star: '#dfe8ff',
  },
  stars: 100,

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
    features: { waterfall: true, crown: true },
    opening: 'salvo',
    acts: ['marquee', 'chase', 'crossfire', 'fans', 'garden', 'sparkle'],
    finaleTypes: ['peony', 'salute', 'crackle', 'peony', 'strobe', 'ring', 'crossette', 'peony'],
    actLabels: {
      opening: 'Curtain Up',
      marquee: 'Broadway',
      chase: 'Avenue Run',
      crossfire: 'Crosstown',
      fans: 'Fanfare',
      garden: 'Central Park',
      sparkle: 'Times Square',
      waterfall: 'Bridge of Light',
      finale: 'Big Apple Finale',
    },
    palettes: [
      { name: 'Stars & Stripes', colors: [[255, 60, 70], [255, 255, 255], [70, 120, 255]] },
      { name: 'Broadway Gold', colors: [[255, 205, 110], [255, 150, 60], [255, 244, 214]] },
      { name: 'Empire Blue', colors: [[80, 150, 255], [150, 220, 255], [255, 255, 255]] },
      { name: 'Liberty Green', colors: [[110, 230, 190], [255, 210, 120], [220, 255, 240]] },
      { name: 'Taxi Yellow', colors: [[255, 214, 50], [255, 255, 255], [255, 140, 40]] },
      { name: 'Midnight Neon', colors: [[255, 70, 200], [60, 230, 255], [190, 130, 255]] },
    ],
  },

  // Stone and glass canyons on one side, open river on the other: heavy
  // booms with a long tail and a late, clear echo off the towers.
  sound: {
    reverbSeconds: 3.2,
    echoSeconds: 0.48,
    echoLevel: 0.24,
    boomPitch: 0.9,
    ambient: { wash: 0.8, breeze: 1.2, bell: false },
  },
};
