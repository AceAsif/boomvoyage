// Canvas engine: owns the frame loop, the layers and the fireworks physics.
// It knows nothing about any one city. Everything place-specific comes from
// the scene config passed to setScene().

import { Particles } from './particles.js';
import { createGovernor } from './quality.js';
import { burst, comet, mine, onDeath, css, GOLD, WHITE, BURST_TYPES } from './fireworks.js';

const DEFAULT_PALETTE = {
  sky: [[0, '#03040d'], [0.6, '#0a1030'], [1, '#1b1f4a']],
  water: [[0, '#0b1030'], [1, '#02030a']],
  star: '#ffffff',
};

const REFLECT = 0.6;     // how much the water squashes a reflection
const GLOW_SCALE = 0.25; // the bloom / reflection buffer is quarter size

// Trails. The fireworks layer is a black picture that only ever gets light
// added to it. Each frame it is dimmed a little, which makes the trails.
// Dimming alone can never reach black with 8-bit pixels: very faint values
// (1-5 out of 255) round back to themselves and would stay for ever as a
// thin haze. So after dimming we also SUBTRACT one step, a fixed number of
// times per second. Subtracting always reaches zero.
const FADE_PER_FRAME = 0.8;  // share of light kept per 1/60 s
const SUBTRACT_RATE = 60;    // brightness steps removed per second
const IDLE_AFTER = 1.5;      // seconds of quiet before the layer is left alone

function makeLayer() {
  const c = document.createElement('canvas');
  return { c, x: c.getContext('2d') };
}

