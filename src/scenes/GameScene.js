import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';
import { Player } from '../entities/Player.js';
import { Opponent } from '../entities/Opponent.js';
import { Bystander } from '../entities/Bystander.js';
import { RuleManager } from '../managers/RuleManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    gameState.reset();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const worldWidth = 3200;

    // 1. World & Camera configuration
    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.cameras.main.setBounds(0, 0, worldWidth, height);

    // 2. Environment (Street & Designated Route)
    this.createEnvironment(worldWidth, height);

    // 3. Player entity
    this.player = new Player(this, 180, height / 2);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 4. Bystanders & Press Journalists
    this.bystanders = [];
    this.createBystanders(worldWidth, height);

    // 5. Opponents along the route
    this.opponents = [];
    this.createOpponents(height);

    // 6. Rule Manager
    this.ruleManager = new RuleManager(this, {
      pathTop: height * 0.25,
      pathBottom: height * 0.75
    });

    // 7. Input Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
      brace: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      forbiddenAttack: Phaser.Input.Keyboard.KeyCodes.F
    });

    // 8. Event Listeners
    this.setupCombatEventListeners();

    // 9. Touch Controls for Mobile
    this.setupMobileTouchControls(width, height);
  }

  createEnvironment(worldWidth, height) {
    // Upper sidewalk (Bystanders / Observers)
    this.add.tileSprite(worldWidth / 2, height * 0.125, worldWidth, height * 0.25, 'street');

    // Designated March Path (Center Street)
    this.add.tileSprite(worldWidth / 2, height / 2, worldWidth, height * 0.5, 'designated_path');

    // Lower sidewalk
    this.add.tileSprite(worldWidth / 2, height * 0.875, worldWidth, height * 0.25, 'street');

    // Boundary guide markers
    this.add.rectangle(worldWidth / 2, height * 0.25, worldWidth, 4, 0x4ecca3, 0.7);
    this.add.rectangle(worldWidth / 2, height * 0.75, worldWidth, 4, 0x4ecca3, 0.7);

    // Destination Landmark (Courthouse / Assembly gates at x=3100)
    const gates = this.add.rectangle(3150, height / 2, 40, height * 0.5, 0xffd54f, 0.8);
    this.add.text(3150, height / 2, 'ASSEMBLY GATES', {
      fontFamily: 'system-ui',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setRotation(-Math.PI / 2);
  }

  createBystanders(worldWidth, height) {
    for (let x = 250; x < worldWidth - 200; x += 220) {
      const isPressTop = Math.random() > 0.6;
      const isPressBottom = Math.random() > 0.6;

      const topBystander = new Bystander(this, x, height * 0.13, isPressTop);
      const bottomBystander = new Bystander(this, x + 60, height * 0.87, isPressBottom);

      this.bystanders.push(topBystander, bottomBystander);
    }
  }

  createOpponents(height) {
    // Staggered checkpoints along the march route with increasing defection thresholds
    const checkpointConfigs = [
      { x: 550, y: height / 2 - 50, threshold: 20 },
      { x: 900, y: height / 2 + 50, threshold: 35 },
      { x: 1300, y: height / 2 - 40, threshold: 50 },
      { x: 1700, y: height / 2 + 40, threshold: 65 },
      { x: 2100, y: height / 2 - 60, threshold: 75 },
      { x: 2500, y: height / 2 + 60, threshold: 85 },
      { x: 2850, y: height / 2, threshold: 95 }
    ];

    checkpointConfigs.forEach((cfg) => {
      const opp = new Opponent(this, cfg.x, cfg.y, {
        supportThreshold: cfg.threshold,
        patrolRange: 50
      });
      this.opponents.push(opp);
    });

    gameState.opponentsTotal = checkpointConfigs.length;
    gameState.opponentsActive = checkpointConfigs.length;
  }

  setupCombatEventListeners() {
    // Listen for strikes landing from Opponents
    this.events.on('opponentStrikeLanded', ({ opponent, player }) => {
      this.handleStrikeInteraction(opponent, player);
    });

    // Handle game over transitions
    gameState.on(EVENTS.GAME_OVER, (data) => {
      this.physics.pause();
      this.time.delayedCall(1600, () => {
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', data);
      });
    });
  }

  handleStrikeInteraction(opponent, player) {
    if (gameState.isGameOver) return;

    // Check proximity to press / bystanders for witness multiplier
    let isWitnessed = false;
    this.bystanders.forEach((bystander) => {
      if (bystander.isWitnessing(player.x, player.y)) {
        isWitnessed = true;
        bystander.triggerFlash();
      }
    });

    const witnessMultiplier = isWitnessed ? 1.5 : 1.0;

    // CASE 1: Timed Dodge (Invulnerable Evasion)
    if (player.isInvulnerable()) {
      const hpRecovery = 6;
      const spGain = Math.round(5 * witnessMultiplier);

      gameState.modifyHealth(hpRecovery);
      gameState.modifySupport(spGain);

      this.showCombatFeedback(
        player.x,
        player.y - 35,
        `✨ Clean Evasion! (+${hpRecovery} HP${isWitnessed ? ' | 📸 1.5x Witness' : ''})`,
        '#4ecca3'
      );
      return;
    }

    // CASE 2: Peaceful Stand / Kneeling (Bracing)
    if (player.isBracing()) {
      const damage = -7;
      const baseSupport = 20;
      const netSupport = Math.round(baseSupport * witnessMultiplier);

      gameState.modifyHealth(damage);
      gameState.modifySupport(netSupport);

      this.cameras.main.shake(180, 0.012);
      this.showCombatFeedback(
        player.x,
        player.y - 35,
        `🛡️ Peaceful Stand! (${damage} HP / +${netSupport} SP${isWitnessed ? ' | 📸 Witness' : ''})`,
        '#ffd54f'
      );
      return;
    }

    // CASE 3: Normal Strike Absorbed
    const damage = -15;
    const baseSupport = 10;
    const netSupport = Math.round(baseSupport * witnessMultiplier);

    gameState.modifyHealth(damage);
    gameState.modifySupport(netSupport);

    this.cameras.main.shake(220, 0.02);
    this.showCombatFeedback(
      player.x,
      player.y - 35,
      `💥 Blow Absorbed (${damage} HP / +${netSupport} SP${isWitnessed ? ' | 📸 Witness' : ''})`,
      '#e94560'
    );
  }

  showCombatFeedback(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: color,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 45,
      alpha: 0,
      duration: 1200,
      ease: 'Power1',
      onComplete: () => text.destroy()
    });
  }

  setupMobileTouchControls(width, height) {
    // Touch controls rendered with scrollFactor(0) so they follow camera
    if (!this.sys.game.device.input.touch) return;

    // 1. Mobile Dodge Button (Right Bottom)
    const dodgeBtn = this.add.circle(width - 80, height - 80, 42, 0x4ecca3, 0.75)
      .setScrollFactor(0)
      .setInteractive();

    this.add.text(width - 80, height - 80, 'DODGE', {
      fontFamily: 'system-ui',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    dodgeBtn.on('pointerdown', () => this.player.triggerDodge());

    // 2. Mobile Kneel/Brace Button (Left of Dodge)
    const braceBtn = this.add.circle(width - 180, height - 80, 42, 0xffd54f, 0.75)
      .setScrollFactor(0)
      .setInteractive();

    this.add.text(width - 180, height - 80, 'KNEEL', {
      fontFamily: 'system-ui',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    braceBtn.on('pointerdown', () => this.player.setBracing(true));
    braceBtn.on('pointerup', () => this.player.setBracing(false));
    braceBtn.on('pointerout', () => this.player.setBracing(false));
  }

  update(time, delta) {
    if (gameState.isGameOver) return;

    // 1. Handle player input
    this.player.handleInput(this.cursors, this.wasdKeys);

    // 2. Forbidden attack check (Rule validation)
    if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.forbiddenAttack)) {
      this.ruleManager.triggerViolenceInfraction('Retaliatory strike attempted');
    }

    // 3. Update all opponents
    this.opponents.forEach((opp) => opp.update(time, delta, this.player));

    // 4. Update Rule Manager (Path bounds)
    this.ruleManager.update(this.player);

    // 5. Destination check (Assembly Gates reach)
    if (this.player.x >= 3120 && !gameState.isGameOver) {
      gameState.isGameOver = true;
      gameState.gameResult = 'victory';
      gameState.emit(EVENTS.GAME_OVER, {
        result: 'victory',
        reason: 'The march reached the Assembly Gates peacefully.'
      });
    }
  }
}
