// Pooled particle system with a hard cap, so the frame rate stays steady.
// Units: CSS pixels and seconds.

const NONE = {};

export class Particles {
  constructor(max = 1800) {
    this.max = max;
    this.items = [];
    this.pool = [];
    this.scale = 1;      // line width multiplier (set by the engine per screen size)
    this.onDie = null;   // called for particles that have a `die` code
  }

  get count() { return this.items.length; }

  clear() {
    while (this.items.length) this.pool.push(this.items.pop());
  }

  // `low: true` marks decoration (trail sparks). Those are refused first when
  // the system gets close to the cap, so the main stars always get through.
  add(x, y, vx, vy, ttl, color, o = NONE) {
    const limit = o.low ? this.max * 0.8 : this.max;
    if (this.items.length >= limit) return null;
    const p = this.pool.pop() || {};
    p.x = p.px = x;
    p.y = p.py = y;
    p.vx = vx;
    p.vy = vy;
    p.life = 0;
    p.ttl = ttl;
    p.color = color;
    p.drag = o.drag ?? 0.2;        // share of speed kept after one second
    p.grav = o.grav ?? 1;          // gravity multiplier
    p.size = o.size ?? 1.6;
    p.fade = o.fade ?? 1;          // < 1 stays bright longer
    p.flicker = o.flicker ?? 0;    // chance to skip a frame (strobe / glitter)
    p.trail = o.trail ?? 0;        // sparks left behind per second
    p.trailColor = o.trailColor ?? color;
    p.die = o.die ?? 0;            // 1 = crackle pop, 2 = crossette split
    p.aux = o.aux ?? 0;
    p.floor = o.floor ?? 0;        // dies when it falls below this y (0 = off)
    p.acc = 0;
    this.items.push(p);
    return p;
  }

  update(dt, gravity) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life += dt;
      if (p.life >= p.ttl || (p.floor && p.y >= p.floor)) {
        const last = items.pop();
        if (last !== p) items[i] = last;
        if (p.die && this.onDie) this.onDie(p);
        this.pool.push(p);
        continue;
      }
      const k = Math.pow(p.drag, dt);
      p.vx *= k;
      p.vy = p.vy * k + gravity * p.grav * dt;
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.trail) {
        p.acc += p.trail * dt;
        while (p.acc >= 1) {
          p.acc -= 1;
          this.add(
            p.x, p.y,
            (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16,
            0.25 + Math.random() * 0.45, p.trailColor,
            { low: true, size: 1, drag: 0.3, grav: 0.5, flicker: 0.3 }
          );
        }
      }
    }
  }

  draw(ctx) {
    const items = this.items;
    ctx.lineCap = 'round';
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      if (p.flicker && Math.random() < p.flicker) continue;
      let a = 1 - p.life / p.ttl;
      if (p.fade !== 1) a = Math.pow(a, p.fade);
      ctx.globalAlpha = a;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * this.scale;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
