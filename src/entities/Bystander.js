import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager.js';

export class Bystander extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, isPress = false) {
    super(scene, x, y, 'bystander');

    scene.add.existing(this);

    this.isPress = isPress;
    this.witnessRadius = 240;

    if (this.isPress) {
      this.setTint(0xffd54f);
      this.cameraIcon = scene.add.text(x, y - 18, '📷', { fontSize: '12px' }).setOrigin(0.5);
    }

    scene.tweens.add({
      targets: this,
      y: y + (Math.random() > 0.5 ? 4 : -4),
      yoyo: true,
      repeat: -1,
      duration: 1500 + Math.random() * 800,
      ease: 'Sine.easeInOut'
    });
  }

  isWitnessing(targetX, targetY) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    return dist <= this.witnessRadius;
  }

  triggerFlash() {
    if (!this.isPress) return;

    audioManager.playCameraClick();

    const flash = this.scene.add.circle(this.x, this.y, 45, 0xffffff, 0.95);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2.4,
      scaleY: 2.4,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy()
    });
  }

  destroy(fromScene) {
    if (this.cameraIcon) this.cameraIcon.destroy();
    super.destroy(fromScene);
  }
}
