# 🛠️ GrinKingdom CLI (skeleton)

> **Status:** placeholder / work-in-progress — the folder and the local + CI workflow are
> in place. No runnable CLI code exists yet; commands below are the planned interface.

## Purpose

A small Node.js command-line toolkit for GrinKingdom, living at `cli/`. It automates
repetitive project chores and keeps the site's data healthy as we grow:

- Validate **kingdom + species data** (`src/data/`) against the project schema
- Produce quick **stats** (species per kingdom, coverage gaps)
- **Scaffold** new species entries / detail pages consistently
- Help seed the database with a **GBIF search** (planned milestone)
- Run local **build + Pages-prep checks** before pushing

## Planned layout

```
cli/
  README.md        ← this file (docs + local workflow)
  cli.mjs          ← (future) entrypoint: npm run cli -- <command>
  commands/        ← (future) one module per command
```

## Planned commands (not implemented yet)

```bash
npm run cli -- data:validate      # validate kingdoms + species data
npm run cli -- data:stats         # counts per kingdom / coverage report
npm run cli -- db:scaffold <name> # scaffold a new species entry
npm run cli -- db:gbif <query>    # fetch GBIF results to seed data (planned)
npm run cli -- build:check        # npm install + build + base-path sanity check
```

## Local workflow (once the CLI lands)

1. `npm install` (one-time)
2. `npm run cli -- data:validate` (or the command for the change you're making)
3. Review the CLI output; fix any data/schema issues
4. `npm run build` to confirm the site still builds
5. Commit and push — CI runs the same checks automatically

## CI workflow

`.github/workflows/cli.yml` runs on pushes to `main` and on pull requests. It is a
green placeholder today and will invoke the same CLI commands (validate → build) as
soon as `cli/cli.mjs` exists.

## Notes

- CLI must stay dependency-light; prefer Node built-ins + the packages already in `package.json`.
- Keep the CLI framework-agnostic (no React imports) so it can run in CI cheaply.
