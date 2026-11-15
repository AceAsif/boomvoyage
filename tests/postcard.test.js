// The postcard: its words, its file name and its sizes (js/postcard.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { postcardCaption, postcardDetail, postcardFileName, postcardRoute, postcardLayout, createMomentPicker, POSTCARD_MAX_SIDE, PHONE_TALL, PHONE_PICTURE } from '../js/postcard.js';
import { scenes } from '../js/scenes/index.js';

test('the caption names the place and the show', () => {
  assert.equal(postcardCaption({ name: 'Paris', showNo: 4 }), 'Paris · Show No. 4');
  assert.equal(postcardCaption({ name: 'Sydney Harbour', showNo: 1 }), 'Sydney Harbour · Show No. 1');
  assert.equal(postcardCaption({ name: 'Dubai', showNo: 12.9 }), 'Dubai · Show No. 12');
});

test('without a real show number the caption is just the place', () => {
  for (const showNo of [0, -1, NaN, undefined, null, 'x']) assert.equal(postcardCaption({ name: 'London', showNo }), 'London');
  assert.equal(postcardCaption({ showNo: 2 }), 'BoomVoyage · Show No. 2');
});

test('the small line gives the country and the day, nothing personal', () => {
  assert.equal(postcardDetail({ country: 'France', date: new Date(2026, 10, 12, 21, 30) }), 'France · 12 November 2026');
  assert.equal(postcardDetail({ country: 'UK', date: new Date(2027, 0, 1) }), 'UK · 1 January 2027');
  assert.equal(postcardDetail({ country: 'UAE' }), 'UAE');
  assert.equal(postcardDetail({ country: 'UAE', date: new Date('nonsense') }), 'UAE');
  assert.equal(postcardDetail({}), '');
});

test('every real place gives a caption and a file name', () => {
  for (const scene of scenes) {
    assert.equal(postcardCaption({ name: scene.name, showNo: 3 }), `${scene.name} · Show No. 3`);
    assert.equal(postcardFileName({ id: scene.id, showNo: 3 }), `boomvoyage-${scene.id}-show-3.png`);
  }
});

test('the file name is safe on every system', () => {
  assert.equal(postcardFileName({ id: 'paris', showNo: 4 }), 'boomvoyage-paris-show-4.png');
  assert.equal(postcardFileName({ id: 'São Paulo / Rio', showNo: 2 }), 'boomvoyage-s-o-paulo-rio-show-2.png');
  assert.equal(postcardFileName({ id: '../../etc', showNo: 1 }), 'boomvoyage-etc-show-1.png');
  assert.equal(postcardFileName({ id: 'dubai' }), 'boomvoyage-dubai.png');
  assert.equal(postcardFileName({}), 'boomvoyage.png');
  for (const id of ['paris', 'A b', '', '***', 'x'.repeat(40)]) {
    assert.match(postcardFileName({ id, showNo: 7 }), /^boomvoyage(-[a-z0-9]+)*\.png$/);
  }
});

test('phones use the share sheet when it can take a file; everything else downloads', () => {
  assert.equal(postcardRoute({ canShareFiles: true, touch: true }), 'share');
  assert.equal(postcardRoute({ canShareFiles: false, touch: true }), 'download');
  assert.equal(postcardRoute({ canShareFiles: true, touch: false }), 'download', 'a desktop gets a file, not a share window');
  assert.equal(postcardRoute({ canShareFiles: false, touch: false }), 'download');
});

test('the picture is never larger than needed and never blown up', () => {
  // [source width, source height]: desktop at pixel ratio 1, 1.5 and 2; a phone at 3; a 4K screen.
  for (const [w, h] of [[1600, 815], [2400, 1223], [3200, 1630], [1170, 2532], [780, 1688], [3840, 2160], [360, 640]]) {
    const L = postcardLayout(w, h);
    const p = L.picture;
    assert.ok(Math.max(p.w, p.h) <= POSTCARD_MAX_SIDE, `${w}x${h}: picture ${p.w}x${p.h}`);
    assert.ok(p.w <= w && p.h <= h, `${w}x${h}: the picture was made bigger than the screen`);
    assert.ok(L.scale <= 1);
    // The picture has the shape of the part of the screen it shows (all of it, or the 4:5 part on a phone).
    assert.ok(Math.abs(p.w / p.h - L.source.w / L.source.h) < 0.01, `${w}x${h}: the picture was squeezed`);
    if (!L.phone) assert.ok(Math.abs(p.w / p.h - w / h) < 0.01, `${w}x${h}: the picture changed shape`);
    if (Math.max(w, h) <= POSTCARD_MAX_SIDE) assert.equal(L.scale, 1, 'small enough: kept pixel for pixel, so it stays sharp');
  }
});

