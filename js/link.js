// Link options. Pure functions: no DOM, no clock.
//
//   ?scene=sydney          which harbour to open
//   ?seed=3735928559       which show to play first (the show's own seed)
//   ?theme=ember-jade      which colour theme that show used
//   ?ambient=1             start in ambient (TV) mode
//   ?voyage=1              start with voyage mode on (?voyage=0: off)
//   ?debug=1               show a small frame-rate meter
//
// A "Copy link" link carries scene + seed + theme, so the receiver's first
// show is the same show the sender saw.

// "Ember & Jade" -> "ember-jade"
export function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const ID = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const SEED_MAX = 4294967295; // seeds are unsigned 32-bit numbers

function id(value) {
  if (value === null) return null;
  const v = value.trim().toLowerCase();
  return ID.test(v) ? v : null;
}

// Reads a query string such as "?scene=sydney&seed=42". Anything that is
// missing or does not look right becomes null (false for ambient and debug), so a
// broken link never breaks the page.
export function parseLink(search = '') {
  const p = new URLSearchParams(search);

  const rawSeed = p.get('seed');
  const seed = rawSeed !== null && /^\d{1,10}$/.test(rawSeed.trim()) && Number(rawSeed) <= SEED_MAX
    ? Number(rawSeed)
    : null;

  // An on/off option: "?ambient" alone also counts as on.
  const flag = (name) => p.has(name) && !['0', 'false', 'no', 'off'].includes(p.get(name).trim().toLowerCase());

  // Voyage mode has three answers: on, off, or "not said" (null), in which
  // case the visitor's saved choice is used.
  const voyage = p.has('voyage') ? flag('voyage') : null;

  return { scene: id(p.get('scene')), seed, theme: id(p.get('theme')), ambient: flag('ambient'), debug: flag('debug'), voyage };
}

// Builds the link to share. `href` is the address of the current page; any
// old query string or #hash is dropped. `show` is { scene, seed, theme }.
export function buildShareLink(href, show) {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('scene', show.scene);
  url.searchParams.set('seed', String(show.seed >>> 0));
  if (show.theme) url.searchParams.set('theme', show.theme);
  return url.toString();
}
