import { Link } from 'react-router-dom'
import { KINGDOM_MAP } from '../data/kingdoms.js'
import TiltCard from './TiltCard.jsx'

const STATUS_COLORS = {
  'Least Concern': '#22C55E',
  'Near Threatened': '#A3E635',
  Vulnerable: '#F59E0B',
  Endangered: '#F97316',
  'Critically Endangered': '#EF4444',
  Extinct: '#64748B',
}

export default function SpeciesCard({ species }) {
  const k = KINGDOM_MAP[species.kingdom]
  const statusColor = STATUS_COLORS[species.status]
  return (
    <Link to={`/species/${species.slug}`} className="species-link" style={{ '--kc': k?.color || '#7C3AED' }}>
      <TiltCard className="species-card" max={7}>
        <div className="species-card-top">
          <span className="species-emoji" style={{ background: `${k?.color || '#7C3AED'}1e` }}>
            {species.emoji}
          </span>
          <span className="chip kingdom-chip" style={{ background: `${k?.color}22`, color: k?.color }}>
            {k?.emoji} {k?.name}
          </span>
        </div>
        <h3 className="species-name">{species.name}</h3>
        <p className="species-sci">{species.sci}</p>
        <p className="species-tagline">{species.tagline}</p>
        <div className="species-meta">
          <span className="chip">{species.group}</span>
          <span className="chip">{species.habitat}</span>
          {statusColor && (
            <span className="chip" style={{ color: statusColor }}>
              ● {species.status}
            </span>
          )}
        </div>
      </TiltCard>
    </Link>
  )
}
