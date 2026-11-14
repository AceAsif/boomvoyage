// Scene: Paris, the Eiffel Tower over the Seine in the blue hour.
//
// Scene units: x runs -500..500 (0 = the tower), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// The tower is drawn as a plain warm-gold lit silhouette with a hint of iron
// lattice. It does not try to copy the real tower's own light show.

import { towerRow, lamp, rng, shifted, haze, glint, crossing, vessel, afloat } from './kit.js';

const WARM = '#ffd9a0';
const QUAY = 8;        // height of the river wall, where the city stands
const TOP = 250;       // height of the tower above the quay

// ---------- Eiffel Tower ----------

// Half-width of the tower's outer edge at height y above the quay.
const outer = (y) => 0.9 + 46.1 * Math.exp(-y / 68);

// The open spaces: under the great arch, and between the legs up to the
// second platform. Returns the half-width of the gap at height y (0 = solid).
function gap(y) {
  if (y < 30) return 29 - 12 * Math.pow(y / 30, 1.3);          // between the feet
  if (y < 36) return 17 * Math.sqrt(Math.max(0, 1 - ((y - 30) / 6) ** 2)); // the arch closes
  if (y >= 50 && y < 83) return 10.5 - 8.5 * ((y - 50) / 33);  // between the upper legs
  return 0;
}

const PLATFORMS = [[43, 5, 27.5], [87, 4, 15.2], [209, 4, 4.8]]; // [height, thickness, half-width]

function towerShape(ctx, v) {
  const X = v.px, Y = (y) => v.py(QUAY + y);
  ctx.beginPath();
  ctx.moveTo(X(-outer(0)), Y(0));
  for (let y = 0; y <= 240; y += 3) ctx.lineTo(X(-outer(y)), Y(y));
  ctx.lineTo(X(-0.5), Y(TOP));
  ctx.lineTo(X(0.5), Y(TOP));
  for (let y = 240; y >= 0; y -= 3) ctx.lineTo(X(outer(y)), Y(y));
  ctx.closePath();
  // The two openings, as separate loops (filled with the "evenodd" rule).
  ctx.moveTo(X(-gap(0)), Y(0));
  for (let y = 0; y <= 36; y += 1.5) ctx.lineTo(X(-gap(y)), Y(y));
  for (let y = 36; y >= 0; y -= 1.5) ctx.lineTo(X(gap(y)), Y(y));
  ctx.closePath();
  ctx.moveTo(X(-gap(50)), Y(50));
  for (let y = 50; y <= 83; y += 3) ctx.lineTo(X(-gap(y)), Y(y));
  for (let y = 83; y >= 50; y -= 3) ctx.lineTo(X(gap(y)), Y(y));
  ctx.closePath();
}

