#!/usr/bin/env node
// GrinKingdom species generator.
// Reads the curated species + seed lists and emits:
//   src/data/species-extra.js          — the generated species (EXTRA_SPECIES)
//   public/images/species/<slug>.svg   — one unique specimen illustration per species
//
// Selection rule: every seed group gets its first row (full group coverage),
// then each kingdom tops up to its quota with remaining rows in file order.
// 952 generated + 48 curated = exactly 1,000 species.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CURATED } from '../src/data/species-curated.js'
import { GROUPS } from './seeds/groups.js'
import { FACT_BANKS, GENERIC, TAGLINES, PROFILE } from './seeds/facts.js'
import { VIRUS_ROWS } from './seeds/species-viruses.js'
import { ARCHAEA_ROWS } from './seeds/species-archaea.js'
import { BACTERIA_ROWS } from './seeds/species-bacteria.js'
import { PROTIST_ROWS } from './seeds/species-protists.js'
import { FUNGI_ROWS } from './seeds/species-fungi.js'
import { PLANT_ROWS } from './seeds/species-plants.js'
import { ANIMALS_A_ROWS } from './seeds/species-animals-a.js'
import { ANIMALS_B_ROWS } from './seeds/species-animals-b.js'
import { ANIMALS_C_ROWS } from './seeds/species-animals-c.js'
import { HUMAN_ROWS } from './seeds/species-humans.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const KINGDOM_QUOTA = { viruses: 52, archaea: 28, bacteria: 60, protists: 48, fungi: 93, plants: 134, animals: 530, humans: 7 }
const KINGDOM_DEFAULT_STATUS = { viruses: 'Not evaluated', archaea: 'Not evaluated', bacteria: 'Not evaluated', protists: 'Not evaluated', fungi: 'Not evaluated', plants: 'Least Concern', animals: 'Least Concern', humans: 'Extinct' }
const KINGDOM_TAXON = { viruses: 'Virus', archaea: 'Archaea', bacteria: 'Bacteria', protists: 'Protista', fungi: 'Fungi', plants: 'Plantae', animals: 'Animalia', humans: 'Animalia' }
const SIZE_FALLBACK = {
  viruses: ['~100 nanometres across', 'Hours to days outside a host'],
  archaea: ['0.5–3 micrometres per cell', 'Colonies persist for years'],
  bacteria: ['1–3 micrometres per cell', 'Divides every 20–60 minutes'],
  protists: ['Micrometres to millimetres', 'Days per generation'],
  fungi: ['Millimetres to centimetres', 'Days to weeks per fruiting body'],
  plants: ['Centimetres to tens of metres', 'Years to millennia'],
  animals: ['Centimetres to metres', 'Varies by species'],
  humans: ['1.2–1.8 m tall', 'Roughly 30–70 years'],
}

/* deterministic PRNG */
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

/* ───────────── taxonomy building ───────────── */
/* Real ICTV genus names for well-known viruses, keyed by seed sci name. */
const VIRUS_GENUS = {
  'Middle East respiratory syndrome coronavirus': 'Betacoronavirus',
  'Human coronavirus 229E': 'Alphacoronavirus',
  'Human coronavirus NL63': 'Alphacoronavirus',
  'Human coronavirus HKU1': 'Betacoronavirus',
  'Murine coronavirus': 'Betacoronavirus',
  'Betainfluenzavirus influenzae': 'Betainfluenzavirus',
  'Gammainfluenzavirus influenzae': 'Gammainfluenzavirus',
  'Deltainfluenzavirus influenzae': 'Deltainfluenzavirus',
  'Morbillivirus hominis': 'Morbillivirus',
  'Mumps orthorubulavirus': 'Orthorubulavirus',
  'Human orthopneumovirus': 'Orthopneumovirus',
  'Nipah henipavirus': 'Henipavirus',
  'Orthoebolavirus zairense': 'Orthoebolavirus',
  'Orthoebolavirus restonense': 'Orthoebolavirus',
  'Orthomarburgvirus marburgense': 'Orthomarburgvirus',
  'Lyssavirus rabies': 'Lyssavirus',
  'Vesiculovirus indiana': 'Vesiculovirus',
  'Dengue virus': 'Flavivirus',
  'Zika virus': 'Flavivirus',
  'Yellow fever virus': 'Flavivirus',
  'West Nile virus': 'Flavivirus',
  'Hepacivirus hominis': 'Hepacivirus',
  'Enterovirus C': 'Enterovirus',
  'Rhinovirus A': 'Rhinovirus',
  'Hepatovirus ahepa': 'Hepatovirus',
  'Foot-and-mouth disease virus': 'Aphthovirus',
  'Norwalk virus': 'Norovirus',
  'Sapporo virus': 'Sapovirus',
  'Rotavirus A': 'Rotavirus',
  'Bluetongue virus': 'Orbivirus',
  'Human alphaherpesvirus 1': 'Simplexvirus',
  'Human alphaherpesvirus 2': 'Simplexvirus',
  'Human alphaherpesvirus 3': 'Varicellovirus',
  'Human gammaherpesvirus 4': 'Lymphocryptovirus',
  'Human betaherpesvirus 5': 'Cytomegalovirus',
  'Variola virus': 'Orthopoxvirus',
  'Vaccinia virus': 'Orthopoxvirus',
  'Cowpox virus': 'Orthopoxvirus',
  'Monkeypox virus': 'Orthopoxvirus',
  'Human adenovirus C': 'Mastadenovirus',
  'Human papillomavirus 16': 'Alphapapillomavirus',
  'Primate erythroparvovirus 1': 'Erythroparvovirus',
  'Carnivore protoparvovirus 1': 'Protoparvovirus',
  'Hepatitis B virus': 'Orthohepadnavirus',
  'Human immunodeficiency virus 2': 'Lentivirus',
  'Simian immunodeficiency virus': 'Lentivirus',
  'Primate T-lymphotropic virus 1': 'Deltaretrovirus',
  'Hantaan orthohantavirus': 'Orthohantavirus',
  'Crimean-Congo hemorrhagic fever virus': 'Orthonairovirus',
  'Rift Valley fever phlebovirus': 'Phlebovirus',
  'Lassa mammarenavirus': 'Mammarenavirus',
  'Lymphocytic choriomeningitis virus': 'Mammarenavirus',
  'Escherichia virus T2': 'Tequatrovirus',
  'Escherichia virus P1': 'Punavirus',
  'Escherichia virus Lambda': 'Lambdavirus',
  'Escherichia virus T7': 'Teseptimavirus',
  'Escherichia virus M13': 'Inovirus',
  'Escherichia virus phiX174': 'Sinsheimervirus',
  'Escherichia virus MS2': 'Emesvirus',
  'Mimivirus bradfordmassiliense': 'Mimivirus',
  'Pandoravirus dulcis': 'Pandoravirus',
  'Pithovirus sibericum': 'Pithovirus',
  'Tobacco rattle virus': 'Tobravirus',
  'Potyvirus plumpoxi': 'Potyvirus',
  'Cauliflower mosaic virus': 'Caulimovirus',
  'Maize streak virus': 'Mastrevirus',
  'Cucumber mosaic virus': 'Cucumovirus',
  'Tymovirus brassicae': 'Tymovirus',
  'Orthotospovirus tomatomaculae': 'Orthotospovirus',
  'Luteovirus pavhordei': 'Luteovirus',
  'Potato virus X': 'Potexvirus',
  'Potato spindle tuber viroid': 'Pospiviroid',
}
function virusGenus(sci) {
  if (VIRUS_GENUS[sci]) return VIRUS_GENUS[sci]
  const words = sci.replace(/[;,:].*$/, '').trim().split(/\s+/)
  const idx = words.findLastIndex((w) => /virus/i.test(w))
  if (idx > 0) {
    const base = (words[idx].toLowerCase() === 'virus' ? [words[idx - 1], words[idx]] : [words[idx]]).join(' ')
    return base.split(/\s+/).map(cap).join(' ')
  }
  return words[0]
}

/* Bacteriological family stem: Escherichia → Escherichi- (+ aceae). */
function familyStem(genusRaw) {
  let g = genusRaw.replace(/^candidatus\s+/i, '')
  return g.replace(/(a|um|us|is|er|on)$/i, (m) => (m.toLowerCase() === 'er' || m.toLowerCase() === 'on' ? m : '')) + 'aceae'
}
function buildTaxonomy(group, kingdom, sci) {
  const t = group.tax || {}
  const isCandidatus = /^candidatus\s/i.test(sci)
  const genusRaw = isCandidatus ? sci.split(/\s+/).slice(0, 2).join(' ') : sci.split(/\s+/)[0]
  const epithet = sci.slice(genusRaw.length).trim()
  const species = sci
  const abbrev = isCandidatus
    ? `Ca. ${genusRaw.split(/\s+/)[1][0].toUpperCase()}.`
    : genusRaw.split(/\s+/).map((w) => w[0].toUpperCase() + '.').join(' ')
  const speciesShort = epithet ? `${abbrev} ${epithet}` : genusRaw
  if (t.realm) {
    return {
      Realm: t.realm, Kingdom: t.k, Phylum: t.p, Order: t.o, Family: t.f,
      Genus: virusGenus(sci), Species: species,
    }
  }
  if (t.o && t.f) {
    return {
      Domain: 'Eukaryota', Kingdom: KINGDOM_TAXON[kingdom], Phylum: t.p, Class: t.c, Order: t.o, Family: t.f,
      Genus: genusRaw, Species: speciesShort,
    }
  }
  return {
    Domain: KINGDOM_TAXON[kingdom] === 'Archaea' ? 'Archaea' : 'Bacteria',
    Kingdom: KINGDOM_TAXON[kingdom], Phylum: t.p, Class: t.c, Order: t.o,
    Family: cap(familyStem(genusRaw)), Genus: genusRaw, Species: speciesShort,
  }
}

/* ───────────── species assembly ───────────── */
const ALL_ROWS = [
  ...VIRUS_ROWS, ...ARCHAEA_ROWS, ...BACTERIA_ROWS, ...PROTIST_ROWS,
  ...FUNGI_ROWS, ...PLANT_ROWS, ...ANIMALS_A_ROWS, ...ANIMALS_B_ROWS, ...ANIMALS_C_ROWS, ...HUMAN_ROWS,
]

