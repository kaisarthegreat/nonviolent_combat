import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';

export const PLAYER_STATES = {
  IDLE: 'IDLE',
  MARCHING: 'MARCHING',
  DODGING: 'DODGING',
  BRACING: 'BRACING'
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setCircle(18);

    this.state = PLAYER_STATES.IDLE;
    this.speed = 190;
    this.dodgeCooldown = false;
    this.dodgeDuration = 280; // ms of invulnerability
    this.dodgeCooldownDuration = 600; // ms before next dodge

    // Visual indicators
    this.braceShield = scene.add.circle(x, y, 26, 0x4ecca3, 0.25).setVisible(false);
    this.dodgeGhost = null;

    // Pulse animation for peaceful presence
    scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });
  }

  isInvulnerable() {
    return this.state === PLAYER_STATES.DODGING;
  }

  isBracing() {
    return this.state === PLAYER_STATES.BRACING;
  }

  triggerDodge() {
    if (this.dodgeCooldown || this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    this.state = PLAYER_STATES.DODGING;
    this.dodgeCooldown = true;
    gameState.isDodging = true;

    // Visual feedback: brief ghost shadow and alpha fade
    this.setAlpha(0.4);
    this.setTint(0x64ffda);

    // Camera micro-dash feeling
    const dashVelocityX = this.body.velocity.x !== 0 ? this.body.velocity.x * 1.5 : 220;
    const dashVelocityY = this.body.velocity.y * 1.5;
    this.setVelocity(dashVelocityX, dashVelocityY);

    // End dodge after duration
    this.scene.time.delayedCall(this.dodgeDuration, () => {
      this.clearTint();
      this.setAlpha(1.0);
      gameState.isDodging = false;
      if (this.state === PLAYER_STATES.DODGING) {
        this.state = PLAYER_STATES.IDLE;
      }
    });

    // Reset cooldown
    this.scene.time.delayedCall(this.dodgeCooldownDuration, () => {
      this.dodgeCooldown = false;
    });
  }

  setBracing(active) {
    if (this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    if (active) {
      this.state = PLAYER_STATES.BRACING;
      gameState.isBracing = true;
      this.setVelocity(0, 0);
      this.braceShield.setVisible(true);
      this.braceShield.setPosition(this.x, this.y);
      this.setScale(0.9, 0.85); // Kneel / lower profile
      this.setTint(0xa7ffeb);
    } else {
      if (this.state === PLAYER_STATES.BRACING) {
        this.state = PLAYER_STATES.IDLE;
        gameState.isBracing = false;
        this.braceShield.setVisible(false);
        this.setScale(1.0, 1.0);
        this.clearTint();
      }
    }
  }

  handleInput(cursors, wasdKeys) {
    if (this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    // Brace key handling
    const wantsBrace = wasdKeys.brace && wasdKeys.brace.isDown;
    this.setBracing(wantsBrace);

    if (this.state === PLAYER_STATES.BRACING) {
      // Stationary while kneeling/bracing
      this.braceShield.setPosition(this.x, this.y);
      return;
    }

    // Dodge key handling
    if (wasdKeys.dodge && Phaser.Input.Keyboard.JustDown(wasdKeys.dodge)) {
      this.triggerDodge();
      return;
    }

    // Movement calculation
    let vx = 0;
    let vy = 0;

    const isLeft = cursors.left.isDown || wasdKeys.left.isDown;
    const isRight = cursors.right.isDown || wasdKeys.right.isDown;
    const isUp = cursors.up.isDown || wasdKeys.up.isDown;
    const isDown = cursors.down.isDown || wasdKeys.down.isDown;

    if (isLeft) vx = -this.speed;
    else if (isRight) vx = this.speed;

    if (isUp) vy = -this.speed;
    else if (isDown) vy = this.speed;

    // Diagonal speed normalization
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.state = PLAYER_STATES.MARCHING;
    } else {
      this.state = PLAYER_STATES.IDLE;
    }
  }

  destroy(fromScene) {
    if (this.braceShield) this.braceShield.destroy();
    super.destroy(fromScene);
  }
}