function drawTower(ctx, v) {
  const X = v.px, Y = (y) => v.py(QUAY + y), S = v.S;

  // Warm air around the lit iron.
  const halo = ctx.createRadialGradient(X(0), Y(95), 0, X(0), Y(95), 175 * S);
  halo.addColorStop(0, 'rgba(255,186,90,0.20)');
  halo.addColorStop(1, 'rgba(255,186,90,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(-175), Y(270), 350 * S, 270 * S);

  const gold = ctx.createLinearGradient(0, Y(TOP), 0, Y(0));
  gold.addColorStop(0, '#ffe2a0');
  gold.addColorStop(0.45, '#f4ad45');
  gold.addColorStop(1, '#b9641f');
  ctx.fillStyle = gold;
  towerShape(ctx, v);
  ctx.fill('evenodd');

  // Iron lattice: crossing diagonals, kept inside the tower's shape.
  ctx.save();
  towerShape(ctx, v);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(72,34,8,0.42)';
  ctx.lineWidth = Math.max(0.5, 0.55 * S);
  ctx.beginPath();
  for (let k = -300; k <= 300; k += 5.5) {
    ctx.moveTo(X(k), Y(0)); ctx.lineTo(X(k + 250), Y(250));
    ctx.moveTo(X(k), Y(0)); ctx.lineTo(X(k - 250), Y(250));
  }
  for (let y = 8; y < 240; y += 9) { ctx.moveTo(X(-50), Y(y)); ctx.lineTo(X(50), Y(y)); }
  ctx.stroke();
  ctx.restore();

  // Platforms, the cupola and the mast.
  for (const [y, t, half] of PLATFORMS) {
    ctx.fillStyle = '#ffd88f';
    ctx.fillRect(X(-half), Y(y + t), half * 2 * S, t * S);
    ctx.fillStyle = 'rgba(90,44,10,0.55)';
    ctx.fillRect(X(-half), Y(y + 1.2), half * 2 * S, Math.max(0.6, 0.9 * S));
  }
  ctx.fillStyle = '#ffdf9c';
  ctx.fillRect(X(-2.6), Y(222), 5.2 * S, 9 * S);
  ctx.fillRect(X(-0.5), Y(TOP + 10), Math.max(1, 1 * S), 12 * S);

  // A bright rim on the legs, and small lamps up both edges.
  ctx.strokeStyle = 'rgba(255,238,190,0.75)';
  ctx.lineWidth = Math.max(0.6, 0.7 * S);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(X(side * outer(0)), Y(0));
    for (let y = 3; y <= 240; y += 3) ctx.lineTo(X(side * outer(y)), Y(y));
  }
  ctx.stroke();
  for (let y = 4; y < 236; y += 7) {
    lamp(ctx, X(-outer(y)), Y(y), Math.max(0.45, 0.42 * S), '#fff3cf', 0.8);
    lamp(ctx, X(outer(y)), Y(y), Math.max(0.45, 0.42 * S), '#fff3cf', 0.8);
  }
  lamp(ctx, X(0), Y(TOP + 10), Math.max(1, 1 * S), '#fff6dc', 1);
}

// ---------- the city ----------

// A block of Paris houses: pale walls with tall windows, a dark sloped roof
// with attic windows, and chimney pots.
function haussmann(ctx, v, from, to, seed) {
  const X = v.px, Y = v.py, S = v.S;
  const r = rng(seed);
  const walls = ['#1c1a3a', '#211e40', '#191834'];
  let x = from;
  while (x < to) {
    const w = 30 + r() * 16, wall = 24 + r() * 10, roof = 6 + r() * 3;
    ctx.fillStyle = walls[Math.floor(r() * walls.length)];
    ctx.fillRect(X(x), Y(QUAY + wall), w * S + 0.5, wall * S + 1);
    ctx.fillStyle = '#0b0c1f';
    ctx.beginPath();
    ctx.moveTo(X(x), Y(QUAY + wall));
    ctx.lineTo(X(x + 2.2), Y(QUAY + wall + roof));
    ctx.lineTo(X(x + w - 2.2), Y(QUAY + wall + roof));
    ctx.lineTo(X(x + w), Y(QUAY + wall));
    ctx.closePath();
    ctx.fill();
    for (let c = 0; c < 3; c++) ctx.fillRect(X(x + 5 + r() * (w - 10)), Y(QUAY + wall + roof + 3), 2.2 * S, 3.2 * S);
    ctx.fillStyle = 'rgba(8,8,24,0.6)';                       // balcony lines
    ctx.fillRect(X(x), Y(QUAY + 8.4), w * S, Math.max(0.5, 0.5 * S));
    ctx.fillRect(X(x), Y(QUAY + wall - 1), w * S, Math.max(0.5, 0.5 * S));
    for (let wx = x + 2.6; wx < x + w - 2.4; wx += 4.6) {
      for (let wy = QUAY + 3; wy < QUAY + wall - 4; wy += 5.4) {
        if (r() > 0.42) continue;
        ctx.globalAlpha = 0.35 + r() * 0.5;
        ctx.fillStyle = r() < 0.85 ? WARM : '#ffe9c4';
        ctx.fillRect(X(wx), Y(wy + 3.2), Math.max(0.9, 1.5 * S), Math.max(1.2, 3 * S));
      }
      if (r() < 0.3) {                                        // an attic window
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = WARM;
        ctx.fillRect(X(wx), Y(QUAY + wall + roof * 0.7), Math.max(0.9, 1.4 * S), Math.max(0.9, 1.6 * S));
      }
    }
    ctx.globalAlpha = 1;
    x += w + 0.5;
  }
}

