// Sound engine. Every sound is made live with the Web Audio API:
// oscillators and filtered noise, no audio files.
//
// The engine calls these methods at the same moment it draws the matching
// effect, so sound and picture stay together.

import { LIFE_SOUNDS, lifeSoundPlan, playLifeSound, createSoundGate } from './lifesound.js';

// The quiet sounds a life event may ask for (see js/lifesound.js).
export { LIFE_SOUNDS };

const KEY = 'boomvoyage.muted';

const LEVEL = 0.8; // master volume when not muted (leaves headroom for the finale)

export function loadMuted() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}
function saveMuted(muted) {
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* private mode: keep going */ }
}

const DEFAULTS = {
  reverbSeconds: 2.6,
  echoSeconds: 0.3,
  echoLevel: 0.15,
  boomPitch: 1,
  ambient: { wash: 1, breeze: 1, bell: false },
};

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = loadMuted();
    this.tweaks = DEFAULTS;
    this.recentBooms = [];
    this.crackles = 0;
    this.lastPop = 0;
    this.bellTimer = 0;
  }

  get ready() { return !!this.ctx; }

  // Browsers only allow audio after a click or key press, so call this from one.
  start(tweaks) {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : LEVEL;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.3;
    this.master.connect(comp).connect(ctx.destination);

    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    // Reverb: the open air over the water.
    this.wetIn = ctx.createGain();
    this.wetIn.gain.value = 0.5;
    this.reverb = ctx.createConvolver();
    this.wetIn.connect(this.reverb).connect(this.master);

    // One clear echo, as if coming back from the far shore.
    this.echo = ctx.createDelay(1.5);
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 1100;
    this.echoGain = ctx.createGain();
    this.echo.connect(echoTone).connect(this.echoGain).connect(this.master);

    this.white = this.makeNoise(2, false);
    this.brown = this.makeNoise(5, true);

    this.setScene(tweaks);
    this.startAmbient();
  }

  setScene(tweaks = {}) {
    this.tweaks = { ...DEFAULTS, ...tweaks, ambient: { ...DEFAULTS.ambient, ...(tweaks.ambient || {}) } };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.reverb.buffer = this.makeImpulse(this.tweaks.reverbSeconds);
    this.echo.delayTime.setValueAtTime(this.tweaks.echoSeconds, t);
    this.echoGain.gain.setValueAtTime(this.tweaks.echoLevel, t);
    if (this.washGain) {
      this.washGain.gain.setTargetAtTime(0.05 * this.tweaks.ambient.wash, t, 0.5);
      this.breezeGain.gain.setTargetAtTime(0.006 * this.tweaks.ambient.breeze, t, 0.5);
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    saveMuted(this.muted);
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : LEVEL, this.ctx.currentTime, 0.04);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); }

  // ---------- building blocks ----------

  makeNoise(seconds, brown) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }

  makeImpulse(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let low = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        // The tail gets darker as it fades, like sound over distance.
        low += ((Math.random() * 2 - 1) - low) * (0.9 - 0.75 * k);
        d[i] = low * Math.pow(1 - k, 3);
      }
    }
    return buf;
  }

  noise(buffer = this.white) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = 0;
    src.start(0, Math.random() * buffer.duration);
    return src;
  }

  // Where a sound goes: left/right position, then dry + reverb (+ echo).
  voice(pan = 0, echo = false) {
    const ctx = this.ctx;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (p.pan) p.pan.value = pan;
    p.connect(this.dry);
    p.connect(this.wetIn);
    if (echo) p.connect(this.echo);
    return p;
  }

  get live() { return this.ctx && this.ctx.state === 'running' && !this.muted; }

  // ---------- fireworks ----------

  // A shell leaves the water: a soft whoosh, sometimes with a falling whistle.
  launch({ pan = 0, dur = 1.2, whistle = false } = {}) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const out = this.voice(pan);

    const n = this.noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(380, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.02, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(g).connect(out);
    n.stop(t + dur + 0.05);

    if (whistle) {
      const f0 = 1500 + Math.random() * 700;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + dur * 0.95);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 9 + Math.random() * 5;
      const depth = ctx.createGain();
      depth.gain.value = 30;
      lfo.connect(depth).connect(osc.frequency);
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, t);
      wg.gain.exponentialRampToValueAtTime(0.02, t + 0.12);
      wg.gain.exponentialRampToValueAtTime(0.008, t + dur * 0.7);
      wg.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
      osc.connect(wg).connect(out);
      osc.start(t); lfo.start(t);
      osc.stop(t + dur); lfo.stop(t + dur);
    }
  }

  // A shell opens: low thump + falling rumble + a short sharp crack.
  boom({ pan = 0, size = 1, type = 'peony' } = {}) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // In the finale many shells open together. Three at once is already a
    // wall of sound; more would only clip.
    this.recentBooms = this.recentBooms.filter((x) => x > t - 0.1);
    if (this.recentBooms.length >= 3) return;
    this.recentBooms.push(t);

    const out = this.voice(pan, true);
    const level = Math.min(1.2, 0.4 + 0.5 * size);
    const tail = 0.6 + 0.5 * size;
    const pitch = this.tweaks.boomPitch;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(((105 + Math.random() * 35) * pitch) / (0.7 + 0.3 * size), t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.3);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(level, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + tail);
    osc.connect(og).connect(out);
    osc.start(t);
    osc.stop(t + tail + 0.05);

    const body = this.noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2800, t);
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.9);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(level * 0.75, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + tail + 0.5);
    body.connect(lp).connect(bg).connect(out);
    body.stop(t + tail + 0.55);

    const crack = this.noise();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1700;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(level * (type === 'salute' ? 0.9 : 0.32), t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + (type === 'salute' ? 0.16 : 0.07));
    crack.connect(hp).connect(cg).connect(out);
    crack.stop(t + 0.2);
  }

  // Many tiny pops. One noise source, with its volume drawn as a row of spikes.
  crackle({ pan = 0, delay = 0, dur = 1, level = 1 } = {}) {
    if (!this.live || this.crackles >= 4) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const steps = Math.max(8, Math.floor(dur * 500));
    const curve = new Float32Array(steps);
    const pops = Math.floor(55 * dur * Math.min(1.4, level));
    for (let i = 0; i < pops; i++) {
      const k = Math.pow(Math.random(), 0.8);
      const at = Math.min(steps - 3, Math.floor(k * steps));
      const amp = (0.05 + Math.random() * 0.17) * (1 - k * 0.7);
      curve[at] = Math.max(curve[at], amp);
      curve[at + 1] = Math.max(curve[at + 1], amp * 0.3);
    }
    curve[steps - 1] = 0;

    const n = this.noise();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600 + Math.random() * 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.setValueCurveAtTime(curve, t, dur);
    n.connect(hp).connect(g).connect(this.voice(pan));
    n.stop(t + dur + 0.05);
    this.crackles += 1;
    n.onended = () => { this.crackles -= 1; };
  }

  // One small pop (a crossette star splitting).
  pop({ pan = 0 } = {}) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (t - this.lastPop < 0.04) return;
    this.lastPop = t;
    const n = this.noise();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(hp).connect(g).connect(this.voice(pan));
    n.stop(t + 0.1);
  }

  // The waterfall: a long bright hiss with fine crackle inside it.
  waterfall({ pan = 0, dur = 8 } = {}) {
    if (!this.live) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const n = this.noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5200;
    bp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 1.8);
    g.gain.setValueAtTime(0.055, t + Math.max(2, dur - 1.5));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1);
    n.connect(bp).connect(g).connect(this.voice(pan));
    n.stop(t + dur + 1.1);
    this.crackle({ pan, delay: 0.4, dur: Math.max(1, dur - 0.4), level: 0.55 });
  }

  // ---------- ambient night ----------

  startAmbient() {
    const ctx = this.ctx, t = ctx.currentTime;
    const a = this.tweaks.ambient;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(1, t + 4); // fade in gently
    bus.connect(this.master);

    // Water: deep slow noise that swells and falls like small waves.
    const wash = this.noise(this.brown);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    this.washGain = ctx.createGain();
    this.washGain.gain.value = 0.05 * a.wash;
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.13;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.022 * a.wash;
    swell.connect(swellDepth).connect(this.washGain.gain);
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.047;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 160;
    drift.connect(driftDepth).connect(lp.frequency);
    wash.connect(lp).connect(this.washGain).connect(bus);
    swell.start(); drift.start();

    // Air: a very quiet moving breeze.
    const air = this.noise();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    this.breezeGain = ctx.createGain();
    this.breezeGain.gain.value = 0.006 * a.breeze;
    const gust = ctx.createOscillator();
    gust.frequency.value = 0.071;
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 0.004 * a.breeze;
    gust.connect(gustDepth).connect(this.breezeGain.gain);
    air.connect(bp).connect(this.breezeGain).connect(bus);
    gust.start();

    this.queueBell();
  }

  // A far-away buoy bell, now and then. Exact timing does not matter here,
  // so a plain timer is fine.
  queueBell() {
    clearTimeout(this.bellTimer);
    this.bellTimer = setTimeout(() => {
      if (this.live && this.tweaks.ambient.bell && !document.hidden) this.bell();
      this.queueBell();
    }, 14000 + Math.random() * 26000);
  }

  bell() {
    const ctx = this.ctx, t = ctx.currentTime;
    const out = this.voice(Math.random() * 1.4 - 0.7);
    const f = 900 + Math.random() * 80;
    [[1, 0.011], [2.41, 0.005], [3.9, 0.0025]].forEach(([mult, amp]) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = f * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3 / mult + 0.6);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 3.8);
    });
  }

  // ---------- life between shows ----------
  // One very quiet sound for a small event between shows: 'horn' (a distant
  // boat horn), 'water' (a few soft laps) or 'chime' (three gentle notes).
  // What each one is made of is written down in js/lifesound.js.
  //
  // They go through the same master volume as everything else, so the mute
  // button silences them. At most two play at once. Each has its own volume
  // strip, so it can be faded away early when a show begins.
  // Returns true if the sound will play. `now` skips the random wait.
  life(kind, { now = false } = {}) {
    if (!this.live || document.hidden) return false;
    const plan = lifeSoundPlan(kind);
    if (!plan) return false;
    const ctx = this.ctx, t = ctx.currentTime;
    if (!this.lifeGate) { this.lifeGate = createSoundGate(); this.lifeStrips = new Set(); }
    const at = t + (now ? 0.05 : 0.5 + Math.random() * 2);
    if (!this.lifeGate.admit(t, at, at + plan.length)) return false;

    const strip = { gain: ctx.createGain(), sources: [] };
    strip.gain.connect(this.voice(Math.random() * 1.2 - 0.6));
    strip.sources = playLifeSound(ctx, strip.gain, plan, at, this.white);
    this.lifeStrips.add(strip);
    let left = strip.sources.length;
    for (const source of strip.sources) {
      source.addEventListener('ended', () => {
        left -= 1;
        if (left > 0) return;
        this.lifeStrips.delete(strip);
        try { strip.gain.disconnect(); } catch { /* already gone */ }
      });
    }
    return true;
  }

  // A show is starting (or the place changes): fade the life sounds away in
  // about a third of a second, then stop them. No sound outlives its event.
  hushLife() {
    if (!this.ctx || !this.lifeStrips) return;
    const t = this.ctx.currentTime;
    for (const strip of this.lifeStrips) {
      strip.gain.gain.cancelScheduledValues(t);
      strip.gain.gain.setValueAtTime(1, t);
      strip.gain.gain.linearRampToValueAtTime(0, t + 0.3);
      for (const source of strip.sources) { try { source.stop(t + 0.35); } catch { /* not started or already stopped */ } }
    }
    this.lifeGate.clear();
  }
}
