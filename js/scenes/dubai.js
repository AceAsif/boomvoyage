// Scene: Downtown Dubai across the Burj Lake, on a clear desert night.
//
// Scene units: x runs -500..500 (0 = middle of the view), y goes UP from the
// waterline. Use v.px(x) / v.py(y) to turn them into pixels and v.S for sizes.
//
// The Burj Khalifa stands in the middle and is the star of the scene. Other
// towers, the Dubai Frame and a row of palms keep it company.

import { towerRow, lamp, rng, shifted, haze, boat, glow, crossing, vessel, afloat } from './kit.js';

const WARM = '#ffd9a0';
const COOL = '#dfeaff';

// ---------- Burj Khalifa ----------
// The tower is a stack of tiers. Its three wings step back at different
// heights, so the left and right edges do not match: that uneven spiral is
// what makes the silhouette. Each row: [height, half-width left, half-width right].
const TIERS = [
  [0, 23, 23], [26, 23, 19], [44, 19, 19], [66, 19, 15.5], [86, 15.5, 15.5], [108, 15.5, 12.4],
  [126, 12.4, 12.4], [146, 12.4, 9.6], [162, 9.6, 9.6], [180, 9.6, 7.2], [194, 7.2, 7.2],
  [210, 7.2, 5.2], [222, 5.2, 5.2], [234, 5.2, 3.4], [244, 3.4, 3.4],
];
const SHOULDER = 252;  // where the body ends and the spire begins
const TIP = 285;

// Half-width of the tower at height y. side 1 = left edge, 2 = right edge.
function halfWidth(y, side) {
  if (y >= SHOULDER) return Math.max(0.4, 1.7 * (1 - (y - SHOULDER) / (TIP - SHOULDER)));
  let row = TIERS[0];
  for (const t of TIERS) if (t[0] <= y) row = t;
  return row[side];
}

function towerPath(ctx, v) {
  const X = v.px, Y = v.py;
  ctx.beginPath();
  ctx.moveTo(X(-TIERS[0][1]), Y(0));
  for (let i = 0; i < TIERS.length; i++) {             // up the left edge
    const top = i + 1 < TIERS.length ? TIERS[i + 1][0] : SHOULDER;
    ctx.lineTo(X(-TIERS[i][1] * 0.97), Y(top - 1.5));
    ctx.lineTo(X(-(i + 1 < TIERS.length ? TIERS[i + 1][1] : 1.7)), Y(top));
  }
  ctx.lineTo(X(-0.4), Y(TIP));
  ctx.lineTo(X(0.4), Y(TIP));
  for (let i = TIERS.length - 1; i >= 0; i--) {        // down the right edge
    const top = i + 1 < TIERS.length ? TIERS[i + 1][0] : SHOULDER;
    ctx.lineTo(X(i + 1 < TIERS.length ? TIERS[i + 1][2] : 1.7), Y(top));
    ctx.lineTo(X(TIERS[i][2] * 0.97), Y(top - 1.5));
  }
  ctx.lineTo(X(TIERS[0][2]), Y(0));
  ctx.closePath();
}

