import Phaser from 'phaser';
import './style.css';
import './ui/studio.css';
import { GameStore } from './systems/store';
import { AudioSystem } from './systems/audio';
import { GameUI } from './ui/GameUI';
import { ShopScene } from './scenes/ShopScene';

const store = new GameStore();
const audio = new AudioSystem();
audio.enabled = store.state.sound;
audio.setMusicVolume(store.state.musicVolume);
const ui = new GameUI(store, audio);
const scene = new ShopScene(store, () => ui.openServe(), uid => ui.selectFurniture(uid), orderId => ui.openOnlineOrder(orderId));
const game = new Phaser.Game({
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
window.addEventListener('resize', () => { game.scale.refresh(); });
ui.attachScene(scene);
game.events.once('shop-ready', () => {
  document.querySelector('.game-loading')?.remove();
  document.querySelector('#game-canvas')?.setAttribute('data-ready', 'true');
});
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

const isPortraitMobile = () => window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches;

const lockLandscape = async (requestFullscreen: boolean) => {
  if (!isPortraitMobile()) return;

  // Mobile browsers generally require fullscreen and a user gesture before
  // allowing an orientation lock. Installed PWAs use the manifest setting.
  if (requestFullscreen && !document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch (_) {}
  }

  try {
    const orientation = screen.orientation as LockableScreenOrientation | undefined;
    if (orientation?.lock) await orientation.lock('landscape');
  } catch (_) {}
};

document.addEventListener('pointerdown', () => {
  void lockLandscape(true);
  void audio.unlock().then(() => { if (store.state.music) audio.music(true); });
}, { once: true });

void lockLandscape(false);
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) void lockLandscape(false);
});
if (import.meta.hot) import.meta.hot.dispose(() => { audio.music(false); game.destroy(true); });
