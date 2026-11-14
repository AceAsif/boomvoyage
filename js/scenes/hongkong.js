// Scene: Hong Kong across Victoria Harbour on a warm, hazy night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// A wall of tall glass towers stands at the water's edge, with the dark
// ridge of the Peak behind them. Four towers lead: one with a wall of
// coloured lights, a braced prism with two masts, the tallest with a crown
// of fins, and a slim one edged in green. The signature of this show is a
// set of light beams that sweep the sky from the rooftops (our own design).
// Everything is drawn here in code, as a stylised picture.

import { towerRow, lamp, rng, shifted, haze, boat, glow, crossing, vessel, afloat } from './kit.js';

const WARM = '#ffd9a0';
const QUAY = 6;

// The four leading towers: half-width of the lit face, its top, and the
// height of the roof (where a sky beam starts).
const TOWERS = {
  wall: { half: 21, face: 146, roof: 166 },
  prism: { half: 16, face: 150, roof: 236 },
  crown: { half: 12, face: 222, roof: 262 },
  edge: { half: 12, face: 180, roof: 226 },
};

// Where things stand. Wide screens: the four towers spread across the
// middle. Portrait: they stand closer together and the far city is smaller.
function layout(v) {
  if (!v.portrait) return { wall: -300, prism: -125, crown: 62, edge: 236, hall: 330, hallK: 1, city: v, tram: [-232, 34, -196, 120] };
  return { wall: -168, prism: -74, crown: 44, edge: 150, hall: 150, hallK: 0.55, city: shifted(v, 0, 0.62), tram: [-128, 34, -108, 112] };
}

// ---------- the Peak ----------

const ridge = (x) => 58 + 74 * Math.exp(-(((x + 30) / 190) ** 2)) + 16 * Math.sin(x * 0.019) + 9 * Math.sin(x * 0.047 + 1);