function selectRows() {
  const perKingdom = {}
  for (const row of ALL_ROWS) {
    const g = GROUPS[row[0]]
    if (!g) throw new Error(`unknown group key "${row[0]}"`)
    ;(perKingdom[g.k] ||= []).push({ row, group: g })
  }
  const out = []
  for (const [k, quota] of Object.entries(KINGDOM_QUOTA)) {
    const list = perKingdom[k] || []
    const seen = new Set()
    const picked = []
    for (const item of list) if (!seen.has(item.row[0])) { picked.push(item); seen.add(item.row[0]) }
    for (const item of list) if (!picked.includes(item) && picked.length < quota) picked.push(item)
    if (picked.length < quota) console.warn(`[gen] kingdom ${k}: only ${picked.length}/${quota} rows available`)
    out.push(...picked)
  }
  return out
}

function buildSpecies(items) {
  const usedSlugs = new Set(CURATED.map((s) => s.slug))
  const groupCount = {}
  const out = []
  for (const { row, group } of items) {
    const [gkey, name, sci, emoji, tagline, status, size, lifespan] = row
    let slug = slugify(name)
    if (usedSlugs.has(slug) || out.some((s) => s.slug === slug)) slug = `${slug}-2`
    usedSlugs.add(slug)
    const i = groupCount[gkey] || 0
    groupCount[gkey] = i + 1
    const kingdom = group.k
    const seed = hash(slug)
    const bank = FACT_BANKS[group.facts]
    const facts = []
    const source = bank && bank.length ? bank : GENERIC[kingdom]
    for (let n = 0; n < 3; n++) facts.push((source[n % source.length] || GENERIC[kingdom][n % 3]).replaceAll('{name}', name))
    const profile = PROFILE[group.facts]
    out.push({
      slug,
      name,
      sci,
      kingdom,
      group: group.label,
      emoji,
      tex: group.tex,
      tagline: tagline || TAGLINES[kingdom][seed % TAGLINES[kingdom].length],
      habitat: group.hab,
      diet: group.diet,
      status: status || KINGDOM_DEFAULT_STATUS[kingdom],
      size: size || profile?.[0] || SIZE_FALLBACK[kingdom][0],
      lifespan: lifespan || profile?.[1] || SIZE_FALLBACK[kingdom][1],
      taxonomy: buildTaxonomy(group, kingdom, sci),
      facts,
      model: { shape: group.shape, colors: group.pal[i % group.pal.length] },
    })
  }
  return out
}

/* ═══════════════════════ SVG specimen art ═══════════════════════ */

const S = 600, W = 600, H = 420

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + amt)
  const g = Math.min(255, ((n >> 8) & 255) + amt)
  const b = Math.min(255, (n & 255) + amt)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
const mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t)
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t)
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t)
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`
}

const TEX_DEFS = {
  stripes: (c, id) => `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><rect width="26" height="26" fill="none"/><rect width="26" height="9" fill="${c}" opacity="0.5"/></pattern>`,
  spots: (c, id) => `<pattern id="${id}" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="none"/><circle cx="12" cy="12" r="6.5" fill="${c}" opacity="0.55"/><circle cx="36" cy="34" r="5" fill="${c}" opacity="0.5"/></pattern>`,
  dots: (c, id) => `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="none"/><circle cx="6" cy="6" r="2.6" fill="${c}" opacity="0.6"/><circle cx="18" cy="18" r="2.6" fill="${c}" opacity="0.6"/></pattern>`,
  scales: (c, id) => `<pattern id="${id}" width="22" height="26" patternUnits="userSpaceOnUse"><rect width="22" height="26" fill="none"/><path d="M11 2 a9 9 0 0 1 9 9 h-18 a9 9 0 0 1 9-9z" fill="${c}" opacity="0.4" transform="translate(0,6)"/><path d="M11 2 a9 9 0 0 1 9 9 h-18 a9 9 0 0 1 9-9z" fill="${c}" opacity="0.4" transform="translate(0,-6)"/></pattern>`,
  feather: (c, id) => `<pattern id="${id}" width="30" height="16" patternUnits="userSpaceOnUse"><rect width="30" height="16" fill="none"/><path d="M3 8 q7 -6 12 0 q7 -6 12 0" stroke="${c}" stroke-width="2.4" fill="none" opacity="0.5"/></pattern>`,
  vein: (c, id) => `<pattern id="${id}" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="36" height="36" fill="none"/><path d="M2 34 Q18 18 34 2" stroke="${c}" stroke-width="1.6" fill="none" opacity="0.5"/><path d="M12 34 Q20 24 28 14" stroke="${c}" stroke-width="1.2" fill="none" opacity="0.4"/></pattern>`,
  fur: (c, id) => `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="none"/><path d="M3 11 L3 5 M8 11 L8 4 M13 11 L13 6" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity="0.45"/></pattern>`,
  fuzz: (c, id) => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="none"/><circle cx="3" cy="3" r="1.1" fill="${c}" opacity="0.5"/><circle cx="8" cy="7" r="1.1" fill="${c}" opacity="0.5"/></pattern>`,
  wet: (c, id) => `<pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="none"/><ellipse cx="18" cy="16" rx="9" ry="4" fill="#ffffff" opacity="0.35" transform="rotate(-18 18 16)"/><ellipse cx="48" cy="46" rx="8" ry="3.4" fill="#ffffff" opacity="0.28" transform="rotate(-18 48 46)"/></pattern>`,
  glow: (c, id) => `<pattern id="${id}" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="none"/><circle cx="12" cy="12" r="5" fill="${c}" opacity="0.85"/><circle cx="36" cy="34" r="4" fill="${c}" opacity="0.7"/><circle cx="12" cy="12" r="10" fill="${c}" opacity="0.25"/></pattern>`,
  stone: (c, id) => `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="none"/><path d="M6 8 L14 6 L12 14 M26 20 L34 18 L32 28 M16 30 L24 28 L22 38" stroke="${c}" stroke-width="1.6" fill="none" opacity="0.4"/></pattern>`,
  bumpy: (c, id) => `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="none"/><circle cx="6" cy="6" r="3.2" fill="${c}" opacity="0.45"/><circle cx="16" cy="15" r="2.6" fill="${c}" opacity="0.4"/></pattern>`,
  smooth: (c, id) => `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="none"/></pattern>`,
}

