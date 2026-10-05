export type SfxKind = 'click' | 'itemTap' | 'coin' | 'error' | 'reward' | 'payment' | 'entry' | 'exit' | 'closing' | 'disappointment' | 'equip' | 'levelUp';

const AUDIO_ROOT = `${import.meta.env.BASE_URL}assets/audio/`;
const BACKGROUND_VOLUME_SCALE = .42;
export const BACKGROUND_MUSIC = {
  id: 'pastel-boutique-melody',
  name: 'Pastel Boutique Melody',
  mood: 'Nhạc nền của boutique',
  url: `${AUDIO_ROOT}pastel-boutique-melody.mp3`,
} as const;
export const SALE_BACKGROUND_MUSIC = {
  id: 'chibi-chic-boutique-bgm',
  name: 'Chibi Chic Boutique BGM',
  mood: 'Nhạc nền trong giờ bán hàng',
  url: `${AUDIO_ROOT}chibi-chic-boutique-bgm.mp3`,
} as const;
export const MUSIC_TRACKS = [
  { id: 'better-for-you-1', name: 'Better for You', mood: 'siopaolo · Visualizer', url: `${AUDIO_ROOT}better-for-you-1.mp3` },
  { id: 'die-for-you-remix', name: 'Die For You (Remix)', mood: 'The Weeknd · Ariana Grande', url: `${AUDIO_ROOT}die-for-you-remix.mp3` },
  { id: 'daffodil-live', name: 'Daffodil (Live Session)', mood: 'Saint Harison', url: `${AUDIO_ROOT}daffodil-live.mp3` },
] as const;
const SFX_URLS: Record<SfxKind, string> = {
  click: `${AUDIO_ROOT}click.mp3`,
  itemTap: `${AUDIO_ROOT}item-tap.mp3`,
  coin: `${AUDIO_ROOT}coin.mp3`,
  error: `${AUDIO_ROOT}error.mp3`,
  reward: `${AUDIO_ROOT}reward.mp3`,
  payment: `${AUDIO_ROOT}payment.mp3`,
  entry: `${AUDIO_ROOT}entry.mp3`,
  exit: `${AUDIO_ROOT}exit.mp3`,
  closing: `${AUDIO_ROOT}closing.mp3`,
  disappointment: `${AUDIO_ROOT}disappointment.mp3`,
  equip: `${AUDIO_ROOT}equip.mp3`,
  levelUp: `${AUDIO_ROOT}level-up.mp3`,
};
export const GAME_AUDIO_URLS = Object.freeze([
  BACKGROUND_MUSIC.url,
  SALE_BACKGROUND_MUSIC.url,
  ...MUSIC_TRACKS.map(track => track.url),
  ...Object.values(SFX_URLS),
]);
const SFX_VOLUME: Record<SfxKind, number> = {
  click: .62,
  itemTap: .72,
  coin: .76,
  error: .76,
  reward: .86,
  payment: .92,
  entry: .78,
  exit: .74,
  closing: .86,
  disappointment: .8,
  equip: .76,
  levelUp: .92,
};

const SFX_RATE_VARIATION: Partial<Record<SfxKind, number>> = {
  click: .035,
  itemTap: .025,
  coin: .025,
  equip: .025,
};

export class AudioSystem {
  private backgroundTrack?: HTMLAudioElement;
  private playerTrack?: HTMLAudioElement;
  private effectPools = new Map<SfxKind, HTMLAudioElement[]>();
  private effectCursor = new Map<SfxKind, number>();
  private effectLastPlayedAt = new Map<SfxKind, number>();
  private effectContext?: AudioContext;
  private effectBuffers = new Map<SfxKind, AudioBuffer>();
  private effectLoads = new Map<SfxKind, Promise<void>>();
  private musicVolume = 0.55;
  private effectsVolume = 0.85;
  private selectedTrack: string = MUSIC_TRACKS[0].id;
  private backgroundEnabled = true;
  private backgroundMode: 'boutique' | 'sale' = 'boutique';
  private backgroundGain = 1;
  private backgroundFadeTimer?: number;
  enabled = true;

