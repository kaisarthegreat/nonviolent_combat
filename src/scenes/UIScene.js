import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const width = this.cameras.main.width;

    // 1. HUD Top Bar Container
    this.add.rectangle(width / 2, 35, width - 40, 52, 0x16213e, 0.9)
      .setStrokeStyle(2, 0x4ecca3, 0.5);

    // 2. Health Bar
    this.add.text(45, 25, 'HEALTH (HP)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.healthBarBg = this.add.rectangle(155, 35, 160, 18, 0x222222).setOrigin(0, 0.5);
    this.healthBar = this.add.rectangle(155, 35, 160, 18, 0xe94560).setOrigin(0, 0.5);
    this.healthText = this.add.text(235, 35, '100 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 3. Public Support Bar
    this.add.text(350, 25, 'PUBLIC SOLIDARITY (SP)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.supportBarBg = this.add.rectangle(510, 35, 160, 18, 0x222222).setOrigin(0, 0.5);
    this.supportBar = this.add.rectangle(510, 35, 0, 18, 0x4ecca3).setOrigin(0, 0.5);
    this.supportText = this.add.text(590, 35, '0 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 4. Opponents Standing Counter
    this.opponentText = this.add.text(width - 60, 35, `Armed Forces: ${gameState.opponentsActive}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd54f'
    }).setOrigin(1, 0.5);

    // 5. Rule Violation Alert Banner (Centered below HUD, hidden by default)
    this.alertBanner = this.add.container(width / 2, 85).setAlpha(0);
    this.alertBg = this.add.rectangle(0, 0, 480, 32, 0xff1744, 0.88).setStrokeStyle(1, 0xffffff);
    this.alertText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.alertBanner.add([this.alertBg, this.alertText]);

    // 6. Action Guide Overlay (Bottom Left)
    const guideText = 'Controls: [WASD] March | [SPACE] Timed Dodge | [SHIFT] Kneel / Hold Ground | [F] Prohibited Violence';
    this.add.text(25, this.cameras.main.height - 25, guideText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#8b949e',
      backgroundColor: 'rgba(13, 17, 23, 0.7)',
      padding: { x: 8, y: 4 }
    });

    // 7. Event Subscriptions
    this.bindEvents();
  }

  bindEvents() {
    this.onHealthChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.healthBar.width = (clamped / 100) * 160;
      this.healthText.setText(`${clamped} / 100`);

      // Dynamic color: green -> yellow -> red
      if (clamped < 30) this.healthBar.setFillStyle(0xff1744);
      else if (clamped < 60) this.healthBar.setFillStyle(0xff9100);
      else this.healthBar.setFillStyle(0xe94560);
    };

    this.onSupportChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.supportBar.width = (clamped / 100) * 160;
      this.supportText.setText(`${clamped} / 100`);
    };

    this.onOpponentsChanged = (count) => {
      this.opponentText.setText(`Armed Forces: ${count}`);
    };

    gameState.on(EVENTS.HEALTH_CHANGED, this.onHealthChanged);
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportChanged);
    gameState.on(EVENTS.OPPONENT_COUNT_CHANGED, this.onOpponentsChanged);

    // Rule Alerts from GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('ruleAlert', (data) => this.showAlert(data.message));
      gameScene.events.on('ruleCleared', () => this.hideAlert());
    }
  }

  showAlert(message) {
    this.alertText.setText(message);
    this.tweens.killTweensOf(this.alertBanner);
    this.tweens.add({
      targets: this.alertBanner,
      alpha: 1,
      y: 85,
      duration: 200,
      ease: 'Power1'
    });
  }

  hideAlert() {
    this.tweens.killTweensOf(this.alertBanner);
    this.tweens.add({
      targets: this.alertBanner,
      alpha: 0,
      y: 75,
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
