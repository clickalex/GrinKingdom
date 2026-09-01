# 🤝 Handoff Brief — new chat: "Connect GitHub + create the PR"

> Copy the block under **"THE PROMPT"** into a new chat. It gives that session's
> assistant everything it needs to connect to your GitHub and open the Pull Request.

---

## What already exists (built in a previous session)

- **Project:** `GrinKingdom` ("Species Kingdom") — a playful, colorful encyclopedia of
  all 8 kingdoms of life. React 18 + Vite, GitHub Pages deploy workflow.
- **What's built so far:**
  - Milestone 0 — project plan (`PLAN.md`)
  - Milestone 1 — site scaffold: design system, navbar/footer, SVG mascot, homepage,
    kingdom data (`src/data/kingdoms.js`), placeholder pages, GitHub Actions deploy workflow.
- **Git state:** 2 commits on branch `main`, remote `origin` → `https://github.com/clickalex/GrinKingdom.git`
- **Workspace path:** `/home/user/GrinKingdom`
- **Backup zip (in case the workspace doesn't carry over):** `/home/user/GrinKingdom.zip`
  (includes `.git` history; `node_modules`/`dist` excluded)

## THE PROMPT (copy this into the new chat)

---

You are continuing a project called **GrinKingdom** ("Species Kingdom") — a playful,
colorful encyclopedia website covering every kingdom of life (viruses, archaea, bacteria,
protists, fungi, plants, animals, humans). It is a React 18 + Vite app with a GitHub Pages
deploy workflow already included.

**GitHub repo:** `https://github.com/clickalex/GrinKingdom` (owner `clickalex`, repo
`GrinKingdom`, default branch `main`).

**Your job:**
1. Connect to my GitHub. I'll provide a fine-grained Personal Access Token (repo-scoped,
   Contents = Read & write). Use it to authenticate to the repo `clickalex/GrinKingdom`
   (via the GitHub API or `gh auth login`, or by putting the token in the push URL —
   whichever you prefer; do not print the token).
2. Find the project code:
   - First check whether `/home/user/GrinKingdom` already exists in your workspace with a
     `.git` folder. If it does, use it.
   - Otherwise use the uploaded file `GrinKingdom.zip`. Unzip it to `/home/user/GrinKingdom`.
     It contains the full git history (2 commits on `main`) and all source files.
3. Prepare git: set `user.name "clickalex"`, `user.email "clickalex@users.noreply.github.com"`,
   and ensure the remote is `https://github.com/clickalex/GrinKingdom.git`. If the zip had no
   usable `.git`, `git init`, then commit everything fresh.
4. Create a feature branch from `main` named `feature/grinkingdom-v1`, ensure all work is
   committed on it, then push it to GitHub (`git push -u origin feature/grinkingdom-v1`).
   If `main` on GitHub is empty (no commits), push `main` first.
5. Verify the app still builds before pushing: `npm install` then `npm run build`
   (from `/home/user/GrinKingdom`). Fix nothing unless the build fails.
6. Open a **Pull Request** from `feature/grinkingdom-v1` → `main` using the GitHub API or
   `gh pr create`, with:
   - **Title:** `GrinKingdom v1 — plan, site shell + homepage`
   - **Body:** (see the suggested PR description below)
7. Do **NOT** merge the PR yourself. Report back with the PR URL and a short summary.

**Important context:**
- The repo already contains `.github/workflows/deploy.yml`, which auto-deploys to GitHub
  Pages on push to `main` (base path `/GrinKingdom/`, handled in `vite.config.js`). Keep it.
- Later we'll add more milestones in follow-up PRs: the species database, the Explore
  catalog with search/filters, species detail pages, the Three.js 3D viewer, and a live
  GBIF "tree of life" search.

---

**Suggested PR description:**

```
## 🌍 GrinKingdom — v1: plan, site shell + homepage

First PR for GrinKingdom ("The Species Kingdom"), a playful encyclopedia of every
kingdom of life.

### Included
- **Milestone 0** — project plan (`PLAN.md`)
- **Milestone 1** — site scaffold:
  - Playful design system (custom CSS tokens, rounded cards, gradients, animations)
  - Sticky navbar + footer with links to all 8 kingdoms
  - Custom SVG mascot ("grinning globe of life")
  - Homepage: hero, stats, "8 kingdoms of life" grid with hover-tilt cards,
    "how it works", CTA band
  - Kingdom metadata for all 8 kingdoms (viruses, archaea, bacteria, protists,
    fungi, plants, animals, humans)
  - React Router shell + placeholder pages (Explore, Species, Kingdom, 3D Gallery, About, 404)
- **Deploy pipeline** — GitHub Actions workflow auto-deploys to GitHub Pages on push to `main`

### Tech
React 18 · Vite 5 · React Router 6 (hash routing) · Three.js (coming in a later PR)

### Up next (future PRs)
Species database (~60 species) · Explore catalog (search + filters) · Species detail
pages · rotatable 3D viewer · live GBIF tree-of-life search

### How to test
`npm install && npm run dev` → http://localhost:5173
```

---

## What I (the user) do in the new chat

1. Start a new chat.
2. Paste the prompt above.
3. If the workspace didn't carry over, upload `/home/user/GrinKingdom.zip` (in this
   workspace) into that chat.
4. When the assistant asks for the token, paste a fine-grained PAT scoped to
   `clickalex/GrinKingdom` with **Contents: Read & write**.
5. Review the PR it opens (do not auto-merge without checking).
