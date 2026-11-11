// Automatic quality. Pure logic: no DOM, no clock.
//
// The fireworks (trail) layer is the most expensive thing to draw, and its
// cost grows with its number of pixels. Some browsers handle a full-size
// layer easily (Chrome), some do not (Firefox on a high-DPI screen).
// So we do not guess from the browser's name. We watch the real frame times
// while fireworks are in the air, and only if the browser is clearly falling
// behind do we make the layer smaller, one step at a time. A fast browser
// never loses anything. We never go back up, so the picture does not pump.

export function createGovernor({
  levels = [1, 0.8, 0.67],  // size of the trail layer, as a share of full size
  windowMs = 1500,          // judge over this much loaded time
  settleMs = 700,           // ignore frames right after a change (resizing hiccup)
  ratio = 1.25,             // "falling behind" = average frame 25% longer than the screen's own frame...
  floorMs = 15,             // ...and also longer than this (above ~66 fps nobody needs help)
} = {}) {
  let level = 0;
  let base = Infinity;      // the screen's own frame time: the fastest frame we have seen
  let sum = 0;
  let frames = 0;
  let settle = 0;

  return {
    get level() { return level; },
    get scale() { return levels[level]; },
    get base() { return base; },

    // Call once per frame with the time since the last frame. `loaded` says
    // whether fireworks are in the air (idle frames are not judged).
    // Returns the level to use.
    frame(ms, loaded) {
      if (!(ms > 0) || ms > 250) { sum = 0; frames = 0; return level; } // a pause, not a slow frame
      if (ms >= 4 && ms < base) base = ms;
      if (!loaded) { sum = 0; frames = 0; return level; }
      if (settle > 0) { settle -= ms; return level; }
      sum += ms;
      frames += 1;
      if (sum < windowMs) return level;
      const mean = sum / frames;
      sum = 0;
      frames = 0;
      if (level < levels.length - 1 && mean > Math.max(base * ratio, floorMs)) {
        level += 1;
        settle = settleMs;
      }
      return level;
    },
  };
}
