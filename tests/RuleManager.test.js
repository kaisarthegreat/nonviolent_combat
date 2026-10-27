import test from 'node:test';
import assert from 'node:assert/strict';
import { RuleManager } from '../src/managers/RuleManager.js';
import { gameState } from '../src/state/GameState.js';

test('RuleManager - detects off-path position and restores when back on path', () => {
  gameState.reset();
  gameState.modifySupport(50);

  const mockScene = {
    events: {
      emittedAlerts: [],
      emittedClears: [],
      emit(event, data) {
        if (event === 'ruleAlert') this.emittedAlerts.push(data);
        if (event === 'ruleCleared') this.emittedClears.push(data);
      }
    },
    cameras: {
      main: { shake() {} }
    }
  };

  const ruleManager = new RuleManager(mockScene, { pathTop: 100, pathBottom: 300 });

  // 1. Player is safely on path
  const player = { y: 200 };
  ruleManager.update(player);
  assert.equal(ruleManager.wasOffPath, false);

  // 2. Player steps off path (too high)
  player.y = 80;
  ruleManager.update(player);
  assert.equal(ruleManager.wasOffPath, true);
  assert.equal(mockScene.events.emittedAlerts.length, 1);
  assert.equal(mockScene.events.emittedAlerts[0].rule, 'OFF_PATH');

  // Support should have decayed
  assert.ok(gameState.support < 50);

  // 3. Player returns to path
  player.y = 200;
  ruleManager.update(player);
  assert.equal(ruleManager.wasOffPath, false);
  assert.equal(mockScene.events.emittedClears.length, 1);
  assert.equal(mockScene.events.emittedClears[0].rule, 'OFF_PATH');
});

test('RuleManager - violence infraction applies penalty', () => {
  gameState.reset();
  gameState.modifySupport(60);

  const mockScene = {
    events: {
      emitted: [],
      emit(event, data) {
        this.emitted.push({ event, data });
      }
    },
    cameras: {
      main: { shake() {} }
    }
  };

  const ruleManager = new RuleManager(mockScene, { pathTop: 100, pathBottom: 300 });
  ruleManager.triggerViolenceInfraction('Test violent action');

  assert.equal(gameState.support, 35); // 60 - 25 = 35
  assert.equal(mockScene.events.emitted.length, 1);
  assert.equal(mockScene.events.emitted[0].data.rule, 'VIOLENCE_FORBIDDEN');
});
