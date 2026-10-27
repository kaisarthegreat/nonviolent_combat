import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const width = this.cameras.main.width;

    // HUD Background Banner
    this.add.rectangle(width / 2, 35, width - 40, 50, 0x16213e, 0.85)
      .setStrokeStyle(2, 0x4ecca3, 0.4);

    // Health Bar Label & Container
    this.add.text(40, 25, 'HEALTH', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.healthBarBg = this.add.rectangle(150, 35, 160, 18, 0x333333).setOrigin(0, 0.5);
    this.healthBar = this.add.rectangle(150, 35, 160, 18, 0xe94560).setOrigin(0, 0.5);
    this.healthText = this.add.text(230, 35, '100 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Public Support Bar Label & Container
    this.add.text(340, 25, 'PUBLIC SUPPORT', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    this.supportBarBg = this.add.rectangle(480, 35, 160, 18, 0x333333).setOrigin(0, 0.5);
    this.supportBar = this.add.rectangle(480, 35, 0, 18, 0x4ecca3).setOrigin(0, 0.5);
    this.supportText = this.add.text(560, 35, '0 / 100', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Opponent Count
    this.opponentText = this.add.text(width - 60, 35, `Opponents: ${gameState.opponentsActive}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffca28'
    }).setOrigin(1, 0.5);

    // Event Subscriptions
    this.onHealthChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.healthBar.width = (clamped / 100) * 160;
      this.healthText.setText(`${clamped} / 100`);
    };

    this.onSupportChanged = (val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      this.supportBar.width = (clamped / 100) * 160;
      this.supportText.setText(`${clamped} / 100`);
    };

    this.onOpponentCountChanged = (count) => {
      this.opponentText.setText(`Opponents: ${count}`);
    };

    gameState.on(EVENTS.HEALTH_CHANGED, this.onHealthChanged);
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportChanged);
    gameState.on(EVENTS.OPPONENT_COUNT_CHANGED, this.onOpponentCountChanged);
  }

  shutdown() {
    gameState.off(EVENTS.HEALTH_CHANGED, this.onHealthChanged);
    gameState.off(EVENTS.SUPPORT_CHANGED, this.onSupportChanged);
    gameState.off(EVENTS.OPPONENT_COUNT_CHANGED, this.onOpponentCountChanged);
  }
}
