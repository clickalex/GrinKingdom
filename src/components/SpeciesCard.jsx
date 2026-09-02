import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { KINGDOM_MAP } from '../data/kingdoms.js'
import { speciesImage } from '../data/species.js'
import { useInView, useRealPhotosPref, useSpeciesPhotos } from '../lib/photos.js'
import TiltCard from './TiltCard.jsx'

const STATUS_COLORS = {
  'Least Concern': '#22C55E',
  'Near Threatened': '#A3E635',
  Vulnerable: '#F59E0B',
  Endangered: '#F97316',
  'Critically Endangered': '#EF4444',
  'Extinct in the Wild': '#94A3B8',
  'Data Deficient': '#94A3B8',
  Extinct: '#64748B',
}

/* Card photo: real photograph when available (and the visitor has real photos
   enabled), otherwise the generated specimen illustration. */
function CardPhoto({ species }) {
  const k = KINGDOM_MAP[species.kingdom]
  const [imgOk, setImgOk] = useState(true)
  const [photoOk, setPhotoOk] = useState(true)
  const [photoSrc, setPhotoSrc] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref)
  const pref = useRealPhotosPref()
  const { photos } = useSpeciesPhotos(species, pref && inView)
  const photo = pref && photos?.[0]

  useEffect(() => {
    setImgOk(true)
    setPhotoOk(true)
  }, [species.slug])

  useEffect(() => {
    if (photo) setPhotoSrc(photo.small || photo.url)
  }, [photo?.id, photo])

  return (
    <div className="species-photo" ref={ref}>
      {photo && photoOk && photoSrc ? (
        <img
          className="species-photo-real"
          src={photoSrc}
          alt={`Real photograph of ${species.name}`}
          loading="lazy"
          onError={() => {
            if (photoSrc !== photo.url) setPhotoSrc(photo.url)
            else setPhotoOk(false)
          }}
        />
      ) : imgOk ? (
        <img
          src={speciesImage(species.slug)}
          alt={`Illustration of ${species.name}`}
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="species-photo-fallback" style={{ background: `${k?.color || '#7C3AED'}1e` }}>
          {species.emoji}
        </span>
      )}
      <span className="species-photo-emoji">{species.emoji}</span>
      {photo && photoOk && <span className="species-photo-realbadge" title="Real photo via GBIF/Wikipedia">📷 real</span>}
      <span className="chip kingdom-chip species-photo-chip" style={{ background: `${k?.color}22`, color: k?.color }}>
        {k?.emoji} {k?.name}
      </span>
    </div>
  )
}

export default function SpeciesCard({ species }) {
  const k = KINGDOM_MAP[species.kingdom]
  const statusColor = STATUS_COLORS[species.status]
  return (
    <Link to={`/species/${species.slug}`} className="species-link" style={{ '--kc': k?.color || '#7C3AED' }}>
      <TiltCard className="species-card" max={7}>
        <CardPhoto species={species} />
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
