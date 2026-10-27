import Phaser from 'phaser';

export class Marcher extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, followTarget, offset = { x: -50, y: 0 }) {
    super(scene, x, y, 'bystander');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.followTarget = followTarget;
    this.offset = offset;
    this.speed = 180;

    // Peaceful green tint for active solidarity marchers
    this.setTint(0xa7ffeb);
    this.setCircle(14);

    // Small peace banner / sign above head
    this.banner = scene.add.text(x, y - 20, '☮', {
      fontFamily: 'system-ui',
      fontSize: '14px',
      color: '#4ecca3'
    }).setOrigin(0.5);
  }

  update() {
    if (!this.followTarget || !this.active) return;

    const targetX = this.followTarget.x + this.offset.x;
    const targetY = this.followTarget.y + this.offset.y;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);

    if (dist > 15) {
      this.scene.physics.moveTo(this, targetX, targetY, Math.min(this.speed, dist * 3));
    } else {
      this.setVelocity(0, 0);
    }

    if (this.banner) {
      this.banner.setPosition(this.x, this.y - 20);
    }
  }

  destroy(fromScene) {
    if (this.banner) this.banner.destroy();
    super.destroy(fromScene);
  }
}
