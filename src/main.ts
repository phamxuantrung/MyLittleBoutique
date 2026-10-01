import Phaser from 'phaser';
import './style.css';
import './ui/studio.css';
import './ui/social.css';
import { GameStore } from './systems/store';
import { AudioSystem } from './systems/audio';
import { GameUI } from './ui/GameUI';
import { ShopScene } from './scenes/ShopScene';

let game: Phaser.Game | undefined;
let viewportFrame = 0;
let viewportSettleTimers: number[] = [];

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
  const height = Math.max(visualHeight, window.innerHeight, document.documentElement.clientHeight);
  const width = Math.max(visualWidth, window.innerWidth, document.documentElement.clientWidth);
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.documentElement.style.setProperty('--app-width', `${width}px`);
  cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(() => game?.scale.refresh());
};

syncVisualViewport();

const store = new GameStore();
const audio = new AudioSystem();
audio.enabled = store.state.sound;
audio.setMusicVolume(store.state.musicVolume);
audio.setMusicTrack(store.state.musicTrack);
if (store.state.music) audio.music(true);
const ui = new GameUI(store, audio);
const scene = new ShopScene(store, () => { audio.play('click'); ui.openServe(); }, uid => ui.selectFurniture(uid), orderId => ui.openOnlineOrder(orderId), () => ui.openMusicPlayer());
game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: 1000,
  height: 700,
  backgroundColor: '#fdf0f8',
  antialias: true,
  scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { transparent: false, roundPixels: false, antialias: true, preserveDrawingBuffer: true },
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
  document.querySelector('.game-loading')?.remove();
  document.querySelector('#game-canvas')?.setAttribute('data-ready', 'true');
});
document.addEventListener('pointerdown', () => {
  void audio.unlock().then(() => { if (store.state.music) audio.music(true); });
}, { once: true });

if (import.meta.hot) import.meta.hot.dispose(() => { audio.music(false); game?.destroy(true); });
