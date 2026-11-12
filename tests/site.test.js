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

// ---------- install as an app ----------

const manifestLink = html.match(/<link\s+rel="manifest"\s+href="([^"]+)"/);
const manifestText = manifestLink ? fs.readFileSync(path.join(ROOT, manifestLink[1]), 'utf8') : '';

test('index.html links a web app manifest, and it is valid JSON', () => {
  assert.ok(manifestLink, 'no <link rel="manifest">');
  assert.doesNotThrow(() => JSON.parse(manifestText));
});

test('the manifest has what a browser needs to offer "Install"', () => {
  const m = JSON.parse(manifestText);
  assert.equal(m.name, 'BoomVoyage');
  assert.equal(m.short_name, 'BoomVoyage');
  assert.ok(m.short_name.length <= 12, 'longer names are cut off under the icon');
  assert.ok(['standalone', 'fullscreen'].includes(m.display));
  assert.equal(m.orientation, 'any');
  assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/i);
  assert.equal(m.theme_color, meta('theme-color'), 'the manifest and the page should name the same colour');
  assert.ok((m.description || '').length > 20);
});

test('start_url and scope are relative, so they work under /boomvoyage/', () => {
  const m = JSON.parse(manifestText);
  for (const key of ['start_url', 'scope']) {
    assert.equal(typeof m[key], 'string');
    assert.ok(m[key].startsWith('./'), `${key} "${m[key]}" must start with ./`);
    assert.ok(!/^[a-z]+:/i.test(m[key]) && !m[key].startsWith('/'));
  }
  // Resolved the way a browser does it, from where the manifest is served.
  const at = new URL(manifestLink[1], SITE);
  assert.equal(new URL(m.start_url, at).href, SITE);
  assert.equal(new URL(m.scope, at).href, SITE);
  assert.ok(new URL(m.start_url, at).href.startsWith(new URL(m.scope, at).href), 'the start page must be inside the scope');
});

test('every manifest icon exists, is a PNG of the size it says, and the needed sizes are there', () => {
  const m = JSON.parse(manifestText);
  const have = new Set();
  for (const icon of m.icons) {
    assert.ok(!icon.src.startsWith('/') && !/^[a-z]+:/i.test(icon.src), `${icon.src} must be relative`);
    const file = path.join(ROOT, path.dirname(manifestLink[1]), icon.src);
    assert.ok(fs.existsSync(file), `${icon.src} does not exist`);
    const size = pngSize(file);
    assert.equal(`${size.width}x${size.height}`, icon.sizes, icon.src);
    assert.equal(icon.type, 'image/png');
    assert.ok(size.bytes < 150 * 1024, `${icon.src} is ${Math.round(size.bytes / 1024)} KB`);
    assert.ok(![4, 6].includes(size.colourType), `${icon.src} has see-through pixels; app icons must be solid`);
    have.add(`${icon.sizes} ${icon.purpose}`);
  }
  for (const need of ['192x192 any', '512x512 any', '512x512 maskable']) assert.ok(have.has(need), `missing icon: ${need}`);
});

test('index.html has the iPhone home-screen tags and a 180x180 touch icon', () => {
  const touch = html.match(/<link\s+rel="apple-touch-icon"\s+href="([^"]+)"/);
  assert.ok(touch, 'no apple-touch-icon');
  const size = pngSize(path.join(ROOT, touch[1]));
  assert.equal(size.width, 180);
  assert.equal(size.height, 180);
  assert.ok(![4, 6].includes(size.colourType), 'iPhone turns see-through pixels black');
  assert.equal(meta('apple-mobile-web-app-capable'), 'yes');
  assert.equal(meta('mobile-web-app-capable'), 'yes');
  assert.equal(meta('apple-mobile-web-app-title'), 'BoomVoyage');
  assert.ok(['black', 'black-translucent', 'default'].includes(meta('apple-mobile-web-app-status-bar-style')));
  assert.match(html, /viewport-fit=cover/, 'needed so the page reaches under the iPhone status bar');
});

test('there is no service worker (nothing can serve an old version after a deploy)', () => {
  const sources = [html, ...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'))];
  for (const text of sources) assert.ok(!/serviceWorker\s*\.\s*register/.test(text), 'a service worker is registered');
});
