# Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for the **Non-Violent Combat Game**, a Progressive Web App (PWA) demonstrating pacifist resistance mechanics against armed opponents.

### 1.2 Scope
The game will run across desktop and mobile web browsers with full offline PWA capabilities. Players navigate a designated path without attacking or retaliating, overcoming armed opponents strictly through composure, dodging, and public support accumulation.

---

## 2. Overall Description

### 2.1 Product Perspective
- Single-page web application running in modern web browsers (Chrome, Safari, Firefox, Edge).
- Installable on mobile home screens (Android/iOS) via standard PWA manifest.
- Offline-first execution via service worker asset caching.

### 2.2 User Characteristics
- Casual and mid-core gamers interested in innovative mechanics and pacifist/moral themes.
- Mobile and desktop players requiring intuitive touch and keyboard controls.

---

## 3. Specific Requirements

### 3.1 Functional Requirements (FR)

- **FR-01: Player Core Metrics**
  - **FR-01.1 Health (HP):** Ranging from `0` to `100`. Starts at `100`. Reaching `0` triggers Game Over (Defeat).
  - **FR-01.2 Support (SP):** Ranging from `0` to `100`. Starts at `0` or an initial baseline. Reaching or exceeding Opponent Morale/Threshold triggers Victory.
- **FR-02: Impact and Damage System**
  - When struck by an opponent attack, player Health decreases by a defined penalty (e.g., `-15 HP`), while Support increases (e.g., `+10 SP`).
  - Absorbing hits while in the field-of-view of bystanders or cameras multiplies Support gains.
- **FR-03: Dodging and Recovery**
  - Player can trigger an evasion/dodge move.
  - Precision/Just-in-Time dodging during an opponent attack telegraph window recovers a portion of Health/Composure (e.g., `+5 HP`, up to max `100 HP`).
- **FR-04: Non-Violent Rule Enforcement**
  - **FR-04.1 No Retaliation:** The player has no attack actions. Any attempt or forbidden physical violence instantly penalizes Support (`-30% SP`).
  - **FR-04.2 Path Boundary:** Straying off the designated march route pauses Support generation and causes barricades to close in.
  - **FR-04.3 Respect Property:** Colliding with or damaging street elements penalizes Support (`-50% SP`).
- **FR-05: Opponent Dynamics and Victory Condition**
  - As Support rises, opponent numbers or aggression levels diminish (e.g., officers lower batons, step aside, or disperse).
  - Victory occurs when Support meets or exceeds the required opponent threshold for the stage.
- **FR-06: Controls & Input**
  - Desktop: Keyboard (WASD / Arrow Keys, Space for Dodge, Shift to Kneel/Brace).
  - Mobile: On-screen virtual joystick and touch action buttons.
- **FR-07: PWA Support**
  - Standalone display mode with custom app icons, splash screen, and offline service worker caching.

### 3.2 Non-Functional Requirements (NFR)
- **NFR-01 Performance:** Maintain a consistent 60 FPS on mid-range mobile devices.
- **NFR-02 Initial Load:** First paint under 2.5 seconds on a standard 4G connection.
- **NFR-03 Bundle Size:** Production bundle under 5 MB (excluding audio assets).
- **NFR-04 Platform Agnostic:** Identical gameplay feel across touchscreens and desktop keyboards.
- **NFR-05 Zero Cost Infrastructure:** Deployable entirely on GitHub Pages without paid backends.

---

## 4. User Stories & Acceptance Criteria

| ID | User Story | Acceptance Criteria |
|---|---|---|
| **US-01** | As a player, I want to dodge attacks cleanly so that I can recover health. | Successfully dodging inside the telegraph frame increases HP by 5 and triggers visual "Composure!" feedback. |
| **US-02** | As a player, I want my suffering to be witnessed so that public solidarity increases. | Taking damage within range of bystanders increases Support by 1.5x regular rate. |
| **US-03** | As a mobile player, I want to install the game on my home screen so I can play offline. | Browser displays "Install App" banner; game launches without browser address bar and functions offline. |
| **US-04** | As a player, I want clear visual signs when opponents give up. | Opponents whose morale breaks put down their batons and step off the road. |
