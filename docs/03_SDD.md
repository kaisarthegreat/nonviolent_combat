# Software Design Description (SDD)

## 1. System Architecture Overview

The application follows a **Decoupled Scene-Entity-Manager Pattern** inside the Phaser 3 framework, bundled via Vite and exposed as a Progressive Web Application.

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Runtime                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Service Worker      │       │     DOM Container     │  │
│  │   (Offline Cache)     │       │   (Canvas + HUD Div)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Phaser 3 Game Core                  │  │
│  │                                                       │  │
│  │  ┌────────────┐   ┌────────────┐   ┌───────────────┐  │  │
│  │  │ BootScene  │──>│ MenuScene  │──>│   GameScene   │  │  │
│  │  └────────────┘   └────────────┘   └───────┬───────┘  │  │
│  │                                            │          │  │
│  │                                            ▼          │  │
│  │                                    ┌───────────────┐  │  │
│  │                                    │    UIScene    │  │  │
│  │                                    │  (Health/SP)  │  │  │
│  │                                    └───────────────┘  │  │
│  └───────────────────────────────────────────┬───────────┘  │
│                                              │              │
│                        Event Bus & State     ▼              │
│                      ┌─────────────────────────────────┐    │
│                      │           GameState             │    │
│                      │  (Health, Support, Violations)  │    │
│                      └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
nonviolent_combat/
├── docs/                           # SDD Documentation Suite
│   ├── 01_SRS.md
│   ├── 02_GDD.md
│   ├── 03_SDD.md
│   ├── 04_DEVOPS_PLAN.md
│   └── 05_TEST_PLAN.md
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages CI/CD pipeline
├── public/
│   ├── manifest.json              # Web App Manifest
│   ├── icons/                     # 192x192 and 512x512 PWA icons
│   └── assets/                    # Audio, spritesheets, tiles
├── src/
│   ├── main.js                    # Phaser entry point
│   ├── config.js                  # Canvas dimensions, physics configs
│   ├── state/
│   │   ├── GameState.js           # Observable reactive state singleton
│   │   └── Events.js              # Event name constants
│   ├── scenes/
│   │   ├── BootScene.js           # Preloads assets
│   │   ├── MenuScene.js           # Main menu & PWA install trigger
│   │   ├── GameScene.js           # Core physics world & gameplay
│   │   ├── UIScene.js             # HUD overlays (HP bar, Support bar)
│   │   └── GameOverScene.js       # Win/Loss summary screen
│   ├── entities/
│   │   ├── Player.js              # Movement, dodge timing, brace state
│   │   ├── Opponent.js            # FSM (Patrol, Telegraph, Attack, Disperse)
│   │   └── Bystander.js           # Crowd & media cameras
│   └── managers/
│       ├── RuleManager.js         # Path boundary and pacifist rule validator
│       ├── InputManager.js        # Touch buttons & keyboard mapper
│       └── SoundManager.js        # Dynamic soundscapes
├── Dockerfile                      # Dev container
├── docker-compose.yml              # Dev container composition
├── package.json                    # Project metadata & dependencies
└── vite.config.js                  # Vite & PWA plugin configuration
```

---

## 3. Core Class & State Specifications

### 3.1 `GameState.js` (Singleton)
```javascript
export class GameState {
  constructor() {
    this.health = 100;
    this.support = 0;
    this.opponentsTotal = 10;
    this.opponentsActive = 10;
    this.isBracing = false;
    this.onPath = true;
    this.listeners = new Map();
  }

  modifyHealth(delta) {
    this.health = Math.max(0, Math.min(100, this.health + delta));
    this.emit('healthChanged', this.health);
    if (this.health === 0) this.emit('gameOver', 'defeat');
  }

  modifySupport(delta) {
    this.support = Math.max(0, Math.min(100, this.support + delta));
    this.emit('supportChanged', this.support);
    if (this.support >= 100) this.emit('gameOver', 'victory');
  }

  on(event, callback) { /* subscriber register */ }
  emit(event, data) { /* notify subscribers */ }
}
```

### 3.2 `Player.js` State Machine
The player operates in four finite states:
- `IDLE`: Standing peacefully on the path.
- `MARCHING`: Walking forward along the route.
- `DODGING`: 250ms invulnerability window with composure recovery.
- `BRACING`: Rooted in place; halves incoming damage, maximizes sympathy gains.

### 3.3 `Opponent.js` Finite State Machine (FSM)
- `PATROL`: Guards a segment of the street.
- `TELEGRAPH`: Red arc/box projects onto ground for 750ms before strike.
- `ATTACK`: Hits target area with baton or shield push.
- `DISPERSE`: Triggered when `GameState.support >= this.threshold`. Drops weapon and walks off screen.

### 3.4 `RuleManager.js`
Runs boundary intersection checks between the player's bounding box and the `DesignatedPath` zone in `GameScene.update()`:
- If `!pathBounds.contains(player.x, player.y)`, triggers `ruleViolated('OFF_PATH')`.
- Listens for forbidden attack inputs; triggers `ruleViolated('VIOLENCE_ATTEMPT')`.

---

## 4. Mobile & PWA Architecture

### 4.1 Responsive Viewport & Canvas Scaling
- Configured with `Phaser.Scale.FIT` and `Phaser.Scale.CENTER_BOTH`.
- Target native aspect ratio: `16:9` (1280 x 720 base resolution), dynamically scaled to fit mobile screens in both portrait and landscape.

### 4.2 PWA Service Worker Strategy
- **Pre-caching:** Cache core HTML, CSS, JS bundles, and spritesheet assets.
- **Runtime caching:** Sound effects and background music cached with Cache-First strategy.
- **Install Prompt:** `beforeinstallprompt` event captured in `MenuScene` to render an in-game "Install to Phone" button.
