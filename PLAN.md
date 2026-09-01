# 🦁 GrinKingdom — Project Plan
**An interactive encyclopedia of every kingdom of life — viruses to humans.**

> Repo: https://github.com/clickalex/GrinKingdom
> Status: PLANNING — no code written beyond initial scaffold (to be reviewed before build)

---

## 1. Vision & Goals

A playful, colorful, but genuinely informative website where visitors can:

- Explore **every kingdom of life** — Viruses, Archaea, Bacteria, Protists, Fungi, Plants, Animals, and Humans.
- Browse a **catalog** with search + filters (kingdom, habitat, diet, conservation status, fun category).
- Open rich **species detail pages** with taxonomy, quick facts, fun facts, and photos.
- **Rotate species in 3D** — an interactive 3D viewer (drag to spin/tilt/zoom).
- Reach species we haven't hand-curated via a **live search** against the global GBIF database (millions of species) — so nothing is ever "left out."

---

## 2. Tech Stack (chosen for easy GitHub + custom-domain hosting)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **React 18 + Vite** | Modern, fast, builds to plain static files |
| Routing | React Router | Clean URLs per species (`/species/tiger`) |
| Styling | Custom CSS (design tokens) | Full control over the playful look, no framework lock-in |
| 3D | **Three.js** (WebGL) | Real rotatable 3D scenes that run in any browser |
| Data | JSON modules | Easy to add species, no backend needed |
| Hosting | **GitHub Pages (now) → any host + custom domain (later)** | The same static build deploys everywhere |

✅ The build output is pure HTML/CSS/JS — it can live on GitHub Pages free today and move to paid hosting with your own domain later **without changing any code**.

---

## 3. Site Map (pages)

1. **Home** — hero, "kingdoms of life" overview strip, featured species, stats (how many species on Earth).
2. **Explore / Catalog** — search bar + filter chips (kingdom, habitat, diet, status), responsive card grid.
3. **Species Detail** (`/species/:slug`) — the centerpiece:
   - 3D rotatable viewer
   - Photo + name + "fun one-liner"
   - Quick facts (size, habitat, diet, lifespan, status)
   - Scientific classification (Domain → Kingdom → Phylum → … → Species)
   - "Did you know?" fun facts
   - Related species
4. **Kingdoms** — one landing page per kingdom (Viruses, Archaea, Bacteria, Protists, Fungi, Plants, Animals, Humans) with an intro + species list.
5. **3D Gallery** — a showcase page for the 3D models.
6. **About / Credits** — mission, data sources, image credits.

---

## 4. Content Plan — "don't leave any species out"

There are **~2 million described species** (estimates up to ~8.7M). No one hand-builds all of them. Our two-part strategy:

### A) Curated starter database (~60 species, every kingdom covered)
- **Viruses** (5): e.g. SARS-CoV-2, Influenza A, Bacteriophage T4, HIV, Tobacco mosaic virus
- **Archaea** (4): e.g. *Halobacterium*, *Methanobrevibacter*, *Pyrolobus fumarii*, *Thermococcus*
- **Bacteria** (5): e.g. *E. coli*, *Streptococcus*, cyanobacteria, *Lactobacillus*, *Deinococcus radiodurans*
- **Protists** (6): e.g. Amoeba, Paramecium, Euglena, malaria parasite (*Plasmodium*), kelp, slime mold
- **Fungi** (8): e.g. button mushroom, yeast, *Penicillium*, fly agaric, *Cordyceps*, truffle, lichen, mold
- **Plants** (12): e.g. oak, sunflower, venus flytrap, giant sequoia, bamboo, cacao, tulip, fern, cactus, orchid, redwood, wheat
- **Animals** (18): mammals, birds, reptiles, amphibians, fish, insects, arachnids, molluscs, crustaceans, corals, sponges, worms, etc.
- **Humans** (2): *Homo sapiens* + *Homo neanderthalensis*

