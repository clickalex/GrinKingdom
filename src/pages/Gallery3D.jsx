import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SPECIES, speciesImage } from '../data/species.js'
import { KINGDOMS, KINGDOM_MAP } from '../data/kingdoms.js'
import SpecimenViewer from '../components/SpecimenViewer.jsx'

const POD_COUNT = 6

const pickRandom = (list, n) => {
  const pool = [...list]
  const out = []
  while (pool.length && out.length < n) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return out
}

export default function Gallery3D() {
  const [kingdom, setKingdom] = useState(null)
  const [seed, setSeed] = useState(0)

  const onDisplay = useMemo(() => {
    const pool = kingdom ? SPECIES.filter((s) => s.kingdom === kingdom) : SPECIES
    return pickRandom(pool, POD_COUNT)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kingdom, seed])

  return (
    <section className="page">
      <div className="container">
        <div className="page-hero">
          <h1 className="section-title">🧊 The 3D Gallery</h1>
          <p className="section-sub">
            A rotating exhibition of stylized 3D specimens — spin a virus, tilt a mushroom, twirl a tiger. Drag any pod to
            rotate it, or click through for the full story.
          </p>
        </div>

        <div className="gallery-controls">
          <div className="filter-chips">
            <button className={`fchip ${kingdom === null ? 'on' : ''}`} onClick={() => setKingdom(null)}>
              🌍 All kingdoms
            </button>
            {KINGDOMS.map((k) => (
              <button
                key={k.id}
                className={`fchip ${kingdom === k.id ? 'on' : ''}`}
                style={kingdom === k.id ? { background: k.color, borderColor: k.color } : undefined}
                onClick={() => setKingdom(kingdom === k.id ? null : k.id)}
              >
                {k.emoji} {k.name}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setSeed((n) => n + 1)}>
            🎲 Shuffle the exhibits
          </button>
        </div>

        <div className="gallery-grid">
          {onDisplay.map((s) => {
            const k = KINGDOM_MAP[s.kingdom]
            return (
              <div key={s.slug} className="gallery-pod" style={{ '--kc': k?.color }}>
                <div className="pod-stage" style={{ background: `linear-gradient(160deg, ${k?.color}24, ${k?.color}08)` }}>
                  <SpecimenViewer model={s.model} />
                </div>
                <div className="pod-caption">
                  <img className="pod-thumb" src={speciesImage(s.slug)} alt={`Illustration of ${s.name}`} loading="lazy" />
                  <div>
                    <strong>
                      {s.emoji} {s.name}
                    </strong>
                    <span className="pod-sci">{s.sci}</span>
                  </div>
                  <Link className="btn btn-ghost pod-btn" to={`/species/${s.slug}`}>
                    Open →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        <p className="gallery-note">
          Every specimen is procedurally built from a shared kit of 3D parts — that's how all {SPECIES.length} species (and
          any we add later) get their own rotatable model. Drag to spin · exhibits auto-rotate when idle.
        </p>
      </div>
    </section>
  )
}
