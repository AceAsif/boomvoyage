// BoomVoyage — entry point. Wiring is added step by step (see PROGRESS.md).

import { Engine } from './engine.js';
import { scenes, getScene } from './scenes/index.js';
import { buildShow, createRunner } from './show.js';
import { Sound } from './audio.js';
import { createSchedule,isDue, restart, remainingMs, progress, formatCountdown } from './schedule.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('stage');
const engine = new Engine(canvas, { reducedMotion });
const sound = new Sound();

let scene = getScene(scenes[0].id);
let schedule = null;     // null until the visitor starts the experience
let current = null;      // the show that is playing: { runner, startedAt }
let showCount = 0;
let lastTitle = null;
let titleTimer = 0;

const tapColors = () => scene.show.palettes.flatMap((p) => p.colors);
const intervalMs = () => scene.show.intervalSeconds * 1000;

// ---------- shows ----------

function startShow(now = Date.now()) {
  showCount += 1;
  const seed = (now ^ (showCount * 2654435761)) >>> 0;
  const show = buildShow(scene.show, seed, { calm: reducedMotion, avoid: lastTitle });
  lastTitle = show.title;
  current = { runner: createRunner(show), startedAt: now };
  schedule = restart(schedule ?? createSchedule(intervalMs(), now), now);
  announce(show.title);
  updateClock();
}

function announce(title) {
  const el = $('showTitle');
  el.innerHTML = '';
  const small = document.createElement('small');
  small.textContent = `Show No. ${showCount}`;
  el.append(small, title);
  el.classList.add('is-on');
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => el.classList.remove('is-on'), 5200);
}

// Starts the next show when its time has come. If the tab is hidden we wait:
// the show plays as soon as the visitor comes back, and only once.
function checkSchedule() {
  if (!schedule || document.hidden) return;
  const now = Date.now();
  if (isDue(schedule, now)) startShow(now);
}

function updateClock() {
  if (!schedule) return;
  const now = Date.now();
  $('countdown').textContent = formatCountdown(remainingMs(schedule, now));
  $('barFill').style.width = `${(progress(schedule, now) * 100).toFixed(2)}%`;
  $('clockLabel').textContent = current ? 'Showing now · next in' : 'Next show in';
}

// Called every frame. Show time comes from real timestamps, not frame counts.
engine.onTick = () => {
  checkSchedule();
  if (!current) return;
  const elapsed = (Date.now() - current.startedAt) / 1000;
  for (const cue of current.runner.due(elapsed)) engine.fire(cue);
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
}

function toggleMute() {
  sound.setMuted(!sound.muted);
  renderMute();
}

// ---------- wiring ----------

// Handy in the browser console, e.g. boomvoyage.engine.P.count
window.boomvoyage = { engine, sound };

engine.setScene(scene);
engine.start();

// The clock text only needs a few updates per second. Browsers slow this
// timer in background tabs, which is fine: every update reads Date.now().
setInterval(() => { checkSchedule(); updateClock(); }, 250);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sound.suspend(); else sound.resume();
  checkSchedule();
  updateClock();
});

window.addEventListener('resize', () => engine.resize());
canvas.addEventListener('pointerdown', (e) => engine.launchAt(e.clientX, e.clientY, tapColors()));
$('launchBtn').addEventListener('click', () => startShow());
$('muteBtn').addEventListener('click', toggleMute);
renderMute();

// Until the start overlay is wired (step 7), the first click unlocks audio.
window.addEventListener('pointerdown', () => sound.start(scene.sound), { once: true, capture: true });

// Until the start overlay is wired (step 7), begin right away.
$('start').classList.add('is-gone');
schedule = createSchedule(intervalMs(), Date.now());
updateClock();
