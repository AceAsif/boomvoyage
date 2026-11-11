// Burst shapes. Each function only adds particles; the engine owns timing.
// `eng` gives: P (particles), U (reference size in px), q (quality 0..1),
// flash(x, y, color, size) and emit(name, data).

const TAU = Math.PI * 2;
const rnd = Math.random;

export const GOLD = [255, 190, 104];
export const WHITE = [255, 244, 226];
export const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const dim = (c, k) => css([Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)]);

export const BURST_TYPES = [
  'peony', 'chrys', 'willow', 'ring', 'saturn', 'palm', 'crossette', 'crackle', 'strobe', 'kamuro', 'salute',
];

// A round shell seen from the side: more stars near the edge than the middle.
function sphere(eng, x, y, n, v0, color, o, vary = 0.4) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU;
    const z = rnd() * 2 - 1;
    const s = v0 * Math.sqrt(1 - z * z) * (0.92 + rnd() * 0.16);
    eng.P.add(x, y, Math.cos(a) * s, Math.sin(a) * s, o.ttl * (1 - vary / 2 + rnd() * vary), color, o);
  }
}

function ring(eng, x, y, n, v0, color, o) {
  const tilt = rnd() * TAU;
  const squash = 0.28 + rnd() * 0.72;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const ex = Math.cos(a) * v0, ey = Math.sin(a) * v0 * squash;
    eng.P.add(x, y, ex * ct - ey * st, ex * st + ey * ct, o.ttl, color, o);
  }
}

export function burst(eng, x, y, spec) {
  const size = spec.size ?? 1;
  const V = 0.36 * eng.U * size;          // start speed of the stars
  const q = eng.q;
  const c = css(spec.color ?? GOLD);
  const c2 = css(spec.color2 ?? WHITE);
  const gold = css(GOLD);
  const dens = spec.density ?? 1;         // < 1 for many tiny bursts at once
  const n = (k) => Math.max(6, Math.round(k * q * dens * (0.75 + size * 0.25)));

  switch (spec.type) {
    case 'chrys':
      sphere(eng, x, y, n(80), V, c, { ttl: 2.1, drag: 0.16, grav: 0.45, size: 1.9, trail: 8, trailColor: dim(spec.color ?? GOLD, 0.7) });
      break;
    case 'willow':
      sphere(eng, x, y, n(64), V * 0.85, gold, { ttl: 3.6, drag: 0.22, grav: 1.1, size: 1.6, trail: 8, fade: 0.6, trailColor: dim(GOLD, 0.75) });
      break;
    case 'kamuro':
      sphere(eng, x, y, n(110), V * 1.2, gold, { ttl: 4.2, drag: 0.2, grav: 1.0, size: 1.7, trail: 6, fade: 0.55, trailColor: dim(GOLD, 0.7) });
      sphere(eng, x, y, n(30), V * 0.4, css(WHITE), { ttl: 1.6, drag: 0.1, grav: 0.3, size: 2, flicker: 0.6 });
      break;
    case 'ring':
      ring(eng, x, y, n(44), V, c, { ttl: 1.5, drag: 0.13, grav: 0.4, size: 2.3 });
      break;
    case 'saturn':
      ring(eng, x, y, n(48), V * 1.05, c, { ttl: 1.6, drag: 0.13, grav: 0.4, size: 2.3 });
      sphere(eng, x, y, n(46), V * 0.5, c2, { ttl: 1.4, drag: 0.13, grav: 0.45, size: 1.9 });
      break;
    case 'palm': {
      const arms = 8 + Math.floor(rnd() * 3);
      const o = { ttl: 2.2, drag: 0.25, grav: 1.0, size: 3, trail: 55 * q, trailColor: gold, fade: 0.7 };
      for (let i = 0; i < arms; i++) {
        const a = (i / arms) * TAU + rnd() * 0.3;
        const s = V * (0.9 + rnd() * 0.25);
        eng.P.add(x, y, Math.cos(a) * s, Math.sin(a) * s, o.ttl, c, o);
      }
      break;
    }
    case 'crossette': {
      const arms = 12;
      const o = { ttl: 0.72, drag: 0.2, grav: 0.3, size: 2.6, trail: 22 * q, die: 2, aux: V * 0.42, fade: 0.3 };
      const base = rnd() * TAU;
      for (let i = 0; i < arms; i++) {
        const a = base + (i / arms) * TAU;
        eng.P.add(x, y, Math.cos(a) * V * 0.95, Math.sin(a) * V * 0.95, o.ttl, c, o);
      }
      break;
    }
    case 'crackle':
      sphere(eng, x, y, n(70), V * 0.95, dim(GOLD, 0.8), { ttl: 1.15, drag: 0.1, grav: 0.5, size: 1.4, die: 1, fade: 0.5 }, 0.7);
      eng.emit('crackle', { x, delay: 0.75, dur: 0.9, level: size });
      break;
    case 'strobe':
      sphere(eng, x, y, n(70), V * 0.8, c2, { ttl: 3.2, drag: 0.08, grav: 0.35, size: 2.2, flicker: eng.calm ? 0 : 0.72, fade: 0.4 });
      break;
    case 'salute':
      sphere(eng, x, y, n(36), V * 1.3, css(WHITE), { ttl: 0.4, drag: 0.02, grav: 0, size: 2 });
      break;
    case 'peony':
    default:
      sphere(eng, x, y, n(100), V, c, { ttl: 1.5, drag: 0.13, grav: 0.5, size: 2.1 });
      if (spec.color2) sphere(eng, x, y, n(36), V * 0.45, c2, { ttl: 1.3, drag: 0.13, grav: 0.5, size: 1.9 });
  }

  eng.flash(x, y, spec.type === 'salute' ? WHITE : (spec.color ?? GOLD), spec.type === 'salute' ? size * 1.6 : size);
}

