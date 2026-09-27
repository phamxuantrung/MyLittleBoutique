type AudioBus = 'sfx' | 'music';

const midi = (note: number) => 440 * 2 ** ((note - 69) / 12);

export class AudioSystem {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private musicTimer?: ReturnType<typeof setInterval>;
  private musicStep = 0;
  private musicVolume = 0.55;
  enabled = true;

  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.musicGain) {
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* A browser without audio can still play the complete game. */ }
  }

  setMusicVolume(value: number) {
    this.musicVolume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.55));
    if (this.context && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.context.currentTime, 0.025);
    }
  }

  private tone(frequency: number, start: number, duration: number, volume = .045, type: OscillatorType = 'sine', bus: AudioBus = 'sfx') {
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(bus === 'music' && this.musicGain ? this.musicGain : this.context.destination);
    const t = this.context.currentTime + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + .018);
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

  private playMusicStep() {
    if (document.hidden) return;
    const progression = [
      { bass: 48, chord: [60, 64, 67, 71] },
      { bass: 45, chord: [57, 60, 64, 67] },
      { bass: 41, chord: [53, 57, 60, 64] },
      { bass: 43, chord: [55, 59, 62, 64] },
    ];
    const melody: Array<number | null> = [
      72, null, 76, 74, 72, null, 67, 69,
      72, null, 76, 79, 76, 74, 72, null,
      69, null, 72, 76, 74, null, 69, 67,
      71, null, 74, 76, 74, 71, 67, null,
      76, null, 79, 81, 79, 76, 74, 72,
      72, 74, 76, null, 72, 69, 67, null,
      69, 72, 76, 74, 72, 69, 67, 64,
      67, 71, 74, null, 72, 71, 67, null,
    ];
    const step = this.musicStep % melody.length;
    const beat = step % 8;
    const harmony = progression[Math.floor(step / 8) % progression.length];

    if (beat === 0 || beat === 4) this.tone(midi(harmony.bass), 0, .82, .022, 'sine', 'music');
    if (beat % 2 === 0) {
      const chordNote = harmony.chord[(beat / 2) % harmony.chord.length];
      this.tone(midi(chordNote), 0, .62, .012, 'triangle', 'music');
      this.tone(midi(chordNote + 12), .035, .4, .005, 'sine', 'music');
    }
    const lead = melody[step];
    if (lead) this.tone(midi(lead), 0, .34, .014, 'triangle', 'music');
    if (beat === 7) this.tone(midi(harmony.chord[2] + 12), 0, .48, .005, 'sine', 'music');
    this.musicStep++;
  }

  music(enabled: boolean) {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
    if (!enabled) return;
    this.musicStep = 0;
    this.playMusicStep();
    this.musicTimer = setInterval(() => this.playMusicStep(), 300);
  }
}
