# Test & Verification Plan

## 1. Overview
This test plan defines the verification strategy for the **Non-Violent Combat Game**, ensuring all rules, state transitions, mobile touch responsiveness, and PWA capabilities meet the specifications.

---

## 2. Test Scope & Levels

### 2.1 Unit Testing (Native Node Test Runner)
Executed via `node --test tests/*.test.js`:
- `GameState.js`: Health clamping (0–100), Support progression, Defeat condition, Victory condition, Listener notifications.
- `RuleManager.js`: Path boundary calculations, off-path detection, violence infraction penalties.
- Mathematical balance formulas (diminishing returns, witness multipliers).

### 2.2 Integration Testing (Combat Interactions)
- Timed dodge evasion window (validating that a hit inside the invulnerability window restores HP).
- Peaceful stand (kneeling) damage mitigation and support amplification.
- Moral defection threshold: verifying that an opponent transitions to `DISPERSED` when Support reaches threshold.
- Peaceful Chant ripple: validates pacification of opponents within chant radius.

### 2.3 Mobile & PWA Verification
- **Lighthouse PWA Audit:** Verifies installability, offline caching, Service Worker registration, and viewport configuration.
- **Touch Input Verification:** Multi-touch test on mobile devices (simultaneous movement + Dodge / Kneel / Chant tap).

---

## 3. Test Cases Matrix & Execution Status

| Case ID | Feature / Component | Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-01** | Player Hit | Opponent strike hits player | Health drops by 15; Support increases by 10. | **PASS** |
| **TC-02** | Timed Dodge | Player executes dodge during telegraph | Health recovers by 6; Support increases; no damage taken. | **PASS** |
| **TC-03** | Witness Multiplier | Player takes hit or dodges near camera/crowd | Support gain multiplied by 1.5x. | **PASS** |
| **TC-04** | Off-Path Violation | Player steps outside designated path | Support drains steadily; warning alert displayed. | **PASS** |
| **TC-05** | Violence Infraction | Player presses retaliatory button (`F`) | Support drops by 25 SP; warning banner shown. | **PASS** |
| **TC-06** | Defeat Condition | Health reaches 0 | Game halts; GameOverScene loads with Defeat stats. | **PASS** |
| **TC-07** | Victory Condition | Support reaches target (100 SP or all opponents disperse) | Opponents disperse/defect; Victory screen loads. | **PASS** |
| **TC-08** | Peaceful Chant | Player triggers Chant (`E` / Touch) | Expanding harmonic wave pacifies nearby opponents for 2.2s. | **PASS** |
| **TC-09** | Procedural Audio | Game events occur (hit, dodge, brace, chant) | Web Audio synthesizer plays tones without external audio files. | **PASS** |
| **TC-10** | Offline PWA | Disconnect network after initial load | Game loads and plays completely offline. | **PASS** |
| **TC-11** | Mobile Install | Click "Install App" in MenuScene | OS prompt triggers; app installs to home screen. | **PASS** |
