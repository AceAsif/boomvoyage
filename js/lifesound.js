// The quiet sounds of "life between shows": a distant boat horn, a few soft
// laps of water, three gentle notes.
//
// Each sound is first written down as a PLAN: plain numbers that say which
// tones or noise play, when each starts and stops, and how its volume moves.
// A plan can be checked in a test without any browser. playLifeSound() then
// builds the plan with Web Audio nodes.
//
// Rules every plan keeps (tests/lifesound.test.js checks them):
// - volume starts at 0 and ends at 0, and only moves in ramps (no jumps);
// - every fade in and fade out takes at least 30 ms, so nothing clicks;
// - every tone or noise is stopped shortly after its volume reaches 0.

export const LIFE_SOUNDS = ['horn', 'water', 'chime', 'bell', 'furin', 'gong', 'sail'];
export const LIFE_SOUND_LIMIT = 2;      // how many may sound at the same time
export const MIN_FADE = 0.03;           // seconds

// A plan: { kind, length, voices: [voice] }. Times are seconds from the start.
// A voice: { source: 'tone' | 'noise', wave?, freq?, filter?: { type, freq, q },
//            start, stop, env: [[time, level], ...] }
export function lifeSoundPlan(kind, rand = Math.random) {
  if (kind === 'horn') {
    // One long two-note blast, far away. Sawtooth waves through a low-pass
    // filter: enough upper harmonics to be heard on small speakers.
    const base = 185 + rand() * 30;
    const env = [[0, 0], [0.22, 0.045], [1.5, 0.04], [2.4, 0]];
    const filter = { type: 'lowpass', freq: 760, q: 0.6 };
    return {
      kind, length: 2.5,
      voices: [1, 1.26].map((mult) => ({ source: 'tone', wave: 'sawtooth', freq: base * mult, filter, start: 0, stop: 2.5, env })),
    };
  }
  if (kind === 'chime') {
    const notes = [1174.7, 1568, 1318.5];
    return {
      kind, length: 3.4,
      voices: notes.map((freq, i) => {
        const at = i * 0.42;
        return { source: 'tone', wave: 'sine', freq, start: at, stop: at + 2.5, env: [[at, 0], [at + MIN_FADE, 0.007], [at + 0.5, 0.0028], [at + 1.3, 0.0008], [at + 2.4, 0]] };
      }),
    };
  }
  if (kind === 'water') {
    // Three soft laps: filtered noise that swells and falls back, each lap a
    // little quieter than the one before.
    const env = [[0, 0]];
    for (let i = 0; i < 3; i++) {
      const at = i * 1.15, top = 0.045 - i * 0.009;
      env.push([at + 0.45, top], [at + 1.1, top * 0.18]);
    }
    env.push([4, 0]);
    return {
      kind, length: 4.1,
      voices: [{ source: 'noise', filter: { type: 'bandpass', freq: 560 + rand() * 120, q: 0.7 }, start: 0, stop: 4.1, env }],
    };
  }
  if (kind === 'bell') {
    // A harbour bell buoy: two soft strikes of one bell.
    const base = 600 + rand() * 50;
    const voices = [];
    for (const at of [0, 1.25]) {
      for (const [mult, top] of [[1, 0.012], [2.4, 0.005], [3.1, 0.003]]) {
        voices.push({ source: 'tone', wave: 'sine', freq: base * mult, start: at, stop: at + 1.9, env: [[at, 0], [at + MIN_FADE, top], [at + 0.6, top * 0.3], [at + 1.8, 0]] });
      }
    }
    return { kind, length: 3.3, voices };
  }
  if (kind === 'furin') {
    // A glass wind chime: a few high clear notes, unevenly spaced.
    const notes = [2093, 2637, 2349, 3136];
    let at = 0;
    const voices = notes.map((freq, i) => {
      if (i) at += 0.16 + rand() * 0.3;
      return { source: 'tone', wave: 'sine', freq, start: at, stop: at + 1.3, env: [[at, 0], [at + MIN_FADE, 0.006], [at + 0.25, 0.002], [at + 1.2, 0]] };
    });
    return { kind, length: at + 1.4, voices };
  }
  if (kind === 'gong' ) {
    // A small gong, far away: one soft strike with a long tail.
    const base = 176 + rand() * 16;
    return {
      kind, length: 3.8,
      voices: [[1, 0.03], [1.51, 0.018], [2.02, 0.012], [3.0, 0.006]].map(([mult, top]) => (
        { source: 'tone', wave: 'sine', freq: base * mult, start: 0, stop: 3.7, env: [[0, 0], [0.04, top], [0.8, top * 0.45], [3.6, 0]] }
      )),
    };
  }
  if (kind === 'sail') {
    // Setting sail (voyage mode): a long soft breath of wind, and two quiet
    // notes a fifth apart that rise and fall with it.
    const wind = { source: 'noise', filter: { type: 'bandpass', freq: 380 + rand() * 60, q: 0.5 }, start: 0, stop: 4.3, env: [[0, 0], [1.7, 0.028], [2.6, 0.02], [4.2, 0]] };
    const notes = [392, 587.3].map((freq, i) => (
      { source: 'tone', wave: 'sine', freq, start: 0.3 * i, stop: 4.1, env: [[0.3 * i, 0], [1.4 + 0.3 * i, 0.007], [2.6, 0.005], [4, 0]] }
    ));
    return { kind, length: 4.4, voices: [wind, ...notes] };
  }
  return null;
}

// Builds a plan with Web Audio nodes, starting at time `at` of `ctx`, and
// sends it to `out`. `noise` is a buffer of white noise. Returns the source
// nodes, so the caller can stop them early.
export function playLifeSound(ctx, out, plan, at, noise) {
  const sources = [];
  for (const voice of plan.voices) {
    const gain = ctx.createGain();
    // Silent from the very start. Without this a gain node passes sound at
    // full volume until its first scheduled change.
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, at + voice.env[0][0]);
    for (const [time, level] of voice.env.slice(1)) gain.gain.linearRampToValueAtTime(level, at + time);
    gain.connect(out);

    let input = gain;
    if (voice.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = voice.filter.type;
      filter.frequency.value = voice.filter.freq;
      filter.Q.value = voice.filter.q;
      filter.connect(gain);
      input = filter;
    }

    let source;
    if (voice.source === 'noise') {
      source = ctx.createBufferSource();
      source.buffer = noise;
      source.loop = true;
      source.connect(input);
      source.start(at + voice.start, Math.random() * noise.duration);
    } else {
      source = ctx.createOscillator();
      source.type = voice.wave;
      source.frequency.value = voice.freq;
      source.connect(input);
      source.start(at + voice.start);
    }
    source.stop(at + voice.stop);
    // Let go of the nodes when the sound is over.
    source.onended = () => { try { source.disconnect(); gain.disconnect(); } catch { /* already gone */ } };
    sources.push(source);
  }
  return sources;
}

// Keeps count of the life sounds that are playing, so that no more than
// `limit` ever overlap. Pure logic: times are any clock in seconds.
export function createSoundGate(limit = LIFE_SOUND_LIMIT) {
  let ends = [];
  return {
    // Sounds still playing at `now`.
    count(now) {
      ends = ends.filter((end) => end > now);
      return ends.length;
    },
    // Asks to play a sound from `start` to `end`. False = too many already.
    admit(now, start, end) {
      if (this.count(now) >= limit) return false;
      ends.push(end);
      return true;
    },
    clear() { ends = []; },
  };
}
