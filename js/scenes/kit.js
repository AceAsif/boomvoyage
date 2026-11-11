// Small drawing helpers shared by scenes. A scene does not have to use them.

// Seeded random numbers: the same seed always draws the same city.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A row of office towers between two scene x positions.
// `shape(t)` (0..1 along the row) scales the height, to give the row a profile.
export function towerRow(ctx, v, o) {
  const r = rng(o.seed ?? 1);
  let x = o.from;
  while (x < o.to) {
    const w = o.minW + r() * (o.maxW - o.minW);
    const t = (x - o.from) / (o.to - o.from);
    const h = (o.minH + r() * (o.maxH - o.minH)) * (o.shape ? o.shape(t) : 1);
    const px = v.px(x), py = v.py(h), pw = w * v.S, ph = h * v.S + 1;
    ctx.fillStyle = o.colors[Math.floor(r() * o.colors.length)];
    ctx.fillRect(px, py, pw, ph);
    if (r() < 0.3) ctx.fillRect(px + pw * 0.3, py - 5 * v.S, pw * 0.4, 5 * v.S); // roof plant
    if (o.windows) windows(ctx, r, px, py, pw, ph, v.S, o.windows);
    x += w + r() * (o.gap ?? 4);
  }
}

function windows(ctx, r, px, py, pw, ph, S, o) {
  const cell = Math.max(2.2, 3.2 * S);
  const size = Math.max(1, cell * 0.42);
  const lit = o.lit ?? 0.3;
  for (let y = py + cell; y < py + ph - cell; y += cell) {
    for (let x = px + cell * 0.5; x < px + pw - cell * 0.6; x += cell) {
      if (r() > lit) continue;
      ctx.globalAlpha = 0.25 + r() * 0.55;
      ctx.fillStyle = o.colors[Math.floor(r() * o.colors.length)];
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

// A soft round light, for lamps and beacons.
export function lamp(ctx, x, y, radius, color, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.22;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// A copy of the view that draws everything moved sideways and resized
// (around the waterline). Scenes use it to re-arrange landmarks for portrait
// screens, or to draw far-away things smaller.
export function shifted(v, dx, k = 1) {
  return { ...v, S: v.S * k, px: (x) => v.px(x * k + dx), py: (y) => v.py(y * k) };
}

// A soft round glow in the sky, for city haze or a moon behind cloud.
// `stops` is a list of [position 0..1, colour].
export function haze(ctx, v, x, y, radius, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, v.w, v.hz);
}

// A small boat on the water with a mast light and its reflection.
// x is in scene units, depth is 0 (at the waterline) .. 1 (bottom of screen).
export function boat(ctx, v, x, depth, k = 1, side = '#ff6a5a') {
  const bx = v.px(x), by = v.hz + (v.h - v.hz) * depth, s = v.S * k * 1.4;
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
  lamp(ctx, bx + 2 * s, by - 2.8 * s, Math.max(0.5, 0.4 * s), side, 0.9);
  const g = ctx.createLinearGradient(0, by, 0, by + 16 * s);
  g.addColorStop(0, 'rgba(255,226,176,0.35)');
  g.addColorStop(1, 'rgba(255,226,176,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bx - 0.8 * s, by + 1 * s, 1.6 * s, 16 * s);
}

// ---------- helpers for "life between shows" events ----------
// Life events are faded as a whole with ctx.globalAlpha, so these helpers
// never reset it: they only multiply the value they find.

// A small soft light (like lamp(), but safe inside a fading life event).
export function glow(ctx, x, y, radius, color, strength = 1) {
  const base = ctx.globalAlpha;
  ctx.fillStyle = color;
  ctx.globalAlpha = base * strength;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = base * strength * 0.22;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = base;
}

// A point of light with a thin cross, for sparkles.
export function glint(ctx, x, y, r, color, strength = 1) {
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * strength;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - r * 2.8, y - r * 0.2, r * 5.6, r * 0.4);
  ctx.fillRect(x - r * 0.2, y - r * 2.8, r * 0.4, r * 5.6);
  ctx.globalAlpha = base;
}

// Where something that crosses the whole screen is now, in pixels.
// e.u runs 0..1; e.dir says left-to-right (1) or right-to-left (-1).
export function crossing(v, e, margin = 60) {
  const u = e.dir > 0 ? e.u : 1 - e.u;
  return -margin + u * (v.w + margin * 2);
}

// A lit boat on the water, drawn at pixel (x, y) with its bow toward `dir`.
// `s` is its size in pixels per unit. Options give each city its own boat:
//   length, hull, cabin, decks (0-2), windows (colour), lights ('#rrggbb'),
//   funnel (colour), mast (true), sail (colour: a dhow's slanted sail).
export function vessel(ctx, x, y, s, o = {}) {
  const base = ctx.globalAlpha;
  const L = o.length ?? 30, decks = o.decks ?? 1, dir = o.dir ?? 1;
  const top = -2 - decks * 3;

  // Light on the water under the boat.
  const g = ctx.createLinearGradient(0, y + s, 0, y + s * 12);
  g.addColorStop(0, o.glow ?? 'rgba(255,220,170,0.30)');
  g.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - L * 0.4 * s, y + s, L * 0.8 * s, s * 11);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.fillStyle = o.hull ?? '#05070e';
  ctx.beginPath();
  ctx.moveTo(-L / 2, -2);
  ctx.lineTo(L / 2 + 2.5, -2);
  ctx.lineTo(L / 2 - 1.5, 1);
  ctx.lineTo(-L / 2 + 1, 1);
  ctx.closePath();
  ctx.fill();
  if (o.stripe) { ctx.fillStyle = o.stripe; ctx.fillRect(-L / 2 + 0.6, -2, L + 0.8, 0.7); }

  for (let d = 0; d < decks; d++) {
    const x0 = -L * (0.4 - d * 0.06), wd = L * (0.74 - d * 0.14);
    ctx.fillStyle = o.cabin ?? '#0b0e18';
    ctx.fillRect(x0, -2 - (d + 1) * 3, wd, 3);
    ctx.fillStyle = o.windows ?? '#ffd9a0';
    const n = Math.max(3, Math.round(wd / 2.4));
    for (let i = 0; i < n; i++) ctx.fillRect(x0 + 0.7 + (i * (wd - 1.4)) / n, -2 - (d + 1) * 3 + 0.75, ((wd - 1.4) / n) * 0.62, 1.5);
  }
  if (o.funnel) { ctx.fillStyle = o.funnel; ctx.fillRect(-L * 0.06, top - 2.6, 2.6, 2.6); }
  if (o.sail) {
    ctx.fillStyle = '#05070e';
    ctx.fillRect(-0.3, -15, 0.6, 13);
    ctx.fillStyle = o.sail;
    ctx.beginPath();
    ctx.moveTo(-L * 0.36, -5);
    ctx.lineTo(L * 0.3, -16);
    ctx.lineTo(L * 0.16, -3.4);
    ctx.closePath();
    ctx.fill();
  }
  if (o.mast) { ctx.fillStyle = '#05070e'; ctx.fillRect(-0.25, top - 6, 0.5, 6); }
  ctx.restore();

  const mastY = y + (o.sail ? -16 : o.mast ? top - 6 : top - 0.8) * s;
  glow(ctx, x, mastY, Math.max(0.7, 0.55 * s), o.lights ?? '#ffe6b8', 0.95);
  glow(ctx, x + dir * (L / 2) * s, y - 2.6 * s, Math.max(0.5, 0.4 * s), dir > 0 ? '#7dffb0' : '#ff6a5a', 0.9);
  ctx.globalAlpha = base;
}
