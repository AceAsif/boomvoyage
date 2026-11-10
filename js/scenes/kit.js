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
