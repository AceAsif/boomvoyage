// A pretend 2D canvas context for tests. It accepts every drawing call and
// counts them, so a scene's drawing code can run in Node. It cannot show a
// picture; it only proves the code runs without errors and really draws.

export function fakeContext() {
  const calls = { total: 0 };
  const gradient = { addColorStop() {} };
  const target = {
    calls,
    globalAlpha: 1,
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  };
  return new Proxy(target, {
    get(obj, name) {
      if (name in obj) return obj[name];
      // Any other method (fillRect, arc, save...) is a counted no-op.
      return (...args) => {
        for (const a of args) {
          if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`${String(name)} got a bad number: ${a}`);
        }
        calls.total += 1;
        calls[name] = (calls[name] || 0) + 1;
      };
    },
    set(obj, name, value) {
      if (name === 'globalAlpha' && !(value >= 0 && value <= 1.0000001)) throw new Error(`globalAlpha set to ${value}`);
      obj[name] = value;
      return true;
    },
  });
}

// A view like the engine builds in resize(), for a screen of w x h pixels.
export function fakeView(scene, w, h) {
  const portrait = h > w;
  const pickSide = (value, fallback) => (typeof value === 'number' ? value : (portrait ? value?.portrait : value?.landscape) ?? fallback);
  const hz = Math.round(h * pickSide(scene.horizon, 0.74));
  const span = portrait ? scene.portraitSpan : 0;
  const S = span ? w / span : Math.max(w / 1000, h / 1400);
  const fx = pickSide(scene.focusX, 0);
  return {
    w, h, dpr: 1, hz, S, portrait,
    U: portrait ? Math.min(w * 2, hz * 1.5) : Math.min(w * 1.6, hz * 1.5),
    px: (x) => w / 2 + (x - fx) * S,
    py: (y) => hz - y * S,
  };
}

export const SCREENS = [[1600, 815], [1280, 720], [844, 390], [1024, 768], [768, 1024], [390, 844], [360, 740]];