Each entry: slug, common name, scientific name, kingdom, group, image, 3D scene id, quick facts, taxonomy, 3–5 fun facts.

### B) Live global search (GBIF API)
A "Search the full tree of life" bar that queries the GBIF species database (free, no key for basic use) and shows real species — scientific name, rank, kingdom — with a link to open it. This makes the site effectively cover **all described species**, while our curated pages shine for the famous ones.

---

## 5. The 3D Plan — honest reality-check ✅

You asked for "3D images so people can rotate." Here's what's actually possible:

- **True interactive 3D (real WebGL)** — YES. Visitors drag to rotate, tilt, and zoom. Runs smoothly in the browser.
- **Photoreal 3D scans of every species do NOT exist.** So we use **stylized, procedurally-built 3D scenes** instead — each species gets a themed 3D "specimen" that looks intentional and playful (e.g., a helix + capsid for a virus, a branching coral, a blob with a nucleus for an amoeba, a mushroom cap, a leaf, a big-cat body form).
- **Every species page gets a 3D viewer** — models are generated per species from a shared kit of parts + colors, so it scales to all ~60 species (and any added later) without hand-modeling each one.
- **Bonus:** a "photo tilt" hover effect on all cards (subtle pseudo-3D) so even non-3D pages feel dimensional.

This gives you a genuinely rotatable 3D experience on every page — just stylized, not photorealistic.

---

## 6. Design System — "Playful / Colorful"

- Bright, friendly palette (per-kingdom accent colors: virus = magenta, bacteria = teal, plants = green, animals = orange, fungi = purple, etc.)
- Rounded cards, chunky rounded typography, soft shadows, subtle bouncy animations
- A cute mascot (e.g., a friendly "globe of life") 
- Dark-mode-friendly + fully responsive (phone → desktop)
- Accessible: contrast, keyboard navigation, alt text

---

## 7. Data Architecture

```
species-kingdom/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── data/
│   │   ├── species.js        # curated database (all kingdoms)
│   │   └── kingdoms.js       # kingdom metadata + colors
│   ├── components/           # Navbar, Footer, SpeciesCard, SearchBar, FilterChips, ThreeDViewer
│   ├── pages/                # Home, Explore, SpeciesDetail, Kingdom, Gallery3D, About
│   └── styles/               # tokens.css + per-page css
```

Species are plain JSON-style objects — adding a new species = adding one object. No backend, no database server.

---

## 8. Deployment Plan

1. **Now (free):** push to your `GrinKingdom` GitHub repo → GitHub Pages hosts it at `clickalex.github.io/GrinKingdom`.
2. **Later:** buy a domain + hosting → same static `dist/` folder gets uploaded → set the DNS / CNAME. Zero code changes.
3. Optional: add a GitHub Actions workflow so every `git push` auto-deploys.

---

## 9. Milestones

| Phase | Deliverable |
|-------|-------------|
| 0 | ✅ Plan agreed (this document) |
| 1 | Scaffold + design system + site shell (nav/footer/theme) |
| 2 | Data layer: kingdoms + ~60 curated species |
| 3 | Home + Explore (search, filters, cards) |
| 4 | Species detail pages (facts, taxonomy, fun facts, related) |
| 5 | 3D viewer + 3D Gallery |
| 6 | GBIF live search ("full tree of life") |
| 7 | Polish: responsive, accessibility, SEO, images |
| 8 | Build + deploy to GitHub Pages |
| 9 | (Future) custom domain + hosting |

---

## 10. Open Questions for You

1. **Brand name** — the repo is "GrinKingdom." Should the site title be **"GrinKingdom"** or **"Species Kingdom"**?
2. **Images** — I'll source free/CC photos (e.g., from Wikimedia) for species. Fine?
3. **3D style** — proceed with stylized/procedural 3D models (as described in §5)?
4. **Deployment now vs. later** — build fully first, then connect GitHub? Or connect GitHub immediately so every milestone is committed?
