import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const isVictory = data && data.result === 'victory';

    // Dark background overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1117, 0.95);

    // Headline
    const headlineText = isVictory ? 'MORAL VICTORY!' : 'LINE BROKEN';
    const headlineColor = isVictory ? '#4ecca3' : '#e94560';

    this.add.text(width / 2, height * 0.3, headlineText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: headlineColor
    }).setOrigin(0.5);

    // Detail Message
    const detailMsg = isVictory
      ? 'Your steadfast non-violence awakened the conscience of the opposition.\nThe armed forces stood down.'
      : 'You collapsed under the brutality of the opposition.\nThe march ended, but your courage was recorded.';

    this.add.text(width / 2, height * 0.48, detailMsg, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#cbd5e1',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Restart Button
    const restartBtn = this.add.rectangle(width / 2, height * 0.72, 220, 50, 0x4ecca3)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height * 0.72, 'MARCH AGAIN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });
  }
}
