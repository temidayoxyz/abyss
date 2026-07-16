# Abyss

**Living deep-ocean exploration simulator** — pilot a small research submersible from sunlit shallows into the lightless trench.

Built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).

**Live demo:** [temidayoxyz.github.io/abyss](https://temidayoxyz.github.io/abyss/)

---

## Overview

You control the survey craft **Aurora-7** as it descends through changing ocean zones. Light fades, pressure rises, and the creatures and landmarks you meet shift with depth. Scan life, log samples, photograph sites, and fill a discovery journal — peaceful, beautiful, and slightly mysterious, not a combat game.

### What you’ll find

| Depth feel | Highlights |
|------------|------------|
| **Sunlit** | God rays, coral terraces, reef fish, jellies |
| **Twilight** | Lanternfish, sharks, wrecks, caves |
| **Midnight / abyss** | Vipers, anglers, bioluminescence, giant squid |
| **Hadal** | Vents, ruins, trench mouths, rare contacts |

Also: marine snow, floating particles, hydrothermal plumes, ancient stone glow, and occasional unexplained encounters (distant shadows, unknown sonar, lights in a trench).

---

## Play

### Desktop

| Input | Action |
|--------|--------|
| **W A S D** | Steer |
| **Q / E** (or Space / Ctrl) | Rise / Dive |
| **Mouse** (click canvas) | Look |
| **Shift** | Boost |
| **L** | Headlights |
| **F** | Sonar |
| **C** | Scan creature or site |
| **X** | Collect sample |
| **P** | Photograph |
| **J** | Discovery journal |
| **Esc** | Close panels |

### Mobile / touch

- **Left stick** — move  
- **Right stick** — look  
- **↑ / ↓** — rise / dive  
- **Bottom action bar** — lights, sonar, scan, sample, photo, journal  

Aim with the center crosshair; scan or sample when a contact is in view.

### Systems

- **Depth** changes fog, colour, ambient light, temperature, pressure, and visibility.
- **Oxygen** recharges near the surface; drains slowly deeper.
- **Battery** powers lights, sonar, and boost; recharges in the shallows with systems idle.
- **Sonar** paints nearby life and landmarks on the scope.
- **Journal** stores a generated profile for every scanned species or site (name, depth range, behaviour, rarity, field notes).

---

## Quick start

```bash
git clone https://github.com/temidayoxyz/abyss.git
cd abyss
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/abyss/`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

---

## Stack

- **Three.js** — WebGL scene, lighting, fog, procedural meshes
- **Vite** — dev server and production bundling
- **Web Audio API** — soft underwater drone, hiss, and sonar pings
- **Vanilla HTML/CSS/JS** — phosphor-style submarine HUD, responsive layout

No backend. Everything runs in the browser.

---

## Project layout

```
abyss/
├── index.html                 # Shell, HUD, journal, title screen
├── package.json
├── vite.config.js             # base: /abyss/ for GitHub Pages
├── .github/workflows/deploy.yml
└── src/
    ├── main.js                # Game loop, actions, encounters
    ├── styles.css             # HUD & responsive UI
    ├── data/
    │   ├── creatures.js       # Species & landmark catalog
    │   └── encounters.js      # Mysterious event table
    └── systems/
        ├── depth.js           # Environment vs depth
        ├── world.js           # Ocean scene, fog, terrain
        ├── submarine.js       # Controls & systems
        ├── creatures.js       # Fauna spawn & motion
        ├── landmarks.js       # Reefs, wrecks, vents, ruins…
        ├── particles.js       # Marine snow & sun rays
        ├── hud.js             # Telemetry & toasts
        ├── journal.js         # Discovery log
        ├── audio.js           # Ambience
        └── touch.js           # Mobile joysticks
```

---

## Deploy (GitHub Pages)

This repo deploys automatically on every push to `main` via GitHub Actions (`.github/workflows/deploy.yml`).

1. Repo **Settings → Pages → Build and deployment → Source:** **GitHub Actions**
2. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually)
3. Site URL: **https://temidayoxyz.github.io/abyss/**

`vite.config.js` sets `base: '/abyss/'` so assets resolve correctly on the project Pages URL.

---

## Design notes

- Tone: **peaceful, beautiful, eerie** — exploration and wonder, not combat.
- Branding: deep navy, phosphor teal, sonar amber; Outfit + IBM Plex Mono.
- Depth is the main progression: what you see and hear should feel different at 20 m vs 2,000 m.
- Battery and oxygen encourage thoughtful use of lights and sonar without punishing casual play.

---

## License

MIT — see [LICENSE](LICENSE) if present; otherwise free to use and modify with attribution appreciated.

---

<p align="center">
  <sub>Descend carefully. Chart what the charts forgot.</sub>
</p>