function drawBurj(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;

  // A soft halo: the tower is floodlit and the dusty air glows around it.
  const halo = ctx.createRadialGradient(X(0), Y(150), 0, X(0), Y(150), 190 * S);
  halo.addColorStop(0, 'rgba(150,200,255,0.16)');
  halo.addColorStop(1, 'rgba(150,200,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(X(-190), Y(340), 380 * S, 340 * S);

  // Body: silver-blue glass, brightest on the wing that faces us.
  const body = ctx.createLinearGradient(X(-23), 0, X(23), 0);
  body.addColorStop(0, '#34466f');
  body.addColorStop(0.3, '#8fa6d4');
  body.addColorStop(0.46, '#dbe8ff');
  body.addColorStop(0.62, '#8298c8');
  body.addColorStop(1, '#27345a');
  ctx.fillStyle = body;
  towerPath(ctx, v);
  ctx.fill();

  ctx.save();
  towerPath(ctx, v);
  ctx.clip();
  // Darker toward the ground, where the floodlights do not reach evenly.
  const shade = ctx.createLinearGradient(0, Y(TIP), 0, Y(0));
  shade.addColorStop(0, 'rgba(6,10,28,0)');
  shade.addColorStop(0.55, 'rgba(6,10,28,0.12)');
  shade.addColorStop(1, 'rgba(6,10,28,0.5)');
  ctx.fillStyle = shade;
  ctx.fillRect(X(-24), Y(TIP), 48 * S, TIP * S);
  // Floors: fine lines. Service floors at each setback: a darker band.
  ctx.fillStyle = 'rgba(10,16,40,0.16)';
  for (let y = 4; y < SHOULDER; y += 4) ctx.fillRect(X(-24), Y(y), 48 * S, Math.max(0.5, 0.5 * S));
  ctx.fillStyle = 'rgba(8,12,32,0.5)';
  for (const [y] of TIERS.slice(1)) ctx.fillRect(X(-24), Y(y + 1.6), 48 * S, 1.6 * S);
  // The edges between the wings: two long vertical shadows.
  ctx.fillStyle = 'rgba(10,16,40,0.28)';
  ctx.fillRect(X(-7.5), Y(SHOULDER), 1.1 * S, SHOULDER * S);
  ctx.fillRect(X(6.4), Y(SHOULDER), 1.1 * S, SHOULDER * S);
  // Warm light at the very bottom, from the plaza.
  const foot = ctx.createLinearGradient(0, Y(26), 0, Y(0));
  foot.addColorStop(0, 'rgba(255,200,130,0)');
  foot.addColorStop(1, 'rgba(255,200,130,0.4)');
  ctx.fillStyle = foot;
  ctx.fillRect(X(-24), Y(26), 48 * S, 26 * S);
  ctx.restore();

  // Lit windows, always the same ones.
  const r = rng(77);
  for (let i = 0; i < 230; i++) {
    const y = 3 + r() * (SHOULDER - 8);
    const side = r() < 0.5 ? 1 : 2;
    const x = (side === 1 ? -1 : 1) * r() * halfWidth(y, side) * 0.86;
    ctx.globalAlpha = 0.3 + r() * 0.6;
    ctx.fillStyle = r() < 0.75 ? COOL : WARM;
    ctx.fillRect(X(x), Y(y), Math.max(0.8, 0.7 * S), Math.max(0.8, 0.7 * S));
  }
  ctx.globalAlpha = 1;

  // Spire lamps and the red beacon on top.
  lamp(ctx, X(0), Y(SHOULDER + 12), Math.max(0.6, 0.5 * S), '#ffffff', 0.9);
  lamp(ctx, X(0), Y(TIP + 1), Math.max(0.9, 0.8 * S), '#ff5548', 1);
}

// ---------- the rest of the skyline ----------

// A tower with a curved, sail-like crown and one bright vertical strip.
function sailTower(ctx, v, x, w, h, lean = 1) {
  const X = v.px, Y = v.py, S = v.S;
  const g = ctx.createLinearGradient(X(x), 0, X(x + w), 0);
  g.addColorStop(0, '#0f1a33');
  g.addColorStop(1, '#1d2d52');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(X(x), Y(0));
  ctx.lineTo(X(x), Y(h * 0.84));
  ctx.quadraticCurveTo(X(x + (lean > 0 ? w * 0.25 : w * 0.75)), Y(h * 1.04), X(x + (lean > 0 ? w : 0)), Y(h));
  ctx.lineTo(X(x + w), Y(lean > 0 ? h : h * 0.84));
  ctx.lineTo(X(x + w), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(140,210,255,0.55)';
  ctx.fillRect(X(x + w * 0.46), Y(h * 0.82), Math.max(0.8, 0.9 * S), h * 0.8 * S);
  const r = rng(Math.round(x * 7 + h));
  for (let i = 0; i < w * h * 0.05; i++) {
    ctx.globalAlpha = 0.25 + r() * 0.5;
    ctx.fillStyle = r() < 0.6 ? WARM : COOL;
    ctx.fillRect(X(x + 1.5 + r() * (w - 3)), Y(3 + r() * h * 0.78), Math.max(0.8, 0.8 * S), Math.max(0.8, 0.8 * S));
  }
  ctx.globalAlpha = 1;
}

// A slim tower with a slanted, blade-like top and a needle.
function bladeTower(ctx, v, x, w, h, dir) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.fillStyle = '#0b1429';
  ctx.beginPath();
  ctx.moveTo(X(x), Y(0));
  ctx.lineTo(X(x), Y(dir > 0 ? h * 0.8 : h));
  ctx.lineTo(X(x + w), Y(dir > 0 ? h : h * 0.8));
  ctx.lineTo(X(x + w), Y(0));
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(X(dir > 0 ? x + w - 1 : x), Y(h + 16), Math.max(0.8, 1 * S), 17 * S);
  ctx.fillStyle = 'rgba(255,217,160,0.55)';
  for (let y = 5; y < h * 0.78; y += 5) ctx.fillRect(X(x + 1.5), Y(y), (w - 3) * S, Math.max(0.5, 0.45 * S));
  lamp(ctx, X(dir > 0 ? x + w - 0.5 : x + 0.5), Y(h + 16), Math.max(0.6, 0.5 * S), '#ff5548', 0.9);
}

// The Dubai Frame: a tall golden picture frame.
function drawFrame(ctx, v, x) {
  const X = v.px, Y = v.py, S = v.S;
  const W = 46, H = 78, T = 7;
  const g = ctx.createLinearGradient(0, Y(H), 0, Y(0));
  g.addColorStop(0, '#f2c86a');
  g.addColorStop(1, '#8a5a22');
  ctx.fillStyle = g;
  ctx.fillRect(X(x), Y(H), T * S, H * S + 1);
  ctx.fillRect(X(x + W - T), Y(H), T * S, H * S + 1);
  ctx.fillRect(X(x), Y(H), W * S, T * S);
  ctx.fillRect(X(x - 2), Y(5), (W + 4) * S, 5 * S + 1);
  ctx.strokeStyle = 'rgba(70,40,10,0.45)';      // the frame's lattice pattern
  ctx.lineWidth = Math.max(0.4, 0.4 * S);
  ctx.beginPath();
  for (let y = 8; y < H - 2; y += 4) {
    for (const lx of [x, x + W - T]) {
      ctx.moveTo(X(lx), Y(y)); ctx.lineTo(X(lx + T), Y(y + 4));
      ctx.moveTo(X(lx + T), Y(y)); ctx.lineTo(X(lx), Y(y + 4));
    }
  }
  ctx.stroke();
  for (let i = 0; i <= 6; i++) lamp(ctx, X(x + 3 + i * ((W - 6) / 6)), Y(H - T - 1), Math.max(0.5, 0.45 * S), '#fff0c8', 0.9);
}

function palm(ctx, v, x, h) {
  const X = v.px, Y = v.py, S = v.S;
  ctx.strokeStyle = '#05070f';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, 1.1 * S);
  ctx.beginPath();
  ctx.moveTo(X(x), Y(0));
  ctx.quadraticCurveTo(X(x + 1.2), Y(h * 0.5), X(x + 0.4), Y(h));
  ctx.stroke();
  ctx.lineWidth = Math.max(0.7, 0.9 * S);
  ctx.beginPath();
  for (const [dx, dy] of [[-7, -2], [-5.5, 2.5], [-2.5, 4.5], [2.5, 4.5], [5.5, 2.5], [7, -2]]) {
    ctx.moveTo(X(x + 0.4), Y(h));
    ctx.quadraticCurveTo(X(x + 0.4 + dx * 0.5), Y(h + dy + 2.5), X(x + 0.4 + dx), Y(h + dy - 2));
  }
  ctx.stroke();
}

