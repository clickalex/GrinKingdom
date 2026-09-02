// GrinKingdom — the one family tree of every species in the catalog.
// Built at runtime from each species' taxonomy: Life → kingdom → phylum →
// class → order → family → genus → species. Missing ranks are skipped, so
// viruses (which lack a Class) still nest cleanly.

import { SPECIES } from './species.js'
import { KINGDOM_MAP } from './kingdoms.js'

const RANKS = ['Phylum', 'Class', 'Order', 'Family', 'Genus']

/* Node shape:
   { key, rank, name, count, kingdomId, children[], leaf?, slug?, emoji?, sci?, pathKeys[] } */

function finalize(node) {
  node.children = [...node.children.values()]
  // big branches first, then alphabetically; species leaves last, A → Z
  node.children.sort((a, b) => {
    if (!!a.leaf !== !!b.leaf) return a.leaf ? 1 : -1
    if (a.leaf) return a.name.localeCompare(b.name)
    return b.count - a.count || a.name.localeCompare(b.name)
  })
  node.children.forEach(finalize)
  return node
}

function buildTree(speciesList = SPECIES) {
  const root = {
    key: 'life',
    rank: 'Life',
    name: 'Life on Earth',
    count: speciesList.length,
    kingdomId: null,
    children: new Map(),
  }

  for (const s of speciesList) {
    // kingdom level — the site's 8 playful kingdoms, not the textbook word
    const kingdomMeta = KINGDOM_MAP[s.kingdom] || {}
    const kingdomTaxonName = s.taxonomy?.Kingdom || kingdomMeta.name
    if (!root.children.has(s.kingdom)) {
      root.children.set(s.kingdom, {
        key: `life/${s.kingdom}`,
        rank: 'Kingdom',
        name: kingdomMeta.name || s.kingdom,
        kingdomId: s.kingdom,
        emoji: kingdomMeta.emoji,
        color: kingdomMeta.color,
        taxonName: kingdomTaxonName,
        count: 0,
        children: new Map(),
        pathKeys: ['life', `life/${s.kingdom}`],
      })
    }
    let node = root.children.get(s.kingdom)

    // taxonomy ranks below kingdom
    const steps = []
    for (const rank of RANKS) {
      const value = s.taxonomy?.[rank]
      if (value) steps.push([rank, String(value)])
    }
    for (const [rank, value] of steps) {
      const key = `${node.key}/${rank}:${value}`
      if (!node.children.has(key)) {
        node.children.set(key, {
          key,
          rank,
          name: value,
          kingdomId: s.kingdom,
          count: 0,
          children: new Map(),
          pathKeys: [...node.pathKeys, key],
        })
      }
      node = node.children.get(key)
    }

    // the species itself
    const leafKey = `${node.key}/species:${s.slug}`
    node.children.set(leafKey, {
      key: leafKey,
      rank: 'Species',
      name: s.name,
      sci: s.sci,
      slug: s.slug,
      emoji: s.emoji,
      kingdomId: s.kingdom,
      count: 1,
      leaf: true,
      children: [],
      pathKeys: [...node.pathKeys, leafKey],
    })
  }

  finalize(root)

  // slug → leaf node (for deep-linking a species' branch)
  const bySlug = new Map()
  const walk = (n) => {
    if (n.leaf) bySlug.set(n.slug, n)
    else n.children.forEach(walk)
  }
  walk(root)

  return { root, bySlug }
}

const { root, bySlug } = buildTree()
export const TREE_ROOT = root
export const TREE_BY_SLUG = bySlug

/* Build a pruned tree containing only lineages that lead to a match. */
export function buildFilteredTree(predicate) {
  const list = SPECIES.filter(predicate)
  if (list.length === 0) return null
  return buildTree(list).root
}
