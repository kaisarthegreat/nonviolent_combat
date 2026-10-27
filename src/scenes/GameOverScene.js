import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const isVictory = data && data.result === 'victory';
    const stats = data && data.stats ? data.stats : {
      blowsAbsorbed: 0,
      dodgesClean: 0,
      chantsUsed: 0,
      opponentsDispersed: 0,
      maxSupport: 0
    };

    // Dark backdrop overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0f1d, 0.95);

    // Headline
    const headlineText = isVictory ? '🕊️ MORAL VICTORY!' : '⚡ LINE BROKEN';
    const headlineColor = isVictory ? '#4ecca3' : '#e94560';

    this.add.text(width / 2, height * 0.18, headlineText, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: headlineColor
    }).setOrigin(0.5);

    // Summary Narrative
    const narrative = isVictory
      ? 'Your unwavering peaceful resolve dismantled the barricades and reached the Assembly.'
      : 'Your endurance wavered before reaching the destination, but your sacrifice was witnessed.';

    this.add.text(width / 2, height * 0.28, narrative, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5);

    // Campaign Statistics Card Container
    const cardBg = this.add.rectangle(width / 2, height * 0.52, 480, 180, 0x16213e, 0.9)
      .setStrokeStyle(2, 0x334155);

    const statLines = [
      `• Peaceful Blows Absorbed:    ${stats.blowsAbsorbed}`,
      `• Precision Dodges (Clean):    ${stats.dodgesClean}`,
      `• Peaceful Chants Radiated:    ${stats.chantsUsed}`,
      `• Armed Forces Stood Down:     ${stats.opponentsDispersed}`,
      `• Peak Public Solidarity:     ${stats.maxSupport} / 100`
    ];

    this.add.text(width / 2 - 180, height * 0.43, statLines.join('\n'), {
      fontFamily: 'Courier New, monospace, sans-serif',
      fontSize: '15px',
      lineSpacing: 10,
      color: '#4ecca3'
    });

    // March Again Button
    const restartBtn = this.add.rectangle(width / 2, height * 0.78, 220, 50, 0x4ecca3)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height * 0.78, 'MARCH AGAIN', {
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