// The towers left and right of the Burj. On portrait screens they are drawn
// smaller (see cityView), like a skyline further away.
function drawCity(ctx, v) {
  const rise = (t) => 0.55 + 0.6 * t;        // taller toward the middle
  const fall = (t) => 1.15 - 0.6 * t;
  const back = { minW: 18, maxW: 36, minH: 46, maxH: 96, gap: 3, colors: ['#0d2030', '#102636'] };
  towerRow(ctx, v, { ...back, seed: 5, from: -520, to: -40, shape: rise });
  towerRow(ctx, v, { ...back, seed: 9, from: 40, to: 520, shape: fall });
  const front = { minW: 14, maxW: 28, minH: 28, maxH: 104, gap: 6, colors: ['#060d1a', '#091223', '#0b1528'], windows: { lit: 0.34, colors: [WARM, '#ffe9c4', COOL] } };
  towerRow(ctx, v, { ...front, seed: 31, from: -510, to: -150, shape: rise });
  towerRow(ctx, v, { ...front, seed: 43, from: 130, to: 520, shape: fall });

  bladeTower(ctx, v, -392, 15, 122, 1);
  bladeTower(ctx, v, -366, 14, 106, -1);
  sailTower(ctx, v, -128, 24, 124, 1);
  sailTower(ctx, v, 84, 22, 108, -1);
  drawFrame(ctx, v, 262);
}

