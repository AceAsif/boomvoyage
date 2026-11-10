import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLink, buildShareLink, slugify } from '../js/link.js';

test('slugify makes safe ids from theme names', () => {
  assert.equal(slugify('Ember & Jade'), 'ember-jade');
  assert.equal(slugify('Harbour Blue'), 'harbour-blue');
  assert.equal(slugify('  Southern  Gold! '), 'southern-gold');
});

test('an empty or missing query gives all defaults', () => {
  const none = { scene: null, seed: null, theme: null, ambient: false };
  assert.deepEqual(parseLink(''), none);
  assert.deepEqual(parseLink(), none);
  assert.deepEqual(parseLink('?'), none);
  assert.deepEqual(parseLink('?utm_source=mail&x=1'), none);
});

test('a full share link is read correctly', () => {
  assert.deepEqual(
    parseLink('?scene=sydney&seed=3735928559&theme=ember-jade'),
    { scene: 'sydney', seed: 3735928559, theme: 'ember-jade', ambient: false },
  );
});

test('the leading ? is optional and the order does not matter', () => {
  assert.deepEqual(parseLink('theme=waratah&seed=7&scene=sydney'), parseLink('?scene=sydney&seed=7&theme=waratah'));
});

test('ids are lower-cased and trimmed', () => {
  const p = parseLink('?scene=%20Sydney%20&theme=Harbour-Blue');
  assert.equal(p.scene, 'sydney');
  assert.equal(p.theme, 'harbour-blue');
});

test('seed accepts 0 and the largest 32-bit number, and nothing else', () => {
  assert.equal(parseLink('?seed=0').seed, 0);
  assert.equal(parseLink('?seed=4294967295').seed, 4294967295);
  for (const bad of ['4294967296', '-1', '1.5', 'abc', '', '12345678901', '1e3', '0x10', '+5']) {
    assert.equal(parseLink(`?seed=${encodeURIComponent(bad)}`).seed, null, `seed=${bad}`);
  }
});

test('odd scene and theme values are ignored, not trusted', () => {
  for (const bad of ['', '../etc', '<script>', 'a b', 'x'.repeat(41), '-lead']) {
    const p = parseLink(`?scene=${encodeURIComponent(bad)}&theme=${encodeURIComponent(bad)}`);
    assert.equal(p.scene, null, `scene=${bad}`);
    assert.equal(p.theme, null, `theme=${bad}`);
  }
});

test('ambient: on for 1, true, yes, on and a bare flag; off for 0, false, no, off and when missing', () => {
  for (const on of ['?ambient=1', '?ambient=true', '?ambient=YES', '?ambient=on', '?ambient', '?ambient=']) {
    assert.equal(parseLink(on).ambient, true, on);
  }
  for (const off of ['?ambient=0', '?ambient=false', '?ambient=no', '?ambient=OFF', '?scene=sydney']) {
    assert.equal(parseLink(off).ambient, false, off);
  }
});

test('buildShareLink makes a link that parseLink reads back', () => {
  const link = buildShareLink('https://example.github.io/boomvoyage/', { scene: 'sydney', seed: 123456, theme: 'waratah' });
  assert.equal(link, 'https://example.github.io/boomvoyage/?scene=sydney&seed=123456&theme=waratah');
  assert.deepEqual(parseLink(new URL(link).search), { scene: 'sydney', seed: 123456, theme: 'waratah', ambient: false });
});

test('buildShareLink drops the old query string and hash, and keeps the folder', () => {
  const link = buildShareLink('http://localhost:8123/app/index.html?ambient=1&seed=9#top', { scene: 'sydney', seed: 5, theme: 'jacaranda' });
  assert.equal(link, 'http://localhost:8123/app/index.html?scene=sydney&seed=5&theme=jacaranda');
});

test('buildShareLink keeps a seed with the top bit set as a positive number', () => {
  const link = buildShareLink('http://x.test/', { scene: 'sydney', seed: -1, theme: null });
  assert.equal(new URL(link).searchParams.get('seed'), '4294967295');
  assert.equal(new URL(link).searchParams.has('theme'), false);
});
