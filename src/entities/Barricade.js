import Phaser from 'phaser';
import { gameState } from '../state/GameState.js';
import { EVENTS } from '../state/Events.js';
import { audioManager } from '../managers/AudioManager.js';

export class Barricade {
  constructor(scene, x, y, height, requiredSupport, label) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.height = height;
    this.requiredSupport = requiredSupport;
    this.label = label;
    this.isOpen = false;

    // 1. Physical Obstacle Barrier (Upper and Lower gates that part)
    this.gateTop = scene.physics.add.sprite(x, y - height / 4, null);
    this.gateTop.setSize(24, height / 2);
    this.gateTop.setImmovable(true);

    this.gateBottom = scene.physics.add.sprite(x, y + height / 4, null);
    this.gateBottom.setSize(24, height / 2);
    this.gateBottom.setImmovable(true);

    // 2. Visual Wooden/Metal Fence Graphic
    this.visualTop = scene.add.rectangle(x, y - height / 4, 20, height / 2, 0xd97736, 0.95)
      .setStrokeStyle(3, 0x8c3d0f);
    this.visualBottom = scene.add.rectangle(x, y + height / 4, 20, height / 2, 0xd97736, 0.95)
      .setStrokeStyle(3, 0x8c3d0f);

    // Hazard Stripes on barricade
    this.stripeTop = scene.add.text(x, y - height / 4, '⛔ BARRICADE', {
      fontFamily: 'system-ui',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setRotation(-Math.PI / 2);

    this.stripeBottom = scene.add.text(x, y + height / 4, `REQ: ${requiredSupport} SP`, {
      fontFamily: 'system-ui',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setRotation(-Math.PI / 2);

    // 3. Collision with player
    this.colliderTop = scene.physics.add.collider(scene.player, this.gateTop);
    this.colliderBottom = scene.physics.add.collider(scene.player, this.gateBottom);

    // 4. Support listener to unlock barricade
    this.onSupportUpdate = (support) => {
      if (!this.isOpen && support >= this.requiredSupport) {
        this.open();
      }
    };
    gameState.on(EVENTS.SUPPORT_CHANGED, this.onSupportUpdate);
  }

  open() {
    this.isOpen = true;
    audioManager.playDefection();

    // Disable collision
    if (this.colliderTop) this.scene.physics.world.removeCollider(this.colliderTop);
    if (this.colliderBottom) this.scene.physics.world.removeCollider(this.colliderBottom);

    // Parting animation (Gates slide up and down off the street)
    this.scene.tweens.add({
      targets: [this.gateTop, this.visualTop, this.stripeTop],
      y: '-=120',
      alpha: 0.35,
      duration: 1200,
      ease: 'Power2'
    });

    this.scene.tweens.add({
      targets: [this.gateBottom, this.visualBottom, this.stripeBottom],
      y: '+=120',
      alpha: 0.35,
      duration: 1200,
      ease: 'Power2'
    });

    // Alert feedback
    this.scene.events.emit('ruleAlert', {
      rule: 'BARRICADE_OPENED',
      message: `🔓 BARRICADE OPENED: Solidarity breached ${this.label}!`
    });
  }

  destroy() {
    gameState.off(EVENTS.SUPPORT_CHANGED, this.onSupportUpdate);
    if (this.gateTop) this.gateTop.destroy();
    if (this.gateBottom) this.gateBottom.destroy();
    if (this.visualTop) this.visualTop.destroy();
    if (this.visualBottom) this.visualBottom.destroy();
    if (this.stripeTop) this.stripeTop.destroy();
    if (this.stripeBottom) this.stripeBottom.destroy();
  }
}
