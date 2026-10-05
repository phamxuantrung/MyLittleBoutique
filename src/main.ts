import Phaser from 'phaser';
import './style.css';
import './ui/studio.css';
import './ui/social.css';
import { GameStore } from './systems/store';
import { AudioSystem } from './systems/audio';
import { GameUI } from './ui/GameUI';
import { ShopScene } from './scenes/ShopScene';
import { recoveredFurnitureCount } from './systems/save';
import { preloadGameAssets } from './systems/preload';

let game: Phaser.Game | undefined;
let viewportFrame = 0;
let viewportSettleTimers: number[] = [];

const isLandscapeViewport = () => {
  const legacyAngle = Number((window as Window & { orientation?: number }).orientation ?? 0);
  return window.matchMedia('(orientation: landscape)').matches
    || Math.abs(window.screen.orientation?.angle ?? 0) === 90
    || Math.abs(legacyAngle) === 90
    || window.innerWidth > window.innerHeight;
};

/**
 * Mobile Safari can report its final landscape height a few frames after the
 * page starts. Keep the app tied to the visual viewport instead of the stale
 * initial 100vh/100dvh value, then let Phaser refit the canvas to that box.
 */
const syncVisualViewport = () => {
  const viewport = window.visualViewport;
  // On a cold landscape launch iOS may initially report visualViewport as
  // shorter than the actual layout viewport. Never shrink the game to that
  // transient value; include its offset for Safari's shifted visual viewport.
  const visualHeight = Math.round((viewport?.height ?? 0) + (viewport?.offsetTop ?? 0));
  const visualWidth = Math.round((viewport?.width ?? 0) + (viewport?.offsetLeft ?? 0));
  const landscape = isLandscapeViewport();
  const screenWidth = Number(window.screen.width) || window.innerWidth;
  const screenHeight = Number(window.screen.height) || window.innerHeight;
  const screenLongSide = Math.max(screenWidth, screenHeight);
  const screenShortSide = Math.min(screenWidth, screenHeight);
  const measuredHeight = Math.max(visualHeight, window.innerHeight, document.documentElement.clientHeight);
  const measuredWidth = Math.max(visualWidth, window.innerWidth, document.documentElement.clientWidth);
  // A cold iOS launch can briefly keep the previous portrait innerHeight even
  // though orientation already says landscape. Clamp that stale long side out.
  const height = landscape ? Math.min(measuredHeight, screenShortSide) : Math.min(measuredHeight, screenLongSide);
  const width = landscape ? Math.min(measuredWidth, screenLongSide) : Math.min(measuredWidth, screenShortSide);
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.documentElement.style.setProperty('--app-width', `${width}px`);
  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(() => game?.scale.refresh());
};

syncVisualViewport();

const bootLoader = document.querySelector<HTMLElement>('#game-boot-loader');
const bootProgress = document.querySelector<HTMLElement>('#boot-progress');
const bootPercent = document.querySelector<HTMLElement>('#boot-percent');
const bootStatus = document.querySelector<HTMLElement>('#boot-status');
const updateBootLoader = (ratio: number, status?: string) => {
  const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  if (bootProgress) bootProgress.style.width = `${Math.max(2, percent)}%`;
  if (bootPercent) bootPercent.textContent = `${percent}%`;
  if (bootStatus && status) bootStatus.textContent = status;
};

const waitForInitialLandscapeViewport = async () => {
  const coarse = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const landscape = isLandscapeViewport();
  if (!coarse || !landscape) return;

  const startedAt = performance.now();
  let lastSignature = '';
  let stableSamples = 0;
  await new Promise<void>(resolve => {
    const sample = () => {
      syncVisualViewport();
      const viewport = window.visualViewport;
      const signature = [
        Math.round(viewport?.width ?? 0),
        Math.round(viewport?.height ?? 0),
        window.innerWidth,
        window.innerHeight,
        document.documentElement.clientWidth,
        document.documentElement.clientHeight,
      ].join('x');
      stableSamples = signature === lastSignature ? stableSamples + 1 : 0;
      lastSignature = signature;
      const elapsed = performance.now() - startedAt;
      if (elapsed >= 320 && stableSamples >= 3 || elapsed >= 1600) {
        syncVisualViewport();
        resolve();
        return;
      }
      window.setTimeout(sample, 80);
    };
    requestAnimationFrame(() => requestAnimationFrame(sample));
  });
};

await waitForInitialLandscapeViewport();

