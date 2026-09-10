#!/usr/bin/env node
// GrinKingdom data auditor.
// Validates the species catalog (src/data/), its illustrations
// (public/images/species/) and the family tree, then prints a coverage report.
// Exits non-zero on any hard failure so it can gate deploys.
//
//   npm run audit

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
const KINGDOMS = ['viruses', 'archaea', 'bacteria', 'protists', 'fungi', 'plants', 'animals', 'humans']
const IUCN_STATUSES = new Set([
  'Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered',
  'Extinct', 'Extinct in the Wild', 'Extinct (Presumed)', 'Not Evaluated', 'Not evaluated',
  'Data Deficient', 'Extinct in Captivity',
])
const HEX = /^#[0-9a-fA-F]{6}$/

let failures = 0
let warnings = 0
const fail = (msg) => { failures++; console.error('  ✗ ' + msg) }
const warn = (msg) => { warnings++; console.warn('  ⚠ ' + msg) }

const { SPECIES } = await import(path.join(ROOT, 'src/data/species.js'))
const { TREE_ROOT } = await import(path.join(ROOT, 'src/data/tree.js'))

console.log(`AUDIT: ${SPECIES.length} species loaded\n`)

/* ── 1. schema ─────────────────────────────────────────────── */
console.log('1) schema checks')
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const badFacts = (s) => !Array.isArray(s.facts) || s.facts.length < 3 || s.facts.some((f) => typeof f !== 'string' || !f.trim())
let schemaBad = 0
for (const s of SPECIES) {
  const problems = []
  const need = (v, label) => { if (typeof v !== 'string' || !v.trim()) problems.push(`missing ${label}`) }
  need(s.slug, 'slug'); need(s.name, 'name'); need(s.sci, 'sci'); need(s.emoji, 'emoji')
  need(s.kingdom, 'kingdom'); need(s.group, 'group'); need(s.tagline, 'tagline')
  need(s.habitat, 'habitat'); need(s.diet, 'diet'); need(s.status, 'status')
  need(s.size, 'size'); need(s.lifespan, 'lifespan')
  if (s.slug && !slugRe.test(s.slug)) problems.push(`bad slug "${s.slug}"`)
  if (s.kingdom && !KINGDOMS.includes(s.kingdom)) problems.push(`unknown kingdom "${s.kingdom}"`)
  if (s.status && !IUCN_STATUSES.has(s.status)) problems.push(`non-standard status "${s.status}"`)
  // emoji must be real characters: no control chars, no *bare* variation selector
  const graphemes = [...segmenter.segment(s.emoji || '')].map((x) => x.segment)
  if (s.emoji && graphemes.some((g) => g === '\ufe0f' || [...g].some((ch) => ch.charCodeAt(0) < 32))) problems.push(`broken emoji "${s.emoji}"`)
  if (!s.model || typeof s.model.shape !== 'string' || !s.model.shape) problems.push('missing model.shape')
  if (!Array.isArray(s.model?.colors) || s.model.colors.length !== 2 || s.model.colors.some((c) => !HEX.test(c))) problems.push('bad model.colors')
  const tax = s.taxonomy
  if (!tax || typeof tax !== 'object') problems.push('missing taxonomy')
  else {
    if (!tax.Kingdom) problems.push('taxonomy missing Kingdom')
    if (!tax.Genus) problems.push('taxonomy missing Genus')
    // genus must agree with the scientific name (viruses use ICTV genera — exempt)
    if (s.kingdom !== 'viruses' && tax.Genus && s.sci) {
      const sciGenus = s.sci.split(/\s+/).slice(0, 2).join(' ')
      const first = s.sci.split(/\s+/)[0]
      const isCandidatus = /^candidatus\s/i.test(s.sci)
      const expected = isCandidatus ? sciGenus : first
      if (tax.Genus.toLowerCase() !== expected.toLowerCase()) problems.push(`taxonomy genus "${tax.Genus}" ≠ sci name "${expected}"`)
    }
  }
  if (badFacts(s)) problems.push('missing/short facts')
  if (s.facts?.some((f) => f.includes('{name}'))) problems.push('unreplaced {name} placeholder')
  if (s.tagline && /  /.test(s.tagline)) problems.push('double space in tagline')
  if (problems.length) {
    schemaBad++
    if (schemaBad <= 10) fail(`${s.slug || s.name || '?'}: ${problems.join('; ')}`)
  }
}
if (schemaBad === 0) console.log('  ✓ all species pass schema checks')
else if (schemaBad > 10) fail(`...and ${schemaBad - 10} more species with schema problems`)

/* ── 2. uniqueness ─────────────────────────────────────────── */
console.log('2) uniqueness')
const countDupes = (key, lower = false) => {
  const seen = new Map()
  for (const s of SPECIES) {
    const k = lower ? s[key]?.toLowerCase() : s[key]
    if (!k) continue
    seen.set(k, (seen.get(k) || 0) + 1)
  }
  const dups = [...seen.entries()].filter(([, n]) => n > 1)
  for (const [k, n] of dups) fail(`duplicate ${key} "${k}" appears ${n}×`)
  return dups.length
}
let dups = 0
dups += countDupes('slug')
dups += countDupes('name', true)
dups += countDupes('sci', true)
if (dups === 0) console.log('  ✓ slugs, common names and scientific names are all unique')

/* ── 3. illustrations ──────────────────────────────────────── */
console.log('3) illustrations (public/images/species/)')
const imgDir = path.join(ROOT, 'public/images/species')
const svgs = new Set(fs.readdirSync(imgDir).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)))
const missing = SPECIES.filter((s) => !svgs.has(s.slug)).map((s) => s.slug)
for (const m of missing.slice(0, 10)) fail(`missing illustration: ${m}.svg`)
if (missing.length > 10) fail(`...and ${missing.length - 10} more missing illustrations`)
const orphans = [...svgs].filter((slug) => !SPECIES.some((s) => s.slug === slug))
for (const o of orphans.slice(0, 10)) fail(`orphaned illustration: ${o}.svg`)
if (orphans.length > 10) fail(`...and ${orphans.length - 10} more orphaned illustrations`)
if (!missing.length && !orphans.length) console.log(`  ✓ every species has exactly one illustration (${svgs.size} files)`)

/* ── 4. family tree ────────────────────────────────────────── */
console.log('4) family tree')
try {
  const tree = TREE_ROOT
  let leaves = 0
  let families = 0
  const walk = (n) => {
    if (n.leaf) { leaves++; return }
    if (n.rank === 'Family') families++
    n.children.forEach(walk)
  }
  tree.children.forEach(walk)
  if (leaves !== SPECIES.length) fail(`tree has ${leaves} species leaves, expected ${SPECIES.length}`)
  else console.log(`  ✓ tree contains all ${leaves} species`)
  console.log(`  · ${families} family-level branches`)
} catch (e) {
  fail(`tree build crashed: ${e.message}`)
}

/* ── 5. coverage report ────────────────────────────────────── */
console.log('\n5) coverage report')
const byKingdom = {}
for (const s of SPECIES) byKingdom[s.kingdom] = (byKingdom[s.kingdom] || 0) + 1
for (const k of KINGDOMS) console.log(`  · ${k.padEnd(10)} ${byKingdom[k] || 0}`)
console.log(`  · total      ${SPECIES.length}`)

/* ── verdict ───────────────────────────────────────────────── */
console.log('')
if (failures) { console.error(`AUDIT FAILED — ${failures} failure(s), ${warnings} warning(s)`); process.exit(1) }
console.log(`AUDIT OK — ${SPECIES.length} species, ${warnings} warning(s)`)
