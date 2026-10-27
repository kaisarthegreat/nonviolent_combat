import Phaser from 'phaser';
import { gameConfig } from './config.js';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline capability
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('New game update available. Reloading...');
    },
    onOfflineReady() {
      console.log('Satyagraha is ready to play offline.');
    }
  });
}

// Bootstrap Phaser Game
window.addEventListener('load', () => {
  new Phaser.Game(gameConfig);
});
