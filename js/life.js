// Life between shows. Small living details (a ferry, a shooting star, a bus)
// that appear while the countdown runs and the sky is quiet.
//
// This file is the director: it decides WHEN something happens. It has no
// canvas code and no clock of its own. What each event looks like is in the
// scene files: every scene has a `life` list, and each entry draws itself.
//
// Rules the director keeps:
//   - events only start while it is quiet (no show, no sparks in the air);
//   - a new one starts every 10 to 25 seconds, at most 2 at the same time;
//   - never the same event twice in a row, never two of the same group at once;
//   - every event is over (faded out) a little before the next show starts;
//   - if a show starts early ("Launch now"), everything fades out at once;
//   - time only moves when frames are drawn, so a hidden tab pauses it.
//
// It uses its OWN random numbers (lifeRandom). The fireworks use theirs
// (inside buildShow), so a shared link still plays the very same fireworks.
//
// A scene's event looks like this:
//   {
//     id: 'ferry',            // unique in the scene
//     group: 'water',         // optional: only one event of a group at a time
//     layer: 'water',         // 'sky' (behind the skyline), 'land' (in front
//                             // of it) or 'water' (on the water)
//     weight: 2,              // optional: how often it is picked (default 1)
//     duration: [20, 28],     // seconds, shortest and longest
//     calm: false,            // optional: false = skip with "reduce motion"
//     sound: 'horn',          // optional: a quiet sound when it starts
//     setup(r) { return {} }, // optional: random details, r() gives 0..1
//     draw(ctx, v, e) {}      // e: { t, dur, u (0..1), alpha, dir, p, calm }
//   }

export function lifeRandom(seed) {
  let a = (seed >>> 0) ^ 0x2545f491;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LIFE_DEFAULTS = {
  minGap: 10,      // seconds between the starts of two events...
  maxGap: 25,
  firstMin: 4,     // ...and before the first one of a quiet stretch
  firstMax: 9,
  maxActive: 2,
  guard: 2.5,      // every event is gone this long before the next show
  cutFade: 1.2,    // how fast events fade when a show starts early
};
// With "reduce motion": fewer events, one at a time.
export const LIFE_CALM = { minGap: 18, maxGap: 40, maxActive: 1 };

export function createLife(defs = [], opts = {}) {
  const calm = !!opts.calm;
  const cfg = { ...LIFE_DEFAULTS, ...(calm ? LIFE_CALM : {}), ...opts };
  const r = lifeRandom(opts.seed ?? 1);
  const pool = defs.filter((d) => !(calm && d.calm === false));
  const between = (lo, hi) => lo + r() * (hi - lo);

  const active = [];   // events on screen now
  const log = [];      // every event ever started: { id, at, dur }
  let clock = 0;       // seconds of drawn frames
  let wasQuiet = false;
  let nextAt = Infinity;
  let lastId = null;

  function begin(def, dur) {
    const e = {
      def, id: def.id, t: 0, dur, u: 0, alpha: 0, cutAt: null, calm,
      dir: r() < 0.5 ? 1 : -1,
      p: def.setup ? def.setup(r) : {},
    };
    active.push(e);
    log.push({ id: def.id, at: clock, dur });
    lastId = def.id;
    if (life.onStart) life.onStart(e);
    return e;
  }

  // Picks the next event: not the last one again, not a group that is already
  // on screen, and short enough to finish before the next show.
  function choose(room) {
    const busy = new Set(active.map((e) => e.def.group ?? e.def.id));
    const fits = pool.filter((d) => d.duration[0] <= room);
    if (!fits.length) return null;                       // nothing fits any more
    const free = fits.filter((d) => !busy.has(d.group ?? d.id));
    const fresh = free.filter((d) => d.id !== lastId);
    const list = fresh.length ? fresh : free;
    if (!list.length) return undefined;                  // only blocked for now
    let total = 0;
    for (const d of list) total += d.weight ?? 1;
    let x = r() * total;
    for (const d of list) { x -= d.weight ?? 1; if (x < 0) return d; }
    return list[list.length - 1];
  }

  const life = {
    active,
    log,
    onStart: null,
    get clock() { return clock; },

    // Call once per drawn frame.
    //   dt        seconds since the last frame
    //   remaining seconds until the next show starts
    //   quiet     true when no show is playing and the sky is clear
    tick(dt, remaining, quiet) {
      if (!(dt > 0)) return active;
      clock += dt;
      if (quiet && !wasQuiet) nextAt = clock + between(cfg.firstMin, cfg.firstMax);
      wasQuiet = quiet;

      for (let i = active.length - 1; i >= 0; i--) {
        const e = active[i];
        e.t += dt;
        // No time left to finish in peace: start fading now.
        if (e.cutAt === null && (!quiet || remaining < e.dur - e.t + cfg.guard)) e.cutAt = e.t;
        const fadeIn = Math.min(1.5, e.dur * 0.2);
        const fadeOut = Math.min(2, e.dur * 0.25);
        let alpha = Math.min(1, e.t / fadeIn, (e.dur - e.t) / fadeOut);
        if (e.cutAt !== null) alpha *= 1 - (e.t - e.cutAt) / cfg.cutFade;
        if (e.t >= e.dur || alpha <= 0) { active.splice(i, 1); continue; }
        e.alpha = alpha;
        e.u = e.t / e.dur;
      }

      if (quiet && clock >= nextAt && active.length < cfg.maxActive) {
        const room = remaining - cfg.guard;
        const def = choose(room);
        if (def === null) nextAt = Infinity;             // wait for the next quiet stretch
        else if (def === undefined) nextAt = clock + 3;  // try again soon
        else {
          begin(def, between(def.duration[0], Math.min(def.duration[1], room)));
          nextAt = clock + between(cfg.minGap, cfg.maxGap);
        }
      }
      return active;
    },

    // For testing and screenshots: start one event now, by id.
    force(id, dur) {
      const def = pool.find((d) => d.id === id);
      return def ? begin(def, dur ?? (def.duration[0] + def.duration[1]) / 2) : null;
    },
  };
  return life;
}

// Draws the active events of one layer. Each event is faded as a whole;
// inside its draw() an event may multiply ctx.globalAlpha but must use
// e.alpha as the base.
export function drawLife(ctx, v, active, layer) {
  for (let i = 0; i < active.length; i++) {
    const e = active[i];
    if ((e.def.layer ?? 'sky') !== layer) continue;
    ctx.save();
    ctx.globalAlpha = e.alpha;
    e.def.draw(ctx, v, e);
    ctx.restore();
  }
}
