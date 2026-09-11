export const playSoundEffect = (soundType: string) => {
  let audioUrl = "";
  switch (soundType) {
    case "SUCCESS":
      audioUrl =
        "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg";
      break;
    case "FOUL":
      audioUrl =
        "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg";
      break;
    case "TICK":
      audioUrl = "/sounds/beep_short.ogg";
      break;

    case "TIME_UP":
      audioUrl = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";
      break;
  }

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    if (soundType === "TICK") audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio bloqueado:", err));
  }
};
