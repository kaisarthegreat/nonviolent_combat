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
    this.add.text(width / 2, height * 0.18, 'SATYAGRAHA', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#4ecca3'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.28, 'The Unbroken Line (Non-Violent Resistance)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      color: '#eaeaea'
    }).setOrigin(0.5);

    // Core Rules & Mobile Controls Guide
    const instructions = [
      '• Walk the designated path without striking back.',
      '• Absorbing blows increases Public Support but drains Health.',
      '• Timed Dodging restores composure and health.',
      '• Desktop: [WASD] to march | [SPACE] to dodge | [SHIFT] to kneel',
      '• Mobile: Touch D-Pad to move (or drag/tap) | Action buttons to dodge/kneel',
      '• Win when Support surpasses the armed opposition.'
    ];

    this.add.text(width / 2, height * 0.50, instructions.join('\n'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      lineSpacing: 8,
      color: '#cbd5e1',
      align: 'center'
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.add.rectangle(width / 2, height * 0.74, 250, 56, 0x4ecca3)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(width / 2, height * 0.74, 'START MARCH ⛶', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x3db892));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4ecca3));
    startBtn.on('pointerdown', () => {
      // If mobile or supported, trigger fullscreen on user gesture
      if (this.scale.fullscreen.available && !this.scale.isFullscreen) {
        try {
          this.scale.startFullscreen();
        } catch (e) {}
      }
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    });

    // PWA Install Button
    this.setupPwaInstallButton(width, height);
  }

  setupPwaInstallButton(width, height) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      const installBtn = this.add.rectangle(width / 2, height * 0.88, 220, 42, 0xe94560)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2, height * 0.88, '📲 Install App to Phone', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
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