/* body painters: each returns inner SVG markup for a shape */
function paint(shape, ctx) {
  const { c1, c2, r } = ctx
  const J = (n, m) => r() * (m - n) + n
  const g1 = `url(#bg1)`, g2 = `url(#bg2)`, g3 = `url(#bg3)`
  switch (shape) {
    case 'virus': {
      const spikes = 22
      let s = ''
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2 + J(-0.2, 0.2)
        s += `<line x1="${150 + Math.cos(a) * 62}" y1="${150 + Math.sin(a) * 62}" x2="${150 + Math.cos(a) * 86}" y2="${150 + Math.sin(a) * 86}" stroke="${c1}" stroke-width="7" stroke-linecap="round" opacity="0.85"/>`
      }
      s += `<circle cx="150" cy="150" r="62" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<circle cx="150" cy="150" r="62" fill="${'url(#tx)'}"/>`
      s += `<circle cx="128" cy="126" r="14" fill="#ffffff" opacity="0.3"/>`
      return s
    }
    case 'phage': {
      let s = `<polygon points="150,78 208,112 186,168 114,168 92,112" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<rect x="140" y="168" width="20" height="58" fill="${g2}" stroke="${c1}" stroke-width="2.5"/>`
      s += `<line x1="150" y1="226" x2="150" y2="292" stroke="${c1}" stroke-width="4" stroke-linecap="round"/>`
      for (let i = -1; i <= 1; i++) {
        s += `<line x1="150" y1="268" x2="${150 + i * 26}" y2="292" stroke="${c1}" stroke-width="3.4" stroke-linecap="round"/>`
      }
      s += `<rect x="144" y="226" width="12" height="8" fill="${c1}"/>`
      s += `<circle cx="136" cy="124" r="4" fill="#ffffff" opacity="0.5"/><circle cx="164" cy="132" r="3" fill="#ffffff" opacity="0.5"/>`
      return s
    }
    case 'helixRod': {
      let s = `<rect x="40" y="118" width="220" height="64" rx="32" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      for (let i = 0; i < 7; i++) s += `<path d="M${54 + i * 30} 150 q15 -26 30 0" stroke="${c2}" stroke-width="7" fill="none" opacity="0.55"/>`
      s += `<rect x="40" y="118" width="220" height="64" rx="32" fill="${'url(#tx)'}"/>`
      return s
    }
    case 'bullet': {
      let s = `<path d="M52 150 L198 116 L198 184 Z" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
      s += `<rect x="198" y="116" width="56" height="68" rx="16" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<rect x="198" y="116" width="56" height="68" rx="16" fill="${'url(#tx)'}"/>`
      return s
    }
    case 'brick': return `<rect x="80" y="112" width="140" height="76" rx="26" fill="${g1}" stroke="${c1}" stroke-width="3"/><rect x="80" y="112" width="140" height="76" rx="26" fill="${'url(#tx)'}"/><circle cx="130" cy="132" r="8" fill="#fff" opacity="0.25"/>`
    case 'square': return `<rect x="104" y="104" width="92" height="92" rx="14" fill="${g1}" stroke="${c1}" stroke-width="3"/><rect x="104" y="104" width="92" height="92" rx="14" fill="${'url(#tx)'}"/><circle cx="132" cy="132" r="6" fill="#fff" opacity="0.3"/>`
    case 'twin': return `<circle cx="124" cy="150" r="42" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="176" cy="150" r="42" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="124" cy="150" r="42" fill="${'url(#tx)'}"/><circle cx="176" cy="150" r="42" fill="${'url(#tx)'}"/>`
    case 'chain': {
      let s = ''
      for (let i = 0; i < 5; i++) s += `<circle cx="${70 + i * 42}" cy="150" r="26" fill="${i % 2 ? g2 : g1}" stroke="${c1}" stroke-width="3"/>`
      return s
    }
    case 'spiral': return `<path d="M60 150 q40 -70 90 0 q50 70 90 0" stroke="${c1}" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.95"/><path d="M60 150 q40 -70 90 0 q50 70 90 0" stroke="${c2}" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.25" stroke-dasharray="10 26"/>`
    case 'rod': case 'rodFlagella': {
      let s = `<rect x="52" y="122" width="196" height="56" rx="28" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<rect x="52" y="122" width="196" height="56" rx="28" fill="${'url(#tx)'}"/>`
      if (shape === 'rodFlagella') {
        for (const dx of [-1, 1]) s += `<path d="M${150} 178 q${dx * 40} 46 ${dx * 90} 30" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      }
      return s
    }
    case 'coccus': case 'square': return `<circle cx="150" cy="150" r="62" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="150" cy="150" r="62" fill="${'url(#tx)'}"/><circle cx="126" cy="126" r="15" fill="#ffffff" opacity="0.32"/>`
    case 'amoeba': case 'slimeMold': {
      const pts = []
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        const rad = J(38, 74)
        pts.push(`${150 + Math.cos(a) * rad},${150 + Math.sin(a) * rad}`)
      }
      let d = `M${pts[0]}`
      for (let i = 1; i < pts.length; i++) { const [x1, y1] = pts[i - 1].split(','), [x2, y2] = pts[i].split(','); d += ` Q${( +x1 + +x2) / 2 + J(-16, 16)},${(+y1 + +y2) / 2 + J(-16, 16)} ${x2},${y2}` }
      d += ' Z'
      let s = `<path d="${d}" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<path d="${d}" fill="${'url(#tx)'}"/>`
      s += `<circle cx="${150 + J(-10, 10)}" cy="${150 + J(-10, 10)}" r="13" fill="${c2}" opacity="0.8"/>`
      s += `<circle cx="${120 + J(-8, 8)}" cy="${120 + J(-8, 8)}" r="5" fill="#ffffff" opacity="0.5"/>`
      return s
    }
    case 'ciliate': {
      let s = `<ellipse cx="150" cy="150" rx="66" ry="48" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<ellipse cx="150" cy="150" rx="66" ry="48" fill="${'url(#tx)'}"/>`
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2
        const x = 150 + Math.cos(a) * 66, y = 150 + Math.sin(a) * 48
        s += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * 12}" y2="${y + Math.sin(a) * 12}" stroke="${c1}" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>`
      }
      s += `<circle cx="132" cy="136" r="9" fill="${c2}" opacity="0.9"/>`
      return s
    }
    case 'euglena': {
      let s = `<path d="M84 150 q66 -52 132 0 q-66 52 -132 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<path d="M84 150 q66 -52 132 0 q-66 52 -132 0 Z" fill="${'url(#tx)'}"/>`
      s += `<path d="M84 150 q-46 -22 -70 -4" stroke="${c1}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      s += `<circle cx="120" cy="136" r="6" fill="#ff5c5c"/>`
      return s
    }
    case 'diatom': {
      let s = `<path d="M96 108 h84 l32 42 l-32 42 h-84 l-32 -42 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<path d="M96 108 h84 l32 42 l-32 42 h-84 l-32 -42 Z" fill="${'url(#tx)'}"/>`
      s += `<line x1="180" y1="150" x2="212" y2="150" stroke="${c1}" stroke-width="2.4"/>`
      s += `<circle cx="120" cy="130" r="4" fill="#fff" opacity="0.5"/>`
      return s
    }
    case 'urchin': case 'heliozoan': case 'radiolarian': {
      let s = ''
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2
        s += `<line x1="${150 + Math.cos(a) * 40}" y1="${150 + Math.sin(a) * 40}" x2="${150 + Math.cos(a) * (76 + J(0, 12))}" y2="${150 + Math.sin(a) * (76 + J(0, 12))}" stroke="${c1}" stroke-width="3.4" stroke-linecap="round" opacity="0.85"/>`
      }
      s += `<circle cx="150" cy="150" r="40" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<circle cx="150" cy="150" r="40" fill="${'url(#tx)'}"/>`
      return s
    }
    case 'tree': {
      let s = `<path d="M138 210 q-6 -70 12 -128 q18 58 12 128 Z" fill="${c2}" stroke="${mix(c1, c2, 0.4)}" stroke-width="3"/>`
      for (const [cx, cy, rad] of [[92, 92, 44], [150, 64, 56], [206, 96, 42], [124, 52, 36]]) s += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      s += `<circle cx="150" cy="64" r="56" fill="${'url(#tx)'}" opacity="0.8"/>`
      return s
    }
    case 'conifer': {
      let s = `<rect x="140" y="186" width="20" height="70" fill="${c2}" stroke="${mix(c1, c2, 0.5)}" stroke-width="3"/>`
      for (let i = 0; i < 4; i++) {
        const y = 168 - i * 44, w = 96 - i * 18
        s += `<polygon points="150,${y - 52} ${150 - w / 2},${y} ${150 + w / 2},${y}" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      }
      s += `<polygon points="150,6 78,72 222,72" fill="${'url(#tx)'}" opacity="0.7"/>`
      return s
    }
    case 'palm': {
      let s = `<path d="M150 230 q-8 -70 6 -140 q10 70 6 140 Z" fill="${c2}" stroke="${mix(c1, c2, 0.5)}" stroke-width="3"/>`
      for (let i = -2; i <= 2; i++) {
        const a = Math.PI * 0.5 + i * 0.42
        s += `<path d="M150 92 q${i * 52} ${46 - Math.abs(i) * 4} ${i * 118} ${-4 + Math.abs(i) * 10}" stroke="${c1}" stroke-width="9" fill="none" stroke-linecap="round"/>`
        s += `<path d="M150 92 q${i * 46} ${40} ${i * 108} ${10 + Math.abs(i) * 4}" stroke="${c2}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7"/>`
      }
      s += `<circle cx="150" cy="92" r="7" fill="${c2}"/>`
      return s
    }
    case 'grass': case 'bamboo': {
      let s = ''
      for (let i = -3; i <= 3; i++) {
        const x = 150 + i * 17, h = 150 - Math.abs(i) * 18 - J(0, 14)
        s += `<path d="M${x} 236 q${i * 8} -${h / 2} ${i * 16} -${h}" stroke="${i % 2 ? c2 : c1}" stroke-width="7" fill="none" stroke-linecap="round"/>`
      }
      if (shape === 'bamboo') {
        s += `<line x1="150" y1="236" x2="150" y2="26" stroke="${c1}" stroke-width="16" stroke-linecap="round"/>`
        for (let y = 200; y > 30; y -= 34) s += `<line x1="142" y1="${y}" x2="158" y2="${y - 14}" stroke="${c2}" stroke-width="4"/>`
        s += `<path d="M138 40 q-34 -16 -58 2 M162 34 q34 -16 58 2" stroke="${c1}" stroke-width="8" fill="none" stroke-linecap="round"/>`
      }
      return s
    }
    case 'moss': case 'lichen': {
      let s = ''
      for (let i = 0; i < 14; i++) {
        const x = J(60, 240), y = J(150, 250), rad = J(12, 30)
        s += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${r() > 0.5 ? g1 : g2}" stroke="${c1}" stroke-width="2.4"/>`
      }
      s += `<circle cx="150" cy="200" r="86" fill="${'url(#tx)'}"/>`
      return s
    }
    case 'fern': case 'horsetail': {
      let s = `<path d="M150 236 q-4 -96 -8 -206" stroke="${c2}" stroke-width="5" fill="none"/>`
      for (let i = 0; i < 11; i++) {
        const y = 208 - i * 16, l = (i < 3 ? 14 : i < 8 ? 34 : 18)
        s += `<path d="M150 ${y} q-${l} -10 -${l + 8} -22 M150 ${y} q${l} -10 ${l + 8} -22" stroke="${c1}" stroke-width="5" fill="none" stroke-linecap="round"/>`
      }
      if (shape === 'horsetail') s += `<rect x="144" y="30" width="12" height="40" rx="5" fill="${c1}"/>`
      return s
    }
    case 'flower': case 'tulip': case 'flytrap': {
      let s = `<path d="M150 240 q-8 -70 2 -138" stroke="${c2}" stroke-width="5" fill="none"/>`
      s += `<path d="M152 190 q36 6 56 -26 q-38 0 -56 26 Z" fill="${g2}" stroke="${c1}" stroke-width="2.6"/>`
      if (shape === 'flytrap') {
        s += `<path d="M126 92 q-24 -4 -34 26 q24 -2 34 -26 Z" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
        s += `<path d="M174 92 q24 -4 34 26 q-24 -2 -34 -26 Z" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
        for (const dx of [-1, 1]) s += `<line x1="${150 + dx * 26}" y1="104" x2="${150 + dx * 40}" y2="94" stroke="#fff" stroke-width="2.4"/>`
        s += `<path d="M128 92 h44 v26 h-44 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      } else {
        const petals = shape === 'tulip' ? 3 : 8
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 + J(0, 0.5)
          s += `<ellipse cx="${150 + Math.cos(a) * 26}" cy="${76 + Math.sin(a) * 24}" rx="${shape === 'tulip' ? 18 : 17}" ry="${shape === 'tulip' ? 34 : 20}" fill="${g1}" stroke="${c1}" stroke-width="2.6" transform="rotate(${(a * 180) / Math.PI} ${150 + Math.cos(a) * 26} ${76 + Math.sin(a) * 24})"/>`
        }
        s += `<circle cx="150" cy="76" r="13" fill="${c2}" stroke="${mix(c1, c2, 0.4)}" stroke-width="2.6"/>`
      }
      return s
    }
    case 'cactus': case 'succulent': {
      let s = `<rect x="128" y="84" width="44" height="152" rx="22" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
      if (shape === 'cactus') {
        s += `<path d="M128 150 q-44 6 -44 44 q0 22 22 22 q22 0 22 -22" fill="none" stroke="${c1}" stroke-width="22" stroke-linecap="round"/>`
        s += `<path d="M172 190 q44 6 44 34 q0 16 -16 16 q-16 0 -16 -16" fill="none" stroke="${c1}" stroke-width="18" stroke-linecap="round"/>`
      } else {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2
          s += `<ellipse cx="${150 + Math.cos(a) * 34}" cy="${150 + Math.sin(a) * 30}" rx="26" ry="17" fill="${i % 2 ? g2 : g1}" stroke="${c1}" stroke-width="2.6" transform="rotate(${(a * 180) / Math.PI} ${150 + Math.cos(a) * 34} ${150 + Math.sin(a) * 30})"/>`
        }
        s += `<circle cx="150" cy="150" r="12" fill="${c2}"/>`
      }
      s += `<rect x="128" y="84" width="44" height="152" rx="22" fill="${'url(#tx)'}"/>`
      return s
    }
    case 'mushroom': case 'bolete': case 'truffle': case 'puffball': case 'stinkhorn': case 'earthstar': case 'birdsnest': case 'morel': case 'jelly': case 'coral': case 'shelf': case 'bracket': case 'moldBrush': case 'budding': case 'stalk': case 'yeast': {
      switch (shape) {
        case 'mushroom': case 'bolete':
          return `<path d="M76 150 q74 -92 148 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M76 150 q74 -92 148 0 Z" fill="${'url(#tx)'}"/><rect x="136" y="150" width="28" height="58" fill="${c2}" stroke="${mix(c1, c2, 0.4)}" stroke-width="3"/><line x1="150" y1="150" x2="150" y2="168" stroke="${c1}" stroke-width="3"/>`
        case 'coral':
          return `<path d="M150 220 q-6 -60 2 -110 M150 170 q-34 -6 -52 -52 M150 150 q34 -10 48 -56 M150 190 q-22 -4 -30 -34 M150 130 q16 -8 22 -34" stroke="${c1}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.95"/><path d="M150 220 q-6 -60 2 -110" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/>`
        case 'puffball':
          return `<circle cx="150" cy="138" r="72" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="150" cy="138" r="72" fill="${'url(#tx)'}"/><circle cx="120" cy="110" r="12" fill="#fff" opacity="0.3"/>`
        case 'stinkhorn':
          return `<rect x="142" y="70" width="16" height="140" rx="8" fill="${c2}" stroke="${c1}" stroke-width="3"/><path d="M104 70 q46 -30 92 0 l-14 -26 h-64 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M130 196 q20 16 40 4 q-18 -4 -24 -14 q-8 6 -16 10 Z" fill="${c1}" opacity="0.6"/>`
        case 'earthstar':
          return `<path d="M150 158 l-62 30 l26 48 l36 -2 l-20 50 l48 6 l20 -48 l30 10 l-4 -46 Z" fill="${c2}" stroke="${c1}" stroke-width="3" opacity="0.9"/><circle cx="150" cy="132" r="40" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="150" cy="132" r="40" fill="${'url(#tx)'}"/>`
        case 'birdsnest':
          return `<path d="M92 150 h116 v44 q-58 30 -116 0 Z" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="128" cy="176" r="9" fill="${g1}"/><circle cx="150" cy="180" r="9" fill="${g1}"/><circle cx="172" cy="176" r="9" fill="${g1}"/>`
        case 'morel':
          return `<rect x="138" y="140" width="24" height="80" fill="${c2}" stroke="${mix(c1, c2, 0.4)}" stroke-width="3"/><path d="M104 140 q46 -76 92 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M104 140 q46 -76 92 0 Z" fill="${'url(#tx)'}"/>`
        case 'truffle':
          return `<path d="M96 160 q10 -64 54 -64 q44 0 54 64 q-6 60 -54 60 q-48 0 -54 -60 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M96 160 q10 -64 54 -64 q44 0 54 64 q-6 60 -54 60 q-48 0 -54 -60 Z" fill="${'url(#tx)'}"/>`
        case 'jelly':
          return `<path d="M92 150 q-2 -54 58 -54 q60 0 58 54 q-10 20 -58 20 q-48 0 -58 -20 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M92 150 q-2 -54 58 -54 q60 0 58 54 q-10 20 -58 20 q-48 0 -58 -20 Z" fill="${'url(#tx)'}"/>`
        case 'shelf': case 'bracket':
          return `<path d="M150 236 q-6 -110 -8 -170 M150 236 q-10 -90 -60 -132 M150 236 q0 -100 40 -140 M150 236 q12 -80 72 -106" stroke="${c1}" stroke-width="11" fill="none" stroke-linecap="round" opacity="0.9"/><path d="M150 236 q-6 -110 -8 -170" stroke="${c2}" stroke-width="4" fill="none"/>`
        case 'moldBrush': {
          let s = ''
          for (let i = 0; i < 5; i++) {
            const x = 106 + i * 22
            s += `<line x1="${x}" y1="206" x2="${x + J(-6, 6)}" y2="96" stroke="${c2}" stroke-width="4"/>`
            s += `<circle cx="${x + J(-6, 6)}" cy="${96 - J(0, 8)}" r="9" fill="${g1}" stroke="${c1}" stroke-width="2.4"/>`
          }
          return s
        }
        case 'budding': case 'yeast':
          return `<ellipse cx="136" cy="150" rx="52" ry="42" fill="${g1}" stroke="${c1}" stroke-width="3"/><ellipse cx="136" cy="150" rx="52" ry="42" fill="${'url(#tx)'}"/><circle cx="186" cy="112" r="22" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="198" cy="96" r="9" fill="${g1}" stroke="${c1}" stroke-width="2.4"/>`
        case 'stalk': {
          let s = `<path d="M146 236 q-6 -60 4 -150" stroke="${c2}" stroke-width="7" fill="none"/>`
          for (let i = 0; i < 6; i++) s += `<circle cx="${150 + (i % 2 ? J(18, 30) : -J(18, 30))}" cy="${200 - i * 26}" r="${10 - i * 0.8}" fill="${g1}" stroke="${c1}" stroke-width="2.6"/>`
          s += `<circle cx="150" cy="86" r="13" fill="${c2}"/>`
          return s
        }
        default: return ''
      }
    }
    case 'kelp': case 'brownalga': case 'redalga': case 'greenalga': {
      let s = `<path d="M150 236 q-30 -60 -18 -120 q10 -50 34 -80" stroke="${c1}" stroke-width="11" fill="none" stroke-linecap="round"/>`
      s += `<path d="M138 180 q-44 4 -58 -22 q38 -2 58 14 Z" fill="${g1}" stroke="${c1}" stroke-width="2.6"/>`
      s += `<path d="M148 150 q42 6 58 -16 q-40 -4 -58 10 Z" fill="${g1}" stroke="${c1}" stroke-width="2.6"/>`
      s += `<path d="M156 118 q-34 -2 -44 -20 q30 0 44 12 Z" fill="${g1}" stroke="${c1}" stroke-width="2.6"/>`
      s += `<path d="M150 236 q-30 -60 -18 -120 q10 -50 34 -80" stroke="${'url(#tx)'}" stroke-width="11" fill="none" opacity="0.8"/>`
      return s
    }
    case 'bigcat': case 'quadruped': case 'bear': case 'canid': case 'deer': case 'bovid': case 'pig': case 'equid': case 'camelid': case 'rhino': case 'hippo': case 'tapir': case 'elephant': case 'giraffe': case 'seal': case 'walrus': case 'primate': case 'human': case 'hedgehog': case 'bat': case 'kangaroo': {
      const fourLegged = (extra = '') => `<g stroke="${c1}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M96 210 q-6 -58 54 -62 q60 4 54 62 Z" fill="${g1}"/><path d="M96 210 q-6 -58 54 -62 q60 4 54 62 Z" fill="${'url(#tx)'}"/><path d="M112 152 q-26 -18 -44 -6 M188 152 q26 -18 44 -6" fill="${g1}" stroke="${c1}"/><circle cx="172" cy="132" r="5" fill="${c1}"/><path d="M110 208 l-6 26 M134 210 l-2 26 M164 210 l4 26 M190 208 l8 24" fill="none"/><path d="M96 190 q-22 4 -34 -14 M96 206 q-20 10 -30 0" fill="none"/>${extra}</g>`
      switch (shape) {
        case 'bigcat': {
          const tex2 = `<path d="M96 210 q-6 -58 54 -62 q60 4 54 62 Z" fill="${'url(#tx)'}" opacity="0.9"/>`
          let s = `<g stroke="${c1}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M96 210 q-6 -58 54 -62 q60 4 54 62 Z" fill="${g1}"/><path d="M112 152 q-26 -18 -44 -6 M188 152 q26 -18 44 -6" fill="${g1}" stroke="${c1}"/><circle cx="172" cy="132" r="5" fill="${c1}"/><path d="M110 208 l-6 26 M134 210 l-2 26 M164 210 l4 26 M190 208 l8 24" fill="none"/><path d="M204 194 q34 6 40 26 q6 20 -8 24" fill="none"/></g>${tex2}`
          return s
        }
        case 'bear': return fourLegged('<circle cx="128" cy="118" r="6" fill="#1c1917"/>')
        case 'canid': return fourLegged(`<path d="M212 190 q30 2 36 -8 M96 188 q-24 0 -30 -12" fill="none"/>`)
        case 'deer': return fourLegged(`<path d="M118 148 q-16 -34 -30 -30 M118 148 q-6 -38 -2 -50 M130 152 q8 -36 24 -30" fill="none"/>`)
        case 'bovid': return fourLegged(`<path d="M96 168 q-18 -22 -24 -40 M96 168 q-8 -30 0 -46" fill="none"/>`)
        case 'pig': return fourLegged(`<ellipse cx="86" cy="142" rx="13" ry="10" fill="${g2}" stroke="${c1}"/>`)
        case 'equid': return fourLegged(`<path d="M186 124 q-8 -30 6 -38" fill="none"/>`)
        case 'camelid': return fourLegged(`<path d="M132 150 q4 -34 0 -52 q12 30 8 48 Z" fill="${g1}" stroke="${c1}"/>`)
        case 'rhino': case 'hippo': case 'tapir': return fourLegged(`<path d="M84 156 q-16 -6 -24 8 q-6 12 4 18" fill="none"/>`)
        case 'elephant': return fourLegged(`<path d="M86 156 q-20 18 -6 40 q12 20 26 6" fill="none"/><path d="M96 152 q-18 -10 -14 -26 M88 148 q-30 4 -44 26" fill="${g1}" stroke="${c1}"/>`)
        case 'giraffe': return fourLegged(`<path d="M120 150 q-4 -46 14 -78 M120 150 q6 -46 24 -74 M134 76 q10 -10 16 -26" fill="none"/><path d="M120 150 q-4 -46 14 -78" stroke-width="14" stroke="${c2}" opacity="0.5" fill="none"/>`)
        case 'seal': case 'walrus': {
          let s = `<path d="M92 178 q0 -44 34 -52 q50 -10 92 6 q26 10 26 40 q0 40 -40 44 q-64 6 -96 4 q-16 -1 -16 -16 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M92 178 q0 -44 34 -52 q50 -10 92 6 q26 10 26 40 q0 40 -40 44 q-64 6 -96 4 q-16 -1 -16 -16 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="112" cy="150" r="4" fill="${c1}"/>`
          if (shape === 'walrus') s += `<path d="M92 176 q-18 8 -24 30 M94 184 q-12 12 -10 30" stroke="${c2}" stroke-width="7" fill="none" stroke-linecap="round"/>`
          return s
        }
        case 'primate': case 'human': {
          let s = `<g stroke="${c1}" stroke-width="3" stroke-linecap="round"><circle cx="150" cy="104" r="30" fill="${g1}"/><circle cx="150" cy="104" r="30" fill="${'url(#tx)'}" opacity="0.8"/><circle cx="140" cy="100" r="3.4" fill="#1c1917"/><circle cx="160" cy="100" r="3.4" fill="#1c1917"/><path d="M146 118 q4 8 0 14 M154 118 q-4 8 0 14" fill="none"/><path d="M118 156 q-20 -44 2 -58 M182 156 q20 -44 -2 -58 M126 158 q-34 8 -46 38 q-8 26 12 30 M174 158 q34 8 46 38 q8 26 -12 30 M136 208 q-6 30 -2 62 M164 208 q6 30 2 62 M108 206 q-8 22 0 44 M150 200 q0 24 0 50" fill="none" stroke-width="10" opacity="0.0"/><path d="M126 176 q-40 12 -52 44 q-10 28 8 34 M174 176 q40 12 52 44 q10 28 -8 34" fill="none"/><path d="M136 214 q-6 30 -2 64 M164 214 q6 30 2 64" fill="none"/><rect x="108" y="136" width="84" height="44" rx="16" fill="${g2}" stroke="${c1}" stroke-width="3"/><path d="M134 216 l-2 64 M166 216 l2 64" stroke="${c2}" stroke-width="11" stroke-linecap="round"/></g>`
          if (shape === 'human') s += `<circle cx="150" cy="96" r="5" fill="${c2}"/>`
          return s
        }
        case 'hedgehog': {
          let s = `<path d="M84 196 q6 -52 66 -60 q60 8 66 60 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          for (let i = 0; i < 18; i++) {
            const a = Math.PI + (i / 17) * Math.PI
            s += `<line x1="${150 + Math.cos(a) * 62}" y1="${148 + Math.sin(a) * 52}" x2="${150 + Math.cos(a) * 82}" y2="${148 + Math.sin(a) * 70}" stroke="${c2}" stroke-width="3.4" stroke-linecap="round"/>`
          }
          s += `<path d="M84 196 q6 -52 66 -60 q60 8 66 60 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="116" cy="176" r="4" fill="${c1}"/>`
          return s
        }
        case 'bat': {
          let s = `<path d="M150 150 q-8 -52 -52 -88 q44 8 52 30 q12 -24 56 -30 q-44 34 -56 88 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M150 150 q-8 -52 -52 -88 q44 8 52 30 q12 -24 56 -30 q-44 34 -56 88 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="150" cy="150" r="22" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M140 138 l-8 -8 M160 138 l8 -8" stroke="${c1}" stroke-width="4" stroke-linecap="round"/>`
          return s
        }
        case 'kangaroo': {
          let s = `<g stroke="${c1}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M108 214 q-8 -70 34 -86 q46 -18 72 18" fill="none" stroke-width="13"/><path d="M108 214 q-8 -70 34 -86 q46 -18 72 18" fill="none" stroke="${g1}" stroke-width="8" opacity="0"/>`
          s += `<path d="M104 160 q-30 -30 -14 -56 M104 154 q-18 -12 -12 -30" fill="none"/><circle cx="106" cy="132" r="17" fill="${g1}" stroke="${c1}"/><circle cx="100" cy="128" r="2.6" fill="#1c1917"/><ellipse cx="142" cy="128" rx="24" ry="34" fill="${g1}" stroke="${c1}"/><ellipse cx="142" cy="128" rx="24" ry="34" fill="${'url(#tx)'}"/><path d="M142 170 q-4 46 6 74 M142 170 q8 44 26 60" fill="none" stroke-width="9"/><path d="M196 176 q34 34 26 66 q-4 16 -18 8" fill="none"/><path d="M164 232 q-12 34 -30 48" fill="none" stroke-width="9"/></g>`
          return s
        }
        default: return fourLegged('')
      }
    }
    case 'whale': case 'dolphin': {
      let s = `<path d="M60 170 q40 -64 140 -56 q70 6 100 40 q-70 16 -110 6 q-20 22 -56 16 q-30 -5 -74 -6 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
      s += `<path d="M60 170 q40 -64 140 -56 q70 6 100 40 q-70 16 -110 6 q-20 22 -56 16 q-30 -5 -74 -6 Z" fill="${'url(#tx)'}"/>`
      s += `<circle cx="86" cy="140" r="4" fill="#1c1917"/>`
      s += `<path d="M236 148 q30 4 46 -4" stroke="${c1}" stroke-width="4" fill="none"/>`
      if (shape === 'dolphin') s += `<path d="M210 130 q16 -26 44 -30 q-2 22 -18 30" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
      return s
    }
    case 'shark': case 'fish': case 'eel': case 'seahorse': case 'ray': {
      switch (shape) {
        case 'shark': {
          let s = `<path d="M44 160 q40 -46 104 -46 q56 0 100 30 q20 14 22 26 q-2 16 -22 30 q-44 30 -100 30 q-64 0 -104 -46 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M44 160 q40 -46 104 -46 q56 0 100 30 q20 14 22 26 q-2 16 -22 30 q-44 30 -100 30 q-64 0 -104 -46 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M112 92 q30 -30 58 -34 q-2 26 -26 40" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="76" cy="148" r="4" fill="#1c1917"/><path d="M120 170 q16 14 14 30 q-16 -8 -14 -30 Z" fill="${c2}" stroke="${c1}" stroke-width="2.6"/>`
          return s
        }
        case 'fish': {
          let s = `<path d="M52 150 q44 -54 108 -54 q40 0 64 30 q14 16 16 24 q-2 14 -16 24 q-24 30 -64 30 q-64 0 -108 -54 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M52 150 q44 -54 108 -54 q40 0 64 30 q14 16 16 24 q-2 14 -16 24 q-24 30 -64 30 q-64 0 -108 -54 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="82" cy="140" r="4" fill="#1c1917"/><path d="M126 122 q24 -22 44 -24 q-2 20 -20 32" fill="${g2}" stroke="${c1}" stroke-width="3"/><path d="M128 176 q18 12 16 28 q-18 -6 -16 -28 Z" fill="${c2}" stroke="${c1}" stroke-width="2.6"/>`
          return s
        }
        case 'eel': {
          let s = `<path d="M60 130 q70 -80 160 -10 q40 30 44 44 q-10 20 -40 6 q-60 -30 -118 20 q-30 26 -46 16 q-10 -6 0 -20 q18 -30 0 -56 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M60 130 q70 -80 160 -10 q40 30 44 44 q-10 20 -40 6 q-60 -30 -118 20 q-30 26 -46 16 q-10 -6 0 -20 q18 -30 0 -56 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="84" cy="108" r="3.6" fill="#1c1917"/>`
          return s
        }
        case 'seahorse': {
          let s = `<path d="M150 60 q-14 8 -16 30 q-2 30 14 40 q20 12 20 40 q0 22 -12 34 q-12 14 -4 30 q8 14 22 4 q26 -18 30 -52 q4 -32 -12 -48 q-10 -10 -10 -26 q0 -14 -8 -22 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M150 60 q-14 8 -16 30 q-2 30 14 40 q20 12 20 40 q0 22 -12 34 q-12 14 -4 30 q8 14 22 4 q26 -18 30 -52 q4 -32 -12 -48 q-10 -10 -10 -26 q0 -14 -8 -22 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M136 54 q-8 -14 -20 -12 M136 60 q-2 -10 -10 -14 M150 66 q4 -6 8 -2" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="140" cy="74" r="3" fill="#1c1917"/>`
          return s
        }
        case 'ray': {
          let s = `<path d="M60 170 q60 -70 90 -70 q30 0 90 70 q-8 10 -18 8 q-40 -8 -72 -8 q-32 0 -72 8 q-10 2 -18 -8 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M60 170 q60 -70 90 -70 q30 0 90 70 q-8 10 -18 8 q-40 -8 -72 -8 q-32 0 -72 8 q-10 2 -18 -8 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M150 178 q-2 34 8 62 q6 16 12 10 q4 -4 0 -14 q-6 -24 -10 -58" fill="none" stroke="${c1}" stroke-width="5" stroke-linecap="round"/><circle cx="140" cy="128" r="3" fill="#1c1917"/>`
          return s
        }
        default: return ''
      }
    }
    case 'butterfly': case 'bee': case 'ant': case 'beetle': case 'hopper': case 'mantis': case 'dragonfly': case 'fly': {
      switch (shape) {
        case 'butterfly': {
          let s = `<path d="M150 150 q-8 34 -58 40 q-40 6 -44 -22 q-4 -30 26 -30 q22 0 26 6 q4 -6 26 -6 q30 0 26 30 q-4 28 -44 22 q-50 -6 -58 -40 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M150 150 q-8 34 -58 40 q-40 6 -44 -22 q-4 -30 26 -30 q22 0 26 6 q4 -6 26 -6 q30 0 26 30 q-4 28 -44 22 q-50 -6 -58 -40 Z" fill="${'url(#tx)'}" opacity="0.9"/>`
          s += `<ellipse cx="150" cy="150" rx="6" ry="26" fill="${c2}" stroke="${mix(c1, c2, 0.4)}" stroke-width="2.6"/><path d="M150 124 q-8 -14 -16 -18 M150 176 q-8 14 -16 18" stroke="${c1}" stroke-width="2.6" fill="none"/>`
          return s
        }
        case 'bee': {
          let s = `<ellipse cx="150" cy="150" rx="58" ry="36" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          for (const dy of [-12, 0, 12]) s += `<path d="M106 ${150 + dy} q44 18 88 0" stroke="${c2}" stroke-width="9" fill="none" opacity="0.9"/>`
          s += `<ellipse cx="96" cy="138" rx="18" ry="13" fill="${g2}" stroke="${c1}" stroke-width="2.6"/><circle cx="92" cy="135" r="3" fill="#1c1917"/><path d="M150 114 q-16 -26 -40 -30 M150 186 q-16 26 -40 30" stroke="${c1}" stroke-width="2.6" fill="none"/><ellipse cx="130" cy="112" rx="16" ry="10" fill="#ffffff" opacity="0.5" transform="rotate(-30 130 112)"/>`
          return s
        }
        case 'ant': {
          let s = `<ellipse cx="140" cy="172" rx="24" ry="18" fill="${g1}" stroke="${c1}" stroke-width="3"/><ellipse cx="172" cy="140" rx="17" ry="13" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="182" cy="112" r="14" fill="${g1}" stroke="${c1}" stroke-width="3"/><path d="M168 126 l-4 -8 M178 126 l6 -8" stroke="${c1}" stroke-width="2.6" fill="none"/><circle cx="186" cy="108" r="2.6" fill="#1c1917"/>`
          for (const [a, b] of [[112, 190], [126, 196], [152, 198], [166, 192], [180, 184], [194, 174]]) s += `<line x1="${a}" y1="${b}" x2="${a + 26}" y2="${b + 30}" stroke="${c1}" stroke-width="3" stroke-linecap="round"/>`
          return s
        }
        case 'beetle': {
          let s = `<ellipse cx="150" cy="152" rx="52" ry="34" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<ellipse cx="150" cy="152" rx="52" ry="34" fill="${'url(#tx)'}"/>`
          s += `<line x1="150" y1="118" x2="150" y2="186" stroke="${c1}" stroke-width="2.6"/><circle cx="150" cy="118" r="20" fill="${g2}" stroke="${c1}" stroke-width="3"/><path d="M134 112 l-10 -8 M166 112 l10 -8" stroke="${c1}" stroke-width="2.6" fill="none"/><circle cx="143" cy="114" r="2.4" fill="#1c1917"/>`
          for (let i = 0; i < 3; i++) s += `<line x1="${100 + i * 14}" y1="${168 + i * 8}" x2="${116 + i * 14}" y2="${196 + i * 8}" stroke="${c1}" stroke-width="3" stroke-linecap="round"/>`
          return s
        }
        case 'hopper': {
          let s = `<ellipse cx="150" cy="150" rx="52" ry="28" fill="${g1}" stroke="${c1}" stroke-width="3" transform="rotate(-14 150 150)"/><ellipse cx="150" cy="150" rx="52" ry="28" fill="${'url(#tx)'}" transform="rotate(-14 150 150)"/>`
          s += `<path d="M106 132 q-36 -44 -16 -66 q26 -6 38 16 q-10 34 -22 50 Z" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="96" cy="118" r="9" fill="${g1}" stroke="${c1}" stroke-width="2.6"/><circle cx="92" cy="115" r="2.4" fill="#1c1917"/>`
          s += `<path d="M124 176 q-20 34 -34 68 M138 178 q-6 36 -12 74" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/>`
          return s
        }
        case 'mantis': {
          let s = `<path d="M150 190 q-10 -70 -4 -120 M150 190 q8 -60 20 -110" stroke="${c1}" stroke-width="7" fill="none" stroke-linecap="round"/>`
          s += `<path d="M146 86 q-30 -30 -12 -52 q22 -4 32 14 M146 92 q-20 -8 -26 -2" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M154 106 q26 -34 56 -40 q-8 24 -30 34 M156 112 q22 -4 34 2" fill="none" stroke="${c1}" stroke-width="6" stroke-linecap="round"/>`
          s += `<circle cx="148" cy="72" r="12" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="144" cy="68" r="3" fill="#1c1917"/>`
          return s
        }
        case 'dragonfly': {
          let s = `<line x1="150" y1="60" x2="150" y2="212" stroke="${c2}" stroke-width="8" stroke-linecap="round"/>`
          s += `<ellipse cx="150" cy="64" rx="10" ry="14" fill="${g1}" stroke="${c1}" stroke-width="2.6"/><circle cx="146" cy="56" r="3.6" fill="#1c1917"/><circle cx="154" cy="56" r="3.6" fill="#1c1917"/>`
          for (const dx of [-1, 1]) { s += `<ellipse cx="${150 + dx * 62}" cy="100" rx="52" ry="13" fill="${g2}" stroke="${c1}" stroke-width="2.6" opacity="0.92" transform="rotate(${dx * -16} ${150 + dx * 62} 100)"/><ellipse cx="${150 + dx * 66}" cy="136" rx="46" ry="12" fill="${g1}" stroke="${c1}" stroke-width="2.6" opacity="0.92" transform="rotate(${dx * -14} ${150 + dx * 66} 136)"/>` }
          s += `<circle cx="150" cy="208" r="5" fill="${c1}"/>`
          return s
        }
        case 'fly': {
          let s = `<ellipse cx="150" cy="156" rx="44" ry="30" fill="${g1}" stroke="${c1}" stroke-width="3"/><ellipse cx="150" cy="156" rx="44" ry="30" fill="${'url(#tx)'}"/>`
          s += `<ellipse cx="140" cy="110" rx="40" ry="22" fill="#ffffff" opacity="0.55" transform="rotate(-24 140 110)"/><ellipse cx="166" cy="104" rx="38" ry="20" fill="#ffffff" opacity="0.5" transform="rotate(20 166 104)"/>`
          s += `<circle cx="150" cy="140" r="11" fill="${c2}" stroke="${c1}" stroke-width="2.6"/><circle cx="145" cy="137" r="3" fill="#1c1917"/>`
          for (let i = 0; i < 3; i++) s += `<line x1="${112 + i * 12}" y1="${172 + i * 6}" x2="${128 + i * 12}" y2="${198 + i * 6}" stroke="${c1}" stroke-width="3" stroke-linecap="round"/>`
          return s
        }
        default: return ''
      }
    }
    case 'spider': case 'scorpion': case 'crab': case 'shrimp': case 'tick': case 'isopod': case 'barnacle': {
      switch (shape) {
        case 'spider': case 'tick': {
          let s = `<ellipse cx="150" cy="128" rx="30" ry="34" fill="${g1}" stroke="${c1}" stroke-width="3"/><ellipse cx="150" cy="128" rx="30" ry="34" fill="${'url(#tx)'}"/>`
          s += `<circle cx="150" cy="84" r="19" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
          for (let i = 0; i < 4; i++) s += `<circle cx="${142 + i * 5}" cy="80" r="1.8" fill="#1c1917"/>`
          for (const dx of [-1, 1]) for (let i = 0; i < 4; i++) {
            const y = 116 + i * 10
            s += `<path d="M${150 + dx * 26} ${y} q${dx * 40} 8 ${dx * 66} ${y - 26 + i * 6}" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/>`
          }
          if (shape === 'tick') { s += `<ellipse cx="150" cy="168" rx="20" ry="12" fill="${c2}" opacity="0.85"/>` }
          return s
        }
        case 'scorpion': {
          let s = `<ellipse cx="138" cy="158" rx="30" ry="22" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<circle cx="112" cy="140" r="13" fill="${g2}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M96 132 q-20 -16 -8 -30 M96 134 q-14 -4 -16 -14" fill="none" stroke="${c1}" stroke-width="5" stroke-linecap="round"/>`
          s += `<path d="M164 150 q40 -8 62 -24 q22 6 26 20 q4 14 -12 18 q-20 4 -30 -4 M164 160 q36 4 56 18 q16 10 8 22 q-10 10 -24 0 q-16 -10 -22 -26 M164 170 q26 16 34 40 q4 12 -6 14 q-12 0 -16 -12 q-6 -22 -14 -42" fill="none" stroke="${c1}" stroke-width="5" stroke-linecap="round"/>`
          s += `<circle cx="190" cy="148" r="6" fill="${c2}"/>`
          for (let i = 0; i < 4; i++) s += `<line x1="${112 + i * 8}" y1="${166 + i * 5}" x2="${120 + i * 8}" y2="${192 + i * 5}" stroke="${c1}" stroke-width="3" stroke-linecap="round"/>`
          return s
        }
        case 'crab': {
          let s = `<ellipse cx="150" cy="158" rx="58" ry="42" fill="${g1}" stroke="${c1}" stroke-width="3"/><ellipse cx="150" cy="158" rx="58" ry="42" fill="${'url(#tx)'}"/>`
          s += `<circle cx="122" cy="138" r="5" fill="#1c1917"/><circle cx="178" cy="138" r="5" fill="#1c1917"/><path d="M136 174 q14 10 28 0" stroke="${c1}" stroke-width="2.6" fill="none"/>`
          for (const dx of [-1, 1]) { s += `<path d="M${150 + dx * 54} ${142} q${dx * 44} -22 ${dx * 74} 8 q${dx * 18} 16 0 26 q-${dx * 20} 8 -${dx * 34} -6" fill="none" stroke="${c1}" stroke-width="6" stroke-linecap="round"/>` }
          for (let i = 0; i < 4; i++) s += `<line x1="${120 + i * 20}" y1="${192 + i * 4}" x2="${134 + i * 20}" y2="${216 + i * 4}" stroke="${c1}" stroke-width="3.6" stroke-linecap="round"/>`
          return s
        }
        case 'shrimp': case 'isopod': {
          let s = `<path d="M70 168 q30 -40 74 -44 q60 -6 86 24 q14 16 10 26 q-6 10 -24 8 q-44 -6 -66 6 q-30 14 -44 26 q-14 12 -26 8 q-10 -4 -6 -18 q6 -20 -4 -36 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M70 168 q30 -40 74 -44 q60 -6 86 24 q14 16 10 26 q-6 10 -24 8 q-44 -6 -66 6 q-30 14 -44 26 q-14 12 -26 8 q-10 -4 -6 -18 q6 -20 -4 -36 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M60 166 q-22 4 -30 -6 M62 176 q-18 8 -24 2" stroke="${c2}" stroke-width="3" fill="none" stroke-linecap="round"/>`
          s += `<circle cx="96" cy="140" r="4" fill="#1c1917"/><path d="M136 190 q18 12 14 30 q-20 -8 -14 -30 Z" fill="${c2}" stroke="${c1}" stroke-width="2.6"/>`
          return s
        }
        case 'barnacle': {
          let s = `<path d="M118 172 l32 -96 q4 24 16 28 M150 76 l16 28 q12 -4 16 -28 l32 96 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M118 172 l32 -96 q4 24 16 28 M150 76 l16 28 q12 -4 16 -28 l32 96 Z" fill="${'url(#tx)'}"/>`
          s += `<ellipse cx="150" cy="78" rx="9" ry="6" fill="${c2}"/>`
          return s
        }
        default: return ''
      }
    }
    case 'snail': case 'slug': case 'bivalve': case 'octopus': case 'squid': case 'nautilus': case 'nudibranch': {
      switch (shape) {
        case 'snail': {
          let s = `<circle cx="164" cy="122" r="52" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M164 122 m-52 0 a52 52 0 1 1 0.01 0" fill="none" stroke="${c2}" stroke-width="0"/>`
          s += `<path d="M164 122 a52 52 0 1 1 -0.01 0 M164 122 a40 40 0 1 0 0.01 0 M164 122 a28 28 0 1 1 -0.01 0" fill="none" stroke="${c2}" stroke-width="4" opacity="0.8"/>`
          s += `<path d="M126 162 q-60 8 -68 40 q-4 18 12 20 q26 2 44 -8 q22 -12 30 -32 q6 -16 20 -18" fill="${g2}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<circle cx="70" cy="176" r="4" fill="#1c1917"/><path d="M50 178 l-8 -8 M50 182 l-6 -2" stroke="${c1}" stroke-width="2.6" fill="none"/>`
          return s
        }
        case 'slug': case 'nudibranch': {
          let s = `<path d="M70 176 q0 -26 22 -30 q46 -8 92 8 q24 10 24 26 q0 18 -22 18 q-62 -6 -92 -4 q-24 2 -24 -8 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M70 176 q0 -26 22 -30 q46 -8 92 8 q24 10 24 26 q0 18 -22 18 q-62 -6 -92 -4 q-24 2 -24 -8 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M60 172 l-14 -12 M60 178 l-12 -4" stroke="${c1}" stroke-width="2.6" fill="none"/><circle cx="56" cy="166" r="3" fill="#1c1917"/>`
          if (shape === 'nudibranch') { for (let i = 0; i < 6; i++) s += `<path d="M${124 + i * 14} 148 q6 -26 4 -40" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>` }
          return s
        }
        case 'bivalve': {
          let s = `<path d="M70 172 q14 -52 80 -54 q66 2 80 54 q-80 8 -160 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M70 172 q14 -52 80 -54 q66 2 80 54 q-80 8 -160 0 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M150 118 q-2 30 0 54 M118 148 q32 -8 64 0" stroke="${c2}" stroke-width="3" fill="none" opacity="0.7"/>`
          return s
        }
        case 'octopus': case 'squid': {
          let s = `<path d="M108 132 q-8 -42 42 -46 q50 4 42 46 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M108 132 q-8 -42 42 -46 q50 4 42 46 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="138" cy="106" r="5" fill="#1c1917"/><circle cx="162" cy="106" r="5" fill="#1c1917"/>`
          for (let i = -2; i <= 2; i++) s += `<path d="M${150 + i * 22} 128 q${i * 16} 44 ${i * 34} 74" stroke="${c1}" stroke-width="7" fill="none" stroke-linecap="round"/>`
          if (shape === 'squid') { s += `<path d="M150 76 q-4 -20 0 -34 M150 76 q4 -20 0 -34 M150 76 l-10 -24 M150 76 l10 -24" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M186 116 q20 -8 34 -2 M176 124 q24 -2 32 8" fill="none" stroke="${c1}" stroke-width="5" stroke-linecap="round"/>` }
          return s
        }
        case 'nautilus': {
          let s = ''
          for (let i = 0; i < 6; i++) {
            const a = -2.2 + i * 0.62, rad = 30 + i * 13
            s += `<path d="M150 150 L${150 + Math.cos(a) * rad} ${150 + Math.sin(a) * rad} A${rad} ${rad} 0 0 1 ${150 + Math.cos(a + 0.62) * rad} ${150 + Math.sin(a + 0.62) * rad} Z" fill="${i % 2 ? g2 : g1}" stroke="${c1}" stroke-width="2.4"/>`
          }
          return s
        }
        default: return ''
      }
    }
    case 'starfish': case 'jellyfish': case 'anemone': case 'sponge': case 'tardigrade': case 'worm': case 'snake': case 'lizard': case 'croc': case 'turtle': case 'frog': case 'bird': case 'owl': case 'penguin': case 'duck': case 'ratite': {
      switch (shape) {
        case 'starfish': {
          let pts = []
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2
            const rad = i % 2 ? 36 : 76
            pts.push(`${150 + Math.cos(a) * rad},${150 + Math.sin(a) * rad}`)
          }
          let s = `<polygon points="${pts.join(' ')}" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<polygon points="${pts.join(' ')}" fill="${'url(#tx)'}"/>`
          s += `<circle cx="150" cy="150" r="9" fill="${c2}" opacity="0.8"/>`
          return s
        }
        case 'jellyfish': {
          let s = `<path d="M92 110 q58 -54 116 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M92 110 q58 -54 116 0 Z" fill="${'url(#tx)'}"/>`
          for (let i = 0; i < 6; i++) {
            const x = 104 + i * 18.4
            s += `<path d="M${x} 108 q${(i - 2.5) * 6} 44 ${(i - 2.5) * 20} 92" stroke="${i % 2 ? c2 : c1}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.9"/>`
          }
          s += `<circle cx="128" cy="82" r="7" fill="#fff" opacity="0.4"/>`
          return s
        }
        case 'anemone': {
          let s = `<path d="M116 208 q-6 -40 34 -40 q40 0 34 40 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M116 208 q-6 -40 34 -40 q40 0 34 40 Z" fill="${'url(#tx)'}"/>`
          for (let i = -3; i <= 3; i++) s += `<path d="M${150 + i * 10} 168 q${i * 8} -26 ${i * 20} -48" stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round"/>`
          for (let i = -3; i <= 3; i++) s += `<circle cx="${150 + i * 20}" cy="${120 - Math.abs(i) * 6}" r="7" fill="${c2}"/>`
          return s
        }
        case 'sponge': {
          let s = `<path d="M108 224 q-6 -70 42 -74 q48 4 42 74 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M108 224 q-6 -70 42 -74 q48 4 42 74 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="130" cy="140" r="7" fill="${c2}" opacity="0.8"/><circle cx="164" cy="166" r="9" fill="${c2}" opacity="0.8"/><circle cx="146" cy="194" r="6" fill="${c2}" opacity="0.8"/>`
          return s
        }
        case 'tardigrade': {
          let s = `<ellipse cx="150" cy="156" rx="52" ry="36" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<ellipse cx="150" cy="156" rx="52" ry="36" fill="${'url(#tx)'}"/>`
          s += `<circle cx="112" cy="142" r="11" fill="${g2}" stroke="${c1}" stroke-width="2.6"/>`
          for (const dx of [-1, 1]) for (let i = 0; i < 4; i++) {
            const x = 122 + dx * 24 + i * (dx > 0 ? 9 : -9) * 0
            const y = 176 + i * 5
            s += `<line x1="${x}" y1="${y}" x2="${x + dx * 10}" y2="${y + 16}" stroke="${c1}" stroke-width="4" stroke-linecap="round"/>`
          }
          return s
        }
        case 'worm': case 'snake': {
          let pts = []
          for (let i = 0; i <= 8; i++) {
            const x = 40 + i * 30, y = 150 + Math.sin(i * 1.1 + J(0, 1)) * (shape === 'snake' ? 46 : 30)
            pts.push(`${x},${y}`)
          }
          const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ')
          let s = `<path d="${path}" stroke="${c1}" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
          s += `<path d="${path}" stroke="${g2}" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>`
          s += `<path d="${path}" stroke="${'url(#tx)'}" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.8"/>`
          const [hx, hy] = pts[0].split(',')
          s += `<circle cx="${hx - 12}" cy="${hy - 8}" r="13" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="${hx - 16}" cy="${hy - 10}" r="2.8" fill="#1c1917"/>`
          if (shape === 'snake') s += `<path d="M${hx - 4} ${hy - 16} l-7 -7 M${hx - 6} ${hy - 14} l-8 -4" stroke="#dc2626" stroke-width="2.6" fill="none"/>`
          return s
        }
        case 'lizard': case 'croc': {
          let s = `<path d="M54 168 q8 -40 40 -44 q40 -4 68 6 q36 12 52 30 q10 10 6 20 q-6 8 -18 4 q-40 -14 -76 -8 q-30 5 -44 12 q-14 6 -24 2 q-8 -3 -4 -10 q6 -8 0 -12 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
          s += `<path d="M54 168 q8 -40 40 -44 q40 -4 68 6 q36 12 52 30 q10 10 6 20 q-6 8 -18 4 q-40 -14 -76 -8 q-30 5 -44 12 q-14 6 -24 2 q-8 -3 -4 -10 q6 -8 0 -12 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="72" cy="138" r="3.6" fill="#1c1917"/>`
          for (const [x, y] of [[78, 172], [100, 176], [122, 178], [144, 178]]) s += `<line x1="${x}" y1="${y}" x2="${x + 6}" y2="${y + 18}" stroke="${c1}" stroke-width="3.4" stroke-linecap="round"/>`
          s += `<path d="M198 176 q26 20 22 44 q-2 14 -14 10" fill="none" stroke="${c1}" stroke-width="7" stroke-linecap="round"/>`
          if (shape === 'croc') { s += `<path d="M40 150 q-20 -8 -28 4 q-6 10 4 14" fill="none" stroke="${c1}" stroke-width="4"/><circle cx="60" cy="128" r="5" fill="${c2}"/>` }
          return s
        }
        case 'croc': return ''
        case 'turtle': {
          let s = `<path d="M86 152 q0 -44 64 -44 q64 0 64 44 q-64 10 -128 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M86 152 q0 -44 64 -44 q64 0 64 44 q-64 10 -128 0 Z" fill="${'url(#tx)'}"/>`
          s += `<path d="M110 152 l0 40 M150 152 l0 46 M190 152 l0 40" stroke="${c1}" stroke-width="3" fill="none"/><path d="M150 152 l-26 34 M150 152 l0 46 M150 152 l26 34" stroke="${c2}" stroke-width="3" fill="none" opacity="0.7"/>`
          s += `<circle cx="76" cy="138" r="11" fill="${g2}" stroke="${c1}" stroke-width="3"/><circle cx="72" cy="135" r="2.6" fill="#1c1917"/>`
          for (const dx of [-1, 1]) s += `<path d="M${150 + dx * 50} 180 q${dx * 14} 14 ${dx * 22} 26" stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round"/>`
          return s
        }
        case 'frog': {
          let s = `<path d="M96 168 q0 -46 54 -46 q54 0 54 46 q-54 8 -108 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
          s += `<path d="M96 168 q0 -46 54 -46 q54 0 54 46 q-54 8 -108 0 Z" fill="${'url(#tx)'}"/>`
          s += `<circle cx="104" cy="110" r="15" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="196" cy="110" r="15" fill="${g1}" stroke="${c1}" stroke-width="3"/><circle cx="104" cy="106" r="6" fill="#1c1917"/><circle cx="196" cy="106" r="6" fill="#1c1917"/>`
          s += `<path d="M138 158 q12 10 24 0" stroke="${c1}" stroke-width="2.6" fill="none"/>`
          for (const dx of [-1, 1]) s += `<path d="M${150 + dx * 46} 164 q${dx * 26} 12 ${dx * 34} 34" stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round"/>`
          return s
        }
        case 'bird': case 'owl': case 'duck': case 'penguin': case 'ratite': {
          switch (shape) {
            case 'owl': {
              let s = `<path d="M110 150 q-2 -52 40 -54 q42 2 40 54 q0 30 -40 30 q-40 0 -40 -30 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
              s += `<path d="M110 150 q-2 -52 40 -54 q42 2 40 54 q0 30 -40 30 q-40 0 -40 -30 Z" fill="${'url(#tx)'}"/>`
              s += `<path d="M126 108 q-10 -16 2 -28 q12 4 16 14 M174 108 q10 -16 -2 -28 q-12 4 -16 14" fill="${c2}" stroke="${c1}" stroke-width="2.6"/>`
              s += `<circle cx="134" cy="126" r="9" fill="#fbbf24" stroke="${c1}" stroke-width="2.4"/><circle cx="166" cy="126" r="9" fill="#fbbf24" stroke="${c1}" stroke-width="2.4"/><circle cx="134" cy="126" r="3.4" fill="#1c1917"/><circle cx="166" cy="126" r="3.4" fill="#1c1917"/>`
              s += `<path d="M150 148 l-4 6 M150 154 l0 5 M150 160 l4 5" stroke="${c2}" stroke-width="2.6" fill="none"/>`
              s += `<path d="M124 172 l-8 18 M176 172 l8 18" stroke="${c1}" stroke-width="5" fill="none" stroke-linecap="round"/>`
              return s
            }
            case 'penguin': {
              let s = `<path d="M108 160 q-2 -56 42 -58 q44 2 42 58 q-42 26 -84 0 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
              s += `<path d="M128 152 q22 -30 44 0 q-22 14 -44 0 Z" fill="${c2}" opacity="0.9"/><path d="M108 160 q-2 -56 42 -58 q44 2 42 58 q-42 26 -84 0 Z" fill="${'url(#tx)'}"/>`
              s += `<circle cx="136" cy="124" r="3.6" fill="#1c1917"/><circle cx="164" cy="124" r="3.6" fill="#1c1917"/><path d="M150 134 l-7 8 M150 142 l0 6 M150 150 l7 8" stroke="${c2}" stroke-width="2.6" fill="none"/>`
              for (const dx of [-1, 1]) s += `<path d="M${150 + dx * 34} 132 q${dx * 24} 10 ${dx * 38} 4" fill="none" stroke="${c1}" stroke-width="6" stroke-linecap="round"/>`
              s += `<path d="M132 210 l-6 16 M168 210 l6 16" stroke="${c2}" stroke-width="6" fill="none" stroke-linecap="round"/>`
              return s
            }
            case 'duck': {
              let s = `<path d="M96 150 q10 -40 46 -42 q44 -2 62 18 q10 10 6 22 q-4 8 -16 6 q-28 -6 -46 -2 q-16 4 -28 16 q-10 10 -20 8 q-8 -2 -4 -12 q4 -8 0 -14 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
              s += `<path d="M96 150 q10 -40 46 -42 q44 -2 62 18 q10 10 6 22 q-4 8 -16 6 q-28 -6 -46 -2 q-16 4 -28 16 q-10 10 -20 8 q-8 -2 -4 -12 q4 -8 0 -14 Z" fill="${'url(#tx)'}"/>`
              s += `<circle cx="106" cy="132" r="3.4" fill="#1c1917"/><path d="M92 142 q-16 -2 -28 4 q-6 4 -2 8" stroke="${c2}" stroke-width="4" fill="none"/>`
              s += `<path d="M140 168 q-8 26 -4 44 M140 168 q8 26 4 44" stroke="${c1}" stroke-width="5" fill="none" stroke-linecap="round"/>`
              return s
            }
            case 'ratite': {
              let s = `<path d="M118 128 q-8 -34 24 -42 q36 -8 44 10 q-40 12 -68 32 Z" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
              s += `<path d="M118 128 q-8 -34 24 -42 q36 -8 44 10 q-40 12 -68 32 Z" fill="${'url(#tx)'}"/>`
              s += `<path d="M120 118 q-8 -16 -20 -20 M122 122 q-6 -12 -16 -14" stroke="${c1}" stroke-width="3" fill="none"/><circle cx="114" cy="108" r="3" fill="#1c1917"/>`
              s += `<path d="M128 156 q-8 40 2 70 M172 156 q8 40 -2 70" stroke="${c2}" stroke-width="13" fill="none" stroke-linecap="round" opacity="0.9"/>`
              s += `<path d="M142 218 l-6 22 M158 218 l6 22" stroke="${c1}" stroke-width="6" fill="none" stroke-linecap="round"/>`
              return s
            }
            default: { // generic songbird/bird
              let s = `<path d="M96 148 q14 -38 48 -36 q40 2 50 30 q6 16 -2 24 q-12 12 -34 10 q-16 -2 -30 6 q-12 7 -24 4 q-10 -3 -6 -12 q5 -10 -2 -16 Z" fill="${g1}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`
              s += `<path d="M96 148 q14 -38 48 -36 q40 2 50 30 q6 16 -2 24 q-12 12 -34 10 q-16 -2 -30 6 q-12 7 -24 4 q-10 -3 -6 -12 q5 -10 -2 -16 Z" fill="${'url(#tx)'}"/>`
              s += `<circle cx="108" cy="126" r="3.4" fill="#1c1917"/><path d="M92 132 q-14 -4 -24 2" stroke="${c2}" stroke-width="4" fill="none"/>`
              s += `<path d="M128 176 q-14 20 -10 42 M128 176 q-6 30 -2 46" stroke="${c1}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M150 170 q4 26 2 52" stroke="${c2}" stroke-width="6" fill="none" stroke-linecap="round"/>`
              return s
            }
          }
        }
        default: return ''
      }
    }
    default: return `<circle cx="150" cy="150" r="60" fill="${g1}" stroke="${c1}" stroke-width="3"/>`
  }
}

