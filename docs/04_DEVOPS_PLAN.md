# DevOps & Deployment Plan

## 1. Overview
This project uses **Docker** for local development to ensure environment parity and eliminate local machine Node.js version conflicts, **Git** for version control, and **GitHub Actions + GitHub Pages** for continuous deployment.

---

## 2. Docker Local Development Architecture

### 2.1 Container Setup
- **Base Image:** `node:20-alpine` (lightweight, ~50MB)
- **Port:** `5173` forwarded to `localhost:5173`
- **Volume Mounting:** Current working directory mounted to `/app` inside the container for instant Hot Module Replacement (HMR).

### 2.2 Dockerfile Specification
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Run Vite dev server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 2.3 `docker-compose.yml` Specification
```yaml
version: '3.8'

services:
  web:
    build: .
    container_name: nonviolent_combat_app
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
```

---

## 3. Git Version Control Conventions

### 3.1 Branching Strategy
- `main`: Production-ready code automatically deployed to GitHub Pages.
- `feature/<name>`: Feature branches (e.g. `feature/player-fsm`, `feature/pwa-manifest`).

### 3.2 Commit Message Standard (Conventional Commits)
- `feat:` New gameplay feature or scene
- `fix:` Bug fix in physics, state, or rules
- `docs:` Updates to SDD specifications
- `chore:` Dependency, Docker, or build script updates

---

## 4. GitHub Actions CI/CD to GitHub Pages (Free Tier)

### 4.1 Deployment Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Build Production Assets
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 5. Development Execution Commands

Using **Git Bash**:
```bash
# Build and run with Docker
docker compose up --build

# Open in browser:
# http://localhost:5173
```
