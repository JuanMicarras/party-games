const AUDIO_SOURCES: Record<string, string> = {
  SUCCESS: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
  FOUL: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg",
  TICK: "/sounds/beep_short.ogg",
  TIME_UP: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
};

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(soundType: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  const url = AUDIO_SOURCES[soundType];
  if (!url) return null;

  let audio = audioCache.get(soundType);
  if (!audio) {
    audio = new Audio(url);
    if (soundType === "TICK") {
      audio.volume = 0.3;
    }
    audioCache.set(soundType, audio);
  }
  return audio;
}

export const playSoundEffect = (soundType: string) => {
  try {
    const audio = getAudio(soundType);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn(`[Audio] No se pudo reproducir ${soundType}:`, err.message);
      });
    }
  } catch (err) {
    console.warn(`[Audio] Error reproduciendo efecto ${soundType}:`, err);
  }
};
