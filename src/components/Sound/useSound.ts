import { useState } from "react";
import soundManager from "./SoundManager";

export function useSound() {
  const [muted, setMuted] = useState(soundManager.muted);

  const toggle = () => {
    soundManager.toggleMute();
    setMuted(soundManager.muted);
  };

  return {
    play: (name) => soundManager.playSound(name),
    toggleMute: toggle,
    muted
  };
}