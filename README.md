# Satyagraha: The Unbroken Line (PWA)

A browser-based, installable 2D pacifist action game built with **Phaser 3**, **Vanilla JavaScript (ES6+)**, and **Vite**, containerized with **Docker**, and deployed to **GitHub Pages** (free tier).

---

## 📌 Game Overview & Mechanics

In *Satyagraha*, the player advances through an armed blockade strictly adhering to non-violent resistance. Brute force cannot win; victory is achieved when public conscience and solidarity overcome opposition.

### Core Dynamics:
1. **Health vs. Support Balance:**
   - **Struck by armed forces:** Health decreases; Public Solidarity increases (witnesses are moved by your peaceful endurance).
   - **Precision Dodge (`Space`):** Evading inside the attack telegraph window restores composure and recovers health (`+6 HP`).
   - **Peaceful Kneel / Stand (`Shift`):** Drops profile to absorb blows; incoming damage is reduced by >50%, and public sympathy surges (`+20 SP`).
   - **Moral Appeal / Chant (`E`):** Radiates a calming harmonic wave that pacifies nearby opponents for 2.4 seconds (6s cooldown).
2. **Rule Enforcement:**
   - **Stay on Route:** Leaving the designated boulevard causes support to steadily drain.
   - **Zero Violence:** Attempting retaliatory strikes (`F`) severely penalizes Support (`-25 SP`).
3. **Movement & Solidarity Growth:**
   - As support rises, checkpoints and barricades part.
   - Bystanders step in from sidewalks to join the procession, swelling the march.
   - Armed opponents defect, lower their batons, and stand down.
4. **Win / Defeat Conditions:**
   - **Victory:** Reach the National Assembly Gates or persuade all opposition to stand down.
   - **Defeat:** Health drops to zero before the march succeeds.

---

## 🎮 Controls

| Action | Desktop Keyboard | Mobile Touch Screen |
|---|---|---|
| **March / Move** | `W / A / S / D` or Arrow Keys | Direct touch / tap |
| **Precision Dodge** | `Space` | `DODGE` Touch Button |
| **Kneel / Hold Ground** | `Shift` (Hold) | `KNEEL` Touch Button |
| **Peaceful Chant** | `E` | `CHANT` Touch Button |
| **Forbidden Violence** | `F` (Penalized!) | — |
| **Audio Toggle** | Click `[🔊 / 🔇]` Button | Tap `[🔊 / 🔇]` Button |

---

## 🐳 Local Development with Docker

Run the entire application in an isolated Docker container with volume mounting and Hot Module Replacement (HMR):

### 1. Start Docker Desktop
Ensure Docker Desktop is running on your machine.

### 2. Build and Start Container
In **Git Bash**:
```bash
docker compose up --build
```

### 3. Open Game in Browser
- **On PC:** Open [http://localhost:5173](http://localhost:5173)
- **On Mobile (Same Local Wi-Fi):**
  1. Find your computer's local IP address (`ipconfig` in terminal, e.g. `192.168.1.50`).
  2. On your smartphone browser (Chrome or Safari), visit: `http://192.168.1.50:5173`

---

## 📱 Installing on Smartphone (PWA)

This game is a certified Progressive Web App with offline service worker caching:

1. **Android (Chrome):**
   - Tap the **"📲 Install App"** button on the start screen, or tap Chrome's menu (`⋮`) $\to$ **"Add to Home screen"** / **"Install app"**.
2. **iOS (Safari):**
   - Tap the **Share** button (`⬆`) in Safari $\to$ select **"Add to Home Screen"**.
3. **Offline Play:**
   - Once loaded once, you can turn on Airplane mode; the game runs with zero internet connection.

---

## 🚀 Free Deployment to GitHub Pages

The repository contains an automated GitHub Actions deployment workflow ([`.github/workflows/deploy.yml`](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/.github/workflows/deploy.yml)).

### Step-by-Step GitHub Setup:

1. **Create an empty repository on GitHub** (e.g., `nonviolent_combat`).
2. **Link local Git and Push:**
   In **Git Bash**:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/nonviolent_combat.git
   git push -u origin main
   ```
3. **Enable GitHub Pages:**
   - Go to your repository on GitHub.
   - Navigate to: **Settings** $\to$ **Pages**.
   - Under **Build and deployment** $\to$ **Source**, choose: **GitHub Actions**.
4. **Live URL:**
   - GitHub Actions will automatically build Vite and deploy the game to:
     `https://<YOUR_GITHUB_USERNAME>.github.io/nonviolent_combat/`

---

## 🧪 Running Automated Tests

Run the test suite using Node's test runner:
```bash
node --test tests/*.test.js
```
Verifies health/support formulas, boundary rule detection, barricade mechanics, and campaign metrics.

---

## 📚 Software Design Documentation (SDD)

- [01_SRS.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/01_SRS.md) — Software Requirements Specification
- [02_GDD.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/02_GDD.md) — Game Design Document & Math Balance
- [03_SDD.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/03_SDD.md) — Software Design Description & FSMs
- [04_DEVOPS_PLAN.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/04_DEVOPS_PLAN.md) — Containerization & CI/CD
- [05_TEST_PLAN.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/05_TEST_PLAN.md) — Test Cases & QA Matrix
