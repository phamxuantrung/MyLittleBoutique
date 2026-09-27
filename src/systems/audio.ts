export class AudioSystem {
  private context?: AudioContext;
  private musicTimer?: ReturnType<typeof setInterval>;
  enabled = true;
  private note = 0;
  async unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* A browser without audio can still play the complete game. */ }
  }
  private tone(frequency: number, start: number, duration: number, volume = .045, type: OscillatorType = 'sine') {
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    oscillator.connect(gain); gain.connect(this.context.destination);
    const t = this.context.currentTime + start;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(volume, t + .012); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
    oscillator.start(t); oscillator.stop(t + duration + .02);
  }
  play(kind: 'click' | 'sale' | 'error' | 'bell' | 'reward') {
    if (!this.enabled) return;
    const notes = { click: [600], sale: [523, 659, 784, 1047], error: [260, 220], bell: [880, 1175], reward: [523, 659, 784, 1047, 1318] }[kind];
    notes.forEach((n, i) => this.tone(n, i * .09, kind === 'click' ? .08 : .32));
  }
  music(enabled: boolean) {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = undefined; }
    if (!enabled) return;
    const melody = [523, 0, 659, 784, 0, 659, 587, 0, 440, 0, 523, 659, 0, 587, 523, 0];
    this.musicTimer = setInterval(() => {
      if (document.hidden) return;
      const f = melody[this.note++ % melody.length];
      if (f) this.tone(f, 0, .9, .018, 'triangle');
      if (this.note % 4 === 0) this.tone([131, 110, 147, 98][Math.floor(this.note / 4) % 4], 0, 1.5, .022);
    }, 440);
  }
}
