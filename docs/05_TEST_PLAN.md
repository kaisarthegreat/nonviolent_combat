# Test & Verification Plan

## 1. Overview
This test plan defines the verification strategy for the **Non-Violent Combat Game**, ensuring all rules, state transitions, mobile touch responsiveness, and PWA capabilities meet the specifications.

---

## 2. Test Scope & Levels

### 2.1 Unit Testing (Vitest / Headless JS)
Targeting standalone business logic independent of rendering:
- `GameState.js`: Health clamping (0–100), Support progression, listener notification.
- `RuleManager.js`: Boundary collision checks, forbidden action detection, penalty calculations.
- Mathematical balance formulas (diminishing returns, witness multipliers).

### 2.2 Integration Testing (Phaser Headless)
- Collision detection between Opponent telegraph hitboxes and Player.
- Timed dodge evasion window (validating that a hit inside the 250ms window restores HP instead of causing damage).
- Morale threshold trigger: verifying that an opponent transitions to `DISPERSE` when Support exceeds threshold.

### 2.3 Mobile & PWA Verification
- **Lighthouse PWA Audit:** Verifies installability, offline caching, Service Worker registration, and viewport configuration.
- **Touch Input Verification:** Multi-touch test on Android Chrome and iOS Safari (simultaneous virtual thumbstick movement + dodge button tap).

---

## 3. Test Cases Matrix

| Case ID | Feature / Component | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-01** | Player Hit | Opponent strike hits player | Health drops by 15; Support increases by 10. | Pending |
| **TC-02** | Timed Dodge | Player executes dodge during telegraph | Health recovers by 5; no damage taken. | Pending |
| **TC-03** | Witness Multiplier | Player takes hit near camera/crowd | Support gain multiplied by 1.5x. | Pending |
| **TC-04** | Off-Path Violation | Player steps outside designated path | Support drains by 5 SP/sec; alert banner shown. | Pending |
| **TC-05** | Violence Infraction | Player presses retaliatory button | Support drops by 35 SP; crowd members scatter. | Pending |
| **TC-06** | Defeat Condition | Health reaches 0 | Game halts; GameOverScene loads with Defeat stats. | Pending |
| **TC-07** | Victory Condition | Support reaches target (>= Opponents) | Opponents disperse/defect; Victory screen loads. | Pending |
| **TC-08** | Offline PWA | Disconnect network after initial load | Game loads and plays completely offline. | Pending |
| **TC-09** | Mobile Install | Click "Install App" in MenuScene | OS prompt triggers; app installs to home screen. | Pending |
