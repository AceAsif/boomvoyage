// Postcard: a PNG picture of the sky as it is right now, on a paper-coloured
// card with a caption. Nothing here runs until the camera button is pressed,
// so it costs the show nothing.
//
// The words and the sizes are plain functions (tested in Node). Only
// drawPostcard() touches a canvas.

export const POSTCARD_MAX_SIDE = 1920;   // longest side of the picture, in pixels

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "Paris · Show No. 4". Without a show number, just the place.
export function postcardCaption({ name, showNo }) {
  const place = String(name || 'BoomVoyage').trim();
  const n = Math.floor(Number(showNo));
  return n >= 1 ? `${place} · Show No. ${n}` : place;
}

// The small line under the caption: "France · 12 November 2026".
// Only the place and the day: no names, no addresses.
export function postcardDetail({ country, date }) {
  const parts = [];
  if (country) parts.push(String(country).trim());
  if (date instanceof Date && !Number.isNaN(date.getTime())) parts.push(`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`);
  return parts.join(' · ');
}

// "boomvoyage-paris-show-4.png": lower case, only letters, digits and dashes.
export function postcardFileName({ id, showNo }) {
  const place = String(id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const n = Math.floor(Number(showNo));
  return ['boomvoyage', place, n >= 1 ? `show-${n}` : ''].filter(Boolean).join('-') + '.png';
}

// Phones and tablets get the share sheet when it can take a picture file;
// everything else downloads the file.
export function postcardRoute({ canShareFiles, touch }) {
  return canShareFiles && touch ? 'share' : 'download';
}

// A screen this much taller than wide is "phone-shaped" (a phone held
// upright). Its postcard is not the whole tall screen but a 4:5 card.
export const PHONE_TALL = 1.3;
export const PHONE_PICTURE = 5 / 4;      // height / width of the picture on a phone card: 4:5

// Sizes of the card for a source canvas of srcW x srcH pixels.
// The picture keeps its shape, is never made bigger than the source, and its
// longest side is at most `maxSide` (a phone canvas can be 2500 pixels tall:
// more than a postcard needs). The paper border and the caption band grow
// with the picture. Tall pictures stack the words in the middle.
//
// `source` is the part of the canvas that goes on the card: all of it,
// except on a phone-shaped screen (see phoneLayout). `view` is only used
// there: { horizon, skylineTop }, both in canvas pixels from the top.
export function postcardLayout(srcW, srcH, maxSide = POSTCARD_MAX_SIDE, view = {}) {
  if (srcH > srcW * PHONE_TALL) return phoneLayout(srcW, srcH, maxSide, view);
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
  const border = Math.round(Math.min(48, Math.max(18, Math.min(w, h) * 0.04)));
  const stacked = w < h * 1.2;
  const band = Math.round(border * (stacked ? 4.5 : 2.7));
  return {
    scale, stacked, border, band, phone: false,
    source: { x: 0, y: 0, w: srcW, h: srcH },
    picture: { x: border, y: border, w, h },
    width: w + border * 2,
    height: border + h + band,
    brandSize: Math.round(border * (stacked ? 1.25 : 1.1)),
    captionSize: Math.round(border * 0.78),
    detailSize: Math.max(9, Math.round(border * (stacked ? 0.38 : 0.3))),
  };
}

// The card for a phone held upright. The picture is 4:5 (a shape that
// phones and photo apps show large). It is the full width of the screen
// but only part of its height: the city, a thin strip of water under it
// and the sky with the fireworks above it. The empty top of the sky and
// the dark water at the bottom are left out, so the city fills the frame.
// The caption is large.
function phoneLayout(srcW, srcH, maxSide, view) {
  const scale = Math.min(1, maxSide / (srcW * 1.2));
  const w = Math.max(1, Math.round(srcW * scale));
  const border = Math.round(Math.min(48, Math.max(18, w * 0.035)));
  const width = w + border * 2;
  const h = Math.round(w * PHONE_PICTURE);
  const band = Math.round(width * 0.18);
  const height = border + h + band;

  // Which rows of the screen: 6% of the picture is water, the rest is the
  // city and as much sky as fits (the fireworks burst high). If the skyline
  // is very tall, the picture moves up (down to 3% water) to keep some sky
  // above the highest roof.
  const sh = Math.min(srcH, Math.round(h / scale));
  const horizon = Number.isFinite(view.horizon) ? view.horizon : srcH * 0.7;
  let top = horizon + sh * 0.06 - sh;
  if (Number.isFinite(view.skylineTop)) top = Math.min(top, Math.max(view.skylineTop - sh * 0.07, horizon + sh * 0.03 - sh));
  top = Math.round(Math.min(srcH - sh, Math.max(0, top)));

  return {
    scale, stacked: true, border, band, phone: true,
    source: { x: 0, y: top, w: srcW, h: sh },
    picture: { x: border, y: border, w, h },
    width, height,
    captionSize: Math.round(width * 0.058),
    brandSize: Math.round(width * 0.042),
    detailSize: Math.max(9, Math.round(width * 0.02)),
  };
}

// When to take the picture. A postcard asked for at the start of a show
// would show an almost empty sky, so we watch for a moment and keep the
// frame with the most light. Pure logic: feed it the time (seconds) and how
// much light is in the frame now; it answers
//   { keep: true }  this is the best frame so far: copy it;
//   { done: true }  stop watching and use the last kept frame.
// `active` is false when no show is on and the sky is empty: then the first
// frame is taken at once, as before.
// It stops when the light has clearly passed its peak (it fell to `fall` of
// the best, `settle` seconds or more after it) or after `maxWait` seconds.
// Light below `real` is not a peak (a single rocket on its way up). The
// numbers fit the page's own measure of light (skyLight in main.js), where
// one ordinary burst gives about 0.7 to 0.9 and a finale 1 to 2.
export function createMomentPicker({ maxWait = 3.5, settle = 0.4, fall = 0.5, real = 0.6 } = {}) {
  let t0 = null, best = -1, bestAt = 0;
  return {
    get best() { return best; },
    feed(t, light, active = true) {
      const value = Number.isFinite(light) ? Math.max(0, light) : 0;
      if (t0 === null) {
        t0 = bestAt = t;
        best = value;
        return { keep: true, done: !active };
      }
      const keep = value > best * 1.04 + 0.01;
      if (keep) { best = value; bestAt = t; }
      const peaked = best >= real && t - bestAt >= settle && value <= best * fall;
      return { keep, done: !active || peaked || t - t0 >= maxWait };
    },
  };
}

const PAPER = '#f4ecdc';
const INK = '#1b1728';
const GOLD = '#a06d24';      // the site's gold, darkened so it reads on paper
const SOFT = 'rgba(27,23,40,0.62)';

// Draws the card and returns it as a new canvas.
//   source = the canvas with the scene and fireworks (copied as it is now);
//   info   = { name, country, showNo, date };
//   fonts  = { display, text } font-family lists (the site's own);
//   view   = { horizon, skylineTop } in canvas pixels (phone cards only).
export function drawPostcard(source, info, fonts = {}, view = {}) {
  const L = postcardLayout(source.width, source.height, POSTCARD_MAX_SIDE, view);
  const display = fonts.display || 'Georgia, serif';
  const text = fonts.text || 'system-ui, sans-serif';
  const card = document.createElement('canvas');
  card.width = L.width;
  card.height = L.height;
  const x = card.getContext('2d');

  x.fillStyle = PAPER;
  x.fillRect(0, 0, L.width, L.height);

  const p = L.picture;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.fillStyle = '#04050f';
  x.fillRect(p.x, p.y, p.w, p.h);
  x.drawImage(source, L.source.x, L.source.y, L.source.w, L.source.h, p.x, p.y, p.w, p.h);
  // A hairline around the picture, like the edge of a print.
  x.strokeStyle = 'rgba(27,23,40,0.35)';
  x.lineWidth = 1;
  x.strokeRect(p.x - 0.5, p.y - 0.5, p.w + 1, p.h + 1);

  const caption = postcardCaption(info);
  const detail = postcardDetail(info).toUpperCase();
  const tagline = "FIREWORKS FROM THE WORLD'S WATERFRONTS";
  const top = p.y + p.h;
  const spaced = (px) => { if ('letterSpacing' in x) x.letterSpacing = `${px}px`; };
  x.textBaseline = 'alphabetic';

  // The name as on the site: "Boom" upright, "Voyage" in gold italic.
  const brand = (left, baseline) => {
    spaced(0);
    x.textAlign = 'left';
    x.font = `400 ${L.brandSize}px ${display}`;
    x.fillStyle = INK;
    x.fillText('Boom', left, baseline);
    const w1 = x.measureText('Boom').width;
    x.font = `italic 400 ${L.brandSize}px ${display}`;
    x.fillStyle = GOLD;
    x.fillText('Voyage', left + w1, baseline);
  };
  const brandWidth = () => {
    spaced(0);
    x.font = `400 ${L.brandSize}px ${display}`;
    const w1 = x.measureText('Boom').width;
    x.font = `italic 400 ${L.brandSize}px ${display}`;
    return w1 + x.measureText('Voyage').width;
  };
  const small = (words, at, baseline, align) => {
    x.font = `500 ${L.detailSize}px ${text}`;
    spaced(L.detailSize * 0.22);
    x.textAlign = align;
    x.fillStyle = SOFT;
    x.fillText(words, at, baseline);
    spaced(0);
  };
  const title = (at, baseline, align) => {
    x.font = `italic 400 ${L.captionSize}px ${display}`;
    // A very long place name is made smaller rather than cut off.
    const wide = x.measureText(caption).width;
    if (L.phone && wide > p.w) x.font = `italic 400 ${Math.floor(L.captionSize * p.w / wide)}px ${display}`;
    x.textAlign = align;
    x.fillStyle = INK;
    x.fillText(caption, at, baseline);
  };

  if (L.phone) {
    // Phone card: the place and the show first and largest, the name of
    // the site under it.
    const mid = L.width / 2;
    title(mid, top + L.band * 0.4, 'center');
    brand(mid - brandWidth() / 2, top + L.band * 0.68);
    if (detail) small(detail, mid, top + L.band * 0.86, 'center');
  } else if (L.stacked) {
    const mid = L.width / 2;
    brand(mid - brandWidth() / 2, top + L.band * 0.36);
    title(mid, top + L.band * 0.62, 'center');
    if (detail) small(detail, mid, top + L.band * 0.82, 'center');
  } else {
    const line1 = top + L.band * 0.56, line2 = top + L.band * 0.82;
    brand(p.x, line1);
    small(tagline, p.x, line2, 'left');
    title(p.x + p.w, line1, 'right');
    if (detail) small(detail, p.x + p.w, line2, 'right');
  }
  return card;
}
