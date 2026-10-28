import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';
import { Player } from '../entities/Player.js';
import { Opponent } from '../entities/Opponent.js';
import { Bystander } from '../entities/Bystander.js';
import { Barricade } from '../entities/Barricade.js';
import { Marcher } from '../entities/Marcher.js';
import { RuleManager } from '../managers/RuleManager.js';
import { audioManager } from '../managers/AudioManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    gameState.reset();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const worldWidth = 3200;

    // Enable multi-touch pointers (left thumb + right thumb)
    this.input.addPointer(3);

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

    // 6. Checkpoint Barricades
    this.barricades = [
      new Barricade(this, 1050, height / 2, height * 0.5, 30, 'District Checkpoint 1'),
      new Barricade(this, 2050, height / 2, height * 0.5, 65, 'Security Barrier 2')
    ];

    // 7. Solidarity Marchers
    this.marchers = [];
    this.marcherMilestones = [
      { threshold: 25, spawned: false, offset: { x: -45, y: -25 } },
      { threshold: 45, spawned: false, offset: { x: -50, y: 25 } },
      { threshold: 65, spawned: false, offset: { x: -85, y: -15 } },
      { threshold: 85, spawned: false, offset: { x: -90, y: 18 } }
    ];

    // 8. Rule Manager
    this.ruleManager = new RuleManager(this, {
      pathTop: height * 0.25,
      pathBottom: height * 0.75
    });

    // 9. Keyboard Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
      brace: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      chant: Phaser.Input.Keyboard.KeyCodes.E,
      forbiddenAttack: Phaser.Input.Keyboard.KeyCodes.F
    });

    // 10. Combat Event Listeners
    this.setupCombatEventListeners();

    // 11. Touch State & Controls
    this.touchMoveVector = { x: 0, y: 0 };
    this.touchTargetWorld = null;
    this.setupMobileTouchControls(width, height);
    this.setupTouchAndDragNavigation();
  }

  createEnvironment(worldWidth, height) {
    this.add.tileSprite(worldWidth / 2, height * 0.125, worldWidth, height * 0.25, 'street');
    this.add.tileSprite(worldWidth / 2, height / 2, worldWidth, height * 0.5, 'designated_path');
    this.add.tileSprite(worldWidth / 2, height * 0.875, worldWidth, height * 0.25, 'street');

    this.add.rectangle(worldWidth / 2, height * 0.25, worldWidth, 4, 0x4ecca3, 0.7);
    this.add.rectangle(worldWidth / 2, height * 0.75, worldWidth, 4, 0x4ecca3, 0.7);

    // National Assembly Gates
    this.add.rectangle(3150, height / 2, 40, height * 0.5, 0xffd54f, 0.85);
    this.add.text(3150, height / 2, 'NATIONAL ASSEMBLY GATES', {
      fontFamily: 'system-ui',
      fontSize: '18px',
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
    const checkpointConfigs = [
      { x: 550, y: height / 2 - 50, threshold: 20 },
      { x: 880, y: height / 2 + 50, threshold: 28 },
      { x: 1350, y: height / 2 - 45, threshold: 45 },
      { x: 1750, y: height / 2 + 45, threshold: 60 },
      { x: 2300, y: height / 2 - 55, threshold: 75 },
      { x: 2650, y: height / 2 + 55, threshold: 85 },
      { x: 2950, y: height / 2, threshold: 95 }
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
    this.events.on('opponentStrikeLanded', ({ opponent, player }) => {
      this.handleStrikeInteraction(opponent, player);
    });

    this.events.on('playerChant', ({ x, y, radius }) => {
      gameState.stats.chantsUsed += 1;
      this.opponents.forEach((opp) => {
        const dist = Phaser.Math.Distance.Between(x, y, opp.x, opp.y);
        if (dist <= radius) {
          opp.pacify(2400);
        }
      });
    });

    gameState.on(EVENTS.SUPPORT_CHANGED, (support) => {
      this.checkSolidarityMarchers(support);
    });

    gameState.on(EVENTS.GAME_OVER, (data) => {
      this.physics.pause();
      this.time.delayedCall(1600, () => {
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', data);
      });
    });
  }

  checkSolidarityMarchers(support) {
    this.marcherMilestones.forEach((m) => {
      if (!m.spawned && support >= m.threshold) {
        m.spawned = true;
        const spawnY = Math.random() > 0.5 ? 90 : 630;
        const marcher = new Marcher(this, this.player.x - 70, spawnY, this.player, m.offset);
        this.marchers.push(marcher);

        this.showCombatFeedback(
          this.player.x,
          this.player.y - 45,
          '🤝 Bystander Joined the March!',
          '#4ecca3'
        );
      }
    });
  }

  handleStrikeInteraction(opponent, player) {
    if (gameState.isGameOver) return;

    let isWitnessed = false;
    this.bystanders.forEach((bystander) => {
      if (bystander.isWitnessing(player.x, player.y)) {
        isWitnessed = true;
        bystander.triggerFlash();
      }
    });

    const witnessMultiplier = isWitnessed ? 1.5 : 1.0;

    // CASE 1: Timed Dodge
    if (player.isInvulnerable()) {
      const hpRecovery = 6;
      const spGain = Math.round(5 * witnessMultiplier);

      gameState.stats.dodgesClean += 1;
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

    // CASE 2: Peaceful Stand / Kneeling
    if (player.isBracing()) {
      const damage = -7;
      const baseSupport = 20;
      const netSupport = Math.round(baseSupport * witnessMultiplier);

      gameState.stats.blowsAbsorbed += 1;
      audioManager.playHit();
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

    gameState.stats.blowsAbsorbed += 1;
    audioManager.playHit();
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
      backgroundColor: 'rgba(0,0,0,0.65)',
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
    // -------------------------------------------------------------
    // 1. LEFT SIDE: VIRTUAL D-PAD (Directional movement buttons)
    // -------------------------------------------------------------
    const dpadX = 110;
    const dpadY = height - 120;
    const btnSize = 48;
    const spacing = 52;

    // D-Pad Background Plate
    this.add.circle(dpadX, dpadY, 78, 0x16213e, 0.55)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0x4ecca3, 0.4);

    const createDpadButton = (offsetX, offsetY, label, dirX, dirY) => {
      const btn = this.add.circle(dpadX + offsetX, dpadY + offsetY, btnSize / 2, 0x22304d, 0.8)
        .setScrollFactor(0)
        .setStrokeStyle(1, 0x4ecca3, 0.8)
        .setInteractive({ useHandCursor: true });

      const text = this.add.text(dpadX + offsetX, dpadY + offsetY, label, {
        fontFamily: 'system-ui',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#4ecca3'
      }).setOrigin(0.5).setScrollFactor(0);

      btn.on('pointerdown', () => {
        btn.setFillStyle(0x4ecca3);
        text.setColor('#16213e');
        if (dirX !== 0) this.touchMoveVector.x = dirX;
        if (dirY !== 0) this.touchMoveVector.y = dirY;
        this.touchTargetWorld = null; // Clear tap-to-move
      });

      const release = () => {
        btn.setFillStyle(0x22304d);
        text.setColor('#4ecca3');
        if (dirX !== 0 && this.touchMoveVector.x === dirX) this.touchMoveVector.x = 0;
        if (dirY !== 0 && this.touchMoveVector.y === dirY) this.touchMoveVector.y = 0;
      };

      btn.on('pointerup', release);
      btn.on('pointerout', release);
    };

    // Forward, Backward, Up, Down buttons
    createDpadButton(spacing, 0, '▶', 1, 0);     // March Forward (Right)
    createDpadButton(-spacing, 0, '◀', -1, 0);   // Retreat (Left)
    createDpadButton(0, -spacing, '▲', 0, -1);   // Up
    createDpadButton(0, spacing, '▼', 0, 1);     // Down

    // -------------------------------------------------------------
    // 2. RIGHT SIDE: ACTION BUTTONS (DODGE, KNEEL, CHANT)
    // -------------------------------------------------------------
    const rightBaseX = width - 90;
    const rightBaseY = height - 90;

    // A. DODGE BUTTON (Primary evasion / heal)
    const dodgeBtn = this.add.circle(rightBaseX, rightBaseY, 44, 0x4ecca3, 0.85)
      .setScrollFactor(0)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setInteractive({ useHandCursor: true });

    this.add.text(rightBaseX, rightBaseY - 6, 'DODGE', {
      fontFamily: 'system-ui',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(rightBaseX, rightBaseY + 10, '+HP', {
      fontFamily: 'system-ui',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#0d5c41'
    }).setOrigin(0.5).setScrollFactor(0);

    dodgeBtn.on('pointerdown', () => this.player.triggerDodge());

    // B. KNEEL / BRACE BUTTON (Hold ground / defense)
    const kneelX = rightBaseX - 95;
    const kneelY = rightBaseY - 25;
    const braceBtn = this.add.circle(kneelX, kneelY, 38, 0xffd54f, 0.85)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });

    this.add.text(kneelX, kneelY - 5, 'KNEEL', {
      fontFamily: 'system-ui',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(kneelX, kneelY + 9, '+SP', {
      fontFamily: 'system-ui',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#6d4c00'
    }).setOrigin(0.5).setScrollFactor(0);

    braceBtn.on('pointerdown', () => this.player.setBracing(true));
    braceBtn.on('pointerup', () => this.player.setBracing(false));
    braceBtn.on('pointerout', () => this.player.setBracing(false));

    // C. CHANT BUTTON (Pacifying ripple wave)
    const chantX = rightBaseX - 50;
    const chantY = rightBaseY - 95;
    const chantBtn = this.add.circle(chantX, chantY, 36, 0x80cbc4, 0.85)
      .setScrollFactor(0)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });

    this.add.text(chantX, chantY - 4, 'CHANT', {
      fontFamily: 'system-ui',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    this.add.text(chantX, chantY + 8, 'WAVE', {
      fontFamily: 'system-ui',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#004d40'
    }).setOrigin(0.5).setScrollFactor(0);

    chantBtn.on('pointerdown', () => {
      this.player.triggerChant(this.time.now);
    });
  }

  setupTouchAndDragNavigation() {
    // Allows tap-to-move and touch-and-drag across the street
    this.input.on('pointerdown', (pointer) => {
      // Ignore if clicking HUD buttons (top area y < 110 or control corners)
      if (pointer.y < 110) return;
      if (pointer.x < 210 && pointer.y > this.cameras.main.height - 210) return; // D-pad zone
      if (pointer.x > this.cameras.main.width - 230 && pointer.y > this.cameras.main.height - 180) return; // Action buttons zone

      this.touchTargetWorld = {
        x: pointer.worldX,
        y: pointer.worldY
      };
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && this.touchTargetWorld) {
        if (pointer.y < 110) return;
        this.touchTargetWorld.x = pointer.worldX;
        this.touchTargetWorld.y = pointer.worldY;
      }
    });

    this.input.on('pointerup', () => {
      this.touchTargetWorld = null;
    });
  }

  update(time, delta) {
    if (gameState.isGameOver) return;

    // Handle inputs: keyboard, virtual D-pad vector, and touch-and-drag target
    this.player.handleInput(
      this.cursors,
      this.wasdKeys,
      time,
      this.touchMoveVector,
      this.touchTargetWorld
    );

    if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.forbiddenAttack)) {
      this.ruleManager.triggerViolenceInfraction('Retaliatory strike attempted');
    }

    this.opponents.forEach((opp) => opp.update(time, delta, this.player));
    this.marchers.forEach((marcher) => marcher.update());

    this.ruleManager.update(this.player);

    const progress = Math.min(1.0, Math.max(0.0, this.player.x / 3120));
    this.events.emit('playerProgress', progress);

    if (this.player.x >= 3120 && !gameState.isGameOver) {
      gameState.isGameOver = true;
      gameState.gameResult = 'victory';
      gameState.emit(EVENTS.GAME_OVER, {
        result: 'victory',
        reason: 'The march reached the Assembly Gates peacefully.',
        stats: { ...gameState.stats, finalSupport: gameState.support }
      });
    }
  }
}