const CURATED_TEX = {
  virus: 'dots', helixRod: 'smooth', rod: 'smooth', rodFlagella: 'smooth', coccus: 'smooth', chain: 'smooth',
  amoeba: 'bumpy', ciliate: 'wet', euglena: 'smooth', kelp: 'vein', mushroom: 'smooth', budding: 'smooth',
  moldBrush: 'dots', stalk: 'smooth', truffle: 'bumpy', tree: 'vein', conifer: 'vein', flower: 'vein',
  tulip: 'smooth', flytrap: 'wet', bamboo: 'stripes', cactus: 'bumpy', bigcat: 'stripes', elephant: 'stone',
  whale: 'wet', shark: 'scales', butterfly: 'dots', bee: 'stripes', octopus: 'bumpy', bird: 'feather',
  penguin: 'smooth', frog: 'wet', turtle: 'scales', kangaroo: 'fur', human: 'smooth', phage: 'smooth',
}

function specimenSvg(species, tex) {
  const [c1, c2] = species.model.colors
  const rnd = mulberry(hash(species.slug))
  const bgTop = lighten(c1, 168)
  const bgBot = lighten(mix(c1, c2, 0.4), 176)
  const texId = 'tx'
  const texC = lighten(c1, 60)
  const texDef = TEX_DEFS[tex] ? TEX_DEFS[tex](texC, texId) : ''
  const defs = `<defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(c1, 40)}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(c2, 30)}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(c1, 60)}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="scene" cx="0.5" cy="0.36" r="0.95"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    ${texDef}
  </defs>`
  const sparkle = rnd() > 0.55
  const groundY = 306 + Math.round(rnd() * 14)
  const body = paint(species.model.shape, { c1, c2, r: rnd })
  const emojiY = 52 + Math.round(rnd() * 18)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(species.name)} illustration">
