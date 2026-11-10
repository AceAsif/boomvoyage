// BoomVoyage — entry point. Wiring is added step by step (see PROGRESS.md).

import { Engine } from './engine.js';
import { scenes, getScene } from './scenes/index.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('stage');
const engine = new Engine(canvas, { reducedMotion });

let scene = getScene(scenes[0].id);
const tapColors = () => scene.show.palettes.flatMap((p) => p.colors);

engine.setScene(scene);
engine.start();

window.addEventListener('resize', () => engine.resize());
canvas.addEventListener('pointerdown', (e) => engine.launchAt(e.clientX, e.clientY, tapColors()));

// Until the start overlay is wired (step 7), let the page be used directly.
document.getElementById('start').classList.add('is-gone');