const cityView = (v) => (v.portrait ? shifted(v, 0, 0.45) : v);

// The skyline is drawn in two halves, so that life events can pass between
// them (a plane crosses behind the tower).
// Backdrop: the other towers and the mall.
function drawBackdrop(ctx, v) {
  const X = v.px, Y = v.py, S = v.S;
  drawCity(ctx, cityView(v));

  // The mall and promenade: one long low building with warm shopfronts.
  const g = ctx.createLinearGradient(0, Y(10), 0, Y(0));
  g.addColorStop(0, '#231a14');
  g.addColorStop(1, '#0c0907');
  ctx.fillStyle = g;
  ctx.fillRect(0, Y(9), v.w, 9 * S + 1);
  for (let x = -520; x < 520; x += 5.5) lamp(ctx, X(x), Y(4.5), Math.max(0.5, 0.45 * S), WARM, 0.75);
}

// Foreground: the Burj Khalifa and the palms on the promenade.
function drawForeground(ctx, v) {
  drawBurj(ctx, v);
  for (const x of [-210, -176, -150, -74, -52, 50, 72, 118, 168, 204, 236]) palm(ctx, v, x, 13 + ((x * 7) % 5 + 5) % 5);
}

function drawSkyline(ctx, v) {
  drawBackdrop(ctx, v);
  drawForeground(ctx, v);
}

function drawSky(ctx, v) {
  const { w, hz, U } = v;
  // Sand in the air: a wide amber glow on the horizon behind the tower.
  haze(ctx, v, v.px(0), hz, U * 0.95, [[0, 'rgba(255,170,90,0.30)'], [0.45, 'rgba(200,100,60,0.12)'], [1, 'rgba(0,0,0,0)']]);

  // Two faint searchlight beams leaning away from the tower.
  for (const [dx, lean] of [[-58, -0.34], [58, 0.34]]) {
    const x0 = v.px(dx), top = hz * 0.08;
    const g = ctx.createLinearGradient(0, hz, 0, top);
    g.addColorStop(0, 'rgba(190,225,255,0.08)');
    g.addColorStop(1, 'rgba(190,225,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - 3, hz);
    ctx.lineTo(x0 + 3, hz);
    ctx.lineTo(x0 + lean * hz + U * 0.05, top);
    ctx.lineTo(x0 + lean * hz - U * 0.05, top);
    ctx.closePath();
    ctx.fill();
  }

  // A thin new moon, low on the left.
  const mx = w * (v.portrait ? 0.2 : 0.16), my = hz * (v.portrait ? 0.34 : 0.26), mr = U * 0.02;
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-0.55);
  ctx.shadowColor = 'rgba(255,230,180,0.85)';
  ctx.shadowBlur = mr * 1.8;
  ctx.fillStyle = '#fbe9c4';
  ctx.beginPath();
  ctx.arc(0, 0, mr, Math.PI / 2, -Math.PI / 2);
  ctx.ellipse(0, 0, mr * 0.7, mr, 0, -Math.PI / 2, Math.PI / 2, true);
  ctx.fill();
  ctx.restore();
}

function drawWater(ctx, v) {
  // Two abras (small wooden boats) on the lake.
  boat(ctx, v, v.portrait ? -120 : -300, 0.26, 1.1, '#ffb060');
  boat(ctx, v, v.portrait ? 130 : 330, 0.5, 1.4, '#ffb060');
}

