// Keeps the screen awake while ambient (TV) mode is on.
//
// 1. Best way: the Screen Wake Lock API. The browser lets go of the lock by
//    itself when the tab is hidden, so refresh() asks again when it is shown.
// 2. If that API is missing or refuses: a tiny silent video made from a
//    canvas. Many browsers keep the screen on while a video plays. This is
//    "best effort": it is not guaranteed to work everywhere.
// 3. If neither works: nothing breaks. The screen may dim like on any page,
//    and the visitor can change the screen timeout in the device settings.
//
// `nav` and `doc` can be replaced, so this can be tested without a browser.

export function createScreenLock({
  nav = globalThis.navigator,
  doc = globalThis.document,
  makeFallback = () => silentVideo(doc),
} = {}) {
  const hasApi = !!(nav && nav.wakeLock && typeof nav.wakeLock.request === 'function');
  let wanted = false;     // does the page want the screen kept awake?
  let mode = 'none';      // 'api', 'fallback' or 'none'
  let sentinel = null;
  let fallback = null;
  let busy = null;        // the request that is on its way, so we never ask twice

  const visible = () => !doc || doc.visibilityState !== 'hidden';

  async function acquire() {
    if (hasApi) {
      try {
        const s = await nav.wakeLock.request('screen');
        if (!wanted) { await s.release(); return false; } // told to stop while waiting
        sentinel = s;
        mode = 'api';
        if (s.addEventListener) {
          s.addEventListener('release', () => {
            if (sentinel === s) { sentinel = null; mode = 'none'; }
          });
        }
        return true;
      } catch { /* refused (battery saver, hidden page...): try the fallback */ }
    }
    try {
      fallback = fallback || makeFallback();
      if (fallback && (await fallback.start())) {
        if (wanted) { mode = 'fallback'; return true; }
        fallback.stop();
        return false;
      }
    } catch { /* not possible here */ }
    mode = 'none';
    return false;
  }

  const lock = {
    get supported() { return hasApi; },
    get mode() { return mode; },
    get active() { return mode !== 'none'; },

    // Ask to keep the screen awake. Resolves to true when it is.
    async request() {
      wanted = true;
      if (mode !== 'none') return true;
      if (!visible()) return false;  // refresh() tries again when the page is shown
      if (!busy) busy = acquire().finally(() => { busy = null; });
      return busy;
    },

    // Call when the page becomes visible again.
    async refresh() {
      return wanted ? lock.request() : false;
    },

    async release() {
      wanted = false;
      const s = sentinel;
      sentinel = null;
      mode = 'none';
      try { if (s) await s.release(); } catch { /* already released */ }
      try { if (fallback) fallback.stop(); } catch { /* nothing to stop */ }
    },
  };
  return lock;
}

// A 4x4 canvas turned into a muted, looping, nearly invisible video.
function silentVideo(doc) {
  if (!doc || typeof doc.createElement !== 'function') return null;
  const canvas = doc.createElement('canvas');
  canvas.width = canvas.height = 4;
  if (typeof canvas.captureStream !== 'function') return null;
  const ctx = canvas.getContext('2d');
  let video = null;
  let timer = 0;
  let flip = 0;
  return {
    async start() {
      video = doc.createElement('video');
      video.muted = true;
      video.loop = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none';
      video.srcObject = canvas.captureStream(5);
      doc.body.append(video);
      // A stream only produces frames when the picture changes.
      timer = setInterval(() => {
        flip ^= 1;
        ctx.fillStyle = flip ? '#000' : '#010101';
        ctx.fillRect(0, 0, 4, 4);
      }, 1000);
      await video.play();
      return true;
    },
    stop() {
      clearInterval(timer);
      if (video) { video.pause(); video.remove(); video = null; }
    },
  };
}
