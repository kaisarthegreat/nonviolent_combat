import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.deferredPrompt = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient effect
    this.add.rectangle(width / 2, height / 2, width, height, 0x16213e);

    // Title
    this.add.text(width / 2, height * 0.22, 'SATYAGRAHA', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#4ecca3'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.32, 'The Unbroken Line (Non-Violent Resistance)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#eaeaea'
    }).setOrigin(0.5);

    // Core Rules Summary
    const instructions = [
      '• Walk the designated path without striking back.',
      '• Absorbing blows increases Public Support but drains Health.',
      '• Timed Dodging restores composure and health.',
      '• Breaking rules (leaving path, violent acts) loses support.',
      '• Win when Support surpasses the armed opposition.'
    ];

    this.add.text(width / 2, height * 0.52, instructions.join('\n'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      lineSpacing: 10,
      color: '#a0aab8',
      align: 'center'
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.add.rectangle(width / 2, height * 0.74, 240, 56, 0x4ecca3)
      .setInteractive({ useHandCursor: true });
    
    const startText = this.add.text(width / 2, height * 0.74, 'START MARCH', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x3db892));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4ecca3));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    // PWA Install Button (if deferred prompt is available)
    this.setupPwaInstallButton(width, height);
  }

  setupPwaInstallButton(width, height) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      const installBtn = this.add.rectangle(width / 2, height * 0.88, 200, 42, 0xe94560)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2, height * 0.88, '📲 Install App', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      installBtn.on('pointerdown', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            installBtn.destroy();
          }
          this.deferredPrompt = null;
        }
      });
    });
  }
}
