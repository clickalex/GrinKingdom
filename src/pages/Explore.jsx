import { useEffect, useMemo, useState } from 'react'
import { SPECIES, HABITATS, DIETS, STATUSES } from '../data/species.js'
import { KINGDOMS, KINGDOM_MAP } from '../data/kingdoms.js'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { setRealPhotos as setRealPhotosPref, useRealPhotosPref } from '../lib/photos.js'

function ChipRow({ label, options, value, onChange, colorFor }) {
  return (
    <div className="filter-row">
      <span className="filter-label">{label}</span>
      <div className="filter-chips">
        <button className={`fchip ${value === null ? 'on' : ''}`} onClick={() => onChange(null)}>
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`fchip ${value === opt.value ? 'on' : ''}`}
            style={value === opt.value && colorFor ? { background: colorFor(opt.value), borderColor: colorFor(opt.value) } : undefined}
            onClick={() => onChange(value === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* Live search against the global GBIF species database (millions of species). */
function GbifSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [state, setState] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    const query = q.trim()
    if (query.length < 3) {
      setResults(null)
      setState('idle')
      return
    }
    setState('loading')
    const t = setTimeout(() => {
      fetch(`https://api.gbif.org/v1/species/search?q=${encodeURIComponent(query)}&limit=8&status=ACCEPTED`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results || [])
          setState('done')
        })
        .catch(() => setState('error'))
    }, 400)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="gbif-box">
      <h3>🌐 Search the full tree of life</h3>
      <p className="gbif-sub">
        Not in our curated collection? Search all ~2 million described species via the global GBIF database.
      </p>
      <input
        className="search-input"
        type="search"
        placeholder="Try “axolotl”, “Quercus”, “Tardigrada”…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {state === 'loading' && <p className="gbif-note">Searching the tree of life…</p>}
      {state === 'error' && <p className="gbif-note">Couldn't reach GBIF right now — try again in a moment.</p>}
      {state === 'done' && results?.length === 0 && <p className="gbif-note">No matches — check the spelling?</p>}
      {state === 'done' && results?.length > 0 && (
        <ul className="gbif-results">
          {results.map((r) => (
            <li key={r.key}>
              <a href={`https://www.gbif.org/species/${r.key}`} target="_blank" rel="noreferrer">
                <strong>{r.canonicalName || r.scientificName}</strong>
                <span className="gbif-rank">
                  {r.rank?.toLowerCase()} {r.kingdom ? `· ${r.kingdom}` : ''}
                </span>
                <span className="gbif-open">Open on GBIF ↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Explore() {
  const [query, setQuery] = useState('')
  const [kingdom, setKingdom] = useState(null)
  const [habitat, setHabitat] = useState(null)
  const [diet, setDiet] = useState(null)
  const [status, setStatus] = useState(null)
  const [sort, setSort] = useState('featured')
  const [page, setPage] = useState(1)
  const PER_PAGE = 24
  const realPhotos = useRealPhotosPref()
  const setRealPhotos = (v) => setRealPhotosPref(v)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = SPECIES.filter((s) => {
      if (kingdom && s.kingdom !== kingdom) return false
      if (habitat && s.habitat !== habitat) return false
      if (diet && s.diet !== diet) return false
      if (status && s.status !== status) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.sci.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q)
      )
    })
    const sorted = [...list]
    if (sort === 'az') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'za') sorted.sort((a, b) => b.name.localeCompare(a.name))
    return sorted
  }, [query, kingdom, habitat, diet, status, sort])

  // reset page when filters/search change
  useEffect(() => setPage(1), [query, kingdom, habitat, diet, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const anyFilter = kingdom || habitat || diet || status || query
  const clearAll = () => {
    setQuery('')
    setKingdom(null)
    setHabitat(null)
    setDiet(null)
    setStatus(null)
  }

  return (
    <section className="page">
      <div className="container">
        <div className="page-hero">
          <h1 className="section-title">🧭 Explore the catalog</h1>
          <p className="section-sub">
            {SPECIES.length} species across all 8 kingdoms — search, filter, and click any card for the full story (3D
            specimen included).
          </p>
        </div>

        <div className="explore-controls">
          <input
            className="search-input"
            type="search"
            placeholder="Search by name — tiger, sequoia, E. coli…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search species"
          />
          <ChipRow
            label="Kingdom"
            options={KINGDOMS.map((k) => ({ value: k.id, label: `${k.emoji} ${k.name}` }))}
            value={kingdom}
            onChange={setKingdom}
            colorFor={(id) => KINGDOM_MAP[id]?.color}
          />
          <ChipRow label="Habitat" options={HABITATS.map((h) => ({ value: h, label: h }))} value={habitat} onChange={setHabitat} />
          <ChipRow label="Diet" options={DIETS.map((d) => ({ value: d, label: d }))} value={diet} onChange={setDiet} />
          <ChipRow label="Status" options={STATUSES.map((s) => ({ value: s, label: s }))} value={status} onChange={setStatus} />
          <div className="filter-summary">
            <span>
              Showing <strong>{filtered.length}</strong> of {SPECIES.length} species
              {pages > 1 && (
                <>
                  {' '}· page <strong>{page}</strong> of {pages}
                </>
              )}
            </span>
            <div className="explore-tools">
              <button
                type="button"
                className={`fchip realphoto-toggle ${realPhotos ? 'on' : ''}`}
                onClick={() => setRealPhotos(!realPhotos)}
                title="Show real licensed photographs (via GBIF & Wikipedia) instead of illustrations"
              >
                📷 Real photos {realPhotos ? 'on' : 'off'}
              </button>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort species">
                <option value="featured">✨ Featured order</option>
                <option value="az">🔤 Name A → Z</option>
                <option value="za">🔤 Name Z → A</option>
              </select>
              {anyFilter && (
                <button className="fchip" onClick={clearAll}>
                  ✕ Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <>
            <div className="species-grid">
              {pageItems.map((s) => (
                <SpeciesCard key={s.slug} species={s} />
              ))}
            </div>
            {pages > 1 && (
              <nav className="pager" aria-label="Catalog pages">
                <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Previous
                </button>
                <div className="pager-pages">
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
                    .map((n, i, arr) => (
                      <span key={n} className="pager-item">
                        {i > 0 && arr[i - 1] !== n - 1 && <span className="pager-gap">…</span>}
                        <button className={`fchip pager-num ${n === page ? 'on' : ''}`} onClick={() => setPage(n)}>
                          {n}
                        </button>
                      </span>
                    ))}
                </div>
                <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span className="step-emoji">🔎</span>
            <h3>No species match those filters</h3>
            <p>Try clearing a filter — or search the full tree of life below.</p>
          </div>
        )}

        <GbifSearch />
      </div>
    </section>
  )
}