// Anchor points for the signature act "The Spire" (in pixels).
function rig(v) {
  const levels = [44, 86, 126, 162, 194, 222];
  const tiers = [];
  levels.forEach((y, level) => {
    const lean = 1.05 - level * 0.1;             // lower tiers throw wider
    tiers.push({ level, x: v.px(-halfWidth(y, 1)), y: v.py(y + 1), angle: -lean });
    tiers.push({ level, x: v.px(halfWidth(y, 2)), y: v.py(y + 1), angle: lean });
  });
  const spire = [];
  for (let i = 0; i < 7; i++) spire.push({ x: v.px(0), y: v.py(TIP), angle: (i - 3) * 0.3 });
  const r = rng(12);
  const facade = [];
  for (let i = 0; i < 70; i++) {
    const y = 10 + r() * (TIP - 20);
    const side = r() < 0.5 ? 1 : 2;
    facade.push({ x: v.px((side === 1 ? -1 : 1) * r() * halfWidth(y, side) * 0.9), y: v.py(y) });
  }
  return { tiers, spire, facade };
}

// ---------- life between shows ----------
// Small things that happen while the countdown runs (see js/life.js).

const life = [
  {
    // A wooden dhow with a lantern-lit sail, gliding across the lake.
    id: 'dhow', group: 'water', layer: 'front', weight: 2, duration: [24, 32], sound: 'water',
    setup: (r) => ({ depth: 0.14 + r() * 0.2 }),
    draw(ctx, v, e) {
      const s = v.S * (1.5 + e.p.depth * 2.4);
      vessel(ctx, crossing(v, e, 30 * s), afloat(v, e.p.depth, e, 0.6), s, {
        dir: e.dir, length: 26, decks: 1, hull: '#2a170c', stripe: '#c98a3a', cabin: '#3a2212', windows: '#ffc070', sail: '#e9d2a4', lights: '#ffb060', glow: '#ffb868',
      });
    },
  },
  {
    // An abra (water taxi) pottering a short way along the shore.
    id: 'abra', group: 'water', layer: 'front', duration: [18, 26], sound: 'horn',
    setup: (r) => ({ depth: 0.05 + r() * 0.08, from: 0.12 + r() * 0.45 }),
    draw(ctx, v, e) {
      const s = v.S * (1.3 + e.p.depth * 2);
      const start = e.dir > 0 ? e.p.from : 1 - e.p.from;
      vessel(ctx, v.w * (start + e.dir * 0.3 * e.u), afloat(v, e.p.depth, e, 0.5), s, {
        dir: e.dir, length: 17, decks: 1, hull: '#1c1009', stripe: '#b8752c', cabin: '#24160c', windows: '#ffb060', lights: '#ffd9a0', glow: '#ffb868',
      });
    },
  },
  {
    // A plane on its way out of the airport: a steady white light, a red
    // wing light and a strobe that blinks (no blinking with reduce motion).
    id: 'plane', layer: 'behind', duration: [18, 24],
    setup: (r) => ({ y: 0.1 + r() * 0.2, climb: 0.03 + r() * 0.07, phase: r() * 3 }),
    draw(ctx, v, e) {
      const x = crossing(v, e, 20);
      const u = e.dir > 0 ? e.u : 1 - e.u;
      const y = v.hz * (e.p.y + e.p.climb * (1 - u));
      const size = Math.max(0.7, 0.6 * v.S);
      glow(ctx, x, y, size, '#fff4dc', 0.75);
      glow(ctx, x - e.dir * 3.2 * size, y + size * 0.4, size * 0.85, '#ff4a3c', 0.8);
      const beat = (e.t + e.p.phase) % 1.4;
      if (!e.calm && beat < 0.09) glow(ctx, x - e.dir * 1.6 * size, y, size * 1.9, '#ffffff', 1);
    },
  },
  {
    // A band of light climbing the Burj Khalifa, from the plaza to the spire.
    // With reduce motion the whole tower glows softly instead.
    id: 'pulse', group: 'lights', layer: 'front', duration: [10, 14],
    draw(ctx, v, e) {
      const head = -30 + e.u * (TIP + 70);
      ctx.fillStyle = '#d6ecff';
      for (let y = 2; y < TIP; y += 5) {
        const k = e.calm ? 0.3 : Math.max(0, 1 - Math.abs(y - head) / 36);
        if (k <= 0) continue;
        const left = halfWidth(y, 1), right = halfWidth(y, 2);
        ctx.globalAlpha = e.alpha * k * k * 0.6;
        ctx.fillRect(v.px(-left), v.py(y + 5), (left + right) * v.S, 5 * v.S + 0.5);
      }
      ctx.globalAlpha = e.alpha;
      if (!e.calm && head > 0 && head < TIP) glow(ctx, v.px(0), v.py(head), Math.max(1.2, 1.6 * v.S), '#ffffff', 0.5);
    },
  },
  {
    // The fountain on the lake practising: a row of thin white jets swaying.
    id: 'fountain', group: 'lights', layer: 'front', duration: [11, 16], sound: 'water', calm: false,
    setup: (r) => ({ phase: r() * 6, wave: 0.5 + r() * 0.5 }),
    draw(ctx, v, e) {
      const base = v.hz + 2 * v.S;
      const width = Math.max(1, 0.8 * v.S);
      ctx.fillStyle = '#eaf6ff';
      for (let i = 0; i < 17; i++) {
        const x = -96 + i * 12;
        const lift = Math.pow(Math.sin(e.t * 1.1 + i * e.p.wave + e.p.phase), 2);
        const h = (7 + 26 * lift) * Math.sin(Math.PI * Math.min(1, e.u * 1.05)) * v.S;
        ctx.globalAlpha = e.alpha * 0.5;
        ctx.fillRect(v.px(x) - width / 2, base - h, width, h);
        ctx.globalAlpha = e.alpha * 0.16;
        ctx.fillRect(v.px(x) - width * 1.5, base - h * 0.5, width * 3, h * 0.5);
      }
      ctx.globalAlpha = e.alpha;
    },
  },
];

