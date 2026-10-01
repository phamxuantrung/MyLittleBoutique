import Phaser from 'phaser';
import './style.css';
import './ui/studio.css';
import './ui/social.css';
import { GameStore } from './systems/store';
import { AudioSystem } from './systems/audio';
import { GameUI } from './ui/GameUI';
import { ShopScene } from './scenes/ShopScene';

const store = new GameStore();
const audio = new AudioSystem();
audio.enabled = store.state.sound;
audio.setMusicVolume(store.state.musicVolume);
audio.setMusicTrack(store.state.musicTrack);
if (store.state.music) audio.music(true);
const ui = new GameUI(store, audio);
const scene = new ShopScene(store, () => { audio.play('click'); ui.openServe(); }, uid => ui.selectFurniture(uid), orderId => ui.openOnlineOrder(orderId), () => ui.openMusicPlayer());
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
document.addEventListener('pointerdown', () => {
  void audio.unlock().then(() => { if (store.state.music) audio.music(true); });
}, { once: true });

if (import.meta.hot) import.meta.hot.dispose(() => { audio.music(false); game.destroy(true); });
