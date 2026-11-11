// BoomVoyage — entry point. Connects the scene, the engine, the show
// schedule, the sound and the small UI. No city is named in this file:
// everything place-specific lives in js/scenes/.

import { Engine } from './engine.js';
import { scenes, getScene } from './scenes/index.js';
import { buildShow, createRunner, actAt } from './show.js';
import { Sound } from './audio.js';
import { parseLink, buildShareLink } from './link.js';
import { createScreenLock } from './wakelock.js';
import { createFrameStats, formatStats } from './stats.js';
import { createSchedule, isDue, restart, remainingMs, progress, formatCountdown } from './schedule.js';

const SCENE_KEY = 'boomvoyage.scene';
const IDLE_MS = 6000;

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('stage');
const ui = $('ui');
const engine = new Engine(canvas, { reducedMotion });
const sound = new Sound();

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode: keep going */ }
}

// Link options (see README): a shared link brings its own harbour and show.
const link = parseLink(location.search);
const linkScene = link.scene && scenes.some((s) => s.id === link.scene) ? link.scene : null;
let scene = getScene(linkScene ?? stored(SCENE_KEY));
// The shared show plays first, but only if its harbour exists here.
let pendingShared = link.seed !== null && (!link.scene || linkScene)
  ? { seed: link.seed, theme: link.theme }
  : null;
let lastShow = null;     // what "Copy link" shares: { scene, seed, theme }
let ambient = link.ambient; // ambient (TV) mode: only the show on screen
const screenLock = createScreenLock();
let started = false;     // true after "Tap to start"
let schedule = null;
let current = null;      // the show that is playing: { runner, startedAt }
let showCount = 0;
let lastTitle = null;
let titleTimer = 0;
let idleTimer = 0;

const tapColors = () => scene.show.palettes.flatMap((p) => p.colors);
const intervalMs = () => scene.show.intervalSeconds * 1000;

// ---------- shows ----------

function startShow(now = Date.now()) {
  if (!started) return;
  showCount += 1;
  const shared = pendingShared;
  pendingShared = null;
  const seed = shared ? shared.seed : (now ^ (showCount * 2654435761)) >>> 0;
  const show = buildShow(scene.show, seed, { calm: reducedMotion, avoid: lastTitle, theme: shared?.theme });
  lastTitle = show.title;
  lastShow = { scene: scene.id, seed: show.seed, theme: show.themeId };
  current = { runner: createRunner(show), startedAt: now };
  schedule = restart(schedule ?? createSchedule(intervalMs(), now), now);
  announce(show.title);
  updateClock();
}

function announce(title) {
  const el = $('showTitle');
  el.textContent = '';
  const small = document.createElement('small');
  small.textContent = `${scene.name} · Show No. ${showCount}`;
  el.append(small, title);
  el.classList.add('is-on');
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => el.classList.remove('is-on'), 5200);
}

// The caption with the name of the act that is playing. It fades out, the
// words change, and it fades back in. With reduced motion the words just change.
let shownAct = null;
let actTimer = 0;
function showAct(act, total) {
  const key = act ? act.key : null;
  if (key === shownAct) return;
  shownAct = key;
  clearTimeout(actTimer);
  const el = $('actCaption');
  if (!act) { el.classList.remove('is-on'); return; }
  const apply = () => {
    $('actNum').textContent = `Act ${act.index} of ${total}`;
    $('actName').textContent = act.label;
    el.classList.add('is-on');
  };
  if (reducedMotion || !el.classList.contains('is-on')) { apply(); return; }
  el.classList.remove('is-on');
  actTimer = setTimeout(apply, 420);
}

// Starts the next show when its time has come. If the tab is hidden we wait:
// the show plays as soon as the visitor comes back, and only once.
function checkSchedule() {
  if (!schedule || document.hidden) return;
  const now = Date.now();
  if (isDue(schedule, now)) startShow(now);
}

function updateClock() {
  const now = Date.now();
  const left = schedule ? remainingMs(schedule, now) : intervalMs();
  $('countdown').textContent = formatCountdown(left);
  $('barFill').style.width = `${((schedule ? progress(schedule, now) : 0) * 100).toFixed(2)}%`;
  $('clockLabel').textContent = current ? 'Showing now · next in' : 'Next show in';
}

// Called every frame. Show time comes from real timestamps, not frame counts.
engine.onTick = () => {
  checkSchedule();
  if (!current) { showAct(null); return; }
  const elapsed = (Date.now() - current.startedAt) / 1000;
  for (const cue of current.runner.due(elapsed)) engine.fire(cue);
  const show = current.runner.show;
  showAct(actAt(show, elapsed), show.timeline.length);
  if (current.runner.finished(elapsed)) { current = null; updateClock(); }
};

// ---------- sound ----------

