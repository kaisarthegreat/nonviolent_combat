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

    // 7. Solidarity Marchers (Crowd that follows player as support rises)
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

    // 9. Input Controls
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

    // 10. Event Listeners
    this.setupCombatEventListeners();

    // 11. Touch Controls for Mobile
    this.setupMobileTouchControls(width, height);
  }

  createEnvironment(worldWidth, height) {
    this.add.tileSprite(worldWidth / 2, height * 0.125, worldWidth, height * 0.25, 'street');
    this.add.tileSprite(worldWidth / 2, height / 2, worldWidth, height * 0.5, 'designated_path');
    this.add.tileSprite(worldWidth / 2, height * 0.875, worldWidth, height * 0.25, 'street');

    this.add.rectangle(worldWidth / 2, height * 0.25, worldWidth, 4, 0x4ecca3, 0.7);
    this.add.rectangle(worldWidth / 2, height * 0.75, worldWidth, 4, 0x4ecca3, 0.7);

    // Final Landmark: National Assembly Gates
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
        // Spawn marcher stepping in from sidewalk
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
    if (!this.sys.game.device.input.touch) return;

    // 1. Mobile Dodge Button (Right Bottom)
    const dodgeBtn = this.add.circle(width - 70, height - 70, 38, 0x4ecca3, 0.75)
      .setScrollFactor(0)
      .setInteractive();

    this.add.text(width - 70, height - 70, 'DODGE', {
      fontFamily: 'system-ui',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    dodgeBtn.on('pointerdown', () => this.player.triggerDodge());

    // 2. Mobile Kneel/Brace Button
    const braceBtn = this.add.circle(width - 155, height - 70, 38, 0xffd54f, 0.75)
      .setScrollFactor(0)
      .setInteractive();

    this.add.text(width - 155, height - 70, 'KNEEL', {
      fontFamily: 'system-ui',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    braceBtn.on('pointerdown', () => this.player.setBracing(true));
    braceBtn.on('pointerup', () => this.player.setBracing(false));
    braceBtn.on('pointerout', () => this.player.setBracing(false));

    // 3. Mobile Chant Button
    const chantBtn = this.add.circle(width - 240, height - 70, 38, 0x80cbc4, 0.75)
      .setScrollFactor(0)
      .setInteractive();

    this.add.text(width - 240, height - 70, 'CHANT', {
      fontFamily: 'system-ui',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#16213e'
    }).setOrigin(0.5).setScrollFactor(0);

    chantBtn.on('pointerdown', () => {
      this.player.triggerChant(this.time.now);
    });
  }

  update(time, delta) {
    if (gameState.isGameOver) return;

    this.player.handleInput(this.cursors, this.wasdKeys, time);

    if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.forbiddenAttack)) {
      this.ruleManager.triggerViolenceInfraction('Retaliatory strike attempted');
    }

    this.opponents.forEach((opp) => opp.update(time, delta, this.player));
    this.marchers.forEach((marcher) => marcher.update());

    this.ruleManager.update(this.player);

    // Pass progress ratio to UIScene (0.0 to 1.0)
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
