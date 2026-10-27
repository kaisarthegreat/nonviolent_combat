import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';
import { audioManager } from '../managers/AudioManager.js';

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
    this.telegraphDuration = 750;
    this.telegraphStartTime = 0;
    this.isPacified = false;

    // Visual Telegraph Zone
    this.telegraphIndicator = scene.add.circle(x, y, this.strikeRadius, 0xff0055, 0.28)
      .setVisible(false)
      .setStrokeStyle(2, 0xff1744, 0.85);

    // Defection listener
    this.onSupportUpdate = (support) => {
      if (this.state !== OPPONENT_STATES.DISPERSED && support >= this.supportThreshold) {
        this.disperse();
      }
    };
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportUpdate);
  }

  pacify(duration = 2000) {
    if (this.state === OPPONENT_STATES.DISPERSED) return;

    this.isPacified = true;
    this.telegraphIndicator.setVisible(false);
    this.setTint(0x80cbc4);

    const pacifyText = this.scene.add.text(this.x, this.y - 25, '🕊️ Calmed', {
      fontFamily: 'system-ui',
      fontSize: '12px',
      color: '#80cbc4'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: pacifyText,
      y: this.y - 45,
      alpha: 0,
      duration: 1000,
      onComplete: () => pacifyText.destroy()
    });

    this.scene.time.delayedCall(duration, () => {
      this.isPacified = false;
      this.clearTint();
      if (this.state === OPPONENT_STATES.TELEGRAPH) {
        this.state = OPPONENT_STATES.PATROL;
      }
    });
  }

  update(time, delta, player) {
    if (this.state === OPPONENT_STATES.DISPERSED || this.isPacified || gameState.isGameOver) return;

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
        break;
    }
  }

  handlePatrol(distToPlayer, time, player) {
    if (distToPlayer <= this.detectionRadius) {
      this.setVelocity(0, 0);
      this.startTelegraph(time, player);
      return;
    }

    this.y += this.patrolSpeed * (1 / 60) * this.patrolDirection;
    if (Math.abs(this.y - this.initialY) > this.patrolRange) {
      this.patrolDirection *= -1;
    }
  }

  startTelegraph(time, player) {
    this.state = OPPONENT_STATES.TELEGRAPH;
    this.telegraphStartTime = time;

    this.telegraphIndicator.setPosition(this.x, this.y);
    this.telegraphIndicator.setVisible(true);
    this.telegraphIndicator.setScale(0.5);

    this.scene.tweens.add({
      targets: this.telegraphIndicator,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 0.65,
      duration: this.telegraphDuration,
      ease: 'Quad.easeIn'
    });
  }

  handleTelegraph(time, player) {
    this.telegraphIndicator.setPosition(this.x, this.y);

    if (time - this.telegraphStartTime >= this.telegraphDuration) {
      this.telegraphIndicator.setVisible(false);
      this.state = OPPONENT_STATES.ATTACK;
    }
  }

  handleAttack(player) {
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    this.scene.tweens.add({
      targets: this,
      x: this.x + (player.x > this.x ? 25 : -25),
      yoyo: true,
      duration: 180,
      onComplete: () => {
        this.state = OPPONENT_STATES.RECOVER;
        this.scene.time.delayedCall(850, () => {
          if (this.state === OPPONENT_STATES.RECOVER) {
            this.state = OPPONENT_STATES.PATROL;
          }
        });
      }
    });

    if (distToPlayer <= this.strikeRadius) {
      this.scene.events.emit('opponentStrikeLanded', { opponent: this, player: player });
    }
  }

  disperse() {
    this.state = OPPONENT_STATES.DISPERSED;
    this.telegraphIndicator.setVisible(false);

    audioManager.playDefection();

    this.setTint(0x9e9e9e);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.6,
      duration: 500
    });

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
