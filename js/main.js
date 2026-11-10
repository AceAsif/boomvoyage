// BoomVoyage — entry point. Wiring is added step by step (see PROGRESS.md).

import { Engine } from './engine.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('stage');
const engine = new Engine(canvas, { reducedMotion });

// Temporary empty scene until the real one is added in step 3.
const scene = { id: 'blank', name: 'Open water', horizon: 0.76 };
const tapColors = [[255, 190, 104], [120, 200, 255], [255, 120, 150], [140, 255, 200]];

engine.setScene(scene);
engine.start();

window.addEventListener('resize', () => engine.resize());
canvas.addEventListener('pointerdown', (e) => engine.launchAt(e.clientX, e.clientY, tapColors));

// Step 1-2 only: let the page be used before the start overlay is wired.
document.getElementById('start').classList.add('is-gone');
