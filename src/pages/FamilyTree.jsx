// GrinKingdom — the Family Tree page.
// One interactive tree of every species in the catalog: Life → kingdoms →
// phyla → classes → orders → families → genera → species.
//
// Reading it:
//  · the strip on top shows all 8 kingdoms at a glance — each segment's width
//    matches how many species it holds. Click one to zoom into just that branch.
//  · every branch row carries a little bar: how big it is compared to its parent.
//  · click a branch to open/close it; double-click folds everything below it.
//  · hover any branch to see its full lineage; search jumps to matching branches.
//  · deep-link a species' whole lineage via ?species=<slug>

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SPECIES } from '../data/species.js'
import { KINGDOM_MAP } from '../data/kingdoms.js'
import { TREE_ROOT, TREE_BY_SLUG, buildFilteredTree } from '../data/tree.js'

const domId = (key) => 'tn-' + encodeURIComponent(key)

const RANK_BADGE = {
  Life: '🌍',
  Kingdom: '👑',
  Phylum: '🌿',
  Class: '🧩',
  Order: '📋',
  Family: '👪',
  Genus: '🧬',
  Species: '🔬',
}

const RANK_ORDER = { Life: 0, Kingdom: 1, Phylum: 2, Class: 3, Order: 4, Family: 5, Genus: 6, Species: 7 }

const KINGDOM_NODES = TREE_ROOT.children // biggest → smallest
const TOTAL = TREE_ROOT.count

function countRank(node, rank) {
  let n = 0
  const walk = (x) => {
    if (x.rank === rank) n += 1
    x.children.forEach(walk)
  }
  node.children.forEach(walk)
  return n
}

/* Every branch key at or above `upToRank` within the given start nodes. */
function expandKeysBelow(startNodes, upToRank) {
  const next = new Set()
  const walk = (n) => {
    if (n.leaf) return
    if ((RANK_ORDER[n.rank] ?? 9) <= (RANK_ORDER[upToRank] ?? 9)) next.add(n.key)
    n.children.forEach(walk)
  }
  startNodes.forEach(walk)
  return next
}

const pctOf = (count, of) => ((count / of) * 100).toFixed(of > 0 && count / of < 0.1 ? 1 : 0)

