import { gameState } from '../state/GameState.js';
import { audioManager } from './AudioManager.js';

export class RuleManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.pathTop = options.pathTop || 180;
    this.pathBottom = options.pathBottom || 540;
    this.wasOffPath = false;
    this.offPathDrainRate = 0.15;
  }

  update(player) {
    if (gameState.isGameOver || !player) return;

    const isOff = player.y < this.pathTop || player.y > this.pathBottom;

    if (isOff) {
      gameState.modifySupport(-this.offPathDrainRate);

      if (!this.wasOffPath) {
        this.wasOffPath = true;
        audioManager.playViolation();
        this.scene.events.emit('ruleAlert', {
          rule: 'OFF_PATH',
          message: '⚠️ OFF DESIGNATED ROUTE: Public support draining!'
        });
      }
    } else {
      if (this.wasOffPath) {
        this.wasOffPath = false;
        this.scene.events.emit('ruleCleared', { rule: 'OFF_PATH' });
      }
    }
  }

  triggerViolenceInfraction(reason = 'Striking or pushing opponent') {
    const penalty = 25;
    audioManager.playViolation();
    gameState.penalizeRule('NON_VIOLENCE', penalty);

    this.scene.cameras.main.shake(250, 0.02);
    this.scene.events.emit('ruleAlert', {
      rule: 'VIOLENCE_FORBIDDEN',
      message: '🚫 VIOLENCE FORBIDDEN: Satyagraha forbids retaliation! (-25 SP)'
    });
  }
}