// The engine reports what it draws; each report becomes a sound at once,
// so the boom lands on the same frame as the burst.
engine.on('launch', (e) => sound.launch({ pan: engine.pan(e.x), dur: e.dur, whistle: e.whistle }));
engine.on('burst', (e) => sound.boom({ pan: engine.pan(e.x), size: e.size, type: e.type }));
engine.on('crackle', (e) => sound.crackle({ pan: engine.pan(e.x), delay: e.delay, dur: e.dur, level: e.level }));
engine.on('pop', (e) => sound.pop({ pan: engine.pan(e.x) }));
engine.on('waterfall', (e) => sound.waterfall({ pan: engine.pan(e.x), dur: e.dur }));

function renderMute() {
  const btn = $('muteBtn');
  btn.setAttribute('aria-pressed', String(sound.muted));
  btn.setAttribute('aria-label', sound.muted ? 'Turn sound on' : 'Mute sound');
  btn.title = sound.muted ? 'Sound on (M)' : 'Mute (M)';
  const note = sound.muted
    ? 'Sound is muted. You can turn it on at any time.'
    : 'Sound is on. You can mute it at any time.';
  $('startNote').textContent = ambient ? `${note} Ambient mode: tap or press Esc to leave it.` : note;
}

function toggleMute() {
  sound.setMuted(!sound.muted);
  renderMute();
}

// ---------- scenes ----------

function renderScene() {
  $('sceneLabel').textContent = `${scene.name} · ${scene.country}`;
  $('startPlace').textContent = scene.tagline || `${scene.name}, ${scene.country}.`;
  const index = scenes.indexOf(scene) + 1;
  $('startKicker').textContent = `A fireworks voyage · Stop ${String(index).padStart(2, '0')}`;
  for (const li of $('sceneMenu').querySelectorAll('[role="option"]')) {
    li.setAttribute('aria-selected', String(li.dataset.id === scene.id));
  }
}

function setScene(id) {
  const next = getScene(id);
  closeMenu();
  if (next === scene) return;
  scene = next;
  store(SCENE_KEY, scene.id);
  current = null;
  lastTitle = null;
  lastShow = null;
  pendingShared = null;
  schedule = null;
  engine.setScene(scene);
  sound.setScene(scene.sound);
  renderScene();
  if (started) startShow(); // a new harbour says hello with a show
  updateClock();
}

function buildMenu() {
  const menu = $('sceneMenu');
  for (const s of scenes) {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.tabIndex = 0;
    li.dataset.id = s.id;
    const small = document.createElement('small');
    small.textContent = s.country;
    li.append(s.name, small);
    li.addEventListener('click', () => setScene(s.id));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setScene(s.id); }
    });
    menu.append(li);
  }
  const soon = document.createElement('li');
  soon.className = 'soon';
  soon.setAttribute('aria-disabled', 'true');
  soon.textContent = 'More harbours are on the way';
  menu.append(soon);
}

function openMenu() {
  $('sceneMenu').hidden = false;
  $('sceneBtn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('sceneMenu').hidden = true;
  $('sceneBtn').setAttribute('aria-expanded', 'false');
}
const menuOpen = () => !$('sceneMenu').hidden;

// ---------- share link ----------

let toastTimer = 0;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2400);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* no permission: try the old way */ }
  try {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.append(box);
    box.select();
    box.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  } catch { return false; }
}

// Last resort: show the link so it can be copied by hand.
function showLinkBox(url) {
  $('linkField').value = url;
  $('linkBox').hidden = false;
  $('linkField').focus();
  $('linkField').select();
}
function closeLinkBox() {
  if ($('linkBox').hidden) return false;
  $('linkBox').hidden = true;
  $('shareBtn').focus();
  return true;
}

async function shareLink() {
  if (!lastShow) return;
  const url = buildShareLink(location.href, lastShow);
  if (await copyText(url)) toast('Link copied');
  else showLinkBox(url);
}

// ---------- ambient (TV) mode ----------

// Keep the screen awake only while ambient mode is on and the show has started.
function syncScreenLock() {
  if (ambient && started) screenLock.request();
  else screenLock.release();
}

function setAmbient(on, { hint = false } = {}) {
  if (ambient === on) return;
  ambient = on;
  document.body.classList.toggle('ambient', on);
  $('ambientBtn').setAttribute('aria-pressed', String(on));
  renderMute();
  syncScreenLock();
  if (on) {
    closeMenu();
    closeLinkBox();
    if (hint) toast('Ambient mode · tap or press Esc to leave');
  } else {
    $('toast').classList.remove('is-on');
    wake();
  }
}

// ---------- fullscreen ----------