/* ── one row of the tree ─────────────────────────────────── */
function TreeNode({ node, expanded, onToggle, onCollapseTo, forceOpen, highlight, parentCount }) {
  const open = forceOpen || expanded.has(node.key)
  const isKingdom = node.rank === 'Kingdom'
  const k = isKingdom ? KINGDOM_MAP[node.kingdomId] : null
  const kc = node.color || k?.color || '#7c3aed'

  const toggle = () => {
    if (node.children.length > 0) onToggle(node.key)
  }

  const barPct = !node.leaf && parentCount ? Math.max(2, Math.round((node.count / parentCount) * 100)) : 0
  const lineage = node.pathNames.join(' › ')

  return (
    <li
      id={domId(node.key)}
      className={`tree-node rank-${node.rank.toLowerCase()} ${node.leaf ? 'leaf' : 'branch'} ${
        highlight === node.key ? 'hl' : ''
      } ${isKingdom ? 'kingdom-row' : ''}`}
      style={isKingdom ? { '--kc': kc } : undefined}
    >
      {node.leaf ? (
        <Link to={`/species/${node.slug}`} className="tree-row tree-leaf-row" title={`${lineage} · ${node.sci}`}>
          <span className="tree-dot">🔬</span>
          <span className="tree-leaf-emoji">{node.emoji}</span>
          <span className="tree-name sci">{node.name}</span>
          <span className="tree-leaf-sci">{node.sci}</span>
        </Link>
      ) : (
        <div
          className="tree-row"
          onClick={toggle}
          onDoubleClick={() => onCollapseTo(node)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
          title={`${lineage} — click to open/close · double-click to fold everything below`}
        >
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
          <span className="tree-bar" aria-hidden="true">
            <span className="tree-bar-fill" style={{ width: `${barPct}%`, background: kc }} />
          </span>
          <span
            className="tree-count"
            title={`${node.count} species in this branch — ${pctOf(node.count, TOTAL)}% of the whole tree`}
          >
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
              onCollapseTo={onCollapseTo}
              forceOpen={forceOpen}
              highlight={highlight}
              parentCount={node.count}
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
  const [focusKingdom, setFocusKingdom] = useState(null)
  const panelRef = useRef(null)

  const stats = useMemo(
    () => ({
      species: TOTAL,
      phyla: countRank(TREE_ROOT, 'Phylum'),
      orders: countRank(TREE_ROOT, 'Order'),
      families: countRank(TREE_ROOT, 'Family'),
      genera: countRank(TREE_ROOT, 'Genus'),
    }),
    []
  )

  const focusedNode = focusKingdom ? KINGDOM_NODES.find((n) => n.kingdomId === focusKingdom) : null

  const toggle = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  /* Double-click: keep this node visible but closed, fold its whole subtree. */
  const collapseTo = (node) => {
    setExpanded(new Set(node.pathKeys.slice(0, -1)))
    setHighlight(null)
  }

  const focusOn = (id) => {
    const node = KINGDOM_NODES.find((n) => n.kingdomId === id)
    if (!node) return
    setFocusKingdom(id)
    setExpanded(expandKeysBelow([node], 'Family'))
    setHighlight(null)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  const clearFocus = () => {
    setFocusKingdom(null)
    setExpanded(new Set())
    setHighlight(null)
  }

  /* Deep-link: expand the focused species' whole lineage + scroll to it. */
  useEffect(() => {
    if (!focusLeaf) return
    setFocusKingdom(null)
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
    setExpanded(expandKeysBelow(focusedNode ? [focusedNode] : KINGDOM_NODES, rank))
    setHighlight(null)
  }

  const viewNodes = focusedNode ? [focusedNode] : KINGDOM_NODES

  return (
    <section className="page">
      <div className="container">
        <div className="page-hero">
          <h1 className="section-title">🌳 The Family Tree</h1>
          <p className="section-sub">
            One tree for every living thing in the kingdom — all{' '}
            <strong>{stats.species.toLocaleString()} species</strong>, from the tiniest virus to the blue whale (and
            you). Every branch is a real taxonomic group: kingdom → phylum → class → order → family → genus → species.
            Zoom into one kingdom with the strip below, or search to jump anywhere.
          </p>
          <div className="tree-stats">
            <span className="tree-stat">
              <strong>{stats.species.toLocaleString()}</strong> species
            </span>
            <span className="tree-stat">
              <strong>{stats.phyla.toLocaleString()}</strong> phyla
            </span>
            <span className="tree-stat">
              <strong>{stats.orders.toLocaleString()}</strong> orders
            </span>
            <span className="tree-stat">
              <strong>{stats.families.toLocaleString()}</strong> families
            </span>
            <span className="tree-stat">
              <strong>{stats.genera.toLocaleString()}</strong> genera
            </span>
            <span className="tree-stat">
              <strong>8</strong> kingdoms
            </span>
          </div>
        </div>

        <p className="strip-caption">🌍 The 8 kingdoms at a glance — segment width ∝ species. Click one to zoom in.</p>
        <div className="tree-strip" role="group" aria-label="Kingdoms at a glance">
          {KINGDOM_NODES.map((node) => {
            const k = KINGDOM_MAP[node.kingdomId]
            const on = focusKingdom === node.kingdomId
            return (
              <button
                key={node.key}
                type="button"
                className={`strip-seg ${on ? 'on' : ''}`}
                style={{ flex: `${node.count} 1 0`, minWidth: 112, '--kc': node.color }}
                onClick={() => (on ? clearFocus() : focusOn(node.kingdomId))}
                title={`${node.name} — ${node.count.toLocaleString()} species (${pctOf(node.count, TOTAL)}% of the tree). Click to zoom in.`}
                aria-pressed={on}
              >
                <span className="strip-emoji" aria-hidden="true">
                  {k?.emoji}
                </span>
                <span className="strip-name">{node.name}</span>
                <span className="strip-meta">
                  {node.count.toLocaleString()} · {pctOf(node.count, TOTAL)}%
                </span>
              </button>
            )
          })}
        </div>

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

        <p className="tree-rank-legend" aria-label="Taxonomic ranks, from biggest to smallest">
          <span>👑 Kingdom</span>
          <span className="sep">→</span>
          <span>🌿 Phylum</span>
          <span className="sep">→</span>
          <span>🧩 Class</span>
          <span className="sep">→</span>
          <span>📋 Order</span>
          <span className="sep">→</span>
          <span>👪 Family</span>
          <span className="sep">→</span>
          <span>🧬 Genus</span>
          <span className="sep">→</span>
          <span>🔬 Species</span>
        </p>
        <p className="tree-hint">
          💡 Click a branch to open or close it · double-click a branch to fold everything below it · hover any branch
          to see its full lineage · the little bar shows how big a branch is compared to its parent.
        </p>

        {focusLeaf && (
          <div className="tree-focus-banner">
            <div className="tree-focus-body">
              <span>
                📍 Showing the branch of <strong>{focusLeaf.emoji} {focusLeaf.name}</strong> — its lineage below, the
                highlighted leaf at the end.
              </span>
              <div className="tree-lineage">
                {focusLeaf.pathNames.map((name, i) => (
                  <span
                    key={i}
                    className={`crumb-chip ${i === focusLeaf.pathNames.length - 1 ? 'on' : ''}`}
                    title={name}
                  >
                    {RANK_BADGE[focusLeaf.pathRanks[i]] || '•'} {name}
                  </span>
                ))}
              </div>
            </div>
            <button className="fchip" onClick={() => setParams({})}>
              ✕ Clear
            </button>
          </div>
        )}

        {focusedNode && !searching && (
          <div className="tree-focus-banner kingdom" style={{ '--kc': focusedNode.color }}>
            <span>
              {KINGDOM_MAP[focusedNode.kingdomId]?.emoji} Zoomed into <strong>{focusedNode.name}</strong> —{' '}
              {focusedNode.count.toLocaleString()} species ({pctOf(focusedNode.count, TOTAL)}% of the whole tree).
            </span>
            <button className="fchip" onClick={clearFocus}>
              ✕ Show all kingdoms
            </button>
          </div>
        )}

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

        <div className="tree-panel" ref={panelRef}>
          <ul className="tree-root">
            {searching && filteredRoot ? (
              filteredRoot.children.map((child) => (
                <TreeNode
                  key={child.key}
                  node={child}
                  expanded={expanded}
                  onToggle={toggle}
                  onCollapseTo={collapseTo}
                  forceOpen
                  highlight={highlight}
                  parentCount={TOTAL}
                />
              ))
            ) : (
              viewNodes.map((child) => (
                <TreeNode
                  key={child.key}
                  node={child}
                  expanded={expanded}
                  onToggle={toggle}
                  onCollapseTo={collapseTo}
                  highlight={highlight}
                  parentCount={TOTAL}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
