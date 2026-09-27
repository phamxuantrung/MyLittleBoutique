const SFX_OUTPUT_BOOST = 2.6;
const MUSIC_TRACK_URL = `${import.meta.env.BASE_URL}assets/audio/boutique-theme.mp3`;

export class AudioSystem {
  private context?: AudioContext;
  private musicTrack?: HTMLAudioElement;
  private musicVolume = 0.55;
  enabled = true;

  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* A browser without audio can still play the complete game. */ }
  }

  setMusicVolume(value: number) {
    this.musicVolume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.55));
    if (this.musicTrack) this.musicTrack.volume = this.musicVolume;
  }

  private tone(frequency: number, start: number, duration: number, volume = .045, type: OscillatorType = 'sine') {
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    const t = this.context.currentTime + start;
    const outputVolume = Math.min(.2, volume * SFX_OUTPUT_BOOST);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(outputVolume, t + .018);
    gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    oscillator.start(t);
    oscillator.stop(t + duration + .03);
  }

  play(kind: 'click' | 'sale' | 'error' | 'bell' | 'reward' | 'spend') {
    if (!this.enabled) return;
    if (kind === 'spend') {
      this.tone(1047, 0, .12, .038, 'triangle');
      this.tone(784, .055, .15, .042, 'triangle');
      this.tone(523, .12, .2, .045, 'sine');
      return;
    }
    const notes = { click: [600], sale: [523, 659, 784, 1047], error: [260, 220], bell: [880, 1175], reward: [523, 659, 784, 1047, 1318] }[kind];
    notes.forEach((note, index) => this.tone(note, index * .09, kind === 'click' ? .08 : .32));
  }

  music(enabled: boolean) {
    if (!this.musicTrack) {
      this.musicTrack = new Audio(MUSIC_TRACK_URL);
      this.musicTrack.loop = true;
      this.musicTrack.preload = 'auto';
      this.musicTrack.volume = this.musicVolume;
    }
    if (!enabled) {
      this.musicTrack.pause();
      return;
    }
    void this.musicTrack.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }
}
