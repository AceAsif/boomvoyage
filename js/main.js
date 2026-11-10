// BoomVoyage — entry point. Wiring is added step by step (see PROGRESS.md).

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

function paint() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#03040d');
  sky.addColorStop(1, '#1b1f4a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', paint);
paint();
