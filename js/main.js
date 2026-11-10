// BoomVoyage — entry point. Wiring is added step by step (see PROGRESS.md).

import { Engine } from './engine.js';
import { scenes, getScene } from './scenes/index.js';
import { buildShow, createRunner } from './show.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('stage');
const engine = new Engine(canvas, { reducedMotion });

let scene = getScene(scenes[0].id);
let current = null;      // the show that is playing: { runner, startedAt }
let showCount = 0;
let lastTitle = null;
let titleTimer = 0;

const tapColors = () => scene.show.palettes.flatMap((p) => p.colors);

// ---------- shows ----------

function startShow(now = Date.now()) {
  showCount += 1;
  const seed = (now ^ (showCount * 2654435761)) >>> 0;
  const show = buildShow(scene.show, seed, { calm: reducedMotion, avoid: lastTitle });
  lastTitle = show.title;
  current = { runner: createRunner(show), startedAt: now };
  announce(show.title);
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

// Called every frame. Show time comes from real timestamps, not frame counts.
engine.onTick = () => {
  if (!current) return;
  const elapsed = (Date.now() - current.startedAt) / 1000;
  for (const cue of current.runner.due(elapsed)) engine.fire(cue);
  if (current.runner.finished(elapsed)) current = null;
};

// ---------- wiring ----------

engine.setScene(scene);
engine.start();

window.addEventListener('resize', () => engine.resize());
canvas.addEventListener('pointerdown', (e) => engine.launchAt(e.clientX, e.clientY, tapColors()));
$('launchBtn').addEventListener('click', () => startShow());

// Until the start overlay is wired (step 7), let the page be used directly.
$('start').classList.add('is-gone');
