type SfxKind = 'click' | 'sale' | 'error' | 'bell' | 'reward' | 'coin';

const AUDIO_ROOT = `${import.meta.env.BASE_URL}assets/audio/`;
export const MUSIC_TRACKS = [
  { id: 'boutique-bloom', name: 'Boutique Bloom', mood: 'Nhạc nền nguyên bản', url: `${AUDIO_ROOT}boutique-theme.mp3` },
  { id: 'better-for-you-1', name: 'Better for You', mood: 'siopaolo · Visualizer', url: `${AUDIO_ROOT}better-for-you-1.mp3` },
  { id: 'die-for-you-remix', name: 'Die For You (Remix)', mood: 'The Weeknd · Ariana Grande', url: `${AUDIO_ROOT}die-for-you-remix.mp3` },
  { id: 'daffodil-live', name: 'Daffodil (Live Session)', mood: 'Saint Harison', url: `${AUDIO_ROOT}daffodil-live.mp3` },
] as const;
const SFX_URLS: Record<SfxKind, string> = {
  click: `${AUDIO_ROOT}click.mp3`,
  sale: `${AUDIO_ROOT}sale.mp3`,
  error: `${AUDIO_ROOT}error.mp3`,
  bell: `${AUDIO_ROOT}bell.mp3`,
  reward: `${AUDIO_ROOT}reward.mp3`,
  coin: `${AUDIO_ROOT}coin.mp3`,
};
const SFX_VOLUME: Record<SfxKind, number> = {
  click: .68,
  sale: .82,
  error: .78,
  bell: .8,
  reward: .84,
  coin: .78,
};

export class AudioSystem {
  private musicTrack?: HTMLAudioElement;
  private effectPools = new Map<SfxKind, HTMLAudioElement[]>();
  private effectCursor = new Map<SfxKind, number>();
  private effectContext?: AudioContext;
  private effectBuffers = new Map<SfxKind, AudioBuffer>();
  private effectLoads = new Map<SfxKind, Promise<void>>();
  private musicVolume = 0.55;
  private selectedTrack = 'boutique-bloom';
  enabled = true;

  constructor() {
    // Start fetching and decoding while the opening screen is visible. HTML
    // audio remains as a fallback, but decoded Web Audio buffers remove the
    // first-tap delay that Mobile Safari adds to MP3 elements.
    (Object.keys(SFX_URLS) as SfxKind[]).forEach(kind => {
      this.effectPool(kind).forEach(effect => effect.load());
      void this.loadEffectBuffer(kind);
    });
  }

  private context() {
    if (this.effectContext) return this.effectContext;
    try {
      this.effectContext = new AudioContext({ latencyHint: 'interactive' });
    } catch { /* HTMLAudio fallback covers browsers without Web Audio. */ }
    return this.effectContext;
  }

  private loadEffectBuffer(kind: SfxKind) {
    const existing = this.effectLoads.get(kind);
    if (existing) return existing;
    const context = this.context();
    if (!context) return Promise.resolve();
    const loading = fetch(SFX_URLS[kind], { cache: 'force-cache' })
      .then(response => response.ok ? response.arrayBuffer() : Promise.reject(new Error(`Audio ${response.status}`)))
      .then(bytes => context.decodeAudioData(bytes))
      .then(buffer => { this.effectBuffers.set(kind, buffer); })
      .catch(() => { /* Keep the preloaded HTMLAudio fallback. */ });
    this.effectLoads.set(kind, loading);
    return loading;
  }

  async unlock() {
    const context = this.context();
    if (context) {
      try {
        if (context.state === 'suspended') await context.resume();
        return;
      } catch { /* Continue with the HTMLAudio primer below. */ }
    }
    try {
      (Object.keys(SFX_URLS) as SfxKind[]).forEach(kind => this.effectPool(kind));
      const primer = this.effectPool('click')[0];
      primer.muted = true;
      try {
        await primer.play();
      } finally {
        primer.pause();
        primer.currentTime = 0;
        primer.muted = false;
      }
    } catch { /* A browser without audio can still play the complete game. */ }
  }

  setMusicVolume(value: number) {
    this.musicVolume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.55));
    if (this.musicTrack) this.musicTrack.volume = this.musicVolume;
  }

  setMusicTrack(trackId: string) {
    const track = MUSIC_TRACKS.find(item => item.id === trackId) ?? MUSIC_TRACKS[0];
    if (track.id === this.selectedTrack) return;
    this.selectedTrack = track.id;
    if (!this.musicTrack) return;
    const wasPlaying = !this.musicTrack.paused;
    this.musicTrack.pause();
    this.musicTrack.src = track.url;
    this.musicTrack.load();
    if (wasPlaying) void this.musicTrack.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }

  private effectPool(kind: SfxKind) {
    let pool = this.effectPools.get(kind);
    if (pool) return pool;
    pool = Array.from({ length: 3 }, () => {
      const effect = new Audio(SFX_URLS[kind]);
      effect.preload = 'auto';
      effect.volume = SFX_VOLUME[kind];
      return effect;
    });
    this.effectPools.set(kind, pool);
    return pool;
  }

  play(kind: SfxKind) {
    if (!this.enabled) return;
    const context = this.context();
    const buffer = this.effectBuffers.get(kind);
    if (context && buffer) {
      if (context.state === 'suspended') void context.resume();
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = SFX_VOLUME[kind];
      source.connect(gain).connect(context.destination);
      source.start(0);
      return;
    }
    void this.loadEffectBuffer(kind);
    const pool = this.effectPool(kind);
    const available = pool.find(effect => effect.paused || effect.ended);
    const cursor = this.effectCursor.get(kind) ?? 0;
    const effect = available ?? pool[cursor % pool.length];
    this.effectCursor.set(kind, cursor + 1);
    if (!effect.paused) effect.pause();
    effect.currentTime = 0;
    effect.volume = SFX_VOLUME[kind];
    void effect.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }

  music(enabled: boolean) {
    if (!this.musicTrack) {
      const selected = MUSIC_TRACKS.find(item => item.id === this.selectedTrack) ?? MUSIC_TRACKS[0];
      this.musicTrack = new Audio(selected.url);
      this.musicTrack.loop = true;
      this.musicTrack.preload = 'auto';
      this.musicTrack.volume = this.musicVolume;
      this.musicTrack.preservesPitch = true;
    }
    if (!enabled) {
      this.musicTrack.pause();
      return;
    }
    void this.musicTrack.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }
}
