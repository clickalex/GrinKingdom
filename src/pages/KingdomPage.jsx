import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { KINGDOMS, KINGDOM_MAP } from '../data/kingdoms.js'
import { speciesByKingdom } from '../data/species.js'
import SpeciesCard from '../components/SpeciesCard.jsx'
import { setRealPhotos as setRealPhotosPref, useRealPhotosPref } from '../lib/photos.js'
import NotFound from './NotFound.jsx'

const PER_PAGE = 36

export default function KingdomPage() {
  const { kingdomId } = useParams()
  const k = KINGDOM_MAP[kingdomId]
  const [page, setPage] = useState(1)
  const realPhotos = useRealPhotosPref()
  const setRealPhotos = (v) => setRealPhotosPref(v)
  useEffect(() => setPage(1), [kingdomId])
  if (!k) return <NotFound />

  const members = speciesByKingdom(k.id)
  const idx = KINGDOMS.findIndex((x) => x.id === k.id)
  const prev = KINGDOMS[(idx + KINGDOMS.length - 1) % KINGDOMS.length]
  const next = KINGDOMS[(idx + 1) % KINGDOMS.length]
  const pages = Math.max(1, Math.ceil(members.length / PER_PAGE))
  const pageItems = members.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <section className="page" style={{ '--kc': k.color }}>
      <div className="container">
        <div className="kingdom-hero" style={{ background: `linear-gradient(135deg, ${k.color}26, ${k.color}0d)` }}>
          <span className="kingdom-hero-emoji" style={{ background: `${k.color}2b` }}>
            {k.emoji}
          </span>
          <div>
            <p className="kingdom-hero-kicker" style={{ color: k.color }}>
              Kingdom {idx + 1} of {KINGDOMS.length}
            </p>
            <h1 className="section-title">{k.name}</h1>
            <p className="kingdom-hero-tagline">{k.tagline}</p>
            <p className="kingdom-hero-blurb">{k.blurb}</p>
          </div>
        </div>

        <div className="section-head" style={{ marginTop: 40 }}>
          <h2 className="section-title" style={{ fontSize: 26 }}>
            Meet the residents ({members.length})
          </h2>
          <p className="section-sub">
            Click any card for quick facts, taxonomy, a species photo and a rotatable 3D specimen.
          </p>
          <div className="explore-tools" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={`fchip realphoto-toggle ${realPhotos ? 'on' : ''}`}
              onClick={() => setRealPhotos(!realPhotos)}
              title="Show real licensed photographs (via GBIF & Wikipedia) instead of illustrations"
            >
              📷 Real photos {realPhotos ? 'on' : 'off'}
            </button>
          </div>
        </div>

        {members.length > 0 ? (
          <>
            <div className="species-grid">
              {pageItems.map((s) => (
                <SpeciesCard key={s.slug} species={s} />
              ))}
            </div>
            {pages > 1 && (
              <nav className="pager" aria-label="Kingdom pages">
                <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Previous
                </button>
                <span className="filter-summary" style={{ border: 0, padding: 0 }}>
                  Page <strong>{page}</strong> of {pages}
                </span>
                <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span className="step-emoji">{k.emoji}</span>
            <h3>Residents moving in soon</h3>
            <p>We're still curating species for this kingdom.</p>
          </div>
        )}

        <div className="kingdom-nav">
          <Link className="btn btn-ghost" to={`/kingdom/${prev.id}`}>
            ← {prev.emoji} {prev.name}
          </Link>
          <Link className="btn btn-ghost" to="/explore">
            🧭 All species
          </Link>
          <Link className="btn btn-ghost" to={`/kingdom/${next.id}`}>
            {next.emoji} {next.name} →
          </Link>
        </div>
      </div>
    </section>
  )
}
