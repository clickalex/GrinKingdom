import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SPECIES, SPECIES_MAP, speciesImage } from '../data/species.js'
import { KINGDOM_MAP } from '../data/kingdoms.js'
import SpecimenViewer from '../components/SpecimenViewer.jsx'
import SpeciesCard from '../components/SpeciesCard.jsx'
import NotFound from './NotFound.jsx'

export default function SpeciesDetail() {
  const { slug } = useParams()
  const s = SPECIES_MAP[slug]
  const [imgOk, setImgOk] = useState(true)
  if (!s) return <NotFound />

  const k = KINGDOM_MAP[s.kingdom]
  const idx = SPECIES.findIndex((x) => x.slug === s.slug)
  const prev = SPECIES[(idx + SPECIES.length - 1) % SPECIES.length]
  const next = SPECIES[(idx + 1) % SPECIES.length]
  const related = SPECIES.filter((x) => x.kingdom === s.kingdom && x.slug !== s.slug).slice(0, 6)
  const gbifQuery = encodeURIComponent(s.sci)
  const gbifUrl = `https://www.gbif.org/species/search?q=${gbifQuery}`

  const quickFacts = [
    { icon: '📏', label: 'Size', value: s.size },
    { icon: '🏠', label: 'Habitat', value: s.habitat },
    { icon: '🍽️', label: 'Diet', value: s.diet },
    { icon: '⏳', label: 'Lifespan', value: s.lifespan },
    { icon: '🛡️', label: 'Status', value: s.status },
    { icon: '🗂️', label: 'Group', value: s.group },
  ]

  return (
    <section className="page" style={{ '--kc': k?.color || '#7C3AED' }}>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/explore">Explore</Link>
          <span>›</span>
          <Link to={`/kingdom/${s.kingdom}`}>
            {k?.emoji} {k?.name}
          </Link>
          <span>›</span>
          <strong>{s.name}</strong>
        </nav>

        <div className="detail-grid">
          {/* 3D specimen */}
          <div className="detail-viewer" style={{ background: `linear-gradient(160deg, ${k?.color}1f, ${k?.color}08)` }}>
            <SpecimenViewer model={s.model} zoomable />
            <span className="viewer-hint">🖱️ Drag to rotate · scroll to zoom</span>
            <span className="viewer-badge">Stylized 3D specimen</span>
          </div>

          {/* headline + quick facts */}
          <div className="detail-info">
            <span className="chip kingdom-chip" style={{ background: `${k?.color}22`, color: k?.color }}>
              {k?.emoji} Kingdom: {k?.name}
            </span>
            <h1 className="detail-title">
              {s.emoji} {s.name}
            </h1>
            <p className="detail-sci">{s.sci}</p>
            <p className="detail-tagline">“{s.tagline}”</p>

            <div className="facts-grid">
              {quickFacts.map((f) => (
                <div key={f.label} className="fact">
                  <span className="fact-icon">{f.icon}</span>
                  <div>
                    <div className="fact-label">{f.label}</div>
                    <div className="fact-value">{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-cols">
          {/* photo */}
          <div className="panel">
            <h2 className="panel-title">📷 Species illustration</h2>
            <div className="detail-photo">
              {imgOk ? (
                <img
                  src={speciesImage(s.slug)}
                  alt={`Illustration of ${s.name}`}
                  onError={() => setImgOk(false)}
                />
              ) : (
                <span className="detail-photo-fallback" style={{ background: `${k?.color || '#7C3AED'}1e` }}>
                  {s.emoji}
                </span>
              )}
              <p className="detail-photo-caption">
                {s.emoji} {s.name} ({s.sci}) — a hand-styled specimen plate generated just for this species.
              </p>
            </div>
            <a className="gbif-inline" href={gbifUrl} target="_blank" rel="noreferrer">
              🌐 Find {s.name} in the global GBIF database ↗
            </a>
          </div>

          {/* taxonomy */}
          <div className="panel">
            <h2 className="panel-title">🔬 Scientific classification</h2>
            <ol className="taxo-list">
              {Object.entries(s.taxonomy).map(([rank, value], i) => (
                <li key={rank} style={{ '--i': i }}>
                  <span className="taxo-rank">{rank}</span>
                  <span className="taxo-value">{value}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* fun facts */}
          <div className="panel">
            <h2 className="panel-title">💡 Did you know?</h2>
            <ul className="funfacts">
              {s.facts.map((f, i) => (
                <li key={i}>
                  <span className="funfact-n">{i + 1}</span>
                  <p>{f}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* prev / next */}
          <div className="panel">
            <h2 className="panel-title">🧭 Keep exploring</h2>
            <div className="pager-species">
              <Link className="pager-species-item" to={`/species/${prev.slug}`}>
                <span className="pager-species-dir">← Previous</span>
                <span className="pager-species-name">
                  {prev.emoji} {prev.name}
                </span>
              </Link>
              <Link className="pager-species-item" to={`/species/${next.slug}`}>
                <span className="pager-species-dir">Next →</span>
                <span className="pager-species-name">
                  {next.emoji} {next.name}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* related */}
        {related.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: 48 }}>
              <h2 className="section-title" style={{ fontSize: 24 }}>
                More from the {k?.name.toLowerCase()} kingdom
              </h2>
            </div>
            <div className="species-grid">
              {related.map((r) => (
                <SpeciesCard key={r.slug} species={r} />
              ))}
            </div>
          </>
        )}

        <div className="kingdom-nav">
          <Link className="btn btn-ghost" to="/explore">
            ← Back to Explore
          </Link>
          <Link className="btn btn-primary" to="/3d-gallery">
            🧊 See the 3D gallery
          </Link>
        </div>
      </div>
    </section>
  )
}
