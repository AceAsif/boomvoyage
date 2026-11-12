// The parts of the site that other apps read: the link preview (Open Graph
// and Twitter tags in index.html) and, further down, the install-as-app files.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://aceasif.github.io/boomvoyage/';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// The content of <meta property="..."> or <meta name="...">, or null.
function meta(key) {
  const tag = html.match(new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`));
  return tag ? tag[1] : null;
}

// Width and height of a PNG file, read from its header.
function pngSize(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.subarray(1, 4).toString('latin1'), 'PNG', `${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length, colourType: b[25] };
}

// The file in this project that a full site address points at.
function localFile(url) {
  assert.ok(url.startsWith(SITE), `${url} must start with ${SITE}`);
  return path.join(ROOT, url.slice(SITE.length));
}

// ---------- link preview ----------

test('index.html has the Open Graph tags for a link preview', () => {
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('og:site_name'), 'BoomVoyage');
  assert.ok(meta('og:title')?.includes('BoomVoyage'));
  assert.ok((meta('og:description') || '').length >= 40, 'needs a real description');
  assert.equal(meta('og:url'), SITE);
});

test('the preview image address is absolute and points at a file that exists', () => {
  const image = meta('og:image');
  assert.ok(image, 'og:image is missing');
  assert.match(image, /^https:\/\//, 'apps that fetch the preview need the full address');
  const file = localFile(image);
  assert.ok(fs.existsSync(file), `${file} does not exist`);
});

test('the preview image is a 1200x630 PNG under 300 KB, and the tags say so', () => {
  const size = pngSize(localFile(meta('og:image')));
  assert.equal(size.width, 1200);
  assert.equal(size.height, 630);
  assert.ok(size.bytes < 300 * 1024, `preview is ${Math.round(size.bytes / 1024)} KB`);
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.equal(meta('og:image:type'), 'image/png');
  assert.ok((meta('og:image:alt') || '').length > 10);
});

test('index.html has the Twitter card tags, with the same picture', () => {
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.ok(meta('twitter:title')?.includes('BoomVoyage'));
  assert.equal(meta('twitter:description'), meta('og:description'));
  assert.equal(meta('twitter:image'), meta('og:image'));
});

test('index.html names a theme colour', () => {
  assert.match(meta('theme-color') || '', /^#[0-9a-f]{6}$/i);
});

test('the page still loads its own files by relative paths (the site lives in a sub-folder)', () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:'));
  assert.ok(refs.length >= 2);
  for (const u of refs) {
    assert.ok(!u.startsWith('/'), `"${u}" starts at the server root: it breaks under /boomvoyage/`);
    if (!/^https?:/.test(u)) assert.ok(fs.existsSync(path.join(ROOT, u.split(/[?#]/)[0])), `"${u}" does not exist`);
  }
});