${defs}
<rect width="${W}" height="${H}" fill="url(#scene)"/>
<circle cx="${140 + rnd() * 320}" cy="${90 + rnd() * 120}" r="150" fill="url(#glow)"/>
<ellipse cx="300" cy="${groundY}" rx="${210 + rnd() * 60}" ry="26" fill="#000000" opacity="0.10"/>
<ellipse cx="300" cy="${groundY}" rx="${120 + rnd() * 40}" ry="14" fill="#000000" opacity="0.14"/>
${sparkle ? `<g fill="#ffffff" opacity="0.5">${[0, 1, 2].map(() => { const x = 40 + rnd() * 520, y = 40 + rnd() * 120, s = 1.5 + rnd() * 3; return `<circle cx="${x}" cy="${y}" r="${s}"/>` }).join('')}</g>` : ''}
<text x="30" y="${emojiY}" font-size="44">${species.emoji}</text>
<g transform="translate(300 236) translate(-150 -150) scale(1)"><g transform="translate(0 ${-16 + Math.round(rnd() * 14)})">${body}</g></g>
<g>
  <rect x="0" y="${H - 74}" width="${W}" height="74" fill="#0f172a" opacity="0.78"/>
  <text x="30" y="${H - 38}" font-family="ui-rounded, 'Segoe UI', system-ui, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${esc(species.name)}</text>
  <text x="30" y="${H - 14}" font-family="ui-serif, Georgia, serif" font-size="15" font-style="italic" fill="#cbd5e1">${esc(species.sci)}</text>