test('a high-DPI screen gives a sharper postcard than a plain one of the same size', () => {
  const plain = postcardLayout(800, 600), sharp = postcardLayout(1600, 1200);
  assert.equal(plain.picture.w, 800);
  assert.equal(sharp.picture.w, 1600, 'all the pixels of the canvas are used');
});

test('the card has a paper border all round and a caption band below', () => {
  for (const [w, h] of [[1600, 815], [2400, 1223], [1170, 2532], [360, 640]]) {
    const L = postcardLayout(w, h);
    assert.ok(L.border >= 18 && L.border <= 48);
    assert.equal(L.picture.x, L.border);
    assert.equal(L.picture.y, L.border);
    assert.equal(L.width, L.picture.w + 2 * L.border);
    assert.equal(L.height, L.border + L.picture.h + L.band);
    assert.ok(L.band >= L.border * 2, 'room for the words');
    // Desktop: the site's name is the largest. Phone: the place and the show are.
    if (L.phone) assert.ok(L.captionSize > L.brandSize && L.brandSize > L.detailSize);
    else assert.ok(L.brandSize > L.captionSize && L.captionSize > L.detailSize);
    assert.ok(L.detailSize >= 9, 'small words must stay readable');
  }
  assert.equal(postcardLayout(2400, 1223).stacked, false, 'wide: name left, caption right');
  assert.equal(postcardLayout(1170, 2532).stacked, true, 'tall: words stacked in the middle');
});

// ---------- desktop cards must stay exactly as they were ----------

// The layout as it was before phone cards got their own shape, copied here
// so that any change to a desktop card is noticed.
function oldLayout(srcW, srcH, maxSide = 1920) {
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
  const border = Math.round(Math.min(48, Math.max(18, Math.min(w, h) * 0.04)));
  const stacked = w < h * 1.2;
  const band = Math.round(border * (stacked ? 4.5 : 2.7));
  return {
    scale, stacked, border, band,
    picture: { x: border, y: border, w, h },
    width: w + border * 2,
    height: border + h + band,
    brandSize: Math.round(border * (stacked ? 1.25 : 1.1)),
    captionSize: Math.round(border * 0.78),
    detailSize: Math.max(9, Math.round(border * (stacked ? 0.38 : 0.3))),
  };
}

test('desktop and other wide postcards are exactly as before, and show the whole screen', () => {
  // desktop windows at pixel ratio 1, 1.5, 2; 4K; a phone on its side; a tablet on its side; square; a little taller than wide
  const sizes = [[1600, 815], [2400, 1223], [3200, 1630], [3840, 2160], [1688, 780], [2048, 1536], [1000, 1000], [1000, 1250], [1280, 720], [1024, 768]];
  for (const [w, h] of sizes) {
    // What the page knows about the city must make no difference here.
    for (const view of [undefined, {}, { horizon: h * 0.74, skylineTop: h * 0.3 }]) {
      const L = postcardLayout(w, h, POSTCARD_MAX_SIDE, view);
      const { source, phone, ...rest } = L;
      assert.deepEqual(rest, oldLayout(w, h), `${w}x${h} changed`);
      assert.equal(phone, false);
      assert.deepEqual(source, { x: 0, y: 0, w, h }, `${w}x${h}: part of the screen was cut away`);
    }
  }
});

// ---------- the phone card ----------

// Phone screens held upright, in canvas pixels: [width, height, pixel ratio].
const PHONES = [[780, 1688, 2], [750, 1334, 2], [720, 1600, 2], [828, 1792, 2], [860, 1864, 2], [640, 1136, 2], [360, 640, 1], [1536, 2048, 1.5]];

test('a phone-shaped screen gives a 4:5 picture, not a tall thin one', () => {
  assert.equal(PHONE_PICTURE, 5 / 4);
  for (const [w, h] of PHONES) {
    assert.ok(h > w * PHONE_TALL);
    const L = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon: h * 0.7 });
    assert.equal(L.phone, true, `${w}x${h}`);
    const p = L.picture;
    assert.ok(Math.abs(p.h / p.w - 1.25) < 0.004, `${w}x${h}: picture ${p.w}x${p.h} is not 4:5`);
    // The card with its caption is taller than 4:5 but far from the old tall strip.
    const shape = L.height / L.width, before = oldLayout(w, h).height / oldLayout(w, h).width;
    assert.ok(shape > 1.25 && shape < 1.45, `${w}x${h}: card shape ${shape}`);
    if (h > w * 1.6) assert.ok(shape < before * 0.78, 'a phone card must be much less tall than before');
  }
  // The line between "phone" and "not phone".
  assert.equal(postcardLayout(1000, 1300).phone, false);
  assert.equal(postcardLayout(1000, 1301).phone, true);
});

