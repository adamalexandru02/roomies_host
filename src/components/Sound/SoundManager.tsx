// soundManager.js

class SoundManager {
  constructor() {
    this.sounds = {};         // sound effects
    this.music = null;        // background music audio
    this.volume = 1;          // 0–1
    this.musicVolume = 0.6;   // default music volume
    this.muted = localStorage.getItem("muted") === "true";
  }

  // Load a short sound effect
  loadSound(name, src) {
    const audio = new Audio(src);
    audio.preload = "auto";
    this.sounds[name] = audio;
  }

  // Play short sound (clone so it can overlap)
  playSound(name) {
    if (this.muted) return;
    const audio = this.sounds[name];
    if (!audio) return console.warn(`Sound not found: ${name}`);

    const clone = audio.cloneNode();
    clone.volume = this.volume;
    clone.play().catch(() => {});
  }

  // Stop all SFX instantly
  stopAllSounds() {
    for (const key in this.sounds) {
      this.sounds[key].pause();
      this.sounds[key].currentTime = 0;
    }
  }

  // Load background music
  loadMusic(src) {
    this.music = new Audio(src);
    this.music.loop = true;
    this.music.volume = this.musicVolume;
    this.music.preload = "auto";
  }

  // Play background music with optional fade-in
  playMusic(fadeIn = 500) {
    if (!this.music || this.muted) return;
    console.log("incepe muzica?");

    this.music.volume = 0;
    this.music.play().catch((e) => {console.error(e)});

    // fade in
    const target = this.musicVolume;
    const step = target / (fadeIn / 50);

    console.log(this.musicVolume);
    const interval = setInterval(() => {
      console.log(this.musicVolume,this.music.volume);

      if (this.music.volume < target) {
        this.music.volume = Math.min(this.music.volume + step, target);
        console.log(this.musicVolume,this.music);
      } else {
        console.log("ha?!")
        clearInterval(interval);
      }
    }, 50);
  }

  // Stop music with fade-out
  stopMusic(fadeOut = 500) {
    if (!this.music) return;

    const step = this.music.volume / (fadeOut / 50);

    const interval = setInterval(() => {
      if (this.music.volume > 0) {
        this.music.volume = Math.max(this.music.volume - step, 0);
      } else {
        this.music.pause();
        this.music.currentTime = 0;
        clearInterval(interval);
      }
    }, 50);
  }

  // Toggle mute
  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("muted", this.muted);

    console.log("muted?");
    if (this.muted) {
      this.stopAllSounds();
      this.stopMusic(200);
    } else {
      this.playMusic(300);
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.music) this.music.volume = this.musicVolume;
  }
}

const soundManager = new SoundManager();
export default soundManager;

// Optional helper
export const playSound = (name) => soundManager.playSound(name);