const root = document.documentElement;
const fsRequest = root.requestFullscreen || root.webkitRequestFullscreen;
const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function toggleFullscreen() {
  if (!fsRequest) return;
  try {
    const result = fsElement() ? fsExit.call(document) : fsRequest.call(root);
    if (result && result.catch) result.catch(() => {});
  } catch { /* the browser said no: nothing to do */ }
}

function renderFullscreen() {
  const on = !!fsElement();
  $('fsBtn').setAttribute('aria-label', on ? 'Leave fullscreen' : 'Fullscreen');
  $('fsBtn').setAttribute('aria-pressed', String(on));
}

// ---------- quiet UI ----------

// After a few seconds without input the controls dim, so the show has the
// screen. Any movement, tap or key brings them back.
function wake() {
  ui.classList.remove('is-idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (started && !menuOpen() && !ui.contains(document.activeElement)) ui.classList.add('is-idle');
    else wake();
  }, IDLE_MS);
}

// ---------- start ----------

function begin() {
  if (started) return;
  started = true;
  sound.start(scene.sound);       // inside the click, so the browser allows audio
  $('start').classList.add('is-gone');
  ui.classList.remove('is-hidden');
  startShow();
  wake();
  syncScreenLock();
}

// ---------- wiring ----------

// Handy in the browser console, e.g. boomvoyage.engine.P.count
window.boomvoyage = { engine, sound, screenLock };

// ?debug=1: a small frame-rate meter, to compare browsers with real numbers.
// It looks at the last 600 frames (about ten seconds).
if (link.debug) {
  engine.stats = createFrameStats(600);
  const meter = document.createElement('div');
  meter.className = 'meter';
  document.body.append(meter);
  setInterval(() => {
    const v = engine.view;
    meter.textContent = `${formatStats(engine.stats.summary())}\n`
      + `${engine.P.count} sparks · canvas ${canvas.width}×${canvas.height} · pixel ratio ${v.dpr}`;
  }, 500);
}

// Keep the floating messages just above the bottom row, whatever its height.
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--footer', `${document.querySelector('.bottom').offsetHeight}px`);
  }).observe(document.querySelector('.bottom'));
}

document.body.classList.toggle('ambient', ambient);
$('ambientBtn').setAttribute('aria-pressed', String(ambient));
buildMenu();
renderScene();
renderMute();
renderFullscreen();
updateClock();
if (!fsRequest) $('fsBtn').hidden = true;

engine.setScene(scene);
engine.start();

$('startBtn').addEventListener('click', begin);

// The clock text only needs a few updates per second. Browsers slow this
// timer in background tabs, which is fine: every update reads Date.now().
setInterval(() => { checkSchedule(); updateClock(); }, 250);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) sound.suspend(); else if (started) sound.resume();
  if (!document.hidden) screenLock.refresh(); // the browser lets go of the lock while the tab is hidden
  checkSchedule();
  updateClock();
});

let resizeQueued = false;
window.addEventListener('resize', () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; engine.resize(); });
});

// Tap the sky to send up a shell of your own.
canvas.addEventListener('pointerdown', (e) => {
  if (!started) return;
  if (ambient) { setAmbient(false); return; } // a tap leaves ambient mode; it does not fire a shell
  if (menuOpen()) { closeMenu(); return; }
  engine.launchAt(e.clientX, e.clientY, tapColors());
});

$('launchBtn').addEventListener('click', () => {
  startShow();
  const btn = $('launchBtn');
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, 1500);
});
$('muteBtn').addEventListener('click', toggleMute);
$('shareBtn').addEventListener('click', shareLink);
$('ambientBtn').addEventListener('click', () => setAmbient(true, { hint: true }));
$('linkDone').addEventListener('click', closeLinkBox);
$('fsBtn').addEventListener('click', toggleFullscreen);
$('sceneBtn').addEventListener('click', () => (menuOpen() ? closeMenu() : openMenu()));
document.addEventListener('fullscreenchange', renderFullscreen);
document.addEventListener('webkitfullscreenchange', renderFullscreen);

document.addEventListener('pointerdown', (e) => {
  if (menuOpen() && !e.target.closest('.switcher')) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  wake();
  if (e.key === 'Escape') { closeLinkBox(); closeMenu(); setAmbient(false); return; }
  if (e.target.closest && e.target.closest('input, textarea')) return; // typing or selecting: keys are not shortcuts
  if (!started) return; // Enter / Space on the start button are handled by the browser
  const onControl = e.target.closest && e.target.closest('button, [role="option"]');
  const key = e.key.toLowerCase();
  if (key === 'm') toggleMute();
  else if (key === 'f') toggleFullscreen();
  else if (key === 'a') setAmbient(!ambient, { hint: true });
  else if ((key === ' ' || key === 'enter') && !onControl) { e.preventDefault(); startShow(); }
});

for (const type of ['pointermove', 'pointerdown', 'touchstart']) {
  window.addEventListener(type, wake, { passive: true });
}