test('the phone picture is the full width of the screen, sharp, and inside the screen', () => {
  for (const [w, h] of PHONES) {
    for (const view of [{}, { horizon: h * 0.7 }, { horizon: h * 0.7, skylineTop: h * 0.28 }, { horizon: h * 0.7, skylineTop: h * 0.02 }, { horizon: h * 5 }, { horizon: -40 }]) {
      const L = postcardLayout(w, h, POSTCARD_MAX_SIDE, view);
      const s = L.source;
      assert.equal(s.x, 0);
      assert.equal(s.w, w, 'the city is as wide as the frame');
      assert.ok(Number.isInteger(s.y) && s.y >= 0 && s.y + s.h <= h, `${w}x${h}: ${JSON.stringify(s)} leaves the screen`);
      assert.ok(Math.abs(s.h / s.w - 1.25) < 0.004);
      assert.ok(L.picture.w <= w && L.picture.h <= s.h + 1, 'never blown up');
      assert.ok(Math.max(L.picture.w, L.picture.h) <= POSTCARD_MAX_SIDE);
      if (w * 1.25 <= POSTCARD_MAX_SIDE) assert.equal(L.scale, 1, 'kept pixel for pixel');
    }
  }
});

test('the phone picture holds the waterline, a little water and mostly sky and city', () => {
  for (const [w, h] of PHONES) {
    const horizon = Math.round(h * 0.7);
    const s = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon }).source;
    const water = (s.y + s.h - horizon) / s.h;
    assert.ok(s.y < horizon && s.y + s.h > horizon, 'the waterline is in the picture');
    // (A tablet is hardly taller than 4:5: there is nothing to choose, nearly the whole screen is used.)
    if (h > w * 1.6) assert.ok(water > 0.03 && water < 0.1, `${w}x${h}: ${water} of the picture is water`);
    // The city is larger in the frame: the picture leaves out at least a quarter of the tall screen.
    if (h > w * 1.6) assert.ok(s.h <= h * 0.75);
  }
});

test('a very tall skyline moves the phone picture up, but the waterline stays in it', () => {
  const w = 780, h = 1688, horizon = 1182;
  const plain = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon, skylineTop: 900 }).source;
  assert.deepEqual(plain, postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon }).source, 'a low skyline changes nothing');
  const tall = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon, skylineTop: 250 }).source;
  assert.ok(tall.y < plain.y, 'the picture did not move up');
  assert.ok(tall.y + tall.h > horizon, 'the waterline was cut off');
  // A roof that fits is given some sky above it.
  const fits = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon, skylineTop: 320 }).source;
  assert.ok(fits.y <= 320 - fits.h * 0.05);
});

test('the phone caption is much bigger than before', () => {
  for (const [w, h] of PHONES) {
    const L = postcardLayout(w, h, POSTCARD_MAX_SIDE, { horizon: h * 0.7 });
    const before = oldLayout(w, h);
    assert.ok(L.captionSize >= before.captionSize * 1.5, `${w}x${h}: caption ${L.captionSize}, was ${before.captionSize}`);
    assert.ok(L.captionSize >= L.width * 0.05, 'the caption is at least a twentieth of the card wide per letter height');
    assert.ok(L.detailSize >= before.detailSize);
    // The three lines of words fit in the band.
    assert.ok(L.captionSize + L.brandSize + L.detailSize < L.band * 0.75);
  }
});

// ---------- when the picture is taken ----------

// Feeds a list of light levels, one every `step` seconds. Returns the time
// and level of the frame that would be on the card, and when it stopped.
function watch(levels, { step = 0.1, active = true, options } = {}) {
  const picker = createMomentPicker(options);
  let kept = null, stopped = null;
  for (let i = 0; i < levels.length; i++) {
    const t = i * step;
    const answer = picker.feed(t, levels[i], typeof active === 'function' ? active(t) : active);
    if (answer.keep) kept = { t, light: levels[i] };
    if (answer.done) { stopped = t; break; }
  }
  return { kept, stopped };
}

