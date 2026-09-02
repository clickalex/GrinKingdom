// GrinKingdom — real-photo gallery for a species detail page.
// Shows licensed real photographs from GBIF / Wikipedia next to the
// hand-styled illustration plate.

import { useEffect, useState } from 'react'
import { useSpeciesPhotos } from '../lib/photos.js'

export function PhotoImg({ photo, className, alt, eager }) {
  const [src, setSrc] = useState(photo.small || photo.url)
  useEffect(() => setSrc(photo.small || photo.url), [photo.id, photo.small, photo.url])
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => {
        if (src !== photo.url) setSrc(photo.url) // small variant 404 → original
      }}
    />
  )
}

export default function RealPhotoGallery({ species }) {
  const { photos, loading, error } = useSpeciesPhotos(species, true)
  const [active, setActive] = useState(0)

  useEffect(() => setActive(0), [species.slug])

  if (loading) {
    return (
      <div className="realphotos realphotos-loading" aria-busy="true">
        <div className="realphotos-shimmer" />
        <p className="realphotos-note">🔎 Searching GBIF &amp; Wikipedia for real photographs…</p>
      </div>
    )
  }

  if (error || photos.length === 0) {
    return (
      <div className="realphotos realphotos-empty">
        <span className="realphotos-empty-emoji">📷</span>
        <p className="realphotos-note">
          {error
            ? "Couldn't reach the photo services right now — enjoy the illustration!"
            : 'No licensed real photographs found for this species yet — enjoy the illustration!'}
        </p>
      </div>
    )
  }

  const photo = photos[Math.min(active, photos.length - 1)]

  return (
    <div className="realphotos">
      <a
        className="realphotos-main"
        href={photo.sourceUrl}
        target="_blank"
        rel="noreferrer"
        title={`Open ${photo.source} source page`}
      >
        <PhotoImg photo={photo} alt={`Real photograph of ${species.name} (${species.sci})`} eager />
        <span className="realphotos-count">
          📷 {active + 1} / {photos.length}
        </span>
      </a>

      {photos.length > 1 && (
        <div className="realphotos-thumbs" role="listbox" aria-label="More real photos">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`realphotos-thumb ${i === active ? 'on' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1} of ${species.name}`}
            >
              <PhotoImg photo={p} alt="" />
            </button>
          ))}
        </div>
      )}

      <p className="realphotos-credit">
        📷 Real photograph · © {photo.credit} ·{' '}
        {photo.licenseUrl ? (
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
            {photo.license}
          </a>
        ) : (
          photo.license
        )}{' '}
        ·{' '}
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
          via {photo.source} ↗
        </a>
      </p>
    </div>
  )
}
