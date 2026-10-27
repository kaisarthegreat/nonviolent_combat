import test from 'node:test';
import assert from 'node:assert/strict';
import { GameStateManager } from '../src/state/GameState.js';
import { EVENTS } from '../src/state/Events.js';

test('Barricade - opens when support meets requirement', () => {
  const state = new GameStateManager();
  const requiredSupport = 30;
  let isOpen = false;

  const onSupport = (support) => {
    if (!isOpen && support >= requiredSupport) {
      isOpen = true;
    }
  };

  state.on(EVENTS.SUPPORT_CHANGED, onSupport);

  // 1. Initial state: closed
  state.modifySupport(15);
  assert.equal(isOpen, false);

  // 2. Cross threshold: opens
  state.modifySupport(20); // support is now 35
  assert.equal(state.support, 35);
  assert.equal(isOpen, true);
});

test('Campaign statistics accumulate accurately', () => {
  const state = new GameStateManager();

  state.stats.blowsAbsorbed += 3;
  state.stats.dodgesClean += 2;
  state.stats.chantsUsed += 1;
  state.decrementOpponents();

  assert.equal(state.stats.blowsAbsorbed, 3);
  assert.equal(state.stats.dodgesClean, 2);
  assert.equal(state.stats.chantsUsed, 1);
  assert.equal(state.stats.opponentsDispersed, 1);
});
