#!/usr/bin/env node
// SSR smoke test: renders the app's pages to HTML strings (no browser needed).
// Catches runtime crashes from bad data (undefined fields etc.) before deploy.
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const vite = await createServer({ server: { middlewareMode: true }, logLevel: 'error' })

const { SPECIES } = await vite.ssrLoadModule('/src/data/species.js')

const render = (jsx, initial = ['/'], routePath = '*') =>
  renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: initial },
      React.createElement(Routes, null, React.createElement(Route, { path: routePath, element: jsx }))
    )
  )
const ok = (name, fn) => {
  try {
    const out = fn()
    console.log(`  ✓ ${name} (${(out.length / 1024).toFixed(0)} KB html)`)
    return out
  } catch (e) {
    console.error(`  ✗ ${name}:`, e.message)
    process.exitCode = 1
  }
}

console.log(`SMOKE: ${SPECIES.length} species loaded`)

const { default: Home } = await vite.ssrLoadModule('/src/pages/Home.jsx')
const { default: Explore } = await vite.ssrLoadModule('/src/pages/Explore.jsx')
const { default: SpeciesDetail } = await vite.ssrLoadModule('/src/pages/SpeciesDetail.jsx')
const { default: KingdomPage } = await vite.ssrLoadModule('/src/pages/KingdomPage.jsx')
const { default: Gallery3D } = await vite.ssrLoadModule('/src/pages/Gallery3D.jsx')
const { default: FamilyTree } = await vite.ssrLoadModule('/src/pages/FamilyTree.jsx')

// App root skipped: HashRouter needs window/document (browser-only) — pages below cover the surface.
ok('Home', () => render(React.createElement(Home), ['/']))
ok('Explore', () => render(React.createElement(Explore), ['/explore']))
ok('KingdomPage /kingdom/animals', () => render(React.createElement(KingdomPage), ['/kingdom/animals'], '/kingdom/:kingdomId'))
ok('KingdomPage /kingdom/viruses', () => render(React.createElement(KingdomPage), ['/kingdom/viruses'], '/kingdom/:kingdomId'))
ok('KingdomPage /kingdom/unknown', () => render(React.createElement(KingdomPage), ['/kingdom/nope'], '/kingdom/:kingdomId'))
ok('Gallery3D', () => render(React.createElement(Gallery3D), ['/3d-gallery']))
ok('FamilyTree', () => render(React.createElement(FamilyTree), ['/family-tree']))

// every species detail page renders (spot check a spread + full sweep of heads)
const slugs = ['tiger', 'sars-cov-2', 'mers-cov', 'e-coli', 'homo-erectus', 'lion', 'fly-agaric', 'giant-kelp', 'tardigrade', 'nope-does-not-exist']
for (const slug of slugs) ok(`SpeciesDetail /species/${slug}`, () => render(React.createElement(SpeciesDetail), [`/species/${slug}`], '/species/:slug'))

// full sweep: detail pages for ALL species must not throw
let bad = 0
for (const s of SPECIES) {
  try { render(React.createElement(SpeciesDetail), [`/species/${s.slug}`], '/species/:slug') } catch (e) { bad++; console.error(`  ✗ /species/${s.slug}: ${e.message}`) }
}
if (bad) { console.error(`FULL SWEEP: ${bad} species detail pages crashed`); process.exitCode = 1 }
else console.log(`  ✓ full sweep: all ${SPECIES.length} species detail pages render`)

await vite.close()
console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK')