function drawPeak(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const g = ctx.createLinearGradient(0, Y(150), 0, Y(0));
  g.addColorStop(0, '#0a1c20');
  g.addColorStop(1, '#0c2a2e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(-760), Y(0));
  for (let x = -760; x <= 760; x += 12) ctx.lineTo(X(x), Y(ridge(x)));
  ctx.lineTo(X(760), Y(0));
  ctx.closePath();
  ctx.fill();
  // Houses on the slopes: small warm lights, thicker lower down.
  const r = rng(52);
  for (let i = 0; i < 170; i++) {
    const x = -740 + r() * 1480, y = 10 + Math.pow(r(), 1.6) * (ridge(x) - 16);
    ctx.globalAlpha = 0.25 + r() * 0.45;
    ctx.fillStyle = r() < 0.8 ? WARM : '#bfe9ff';
    ctx.fillRect(X(x), Y(y), Math.max(0.7, 0.7 * S), Math.max(0.7, 0.7 * S));
  }
  ctx.globalAlpha = 1;
  // The lookout on the ridge: a bowl-shaped roof on two legs.
  const lx = 150, ly = ridge(150);
  ctx.fillStyle = '#16343a';
  ctx.fillRect(X(lx - 5), Y(ly + 7), 2 * S, 8 * S);
  ctx.fillRect(X(lx + 3), Y(ly + 7), 2 * S, 8 * S);
  ctx.beginPath();
  ctx.moveTo(X(lx - 10), Y(ly + 11));
  ctx.quadraticCurveTo(X(lx), Y(ly + 4), X(lx + 10), Y(ly + 11));
  ctx.closePath();
  ctx.fill();
  for (let i = -3; i <= 3; i++) lamp(ctx, X(lx + i * 2.6), Y(ly + 9.4 - Math.abs(i) * 0.3), Math.max(0.4, 0.4 * S), '#ffe9b0', 0.8);
}

// ---------- the four leading towers ----------
// Each is drawn around x = cx.

// A broad tower whose whole face is a wall of coloured lights.
function drawWall(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const T = TOWERS.wall;
  ctx.fillStyle = '#0c1a22';
  ctx.fillRect(X(-T.half - 2), Y(T.face + 4), (T.half * 2 + 4) * S, (T.face + 4) * S + 1);
  ctx.fillRect(X(-14), Y(T.roof - 6), 28 * S, 18 * S);
  const r = rng(71);
  const cols = ['#27d9c0', '#ff4fb0', '#ffb347', '#5aa8ff', '#f2f6ff'];
  for (let y = 6; y < T.face - 2; y += 5.4) {
    for (let x = -T.half + 1; x < T.half - 1; x += 4.4) {
      ctx.globalAlpha = 0.16 + r() * 0.58;
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.fillRect(X(x), Y(y + 4), 3.4 * S, 4 * S);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff4fb0';
  ctx.fillRect(X(-13), Y(T.roof - 2), 26 * S, Math.max(1, 1.6 * S));
  lamp(ctx, X(0), Y(T.roof), Math.max(0.8, 0.9 * S), '#ff4fb0', 0.9);
}

// A glass prism with a slanted top, white cross-bracing and two masts.
function drawPrism(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const T = TOWERS.prism, top = 204;
  const g = ctx.createLinearGradient(X(-T.half), 0, X(T.half), 0);
  g.addColorStop(0, '#5a8fa8');
  g.addColorStop(0.5, '#1e4a60');
  g.addColorStop(1, '#0d2836');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(-T.half), Y(0));
  ctx.lineTo(X(-T.half), Y(top));
  ctx.lineTo(X(-4), Y(top));
  ctx.lineTo(X(T.half), Y(T.face));
  ctx.lineTo(X(T.half), Y(0));
  ctx.closePath();
  ctx.fill();
  // The bracing: lit white lines, crossing in each storey block.
  ctx.strokeStyle = 'rgba(240,250,255,0.85)';
  ctx.lineWidth = Math.max(0.6, 0.75 * S);
  ctx.beginPath();
  for (let y = 0; y < T.face - 10; y += 50) {
    ctx.moveTo(X(-T.half), Y(y)); ctx.lineTo(X(T.half), Y(y + 50));
    ctx.moveTo(X(T.half), Y(y)); ctx.lineTo(X(-T.half), Y(y + 50));
    ctx.moveTo(X(-T.half), Y(y + 50)); ctx.lineTo(X(T.half), Y(y + 50));
  }
  ctx.moveTo(X(-T.half), Y(0)); ctx.lineTo(X(-T.half), Y(top)); ctx.lineTo(X(-4), Y(top)); ctx.lineTo(X(T.half), Y(T.face)); ctx.lineTo(X(T.half), Y(0));
  ctx.moveTo(X(-T.half), Y(T.face)); ctx.lineTo(X(-4), Y(top));
  ctx.stroke();
  ctx.fillStyle = '#e8f6ff';
  for (const dx of [-13, -8]) ctx.fillRect(X(dx) - Math.max(0.4, 0.4 * S), Y(T.roof), Math.max(0.8, 0.8 * S), (T.roof - top) * S);
  lamp(ctx, X(-13), Y(T.roof), Math.max(0.6, 0.6 * S), '#ff5548', 0.95);
  lamp(ctx, X(-8), Y(T.roof), Math.max(0.6, 0.6 * S), '#ff5548', 0.95);
}

// The tallest: a slim shaft that narrows, with a crown of pointed fins.
function drawCrown(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const T = TOWERS.crown;
  const halo = ctx.createRadialGradient(X(0), Y(230), 0, X(0), Y(230), 90 * S);
  halo.addColorStop(0, 'rgba(190,240,255,0.20)');
  halo.addColorStop(1, 'rgba(190,240,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(-90), Y(320), 180 * S, 180 * S);
  const g = ctx.createLinearGradient(X(-16), 0, X(16), 0);
  g.addColorStop(0, '#123040');
  g.addColorStop(0.45, '#7fb6c8');
  g.addColorStop(0.6, '#2c6074');
  g.addColorStop(1, '#0c2230');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(-16), Y(0));
  ctx.lineTo(X(-T.half), Y(T.face));
  ctx.lineTo(X(T.half), Y(T.face));
  ctx.lineTo(X(16), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(232,248,255,0.5)';
  for (const dx of [-7, -2.2, 2.2, 7]) ctx.fillRect(X(dx) - Math.max(0.3, 0.35 * S), Y(T.face), Math.max(0.6, 0.7 * S), T.face * S);
  ctx.fillStyle = 'rgba(6,16,24,0.25)';
  for (let y = 8; y < T.face; y += 8) ctx.fillRect(X(-16), Y(y), 32 * S, Math.max(0.5, 0.5 * S));
  // The crown: six fins, tallest in the middle, lit white.
  ctx.fillStyle = '#eefaff';
  for (let i = 0; i < 6; i++) {
    const x = -T.half + 1 + i * ((T.half * 2 - 2) / 5), tall = 16 + 24 * Math.sin((Math.PI * (i + 0.5)) / 6);
    ctx.beginPath();
    ctx.moveTo(X(x - 1.6), Y(T.face));
    ctx.lineTo(X(x), Y(T.face + tall));
    ctx.lineTo(X(x + 1.6), Y(T.face));
    ctx.closePath();
    ctx.fill();
  }
  lamp(ctx, X(0), Y(T.roof), Math.max(0.7, 0.7 * S), '#ffffff', 0.9);
}

// A slim tower with a pointed top, its edges traced in green light.
function drawEdge(ctx, v, cx) {
  const X = (x) => v.px(cx + x), Y = v.py, S = v.S;
  const T = TOWERS.edge;
  ctx.fillStyle = '#0d2430';
  ctx.beginPath();
  ctx.moveTo(X(-T.half), Y(0));
  ctx.lineTo(X(-T.half), Y(T.face));
  ctx.lineTo(X(0), Y(206));
  ctx.lineTo(X(T.half), Y(T.face));
  ctx.lineTo(X(T.half), Y(0));
  ctx.closePath();
  ctx.fill();
  const r = rng(88);
  for (let y = 6; y < T.face - 4; y += 4.6) {
    for (let x = -T.half + 2; x < T.half - 2; x += 3.6) {
      if (r() > 0.4) continue;
      ctx.globalAlpha = 0.3 + r() * 0.5;
      ctx.fillStyle = r() < 0.7 ? WARM : '#bfe9ff';
      ctx.fillRect(X(x), Y(y + 2), Math.max(0.8, 1.3 * S), Math.max(0.8, 1.6 * S));
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#58f0a8';
  ctx.lineWidth = Math.max(0.7, 0.9 * S);
  ctx.beginPath();
  ctx.moveTo(X(-T.half), Y(0)); ctx.lineTo(X(-T.half), Y(T.face)); ctx.lineTo(X(0), Y(206)); ctx.lineTo(X(T.half), Y(T.face)); ctx.lineTo(X(T.half), Y(0));
  ctx.stroke();
  ctx.fillStyle = '#58f0a8';
  ctx.fillRect(X(0) - Math.max(0.4, 0.4 * S), Y(T.roof), Math.max(0.8, 0.8 * S), (T.roof - 206) * S);
  lamp(ctx, X(0), Y(T.roof), Math.max(0.6, 0.6 * S), '#ff5548', 0.95);
}

// The exhibition hall on the water: a low building under two curved roofs.
function drawHall(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#132a34';
  ctx.fillRect(X(0), Y(11), 118 * S, 11 * S + 1);
  ctx.fillStyle = 'rgba(255,225,170,0.65)';
  for (let x = 4; x < 114; x += 5) ctx.fillRect(X(x), Y(8), 3 * S, 3.4 * S);
  for (const [x0, x1, peak] of [[-6, 76, 27], [44, 126, 22]]) {
    const g = ctx.createLinearGradient(0, Y(peak), 0, Y(10));
    g.addColorStop(0, '#e6f4f6');
    g.addColorStop(1, '#6f9aa4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(X(x0), Y(11));
    ctx.quadraticCurveTo(X((x0 + x1) / 2), Y(peak * 2 - 11), X(x1), Y(11));
    ctx.quadraticCurveTo(X((x0 + x1) / 2), Y(peak + 2), X(x0), Y(11));
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- skyline ----------

const NEON = [WARM, '#8ff0e0', '#ff8fd0', '#ffe9c4'];

// Backdrop: the Peak and the far rows of towers.
function drawBackdrop(ctx, v) {
  const c = layout(v).city;
  drawPeak(ctx, c);
  towerRow(ctx, c, { seed: 44, from: -720, to: 720, minW: 16, maxW: 30, minH: 60, maxH: 128, gap: 3, colors: ['#0c2028', '#0f2630'], windows: { lit: 0.2, colors: [WARM, '#8ff0e0'] } });
}

// Foreground: the front row, the four leading towers, the hall and the
// harbour wall. Lights on the Peak pass behind them.
function drawForeground(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const at = layout(v);
  towerRow(ctx, at.city, { seed: 19, from: -720, to: 720, minW: 13, maxW: 26, minH: 34, maxH: 104, gap: 4, colors: ['#07141a', '#0a1a22', '#0c1f28'], windows: { lit: 0.38, colors: NEON } });
  drawWall(ctx, v, at.wall);
  drawEdge(ctx, v, at.edge);
  drawPrism(ctx, v, at.prism);
  drawCrown(ctx, v, at.crown);
  drawHall(ctx, shifted(v, at.hall, at.hallK));

  const wall = ctx.createLinearGradient(0, Y(QUAY), 0, Y(0));
  wall.addColorStop(0, '#1c3038');
  wall.addColorStop(1, '#081216');
  ctx.fillStyle = wall;
  ctx.fillRect(0, Y(QUAY), v.w, QUAY * S + 1);
  const dots = ['#ffd9a0', '#ff8fd0', '#8ff0e0'];
  let i = 0;
  for (let x = -720; x < 720; x += 11) lamp(ctx, X(x), Y(QUAY + 1.6), Math.max(0.45, 0.45 * S), dots[i++ % 3], 0.85);
}

function drawSkyline(ctx, v) {
  drawBackdrop(ctx, v);
  drawForeground(ctx, v);
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // Neon on wet air: a wide glow, magenta low down, green-blue above it.
  haze(ctx, v, w * 0.5, hz, U * 1.0, [[0, 'rgba(255,90,170,0.24)'], [0.4, 'rgba(60,190,190,0.12)'], [1, 'rgba(0,0,0,0)']]);

  // A dim moon behind the haze.
  const mx = w * (v.portrait ? 0.22 : 0.2), my = Math.max(hz * (v.portrait ? 0.24 : 0.2), 104);
  haze(ctx, v, mx, my, U * 0.16, [[0, 'rgba(200,240,235,0.22)'], [0.35, 'rgba(160,220,215,0.08)'], [1, 'rgba(0,0,0,0)']]);
  ctx.fillStyle = 'rgba(226,246,242,0.5)';
  ctx.beginPath();
  ctx.arc(mx, my, U * 0.014, 0, Math.PI * 2);
  ctx.fill();

  // Low cloud over the ridge, lit pink from below.
  for (const [fx, fy, rx, ry, color] of [[0.3, 0.66, 0.32, 0.03, 'rgba(255,130,180,0.10)'], [0.74, 0.58, 0.28, 0.026, 'rgba(255,130,180,0.08)'], [0.5, 0.4, 0.4, 0.03, 'rgba(4,14,18,0.4)']]) {
    ctx.save();
    ctx.translate(w * fx, hz * fy);
    ctx.scale(1, (hz * ry) / (w * rx));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * rx);
    g.addColorStop(0, color);
    g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w * rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWater(ctx, v) {
  boat(ctx, v, v.portrait ? -140 : -380, 0.3, 1.2, '#8ff0e0');
  boat(ctx, v, v.portrait ? 130 : 300, 0.54, 1.5, '#ff8fd0');
}

// Anchor points for the signature act "Sky Beams" (in pixels):
// `roofs` = six rooftops, left to right, each with the direction its beam
// points when at rest (outer beams lean outward).
// `tips` = the top of the tallest tower (used by the tests).
function rig(v) {
  const at = layout(v), c = at.city;
  const top = (name) => ({ x: v.px(at[name]), y: v.py(TOWERS[name].roof) });
  const low = (side) => ({ x: v.w * (side < 0 ? 0.06 : 0.94), y: c.py(92) });
  const roofs = [
    { ...low(-1), angle: -0.52 },
    { ...top('wall'), angle: -0.3 },
    { x: v.px(at.prism - 10), y: v.py(TOWERS.prism.roof), angle: -0.1 },
    { ...top('crown'), angle: 0.1 },
    { ...top('edge'), angle: 0.3 },
    { ...low(1), angle: 0.52 },
  ];
  return { roofs, tips: [top('crown')] };
}

// ---------- life between shows ----------
// Small things that happen while the countdown runs (see js/life.js).
// "behind" events are covered by the towers; "front" ones are not.

// A junk: a wooden hull with a high stern and three ribbed red sails.
function drawJunk(ctx, x, y, s, dir) {
  const base = ctx.globalAlpha;
  ctx.fillStyle = '#ff7a5a';
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = base * 0.2 * (1 - i / 4);
    ctx.fillRect(x - (9 - i * 1.6) * s, y + (1.8 + i * 1.8) * s, (18 - i * 3.2) * s, Math.max(0.6, 0.5 * s));
  }
  ctx.globalAlpha = base;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = '#1c0f0a';
  ctx.beginPath();
  ctx.moveTo(14.5, -3);
  ctx.quadraticCurveTo(2, 2.6, -12, -0.6);
  ctx.lineTo(-15.5, -7.4);
  ctx.lineTo(-11, -4.4);
  ctx.lineTo(11, -3.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-0.3, -24, 0.6, 20);
  ctx.fillRect(8.4, -17, 0.5, 13);
  ctx.fillRect(-9.6, -19, 0.5, 15);
  // [mast x, half-width at the foot, half-width at the head, foot, head]
  for (const [mx, w0, w1, y0, y1] of [[0, 6.4, 5, -5.4, -23], [8.6, 3.6, 2.8, -5, -16], [-9.4, 3.2, 2.4, -8, -18]]) {
    const g = ctx.createLinearGradient(0, y1, 0, y0);
    g.addColorStop(0, '#e2463a');
    g.addColorStop(1, '#8f1e1a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(mx - w0, y0);
    ctx.lineTo(mx + w0 * 0.8, y0);
    ctx.lineTo(mx + w1, y1 + 1.6);
    ctx.lineTo(mx - w1 * 0.7, y1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(40,8,6,0.55)';
    for (let k = 1; k < 5; k++) ctx.fillRect(mx - w0, y0 + ((y1 - y0) * k) / 5, w0 * 1.9, 0.35);
  }
  ctx.restore();
  glow(ctx, x - dir * 13.5 * s, y - 8.4 * s, Math.max(0.7, 0.6 * s), '#ffd27a', 0.95);
}

const NEON_TURNS = [[255, 79, 176], [39, 217, 192], [255, 179, 71], [120, 160, 255]];

const life = [
  {
    // The green-and-white harbour ferry, crossing from shore to shore.
    id: 'starferry', group: 'water', layer: 'front', weight: 2, duration: [24, 32], sound: 'horn',
    setup: (r) => ({ depth: 0.1 + r() * 0.14 }),
    draw(ctx, v, e) {
      const s = v.S * (1.5 + e.p.depth * 2.4);
      vessel(ctx, crossing(v, e, 36 * s), afloat(v, e.p.depth, e, 0.5), s, {
        dir: e.dir, length: 34, decks: 2, hull: '#0f4a34', stripe: '#f2efe2', cabin: '#ece8d8', windows: '#ffe9b0', funnel: '#f2efe2', lights: '#fff2d0',
      });
    },
  },
  {
    // A junk under red sails, drifting slowly across the harbour.
    id: 'junk', group: 'water', layer: 'front', duration: [22, 30], sound: 'gong',
    setup: (r) => ({ depth: 0.32 + r() * 0.2, from: 0.1 + r() * 0.42 }),
    draw(ctx, v, e) {
      const s = v.S * (1.4 + e.p.depth * 2.2);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      drawJunk(ctx, v.w * (start + e.dir * 0.3 * e.u), afloat(v, e.p.depth, e, 1), s, e.dir);
    },
  },
  {
    // A sampan with one lamp, pottering near the shore.
    id: 'sampan', group: 'water', layer: 'front', duration: [16, 24], sound: 'water',
    setup: (r) => ({ depth: 0.5 + r() * 0.2, from: 0.15 + r() * 0.4 }),
    draw(ctx, v, e) {
      const s = v.S * (1.2 + e.p.depth * 2);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      vessel(ctx, v.w * (start + e.dir * 0.22 * e.u), afloat(v, e.p.depth, e, 1.2), s, { dir: e.dir, length: 11, decks: 0, mast: true, hull: '#06100f', lights: '#ffd9a0' });
    },
  },
  {
    // Windows in the leading towers switching on, staying a while, going dark.
    id: 'windows', group: 'lights', layer: 'front', duration: [14, 20],
    setup: (r) => Array.from({ length: 18 }, () => {
      const name = ['prism', 'crown', 'edge'][Math.floor(r() * 3)];
      const T = TOWERS[name], on = r() * 0.5;
      const y = 8 + r() * (T.face - 22);
      const half = name === 'crown' ? 15 - (y / T.face) * 4 : T.half - 2;
      return { name, x: (r() * 2 - 1) * half * 0.8, y, on, off: on + 0.25 + r() * 0.25, cool: r() < 0.35 };
    }),
    draw(ctx, v, e) {
      const at = layout(v);
      const size = Math.max(1.2, 1.7 * v.S);
      for (const win of e.p) {
        const k = Math.min(1, Math.max(0, (e.u - win.on) / 0.06)) * Math.min(1, Math.max(0, (win.off - e.u) / 0.06));
        if (k <= 0) continue;
        ctx.globalAlpha = e.alpha * k;
        ctx.fillStyle = win.cool ? '#d6f4ff' : '#ffe2a8';
        ctx.fillRect(v.px(at[win.name] + win.x), v.py(win.y), size, size);
      }
      ctx.globalAlpha = e.alpha;
    },
  },
  {
    // The crown of the tallest tower changes colour, slowly.
    id: 'neon', group: 'lights', layer: 'front', duration: [12, 18], sound: 'chime',
    setup: (r) => ({ first: Math.floor(r() * NEON_TURNS.length) }),
    draw(ctx, v, e) {
      const cx = layout(v).crown, T = TOWERS.crown;
      const turn = e.calm ? 0 : e.u * 2.999;
      const a = NEON_TURNS[(e.p.first + Math.floor(turn)) % NEON_TURNS.length];
      const b = NEON_TURNS[(e.p.first + Math.floor(turn) + 1) % NEON_TURNS.length];
      const m = Math.min(1, (turn % 1) * 2.5);
      const mix = a.map((part, i) => Math.round(part + (b[i] - part) * m));
      ctx.fillStyle = `rgb(${mix[0]},${mix[1]},${mix[2]})`;
      ctx.globalAlpha = e.alpha * 0.8;
      for (let i = 0; i < 6; i++) {
        const x = -T.half + 1 + i * ((T.half * 2 - 2) / 5), tall = 16 + 24 * Math.sin((Math.PI * (i + 0.5)) / 6);
        ctx.beginPath();
        ctx.moveTo(v.px(cx + x - 1.6), v.py(T.face));
        ctx.lineTo(v.px(cx + x), v.py(T.face + tall));
        ctx.lineTo(v.px(cx + x + 1.6), v.py(T.face));
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = e.alpha;
      glow(ctx, v.px(cx), v.py(T.face + 22), Math.max(2, 3 * v.S), ctx.fillStyle, 0.5);
    },
  },
  {
    // The tram climbing the Peak: a short string of lights going up the
    // hill. Behind: the towers hide part of its way.
    id: 'peaktram', layer: 'behind', duration: [16, 22],
    draw(ctx, v, e) {
      const [x0, y0, x1, y1] = layout(v).tram;
      const u = e.dir > 0 ? e.u : 1 - e.u;
      for (let i = 0; i < 3; i++) {
        const k = Math.min(1, Math.max(0, u * 1.1 - i * 0.035));
        glow(ctx, v.px(x0 + (x1 - x0) * k), v.py(y0 + (y1 - y0) * k), Math.max(0.6, 0.55 * v.S), i ? '#ffe9b0' : '#ff8a6a', 0.9);
      }
    },
  },
  {
    // A bank of mist drifting along the ridge, behind the towers.
    id: 'mist', layer: 'behind', duration: [20, 28],
    setup: (r) => ({ y: 96 + r() * 40, from: 0.15 + r() * 0.4, size: 0.2 + r() * 0.12 }),
    draw(ctx, v, e) {
      const rx = Math.max(120, v.w * e.p.size);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      ctx.save();
      ctx.translate(v.w * (start + e.dir * 0.24 * e.u), layout(v).city.py(e.p.y));
      ctx.scale(1, 0.1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, 'rgba(190,230,226,0.3)');
      g.addColorStop(1, 'rgba(190,230,226,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
];

export default {
  id: 'hongkong',
  name: 'Hong Kong',
  country: 'China',
  tagline: 'Victoria Harbour, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 0 },
  // Portrait: 430 units across, enough for the four leading towers.
  portraitSpan: 430,

  palette: {
    sky: [[0, '#020608'], [0.4, '#04171c'], [0.75, '#0c2e36'], [1, '#402844']],
    water: [[0, '#0c2a30'], [0.3, '#06171c'], [1, '#020608']],
    star: '#e0fff8',
  },
  stars: 60,

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
    opening: 'sweep',
    signature: 'beams',
    acts: ['dragon', 'chase', 'fans', 'crossfire', 'sparkle', 'palms'],
    finaleTypes: ['peony', 'crackle', 'palm', 'ring', 'peony', 'strobe', 'chrys', 'crackle'],
    actLabels: {
      opening: 'Harbour Lights',
      dragon: 'Golden Dragon',
      chase: 'Ferry Run',
      fans: 'Bauhinia',
      crossfire: 'Neon Rain',
      sparkle: 'Pearl',
      palms: 'Banyan',
      beams: 'Sky Beams',
      finale: 'Fortune Finale',
    },
    palettes: [
      { name: 'Lucky Red & Gold', colors: [[255, 60, 50], [255, 205, 90], [255, 240, 200]] },
      { name: 'Jade', colors: [[60, 225, 160], [170, 255, 215], [240, 255, 245]] },
      { name: 'Neon', colors: [[255, 70, 190], [50, 230, 215], [190, 255, 90]] },
      { name: 'Bauhinia', colors: [[230, 100, 220], [255, 190, 235], [255, 255, 255]] },
      { name: 'Pearl', colors: [[240, 248, 255], [170, 215, 255], [255, 205, 225]] },
      { name: 'Lantern', colors: [[255, 140, 40], [255, 70, 50], [255, 225, 110]] },
    ],
  },

  // A harbour walled in by glass on one side and hills on the other: full
  // booms, a long tail, and a strong, late echo.
  sound: {
    reverbSeconds: 3.0,
    echoSeconds: 0.42,
    echoLevel: 0.22,
    boomPitch: 0.96,
    ambient: { wash: 1, breeze: 0.6, bell: false },
  },
};
