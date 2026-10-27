import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show a clean loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(width / 2, height / 2, 'Preparing Satyagraha...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Generate programmatic textures for player, opponents, and environment
    this.createProgrammaticTextures();

    // Transition to MenuScene
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene');
    });
  }

  createProgrammaticTextures() {
    // 1. Player texture (White robe / peaceful demonstrator)
    const playerCanvas = this.textures.createCanvas('player', 40, 40);
    const ctxP = playerCanvas.context;
    ctxP.fillStyle = '#4ecca3';
    ctxP.beginPath();
    ctxP.arc(20, 20, 18, 0, Math.PI * 2);
    ctxP.fill();
    ctxP.fillStyle = '#ffffff';
    ctxP.beginPath();
    ctxP.arc(20, 16, 7, 0, Math.PI * 2);
    ctxP.fill();
    playerCanvas.refresh();

    // 2. Opponent texture (Armed officer with shield/baton)
    const opponentCanvas = this.textures.createCanvas('opponent', 40, 40);
    const ctxO = opponentCanvas.context;
    ctxO.fillStyle = '#e94560';
    ctxO.beginPath();
    ctxO.arc(20, 20, 18, 0, Math.PI * 2);
    ctxO.fill();
    ctxO.fillStyle = '#1a1a2e';
    ctxO.fillRect(10, 10, 20, 8);
    opponentCanvas.refresh();

    // 3. Bystander / Witness texture (Journalist / civilian)
    const bystanderCanvas = this.textures.createCanvas('bystander', 32, 32);
    const ctxB = bystanderCanvas.context;
    ctxB.fillStyle = '#f9d56e';
    ctxB.beginPath();
    ctxB.arc(16, 16, 14, 0, Math.PI * 2);
    ctxB.fill();
    bystanderCanvas.refresh();

    // 4. Ground tile & designated path textures
    const groundCanvas = this.textures.createCanvas('street', 64, 64);
    const ctxG = groundCanvas.context;
    ctxG.fillStyle = '#1f242d';
    ctxG.fillRect(0, 0, 64, 64);
    ctxG.strokeStyle = '#2b313d';
    ctxG.strokeRect(0, 0, 64, 64);
    groundCanvas.refresh();

    const pathCanvas = this.textures.createCanvas('designated_path', 64, 64);
    const ctxPath = pathCanvas.context;
    ctxPath.fillStyle = '#263238';
    ctxPath.fillRect(0, 0, 64, 64);
    ctxPath.strokeStyle = '#37474f';
    ctxPath.strokeRect(0, 0, 64, 64);
    // Road center dashes
    ctxPath.fillStyle = '#ffca28';
    ctxPath.fillRect(28, 0, 8, 20);
    ctxPath.fillRect(28, 44, 8, 20);
    pathCanvas.refresh();
  }
}