  constructor(private onMusicPlaybackChanged?: () => void) {
    // Start fetching and decoding while the opening screen is visible. HTML
    // audio remains as a fallback, but decoded Web Audio buffers remove the
    // first-tap delay that Mobile Safari adds to MP3 elements.
    (Object.keys(SFX_URLS) as SfxKind[]).forEach(kind => {
      this.effectPool(kind).forEach(effect => effect.load());
      void this.loadEffectBuffer(kind);
    });
  }

  /** Hoàn tất giải mã toàn bộ hiệu ứng trước khi màn hình game được mở. */
  async prepare() {
    await Promise.all((Object.keys(SFX_URLS) as SfxKind[]).map(kind => this.loadEffectBuffer(kind)));
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
    this.applyBackgroundVolume();
    if (this.playerTrack) this.playerTrack.volume = this.musicVolume;
  }

  setEffectsVolume(value: number) {
    this.effectsVolume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.85));
    for (const [kind, pool] of this.effectPools) {
      const volume = Math.min(1, SFX_VOLUME[kind] * this.effectsVolume);
      pool.forEach(effect => { effect.volume = volume; });
    }
  }

  setMusicTrack(trackId: string) {
    const track = MUSIC_TRACKS.find(item => item.id === trackId) ?? MUSIC_TRACKS[0];
    if (track.id === this.selectedTrack) return;
    this.selectedTrack = track.id;
    if (!this.playerTrack) return;
    this.playerTrack.pause();
    this.playerTrack.src = track.url;
    this.playerTrack.load();
    this.onMusicPlaybackChanged?.();
  }

  playMusicTrack(trackId: string) {
    this.setMusicTrack(trackId);
    const selected = MUSIC_TRACKS.find(item => item.id === this.selectedTrack) ?? MUSIC_TRACKS[0];
    if (!this.playerTrack) {
      this.playerTrack = new Audio(selected.url);
      this.playerTrack.preload = 'auto';
      this.playerTrack.loop = false;
      this.playerTrack.volume = this.musicVolume;
      this.playerTrack.preservesPitch = true;
      this.playerTrack.addEventListener('ended', () => {
        this.onMusicPlaybackChanged?.();
        this.resumeBackgroundMusic();
      });
    } else if (!this.playerTrack.src.endsWith(selected.url)) {
      this.playerTrack.src = selected.url;
      this.playerTrack.load();
    }
    this.backgroundTrack?.pause();
    this.playerTrack.pause();
    this.playerTrack.currentTime = 0;
    void this.playerTrack.play()
      .then(() => this.onMusicPlaybackChanged?.())
      .catch(() => {
        this.onMusicPlaybackChanged?.();
        this.resumeBackgroundMusic();
      });
  }

  isMusicTrackPlaying(trackId?: string) {
    return !!this.playerTrack
      && !this.playerTrack.paused
      && !this.playerTrack.ended
      && (!trackId || trackId === this.selectedTrack);
  }

  stopMusicTrack() {
    if (this.playerTrack) {
      this.playerTrack.pause();
      this.playerTrack.currentTime = 0;
    }
    this.onMusicPlaybackChanged?.();
    this.resumeBackgroundMusic();
  }

  private ensureBackgroundTrack() {
    if (this.backgroundTrack) return this.backgroundTrack;
    const source = this.backgroundMode === 'sale' ? SALE_BACKGROUND_MUSIC : BACKGROUND_MUSIC;
    this.backgroundTrack = new Audio(source.url);
    this.backgroundTrack.loop = true;
    this.backgroundTrack.preload = 'auto';
    this.applyBackgroundVolume();
    this.backgroundTrack.preservesPitch = true;
    return this.backgroundTrack;
  }

  private resumeBackgroundMusic() {
    if (!this.backgroundEnabled || this.isMusicTrackPlaying()) return;
    const background = this.ensureBackgroundTrack();
    void background.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }

  private applyBackgroundVolume() {
    if (this.backgroundTrack) this.backgroundTrack.volume = Math.min(1, this.musicVolume * BACKGROUND_VOLUME_SCALE * this.backgroundGain);
  }

  private fadeBackgroundGain(target: number, duration: number) {
    if (this.backgroundFadeTimer !== undefined) window.clearInterval(this.backgroundFadeTimer);
    const to = Math.max(0, Math.min(1, target));
    if (duration <= 0 || Math.abs(this.backgroundGain - to) < .002) {
      this.backgroundGain = to;
      this.applyBackgroundVolume();
      this.backgroundFadeTimer = undefined;
      return;
    }
    const from = this.backgroundGain;
    const startedAt = performance.now();
    this.backgroundFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / duration);
      this.backgroundGain = from + (to - from) * (1 - Math.pow(1 - progress, 2));
      this.applyBackgroundVolume();
      if (progress < 1) return;
      if (this.backgroundFadeTimer !== undefined) window.clearInterval(this.backgroundFadeTimer);
      this.backgroundFadeTimer = undefined;
    }, 40);
  }

  syncBackgroundForGame(saleOpen: boolean, remainingSeconds: number) {
    const mode = saleOpen ? 'sale' : 'boutique';
    const endingGain = saleOpen ? Math.max(0, Math.min(1, remainingSeconds / 15)) : 1;
    if (mode !== this.backgroundMode) {
      this.backgroundMode = mode;
      const source = mode === 'sale' ? SALE_BACKGROUND_MUSIC : BACKGROUND_MUSIC;
      const background = this.ensureBackgroundTrack();
      background.pause();
      background.src = source.url;
      background.currentTime = 0;
      background.load();
      this.backgroundGain = 0;
      this.applyBackgroundVolume();
      if (this.backgroundEnabled && !this.isMusicTrackPlaying()) {
        void background.play().catch(() => { /* Playback resumes after the next user gesture. */ });
      }
      this.fadeBackgroundGain(endingGain, mode === 'sale' ? 700 : 1800);
      return;
    }
    if (saleOpen && Math.abs(this.backgroundGain - endingGain) >= .002) this.fadeBackgroundGain(endingGain, 280);
  }

  private effectPool(kind: SfxKind) {
    let pool = this.effectPools.get(kind);
    if (pool) return pool;
    pool = Array.from({ length: 3 }, () => {
      const effect = new Audio(SFX_URLS[kind]);
      effect.preload = 'auto';
      effect.volume = Math.min(1, SFX_VOLUME[kind] * this.effectsVolume);
      return effect;
    });
    this.effectPools.set(kind, pool);
    return pool;
  }

  private effectPlaybackRate(kind: SfxKind) {
    const variation = SFX_RATE_VARIATION[kind] ?? 0;
    return variation ? 1 + (Math.random() * 2 - 1) * variation : 1;
  }

  play(kind: SfxKind) {
    if (!this.enabled) return;
    const now = performance.now();
    const lastPlayedAt = this.effectLastPlayedAt.get(kind) ?? -Infinity;
    if (now - lastPlayedAt < 90) return;
    this.effectLastPlayedAt.set(kind, now);
    const context = this.context();
    const buffer = this.effectBuffers.get(kind);
    if (context && buffer) {
      if (context.state === 'suspended') void context.resume();
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = this.effectPlaybackRate(kind);
      gain.gain.value = Math.min(1, SFX_VOLUME[kind] * this.effectsVolume);
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
    effect.volume = Math.min(1, SFX_VOLUME[kind] * this.effectsVolume);
    effect.playbackRate = this.effectPlaybackRate(kind);
    void effect.play().catch(() => { /* Playback resumes after the next user gesture. */ });
  }

  music(enabled: boolean) {
    this.backgroundEnabled = enabled;
    const background = this.ensureBackgroundTrack();
    if (!enabled) {
      background.pause();
      return;
    }
    this.resumeBackgroundMusic();
  }

  stopMusic() {
    if (this.backgroundFadeTimer !== undefined) window.clearInterval(this.backgroundFadeTimer);
    this.backgroundFadeTimer = undefined;
    this.backgroundTrack?.pause();
    this.playerTrack?.pause();
  }
}
