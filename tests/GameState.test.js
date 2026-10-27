import test from 'node:test';
import assert from 'node:assert/strict';
import { GameStateManager } from '../src/state/GameState.js';
import { EVENTS } from '../src/state/Events.js';

test('GameState - initial values', () => {
  const state = new GameStateManager();
  assert.equal(state.health, 100);
  assert.equal(state.support, 0);
  assert.equal(state.opponentsActive, 8);
  assert.equal(state.isGameOver, false);
  assert.equal(state.gameResult, null);
});

test('GameState - modifyHealth clamps between 0 and 100', () => {
  const state = new GameStateManager();

  // Test damage
  state.modifyHealth(-15);
  assert.equal(state.health, 85);

  // Test over-healing clamping
  state.modifyHealth(50);
  assert.equal(state.health, 100);

  // Test reduction to 0 and defeat trigger
  let gameOverEmitted = false;
  state.on(EVENTS.GAME_OVER, (data) => {
    gameOverEmitted = true;
    assert.equal(data.result, 'defeat');
  });

  state.modifyHealth(-150);
  assert.equal(state.health, 0);
  assert.equal(state.isGameOver, true);
  assert.equal(state.gameResult, 'defeat');
  assert.equal(gameOverEmitted, true);
});

test('GameState - modifySupport progression and victory condition', () => {
  const state = new GameStateManager();

  state.modifySupport(25);
  assert.equal(state.support, 25);

  let victoryEmitted = false;
  state.on(EVENTS.GAME_OVER, (data) => {
    victoryEmitted = true;
    assert.equal(data.result, 'victory');
  });

  state.modifySupport(80);
  assert.equal(state.support, 100);
  assert.equal(state.isGameOver, true);
  assert.equal(state.gameResult, 'victory');
  assert.equal(victoryEmitted, true);
});

test('GameState - opponent count decrement leads to victory', () => {
  const state = new GameStateManager();
  state.opponentsActive = 2;

  state.decrementOpponents();
  assert.equal(state.opponentsActive, 1);
  assert.equal(state.isGameOver, false);

  state.decrementOpponents();
  assert.equal(state.opponentsActive, 0);
  assert.equal(state.isGameOver, true);
  assert.equal(state.gameResult, 'victory');
});

test('GameState - rule penalty deductions', () => {
  const state = new GameStateManager();
  state.modifySupport(50);

  let penaltyReported = null;
  state.on(EVENTS.RULE_VIOLATED, (data) => {
    penaltyReported = data;
  });

  state.penalizeRule('NON_VIOLENCE', 25);
  assert.equal(state.support, 25);
  assert.deepEqual(penaltyReported, { rule: 'NON_VIOLENCE', penalty: 25 });
});
