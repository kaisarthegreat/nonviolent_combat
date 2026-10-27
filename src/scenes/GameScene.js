import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    gameState.reset();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Set world bounds (extended horizontally for a marching street)
    this.physics.world.setBounds(0, 0, 3000, height);
    this.cameras.main.setBounds(0, 0, 3000, height);

    // 1. Render sidewalks and designated road
    this.createEnvironment(3000, height);

    // 2. Create the player
    this.player = this.physics.add.sprite(200, height / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(18);

    // Camera follows player smoothly
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 3. Setup Controls (Keyboard + Touch)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyWASD = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
      brace: Phaser.Input.Keyboard.KeyCodes.SHIFT
    });

    // 4. Opponents Group (Sample opponent setup for Phase 1 prototype)
    this.opponents = this.physics.add.group();
    this.createSampleOpponents(height);

    // 5. Bystanders
    this.createBystanders(height);

    // 6. Handle Game Over events
    gameState.on(EVENTS.GAME_OVER, (data) => {
      this.physics.pause();
      this.time.delayedCall(1500, () => {
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', data);
      });
    });

    // 7. Track path bounds for rule checking
    this.pathTop = height * 0.25;
    this.pathBottom = height * 0.75;

    // Setup touch control overlay for mobile devices
    this.setupTouchControls(width, height);
  }

  createEnvironment(worldWidth, height) {
    // Upper sidewalk
    this.add.tileSprite(worldWidth / 2, height * 0.125, worldWidth, height * 0.25, 'street');
    
    // Designated March Path
    this.designatedRoad = this.add.tileSprite(worldWidth / 2, height / 2, worldWidth, height * 0.5, 'designated_path');

    // Lower sidewalk
    this.add.tileSprite(worldWidth / 2, height * 0.875, worldWidth, height * 0.25, 'street');

    // Route boundary guide lines
    this.add.rectangle(worldWidth / 2, height * 0.25, worldWidth, 4, 0x4ecca3, 0.6);
    this.add.rectangle(worldWidth / 2, height * 0.75, worldWidth, 4, 0x4ecca3, 0.6);
  }

  createSampleOpponents(height) {
    const positions = [600, 1000, 1400, 1800, 2200, 2600];
    positions.forEach((x, index) => {
      const opp = this.opponents.create(x, height / 2 + (index % 2 === 0 ? -40 : 40), 'opponent');
      opp.setCircle(18);
      opp.setImmovable(true);
      opp.attackTimer = 0;
      opp.isDefeated = false;
    });

    this.physics.add.overlap(this.player, this.opponents, this.handlePlayerOpponentContact, null, this);
  }

  createBystanders(height) {
    for (let x = 300; x < 2800; x += 350) {
      // Bystanders gather on sidewalks
      this.add.image(x, height * 0.15, 'bystander');
      this.add.image(x + 50, height * 0.85, 'bystander');
    }
  }

  handlePlayerOpponentContact(player, opponent) {
    if (opponent.isDefeated) return;

    if (this.isDodging) {
      // Precision dodge reward!
      gameState.modifyHealth(5);
      gameState.modifySupport(4);
      this.showFloatingText(player.x, player.y - 30, '+5 Composure (Dodge)', '#4ecca3');
      opponent.isDefeated = true;
      opponent.setTint(0x888888);
      gameState.decrementOpponents();
    } else {
      // Struck by opponent
      const isBraced = this.keyWASD.brace.isDown;
      const damage = isBraced ? -8 : -15;
      const supportGain = isBraced ? 18 : 10;

      gameState.modifyHealth(damage);
      gameState.modifySupport(supportGain);

      this.cameras.main.shake(150, 0.01);
      this.showFloatingText(player.x, player.y - 30, `-${Math.abs(damage)} HP / +${supportGain} Support`, '#e94560');

      // Knock back opponent or pacify after sustained witness
      opponent.isDefeated = true;
      opponent.setTint(0x555555);
      gameState.decrementOpponents();
    }
  }

  showFloatingText(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: color
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  setupTouchControls(width, height) {
    // Only configure touch listeners if touch is supported
    if (!this.sys.game.device.input.touch) return;

    // Mobile Dodge Button
    const dodgeBtn = this.add.circle(width - 90, height - 90, 44, 0x4ecca3, 0.7)
      .setScrollFactor(0)
      .setInteractive();
    
    this.add.text(width - 90, height - 90, 'DODGE', {
      fontFamily: 'system-ui',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    dodgeBtn.on('pointerdown', () => this.triggerDodge());
  }

  triggerDodge() {
    if (this.isDodging) return;
    this.isDodging = true;
    this.player.setAlpha(0.5);

    this.time.delayedCall(300, () => {
      this.isDodging = false;
      this.player.setAlpha(1.0);
    });
  }

  update() {
    if (gameState.isGameOver) return;

    // Movement speeds
    const speed = 180;
    this.player.setVelocity(0);

    const isLeft = this.cursors.left.isDown || this.keyWASD.left.isDown;
    const isRight = this.cursors.right.isDown || this.keyWASD.right.isDown;
    const isUp = this.cursors.up.isDown || this.keyWASD.up.isDown;
    const isDown = this.cursors.down.isDown || this.keyWASD.down.isDown;

    if (isLeft) this.player.setVelocityX(-speed);
    else if (isRight) this.player.setVelocityX(speed);

    if (isUp) this.player.setVelocityY(-speed);
    else if (isDown) this.player.setVelocityY(speed);

    // Trigger dodge on spacebar
    if (Phaser.Input.Keyboard.JustDown(this.keyWASD.dodge)) {
      this.triggerDodge();
    }

    // Rule Check: Leaving designated march path
    const isOffPath = this.player.y < this.pathTop || this.player.y > this.pathBottom;
    if (isOffPath) {
      // Off path penalty: gradual support loss
      gameState.modifySupport(-0.05);
    }
  }
}
