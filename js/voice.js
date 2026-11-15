// The station voice of voyage mode: a short recorded voice that says
// "Next stop, Tokyo" right after the travel chime, while the picture says
// "Sailing to Tokyo". Pure logic: no page, no audio. The playing itself is
// in js/audio.js (say, loadVoice, hushVoice) and the wiring in js/main.js.
//
// The clips are the only recorded sound on the site. They were made with
// ElevenLabs on its free plan, which asks for a credit.
//
// TO REMOVE THE CREDIT LATER (when the clips are replaced by licensed ones):
// set VOICE_CREDIT to '' here. The line in the place menu then disappears by
// itself. Then delete the credit sentence in README.md and in SUMMARY.md
// (search for "ElevenLabs"), and the test "the credit is shown" in
// tests/voice.test.js.
export const VOICE_CREDIT = 'Station voice made with ElevenLabs';

export const VOICE_KEY = 'boomvoyage.voice';

// The places that have a clip. One file each, in audio/.
export const VOICE_SCENES = ['sydney', 'tokyo', 'hongkong', 'dubai', 'paris', 'london', 'newyork'];

// The clip for a place, for example "audio/next-stop-tokyo.mp3", or null if
// that place has no clip (a new city without a recording stays silent).
export function voiceFile(sceneId) {
  return VOICE_SCENES.includes(sceneId) ? `audio/next-stop-${sceneId}.mp3` : null;
}

// Is the station voice on when the page opens? A link option wins
// (?voice=0 or ?voice=1); without one the saved choice is used; without
// that it is on.
export function initialVoice(linkValue, storedText) {
  if (linkValue === true || linkValue === false) return linkValue;
  return storedText !== '0';
}

export function loadVoice(storage) {
  try { return storage.getItem(VOICE_KEY); } catch { return null; }
}
export function saveVoice(storage, on) {
  try { storage.setItem(VOICE_KEY, on ? '1' : '0'); } catch { /* private mode: keep going */ }
}

// The voice begins this long after the travel cue. The three bell notes of
// the cue are struck at 0.25, 0.65 and 1.05 seconds; by 1.7 seconds the
// last one has nearly died away, so the voice comes "right after the chime".
export const VOICE_DELAY = 1.7;
// A clip that could only start this much too late (it was still loading)
// is not played at all: a voice in the middle of the next show helps nobody.
export const VOICE_MAX_LATE = 1.2;
export const VOICE_LEVEL = 0.4;   // of full volume, before the master volume: an announcement, not a shout
export const VOICE_FADE = 0.25;   // seconds: how fast a clip is faded away when it must stop

// When to start a clip that was asked for at `wanted` (seconds on the audio
// clock) if it is `now`. Answers the start time, or null for "too late".
export function voiceStart(wanted, now, maxLate = VOICE_MAX_LATE) {
  if (!Number.isFinite(wanted) || !Number.isFinite(now)) return null;
  if (now <= wanted) return wanted;
  return now - wanted <= maxLate ? now + 0.02 : null;
}

// Should the clip for the next stop be loaded now? Only when it would be
// used: voyage mode on, the voice on, and the visitor has tapped to start
// (before that no sound is allowed, and nothing is fetched for nothing).
export function shouldLoadVoice({ voyage, voice, started }) {
  return !!(voyage && voice && started);
}
