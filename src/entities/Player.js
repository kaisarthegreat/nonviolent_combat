import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { audioManager } from '../managers/AudioManager.js';

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

    // Dodge cooldowns
    this.dodgeCooldown = false;
    this.dodgeDuration = 280;
    this.dodgeCooldownDuration = 550;

    // Chant / Moral Appeal cooldowns
    this.chantRadius = 260;
    this.chantCooldownDuration = 6000; // 6 seconds
    this.lastChantTime = -6000;

    // Visual indicators
    this.braceShield = scene.add.circle(x, y, 26, 0x4ecca3, 0.25).setVisible(false);

    // Idle breathing tween
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

  getChantCooldownPercent(currentTime) {
    const elapsed = currentTime - this.lastChantTime;
    if (elapsed >= this.chantCooldownDuration) return 1.0;
    return elapsed / this.chantCooldownDuration;
  }

  triggerDodge() {
    if (this.dodgeCooldown || this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    this.state = PLAYER_STATES.DODGING;
    this.dodgeCooldown = true;
    gameState.isDodging = true;

    audioManager.playDodge();

    this.setAlpha(0.4);
    this.setTint(0x64ffda);

    const dashVelocityX = this.body.velocity.x !== 0 ? this.body.velocity.x * 1.5 : 220;
    const dashVelocityY = this.body.velocity.y * 1.5;
    this.setVelocity(dashVelocityX, dashVelocityY);

    this.scene.time.delayedCall(this.dodgeDuration, () => {
      this.clearTint();
      this.setAlpha(1.0);
      gameState.isDodging = false;
      if (this.state === PLAYER_STATES.DODGING) {
        this.state = PLAYER_STATES.IDLE;
      }
    });

    this.scene.time.delayedCall(this.dodgeCooldownDuration, () => {
      this.dodgeCooldown = false;
    });
  }

  setBracing(active) {
    if (this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    if (active) {
      if (this.state !== PLAYER_STATES.BRACING) {
        audioManager.playBrace();
      }
      this.state = PLAYER_STATES.BRACING;
      gameState.isBracing = true;
      this.setVelocity(0, 0);
      this.braceShield.setVisible(true);
      this.braceShield.setPosition(this.x, this.y);
      this.setScale(0.9, 0.85);
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

  triggerChant(currentTime) {
    if (gameState.isGameOver || (currentTime - this.lastChantTime < this.chantCooldownDuration)) {
      return false;
    }

    this.lastChantTime = currentTime;
    audioManager.playChant();

    const ripple = this.scene.add.circle(this.x, this.y, 10, 0x4ecca3, 0.45)
      .setStrokeStyle(3, 0x64ffda, 0.9);

    this.scene.tweens.add({
      targets: ripple,
      radius: this.chantRadius,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => ripple.destroy()
    });

    this.scene.events.emit('playerChant', {
      x: this.x,
      y: this.y,
      radius: this.chantRadius
    });

    return true;
  }

  handleInput(cursors, wasdKeys, time, touchVector = null, touchTarget = null) {
    if (this.state === PLAYER_STATES.DODGING || gameState.isGameOver) return;

    // Chant action [E]
    if (wasdKeys && wasdKeys.chant && Phaser.Input.Keyboard.JustDown(wasdKeys.chant)) {
      this.triggerChant(time);
    }

    // Brace action [Shift]
    const wantsBrace = wasdKeys && wasdKeys.brace && wasdKeys.brace.isDown;
    if (wantsBrace) {
      this.setBracing(true);
    }

    if (this.state === PLAYER_STATES.BRACING) {
      this.braceShield.setPosition(this.x, this.y);
      return;
    }

    // Dodge action [Space]
    if (wasdKeys && wasdKeys.dodge && Phaser.Input.Keyboard.JustDown(wasdKeys.dodge)) {
      this.triggerDodge();
      return;
    }

    let vx = 0;
    let vy = 0;

    // Keyboard inputs
    const isLeft = (cursors && cursors.left && cursors.left.isDown) || (wasdKeys && wasdKeys.left && wasdKeys.left.isDown);
    const isRight = (cursors && cursors.right && cursors.right.isDown) || (wasdKeys && wasdKeys.right && wasdKeys.right.isDown);
    const isUp = (cursors && cursors.up && cursors.up.isDown) || (wasdKeys && wasdKeys.up && wasdKeys.up.isDown);
    const isDown = (cursors && cursors.down && cursors.down.isDown) || (wasdKeys && wasdKeys.down && wasdKeys.down.isDown);

    if (isLeft) vx = -this.speed;
    else if (isRight) vx = this.speed;

    if (isUp) vy = -this.speed;
    else if (isDown) vy = this.speed;

    // Virtual D-pad / Joystick vector takes priority or combines
    if (touchVector && (touchVector.x !== 0 || touchVector.y !== 0)) {
      vx = touchVector.x * this.speed;
      vy = touchVector.y * this.speed;
    } else if (touchTarget) {
      // Touch-and-drag or tap-to-move towards a world point
      const dist = Phaser.Math.Distance.Between(this.x, this.y, touchTarget.x, touchTarget.y);
      if (dist > 18) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, touchTarget.x, touchTarget.y);
        vx = Math.cos(angle) * this.speed;
        vy = Math.sin(angle) * this.speed;
      }
    }

    // Diagonal speed normalization
    if (vx !== 0 && vy !== 0 && (!touchVector || (touchVector.x === 0 && touchVector.y === 0))) {
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