updateBootLoader(.02, 'Đang tải hình ảnh và âm thanh…');
const preloadResult = await preloadGameAssets(progress => {
  const labels = {
    image: 'Đang tải hình ảnh…',
    audio: 'Đang tải âm thanh…',
    font: 'Đang chuẩn bị phông chữ…',
  } as const;
  updateBootLoader(.02 + progress.ratio * .86, labels[progress.kind]);
});
if (preloadResult.failures.length) console.warn('Một số tài nguyên không thể nạp trước:', preloadResult.failures);
updateBootLoader(.9, 'Đang dựng cửa hàng…');

const store = new GameStore();
let ui!: GameUI;
const audio = new AudioSystem(() => ui?.refreshMusicPlayerPlayback());
audio.enabled = store.state.sound;
audio.setMusicVolume(store.state.musicVolume);
audio.setEffectsVolume(store.state.effectsVolume);
audio.setMusicTrack(store.state.musicTrack);
updateBootLoader(.91, 'Đang giải mã hiệu ứng âm thanh…');
await audio.prepare();
if (store.state.music) audio.music(true);
ui = new GameUI(store, audio);
const recoveredFurniture = recoveredFurnitureCount(store.state);
if (recoveredFurniture) {
  // Persist the repaired layout immediately so the notice appears only once.
  store.commit();
  window.setTimeout(() => {
    store.toast(`Đã chuyển ${recoveredFurniture} món nội thất không còn vừa vị trí cũ vào Kho nội thất.`);
  }, 350);
}
const scene = new ShopScene(
  store,
  () => { audio.play('click'); ui.openServe(); },
  (uid, tapped) => { if (tapped) audio.play('itemTap'); ui.selectFurniture(uid); },
  orderId => ui.openOnlineOrder(orderId),
  () => { audio.play('itemTap'); ui.openMusicPlayer(false); },
);
const phaserProgress = (event: Event) => {
  const ratio = Number((event as CustomEvent<number>).detail) || 0;
  updateBootLoader(.9 + ratio * .09, 'Đang sắp xếp cửa hàng…');
};
window.addEventListener('game-asset-progress', phaserProgress);
game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1000,
  height: 700,
  backgroundColor: '#fdf0f8',
  antialias: true,
  scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  // Keeping the WebGL drawing buffer alive costs a full-screen copy every
  // frame on mobile. The shop snapshot feature was removed, so let the
  // browser discard it after presenting each frame.
  render: { transparent: false, roundPixels: false, antialias: true, preserveDrawingBuffer: false },
  input: { activePointers: 2 },
  scene: [scene],
  audio: { noAudio: true },
  banner: false,
});
const settleMobileViewport = () => {
  viewportSettleTimers.forEach(timer => window.clearTimeout(timer));
  viewportSettleTimers = [];
  syncVisualViewport();
  // Safari can finish expanding a directly-opened landscape tab well after
  // its first resize/orientation event, especially when restored from history.
  for (const delay of [50, 150, 320, 650, 1000, 1600, 2400, 3600]) {
    viewportSettleTimers.push(window.setTimeout(syncVisualViewport, delay));
  }
};
window.addEventListener('resize', settleMobileViewport, { passive: true });
window.addEventListener('orientationchange', settleMobileViewport, { passive: true });
window.screen.orientation?.addEventListener('change', settleMobileViewport);
window.addEventListener('pageshow', settleMobileViewport, { passive: true });
window.addEventListener('focus', settleMobileViewport, { passive: true });
window.visualViewport?.addEventListener('resize', syncVisualViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', syncVisualViewport, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) settleMobileViewport(); });
document.addEventListener('pointerdown', syncVisualViewport, { capture: true, passive: true });
new ResizeObserver(syncVisualViewport).observe(document.documentElement);
settleMobileViewport();
ui.attachScene(scene);
game.events.once('shop-ready', () => {
  window.removeEventListener('game-asset-progress', phaserProgress);
  document.querySelector('.game-loading')?.remove();
  document.querySelector('#game-canvas')?.setAttribute('data-ready', 'true');
  updateBootLoader(1, 'Cửa hàng đã sẵn sàng!');
  const app = document.querySelector<HTMLElement>('#app');
  app?.removeAttribute('aria-hidden');
  document.body.classList.remove('game-booting');
  requestAnimationFrame(() => {
    bootLoader?.classList.add('is-ready');
    window.setTimeout(() => bootLoader?.remove(), 320);
  });
});
document.addEventListener('pointerdown', () => {
  void audio.unlock().then(() => { if (store.state.music) audio.music(true); });
}, { once: true });

if (import.meta.hot) import.meta.hot.dispose(() => { audio.stopMusic(); game?.destroy(true); });
