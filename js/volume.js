// Master volume: the pure rules behind the slider and the mute button.
// No audio and no page code here, so everything can be tested in Node.
//
// The slider goes from 0 to 1. At 1 the sound is exactly as loud as it was
// before the slider existed (FULL_LEVEL), and that is the default. Nothing
// can be louder than that. At 0 the sound is off, just like mute.

export const VOLUME_KEY = 'boomvoyage.volume';
export const FULL_LEVEL = 0.8;     // master gain at full volume (leaves headroom for the finale)
export const DEFAULT_VOLUME = 1;
export const VOLUME_STEP = 0.05;   // one press of an arrow key

// Any value to a volume between 0 and 1. Nonsense becomes the default.
export function clampVolume(value) {
  const v = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof v !== 'number' || !Number.isFinite(v)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, v));
}

// Reads the saved volume. `storage` is localStorage (or anything like it).
// A missing value, a broken value or a blocked storage all give the default.
export function loadVolume(storage) {
  try {
    const text = storage.getItem(VOLUME_KEY);
    return text === null || text === undefined ? DEFAULT_VOLUME : clampVolume(text);
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function saveVolume(storage, volume) {
  try { storage.setItem(VOLUME_KEY, String(Math.round(clampVolume(volume) * 100) / 100)); } catch { /* private mode: keep going */ }
}

// True when nothing can be heard: muted, or the slider at 0.
export function isSilent(volume, muted) {
  return !!muted || clampVolume(volume) <= 0;
}

// The master gain for a slider position. The curve is squared, because ears
// hear loudness that way: the middle of the slider sounds about half as loud.
export function masterGain(volume, muted) {
  if (isSilent(volume, muted)) return 0;
  const v = clampVolume(volume);
  return FULL_LEVEL * v * v;
}

// The slider was moved to `value`. Moving it above 0 also takes mute off
// (you asked for sound); moving it to 0 leaves the mute setting alone.
export function slideTo(state, value) {
  const volume = clampVolume(value);
  return { volume, muted: volume > 0 ? false : !!state.muted };
}

// The mute button was pressed. With sound on, it mutes. With sound off, it
// turns sound on again, and if the slider sits at 0 it goes back to full,
// so pressing the button always changes what you hear.
export function toggleSound(state) {
  const volume = clampVolume(state.volume);
  if (!isSilent(volume, state.muted)) return { volume, muted: true };
  return { volume: volume > 0 ? volume : DEFAULT_VOLUME, muted: false };
}

// 0..1 to the whole number the slider and screen readers use (0..100).
export function toPercent(volume) {
  return Math.round(clampVolume(volume) * 100);
}
