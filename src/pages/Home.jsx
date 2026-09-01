import { Link } from 'react-router-dom'
import { KINGDOMS } from '../data/kingdoms.js'
import TiltCard from '../components/TiltCard.jsx'
import Mascot from '../components/Mascot.jsx'

const FLOATERS = [
  { e: '🦠', c: 'f1' },
  { e: '🐘', c: 'f2' },
  { e: '🌻', c: 'f3' },
  { e: '🍄', c: 'f4' },
  { e: '🐙', c: 'f5' },
  { e: '🦅', c: 'f6' },
]

const STATS = [
  { num: '8.7M', label: 'estimated species on Earth' },
  { num: '2.2M', label: 'described & named so far' },
  { num: '8', label: 'kingdoms of life covered' },
  { num: '100%', label: 'free to explore' },
]

const STEPS = [
  {
    e: '🔍',
    title: 'Search & filter',
    text: 'Type any name — tiger, sequoia, E. coli — or filter by kingdom, habitat, diet and conservation status.',
  },
  {
    e: '🧊',
    title: 'Rotate in 3D',
    text: 'Every species page has an interactive 3D viewer. Drag to spin, tilt and zoom your favourite life form.',
  },
  {
    e: '🌐',
    title: 'Search the full tree of life',
    text: 'Beyond our curated encyclopedia, a live search reaches millions of described species in the global GBIF database.',
  },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">🌍 The Species Kingdom</span>
            <h1 className="hero-title">
              Every living thing,
              <br />
              <span className="grad">one happy place.</span>
            </h1>
            <p className="hero-sub">
              From tiny viruses and glowing bacteria to giant sequoias, blue whales and{' '}
              <em>you</em> — explore all 8 kingdoms of life with photos, fun facts and rotatable 3D.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/explore">
                🧭 Start exploring
              </Link>
              <Link className="btn btn-ghost btn-lg" to="/3d-gallery">
                🧊 Try the 3D gallery
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-orb">
              <Mascot size={190} />
            </div>
            {FLOATERS.map((f) => (
              <span key={f.c} className={`floaty ${f.c}`}>
                {f.e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* KINGDOMS */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">The 8 kingdoms of life</h2>
            <p className="section-sub">
              Pick a kingdom to see who lives there — each one has its own colorful corner of the site.
            </p>
          </div>
          <div className="kingdom-grid">
            {KINGDOMS.map((k) => (
              <Link key={k.id} to={`/kingdom/${k.id}`} style={{ '--kc': k.color }}>
                <TiltCard className="kingdom-card">
                  <span className="kingdom-emoji" style={{ background: `${k.color}22` }}>
                    {k.emoji}
                  </span>
                  <span className="kingdom-name">{k.name}</span>
                  <span className="kingdom-tagline">{k.tagline}</span>
                  <span className="kingdom-chips">
                    {k.members.slice(0, 3).map((m) => (
                      <span key={m} className="chip">
                        {m}
                      </span>
                    ))}
                    {k.members.length > 3 && <span className="chip">+{k.members.length - 3}</span>}
                  </span>
                </TiltCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">How it works</h2>
            <p className="section-sub">Three steps from "what's that?" to "wow, that's cool."</p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step">
                <span className="step-n">{i + 1}</span>
                <div className="step-emoji">{s.e}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container cta-inner">
          <h2>Ready to meet your million cousins?</h2>
          <Link className="btn btn-primary btn-lg" to="/explore">
            🚀 Dive in
          </Link>
        </div>
      </section>
    </>
  )
}
