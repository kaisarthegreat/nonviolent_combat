# Satyagraha: Non-Violent Combat Game (PWA)

A browser-based, installable 2D pacifist action game built with **Phaser 3**, **Vanilla JavaScript (ES6+)**, and **Vite**, deployable to **GitHub Pages** via **Docker**.

---

## 📌 Project Overview
In *Satyagraha*, the player faces armed forces without weapons or violent retaliation. The player’s objective is to complete a designated march while managing two opposing metrics:
- **Health:** Decreases when struck; recovers through composure and precision dodging.
- **Support (Public Solidarity):** Increases when the player absorbs aggression peacefully or shields bystanders; decreases if non-violent rules are broken.

When public support surpasses the armed opponents' morale, opponents disperse, lower their batons, or join the line. Victory is achieved through moral resilience.

---

## 📚 Software Design Documentation (SDD Suite)
All specifications and architectural plans are permanently stored in the `docs/` folder:

1. [01_SRS.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/01_SRS.md) — **Software Requirements Specification**: Functional and non-functional requirements, constraints, user stories.
2. [02_GDD.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/02_GDD.md) — **Game Design Document**: Mechanics, mathematical formulas, rule sets, opponent AI states.
3. [03_SDD.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/03_SDD.md) — **Software Design Description**: Architecture, Phaser 3 scene flow, state machine, event bus.
4. [04_DEVOPS_PLAN.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/04_DEVOPS_PLAN.md) — **DevOps & Deployment**: Docker containerization, Git workflow, GitHub Actions CI/CD to GitHub Pages.
5. [05_TEST_PLAN.md](file:///d:/OKG/Obsidian%20Knowledge%20Graph/09_projects/nonviolent_combat/docs/05_TEST_PLAN.md) — **Test & Quality Assurance**: Test cases for mechanics, rule checking, and touch inputs.

---

## 🛠 Tech Stack
- **Engine:** Phaser 3 (Arcade Physics)
- **Language:** Vanilla JavaScript (ES6+ Modules)
- **Bundler & Dev Server:** Vite
- **PWA Runtime:** `vite-plugin-pwa` + Workbox
- **Containerization:** Docker & Docker Compose
- **Hosting & CI/CD:** GitHub Pages + GitHub Actions