test('a quiet sky is taken at once, as before', () => {
  const r = watch([0, 0, 0, 5], { active: false });
  assert.deepEqual(r, { kept: { t: 0, light: 0 }, stopped: 0 });
});

test('at the start of a show the card waits for the fireworks', () => {
  // Nothing for a second, a rocket on its way up, then the burst.
  const levels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.1, 0.2, 0.2, 3.2, 2.9, 2.6, 2.2, 1.7, 1.2, 0.8, 0.5];
  const r = watch(levels);
  assert.equal(r.kept.light, 3.2, 'the brightest frame is the one on the card');
  assert.ok(r.stopped >= 1.8 && r.stopped < 2.2, 'it stops soon after the peak has passed');
});

test('the frame kept is always the brightest one seen so far', () => {
  let n = 3;
  const rand = () => { n = (n * 16807) % 2147483647; return (n % 1000) / 1000; };
  for (let run = 0; run < 50; run++) {
    const levels = Array.from({ length: 60 }, () => rand() * rand() * 12);
    const picker = createMomentPicker();
    let kept = -1, max = -1;
    for (let i = 0; i < levels.length; i++) {
      const answer = picker.feed(i * 0.05, levels[i]);
      max = Math.max(max, levels[i]);
      if (answer.keep) kept = levels[i];
      assert.ok(kept >= max / 1.05, `kept ${kept} but saw ${max}`);
      assert.equal(picker.best, kept);
      if (answer.done) break;
    }
  }
});

test('a single rocket on its way up is not taken for the peak', () => {
  // Faint light that comes and goes, then a real burst late in the wait.
  const levels = [0.2, 0.4, 0.2, 0.1, 0.3, 0.1, 0, 0.4, 0.1, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.2, 4.1, 3, 2.5, 1.5, 1];
  const r = watch(levels);
  assert.equal(r.kept.light, 4.1);
});

test('it never waits longer than three and a half seconds', () => {
  // Light that keeps growing slowly: no peak ever passes.
  const levels = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.01);
  const r = watch(levels);
  assert.ok(Math.abs(r.stopped - 3.5) < 0.11, `stopped at ${r.stopped}`);
  assert.ok(r.kept.light >= levels[35] / 1.05, 'the frame kept is as bright as the last one (within the 4% step)');
  // A dark show (nothing to see at all) also ends in time, with the first frame.
  const dark = watch(Array(200).fill(0));
  assert.ok(Math.abs(dark.stopped - 3.5) < 0.11);
  assert.deepEqual(dark.kept, { t: 0, light: 0 });
});

test('when the show ends during the wait, the card is made at once', () => {
  const levels = [0.5, 0.45, 0.4, 0.3, 0.25, 0.2, 0.1, 0.05, 0, 0, 0];
  const r = watch(levels, { active: (t) => t < 0.75 });
  assert.equal(r.kept.light, 0.5);
  assert.ok(Math.abs(r.stopped - 0.8) < 1e-9);
});

test('a brighter burst right after a peak is still caught', () => {
  // The light falls only a little (not to half) and then a bigger burst comes.
  const levels = [3, 2.8, 2.5, 2.3, 2.2, 2.1, 6.5, 6, 5, 4.2, 3.5, 2.5];
  const r = watch(levels);
  assert.equal(r.kept.light, 6.5);
});

test('odd light values do no harm', () => {
  const picker = createMomentPicker();
  assert.deepEqual(picker.feed(0, NaN), { keep: true, done: false });
  assert.equal(picker.feed(0.1, -5).keep, false);
  assert.equal(picker.feed(0.2, undefined).keep, false);
  assert.equal(picker.feed(0.3, 1).keep, true);
});

test('the default numbers fit the light the page measures', () => {
  // Measured on the page (phone size): one ordinary burst is about 0.7 to 0.9,
  // a rocket on its way up at most 0.4. Sampled every 0.2 s.
  const burst = [0.1, 0.1, 0.5, 0.7, 0.8, 0.7, 0.5, 0.6, 0.4, 0.5, 0.4, 0.3, 0.5, 0.6];
  const rocket = [0, 0.2, 0.3, 0.4, 0.3, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1];
  assert.equal(watch(burst, { step: 0.2 }).kept.light, 0.8);
  assert.ok(watch(burst, { step: 0.2 }).stopped >= 1.2, 'it stops only when the burst has faded to half, well after its peak');
  assert.equal(watch(rocket, { step: 0.2 }).stopped, null, 'a rocket alone must not end the wait');
});
