import { EVENTS } from './Events.js';

export class GameStateManager {
  constructor() {
    this.reset();
    this.listeners = new Map();
  }

  reset() {
    this.health = 100;
    this.support = 0;
    this.opponentsTotal = 7;
    this.opponentsActive = 7;
    this.isBracing = false;
    this.isDodging = false;
    this.onPath = true;
    this.isGameOver = false;
    this.gameResult = null; // 'victory' | 'defeat'

    // Detailed Campaign Statistics
    this.stats = {
      blowsAbsorbed: 0,
      dodgesClean: 0,
      chantsUsed: 0,
      opponentsDispersed: 0,
      maxSupport: 0
    };
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
      this.emit(EVENTS.GAME_OVER, {
        result: 'defeat',
        reason: 'Physical endurance exhausted',
        stats: { ...this.stats, finalSupport: this.support }
      });
    }
  }

  modifySupport(delta) {
    if (this.isGameOver) return;
    this.support = Math.max(0, Math.min(100, this.support + delta));
    if (this.support > this.stats.maxSupport) {
      this.stats.maxSupport = Math.round(this.support);
    }

    this.emit(EVENTS.SUPPORT_CHANGED, this.support);

    if (this.support >= 100 || this.opponentsActive <= 0) {
      this.isGameOver = true;
      this.gameResult = 'victory';
      this.emit(EVENTS.GAME_OVER, {
        result: 'victory',
        reason: 'Public solidarity overwhelmed brute force',
        stats: { ...this.stats, finalSupport: this.support }
      });
    }
  }

  decrementOpponents() {
    if (this.opponentsActive > 0) {
      this.opponentsActive -= 1;
      this.stats.opponentsDispersed += 1;
      this.emit(EVENTS.OPPONENT_COUNT_CHANGED, this.opponentsActive);

      if (this.opponentsActive <= 0) {
        this.isGameOver = true;
        this.gameResult = 'victory';
        this.emit(EVENTS.GAME_OVER, {
          result: 'victory',
          reason: 'All armed opposition stood down',
          stats: { ...this.stats, finalSupport: this.support }
        });
      }
    }
  }

  penalizeRule(ruleName, penaltyAmount) {
    this.modifySupport(-penaltyAmount);
    this.emit(EVENTS.RULE_VIOLATED, { rule: ruleName, penalty: penaltyAmount });
  }
}

export const gameState = new GameStateManager();
