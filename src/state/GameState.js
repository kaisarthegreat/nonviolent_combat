import { EVENTS } from './Events.js';

export class GameStateManager {
  constructor() {
    this.reset();
    this.listeners = new Map();
  }

  reset() {
    this.health = 100;
    this.support = 0;
    this.opponentsTotal = 8;
    this.opponentsActive = 8;
    this.isBracing = false;
    this.isDodging = false;
    this.onPath = true;
    this.isGameOver = false;
    this.gameResult = null; // 'victory' | 'defeat'
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, list);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => cb(data));
  }

  modifyHealth(delta) {
    if (this.isGameOver) return;
    this.health = Math.max(0, Math.min(100, this.health + delta));
    this.emit(EVENTS.HEALTH_CHANGED, this.health);

    if (this.health <= 0) {
      this.isGameOver = true;
      this.gameResult = 'defeat';
      this.emit(EVENTS.GAME_OVER, { result: 'defeat', reason: 'Health reached zero' });
    }
  }

  modifySupport(delta) {
    if (this.isGameOver) return;
    this.support = Math.max(0, Math.min(100, this.support + delta));
    this.emit(EVENTS.SUPPORT_CHANGED, this.support);

    // Win condition check: Support reaches 100 or clears remaining opponents
    if (this.support >= 100 || this.opponentsActive <= 0) {
      this.isGameOver = true;
      this.gameResult = 'victory';
      this.emit(EVENTS.GAME_OVER, { result: 'victory', reason: 'Moral solidarity prevailed' });
    }
  }

  decrementOpponents() {
    if (this.opponentsActive > 0) {
      this.opponentsActive -= 1;
      this.emit(EVENTS.OPPONENT_COUNT_CHANGED, this.opponentsActive);

      if (this.opponentsActive <= 0) {
        this.isGameOver = true;
        this.gameResult = 'victory';
        this.emit(EVENTS.GAME_OVER, { result: 'victory', reason: 'All opponents stood down' });
      }
    }
  }

  penalizeRule(ruleName, penaltyAmount) {
    this.modifySupport(-penaltyAmount);
    this.emit(EVENTS.RULE_VIOLATED, { rule: ruleName, penalty: penaltyAmount });
  }
}

export const gameState = new GameStateManager();
