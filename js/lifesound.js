// The quiet sounds of "life between shows": a distant boat horn, a few soft
// laps of water, three gentle notes, and the travel cue of voyage mode.
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

export const LIFE_SOUNDS = ['horn', 'water', 'chime', 'bell', 'furin', 'gong', 'travel'];
export const LIFE_SOUND_LIMIT = 2;      // how many may sound at the same time
export const MIN_FADE = 0.03;           // seconds

// A plan: { kind, length, voices: [voice] }. Times are seconds from the start.
// A voice: { source: 'tone' | 'noise', wave?, freq?, filter?: { type, freq, q },
//            start, stop, env: [[time, level], ...] }
// A filter may also have `sweep`: [[time, freq], ...], its frequency moving
// in straight lines between those points.
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
  if (kind === 'travel') {
    // The travel cue (voyage mode, while the picture says "Sailing to ..."):
    // 1. "next stop": three soft bell notes going up (G, B, D), each a pure
    //    tone with a faint higher ring on top, like the chime before an
    //    announcement;
    // 2. the city ahead: a very quiet low hum, like traffic far away. Two
    //    low tones a fifth apart, with a little deep rumble under them
    //    (noise through a low-pass filter that never opens above 300 Hz).
    //    It fades in while the picture goes dark and fades out as the next
    //    city appears.
    // No voices, no wind, no water.
    const voices = [];
    [784, 987.8, 1174.7].forEach((freq, i) => {
      const at = 0.25 + i * 0.4;
      for (const [mult, top] of [[1, 0.014], [2.76, 0.003]]) {
        voices.push({
          source: 'tone', part: 'chime', wave: 'sine', freq: freq * mult, start: at, stop: at + 1.9,
          env: [[at, 0], [at + MIN_FADE, top], [at + 0.5, top * 0.35], [at + 1.8, 0]],
        });
      }
    });
    const base = 98 + rand() * 6;
    for (const [mult, top] of [[1, 0.012], [1.5, 0.008]]) {
      voices.push({
        source: 'tone', part: 'hum', wave: 'triangle', freq: base * mult, start: 0.2, stop: 5.4,
        env: [[0.2, 0], [2.6, top], [3.4, top * 0.9], [5.3, 0]],
      });
    }
    voices.push({
      source: 'noise', part: 'hum',
      filter: { type: 'lowpass', freq: 160, q: 0.5, sweep: [[0.2, 160], [2.8, 300], [5.3, 180]] },
      start: 0.2, stop: 5.4, env: [[0.2, 0], [2.8, 0.01], [5.3, 0]],
    });
    return { kind, length: 5.5, voices };
  }
  return null;
}

// Moves a filter frequency along [[time, value], ...].
function moveParam(param, points, at) {
  points.forEach(([time, value], i) => {
    if (i === 0) param.setValueAtTime(value, at + time);
    else param.linearRampToValueAtTime(value, at + time);
  });
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
      if (voice.filter.sweep) moveParam(filter.frequency, voice.filter.sweep, at);
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
