// The postcard: its words, its file name and its sizes (js/postcard.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { postcardCaption, postcardDetail, postcardFileName, postcardRoute, postcardLayout, POSTCARD_MAX_SIDE } from '../js/postcard.js';
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
    assert.ok(Math.abs(p.w / p.h - w / h) < 0.01, `${w}x${h}: the picture changed shape`);
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
    assert.ok(L.brandSize > L.captionSize && L.captionSize > L.detailSize);
    assert.ok(L.detailSize >= 9, 'small words must stay readable');
  }
  assert.equal(postcardLayout(2400, 1223).stacked, false, 'wide: name left, caption right');
  assert.equal(postcardLayout(1170, 2532).stacked, true, 'tall: words stacked in the middle');
});