</g>
</svg>`
}

/* ═══════════════════════ emit ═══════════════════════ */

const items = selectRows()
const species = buildSpecies(items)

const dataPath = path.join(ROOT, 'src/data/species-extra.js')
const imgDir = path.join(ROOT, 'public/images/species')
fs.mkdirSync(imgDir, { recursive: true })

const header = `// AUTO-GENERATED by scripts/gen-species.mjs — do not edit by hand.
// Regenerate with: npm run gen
// ${species.length} species generated from scripts/seeds/ (${CURATED.length} curated + ${species.length} generated = ${CURATED.length + species.length}).
export const EXTRA_SPECIES = [
`
const body = species.map((s) => `  ${JSON.stringify(s)},`).join('\n')
fs.writeFileSync(dataPath, header + body + '\n]\n')

let written = 0
for (const s of species) {
  fs.writeFileSync(path.join(imgDir, `${s.slug}.svg`), specimenSvg(s, s.tex || 'smooth'))
  written++
}
for (const s of CURATED) {
  fs.writeFileSync(path.join(imgDir, `${s.slug}.svg`), specimenSvg(s, CURATED_TEX[s.model.shape] || 'smooth'))
  written++
}

const byKingdom = {}
for (const s of species) byKingdom[s.kingdom] = (byKingdom[s.kingdom] || 0) + 1
console.log(`[gen] wrote ${species.length} species → src/data/species-extra.js`)
console.log(`[gen] wrote ${written} SVG illustrations (incl. curated) → public/images/species/`)
console.log(`[gen] total species: ${CURATED.length + species.length} (${CURATED.length} curated + ${species.length} generated)`)
console.log(`[gen] by kingdom:`, byKingdom)