// A single rising star with a thick spark tail. `angle` is measured from straight up.
export function comet(eng, x, y, angle, speed, color, ttl = 1.5) {
  eng.P.add(
    x, y, Math.sin(angle) * speed, -Math.cos(angle) * speed, ttl, css(color),
    { drag: 0.42, grav: 0.55, size: 3, trail: 70 * eng.q, trailColor: css(GOLD), fade: 0.6 }
  );
}

// A ground burst: a fountain cone thrown upward.
export function mine(eng, x, y, color, size = 1) {
  const V = 0.5 * eng.U * size;
  const c = css(color);
  const count = Math.round(34 * eng.q);
  for (let i = 0; i < count; i++) {
    const a = (rnd() - 0.5) * 0.7;
    const s = V * (0.45 + rnd());
    eng.P.add(x, y, Math.sin(a) * s, -Math.cos(a) * s, 1.0 + rnd() * 0.5, c, { drag: 0.2, grav: 0.9, size: 2 });
  }
  eng.flash(x, y, color, 0.4);
}

// Second stage for particles that carry a `die` code.
export function onDeath(eng, p) {
  if (p.die === 1) {
    const white = css(WHITE);
    for (let i = 0; i < 3; i++) {
      const a = rnd() * TAU, s = 50 + rnd() * 130;
      eng.P.add(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, 0.1 + rnd() * 0.2, white, { low: true, size: 1.3, drag: 0.05, grav: 0 });
    }
    eng.P.add(p.x, p.y, 0, 0, 0.09, white, { size: 3.2, grav: 0 });
  } else if (p.die === 2) {
    const base = rnd() * TAU;
    for (let i = 0; i < 4; i++) {
      const a = base + (i / 4) * TAU;
      eng.P.add(p.x, p.y, Math.cos(a) * p.aux, Math.sin(a) * p.aux, 0.75, p.color, { drag: 0.15, grav: 0.4, size: 2.2, trail: 14 * eng.q });
    }
    if (rnd() < 0.34) eng.emit('pop', { x: p.x });
  }
}
