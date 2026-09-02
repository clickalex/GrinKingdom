// GrinKingdom — the Family Tree page.
// One interactive tree of every species in the catalog: Life → kingdoms →
// phyla → classes → orders → families → genera → species. Search it, expand
// branches, or deep-link a species' whole lineage via ?species=<slug>.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SPECIES } from '../data/species.js'
import { KINGDOMS, KINGDOM_MAP } from '../data/kingdoms.js'
import { TREE_ROOT, TREE_BY_SLUG, buildFilteredTree } from '../data/tree.js'

const domId = (key) => 'tn-' + encodeURIComponent(key)

const RANK_BADGE = {
  Kingdom: '👑',
  Phylum: '🌿',
  Class: '🎒',
  Order: '📋',
  Family: '👪',
  Genus: '🧬',
  Species: '',
}

function countRank(node, rank) {
  let n = 0
  const walk = (x) => {
    if (x.rank === rank) n += 1
    x.children.forEach(walk)
  }
  node.children.forEach(walk)
  return n
}

/* ── one row of the tree ─────────────────────────────────── */
function TreeNode({ node, expanded, onToggle, forceOpen, highlight }) {
  const open = forceOpen || expanded.has(node.key)
  const isKingdom = node.rank === 'Kingdom'
  const k = isKingdom ? KINGDOM_MAP[node.kingdomId] : null

  const toggle = () => {
    if (node.children.length > 0) onToggle(node.key)
  }

  return (
    <li
      id={domId(node.key)}
      className={`tree-node rank-${node.rank.toLowerCase()} ${node.leaf ? 'leaf' : 'branch'} ${
        highlight === node.key ? 'hl' : ''
      } ${isKingdom ? 'kingdom-row' : ''}`}
      style={isKingdom ? { '--kc': k?.color || '#7C3AED' } : undefined}
    >
      {node.leaf ? (
        <Link to={`/species/${node.slug}`} className="tree-row tree-leaf-row" title={node.sci}>
          <span className="tree-dot">🌿</span>
          <span className="tree-leaf-emoji">{node.emoji}</span>
          <span className="tree-name sci">{node.name}</span>
          <span className="tree-leaf-sci">{node.sci}</span>
        </Link>
      ) : (
        <div className="tree-row" onClick={toggle} role={node.children.length ? 'button' : undefined}
          tabIndex={node.children.length ? 0 : undefined}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}>
          <span className={`tree-chev ${open ? 'open' : ''}`} aria-hidden="true">
            {node.children.length > 0 ? '▾' : '•'}
          </span>
          <span className="tree-badge" aria-hidden="true">
            {RANK_BADGE[node.rank] || '•'}
          </span>
          <span className={`tree-name ${node.rank === 'Genus' ? 'sci' : ''}`}>{node.name}</span>
          {isKingdom && node.taxonName && node.taxonName !== node.name && (
            <span className="tree-taxon">· {node.taxonName}</span>
          )}
          <span className="tree-count" title={`${node.count} species in this branch`}>
            {node.count.toLocaleString()} sp.
          </span>
          {isKingdom && (
            <Link
              to={`/kingdom/${node.kingdomId}`}
              className="tree-open-link"
              onClick={(e) => e.stopPropagation()}
              title={`Open the ${node.name} kingdom page`}
            >
              ↗
            </Link>
          )}
        </div>
      )}

      {open && node.children.length > 0 && (
        <ul className="tree-branch">
          {node.children.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              forceOpen={forceOpen}
              highlight={highlight}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/* ── the page ────────────────────────────────────────────── */
export default function FamilyTree() {
  const [params, setParams] = useSearchParams()
  const focusSlug = params.get('species')
  const focusLeaf = focusSlug ? TREE_BY_SLUG.get(focusSlug) : null

  const [expanded, setExpanded] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(focusLeaf?.key || null)
  const scrollRef = useRef(null)

  const stats = useMemo(
    () => ({
      species: SPECIES.length,
      genera: countRank(TREE_ROOT, 'Genus'),
      families: countRank(TREE_ROOT, 'Family'),
      orders: countRank(TREE_ROOT, 'Order'),
    }),
    []
  )

  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  /* Deep-link: expand the focused species' whole lineage + scroll to it. */
  useEffect(() => {
    if (!focusLeaf) return
    setExpanded(new Set(focusLeaf.pathKeys))
    setHighlight(focusLeaf.key)
    const t = setTimeout(() => {
      const el = document.getElementById(domId(focusLeaf.key))
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSlug])

  const q = query.trim().toLowerCase()
  const searching = q.length >= 2

  const filteredRoot = useMemo(() => {
    if (!searching) return null
    return buildFilteredTree((s) =>
      s.name.toLowerCase().includes(q) || s.sci.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)
    )
  }, [q, searching])

  const matchCount = useMemo(
    () =>
      searching
        ? SPECIES.filter(
            (s) => s.name.toLowerCase().includes(q) || s.sci.toLowerCase().includes(q) || s.group.toLowerCase().includes(q)
          ).length
        : 0,
    [q, searching]
  )

  const expandTo = (rank) => {
    const next = new Set()
    const walk = (n) => {
      if (n.leaf) return
      const order = { Kingdom: 1, Phylum: 2, Class: 3, Order: 4, Family: 5, Genus: 6 }
      if (n.rank === 'Life' || (order[n.rank] || 9) <= (order[rank] || 9)) next.add(n.key)
      n.children.forEach(walk)
    }
    TREE_ROOT.children.forEach(walk)
    setExpanded(next)
    setHighlight(null)
  }

  return (
    <section className="page">
      <div className="container">
        <div className="page-hero">
          <h1 className="section-title">🌳 The Family Tree</h1>
          <p className="section-sub">
            One tree for every living thing in the kingdom — all{' '}
            <strong>{stats.species.toLocaleString()} species</strong>, from the tiniest virus to the blue whale (and
            you). Every branch is a real taxonomic group: kingdom → phylum → class → order → family → genus → species.
          </p>
          <div className="tree-stats">
            <span className="tree-stat">
              <strong>{stats.species.toLocaleString()}</strong> species
            </span>
            <span className="tree-stat">
              <strong>{stats.genera.toLocaleString()}</strong> genera
            </span>
            <span className="tree-stat">
              <strong>{stats.families.toLocaleString()}</strong> families
            </span>
            <span className="tree-stat">
              <strong>{stats.orders.toLocaleString()}</strong> orders
            </span>
            <span className="tree-stat">
              <strong>8</strong> kingdoms
            </span>
          </div>
        </div>

        {focusLeaf && (
          <div className="tree-focus-banner">
            <span>
              📍 Showing the branch of <strong>{focusLeaf.emoji} {focusLeaf.name}</strong> — follow the highlight down
              the tree.
            </span>
            <button className="fchip" onClick={() => setParams({})}>
              ✕ Clear
            </button>
          </div>
        )}

        <div className="tree-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder="Search the tree — tiger, Quercus, beetle…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the family tree"
          />
          <div className="explore-tools">
            <button className="fchip" onClick={() => expandTo('Family')} disabled={searching}>
              👪 Expand to families
            </button>
            <button className="fchip" onClick={() => expandTo('Genus')} disabled={searching}>
              🧬 Expand to genera
            </button>
            <button
              className="fchip"
              onClick={() => {
                setExpanded(new Set())
                setHighlight(null)
              }}
              disabled={searching}
            >
              ✕ Collapse all
            </button>
          </div>
        </div>

        {searching && (
          <p className="tree-search-note">
            {filteredRoot ? (
              <>
                🔎 <strong>{matchCount.toLocaleString()}</strong> matching species — showing their branches:
              </>
            ) : (
              <>🔎 No species match “{query}” — try another name.</>
            )}
          </p>
        )}

        <div className="tree-panel">
          <ul className="tree-root" ref={scrollRef}>
            {searching && filteredRoot ? (
              filteredRoot.children.map((child) => (
                <TreeNode
                  key={child.key}
                  node={child}
                  expanded={expanded}
                  onToggle={toggle}
                  forceOpen
                  highlight={highlight}
                />
              ))
            ) : (
              TREE_ROOT.children.map((child) => (
                <TreeNode key={child.key} node={child} expanded={expanded} onToggle={toggle} highlight={highlight} />
              ))
            )}
          </ul>
        </div>

        <div className="tree-legend">
          {KINGDOMS.map((k) => {
            const node = TREE_ROOT.children.find((c) => c.kingdomId === k.id)
            return (
              <button
                key={k.id}
                className="chip kingdom-chip"
                style={{ background: `${k.color}22`, color: k.color, cursor: 'pointer' }}
                title={node ? `Expand / collapse ${k.name} (${node.count} species)` : k.name}
                onClick={() => {
                  if (!node) return
                  toggle(node.key)
                  setTimeout(
                    () => document.getElementById(domId(node.key))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    60
                  )
                }}
              >
                {k.emoji} {k.name} · {node ? node.count.toLocaleString() : 0}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