// The gold dome of Les Invalides.
function drawDome(ctx, v, x) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#1f1c3c';
  ctx.fillRect(X(x - 34), Y(QUAY + 26), 68 * S, 26 * S + 1);
  ctx.fillStyle = '#2a2548';
  ctx.fillRect(X(x - 15), Y(QUAY + 46), 30 * S, 20 * S + 1);
  for (let i = -5; i <= 5; i++) lamp(ctx, X(x + i * 2.6), Y(QUAY + 36), Math.max(0.4, 0.4 * S), WARM, 0.7);
  const g = ctx.createLinearGradient(X(x - 15), 0, X(x + 15), 0);
  g.addColorStop(0, '#8a5a20');
  g.addColorStop(0.45, '#f7d37e');
  g.addColorStop(1, '#9c6a28');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(X(x), Y(QUAY + 46), 15 * S, 23 * S, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(X(x - 2.4), Y(QUAY + 78), 4.8 * S, 9.5 * S);
  ctx.fillRect(X(x - 0.5), Y(QUAY + 92), Math.max(0.8, 1 * S), 14.5 * S);
  lamp(ctx, X(x), Y(QUAY + 92), Math.max(0.6, 0.55 * S), '#fff0c0', 0.95);
}

// Montmartre: a dark hill with the pale Sacré-Cœur on top, far away.
function drawMontmartre(ctx, v, x) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#16153a';
  ctx.beginPath();
  ctx.moveTo(X(x - 190), Y(QUAY + 8));
  ctx.quadraticCurveTo(X(x - 40), Y(QUAY + 74), X(x + 6), Y(QUAY + 58));
  ctx.quadraticCurveTo(X(x + 70), Y(QUAY + 40), X(x + 200), Y(QUAY + 8));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a9a2cc';
  ctx.fillRect(X(x - 9), Y(QUAY + 70), 18 * S, 12 * S);
  for (const [dx, rx, ry, base] of [[0, 4.2, 9, 70], [-7.2, 2.2, 4.4, 68], [7.2, 2.2, 4.4, 68]]) {
    ctx.beginPath();
    ctx.ellipse(X(x + dx), Y(QUAY + base), rx * S, ry * S, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(X(x + 8.2), Y(QUAY + 80), 2.4 * S, 20 * S);
  lamp(ctx, X(x), Y(QUAY + 64), Math.max(0.5, 0.5 * S), WARM, 0.8);
}

// A stone bridge of five arches, with lamps and two gilded end columns.
function drawBridge(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const L = -170, R = 170, DECK = 17;
  const stone = ctx.createLinearGradient(0, Y(DECK), 0, Y(0));
  stone.addColorStop(0, '#463a5c');
  stone.addColorStop(1, '#1e1a34');
  ctx.fillStyle = stone;
  ctx.fillRect(X(L), Y(DECK), (R - L) * S, DECK * S + 1);
  ctx.fillStyle = '#0a0a1c';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(X(L + 34 + i * 68), Y(0), 28 * S, 12.5 * S, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,224,176,0.3)';
  ctx.fillRect(X(L), Y(DECK), (R - L) * S, Math.max(0.7, 0.8 * S));
  ctx.fillStyle = '#1a1730';
  for (let i = 0; i <= 5; i++) {
    const x = L + i * 68;
    ctx.fillRect(X(x - 0.5), Y(DECK + 8), Math.max(0.8, 1 * S), 8 * S);
    for (const dx of [-2.2, 0, 2.2]) lamp(ctx, X(x + dx), Y(DECK + 8 + (dx ? 0 : 1.6)), Math.max(0.55, 0.5 * S), WARM, 0.95);
  }
  for (const x of [L - 5, R - 1]) {
    ctx.fillStyle = '#3a3050';
    ctx.fillRect(X(x), Y(DECK + 20), 6 * S, (DECK + 20) * S + 1);
    ctx.fillRect(X(x - 1.2), Y(DECK + 21.5), 8.4 * S, 2 * S);
    ctx.fillStyle = '#f3c765';
    ctx.beginPath();
    ctx.moveTo(X(x + 0.6), Y(DECK + 21.5));
    ctx.lineTo(X(x + 3), Y(DECK + 30));
    ctx.lineTo(X(x + 5.4), Y(DECK + 21.5));
    ctx.closePath();
    ctx.fill();
    lamp(ctx, X(x + 3), Y(DECK + 27), Math.max(0.6, 0.6 * S), '#ffe2a0', 0.7);
  }
}

// Far things are drawn smaller on a phone, so they stay inside the screen.
const cityView = (v) => (v.portrait ? shifted(v, 0, 0.62) : v);

// The skyline is drawn in two halves, so that life events can pass between
// them (birds cross behind the tower).
// Backdrop: the city, Montmartre, the dome, the trees and the river wall.
function drawBackdrop(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  const c = cityView(v);

  towerRow(ctx, c, { seed: 3, from: -640, to: 700, minW: 24, maxW: 44, minH: 30, maxH: 54, gap: 1, colors: ['#1b1845', '#201c4c'] });
  drawMontmartre(ctx, c, -262);
  haussmann(ctx, c, -640, -76, 17);
  haussmann(ctx, c, 76, 700, 29);
  drawDome(ctx, c, 250);

  // Trees along the river.
  ctx.fillStyle = '#070912';
  for (let x = -630; x < 700; x += 11) {
    if (Math.abs(x) < 52) continue;
    ctx.beginPath();
    ctx.arc(c.px(x), c.py(QUAY + 9 + ((x * 13) % 3)), 5.6 * c.S, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(c.px(x) - 0.4 * c.S, c.py(QUAY + 6), 0.8 * c.S, 6 * c.S);
  }

  // The river wall with its lamps.
  const wall = ctx.createLinearGradient(0, Y(QUAY), 0, Y(0));
  wall.addColorStop(0, '#2c2646');
  wall.addColorStop(1, '#100e22');
  ctx.fillStyle = wall;
  ctx.fillRect(0, Y(QUAY), v.w, QUAY * S + 1);
  for (let x = -640; x < 700; x += 16) lamp(ctx, X(x), Y(QUAY + 2.5), Math.max(0.5, 0.5 * S), WARM, 0.85);
}

// Foreground: the tower and the bridge.
function drawForeground(ctx, v) {
  drawTower(ctx, v);
  drawBridge(ctx, v);
}

function drawSkyline(ctx, v) {
  drawBackdrop(ctx, v);
  drawForeground(ctx, v);
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // The last rose light of the evening, low behind the tower.
  haze(ctx, v, v.px(0), hz, U * 0.9, [[0, 'rgba(255,150,130,0.30)'], [0.5, 'rgba(200,110,170,0.12)'], [1, 'rgba(0,0,0,0)']]);

  // Thin evening clouds.
  for (const [fx, fy, rx, ry, a] of [[0.2, 0.5, 0.2, 0.012, 0.1], [0.62, 0.38, 0.26, 0.014, 0.08], [0.85, 0.6, 0.18, 0.01, 0.1], [0.4, 0.68, 0.3, 0.012, 0.07], [0.1, 0.28, 0.14, 0.008, 0.06]]) {
    // A soft-edged streak: a round glow, squashed flat.
    ctx.save();
    ctx.translate(w * fx, hz * fy);
    ctx.scale(1, (hz * ry * 3) / (w * rx));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * rx);
    g.addColorStop(0, `rgba(255,170,190,${a * 1.6})`);
    g.addColorStop(1, 'rgba(255,170,190,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w * rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // A full moon.
  const mx = w * (v.portrait ? 0.8 : 0.84), my = Math.max(hz * (v.portrait ? 0.3 : 0.2), 104), mr = U * 0.022;
  ctx.save();
  ctx.shadowColor = 'rgba(255,240,205,0.9)';
  ctx.shadowBlur = mr * 2.2;
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(190,170,190,0.25)';
  ctx.beginPath();
  ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.26, 0, Math.PI * 2);
  ctx.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater(ctx, v) {
  // A river boat with a long row of lit windows.
  const bx = v.px(v.portrait ? -60 : -235), by = v.hz + (v.h - v.hz) * 0.3, s = v.S * 1.5;
  ctx.fillStyle = '#05060f';
  ctx.beginPath();
  ctx.moveTo(bx - 24 * s, by - 1.6 * s);
  ctx.lineTo(bx + 27 * s, by - 1.6 * s);
  ctx.lineTo(bx + 23 * s, by + 1 * s);
  ctx.lineTo(bx - 22 * s, by + 1 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(bx - 19 * s, by - 5 * s, 38 * s, 3.6 * s);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = 'rgba(255,217,160,0.9)';
    ctx.fillRect(bx + (-17.5 + i * 3.3) * s, by - 4.3 * s, 2.3 * s, 2 * s);
  }
  const g = ctx.createLinearGradient(0, by, 0, by + 14 * s);
  g.addColorStop(0, 'rgba(255,217,160,0.28)');
  g.addColorStop(1, 'rgba(255,217,160,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bx - 18 * s, by + 1.2 * s, 36 * s, 14 * s);
}

// Anchor points for the signature act "Scintillement" (in pixels):
// `tower` = points on the iron where the glitter appears, `top` = a small fan.
function rig(v) {
  const r = rng(8);
  const tower = [];
  while (tower.length < 150) {
    const y = 11 + r() * 229;            // from just above the bridge to the top
    const out = outer(y), inn = gap(y);
    if (out - inn < 1.5) continue;
    const x = (r() < 0.5 ? -1 : 1) * (inn + r() * (out - inn));
    tower.push({ x: v.px(x), y: v.py(QUAY + y) });
  }
  const top = [];
  for (let i = 0; i < 5; i++) top.push({ x: v.px(0), y: v.py(QUAY + TOP + 10), angle: (i - 2) * 0.36 });
  return { tower, top };
}

// ---------- life between shows ----------
// Small things that happen while the countdown runs (see js/life.js).

const life = [
  {
    // A long sightseeing boat, all windows lit, crossing under the bridge.
    id: 'bateau', group: 'water', layer: 'front', weight: 2, duration: [26, 34], sound: 'horn',
    setup: (r) => ({ depth: 0.08 + r() * 0.12 }),
    draw(ctx, v, e) {
      const s = v.S * (1.4 + e.p.depth * 2.4);
      vessel(ctx, crossing(v, e, 50 * s), afloat(v, e.p.depth, e, 0.4), s, {
        dir: e.dir, length: 48, decks: 1, hull: '#0b0c20', stripe: '#e8d9b0', cabin: '#1a1a36', windows: '#ffe2a8', lights: '#fff0c8',
      });
    },
  },
  {
    // A small boat with one lantern, drifting a short way downstream.
    id: 'barque', group: 'water', layer: 'front', duration: [18, 26], sound: 'water',
    setup: (r) => ({ depth: 0.45 + r() * 0.2, from: 0.12 + r() * 0.45 }),
    draw(ctx, v, e) {
      const s = v.S * (1.2 + e.p.depth * 2);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      vessel(ctx, v.w * (start + e.dir * 0.26 * e.u), afloat(v, e.p.depth, e, 1.1), s, { dir: e.dir, length: 12, decks: 0, mast: true, hull: '#070818', lights: '#ffd9a0' });
    },
  },
  {
    // A soft sparkle on the iron: a few dozen small lights coming and going.
    // This is our own simple effect, much quieter than the fireworks act.
    // With reduce motion the lights stay on and do not twinkle.
    id: 'sparkle', group: 'lights', layer: 'front', duration: [12, 18], sound: 'chime',
    setup: (r) => {
      const points = [];
      while (points.length < 44) {
        const y = 26 + r() * 214;
        const out = outer(y), inn = gap(y);
        if (out - inn < 1.5) continue;
        points.push({ x: (r() < 0.5 ? -1 : 1) * (inn + r() * (out - inn)), y, speed: 1.2 + r() * 1.6, phase: r() * 6.3 });
      }
      return points;
    },
    draw(ctx, v, e) {
      const size = Math.max(1, 1.1 * v.S);
      for (const p of e.p) {
        const k = e.calm ? 0.4 : Math.pow(Math.max(0, Math.sin(e.t * p.speed + p.phase)), 4);
        if (k > 0.03) glint(ctx, v.px(p.x), v.py(QUAY + p.y), size, '#fff6dc', k * 0.9);
      }
    },
  },
  {
    // A few birds crossing the evening sky (they glide with reduce motion).
    id: 'birds', layer: 'behind', duration: [16, 22],
    setup: (r) => ({
      y: 0.34 + r() * 0.3, drift: (r() - 0.5) * 0.1,
      flock: Array.from({ length: 5 + Math.floor(r() * 3) }, (_, i) => ({ dx: -i * 8 - r() * 5, dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 3.5 + r() * 2.5, phase: r() * 6.3 })),
    }),
    draw(ctx, v, e) {
      const S = Math.max(v.S, 0.8);
      const x0 = crossing(v, e, 80 * S), y0 = v.hz * (e.p.y + e.p.drift * e.u);
      ctx.strokeStyle = 'rgba(226,208,232,0.6)';
      ctx.lineWidth = Math.max(0.8, 0.7 * S);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const b of e.p.flock) {
        const x = x0 + e.dir * b.dx * S, y = y0 + b.dy * S;
        const lift = (e.calm ? 0.35 : Math.sin(e.t * 6.5 + b.phase)) * 1.5 * S;
        ctx.moveTo(x - 3 * S, y - lift);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 3 * S, y - lift);
      }
      ctx.stroke();
    },
  },
  {
    // A thin rose cloud drifting slowly, high up.
    id: 'cloud', layer: 'behind', duration: [20, 28],
    setup: (r) => ({ y: 0.14 + r() * 0.3, from: 0.2 + r() * 0.4, size: 0.16 + r() * 0.1 }),
    draw(ctx, v, e) {
      const rx = Math.max(110, v.w * e.p.size);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      ctx.save();
      ctx.translate(v.w * (start + e.dir * 0.22 * e.u), v.hz * e.p.y);
      ctx.scale(1, 0.085);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, 'rgba(255,186,200,0.2)');
      g.addColorStop(1, 'rgba(255,186,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
];

export default {
  id: 'paris',
  name: 'Paris',
  country: 'France',
  timeZone: 'Europe/Paris',   // for New Year's Eve mode: when midnight really is here
  tagline: 'Paris on the Seine, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  // Wide screens put the tower a little left of the middle; phones centre it.
  focusX: { landscape: 70, portrait: 0 },
  // Portrait: 360 units across, the whole bridge plus a small margin.
  portraitSpan: 360,

  palette: {
    sky: [[0, '#040714'], [0.4, '#0d1640'], [0.75, '#2a2158'], [1, '#6a3f5c']],
    water: [[0, '#1e1a46'], [0.3, '#0e1030'], [1, '#03040c']],
    star: '#f1eaff',
  },
  stars: 170,

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
    opening: 'duet',
    signature: 'glitter',
    acts: ['waltz', 'mirror', 'willows', 'garden', 'sparkle', 'chase'],
    finaleTypes: ['ring', 'peony', 'willow', 'saturn', 'chrys', 'peony', 'strobe', 'ring'],
    actLabels: {
      opening: 'Ouverture',
      waltz: 'La Valse',
      mirror: 'Reflets',
      willows: 'Saules d’or',
      garden: 'Jardin',
      sparkle: 'Champagne',
      chase: 'La Course',
      glitter: 'Scintillement',
      finale: 'Bouquet final',
    },
    palettes: [
      { name: 'Champagne', colors: [[255, 214, 130], [255, 240, 210], [255, 190, 170]] },
      { name: 'Bleu Blanc Rouge', colors: [[70, 120, 255], [255, 255, 255], [255, 60, 70]] },
      { name: 'La Vie en Rose', colors: [[255, 120, 170], [255, 80, 140], [255, 200, 180]] },
      { name: 'Lavande', colors: [[180, 140, 255], [130, 110, 255], [235, 225, 255]] },
      { name: 'Absinthe', colors: [[130, 240, 120], [220, 255, 140], [245, 255, 235]] },
      { name: 'Nuit Bleue', colors: [[50, 110, 255], [90, 220, 255], [255, 255, 255]] },
    ],
  },

  // Stone houses close on both banks: a short bright tail and a quick echo.
  sound: {
    reverbSeconds: 2.2,
    echoSeconds: 0.22,
    echoLevel: 0.25,
    boomPitch: 1.08,
    ambient: { wash: 0.7, breeze: 0.6, bell: false },
  },
};