// Small seeded random generator so stars stay in place when the window resizes.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Engine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.calm = !!opts.reducedMotion;
    this.fx = makeLayer();     // fireworks, with fading trails
    this.glow = makeLayer();   // small blurred copy of fx: bloom + water reflection
    this.sky = makeLayer();
    this.land = makeLayer();
    this.water = makeLayer();
    // The skyline split into its red, green and blue parts (see paintLit).
    this.lit = [makeLayer(), makeLayer(), makeLayer()];
    this.litBand = { y: 0, h: 0 };
    this.P = new Particles();
    this.P.onDie = (p) => onDeath(this, p);
    this.rockets = [];
    this.falls = [];
    this.twinkles = [];
    this.light = { x: 0, y: 0, r: 255, g: 220, b: 180, i: 0 };
    this.listeners = {};
    this.scene = null;
    this.view = null;
    this.rig = {};
    this.time = 0;
    this.dt = 1 / 60;
    this.subAcc = 0;
    this.lastBusy = -10;
    this.fxLit = false;
    this.last = 0;
    this.running = false;
    this.onTick = null;
    // For measuring (?debug=1). `stats` records frame times; `skip` can turn
    // single drawing parts off (for example 'water') to see what they cost.
    this.stats = null;
    this.skip = new Set();
    // Makes the fireworks layer smaller if (and only if) this browser cannot
    // keep up with it at full size. See quality.js.
    this.governor = createGovernor();
    this.fxScale = 1;
    this.frame = this.frame.bind(this);
  }

  on(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, data) {
    const list = this.listeners[name];
    if (list) for (const fn of list) fn(data);
  }

  setScene(scene) {
    this.scene = scene;
    this.clear();
    this.resize();
  }

  clear() {
    this.P.clear();
    this.rockets.length = 0;
    this.falls.length = 0;
    this.light.i = 0;
    if (this.view) this.wipeFx();
  }

  get busy() {
    return this.P.count > 0 || this.rockets.length > 0 || this.falls.length > 0;
  }

  // ---------- layout ----------

  resize() {
    const scene = this.scene;
    if (!scene) return;
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    const small = Math.min(w, h) < 600;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 2 : 1.5);
    const portrait = h > w;
    const hf = typeof scene.horizon === 'number'
      ? scene.horizon
      : (portrait ? scene.horizon?.portrait : scene.horizon?.landscape) ?? 0.74;
    const hz = Math.round(h * hf);
    // Pixels per scene unit. In portrait a scene may say how many units must
    // fit across the screen, so its landmarks are never cut off.
    const span = portrait ? scene.portraitSpan : 0;
    const S = span ? w / span : Math.max(w / 1000, h / 1400);
    const fx = typeof scene.focusX === 'number'
      ? scene.focusX
      : (portrait ? scene.focusX?.portrait : scene.focusX?.landscape) ?? 0;

    this.view = {
      w, h, dpr, hz, S, portrait,
      // Reference size for bursts. A tall phone sky gets bigger fireworks.
      U: portrait ? Math.min(w * 2, hz * 1.5) : Math.min(w * 1.6, hz * 1.5),
      px: (x) => w / 2 + (x - fx) * S, // scene x (-500..500) to pixels
      py: (y) => hz - y * S,      // scene y (up from the waterline) to pixels
    };
    this.U = this.view.U;
    this.G = 0.085 * this.U;
    this.q = this.calm ? 0.45 : small ? 0.65 : 1;
    this.P.max = this.calm ? 500 : small ? 1000 : 1800;
    this.P.scale = Math.max(0.75, Math.min(1.4, this.U / 1000));

    for (const layer of [this, this.sky, this.land, this.water]) {
      const c = layer.c || layer.canvas;
      const x = layer.x || layer.ctx;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.sizeFx();
    this.wipeFx();
    this.glow.c.width = Math.max(1, Math.round(w * GLOW_SCALE));
    this.glow.c.height = Math.max(1, Math.round(h * GLOW_SCALE));

    this.rig = scene.rig ? scene.rig(this.view) : {};
    this.paintSky();
    this.paintLand();
    this.paintLit();
    this.paintWater();
    if (!this.running) this.render();
  }

  paintSky() {
    const { w, hz } = this.view;
    const x = this.sky.x;
    const pal = this.scene.palette || DEFAULT_PALETTE;
    const g = x.createLinearGradient(0, 0, 0, hz);
    for (const [stop, color] of pal.sky || DEFAULT_PALETTE.sky) g.addColorStop(stop, color);
    x.fillStyle = g;
    x.fillRect(0, 0, w, hz + 2);

    const r = seeded(7);
    const count = Math.round((this.scene.stars ?? 220) * Math.min(1.5, (w * hz) / 900000 + 0.4));
    x.fillStyle = pal.star || '#fff';
    this.twinkles.length = 0;
    for (let i = 0; i < count; i++) {
      const sx = r() * w;
      const sy = Math.pow(r(), 1.7) * hz * 0.85; // more stars high up, fewer in the city haze
      const s = 0.4 + r() * r() * 1.5;
      x.globalAlpha = (0.25 + r() * 0.6) * (1 - sy / hz);
      x.fillRect(sx, sy, s, s);
      if (i % 9 === 0) this.twinkles.push({ x: sx, y: sy, s: s + 0.4, sp: 0.6 + r() * 2, ph: r() * 6.28 });
    }
    x.globalAlpha = 1;
    if (this.scene.drawSky) this.scene.drawSky(x, this.view);
  }

  paintLand() {
    const { w, h } = this.view;
    this.land.x.clearRect(0, 0, w, h);
    if (this.scene.drawSkyline) this.scene.drawSkyline(this.land.x, this.view);
  }

  // Prepares "the skyline lit by a burst". A burst of colour (r, g, b) should
  // add skyline x colour on top of the skyline. Doing that multiplication
  // every frame is very slow in Firefox (it is done without the graphics
  // card). So the skyline is split ONCE into a red-only, a green-only and a
  // blue-only picture. Each frame, lightLand() just adds those three with
  // the strength of r, g and b. The result is the same, the cost is tiny.
  paintLit() {
    const { w, hz, dpr } = this.view;
    const land = this.land.c;

    // Only the rows that contain skyline are kept, to save memory.
    const probe = document.createElement('canvas');
    probe.width = 32;
    probe.height = Math.max(1, Math.ceil(hz / 4));
    const px = probe.getContext('2d', { willReadFrequently: true });
    px.drawImage(land, 0, 0, land.width, Math.round(hz * dpr), 0, 0, probe.width, probe.height);
    const data = px.getImageData(0, 0, probe.width, probe.height).data;
    let first = probe.height;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]) { first = Math.floor(i / 4 / probe.width); break; }
    }
    const top = Math.max(0, first * 4 - 8);
    const band = (this.litBand = { y: top, h: Math.max(0, hz - top) });
    if (!band.h) return;

    const tints = ['#ff0000', '#00ff00', '#0000ff'];
    this.lit.forEach((layer, i) => {
      layer.c.width = land.width;
      layer.c.height = Math.max(1, Math.round(band.h * dpr));
      const x = layer.x;
      x.setTransform(1, 0, 0, 1, 0, 0);
      const sy = Math.round(band.y * dpr);
      x.globalCompositeOperation = 'source-over';
      x.drawImage(land, 0, sy, land.width, layer.c.height, 0, 0, land.width, layer.c.height);
      x.globalCompositeOperation = 'multiply';        // keep one colour channel
      x.fillStyle = tints[i];
      x.fillRect(0, 0, layer.c.width, layer.c.height);
      x.globalCompositeOperation = 'destination-in';  // and the skyline's own shape
      x.drawImage(land, 0, sy, land.width, layer.c.height, 0, 0, land.width, layer.c.height);
    });
  }

  paintWater() {
    const { w, h, hz } = this.view;
    const x = this.water.x;
    const pal = this.scene.palette || DEFAULT_PALETTE;
    x.clearRect(0, 0, w, h);
    const g = x.createLinearGradient(0, hz, 0, h);
    for (const [stop, color] of pal.water || DEFAULT_PALETTE.water) g.addColorStop(stop, color);
    x.fillStyle = g;
    x.fillRect(0, hz, w, h - hz);

    // Mirror the skyline into the water, squashed and dimmed.
    x.save();
    x.beginPath();
    x.rect(0, hz, w, h - hz);
    x.clip();
    x.globalAlpha = 0.55;
    x.translate(0, hz + hz * REFLECT);
    x.scale(1, -REFLECT);
    x.drawImage(this.land.c, 0, 0, w, h);
    x.restore();

    const fade = x.createLinearGradient(0, hz, 0, h);
    fade.addColorStop(0, 'rgba(2,3,10,0)');
    fade.addColorStop(1, 'rgba(2,3,10,0.75)');
    x.fillStyle = fade;
    x.fillRect(0, hz, w, h - hz);
    if (this.scene.drawWater) this.scene.drawWater(x, this.view);
  }

  // ---------- loop ----------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  frame(now) {
    if (!this.running) return;
    // Clamp the step: after a background pause we continue, we do not jump.
    if (this.stats) this.stats.push(now - this.last);
    if (this.governor) {
      this.governor.frame(now - this.last, this.P.count > 150);
      if (this.governor.scale !== this.fxScale) this.setFxScale(this.governor.scale);
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.dt = dt;
    this.time += dt;
    if (this.onTick) this.onTick(now, dt);
    this.update(dt);
    this.render();
    requestAnimationFrame(this.frame);
  }

  update(dt) {
    const gold = css(GOLD);

    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.t += dt;
      const f = Math.min(1, r.t / r.T);
      const e = 1 - (1 - f) * (1 - f); // fast at first, slowing to the top
      const x = r.x0 + (r.x1 - r.x0) * f + Math.sin(f * 8 + r.ph) * r.sway * f;
      const y = r.y0 + (r.y1 - r.y0) * e;
      this.P.add(x, y, 0, 0, 0.16, gold, { size: 2.2, drag: 1, grav: 0 });
      r.acc += 46 * this.q * dt;
      while (r.acc >= 1) {
        r.acc -= 1;
        this.P.add(x, y, (Math.random() - 0.5) * 22, 20 + Math.random() * 40, 0.3 + Math.random() * 0.4, gold,
          { low: true, size: 1, drag: 0.4, grav: 0.6, flicker: 0.3 });
      }
      if (f >= 1) {
        this.rockets.splice(i, 1);
        burst(this, x, y, r.spec);
        this.emit('burst', { x, size: r.spec.size ?? 1, type: r.spec.type });
      }
    }

    for (let i = this.falls.length - 1; i >= 0; i--) {
      const fall = this.falls[i];
      fall.t += dt;
      if (fall.t >= fall.dur) { this.falls.splice(i, 1); continue; }
      this.pourWaterfall(fall, dt);
    }

    this.P.update(dt, this.G);
    this.light.i *= Math.pow(0.03, dt);
  }

  // A curtain of sparks falling from a line (for example a bridge deck).
  // It lights from the middle outward, then thins out at the end.
  pourWaterfall(fall, dt) {
    const pts = fall.pts;
    const spread = Math.min(1, fall.t / 1.6);
    const ending = Math.min(1, (fall.dur - fall.t) / 1.5);
    fall.acc += 430 * this.q * ending * (0.3 + 0.7 * spread) * dt;
    const white = css(WHITE), gold = css(GOLD);
    const S = this.view.S;
    while (fall.acc >= 1) {
      fall.acc -= 1;
      const u = 0.5 + (Math.random() - 0.5) * spread;
      const k = u * (pts.length - 1);
      const a = pts[Math.floor(k)], b = pts[Math.min(pts.length - 1, Math.floor(k) + 1)];
      const m = k - Math.floor(k);
      this.P.add(
        a.x + (b.x - a.x) * m, a.y + (b.y - a.y) * m,
        (Math.random() - 0.5) * 12, Math.random() * 30,
        3, Math.random() < 0.6 ? white : gold,
        { drag: 0.7, grav: 1.7, size: 1.5, flicker: this.calm ? 0 : 0.35, fade: 0.45, floor: this.view.hz + Math.random() * 5 * S }
      );
    }
  }

  // Gives the fireworks layer its size: the screen's pixels times fxScale.
  // It is always drawn stretched over the whole picture, so a smaller layer
  // only makes the sparks a little softer.
  sizeFx() {
    const { w, h, dpr } = this.view;
    const k = dpr * this.fxScale;
    this.fx.c.width = Math.max(1, Math.round(w * k));
    this.fx.c.height = Math.max(1, Math.round(h * k));
    this.fx.x.setTransform(k, 0, 0, k, 0, 0);
  }

  // Changes the size of the fireworks layer in the middle of a show without
  // a blink: what is on it now is copied across.
  setFxScale(scale) {
    if (scale === this.fxScale || !this.view) return;
    const { w, h } = this.view;
    const keep = document.createElement('canvas');
    keep.width = this.fx.c.width;
    keep.height = this.fx.c.height;
    keep.getContext('2d').drawImage(this.fx.c, 0, 0);
    this.fxScale = scale;
    this.sizeFx();
    const lit = this.fxLit;
    this.wipeFx();
    this.fx.x.drawImage(keep, 0, 0, w, h);
    this.fxLit = lit;
  }

  // Make the fireworks layer plain black again.
  wipeFx() {
    const fx = this.fx.x;
    fx.globalCompositeOperation = 'source-over';
    fx.globalAlpha = 1;
    fx.fillStyle = '#000';
    fx.fillRect(0, 0, this.view.w, this.view.h);
    this.fxLit = false;
  }

  // Dim the fireworks layer, then subtract, so old light really reaches zero.
  fadeFx(w, h) {
    const fx = this.fx.x;
    fx.globalCompositeOperation = 'source-over';
    fx.fillStyle = `rgba(0,0,0,${1 - Math.pow(FADE_PER_FRAME, this.dt * 60)})`;
    fx.fillRect(0, 0, w, h);

    this.subAcc += this.dt * SUBTRACT_RATE;
    const n = Math.min(6, Math.floor(this.subAcc));
    if (n < 1 || this.skip.has('subtract')) return;
    this.subAcc -= Math.floor(this.subAcc);
    // max(0, pixel - n) with blend modes: invert, add n, invert back.
    fx.globalCompositeOperation = 'difference';
    fx.fillStyle = '#fff';
    fx.fillRect(0, 0, w, h);
    fx.globalCompositeOperation = 'lighter';
    fx.fillStyle = `rgb(${n},${n},${n})`;
    fx.fillRect(0, 0, w, h);
    fx.globalCompositeOperation = 'difference';
    fx.fillStyle = '#fff';
    fx.fillRect(0, 0, w, h);
  }

  flash(x, y, color, size = 1) {
    const L = this.light;
    const k = Math.min(1, 0.5 + size * 0.3);
    L.x = x; L.y = y;
    L.r += (color[0] - L.r) * k;
    L.g += (color[1] - L.g) * k;
    L.b += (color[2] - L.b) * k;
    L.i = Math.min(1.25, L.i + 0.5 * size);

    const fx = this.fx.x;
    const rad = 0.09 * this.U * size;
    const g = fx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,250,240,0.95)');
    g.addColorStop(0.35, `rgba(${color[0]},${color[1]},${color[2]},0.45)`);
    g.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
    fx.globalCompositeOperation = 'lighter';
    fx.fillStyle = g;
    fx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    this.fxLit = true;
  }

  // ---------- drawing ----------

  render() {
    const { w, h, hz, dpr } = this.view;
    const ctx = this.ctx, fx = this.fx.x, glow = this.glow.x;
    const L = this.light;
    const calm = this.calm;
    const skip = this.skip;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.sky.c, 0, 0, w, h);

    if (!calm && !skip.has('twinkle')) {
      ctx.fillStyle = '#fff';
      for (const s of this.twinkles) {
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.time * s.sp + s.ph);
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
    }

    // Fireworks layer: dim what is there, then add this frame's sparks.
    if (this.busy) { this.lastBusy = this.time; this.fxLit = true; }
    if (this.fxLit) {
      if (this.time - this.lastBusy > IDLE_AFTER) this.wipeFx();
      else {
        if (!skip.has('fade')) this.fadeFx(w, h);
        fx.globalCompositeOperation = 'lighter';
        if (!skip.has('particles')) this.P.draw(fx);
      }
    }

    if (!skip.has('glow')) {
      glow.globalCompositeOperation = 'copy';
      glow.drawImage(this.fx.c, 0, 0, this.glow.c.width, this.glow.c.height);
    }

    // The sky itself lights up in the colour of the last burst.
    ctx.globalCompositeOperation = 'lighter';
    if (L.i > 0.01 && !skip.has('skyglow')) {
      const rad = this.U * 0.95;
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, rad);
      const a = (calm ? 0.05 : 0.15) * L.i;
      g.addColorStop(0, `rgba(${L.r | 0},${L.g | 0},${L.b | 0},${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, hz);
      if (!calm) {
        // ...and a thin even wash, so the whole sky answers a little.
        ctx.fillStyle = `rgba(${L.r | 0},${L.g | 0},${L.b | 0},${Math.min(0.08, 0.06 * L.i)})`;
        ctx.fillRect(0, 0, w, hz);
      }
    }
    if (!skip.has('fx')) ctx.drawImage(this.fx.c, 0, 0, w, h);
    if (!skip.has('glow')) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(this.glow.c, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.land.c, 0, 0, w, h);

    // Pale surfaces (sails, stone, windows) catch the light of each burst.
    if (!calm && L.i > 0.02 && !skip.has('light')) this.lightLand(ctx, w);

    this.renderWater(ctx, w, h, hz, dpr);
  }

  // Adds "skyline x burst colour" on top of the skyline: dark silhouettes
  // stay dark, pale things glow. Only adding light is used (see paintLit).
  lightLand(ctx, w) {
    const L = this.light;
    const band = this.litBand;
    if (!band.h) return;
    const k = Math.min(0.9, 0.6 * L.i) / 255;
    const parts = [L.r, L.g, L.b];
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const alpha = Math.min(1, k * parts[i]);
      if (alpha < 0.004) continue;
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.lit[i].c, 0, band.y, w, band.h);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Water is drawn in thin rows, each shifted a little sideways, so the
  // reflections of the skyline and of the fireworks ripple.
  renderWater(ctx, w, h, hz, dpr) {
    const wh = h - hz;
    if (wh <= 0) return;
    const step = this.calm ? 6 : 3;
    const t = this.calm ? 0 : this.time;
    const gs = GLOW_SCALE;
    const pal = this.scene.palette || DEFAULT_PALETTE;
    ctx.fillStyle = (pal.water || DEFAULT_PALETTE.water)[0][1];
    ctx.fillRect(0, hz, w, wh);

    if (this.skip.has('water')) {
      ctx.drawImage(this.water.c, 0, hz * dpr, w * dpr, wh * dpr, 0, hz, w, wh);
      return;
    }
    for (let y = 0; y < wh; y += step) {
      const d = y / wh;
      const off = Math.sin(y * 0.23 + t * 1.7) * (0.5 + d * 5) + Math.sin(y * 0.071 - t * 0.9) * d * 4;
      ctx.drawImage(this.water.c, 0, (hz + y) * dpr, w * dpr, step * dpr, off, hz + y, w, step);
    }

    if (this.skip.has('reflect') || this.skip.has('glow')) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < wh; y += step) {
      const d = y / wh;
      const sy = (hz - (y + step) / REFLECT) * gs;
      if (sy < 0) break;
      const off = Math.sin(y * 0.23 + t * 1.7) * (0.5 + d * 5) + Math.sin(y * 0.071 - t * 0.9) * d * 4;
      ctx.globalAlpha = 0.7 * (1 - d * 0.6);
      ctx.drawImage(this.glow.c, 0, sy, w * gs, Math.max(1, (step / REFLECT) * gs), off, hz + y, w, step);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- firing ----------

  pan(x) { return Math.max(-1, Math.min(1, (x / this.view.w) * 2 - 1)) * 0.8; }

  // Run one cue from a show. Positions in cues are 0..1 so that the same
  // show works on any screen and in any scene.
  fire(cue) {
    const v = this.view;
    const x = v.w * (0.06 + 0.88 * (cue.x ?? 0.5));
    switch (cue.kind) {
      case 'shell': {
        const hgt = cue.h ?? 0.6;
        // Portrait: the skyline is low, so bursts use more of the tall sky.
        const top = v.portrait ? 0.3 + 0.56 * hgt : 0.36 + 0.46 * hgt;
        this.launch(x, v.hz + 4, x + (cue.drift ?? 0) * this.U * 0.06, v.hz - v.hz * top,
          0.95 + 0.55 * hgt + Math.random() * 0.08, cue, cue.whistle);
        break;
      }
      case 'comet':
        comet(this, x, v.hz, cue.angle ?? 0, (cue.speed ?? 1) * this.U * 0.95, cue.color ?? GOLD);
        this.emit('launch', { x, dur: 0.5, whistle: false });
        break;
      case 'mine':
        mine(this, x, v.hz, cue.color ?? GOLD, cue.size ?? 1);
        this.emit('burst', { x, size: 0.45, type: 'mine' });
        break;
      case 'waterfall':
        if (this.rig.waterfall) {
          this.falls.push({ t: 0, dur: cue.dur ?? 8, acc: 0, pts: this.rig.waterfall });
          const pts = this.rig.waterfall;
          this.emit('waterfall', { x: (pts[0].x + pts[pts.length - 1].x) / 2, dur: cue.dur ?? 8 });
        }
        break;
      case 'crown':
        if (this.rig.crown) {
          for (const p of this.rig.crown) comet(this, p.x, p.y, p.angle, (cue.speed ?? 0.5) * this.U, cue.color ?? GOLD, 1.1);
          this.emit('launch', { x: v.w / 2, dur: 0.6, whistle: false });
          this.emit('burst', { x: v.w / 2, size: 0.5, type: 'mine' });
        }
        break;
    }
  }

  launch(x0, y0, x1, y1, T, spec, whistle) {
    this.rockets.push({ x0, y0, x1, y1, T, t: 0, acc: 0, spec, ph: Math.random() * 6.28, sway: 3 + Math.random() * 5 });
    this.emit('launch', { x: x0, dur: T, whistle: !!whistle });
  }

  // A viewer tapped the sky: send one shell to that point.
  launchAt(x, y, colors) {
    const v = this.view;
    const ty = Math.min(y, v.hz - v.hz * 0.18);
    const types = BURST_TYPES.filter((t) => t !== 'salute' && t !== 'kamuro');
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const spec = {
      type: pick(types),
      color: pick(colors),
      color2: pick(colors),
      size: 0.75 + Math.random() * 0.4,
    };
    this.launch(x + (Math.random() - 0.5) * 40, v.hz + 4, x, ty, 0.85 + ((v.hz - ty) / v.hz) * 0.6, spec, Math.random() < 0.5);
  }
}
