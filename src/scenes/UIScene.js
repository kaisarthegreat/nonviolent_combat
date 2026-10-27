import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';
import { audioManager } from '../managers/AudioManager.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const width = this.cameras.main.width;

    // 1. HUD Top Bar Container
    this.add.rectangle(width / 2, 32, width - 40, 48, 0x16213e, 0.92)
      .setStrokeStyle(2, 0x4ecca3, 0.5);

    // 2. Health Bar
    this.add.text(45, 23, 'HEALTH (HP)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.healthBarBg = this.add.rectangle(155, 32, 150, 16, 0x222222).setOrigin(0, 0.5);
    this.healthBar = this.add.rectangle(155, 32, 150, 16, 0xe94560).setOrigin(0, 0.5);
    this.healthText = this.add.text(230, 32, '100 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 3. Public Support Bar
    this.add.text(335, 23, 'SOLIDARITY (SP)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.supportBarBg = this.add.rectangle(460, 32, 150, 16, 0x222222).setOrigin(0, 0.5);
    this.supportBar = this.add.rectangle(460, 32, 0, 16, 0x4ecca3).setOrigin(0, 0.5);
    this.supportText = this.add.text(535, 32, '0 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 4. Opponents Standing Counter
    this.opponentText = this.add.text(width - 110, 32, `Armed Forces: ${gameState.opponentsActive}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffd54f'
    }).setOrigin(1, 0.5);

    // 5. Sound Mute Button
    this.soundBtn = this.add.rectangle(width - 50, 32, 34, 28, 0x243352)
      .setStrokeStyle(1, 0x4ecca3)
      .setInteractive({ useHandCursor: true });
    
    this.soundIcon = this.add.text(width - 50, 32, '🔊', { fontSize: '14px' }).setOrigin(0.5);

    this.soundBtn.on('pointerdown', () => {
      const isMuted = audioManager.toggleMute();
      this.soundIcon.setText(isMuted ? '🔇' : '🔊');
    });

    // 6. Route Progress Track (Mini-Map Bar)
    this.createProgressTrack(width);

    // 7. Rule Violation Alert Banner
    this.alertBanner = this.add.container(width / 2, 92).setAlpha(0);
    this.alertBg = this.add.rectangle(0, 0, 520, 30, 0xff1744, 0.88).setStrokeStyle(1, 0xffffff);
    this.alertText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.alertBanner.add([this.alertBg, this.alertText]);

    // 8. Action Guide Overlay (Bottom Left)
    const guideText = 'Controls: [WASD] March | [SPACE] Timed Dodge | [SHIFT] Kneel | [E] Peaceful Chant | [F] Prohibited Violence';
    this.add.text(25, this.cameras.main.height - 25, guideText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#8b949e',
      backgroundColor: 'rgba(13, 17, 23, 0.75)',
      padding: { x: 8, y: 4 }
    });

    // 9. Event Subscriptions
    this.bindEvents();
  }

  createProgressTrack(width) {
    const trackWidth = 320;
    const trackX = width / 2;
    const trackY = 62;

    // Track line
    this.add.rectangle(trackX, trackY, trackWidth, 4, 0x334155).setOrigin(0.5);

    // Checkpoint icons along track
    // CP1 at ~33%
    this.add.circle(trackX - trackWidth / 2 + trackWidth * 0.33, trackY, 5, 0xd97736);
    // CP2 at ~66%
    this.add.circle(trackX - trackWidth / 2 + trackWidth * 0.66, trackY, 5, 0xd97736);
    // Assembly Gates at 100%
    this.add.circle(trackX + trackWidth / 2, trackY, 6, 0xffd54f);

    // Moving player pin on track
    this.trackStartX = trackX - trackWidth / 2;
    this.trackWidth = trackWidth;
    this.progressPin = this.add.circle(this.trackStartX, trackY, 6, 0x4ecca3)
      .setStrokeStyle(2, 0xffffff);
  }

  bindEvents() {
    this.onHealthChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.healthBar.width = (clamped / 100) * 150;
      this.healthText.setText(`${clamped} / 100`);

      if (clamped < 30) this.healthBar.setFillStyle(0xff1744);
      else if (clamped < 60) this.healthBar.setFillStyle(0xff9100);
      else this.healthBar.setFillStyle(0xe94560);
    };

    this.onSupportChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.supportBar.width = (clamped / 100) * 150;
      this.supportText.setText(`${clamped} / 100`);
    };

    this.onOpponentsChanged = (count) => {
      this.opponentText.setText(`Armed Forces: ${count}`);
    };

    gameState.on(EVENTS.HEALTH_CHANGED, this.onHealthChanged);
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportChanged);
    gameState.on(EVENTS.OPPONENT_COUNT_CHANGED, this.onOpponentsChanged);

    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('ruleAlert', (data) => this.showAlert(data.message));
      gameScene.events.on('ruleCleared', () => this.hideAlert());
      gameScene.events.on('playerProgress', (ratio) => {
        if (this.progressPin) {
          this.progressPin.x = this.trackStartX + this.trackWidth * ratio;
        }
      });
    }
  }

  showAlert(message) {
    this.alertText.setText(message);
    this.tweens.killTweensOf(this.alertBanner);
    this.tweens.add({
      targets: this.alertBanner,
      alpha: 1,
      y: 92,
      duration: 200,
      ease: 'Power1'
    });
  }

  hideAlert() {
    this.tweens.killTweensOf(this.alertBanner);
    this.tweens.add({
      targets: this.alertBanner,
      alpha: 0,
      y: 82,
      duration: 300,
      ease: 'Power1'
    });
  }

  shutdown() {
    gameState.off(EVENTS.HEALTH_CHANGED, this.onHealthChanged);
    gameState.off(EVENTS.SUPPORT_CHANGED, this.onSupportChanged);
    gameState.off(EVENTS.OPPONENT_COUNT_CHANGED, this.onOpponentsChanged);
  }
}