export default {
  id: 'dubai',
  name: 'Dubai',
  country: 'UAE',
  timeZone: 'Asia/Dubai',   // for New Year's Eve mode: when midnight really is here
  tagline: 'Downtown Dubai, tonight and every two minutes.',

  horizon: { landscape: 0.74, portrait: 0.7 },
  focusX: { landscape: 0, portrait: 0 },
  // Portrait: only 380 units fit across, so the tower is tall on a phone.
  portraitSpan: 380,

  palette: {
    sky: [[0, '#020409'], [0.4, '#051424'], [0.75, '#0c2a38'], [1, '#402b22']],
    water: [[0, '#0f2832'], [0.3, '#071620'], [1, '#02060a']],
    star: '#fff3e0',
  },
  stars: 150,

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
    opening: 'tower',
    signature: 'spire',
    acts: ['fountain', 'palms', 'fans', 'crossfire', 'sparkle', 'chase'],
    finaleTypes: ['palm', 'peony', 'crackle', 'chrys', 'palm', 'ring', 'peony', 'crossette'],
    actLabels: {
      opening: 'First Light',
      fountain: 'Dancing Fountain',
      palms: 'Palm Grove',
      fans: 'Desert Wind',
      crossfire: 'Crossfire',
      sparkle: 'Diamond Dust',
      chase: 'Skyline Run',
      spire: 'The Spire',
      finale: 'Golden Finale',
    },
    palettes: [
      { name: 'Desert Gold', colors: [[255, 196, 96], [255, 140, 50], [255, 236, 200]] },
      { name: 'Emerald & Pearl', colors: [[40, 220, 150], [245, 245, 235], [170, 255, 210]] },
      { name: 'Sapphire', colors: [[60, 130, 255], [120, 210, 255], [235, 240, 255]] },
      { name: 'Rose Gold', colors: [[255, 150, 150], [255, 200, 150], [255, 225, 215]] },
      { name: 'Arabian Night', colors: [[170, 110, 255], [50, 220, 220], [255, 200, 110]] },
      { name: 'Falcon', colors: [[255, 255, 255], [255, 70, 70], [60, 200, 120]] },
    ],
  },

  // Open desert air between glass towers: deep booms, a long tail, a late echo.
  sound: {
    reverbSeconds: 3.0,
    echoSeconds: 0.44,
    echoLevel: 0.16,
    boomPitch: 0.92,
    ambient: { wash: 0.5, breeze: 1.4, bell: false },
  },
};
