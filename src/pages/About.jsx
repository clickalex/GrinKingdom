import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-hero">
          <h1>🌍 About GrinKingdom</h1>
          <p>Why we built the happiest encyclopedia of life on Earth.</p>
        </div>
        <div className="prose">
          <div className="card">
            <h2>The mission</h2>
            <p>
              GrinKingdom (a.k.a. the Species Kingdom) exists to make the dazzling diversity of life
              on Earth fun to explore — whether you're 9 or 90. Every kingdom, from viruses to
              humans, gets its own colorful home here.
            </p>
          </div>
          <div className="card">
            <h2>How it's built</h2>
            <p>
              A modern, static-first web app (React + Vite) with a hand-curated species database,
              an interactive Three.js 3D viewer, and a live search across the global GBIF species
              database so the catalog never truly runs out.
            </p>
          </div>
          <div className="card">
            <h2>Data & credits</h2>
            <p>
              Species facts are drawn from well-known references and simplified for learning. Live
              species search is powered by the free{' '}
              <a href="https://www.gbif.org/" style={{ color: 'var(--brand)' }}>
                GBIF API
              </a>
              . Illustrations are original, generated for this project.
            </p>
          </div>
          <div className="card">
            <h2>Get involved</h2>
            <p>
              This is an open project under active development.{' '}
              <Link to="/explore" style={{ color: 'var(--brand)' }}>
                Explore the catalog
              </Link>{' '}
              or check the repository roadmap to see what's coming next.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
