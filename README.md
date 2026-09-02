# 🌍 GrinKingdom — The Species Kingdom

A playful, colorful encyclopedia of **every kingdom of life** — from viruses to humans.
Explore **1,000 species** with photos, fun facts, scientific classification, and an interactive
**rotatable 3D viewer** for every one of them.

---

## ✨ Features

- 🧭 **Explore** — a searchable, filterable catalog of 1,000 species with pagination & sorting
- 📄 **Species pages** — species photo, quick facts, taxonomy, fun facts, prev/next & related species
- 🧊 **3D viewer** — drag to rotate/tilt/zoom any species (Three.js), auto-rotating exhibits
- 📷 **Species photos** — every species gets its own generated specimen illustration (offline-safe SVG)
- 🌐 **Live tree-of-life search** — reach millions of described species via the GBIF API
- 🎨 Playful, colorful, fully responsive design

## 🧱 The 8 kingdoms

Viruses 🦠 · Archaea 🌋 · Bacteria 🧫 · Protists 🫧 · Fungi 🍄 · Plants 🌱 · Animals 🐘 · Humans 🧬

---

## 🛠 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite 5 |
| Routing | React Router (hash routing, works on any static host) |
| 3D | Three.js (WebGL) |
| Data | JS modules (no backend) — 48 hand-curated + 952 generated species |
| Images | Generated SVG specimen plates (no external hotlinks) |
| Hosting | GitHub Pages now → any host + custom domain later |

---

## 🚀 Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in ./dist
npm run preview    # preview the production build
```

### Regenerating the species database & illustrations

The 952 generated species live in `scripts/seeds/` (species lists + group configs + fact banks).
To rebuild `src/data/species-extra.js` and the 1,000 SVG specimen plates in `public/images/species/`:

```bash
npm run gen
```

---

## 🌐 Deploy to GitHub Pages (manual, no CLI needed)

> The repo is set up for you to do this manually in the browser. Steps:

### One-time setup
1. Go to **Settings → Pages** on the `GrinKingdom` repo.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. (Optional) add your custom domain later in the same page.

### Every update
1. Push your changes to the `main` branch (the included workflow deploys automatically), **or**:
2. Go to the **Actions** tab → **"Deploy to GitHub Pages"** → **Run workflow**.

The site will appear at: **`https://clickalex.github.io/GrinKingdom/`**

### Custom domain later
1. Buy a domain, add it in **Settings → Pages → Custom domain** (this adds a `CNAME`).
2. Set a `CNAME` DNS record at your registrar pointing to `clickalex.github.io`.
3. Change `BASE_PATH: /GrinKingdom/` to `BASE_PATH: /` in `.github/workflows/deploy.yml`.

---

## 📁 Structure

```
src/
├── data/            # kingdoms + species database (curated + generated)
├── components/      # Navbar, Footer, cards, 3D viewer, ...
├── pages/           # Home, Explore, Species, Kingdom, 3D Gallery, About
├── three/           # procedural 3D specimen builders (Three.js)
└── styles/          # global design system
scripts/
├── seeds/           # species seed lists, group configs, fact banks
├── gen-species.mjs  # data + SVG specimen generator (npm run gen)
└── smoke-ssr.mjs    # server-render smoke test for every page & species
public/images/species/  # 1,000 generated specimen illustrations
```

## 🙏 Data & credits

- Live species search powered by the [GBIF API](https://www.gbif.org/) (free).
- Illustrations are original, generated for this project (no external image hotlinks).

---

*Made with 🌍 + ❤️. Repo: [clickalex/GrinKingdom](https://github.com/clickalex/GrinKingdom)*
