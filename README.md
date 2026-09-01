# 🌍 GrinKingdom — The Species Kingdom

A playful, colorful encyclopedia of **every kingdom of life** — from viruses to humans.
Explore species with photos, fun facts, scientific classification, and an interactive
**rotatable 3D viewer**.

> **Status:** early development. Homepage + site shell live; catalog, detail pages and 3D next.

---

## ✨ What's planned

- 🔍 **Explore** — searchable, filterable catalog across all 8 kingdoms
- 📄 **Species pages** — quick facts, taxonomy, fun facts, related species
- 🧊 **3D viewer** — drag to rotate/tilt/zoom any species (Three.js)
- 🌐 **Live tree-of-life search** — reach millions of species via the GBIF API
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
| Data | JSON modules (no backend) |
| Hosting | GitHub Pages now → any host + custom domain later |

---

## 🚀 Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in ./dist
npm run preview    # preview the production build
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
├── data/          # kingdoms + species database
├── components/    # Navbar, Footer, cards, 3D viewer, ...
├── pages/         # Home, Explore, Species, Kingdom, 3D Gallery, About
└── styles/        # global design system
```

## 🙏 Data & credits

- Live species search powered by the [GBIF API](https://www.gbif.org/) (free).
- Illustrations are original, generated for this project.

---

*Made with 🌍 + ❤️. Repo: [clickalex/GrinKingdom](https://github.com/clickalex/GrinKingdom)*
