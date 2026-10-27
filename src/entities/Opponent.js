import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';

export const OPPONENT_STATES = {
  PATROL: 'PATROL',
  TELEGRAPH: 'TELEGRAPH',
  ATTACK: 'ATTACK',
  RECOVER: 'RECOVER',
  DISPERSED: 'DISPERSED'
};

export class Opponent extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, options = {}) {
    super(scene, x, y, 'opponent');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(18);
    this.setImmovable(true);

    this.state = OPPONENT_STATES.PATROL;
    this.initialX = x;
    this.initialY = y;
    this.patrolRange = options.patrolRange || 40;
    this.patrolDirection = 1;
    this.patrolSpeed = 30;

    // Threshold of public support required to break this officer's resolve
    this.supportThreshold = options.supportThreshold || 30;

    // Detection & attack parameters
    this.detectionRadius = options.detectionRadius || 170;
    this.strikeRadius = options.strikeRadius || 65;
    this.telegraphDuration = 750; // ms warning before strike
    this.telegraphStartTime = 0;

    // Visual Telegraph Zone
    this.telegraphIndicator = scene.add.circle(x, y, this.strikeRadius, 0xff0055, 0.28)
      .setVisible(false)
      .setStrokeStyle(2, 0xff1744, 0.85);

    // Listen for support changes to test defection
    this.onSupportUpdate = (support) => {
      if (this.state !== OPPONENT_STATES.DISPERSED && support >= this.supportThreshold) {
        this.disperse();
      }
    };
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportUpdate);
  }

  update(time, delta, player) {
    if (this.state === OPPONENT_STATES.DISPERSED || gameState.isGameOver) return;

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    switch (this.state) {
      case OPPONENT_STATES.PATROL:
        this.handlePatrol(distToPlayer, time, player);
        break;

      case OPPONENT_STATES.TELEGRAPH:
        this.handleTelegraph(time, player);
        break;

      case OPPONENT_STATES.ATTACK:
        this.handleAttack(player);
        break;

      case OPPONENT_STATES.RECOVER:
        // Handled via delayed timer
        break;
    }
  }

  handlePatrol(distToPlayer, time, player) {
    // Check if player is in detection range
    if (distToPlayer <= this.detectionRadius) {
      this.setVelocity(0, 0);
      this.startTelegraph(time, player);
      return;
    }

    // Slow vertical patrol bobbing
    this.y += this.patrolSpeed * (1 / 60) * this.patrolDirection;
    if (Math.abs(this.y - this.initialY) > this.patrolRange) {
      this.patrolDirection *= -1;
    }
  }

  startTelegraph(time, player) {
    this.state = OPPONENT_STATES.TELEGRAPH;
    this.telegraphStartTime = time;

    // Position warning telegraph between opponent and player
    this.telegraphIndicator.setPosition(this.x, this.y);
    this.telegraphIndicator.setVisible(true);
    this.telegraphIndicator.setScale(0.5);

    // Warning pulse tween
    this.scene.tweens.add({
      targets: this.telegraphIndicator,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.6,
      duration: this.telegraphDuration,
      ease: 'Quad.easeIn'
    });
  }

  handleTelegraph(time, player) {
    // Keep telegraph indicator centered on opponent
    this.telegraphIndicator.setPosition(this.x, this.y);

    if (time - this.telegraphStartTime >= this.telegraphDuration) {
      this.telegraphIndicator.setVisible(false);
      this.state = OPPONENT_STATES.ATTACK;
    }
  }

  handleAttack(player) {
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Fast swing animation
    this.scene.tweens.add({
      targets: this,
      x: this.x + (player.x > this.x ? 25 : -25),
      yoyo: true,
      duration: 180,
      onComplete: () => {
        this.state = OPPONENT_STATES.RECOVER;
        this.scene.time.delayedCall(900, () => {
          if (this.state === OPPONENT_STATES.RECOVER) {
            this.state = OPPONENT_STATES.PATROL;
          }
        });
      }
    });

    // Check hit collision
    if (distToPlayer <= this.strikeRadius) {
      this.scene.events.emit('opponentStrikeLanded', { opponent: this, player: player });
    }
  }

  disperse() {
    this.state = OPPONENT_STATES.DISPERSED;
    this.telegraphIndicator.setVisible(false);

    // Visual defection feedback
    this.setTint(0x9e9e9e);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.6,
      duration: 500
    });

    // Display "Stood Down" floating badge
    const badge = this.scene.add.text(this.x, this.y - 25, '☮ Stood Down', {
      fontFamily: 'system-ui',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#4ecca3'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: badge,
      y: this.y - 50,
      alpha: 0,
      duration: 1200,
      onComplete: () => badge.destroy()
    });

    // Walk peacefully off the designated road onto sidewalk
    const targetY = this.y < 360 ? 80 : 640;
    this.scene.tweens.add({
      targets: this,
      y: targetY,
      duration: 1800,
      ease: 'Power1',
      onComplete: () => {
        this.setVelocity(0, 0);
      }
    });

    gameState.decrementOpponents();
  }

  destroy(fromScene) {
    gameState.off(EVENTS.SUPPORT_CHANGED, this.onSupportUpdate);
    if (this.telegraphIndicator) this.telegraphIndicator.destroy();
    super.destroy(fromScene);
  }
}
